const fs = require('fs');
/**
 * 创建loader对象
 * 可以把一个loader从一个绝对路径变成一个loader对象
 */
function createLoaderObject(loader) {
    let normal = require(loader);
    let pitch = normal.pitch;
    // let raw = normal.raw || false;// false：webpack会把文件内容转成字符串传给loader，true：会把源文件转成buffer传进来（file-loader, url-loader)
    return {
        path: loader,//存放着此loader的绝对路径
        normal,
        pitch,
        // raw,
        data: {},//每个loader都可以携带一个自定义data对象
        pitchExecuted: false,//此loader的pitch函数是否已经 执行过
        normalExecuted: false//此loader的normal函数是否已经执行过
    }
}

/**
 * 执行loader 的 normal函数
 * @param processOptions 传入loader-runner的参数
 * @param loaderContext  上下文
 * @param args 参数
 * @param pitchingCallback 回调
 * @returns {undefined|*}
 */
function iterateNormalLoaders(processOptions, loaderContext, args, pitchingCallback) {
    if (loaderContext.loaderIndex < 0) {
        return pitchingCallback(null, ...args);
    }
    // 1. 当前loader
    let currentLoader = loaderContext.loaders[loaderContext.loaderIndex];
    if (currentLoader.normalExecuted) {
        loaderContext.loaderIndex--;
        return iterateNormalLoaders(processOptions, loaderContext, args, pitchingCallback);
    }
    let fn = currentLoader.normal;
    currentLoader.normalExecuted = true;
    // 文件类型转换
    convertArgs(args, currentLoader.raw);
    // 执行函数同步还是异步
    runSyncOrAsync(fn, loaderContext, args, (err, ...returnArgs) => {
        if (err) return pitchingCallback(err);
        // 执行loader 的 normal函数
        return iterateNormalLoaders(processOptions, loaderContext, returnArgs, pitchingCallback);
    });
}

/**
 * 以同步或异步的方式，调用fn，也就是loader函数
 * @param fn
 * @param loaderContext 上下文
 * @param args 参数
 * @param runCallback  回调函数
 */
function runSyncOrAsync(fn, loaderContext, args, runCallback) {
    let isSync = true;//这个是个标志符，用来标志fn的执行是同步还是异步，默认是同步
    // 动态给上下文添加一个callback属性，调用callback，会自动执行下一个normal loader
    loaderContext.callback = (...args) => {
        runCallback(null, ...args);
    }
    loaderContext.async = () => {
        isSync = false; // 从同步改为异步
        return loaderContext.callback;
    }
    // this指向loaderContext
    let result = fn.apply(loaderContext, args);
    if (isSync) {//如果是同步的执行的话，会立刻向下执行下一个loader
        runCallback(null, result);
    } //如果是异步的话，那就什么都不要做
}


/**
 * 想要buffer还是字符串
 * @param args
 * @param raw
 */
function convertArgs(args, raw) {
    // 想要buffer，参数不是buffer
    if (raw && !Buffer.isBuffer(args[0])) {
        args[0] = Buffer.from(args[0]);
    } else if (!raw && Buffer.isBuffer(args[0])) {
        // 想要字符串
        args[0] = args[0].toString('utf8');
    }
}

/**
 * 读取源文件内容
 * @param processOptions
 * @param loaderContext
 * @param pitchingCallback
 */
function processResource(processOptions, loaderContext, pitchingCallback) {
    processOptions.readResource(loaderContext.resource, (err, resourceBuffer) => {
        processOptions.resourceBuffer = resourceBuffer; // 源文件的buffer对象
        loaderContext.loaderIndex--;//定位到最后一个loader，准备开始执行loader（从右往左）
        // 去执行loader的normal
        iterateNormalLoaders(processOptions, loaderContext, [resourceBuffer], pitchingCallback);
    });
}

/**
 * 执行pitch方法
 * @param processOptions
 * @param loaderContext
 * @param pitchingCallback
 * @returns {undefined|*}
 */
function iteratePitchingLoaders(processOptions, loaderContext, pitchingCallback) {
    //说所有的loader的pitch都已经执行完成
    if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
        // 读取文件内容
        return processResource(processOptions, loaderContext, pitchingCallback);
    }
    // 1. 当前正在执行的loader
    let currentLoader = loaderContext.loaders[loaderContext.loaderIndex];
    if (currentLoader.pitchExecuted) {
        loaderContext.loaderIndex++;//如果当前的pitch已经执行过了，就可以让当前的索引加1
        return iteratePitchingLoaders(processOptions, loaderContext, pitchingCallback);
    }
    let fn = currentLoader.pitch;
    currentLoader.pitchExecuted = true;//表示当前的loader的pitch已经处理过
    if (!fn) {
        return iteratePitchingLoaders(processOptions, loaderContext, pitchingCallback);
    }
    //以同步或者异步的方式执行fn
    runSyncOrAsync(fn, loaderContext, [
        loaderContext.remainingRequest, loaderContext.previousRequest, loaderContext.data
    ], (err, ...args) => {
        //如果有返回值，索引减少1，并执行前一个loader的normal
        if (args.length > 0 && args.some(item => item)) {
            loaderContext.loaderIndex--;//索引减少1
            iterateNormalLoaders(processOptions, loaderContext, args, pitchingCallback);
        } else {
            return iteratePitchingLoaders(processOptions, loaderContext, pitchingCallback);
        }
    });
}


function runLoaders(options, finalCallback) {
    // 结构参数， resource入口文件的绝对路径， loaders:loader绝对路径的数组  context上下文对象  readResource读取文件的方法
    let { resource, loaders = [], context = {}, readResource = fs.readFile } = options;//src\index.js
    let loaderObjects = loaders.map(createLoaderObject);// 将loader路径数组转成对象数组
    let loaderContext = context;
    loaderContext.resource = resource;//要加载的资源
    loaderContext.readResource = readResource;//读取资源的方法
    loaderContext.loaders = loaderObjects;//所有的loader对象
    loaderContext.loaderIndex = 0;//当前正在执行的loader索引
    loaderContext.callback = null;//回调
    loaderContext.async = null;//把loader的执行从同步变成异步
    //所有的loader加上resource
    Object.defineProperty(loaderContext, 'request', {
        get() {
            //loader1!loader2!loader3!index.js
            return loaderContext.loaders.map(loader => loader.path).concat(loaderContext.resource).join('!');
        }
    });
    // 当前执行到loader2
    //从当前的loader下一个开始一直到结束 ，加上要加载的资源
    Object.defineProperty(loaderContext, 'remainingRequest', {
        get() {
            //loader3!index.js
            return loaderContext.loaders.slice(loaderContext.loaderIndex + 1).map(loader => loader.path).concat(loaderContext.resource).join('!');
        }
    });

    //从当前的loader开始一直到结束 ，加上要加载的资源
    Object.defineProperty(loaderContext, 'currentRequest', {
        get() {
            // 当前执行到loader2
            //loader2!loader3!index.js
            return loaderContext.loaders.slice(loaderContext.loaderIndex).map(loader => loader.path).concat(loaderContext.resource).join('!');
        }
    });
    //从第一个到当前的loader的前一个
    Object.defineProperty(loaderContext, 'previousRequest', {
        get() {
            //loader1
            return loaderContext.loaders.slice(0, loaderContext.loaderIndex).map(loader => loader.path).join('!');
        }
    });

    Object.defineProperty(loaderContext, 'data', {
        get() {
            //loader1!loader2!loader3!index.js
            return loaderContext.loaders[loaderContext.loaderIndex].data;
        }
    });

    let processOptions = {
        resourceBuffer: null, //当真正读取源文件的时候，会把源文件的Buffer对象传递过来
        readResource
    }
    iteratePitchingLoaders(processOptions, loaderContext, (err, result) => {
        finalCallback(err, {
            result,
            resourceBuffer: processOptions.resourceBuffer
        });
    });
}

exports.runLoaders = runLoaders;

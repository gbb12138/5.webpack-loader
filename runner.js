const {runLoaders} = require('loader-runner');
const path = require('path');
const fs = require('fs');
const entryFile = path.resolve(__dirname, 'src', 'title.js'); // 入口文件
let rules = [   // loader的转换规则配置
    {
        test: /\.js$/,
        use: [ // 直接配置就是normal
            'normal1-loader.js', 'normal2-loader.js'
        ]
    },
    { // enforce： post就是后置loader
        test: /\.js$/,
        enforce: "post",
        use: [
            'post1-loader.js', 'post2-loader.js'
        ]
    },
    { // enforce： pre就是前置loader
        test: /\.js$/,
        enforce: "pre",
        use: [
            'pre1-loader.js', 'pre2-loader.js'
        ]
    }
];
let request = `inline1-loader!inline2-loader!${entryFile}`;
let parts = request.replace(/^-?!+/, '').split('!'); // ['inline1-loader', 'inline2-loader', entryFile]
let resource = parts.pop(); // entryFile
const resolveLoader = loader => path.resolve(__dirname, 'loaders', loader); // 获取loader的绝对路径
const inlineLoaders = parts; // ['inline1-loader', 'inline2-loader']
let preLoaders = [], postLoaders = [], normalLoaders = [];
rules.forEach(rule => {
    if (rule.test.test(resource)) {
        if (rule.enforce === 'pre') {
            preLoaders.push(...rule.use)
        } else if (rule.enforce === 'post') {
            postLoaders.push(...rule.use)
        } else {
            normalLoaders.push(...rule.use)
        }
    }
});

// 处理inline1-loader!inline2-loader!${entryFile} 的前缀：-!不要前置和普通 loader ！不要普通 loader ！！不要前后置和普通 loader,只要内联 loader
let loaders = [];
if (request.startsWith('!!')) {
    // noPrePostAutoLoaders 不要前后置和普通 loader,只要内联 loader
    loaders = [...inlineLoaders];
} else if (request.startsWith('-!')) {
    //noPreAutoLoaders 不要前置和普通 loader
    loaders = [...postLoaders, ...inlineLoaders];
} else if (request.startsWith('!')) {
    //noAutoLoaders 不要普通 loader
    loaders = [...postLoaders, ...inlineLoaders, ...preLoaders];
} else {
    loaders = [...postLoaders, ...inlineLoaders, ...normalLoaders, ...preLoaders];
}
loaders = loaders.map(resolveLoader);
loaders = loaders.map(loader => resolveLoader(loader)); // loader绝对路径的数组
runLoaders(
    {
        resource, // 要加载和转换的模块
        loaders,
        context: {name: 'zf'}, // loader的上下文，也就是loader中this的指向， 默认是空对象
        readResource: fs.readFile.bind(fs), // 读取硬盘文件的方法

    }, (err, result) => { // loader执行的回调函数
        console.log(err); // 运行错误
        console.log(result); // 转换后的结果
        // 可能没有读源文件， pitch返回了代码
        console.log(result.resourceBuffer && result.resourceBuffer.toString('utf8')); // 最开始的转换前的文件内容
    }
)






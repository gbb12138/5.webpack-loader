const babel = require('@babel/core');
/**
 * babel-loader 是一个准换源代码的函数
 * @param source 源代码参数
 * 返回转换后的代码
 */
function loader (source) {
    let options = this.getOptions({});
    let { code } = babel.transform(source, options);
    return code;
}
module.exports = loader;
/**
 *babel-loader
 * @babel/core 真正转换代码从es6到es5 需要靠 @babel/core, 本身只能提供从源代码转成语法书，遍历语法书，再重新生成代码
 * babel plugin 插件知道如何转换语法书，比如说把箭头函数转成普通函数的插件
 * babel preset 单个配置插件很多，把常用插件打包，起名字进行配置，比较方便
 */

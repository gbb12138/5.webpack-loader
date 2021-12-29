const path = require('path');

module.exports = {
    mode: 'development',
    devtool: false,
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js'
    },
    // webpack解析loader的时候配置如何查找
    resolveLoader: {
        // alias 和 modules至少配置一种去寻找
        // 配置别名
        alias: {
            'inline1-loader': path.resolve(__dirname, 'loaders','inline1-loader.js'),
            'inline2-loader': path.resolve(__dirname, 'loaders','inline2-loader.js'),
            'babel-loader': path.resolve(__dirname, 'loaders','babel-loader.js')
        },
        // 配置去哪些目录里找loader
        modules: ['node_modules', path.resolve(__dirname, 'loaders')]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                // use: {
                //     loader: 'babel-loader',
                //     options: {
                //         presets: ["@babel/preset-env"],
                //         plugins: []
                //     }
                // }
                use: [ // 直接配置就是normal
                    path.resolve(__dirname, 'runner','normal1-loader.js'),
                    path.resolve(__dirname, 'runner','normal2-loader.js')
                ]
            },
            { // enforce： post就是后置loader
                test: /\.js$/,
                enforce: "post",
                use: [
                    path.resolve(__dirname, 'runner','post1-loader.js'),
                    path.resolve(__dirname, 'runner','post2-loader.js')
                ]
            },
            { // enforce： pre就是前置loader
                test: /\.js$/,
                enforce: "pre",
                use: [
                    path.resolve(__dirname, 'runner','pre1-loader.js'),
                    path.resolve(__dirname, 'runner','pre2-loader.js')
                ]
            }
        ]
    },
    plugins: [],
}

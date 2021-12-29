const path = require('path');
module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    modules: {
        rules: [
            {
                test: /\.js$/,
                use: []
            }
        ]
    },
    plugins: [],
}
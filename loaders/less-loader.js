const less = require('less');
function loader (lessSource) {
    // 当调用async方法，这个loader就会变成异步的，当前loader结束后不会自动执行上一个loader，而是会等待调用callback函数后，才会继续执行
    let callback = this.async();
    less.render(lessSource, {filename: this.resource}, (err, output) => {
        callback(err, output.css);
    })
}

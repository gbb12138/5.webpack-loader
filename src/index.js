// let sum = (a, b) => {
//     return a + b;
// }
// 通过！分割loader
let title = require('inline1-loader!inline2-loader!./title.js');
// let title = require('./title.js');
console.log(title);

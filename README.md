# loader => 一个函数
## loader 的叠加顺序 
- post(后置)+inline(内联)+normal(正常)+pre(前置)  
- 厚         脸          挣            钱
- 执行顺序： pre => normal => inline => post
## loader的执行过程
- runner.js
- 每个loader中都有一个pitch函数，如果pitch返回了内容，直接跳到当前loader的前一个loader执行，后面的loader和pitch不再执行
## 实现加载loader loader-runner.js


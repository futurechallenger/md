const path = require('path');
const Koa = require('koa');
const static = require('koa-static');

const app = new Koa();
const staticPath = './static';

const port = process.env.PORT || 3030

app.use(static(
  path.join(__dirname, staticPath)
))

app.listen(port, () => console.log(
  `App is running on port ${port}`
));
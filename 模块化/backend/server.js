const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dbConfig = require('./config/db.config.js');

const app = express();

// 中间件配置
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 连接数据库
mongoose.connect(dbConfig.url, dbConfig.options)
  .then(() => {
    console.log("成功连接到数据库！");
  })
  .catch(err => {
    console.log("连接数据库时出错", err);
    process.exit();
  });

// 路由
const projectRoutes = require('./routes/project.routes');
app.use('/api/projects', projectRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('服务器内部错误！');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 处理未捕获的异常
process.on('unhandledRejection', (err) => {
  console.log('未处理的 Promise 拒绝：', err);
});

process.on('uncaughtException', (err) => {
  console.log('未捕获的异常：', err);
}); 
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const app = express();

// 创建上传目录
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 添加中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(uploadDir));

// 添加 ER 图相关的路由
const erDiagramRouter = require('./routes/erDiagram');
app.use('/api/er-diagram', erDiagramRouter);

// MongoDB 连接
mongoose.connect('mongodb://localhost:27017/java-project-analyzer', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

module.exports = app;
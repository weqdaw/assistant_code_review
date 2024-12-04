const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const connectDB = require('./config/db');
const projectRoutes = require('./routes/projectRoutes');
const aiAnalysisRoutes = require('./routes/aiAnalysisRoutes');
const mongoose = require('mongoose');

// 加载环境变量
require('dotenv').config();

// 连接数据库
connectDB();

const app = express();

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api', projectRoutes);
app.use('/api/ai', aiAnalysisRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器错误',
    message: err.message || '服务器内部错误',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('未处理的Promise拒绝:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
  
  
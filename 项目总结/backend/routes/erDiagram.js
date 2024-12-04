const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const erDiagramController = require('../controllers/erDiagramController');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.originalname.toLowerCase().endsWith('.sql')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传 .sql 文件'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// 保存 ER 图数据
router.post('/save', erDiagramController.saveERDiagram);

// 生成 SQL 语句
router.post('/generate-sql', erDiagramController.generateSQL);

// 解析 SQL 文件
router.post('/parse-sql', erDiagramController.parseSQLFile);

// 上传 SQL 文件
router.post('/upload-sql', upload.single('sqlFile'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }
    
    res.json({
      success: true,
      message: 'SQL文件上传成功',
      filePath: req.file.path.replace(/\\/g, '/').replace(/^.*\/uploads\//, ''),
      originalName: req.file.originalname
    });
  } catch (error) {
    next(error);
  }
});

// 获取SQL解析历史
router.get('/history', erDiagramController.getSQLHistory);

// 导出SQL
router.post('/export', erDiagramController.exportToSQL);

// 验证SQL
router.post('/validate', erDiagramController.validateSQL);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制'
      });
    }
  }
  
  console.error('Upload Error:', error);
  res.status(500).json({
    success: false,
    message: error.message || '文件上传失败'
  });
});

module.exports = router; 
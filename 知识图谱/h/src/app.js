const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { analyzeJavaFiles } = require('./services/analyzer');

// 配置 multer
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // 根据文件的相对路径创建目录
    const relativePath = path.dirname(file.originalname);
    const uploadPath = path.join('uploads', relativePath);
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // 使用原始文件名
    cb(null, path.basename(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.java')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// 递归获取目录下的所有Java文件
async function getAllJavaFiles(dir) {
  const files = [];
  
  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.java')) {
        files.push({
          path: fullPath,
          originalname: path.relative('uploads', fullPath)
        });
      }
    }
  }
  
  await scan(dir);
  return files;
}

// 上传并分析Java文件
app.post('/api/analyze', upload.array('files'), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: '请上传Java文件' });
    }

    console.log(`收到${uploadedFiles.length}个文件`);

    // 获取所有上传的Java文件
    const allFiles = await getAllJavaFiles('uploads');
    console.log(`找到${allFiles.length}个Java文件:`, allFiles.map(f => f.originalname));

    // 分析所有文件
    const graphData = await analyzeJavaFiles(allFiles);
    console.log('分析完成，返回结果:', graphData);

    // 清理上传目录
    await fs.rm('uploads', { recursive: true, force: true });
    await fs.mkdir('uploads');

    res.json(graphData);

  } catch (error) {
    console.error('处理请求时出错:', error);
    res.status(500).json({ 
      error: error.message || '分析文件时出错',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: err.message || '服务器内部错误',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
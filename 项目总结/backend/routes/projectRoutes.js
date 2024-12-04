const express = require('express');
const router = express.Router();
const multer = require('multer');
const ProjectService = require('../services/projectService');

// 配置 multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') 
  },
  filename: function (req, file, cb) {
    const relativePath = file.originalname.replace(/\\/g, '/');
    cb(null, `${Date.now()}-${relativePath}`);
  }
});

const upload = multer({ storage: storage });

// 处理项目分析请求
router.post('/analyze', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: '项目分析失败',
        message: '没有接收到任何文件'
      });
    }

    const project = await ProjectService.createProject(req.files);
    res.json(project);
  } catch (error) {
    console.error('分析项目时出错:', error);
    res.status(500).json({
      error: '项目分析失败',
      message: error.message
    });
  }
});

// 获取项目列表
router.get('/projects', async (req, res) => {
  try {
    const projects = await ProjectService.getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({
      error: '获取项目列表失败',
      message: error.message
    });
  }
});

// 获取单个项目详情
router.get('/projects/:id', async (req, res) => {
  try {
    const project = await ProjectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({
        error: '项目不存在',
        message: '找不到指定的项目'
      });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({
      error: '获取项目详情失败',
      message: error.message
    });
  }
});

module.exports = router; 
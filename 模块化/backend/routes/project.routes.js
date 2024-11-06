const express = require('express');
const router = express.Router();
const projects = require('../controllers/project.controller.js');

// 创建新项目
router.post('/', projects.create);

// 获取所有项目
router.get('/', projects.findAll);

// 获取单个项目
router.get('/:id', projects.findOne);

// 分析项目
router.post('/:id/analyze', projects.analyze);

module.exports = router; 
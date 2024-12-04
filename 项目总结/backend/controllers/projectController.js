const Project = require('../models/Project');
const { analyzeJavaProject } = require('../services/analyzer');
const path = require('path');
const fs = require('fs').promises;

exports.analyzeProject = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    // 创建临时目录存储上传的文件
    const projectDir = path.join(__dirname, '../temp', Date.now().toString());
    await fs.mkdir(projectDir, { recursive: true });

    // 保存文件到临时目录，保持原始路径结构
    for (const file of req.files) {
      const filePath = path.join(projectDir, file.originalname);
      const fileDir = path.dirname(filePath);
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, file.buffer);
    }

    // 分析项目结构
    const projectStructure = await analyzeJavaProject(projectDir);

    // 创建新项目记录
    const project = new Project({
      name: path.basename(projectDir),
      structure: {
        controllers: projectStructure.controllers.map(file => ({
          name: path.basename(file.path),
          path: file.path,
          content: file.content,
          dependencies: file.dependencies || []
        })),
        services: projectStructure.services.map(file => ({
          name: path.basename(file.path),
          path: file.path,
          content: file.content,
          dependencies: file.dependencies || []
        })),
        repositories: projectStructure.repositories.map(file => ({
          name: path.basename(file.path),
          path: file.path,
          content: file.content,
          dependencies: file.dependencies || []
        })),
        entities: projectStructure.entities.map(file => ({
          name: path.basename(file.path),
          path: file.path,
          content: file.content,
          dependencies: file.dependencies || []
        })),
        dtos: projectStructure.dtos.map(file => ({
          name: path.basename(file.path),
          path: file.path,
          content: file.content,
          dependencies: file.dependencies || []
        })),
        configurations: projectStructure.configurations.map(file => ({
          name: path.basename(file.path),
          path: file.path,
          content: file.content,
          dependencies: file.dependencies || []
        })),
        exceptions: projectStructure.exceptions.map(file => ({
          name: path.basename(file.path),
          path: file.path,
          content: file.content,
          dependencies: file.dependencies || []
        }))
      },
      relationships: projectStructure.relationships || []
    });

    // 保存到数据库
    await project.save();

    // 清理临时目录
    await fs.rm(projectDir, { recursive: true, force: true });

    // 返回分析结果
    res.json({
      id: project._id,
      structure: project.structure,
      relationships: project.relationships
    });

  } catch (error) {
    console.error('项目分析失败:', error);
    res.status(500).json({ 
      error: '项目分析失败',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json(project);
  } catch (error) {
    console.error('获取项目失败:', error);
    res.status(500).json({ error: '获取项目失败', message: error.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .select('name uploadDate')
      .sort({ uploadDate: -1 });
    res.json(projects);
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({ error: '获取项目列表失败', message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json({ message: '项目已删除' });
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({ error: '删除项目失败', message: error.message });
  }
}; 
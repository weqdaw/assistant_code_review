const Project = require('../models/project.model');

exports.create = async (req, res) => {
  try {
    const project = new Project({
      name: req.body.name,
      description: req.body.description,
      structure: req.body.structure
    });

    const savedProject = await project.save();
    res.status(201).send(savedProject);
  } catch (err) {
    res.status(500).send({
      message: err.message || "创建项目时发生错误。"
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const projects = await Project.find();
    res.send(projects);
  } catch (err) {
    res.status(500).send({
      message: err.message || "获取项目列表时发生错误。"
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send({
        message: "未找到ID为 " + req.params.id + " 的项目"
      });
    }
    res.send(project);
  } catch (err) {
    res.status(500).send({
      message: "获取ID为 " + req.params.id + " 的项目时发生错误"
    });
  }
};

exports.analyze = async (req, res) => {
  try {
    const projectId = req.params.id;
    const fileStructure = req.body.structure;
    
    // 分析项目结构
    const modules = analyzeProjectStructure(fileStructure);
    
    // 更新项目
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $set: {
          modules: modules,
          structure: fileStructure,
          updatedAt: Date.now()
        }
      },
      { new: true }
    );

    res.send(updatedProject);
  } catch (err) {
    res.status(500).send({
      message: err.message || "分析项目时发生错误。"
    });
  }
};

function analyzeProjectStructure(structure) {
  const modules = [];
  
  // 递归分析项目结构
  function analyzeNode(node, currentPath = '') {
    if (node.isFile && node.name.endsWith('.java')) {
      return {
        name: node.name,
        path: currentPath + '/' + node.name,
        packageName: node.packageName,
        imports: node.imports,
        fileType: node.fileType,
        content: node.content
      };
    }
    
    if (!node.isFile && node.children) {
      const moduleFiles = [];
      node.children.forEach(child => {
        const result = analyzeNode(child, currentPath + '/' + node.name);
        if (result) {
          if (Array.isArray(result)) {
            moduleFiles.push(...result);
          } else {
            moduleFiles.push(result);
          }
        }
      });
      
      if (moduleFiles.length > 0) {
        modules.push({
          name: node.name,
          path: currentPath + '/' + node.name,
          files: moduleFiles
        });
      }
    }
  }
  
  structure.forEach(node => analyzeNode(node));
  return modules;
} 
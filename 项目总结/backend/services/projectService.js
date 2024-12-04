const fs = require('fs').promises;
const Project = require('../models/Project');
const FileAnalyzer = require('../utils/fileAnalyzer');

class ProjectService {
  static async createProject(files) {
    const projectStructure = {
      name: '新项目_' + Date.now(),
      controllers: [],
      services: [],
      repositories: [],
      entities: [],
      dtos: [],
      configurations: [],
      exceptions: []
    };

    for (const file of files) {
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        const analysis = await FileAnalyzer.analyzeJavaFile(file.path, content);
        
        const fileInfo = {
          name: file.originalname,
          path: file.path,
          content: content,
          type: this.getFileType(file.originalname, content),
          analysis: analysis
        };

        // 根据文件类型分类
        switch(fileInfo.type) {
          case 'controller':
            projectStructure.controllers.push(fileInfo);
            break;
          case 'service':
            projectStructure.services.push(fileInfo);
            break;
          case 'repository':
            projectStructure.repositories.push(fileInfo);
            break;
          case 'entity':
            projectStructure.entities.push(fileInfo);
            break;
          case 'dto':
            projectStructure.dtos.push(fileInfo);
            break;
          case 'configuration':
            projectStructure.configurations.push(fileInfo);
            break;
          case 'exception':
            projectStructure.exceptions.push(fileInfo);
            break;
        }
      } catch (error) {
        console.error('处理文件时出错:', error);
      }
    }

    try {
      const project = new Project(projectStructure);
      return await project.save();
    } catch (error) {
      console.error('保存项目时出错:', error);
      throw error;
    }
  }

  static getFileType(fileName, content) {
    if (fileName.includes('Controller') || content.includes('@RestController') || content.includes('@Controller')) {
      return 'controller';
    } else if (fileName.includes('Service') || content.includes('@Service')) {
      return 'service';
    } else if (fileName.includes('Repository') || content.includes('@Repository')) {
      return 'repository';
    } else if (fileName.includes('Entity') || content.includes('@Entity')) {
      return 'entity';
    } else if (fileName.includes('DTO') || fileName.includes('Dto')) {
      return 'dto';
    } else if (fileName.includes('Config') || content.includes('@Configuration')) {
      return 'configuration';
    } else if (fileName.includes('Exception')) {
      return 'exception';
    }
    return null;
  }

  static async getProjectById(id) {
    return await Project.findById(id);
  }

  static async getAllProjects() {
    return await Project.find().select('-controllers.content -services.content -repositories.content -entities.content -dtos.content -configurations.content -exceptions.content');
  }
}

module.exports = ProjectService; 
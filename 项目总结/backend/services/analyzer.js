const fs = require('fs').promises;
const path = require('path');

class Analyzer {
  constructor() {
    this.modules = {
      controllers: [],
      services: [],
      repositories: [],
      entities: [],
      dtos: [],
      configurations: [],
      exceptions: []
    };
    this.relationships = [];
  }

  async analyzeFile(file) {
    const content = file.buffer.toString();
    const fileName = file.originalname;
    const filePath = file.path;

    // 分析文件类型和依赖关系
    if (content.includes('@Controller') || content.includes('@RestController')) {
      this.modules.controllers.push({ name: fileName, path: filePath, content });
      this.analyzeControllerDependencies(content, fileName);
    }
    if (content.includes('@Service')) {
      this.modules.services.push({ name: fileName, path: filePath, content });
      this.analyzeServiceDependencies(content, fileName);
    }
    if (content.includes('@Repository')) {
      this.modules.repositories.push({ name: fileName, path: filePath, content });
    }
    if (content.includes('@Entity')) {
      this.modules.entities.push({ name: fileName, path: filePath, content });
    }
    if (fileName.includes('DTO') || fileName.includes('Dto')) {
      this.modules.dtos.push({ name: fileName, path: filePath, content });
    }
    if (content.includes('@Configuration')) {
      this.modules.configurations.push({ name: fileName, path: filePath, content });
    }
    if (fileName.includes('Exception') || content.includes('extends Exception')) {
      this.modules.exceptions.push({ name: fileName, path: filePath, content });
    }
  }

  analyzeControllerDependencies(content, controllerName) {
    // 分析控制器中的服务依赖
    this.modules.services.forEach(service => {
      if (content.includes(service.name.replace('.java', ''))) {
        this.relationships.push({
          source: controllerName,
          target: service.name,
          type: 'controller-service'
        });
      }
    });
  }

  analyzeServiceDependencies(content, serviceName) {
    // 分析服务中的仓库依赖
    this.modules.repositories.forEach(repo => {
      if (content.includes(repo.name.replace('.java', ''))) {
        this.relationships.push({
          source: serviceName,
          target: repo.name,
          type: 'service-repository'
        });
      }
    });
  }
}

exports.analyzeJavaProject = async (files) => {
  const analyzer = new Analyzer();
  
  // 分析所有文件
  for (const file of files) {
    await analyzer.analyzeFile(file);
  }

  return {
    modules: analyzer.modules,
    relationships: analyzer.relationships
  };
}; 
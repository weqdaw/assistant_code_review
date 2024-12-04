const fs = require('fs').promises;

class FileAnalyzer {
  static async analyzeJavaFile(filePath, content) {
    try {
      const dependencies = [];
      const lines = content.split('\n');
      
      // 分析导入语句
      for (const line of lines) {
        if (line.trim().startsWith('import')) {
          const importPath = line.split('import')[1].trim().replace(';', '');
          dependencies.push(importPath);
        }
      }

      // 分析类定义
      const classMatch = content.match(/class\s+(\w+)(\s+extends\s+(\w+))?(\s+implements\s+([\w,\s]+))?/);
      const className = classMatch ? classMatch[1] : '';
      const parentClass = classMatch && classMatch[3] ? classMatch[3] : '';
      const interfaces = classMatch && classMatch[5] ? classMatch[5].split(',').map(i => i.trim()) : [];

      return {
        className,
        parentClass,
        interfaces,
        dependencies
      };
    } catch (error) {
      console.error('分析Java文件时出错:', error);
      return null;
    }
  }
}

module.exports = FileAnalyzer; 
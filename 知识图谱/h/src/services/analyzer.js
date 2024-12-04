const fs = require('fs').promises;
const path = require('path');

// 简单的 Java 代码解析函数
function parseJavaCode(content) {
  try {
    const nodes = [];
    const links = [];
    
    // 提取包名
    const packageMatch = content.match(/package\s+([\w.]+);/);
    const packageName = packageMatch ? packageMatch[1] : '';

    // 提取导入语句
    const imports = [];
    const importRegex = /import\s+(?:static\s+)?([\w.]+\*?);/g;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
      imports.push(importMatch[1]);
    }

    // 提取类的完整定义
    const classDefinitionRegex = /(?:@[\w()="]*\s+)*(?:public|private|protected)?\s*(?:abstract|final)?\s*(class|interface|enum)\s+(\w+)(?:<[^>]+>)?(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/;
    const classMatch = content.match(classDefinitionRegex);
    if (!classMatch) {
      throw new Error('无法识别类定义');
    }

    const classType = classMatch[1]; // class/interface/enum
    const className = classMatch[2];
    const extendedClass = classMatch[3];
    const implementedInterfaces = classMatch[4] ? classMatch[4].split(',').map(i => i.trim()) : [];

    // 提取类级别注解
    const annotations = [];
    const classAnnotationRegex = /@(\w+)(?:\(([^)]*)\))?/g;
    let annotationMatch;
    const annotationContent = content.substring(0, content.indexOf(classType));
    while ((annotationMatch = classAnnotationRegex.exec(annotationContent)) !== null) {
      const annotation = {
        name: annotationMatch[1],
        parameters: annotationMatch[2] ? annotationMatch[2] : null
      };
      annotations.push(annotation);
    }

    // 提取字段
    const fields = [];
    const fieldRegex = /(?:@[\w()="]*\s+)*(?:public|private|protected)?\s*(?:static|final)?\s*(\w+(?:<[^>]+>)?)\s+(\w+)(?:\s*=\s*[^;]+)?;/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(content)) !== null) {
      const fieldAnnotations = [];
      const fieldContent = content.substring(fieldMatch.index - 200, fieldMatch.index);
      let fieldAnnotationMatch;
      while ((fieldAnnotationMatch = classAnnotationRegex.exec(fieldContent)) !== null) {
        fieldAnnotations.push({
          name: fieldAnnotationMatch[1],
          parameters: fieldAnnotationMatch[2] ? fieldAnnotationMatch[2] : null
        });
      }

      fields.push({
        type: fieldMatch[1],
        name: fieldMatch[2],
        annotations: fieldAnnotations
      });
    }

    // 提取方法
    const methods = [];
    const methodRegex = /(?:@[\w()="]*\s+)*(?:public|private|protected)?\s*(?:static|final|abstract)?\s*(?:<[^>]+>\s+)?(\w+(?:<[^>]+>)?)\s+(\w+)\s*\(([\w\s,<>[\]]*)\)\s*(?:throws\s+[\w,\s]+)?\s*(?:\{|;)/g;
    let methodMatch;
    while ((methodMatch = methodRegex.exec(content)) !== null) {
      const methodAnnotations = [];
      const methodContent = content.substring(methodMatch.index - 200, methodMatch.index);
      let methodAnnotationMatch;
      while ((methodAnnotationMatch = classAnnotationRegex.exec(methodContent)) !== null) {
        methodAnnotations.push({
          name: methodAnnotationMatch[1],
          parameters: methodAnnotationMatch[2] ? methodAnnotationMatch[2] : null
        });
      }

      const parameters = methodMatch[3].split(',')
        .map(p => p.trim())
        .filter(p => p)
        .map(p => {
          const parts = p.split(' ');
          return {
            type: parts[0],
            name: parts[1] || 'unknown'
          };
        });

      methods.push({
        returnType: methodMatch[1],
        name: methodMatch[2],
        parameters: parameters,
        annotations: methodAnnotations
      });
    }

    // 确定类的类型
    let group = 'util';
    if (className.endsWith('Controller') || annotations.some(a => ['Controller', 'RestController'].includes(a.name))) {
      group = 'controller';
    } else if (className.endsWith('Service') || className.endsWith('ServiceImpl') || annotations.some(a => a.name === 'Service')) {
      group = 'service';
    } else if (className.endsWith('Repository') || className.endsWith('Dao') || className.endsWith('Mapper') || 
               annotations.some(a => ['Repository', 'Mapper'].includes(a.name))) {
      group = 'repository';
    } else if (className.endsWith('Entity') || className.endsWith('Model') || className.endsWith('DTO') || 
               className.endsWith('VO') || annotations.some(a => a.name === 'Entity')) {
      group = 'entity';
    }

    // 添加节点
    nodes.push({
      id: className,
      name: className,
      group: group,
      type: classType,
      package: packageName,
      annotations: annotations,
      imports: imports,
      fields: fields,
      methods: methods,
      modifiers: classMatch[0].match(/public|private|protected|abstract|final/g) || ['public']
    });

    // 添加继承关系
    if (extendedClass) {
      links.push({
        source: className,
        target: extendedClass,
        type: 'extends',
        details: '继承自' + extendedClass
      });
    }

    // 添加接口实现关系
    implementedInterfaces.forEach(interfaceName => {
      links.push({
        source: className,
        target: interfaceName,
        type: 'implements',
        details: '实现接口' + interfaceName
      });
    });

    // 添加依赖注入关系
    fields.forEach(field => {
      if (field.annotations.some(a => ['Autowired', 'Resource', 'Inject'].includes(a.name))) {
        links.push({
          source: className,
          target: field.type,
          type: 'uses',
          details: `通过${field.annotations[0].name}注入${field.type}`
        });
      }
    });

    // 添加方法依赖关系
    methods.forEach(method => {
      // 返回值依赖
      if (!['void', 'String', 'int', 'long', 'boolean', 'double', 'float'].includes(method.returnType)) {
        links.push({
          source: className,
          target: method.returnType,
          type: 'depends',
          details: `方法${method.name}返回类型依赖`
        });
      }

      // 参数依赖
      method.parameters.forEach(param => {
        if (!['String', 'int', 'long', 'boolean', 'double', 'float'].includes(param.type)) {
          links.push({
            source: className,
            target: param.type,
            type: 'depends',
            details: `方法${method.name}参数依赖`
          });
        }
      });
    });

    return { nodes, links };
  } catch (error) {
    console.error('解析Java代码失败:', error);
    throw error;
  }
}

async function analyzeJavaFiles(files) {
  try {
    let allNodes = new Map();
    let allLinks = new Map();
    let errors = [];
    let referencedClasses = new Set(); // 用于跟踪所有被引用的类

    // 第一遍：收集所有节点和被引用的类
    for (const file of files) {
      try {
        console.log(`开始处理文件: ${file.originalname}`);
        
        let content = await fs.readFile(file.path, { encoding: 'utf8' });
        if (!content.trim()) {
          console.warn(`文件为空: ${file.originalname}`);
          continue;
        }

        const result = parseJavaCode(content);
        console.log(`解析完成，结果:`, result);

        // 收集节点
        result.nodes.forEach(node => {
          allNodes.set(node.id, node);
        });

        // 收集所有被引用的类
        result.links.forEach(link => {
          referencedClasses.add(link.source);
          referencedClasses.add(link.target);
        });

      } catch (error) {
        console.error(`处理文件 ${file.originalname} 失败:`, error);
        errors.push(`${file.originalname}: ${error.message}`);
      }
    }

    // 第二遍：处理链接，只保留有效的链接
    for (const file of files) {
      try {
        const content = await fs.readFile(file.path, { encoding: 'utf8' });
        if (!content.trim()) continue;

        const result = parseJavaCode(content);

        // 只添加源节点和目标节点都存在的链接
        result.links.forEach(link => {
          const sourceId = link.source;
          const targetId = link.target;

          // 如果目标类不在已知节点中，但被引用了，创建一个默认节点
          if (!allNodes.has(targetId) && referencedClasses.has(targetId)) {
            allNodes.set(targetId, {
              id: targetId,
              name: targetId,
              group: 'util', // 默认分组
              package: '', // 未知包名
              annotations: [],
              modifiers: ['public']
            });
          }

          // 只有当源节点和目标节点都存在时才添加链接
          if (allNodes.has(sourceId) && allNodes.has(targetId)) {
            const linkKey = `${sourceId}-${targetId}-${link.type}`;
            allLinks.set(linkKey, {
              source: sourceId,
              target: targetId,
              type: link.type,
              details: link.details || ''
            });
          }
        });

      } catch (error) {
        // 错误已在第一遍中处理
      }
    }

    // 清理临时文件
    await Promise.all(files.map(file => 
      fs.unlink(file.path).catch(err => 
        console.warn(`清理临时文件失败: ${file.path}`, err)
      )
    ));

    if (allNodes.size === 0) {
      if (errors.length > 0) {
        throw new Error(`分析失败: ${errors.join('; ')}`);
      } else {
        throw new Error('未能识别出任何Java类');
      }
    }

    const result = {
      nodes: Array.from(allNodes.values()),
      links: Array.from(allLinks.values())
    };

    // 验证所有链接的节点都存在
    result.links = result.links.filter(link => {
      const sourceExists = result.nodes.some(node => node.id === link.source);
      const targetExists = result.nodes.some(node => node.id === link.target);
      return sourceExists && targetExists;
    });

    console.log('最终分析结果:', result);
    return result;

  } catch (error) {
    console.error('分析Java文件时出错:', error);
    throw error;
  }
}

module.exports = {
  analyzeJavaFiles
}; 
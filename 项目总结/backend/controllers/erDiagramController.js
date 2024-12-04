const ERDiagram = require('../models/ERDiagram');
const fs = require('fs').promises;
const path = require('path');

// 保存 ER 图数据
exports.saveERDiagram = async (req, res) => {
  try {
    const { tables } = req.body;
    const erDiagram = new ERDiagram({
      tables,
      createdAt: new Date()
    });
    
    await erDiagram.save();
    res.json({ 
      success: true, 
      message: 'ER图数据保存成功',
      id: erDiagram._id 
    });
  } catch (error) {
    console.error('保存ER图数据失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '保存ER图数据失败' 
    });
  }
};

// 生成 SQL 语句
exports.generateSQL = async (req, res) => {
  try {
    const { tables } = req.body;
    const sqlStatements = generateSQLFromTables(tables);
    res.json({ 
      success: true, 
      sql: sqlStatements 
    });
  } catch (error) {
    console.error('生成SQL失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '生成SQL失败' 
    });
  }
};

// 解析 SQL 文件
exports.parseSQLFile = async (req, res) => {
  try {
    const { filePath } = req.body;
    let absolutePath;
    
    // 处理相对路径和绝对路径
    if (path.isAbsolute(filePath)) {
      absolutePath = filePath;
    } else {
      absolutePath = path.join(process.cwd(), 'uploads', filePath);
    }
    
    // 读取SQL文件内容
    const sqlContent = await fs.readFile(absolutePath, 'utf-8');
    
    // 预处理SQL内容
    const cleanSQL = preprocessSQL(sqlContent);
    
    res.json({
      success: true,
      sql: cleanSQL
    });
  } catch (error) {
    console.error('解析SQL文件失败:', error);
    res.status(500).json({
      success: false,
      message: '解析SQL文件失败'
    });
  }
};

// 处理SQL文件上传
exports.uploadSQLFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    const relativePath = req.body.relativePath || req.file.originalname;
    const filePath = req.file.path.replace(/\\/g, '/');

    // 确保目录存在
    const fileDir = path.dirname(filePath);
    await fs.mkdir(fileDir, { recursive: true });

    res.json({
      success: true,
      message: 'SQL文件上传成功',
      filePath: filePath,
      relativePath: relativePath
    });
  } catch (error) {
    console.error('上传SQL文件失败:', error);
    res.status(500).json({
      success: false,
      message: '上传SQL文件失败'
    });
  }
};

// 获取SQL解析历史
exports.getSQLHistory = async (req, res) => {
  try {
    const history = await ERDiagram.find()
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史记录失败'
    });
  }
};

// 导出为SQL文件
exports.exportToSQL = async (req, res) => {
  try {
    const { tables, options } = req.body;
    const dialect = options.dialect || 'mysql'; // 支持不同数据库方言
    
    let sql = '';
    if (dialect === 'mysql') {
      sql = generateMySQLStatements(tables, options);
    } else if (dialect === 'postgresql') {
      sql = generatePostgreSQLStatements(tables, options);
    }
    
    const fileName = `database_${Date.now()}.sql`;
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    
    await fs.writeFile(filePath, sql);
    
    res.json({
      success: true,
      filePath: fileName,
      sql
    });
  } catch (error) {
    console.error('导出SQL失败:', error);
    res.status(500).json({
      success: false,
      message: '导出SQL失败'
    });
  }
};

// 验证SQL语法
exports.validateSQL = async (req, res) => {
  try {
    const { sql } = req.body;
    const validationResults = validateSQLSyntax(sql);
    
    res.json({
      success: true,
      isValid: validationResults.isValid,
      errors: validationResults.errors,
      warnings: validationResults.warnings
    });
  } catch (error) {
    console.error('SQL验证失败:', error);
    res.status(500).json({
      success: false,
      message: 'SQL验证失败'
    });
  }
};

// 辅助函数：生成 SQL 语句
function generateSQLFromTables(tables) {
  let sql = '';
  
  tables.forEach(table => {
    sql += `CREATE TABLE ${table.name} (\n`;
    
    const columnDefinitions = table.columns.map(column => {
      let def = `  ${column.name} ${column.type.toUpperCase()}`;
      if (column.isPk) {
        def += ' PRIMARY KEY';
      }
      return def;
    });
    
    sql += columnDefinitions.join(',\n');
    sql += '\n);\n\n';
  });
  
  return sql;
}

// 辅助函数：预处理SQL内容
function preprocessSQL(sqlContent) {
  return sqlContent
    // 移除注释
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 标准化空白字符
    .replace(/\s+/g, ' ')
    // 处理换行
    .replace(/;\s*/g, ';\n')
    // 美化CREATE TABLE语句
    .replace(/CREATE TABLE/gi, '\nCREATE TABLE')
    // 美化字段定义
    .replace(/,\s*([A-Za-z])/g, ',\n  $1')
    // 处理括号
    .replace(/\(\s*/g, ' (\n  ')
    .replace(/\s*\)/g, '\n)')
    .trim();
}

// 增强的SQL解析函数
function validateSQLSyntax(sql) {
  const errors = [];
  const warnings = [];
  
  // 检查基本语法
  if (!sql.match(/CREATE\s+TABLE/i)) {
    errors.push('未找到CREATE TABLE语句');
  }
  
  // 检查表名
  const tableNames = sql.match(/CREATE\s+TABLE\s+`?(\w+)`?/gi);
  if (tableNames) {
    const names = new Set();
    tableNames.forEach(match => {
      const name = match.replace(/CREATE\s+TABLE\s+`?(\w+)`?/i, '$1');
      if (names.has(name)) {
        errors.push(`重复的表名: ${name}`);
      }
      names.add(name);
    });
  }
  
  // 检查字段定义
  const columnDefs = sql.match(/`?\w+`?\s+\w+(\([^)]+\))?\s*(?:PRIMARY KEY|UNIQUE|NOT NULL)?/gi);
  if (columnDefs) {
    columnDefs.forEach(def => {
      if (!def.match(/\w+\s+\w+/)) {
        warnings.push(`可能的字段定义问题: ${def}`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// MySQL方言
function generateMySQLStatements(tables, options) {
  let sql = '';
  const { includeDropTable = false, charset = 'utf8mb4' } = options;
  
  sql += `SET NAMES ${charset};\n\n`;
  
  tables.forEach(table => {
    if (includeDropTable) {
      sql += `DROP TABLE IF EXISTS \`${table.name}\`;\n`;
    }
    
    sql += `CREATE TABLE \`${table.name}\` (\n`;
    
    const columnDefinitions = table.columns.map(column => {
      let def = `  \`${column.name}\` ${column.type.toUpperCase()}`;
      if (column.type.toLowerCase() === 'varchar' && !column.length) {
        def += '(255)';
      }
      if (column.isPk) {
        def += ' PRIMARY KEY';
      }
      if (!column.nullable) {
        def += ' NOT NULL';
      }
      if (column.default) {
        def += ` DEFAULT ${column.default}`;
      }
      return def;
    });
    
    sql += columnDefinitions.join(',\n');
    sql += '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n';
  });
  
  return sql;
}

// PostgreSQL方言
function generatePostgreSQLStatements(tables, options) {
  let sql = '';
  const { includeDropTable = false } = options;
  
  tables.forEach(table => {
    if (includeDropTable) {
      sql += `DROP TABLE IF EXISTS "${table.name}";\n`;
    }
    
    sql += `CREATE TABLE "${table.name}" (\n`;
    
    const columnDefinitions = table.columns.map(column => {
      let def = `  "${column.name}" ${postgresqlType(column.type)}`;
      if (column.isPk) {
        def += ' PRIMARY KEY';
      }
      if (!column.nullable) {
        def += ' NOT NULL';
      }
      if (column.default) {
        def += ` DEFAULT ${column.default}`;
      }
      return def;
    });
    
    sql += columnDefinitions.join(',\n');
    sql += '\n);\n\n';
  });
  
  return sql;
}

// PostgreSQL类型映射
function postgresqlType(mysqlType) {
  const typeMap = {
    'int': 'INTEGER',
    'varchar': 'VARCHAR(255)',
    'text': 'TEXT',
    'datetime': 'TIMESTAMP',
    'decimal': 'NUMERIC',
    'boolean': 'BOOLEAN'
  };
  
  return typeMap[mysqlType.toLowerCase()] || mysqlType.toUpperCase();
} 
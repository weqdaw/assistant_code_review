module.exports = {
  // WebSocket服务器配置
  WS_PORT: 3002,
  
  // Java编译器配置
  JAVA_TIMEOUT: 10000, // 代码执行超时时间（毫秒）
  MAX_CODE_LENGTH: 5000, // 最大代码长度
  
  // 临时文件配置
  TEMP_DIR: 'temp',
  
  // 安全配置
  ALLOWED_ORIGINS: [
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ]
}; 
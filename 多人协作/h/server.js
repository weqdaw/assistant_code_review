const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// 存储连接的客户端
const clients = new Map();

// WebSocket连接处理
wss.on('connection', (ws) => {
  const userId = 'user_' + Math.random().toString(36).substr(2, 9);
  clients.set(ws, userId);

  console.log(`新用户连接: ${userId}`);

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'chat_message',
    user: 'System',
    content: `欢迎 ${userId} 加入协作`
  }));

  // 广播在线用户列表
  broadcastUserList();

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'code_change':
          // 广播代码更改给其他用户
          broadcastMessage(ws, {
            type: 'code_change',
            content: data.content,
            user: data.user
          });
          break;

        case 'chat_message':
          // 广播聊天消息给所有用户（包括发送者）
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'chat_message',
                content: data.content,
                user: data.user,
                time: new Date().toLocaleTimeString()
              }));
            }
          });
          break;

        case 'run_code':
          // 运行Java代码
          const result = await runJavaCode(data.content, userId);
          ws.send(JSON.stringify({
            type: 'run_result',
            result
          }));
          break;
      }
    } catch (error) {
      console.error('消息处理错误:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    const userId = clients.get(ws);
    console.log(`用户断开连接: ${userId}`);
    clients.delete(ws);
    broadcastUserList();
    
    // 广播用户离开消息
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'chat_message',
          user: 'System',
          content: `${userId} 离开了协作`
        }));
      }
    });
  });
});

// 广播消息给其他用户
function broadcastMessage(sender, message) {
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// 广播用户列表
function broadcastUserList() {
  const userList = Array.from(clients.values());
  const message = {
    type: 'user_list',
    users: userList
  };
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// 运行Java代码
async function runJavaCode(code, userId) {
  const tempDir = path.join(__dirname, 'temp', userId);
  await fs.ensureDir(tempDir);
  
  const javaFile = path.join(tempDir, 'Main.java');
  await fs.writeFile(javaFile, code);

  return new Promise((resolve, reject) => {
    // 编译Java文件
    exec(`javac "${javaFile}"`, async (error) => {
      if (error) {
        await fs.remove(tempDir);
        resolve({
          success: false,
          output: `编译错误：${error.message}`
        });
        return;
      }

      // 运行Java程序
      exec(`java -cp "${tempDir}" Main`, async (error, stdout, stderr) => {
        await fs.remove(tempDir);
        
        if (error) {
          resolve({
            success: false,
            output: `运行错误：${error.message}`
          });
          return;
        }

        resolve({
          success: true,
          output: stdout || stderr
        });
      });
    });
  });
}

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 
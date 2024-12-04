<template>
  <div class="document-chat">
    <div class="content-area">
      <div class="pdf-section">
        <div class="upload-area" v-if="!pdfUrl">
          <input 
            type="file" 
            accept=".pdf" 
            @change="handleFileUpload"
            ref="fileInput"
            style="display: none"
          >
          <button class="upload-button" @click="$refs.fileInput.click()">
            <span class="upload-icon">📄</span>
            <span>上传PDF文档</span>
          </button>
        </div>
        <iframe v-if="pdfUrl" :src="pdfUrl" class="pdf-viewer"></iframe>
      </div>
      
      <div class="chat-section">
        <div class="chat-messages" ref="chatMessages">
          <div v-for="(message, index) in messages" 
               :key="index" 
               :class="['message', message.type]">
            {{ message.content }}
          </div>
        </div>
        <div class="chat-input">
          <input 
            v-model="userInput"
            @keyup.enter="sendMessage" 
            placeholder="请输入您的问题..."
          >
          <button @click="sendMessage">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DocumentChat',
  data() {
    return {
      pdfUrl: null,
      userInput: '',
      messages: [],
      uploadedFile: null
    }
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (file && file.type === 'application/pdf') {
        this.pdfUrl = URL.createObjectURL(file)
        this.uploadedFile = file
        this.messages.push({
          type: 'system',
          content: '文档上传成功！您现在可以开始提问了。'
        })
      } else {
        alert('请上传PDF格式的文件！')
      }
    },

    async sendMessage() {
      if (!this.userInput.trim()) return

      // 添加用户消息到界面
      this.messages.push({
        type: 'user',
        content: this.userInput
      })

      // 检查是否有上传文件
      if (!this.uploadedFile) {
        this.messages.push({
          type: 'system',
          content: '请先上传PDF文档再提问！'
        })
        this.userInput = ''
        return
      }

      try {
        const formData = new FormData()
        formData.append('file', this.uploadedFile)
        formData.append('input', this.userInput)

        // 发送请求到服务器
        const response = await fetch('http://localhost:3100/api/doc_query', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        // 添加AI响应到消息列表
        this.messages.push({
          type: 'ai',
          content: data.answer
        })

        // 清空输入框
        this.userInput = ''

      } catch (error) {
        console.error('Error:', error)
        this.messages.push({
          type: 'system',
          content: '发生错误：' + error.message
        })
      }
    }
  }
}

</script>

<style scoped>
.document-chat {
  padding: 20px;
  height: calc(100vh - 80px);
}

.content-area {
  display: flex;
  height: 100%;
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.pdf-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area {
  text-align: center;
  padding: 40px;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border: 2px dashed #1e88e5;
  border-radius: 12px;
  background: #f8faff;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #1e88e5;
}

.upload-button:hover {
  background: #f0f4ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-icon {
  font-size: 2rem;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
}

.chat-section {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.user {
  background-color: #e3f2fd;
  margin-left: 20%;
  color: #1565c0;
}

.ai {
  background-color: #f5f7fa;
  margin-right: 20%;
  color: #2c3e50;
}

.system {
  background-color: #fff8e1;
  text-align: center;
  margin: 10px 0;
  color: #f57c00;
}

.chat-input {
  display: flex;
  padding: 16px;
  gap: 12px;
  border-top: 1px solid #eee;
}

.chat-input input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.chat-input input:focus {
  outline: none;
  border-color: #1e88e5;
}

.chat-input button {
  padding: 0.6rem 1.2rem;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.chat-input button:hover {
  background-color: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style> 
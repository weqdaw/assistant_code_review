<template>
  <div id="app">
    <div class="left-nav">
      <div class="create-new" @click="createNewChat">
        <i class="van-icon van-icon-plus">+</i>
        <span>新建对话</span>
      </div>

      <div class="chat-list">
        <div class="time-group">
          <h3 class="time-title">最近对话</h3>
          <div v-for="chat in recentChats"
               :key="chat.id"
               class="chat-item"
               :class="{ 'active': currentChatId === chat.id }"
               @click="switchChat(chat.id)">
            <div class="icon">
              <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24"
                   stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="title">{{ chat.title }}</div>
          </div>
        </div>

        <div class="time-group" v-if="olderChats.length > 0">
          <h3 class="time-title">7天前</h3>
          <div v-for="chat in olderChats"
               :key="chat.id"
               class="chat-item"
               :class="{ 'active': currentChatId === chat.id }"
               @click="switchChat(chat.id)">
            <div class="icon">
              <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24"
                   stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="title">{{ chat.title }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="header">
        <h1 class="title">代码智能问答系统</h1>
      </div>

      <div class="input-container">
        <div class="input-wrapper">
          <input
              v-model="input"
              placeholder="请输入你的问题..."
              class="input-field"
              @keyup.enter="getAnswer"
          />
        </div>
      </div>

      <div class="answer-container">
        <div class="answer-content">
          <div v-if="currentChat && currentChat.messages.length > 0">
            <div v-for="(message, index) in currentChat.messages" :key="index" class="message-group">
              <div class="question-wrapper">
                <p class="question-text">{{ message.question }}</p>
              </div>
              <div class="answer-wrapper">
                <p class="answer-text">{{ message.answer }}</p>
              </div>
            </div>
          </div>
          <div v-if="isTyping">
            <div class="question-wrapper">
              <p class="question-text">{{ input }}</p>
            </div>
            <div class="answer-wrapper">
              <p class="answer-text typing">{{ answer }}</p>
            </div>
          </div>
        </div>
      </div>

      <button @click="getAnswer" class="answer-button">
        <span class="button-text">发送</span>
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'App',
  data() {
    return {
      input: '',
      answer: '',
      isTyping: false,
      chatList: [],
      currentChatId: null,
      currentChat: null
    }
  },
  computed: {
    recentChats() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return this.chatList.filter(chat => new Date(chat.time) >= sevenDaysAgo);
    },
    olderChats() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return this.chatList.filter(chat => new Date(chat.time) < sevenDaysAgo);
    }
  },
  methods: {
    createNewChat() {
      const newChat = {
        id: Date.now(),
        title: '新对话',
        time: new Date(),
        messages: []
      };

      this.chatList.unshift(newChat);
      this.currentChatId = newChat.id;
      this.answer = '';
      this.input = '';
    },

    updateChatTitle(chat, question) {
      if (!question) return;
      chat.title = question.slice(0, 5) + (question.length > 5 ? '...' : '');
    },

    switchChat(chatId) {
      this.currentChatId = chatId;
      this.currentChat = this.chatList.find(chat => chat.id === chatId);
      this.input = '';
      this.answer = '';
      this.isTyping = false;
    },

    async getAnswer() {
      if (!this.input.trim() || !this.currentChatId) return;

      const question = this.input;
      this.input = '';

      if (this.currentChat) {
        this.currentChat.messages.push({
          question: question,
          answer: '',
          timestamp: new Date()
        });
      }

      try {
        const response = await axios.post('http://localhost:3001/api/question', {
          question: question,
          chatId: this.currentChatId
        });

        const responseText = response.data.answer;
        const lastMessage = this.currentChat.messages[this.currentChat.messages.length - 1];

        const paragraphs = responseText.split('\n');
        let currentText = '';

        for (let paragraph of paragraphs) {
          if (currentText && paragraph) {
            currentText += '\n';
          }

          for (let i = 0; i < paragraph.length; i++) {
            currentText += paragraph[i];
            lastMessage.answer = currentText;
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }

        this.updateChatTitle(this.currentChat, question);

      } catch (error) {
        console.error('Error:', error);
        if (this.currentChat && this.currentChat.messages.length > 0) {
          const lastMessage = this.currentChat.messages[this.currentChat.messages.length - 1];
          const errorText = '抱歉，发生错误，请稍后再试。';
          let currentText = '';

          for (let i = 0; i < errorText.length; i++) {
            currentText += errorText[i];
            lastMessage.answer = currentText;
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }
    }
  },
  mounted() {
    this.createNewChat();
  }
}
</script>

<style>
body {
  background: #f5f5f7;
  height: 100vh;
  margin: 0;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  position: relative;
}

.container {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 200px;
  width: 35%;
  height: calc(50vh - 50px);
  display: flex;
  flex-direction: column;
  margin: 20px auto;
  margin-left: 500px;
  margin-right: 200px;
  position: relative;
  overflow: hidden;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: inherit;
  backdrop-filter: inherit;
  padding: 15px 0;
  margin-bottom: 15px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.input-wrapper {
  margin: 0 auto;
  width: 100%;
}

.input-field {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-field:focus {
  background: rgba(0, 0, 0, 0.08);
  outline: none;
}

.answer-container {
  margin: 30px 0;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  flex: 1;
  min-height: 0;
  height: 150px;
  overflow: hidden;
  position: relative;
}

.answer-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px;
  overflow-y: auto;
}

.message-group {
  margin-bottom: 20px;
}

.question-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.answer-wrapper {
  display: flex;
  justify-content: flex-start;
}

.question-text {
  background: #007AFF;
  color: white;
  padding: 10px 15px;
  border-radius: 15px 15px 0 15px;
  max-width: 80%;
  word-wrap: break-word;
}

.answer-text {
  background: rgba(0, 0, 0, 0.05);
  padding: 10px 15px;
  border-radius: 15px 15px 15px 0;
  max-width: 80%;
  word-wrap: break-word;
}

.answer-text.typing::after {
  content: '|';
  animation: blink 1s infinite;
}

.answer-button {
  padding: 12px 24px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  width: auto;
  min-width: 100px;
}

.answer-button:hover {
  background: #0066CC;
}

.answer-button:active {
  transform: scale(0.98);
  background: #0055AA;
}

.left-nav {
  position: fixed;
  left: 0;
  top: 0;
  width: 260px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.time-group {
  margin-bottom: 20px;
}

.time-title {
  padding: 0 20px;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.chat-item {
  padding: 10px 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.chat-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.chat-item .icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  color: #666;
}

.chat-item .title {
  font-size: 14px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-new {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.create-new:hover {
  background: rgba(0, 0, 0, 0.05);
}

.create-new i {
  margin-right: 8px;
  font-size: 16px;
}

/* 滚动条样式 */
.answer-content::-webkit-scrollbar {
  width: 6px;
}

.answer-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.answer-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.answer-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.chat-list::-webkit-scrollbar {
  width: 6px;
}

.chat-list::-webkit-scrollbar-track {
  background: transparent;
}

.chat-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.chat-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  body {
    background: #000000;
  }

  .container {
    background: rgba(30, 30, 30, 0.8);
  }

  .title {
    color: #ffffff;
  }

  .input-field {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .input-field:focus {
    background: rgba(255, 255, 255, 0.15);
  }

  .answer-container {
    background: rgba(255, 255, 255, 0.1);
  }

  .answer-text {
    color: #ffffff;
  }

  .left-nav {
    background: rgba(30, 30, 30, 0.8);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .time-title {
    color: #999;
  }

  .chat-item .title {
    color: #fff;
  }

  .chat-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .create-new {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .create-new:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .chat-item.active {
    background: rgba(255, 255, 255, 0.1);
  }

  .header {
    background: rgba(30, 30, 30, 0.8);
  }

  .title {
    color: #ffffff;
  }

  .answer-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .answer-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }

  .answer-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>

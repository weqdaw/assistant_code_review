<template>
  <div id="app">
    <div class="container">
      <div class="header">
        <h1 class="title">代码智能审查系统</h1>
      </div>

      <!-- 上传区域 -->
      <div class="upload-section">
        <div class="upload-area" 
             @drop.prevent="handleDrop"
             @dragover.prevent
             @dragenter.prevent="dragActive = true"
             @dragleave.prevent="dragActive = false"
             :class="{ 'drag-active': dragActive }">
          <div class="upload-content">
            <svg class="upload-icon" viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <p>拖拽文件到此处或</p>
            <div class="upload-buttons">
              <input type="file" 
                     ref="fileInput" 
                     @change="handleFileSelect" 
                     multiple 
                     webkitdirectory 
                     directory
                     style="display: none">
              <input type="file"
                     ref="singleFileInput"
                     @change="handleSingleFileSelect"
                     multiple
                     style="display: none">
              <button class="upload-button" @click="$refs.fileInput.click()">
                选择项目文件夹
              </button>
              <button class="upload-button secondary" @click="$refs.singleFileInput.click()">
                选择单个文件
              </button>
            </div>
          </div>
          
          <!-- 文件列表显示 -->
          <div class="file-list" v-if="uploadedFiles.length > 0">
            <h3>已上传文件：</h3>
            <div class="file-list-container">
              <div v-for="(file, index) in uploadedFiles" 
                   :key="index"
                   class="file-item">
                <span class="file-name">{{ file.path }}</span>
                <button class="delete-button" @click="removeFile(index)">×</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 审查结果区域 -->
      <div class="review-section" v-if="reviewResults.length > 0">
        <h2>审查结果</h2>
        <div class="review-results">
          <div v-for="(result, index) in reviewResults" 
               :key="index" 
               class="review-item"
               :class="result.severity">
<!--            <div class="review-header">
              <span class="severity-badge">{{ result.severity }}</span>
              <span class="file-path">{{ result.file }}</span>
            </div>-->
            <div class="issue-description">
              <h4>问题描述：</h4>
              <p>{{ result.description }}</p>
            </div>
            <div class="suggestion">
              <h4>修改建议：</h4>
              <pre><code>{{ result.suggestion }}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 开始审查按钮 -->
      <button class="review-button" 
              @click="startReview"
              :disabled="!uploadedFiles.length || isReviewing">
        {{ isReviewing ? '审查中...' : '开始审查' }}
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'App',
  data() {
    return {
      dragActive: false,
      uploadedFiles: [],
      reviewResults: [],
      isReviewing: false
    }
  },
  methods: {
    handleDrop(e) {
      this.dragActive = false;
      const items = e.dataTransfer.items;
      if (items) {
        this.processItems(items);
      }
    },

    handleFileSelect(e) {
      const files = e.target.files;
      this.processFiles(files);
    },

    processItems(items) {
      for (let item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            this.processEntry(entry);
          }
        }
      }
    },

    processFiles(files) {
      const newFiles = Array.from(files).map(file => ({
        path: file.webkitRelativePath || file.name,
        content: file
      }));

      const existingPaths = new Set(this.uploadedFiles.map(f => f.path));
      const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
      
      this.uploadedFiles = [...this.uploadedFiles, ...uniqueNewFiles];
    },

    async processEntry(entry, path = '') {
      if (entry.isFile) {
        const file = await new Promise(resolve => entry.file(resolve));
        this.uploadedFiles.push({
          path: path + file.name,
          content: file
        });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise(resolve => reader.readEntries(resolve));
        for (let childEntry of entries) {
          await this.processEntry(childEntry, path + entry.name + '/');
        }
      }
    },

    async startReview() {
      this.isReviewing = true;
      this.reviewResults = [];

      try {
        // 准备要发送的文件数据
        const formData = new FormData();
        this.uploadedFiles.forEach(file => {
          formData.append('files', file.content);
        });

        // 调用后端API
        const response = await axios.post('http://localhost:3001/api/review', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.reviewResults = response.data.results;
      } catch (error) {
        console.error('Review failed:', error);
        // 可以添加错误提示
        this.reviewResults = [{
          severity: 'critical',
          file: 'System',
          description: '审查过程发生错误',
          suggestion: error.message
        }];
      } finally {
        this.isReviewing = false;
      }
    },

    handleSingleFileSelect(e) {
      const files = e.target.files;
      if (files) {
        const newFiles = Array.from(files).map(file => ({
          path: file.name,
          content: file
        }));
        
        // 合并文件列表，避免重复
        const existingPaths = new Set(this.uploadedFiles.map(f => f.path));
        const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
        
        this.uploadedFiles = [...this.uploadedFiles, ...uniqueNewFiles];
      }
      // 清空input，允许重复选择同一文件
      e.target.value = '';
    },

    removeFile(index) {
      this.uploadedFiles.splice(index, 1);
    }
  }
}
</script>

<style>
body {
  background: #f5f5f7;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 40px auto;
  padding: 20px;
  min-height: 100vh;
  height: auto;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 32px;
  position: static;
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.upload-section {
  flex: 1;
  margin-bottom: 40px;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background: white;
  transition: all 0.3s ease;
}

.drag-active {
  border-color: #007AFF;
  background: rgba(0, 122, 255, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.upload-icon {
  width: 64px;
  height: 64px;
  fill: #007AFF;
}

.upload-button {
  padding: 12px 24px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.upload-button:hover {
  background: #0066CC;
}

.file-list {
  margin-top: 20px;
  text-align: left;
}

.file-list ul {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.file-list li {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.review-section {
  margin-bottom: 40px;
}

.review-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.review-item.critical {
  border-left: 4px solid #FF3B30;
}

.review-item.warning {
  border-left: 4px solid #FF9500;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.severity-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.critical .severity-badge {
  background: #FF3B30;
  color: white;
}

.warning .severity-badge {
  background: #FF9500;
  color: white;
}

.file-path {
  font-family: monospace;
  color: #666;
}

.issue-description h4,
.suggestion h4 {
  margin: 0 0 8px 0;
  color: #1d1d1f;
}

.suggestion pre {
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
}

.suggestion code {
  font-family: monospace;
  font-size: 14px;
}

.review-button {
  padding: 16px 32px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  display: block;
}

.review-button:hover:not(:disabled) {
  background: #0066CC;
  transform: translateY(-2px);
}

.review-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.upload-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.upload-button.secondary {
  background: transparent;
  border: 2px solid #007AFF;
  color: #007AFF;
}

.upload-button.secondary:hover {
  background: rgba(0, 122, 255, 0.1);
}

.file-list-container {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 10px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.5);
}

.file-name {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-button {
  background: none;
  border: none;
  color: #ff3b30;
  font-size: 18px;
  cursor: pointer;
  padding: 0 8px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.delete-button:hover {
  opacity: 1;
}

@media (prefers-color-scheme: dark) {
  body {
    background: #000000;
  }

  .title {
    color: #ffffff;
  }

  .upload-area {
    background: rgba(255, 255, 255, 0.1);
    border-color: #666;
  }

  .review-item {
    background: rgba(255, 255, 255, 0.1);
  }

  .file-path {
    color: #999;
  }

  .issue-description h4,
  .suggestion h4 {
    color: #ffffff;
  }

  .suggestion pre {
    background: rgba(255, 255, 255, 0.1);
  }

  .upload-button.secondary {
    border-color: #0A84FF;
    color: #0A84FF;
  }

  .upload-button.secondary:hover {
    background: rgba(10, 132, 255, 0.1);
  }

  .file-item {
    background: rgba(255, 255, 255, 0.1);
  }

  .file-name {
    color: #ccc;
  }

  .file-list-container {
    background: rgba(255, 255, 255, 0.05);
  }

  .container {
    background: rgba(30, 30, 30, 0.8);
  }
}
</style>

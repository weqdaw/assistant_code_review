<template>
  <div id="app">
    <div class="header">
      <h1 class="title">代码智能导读系统</h1>
    </div>

    <div class="main-container">
      <!-- 左侧：文件上传、列表和分析按钮 -->
      <div class="left-section">
        <div class="upload-header">
          <h3>文件上传</h3>
        </div>
        
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
            <div class="upload-buttons">
              <!-- 原有代码上传 -->
              <div class="upload-group">
                <h4>原有代码</h4>
                <input type="file" 
                       ref="originalFileInput" 
                       @change="handleOriginalSelect" 
                       multiple
                       accept=".js,.vue,.ts,.jsx,.tsx,.html,.css"
                       style="display: none">
                <button class="upload-button" @click="$refs.originalFileInput.click()">
                  上传原有代码
                </button>
                <span class="file-status" v-if="originalFiles.length">
                  已上传 {{ originalFiles.length }} 个文件
                </span>
              </div>

              <!-- 最新代码上传 -->
              <div class="upload-group">
                <h4>最新代码</h4>
                <input type="file"
                       ref="newFileInput"
                       @change="handleNewSelect"
                       multiple
                       accept=".js,.vue,.ts,.jsx,.tsx,.html,.css"
                       style="display: none">
                <button class="upload-button secondary" @click="$refs.newFileInput.click()">
                  上传最新代码
                </button>
                <span class="file-status" v-if="newFiles.length">
                  已上传 {{ newFiles.length }} 个文件
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分析按钮 -->
        <div class="analyze-button-container">
          <button class="analyze-button" 
                  @click="startAnalysis"
                  :disabled="!originalFiles.length || !newFiles.length || isAnalyzing">
            {{ isAnalyzing ? '分析中...' : '开始分析' }}
          </button>
        </div>

        <!-- 文件列表 -->
        <div class="file-lists" v-if="originalFiles.length || newFiles.length">
          <!-- 原有代码文件列表 -->
          <div class="file-list" v-if="originalFiles.length">
            <div class="file-list-header">
              <h3>原有代码文件</h3>
              <span class="file-count">{{ originalFiles.length }} 个文件</span>
            </div>
            <div class="file-list-container">
              <div v-for="(file, index) in originalFiles" 
                   :key="index"
                   class="file-item">
                <div class="file-info">
                  <span class="file-icon">{{ getFileIcon(file.name) }}</span>
                  <span class="file-name" :title="file.name">{{ file.name }}</span>
                </div>
                <button class="delete-button" 
                        @click="removeOriginalFile(index)"
                        title="删除文件">×</button>
              </div>
            </div>
          </div>

          <!-- 最新代码文件列表 -->
          <div class="file-list" v-if="newFiles.length">
            <div class="file-list-header">
              <h3>最新代码文件</h3>
              <span class="file-count">{{ newFiles.length }} 个文件</span>
            </div>
            <div class="file-list-container">
              <div v-for="(file, index) in newFiles" 
                   :key="index"
                   class="file-item">
                <div class="file-info">
                  <span class="file-icon">{{ getFileIcon(file.name) }}</span>
                  <span class="file-name" :title="file.name">{{ file.name }}</span>
                </div>
                <button class="delete-button" 
                        @click="removeNewFile(index)"
                        title="删除文件">×</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：分析结果 -->
      <div class="right-section" v-if="analysisResult">
        <div class="analysis-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-button', { active: currentTab === tab.id }]"
            @click="currentTab = tab.id">
            {{ tab.name }}
          </button>
        </div>

        <div class="analysis-content">
          <!-- 修改总结 -->
          <div v-if="currentTab === 'summary'" class="tab-content">
            <h3>修改总结</h3>
            <div class="summary-content" v-html="analysisResult.summary"></div>
          </div>

          <!-- 影响范围 -->
          <div v-if="currentTab === 'impact'" class="tab-content">
            <h3>影响范围分析</h3>
            <div class="impact-list">
              <div v-for="(impact, index) in analysisResult.impacts" 
                   :key="index"
                   class="impact-item">
                <p>{{ impact.description }}</p>
                <div class="affected-functions">
                  <span v-for="func in impact.functions" 
                        :key="func"
                        class="function-tag">
                    {{ func }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 风险评估 -->
          <div v-if="currentTab === 'risks'" class="tab-content">
            <h3>风险评估</h3>
            <div class="risk-list">
              <div v-for="(risk, index) in analysisResult.risks" 
                   :key="index"
                   :class="['risk-item', risk.level]">
                <p>{{ risk.description }}</p>
<!--                <div class="risk-suggestion" v-if="risk.suggestion">
                  <strong>建议：</strong>
                  <p>{{ risk.suggestion }}</p>
                </div>-->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      dragActive: false,
      originalFiles: [],
      newFiles: [],
      isAnalyzing: false,
      currentTab: 'summary',
      analysisResult: null,
      tabs: [
        { id: 'summary', name: '修改总结' },
        { id: 'impact', name: '影响范围' },
        { id: 'risks', name: '风险评估' }
      ]
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

    handleOriginalSelect(e) {
      const files = e.target.files;
      if (files) {
        const newFiles = Array.from(files).map(file => ({
          name: file.name,
          content: file,
          type: file.type
        }));
        
        const existingNames = new Set(this.originalFiles.map(f => f.name));
        const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
        
        this.originalFiles = [...this.originalFiles, ...uniqueNewFiles];
      }
      e.target.value = '';
    },

    handleNewSelect(e) {
      const files = e.target.files;
      if (files) {
        const newFiles = Array.from(files).map(file => ({
          name: file.name,
          content: file,
          type: file.type
        }));
        
        const existingNames = new Set(this.newFiles.map(f => f.name));
        const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
        
        this.newFiles = [...this.newFiles, ...uniqueNewFiles];
      }
      e.target.value = '';
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

      // 合并文件列表，避免重复
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

    async startAnalysis() {
      if (!this.originalFiles.length || !this.newFiles.length) {
        alert('请先上传原有代码和最新代码');
        return;
      }
      
      this.isAnalyzing = true;
      
      try {
        const formData = new FormData();
        
        // 添加原有代码文件
        this.originalFiles.forEach(file => {
          formData.append('originalFiles', file.content);
        });
        
        // 添加最新代码文件
        this.newFiles.forEach(file => {
          formData.append('newFiles', file.content);
        });
        
        const response = await fetch('http://localhost:3001/api/code_guide', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('分析请求失败');
        }
        
        const result = await response.json();
        
        // 更新分析结果
        this.analysisResult = {
          summary: result.summary,
          impacts: result.impacts,
          risks: result.risks
        };
        
        // 自动切换到第一个标签页
        this.currentTab = 'summary';
        
      } catch (error) {
        console.error('分析失败:', error);
        alert('分析失败: ' + error.message);
      } finally {
        this.isAnalyzing = false;
      }
    },

    removeOriginalFile(index) {
      this.originalFiles.splice(index, 1);
    },

    removeNewFile(index) {
      this.newFiles.splice(index, 1);
    },

    getFileIcon(fileName) {
      const ext = fileName.split('.').pop().toLowerCase();
      const icons = {
        js: '📜',
        vue: '🟢',
        ts: '📘',
        jsx: '⚛️',
        tsx: '⚛️',
        html: '🌐',
        css: '🎨',
        default: '📄'
      };
      return icons[ext] || icons.default;
    }
  }
}
</script>

<style>
body {
  background: #f5f5f7;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  max-width: 1400px;
  margin: 60px auto;
  padding: 40px;
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
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 50px;
}

.upload-section, .analysis-section {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08),
              0 4px 12px rgba(0, 0, 0, 0.04);
}

.upload-area {
  border: 2px dashed rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 24px;
}

.drag-active {
  border-color: #007AFF;
  background: rgba(0, 122, 255, 0.05);
}

.upload-icon {
  width: 64px;
  height: 64px;
  fill: #007AFF;
  margin-bottom: 24px;
}

.upload-buttons {
  display: flex;
  gap: 12px;
  flex-direction: column;
  width: 100%;
  max-width: 300px;
}

.upload-button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.upload-button.secondary {
  background: transparent;
  border: 2px solid #007AFF;
  color: #007AFF;
}

.file-list {
  margin-top: 40px;
  text-align: left;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16px;
  padding: 20px;
}

.file-list h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-count {
  font-size: 14px;
  color: #999;
  font-weight: normal;
}

.file-list-container {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
  padding: 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin-bottom: 8px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(2px);
}

.file-name {
  font-size: 14px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.delete-button {
  background: none;
  border: none;
  color: #ff3b30;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.delete-button:hover {
  opacity: 1;
  background: rgba(255, 59, 48, 0.1);
}

.analysis-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: 16px;
  color: #666;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button.active {
  background: #007AFF;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.impact-item, .risk-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.function-tag {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  border-radius: 6px;
  margin: 6px;
  font-size: 14px;
}

.analyze-button {
  padding: 16px 40px;
  font-size: 18px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
  min-width: 160px;
}

.analyze-button:hover:not(:disabled) {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.3);
}

.analyze-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  body {
    background: #000000;
  }

  .title {
    color: #ffffff;
  }

  .upload-section, .analysis-section {
    background: rgba(30, 30, 30, 0.8);
  }

  .upload-area {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .file-item {
    background: rgba(255, 255, 255, 0.05);
  }

  .file-list-container {
    background: rgba(255, 255, 255, 0.05);
  }

  .impact-item, .risk-item {
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-button {
    color: #999;
  }

  .function-tag {
    background: rgba(0, 122, 255, 0.2);
  }
}

/* 添加响应式布局 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .container {
    padding: 24px;
    margin: 40px auto;
  }
}

/* 分析结果区域滚动条样式 */
.analysis-content {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 16px;
}

/* 自定义滚动条样式 */
.file-list-container::-webkit-scrollbar,
.analysis-content::-webkit-scrollbar {
  width: 8px;
}

.file-list-container::-webkit-scrollbar-track,
.analysis-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.file-list-container::-webkit-scrollbar-thumb,
.analysis-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: background 0.3s;
}

.file-list-container::-webkit-scrollbar-thumb:hover,
.analysis-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 深色模式滚动条样式 */
@media (prefers-color-scheme: dark) {
  .file-list-container::-webkit-scrollbar-track,
  .analysis-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.03);
  }

  .file-list-container::-webkit-scrollbar-thumb,
  .analysis-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }

  .file-list-container::-webkit-scrollbar-thumb:hover,
  .analysis-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.main-container {
  display: grid;
  grid-template-columns: 500px 1fr; /* 增加左侧宽度 */
  gap: 32px;
  padding: 0 40px;
  height: calc(100vh - 120px);
  margin-top: 20px;
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 24px; /* 增加间距 */
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px; /* 增加内边距 */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.analyze-button-container {
  padding: 0; /* 移除内边距 */
}

.analyze-button {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.analyze-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.3);
}

.analyze-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

.right-section {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .left-section,
  .right-section {
    background: rgba(30, 30, 30, 0.8);
  }
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .main-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-buttons {
  display: flex;
  gap: 12px;
  flex-direction: column;
  width: 100%;
  max-width: 300px;
}

.upload-button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.upload-button.secondary {
  background: transparent;
  border: 2px solid #007AFF;
  color: #007AFF;
}

.file-list-container {
  flex: 1;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  padding: 12px;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .upload-area {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .upload-button.secondary {
    border-color: #0A84FF;
    color: #0A84FF;
  }

  .file-list-container {
    background: rgba(255, 255, 255, 0.05);
  }
}

.header {
  text-align: center;
  padding: 20px 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .left-section, .right-section {
    background: rgba(30, 30, 30, 0.8);
  }

  .header {
    background: rgba(30, 30, 30, 0.8);
  }
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .main-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    height: auto;
  }

  .analyze-button {
    transform: none;
  }

  .analyze-button:hover:not(:disabled) {
    transform: translateY(-5px);
  }
}

/* 添加新的样式 */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.upload-header {
  padding: 0 20px;
}

.upload-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.upload-area {
  padding: 24px;
  border: 2px dashed rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  margin: 0 20px;
}

.file-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 重要：允许内容滚动 */
}

.file-list-header {
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.file-list-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.file-count {
  font-size: 14px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 12px;
}

.file-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.file-item:hover {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0; /* 重要：允许文本截断 */
}

.file-icon {
  font-size: 16px;
}

.file-name {
  font-size: 14px;
  color: #333;
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
  padding: 4px 8px;
  border-radius: 8px;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.delete-button:hover {
  opacity: 1;
  background: rgba(255, 59, 48, 0.1);
}

/* 自定义滚动条 */
.file-list-container::-webkit-scrollbar {
  width: 6px;
}

.file-list-container::-webkit-scrollbar-track {
  background: transparent;
}

.file-list-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.file-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .upload-header h3,
  .file-list-header h3 {
    color: #fff;
  }

  .file-count {
    background: rgba(255, 255, 255, 0.1);
    color: #999;
  }

  .file-item {
    background: rgba(255, 255, 255, 0.1);
  }

  .file-item:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .file-name {
    color: #fff;
  }

  .delete-button:hover {
    background: rgba(255, 59, 48, 0.2);
  }
}

/* 修改主容器布局 */
.main-container {
  display: grid;
  grid-template-columns: 500px 1fr; /* 增加左侧宽度 */
  gap: 32px;
  padding: 0 40px;
  height: calc(100vh - 120px);
  margin-top: 20px;
}

/* 左侧区域样式调整 */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 24px; /* 增加间距 */
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px; /* 增加内边距 */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

/* 上传区域样式调整 */
.upload-area {
  padding: 24px;
  border: 2px dashed rgba(0, 0, 0, 0.1);
  border-radius: 16px;
}

/* 分析按钮容器调整 */
.analyze-button-container {
  padding: 0; /* 移除内边距 */
}

.analyze-button {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

/* 文件列表样式调整 */
.file-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.file-list-container {
  flex: 1;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  padding: 12px;
}

.file-item {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .file-list-container {
    background: rgba(255, 255, 255, 0.05);
  }

  .file-item {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* 响应式布局调整 */
@media (max-width: 1400px) {
  .main-container {
    grid-template-columns: 450px 1fr;
  }
}

@media (max-width: 1200px) {
  .main-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

/* 添加新的样式 */
.upload-group {
  text-align: center;
  margin-bottom: 20px;
}

.upload-group h4 {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.upload-button.original {
  background: #34C759;
}

.upload-button.new {
  background: #007AFF;
}

.file-status {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.file-lists {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .upload-group h4 {
    color: #999;
  }

  .file-status {
    color: #999;
  }
}

/* 修改按钮样式为极简风格 */
.upload-group {
  text-align: center;
  margin-bottom: 24px;
}

.upload-group h4 {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.upload-button {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.upload-button.secondary {
  background: transparent;
  border: 1.5px solid #007AFF;
  color: #007AFF;
  box-shadow: none;
}

.upload-button.secondary:hover {
  background: rgba(0, 122, 255, 0.05);
}

.file-status {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.file-lists {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .upload-group h4 {
    color: #999;
  }

  .file-status {
    color: #999;
  }

  .upload-button.secondary {
    border-color: #0A84FF;
    color: #0A84FF;
  }

  .upload-button.secondary:hover {
    background: rgba(10, 132, 255, 0.1);
  }
}
</style>

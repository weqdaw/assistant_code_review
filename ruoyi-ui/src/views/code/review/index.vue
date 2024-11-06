<template>
  <div id="app">
    <div class="github-manager">
      <!-- 添加仓库导入部分 -->
      <div class="repo-import" v-if="!repoInfo.name">
        <h2>导入GitHub仓库</h2>
        <div class="import-form">
          <input 
            v-model="repoUrl" 
            placeholder="请输入GitHub仓库地址 (例如: https://github.com/owner/repo)" 
            @keyup.enter="importRepo"
          />
          <button @click="importRepo" :disabled="importing">
            {{ importing ? '导入中...' : '导入仓库' }}
          </button>
        </div>
        <p class="error-message" v-if="importError">{{ importError }}</p>
      </div>

      <!-- 其他内容只在导入仓库后显示 -->
      <template v-if="repoInfo.name">
        <!-- 添加返回按钮 -->
        <div class="header-actions">
          <button class="secondary-btn" @click="resetRepo">切换仓库</button>
        </div>
        
        <!-- 原有的项目概览部分 -->
        <div class="project-overview">
          <h2>项目概览</h2>
          <div class="info-card">
            <div class="info-item">
              <span class="label">仓库名称：</span>
              <span>{{ repoInfo.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">描述：</span>
              <span>{{ repoInfo.description }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span>{{ formatDate(repoInfo.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">维护人员：</span>
              <div class="maintainers">
                <span v-for="maintainer in repoInfo.maintainers" 
                      :key="maintainer.id" 
                      class="maintainer">
                  {{ maintainer.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 添加文件浏览部分 -->
        <div class="files-section">
          <h2>文件浏览</h2>
          <div class="file-explorer">
            <!-- 文件路径导航 -->
            <div class="file-path">
              <span 
                v-for="(part, index) in currentPath" 
                :key="index"
                @click="navigateToPath(index)"
                class="path-part"
              >
                {{ part || '根目录' }} /
              </span>
            </div>

            <!-- 文件列表和内容并排显示 -->
            <div class="file-container">
              <!-- 左侧文件列表 -->
              <div class="file-list">
                <div 
                  v-for="file in files" 
                  :key="file.path"
                  class="file-item"
                  :class="{ active: selectedFile && selectedFile.path === file.path }"
                  @click="handleFileClick(file)"
                >
                  <span class="file-icon">{{ file.type === 'dir' ? '📁' : '📄' }}</span>
                  <span class="file-name">{{ file.name }}</span>
                </div>
              </div>

              <!-- 右侧文件内容 -->
              <div class="file-content" v-if="selectedFile">
                <div class="content-header">
                  <h3>{{ selectedFile.name }}</h3>
                  <div class="file-info">
                    <span>{{ formatFileSize(selectedFile.size) }}</span>
                    <button class="close-btn" @click="closeFile">关闭</button>
                  </div>
                </div>
                <div class="content-body">
                  <pre v-if="fileContent" class="code-content">{{ fileContent }}</pre>
                  <div v-else class="loading">加载中...</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签管理部分 -->
        <div class="label-management">
          <h2>标签管理</h2>
          <div class="labels-container">
            <div class="create-label">
              <input v-model="newLabel.name" placeholder="标签名称" />
              <input v-model="newLabel.color" type="color" />
              <button @click="createLabel">创建标签</button>
            </div>
            <div class="labels-list">
              <div v-for="label in labels" 
                   :key="label.id" 
                   class="label-item"
                   :style="{ backgroundColor: '#' + label.color }">
                {{ label.name }}
                <span class="delete-label" @click="deleteLabel(label.id)">×</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 仓库设置部分 -->
        <div class="repo-settings">
          <h2>仓库设置</h2>
          <div class="settings-form">
            <div class="form-item">
              <label>仓库名称</label>
              <input v-model="settings.name" />
            </div>
            <div class="form-item">
              <label>描述</label>
              <textarea v-model="settings.description"></textarea>
            </div>
            <button @click="saveSettings">保存设置</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { GITHUB_TOKEN } from './config'

// 修改 axios 配置部分
const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

export default {
  name: 'App',
  data() {
    return {
      repoUrl: '',
      importing: false,
      importError: '',
      repoInfo: {
        name: '',
        description: '',
        created_at: '',
        maintainers: [],
        owner: '',
        repo: ''
      },
      labels: [],
      newLabel: {
        name: '',
        color: '#000000'
      },
      settings: {
        name: '',
        description: ''
      },
      currentPath: ['根目录'],
      files: [],
      selectedFile: null,
      fileContent: null
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString('zh-CN')
    },
    async importRepo() {
      this.importing = true
      this.importError = ''
      
      try {
        const urlPattern = /github\.com\/([^/]+)\/([^/]+)/
        const matches = this.repoUrl.match(urlPattern)
        
        if (!matches) {
          throw new Error('请输入有效的GitHub仓库地址')
        }

        const [, owner, repo] = matches
        
        console.log('正在请求仓库信息...', owner, repo)
        
        try {
          const response = await githubApi.get(`/repos/${owner}/${repo}`)
          console.log('仓库信息响应:', response.data)
          const repoData = response.data
          
          console.log('正在获取贡献者信息...')
          const contributors = await githubApi.get(`/repos/${owner}/${repo}/contributors`)
          console.log('贡献者信息:', contributors.data)
          
          this.repoInfo = {
            name: repoData.name,
            description: repoData.description,
            created_at: repoData.created_at,
            maintainers: contributors.data.slice(0, 5).map(user => ({  // 只显示前5个贡献者
              id: user.id,
              name: user.login
            })),
            owner,
            repo
          }
          
          const labels = await githubApi.get(`/repos/${owner}/${repo}/labels`)
          this.labels = labels.data.map(label => ({
            id: label.id,
            name: label.name,
            color: label.color
          }))
          
          this.settings.name = repoData.name
          this.settings.description = repoData.description
          
        } catch (error) {
          console.error('API请求错误:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
          })
          throw error
        }
        
      } catch (error) {
        console.error('完整错误信息:', error)
        if (error.response?.status === 404) {
          this.importError = '找不到该仓库，请确认仓库地址是否正确或是否为私有仓库'
        } else if (error.response?.status === 401) {
          this.importError = 'Token认证失败，请确保Token有效'
        } else if (error.response?.status === 403) {
          this.importError = '访问受限，请确保Token有效且具有足够权限'
        } else {
          this.importError = error.response?.data?.message || error.message || '导入仓库失败'
        }
      } finally {
        this.importing = false
      }
    },
    
    resetRepo() {
      this.repoInfo = {
        name: '',
        description: '',
        created_at: '',
        maintainers: [],
        owner: '',
        repo: ''
      }
      this.labels = []
      this.settings = {
        name: '',
        description: ''
      }
      this.repoUrl = ''
      this.importError = ''
    },
    
    async createLabel() {
      try {
        const response = await githubApi.post(
          `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/labels`,
          {
            name: this.newLabel.name,
            color: this.newLabel.color.substring(1)
          }
        )
        this.labels.push({
          id: response.data.id,
          name: response.data.name,
          color: response.data.color
        })
        this.newLabel.name = ''
        this.newLabel.color = '#000000'
      } catch (error) {
        console.error('创建标签失败:', error)
      }
    },
    
    deleteLabel(id) {
      // TODO: 实现删除标签的API调用
      console.log('删除标签:', id)
    },
    
    saveSettings() {
      // TODO: 实现保存设置的API调用
      console.log('保存设置:', this.settings)
    },

    async fetchFiles(path = '') {
      try {
        const response = await githubApi.get(
          `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/contents/${path}`
        )
        this.files = response.data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type,
          size: item.size,
          url: item.download_url
        })).sort((a, b) => {
          // 目录排在前面
          if (a.type === 'dir' && b.type !== 'dir') return -1
          if (a.type !== 'dir' && b.type === 'dir') return 1
          return a.name.localeCompare(b.name)
        })
      } catch (error) {
        console.error('获取文件列表失败:', error)
      }
    },

    async handleFileClick(file) {
      if (file.type === 'dir') {
        // 处理目录点击
        const pathParts = file.path.split('/')
        this.currentPath = ['根目录', ...pathParts]
        await this.fetchFiles(file.path)
      } else {
        // 处理文件点击
        this.selectedFile = file
        await this.fetchFileContent(file)
      }
    },

    async fetchFileContent(file) {
      this.fileContent = null // 重置内容，显示加载状态
      try {
        // 对于大文件，使用 raw 内容 URL
        const contentResponse = await githubApi.get(`/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/contents/${file.path}`)
        
        // 获取文件的 raw 内容
        if (contentResponse.data.encoding === 'base64') {
          // 如果内容是 base64 编码的，需要解码
          this.fileContent = atob(contentResponse.data.content)
        } else {
          // 如果不是 base64 编码，直接使用内容
          this.fileContent = contentResponse.data.content
        }
      } catch (error) {
        console.error('获取文件内容失败:', error)
        if (error.response?.status === 403) {
          this.fileContent = '文件太大，无法显示内容'
        } else {
          this.fileContent = '无法加载文件内容'
        }
      }
    },

    navigateToPath(index) {
      if (index === 0) {
        // 点击根目录
        this.currentPath = ['根目录']
        this.fetchFiles('')
      } else {
        // 导航到指定路径
        this.currentPath = this.currentPath.slice(0, index + 1)
        const path = this.currentPath.slice(1).join('/')
        this.fetchFiles(path)
      }
      this.closeFile()
    },

    closeFile() {
      this.selectedFile = null
      this.fileContent = null
    },

    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  },
  watch: {
    // 当仓库信息加载完成后自动加载根目录文件
    'repoInfo.name'(newVal) {
      if (newVal) {
        this.fetchFiles('')
      }
    }
  },
  created() {
    // 移除自动获取仓库信息的调用
    // this.fetchRepoInfo()
  }
}
</script>

<style>
.github-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.project-overview, .label-management, .repo-settings {
  margin-bottom: 30px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.info-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.info-item {
  margin-bottom: 10px;
}

.label {
  font-weight: bold;
  margin-right: 10px;
}

.maintainers {
  display: inline-flex;
  gap: 10px;
}

.maintainer {
  background: #e1e4e8;
  padding: 2px 8px;
  border-radius: 12px;
}

.labels-container {
  margin-top: 15px;
}

.create-label {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.labels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.label-item {
  padding: 5px 10px;
  border-radius: 4px;
  color: white;
  display: flex;
  align-items: center;
}

.delete-label {
  margin-left: 5px;
  cursor: pointer;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

input, textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #0366d6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0255b3;
}

.repo-import {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.import-form {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.import-form input {
  flex: 1;
  min-width: 300px;
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  font-size: 14px;
}

.header-actions {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.secondary-btn {
  background: #6c757d;
}

.secondary-btn:hover {
  background: #5a6268;
}

/* 添加文件浏览相关的样式 */
.files-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.file-explorer {
  margin-top: 15px;
}

.file-path {
  padding: 10px;
  background: #f6f8fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.path-part {
  cursor: pointer;
  color: #0366d6;
  margin-right: 5px;
}

.path-part:hover {
  text-decoration: underline;
}

.file-container {
  display: flex;
  gap: 20px;
  min-height: 400px;
}

.file-list {
  flex: 0 0 300px;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  overflow-y: auto;
}

.file-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #e1e4e8;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background: #f6f8fa;
}

.file-item.active {
  background: #f1f8ff;
}

.file-icon {
  margin-right: 10px;
}

.file-content {
  flex: 1;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.content-header {
  padding: 10px;
  background: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.content-body {
  flex: 1;
  overflow: auto;
  padding: 15px;
}

.code-content {
  margin: 0;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.close-btn {
  padding: 4px 8px;
  font-size: 12px;
}
</style>

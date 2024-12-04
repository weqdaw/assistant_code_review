<template>
  <div class="project-dashboard">
    <!-- 左侧主要内容区 -->
    <div class="main-content">
      <!-- 项目列表 -->
      <el-card class="project-list-card">
        <div slot="header" class="card-header">
          <span>导入的仓库</span>
        </div>
        
        <el-table :data="projects" style="width: 100%">
          <el-table-column label="仓库信息" min-width="300">
            <template slot-scope="scope">
              <div class="repo-info">
                <div class="repo-name">
                  <el-link type="primary" @click="selectProject(scope.row)">
                    {{ scope.row.name }}
                  </el-link>
                </div>
                <div class="repo-description">{{ scope.row.description }}</div>
                <div class="repo-meta">
                  <span v-if="scope.row.language" class="meta-item">
                    <span class="language-dot" :style="{ backgroundColor: getLanguageColor(scope.row.language) }"></span>
                    {{ scope.row.language }}
                  </span>
                  <span class="meta-item">
                    <i class="el-icon-star-on"></i>
                    {{ scope.row.stars || 0 }}
                  </span>
                  <span class="meta-item">
                    <i class="el-icon-share"></i>
                    {{ scope.row.forks || 0 }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="owner" label="所有者" width="120"></el-table-column>
          <el-table-column label="操作" width="150">
            <template slot-scope="scope">
              <el-button-group>
                <el-button 
                  size="mini" 
                  type="primary" 
                  icon="el-icon-view"
                  @click="selectProject(scope.row)">
                </el-button>
                <el-button 
                  size="mini" 
                  type="danger" 
                  icon="el-icon-delete"
                  @click="removeProject(scope.row)">
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 仓库内容浏览 -->
      <el-card v-if="repoContents.length" class="repo-contents-card">
        <div slot="header" class="card-header">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item @click.native="fetchRepoContents(selectedProject.owner, selectedProject.repo)">
                {{ selectedProject.name }}
              </el-breadcrumb-item>
              <el-breadcrumb-item 
                v-for="crumb in breadcrumbs" 
                :key="crumb.path"
                @click.native="navigateTo(crumb)">
                {{ crumb.name }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <el-table 
          :data="repoContents"
          v-loading="loading"
          style="width: 100%">
          <el-table-column label="名称">
            <template slot-scope="scope">
              <div class="file-info">
                <i :class="getFileIcon(scope.row)" style="margin-right: 8px"></i>
                <el-link 
                  type="primary" 
                  @click="viewFile(scope.row)">
                  {{ scope.row.name }}
                </el-link>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="100">
            <template slot-scope="scope">
              {{ formatSize(scope.row.size) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 右侧工具栏 -->
    <div class="sidebar">
      <!-- 导入功能 -->
      <el-card class="github-import-card">
        <div slot="header">
          <span>导入GitHub仓库</span>
        </div>
        <div class="import-form">
          <el-input 
            v-model="repoUrl" 
            placeholder="请输入GitHub仓库地址"
            @keyup.enter="importRepo">
          </el-input>
          <el-button 
            type="primary" 
            :loading="importing" 
            @click="importRepo"
            style="margin-top: 10px; width: 100%">
            {{ importing ? '导入中...' : '导入仓库' }}
          </el-button>
        </div>
        <div class="error-message" v-if="importError">
          {{ importError }}
        </div>
      </el-card>

      <!-- 上传功能 -->
      <el-card class="git-upload-card">
        <div slot="header">
          <span>上传到仓库</span>
        </div>
        <div class="upload-form">
          <el-form :model="uploadForm" label-width="80px" size="small">
            <el-form-item label="目标路径">
              <el-input 
                v-model="uploadForm.path" 
                placeholder="例如: docs/example.txt">
              </el-input>
            </el-form-item>
            <el-form-item label="文件内容">
              <el-upload
                class="upload-content"
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :show-file-list="false">
                <el-button size="small" type="primary">选择文件</el-button>
                <span class="file-name" v-if="uploadForm.file">
                  {{ uploadForm.file.name }}
                </span>
              </el-upload>
            </el-form-item>
            <el-form-item label="提交信息">
              <el-input 
                type="textarea" 
                v-model="uploadForm.message"
                :rows="2"
                placeholder="描述此次更改">
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                :loading="uploading"
                @click="uploadToRepo"
                style="width: 100%">
                {{ uploading ? '上传中...' : '上传到仓库' }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>

    <!-- 文件内容查看对话框 -->
    <el-dialog 
      :title="selectedFile ? selectedFile.name : ''"
      :visible.sync="showFileDialog"
      width="80%"
      :fullscreen="true">
      <div v-loading="loading">
        <codemirror
          v-if="fileContent"
          v-model="fileContent"
          :options="cmOptions"
          class="code-editor">
        </codemirror>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { formatDate } from '@/utils/index'
import axios from 'axios'
import VueCodemirror from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/xml/xml.js'
import 'codemirror/mode/markdown/markdown.js'
import 'codemirror/mode/python/python.js'
import 'codemirror/mode/clike/clike.js'
import 'codemirror/mode/php/php.js'
import 'codemirror/mode/ruby/ruby.js'
import 'codemirror/mode/shell/shell.js'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/mode/sql/sql.js'
import { GITHUB_CONFIG } from './config'

export default {
  name: 'ProjectDashboard',
  components: {
    codemirror: VueCodemirror.codemirror
  },
  data() {
    return {
      projects: [],
      selectedProject: null,
      repoUrl: '',
      importing: false,
      importError: '',
      repoContents: [],
      currentPath: '',
      fileContent: null,
      breadcrumbs: [],
      loading: false,
      selectedFile: null,
      showFileDialog: false,
      cmOptions: {
        tabSize: 2,
        mode: 'text/javascript',
        theme: 'monokai',
        lineNumbers: true,
        line: true,
        readOnly: true
      },
      uploadForm: {
        path: '',
        file: null,
        message: '',
        content: null
      },
      uploading: false
    }
  },
  created() {
    // 添加示例项目
    this.projects = [
      {
        id: 1,
        name: 'vue',
        owner: 'vuejs',
        repo: 'vue',
        description: 'Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web.',
        language: 'JavaScript',
        stars: 203000,
        forks: 33400,
        watchers: 203000,
        updatedAt: new Date('2024-01-15'),
        defaultBranch: 'main',
        size: 28740
      },
      {
        id: 2,
        name: 'vscode',
        owner: 'microsoft',
        repo: 'vscode',
        description: 'Visual Studio Code is a code editor redefined and optimized for building and debugging modern web and cloud applications.',
        language: 'TypeScript',
        stars: 154000,
        forks: 27800,
        watchers: 154000,
        updatedAt: new Date('2024-01-16'),
        defaultBranch: 'main',
        size: 178900
      },
      {
        id: 3,
        name: 'react',
        owner: 'facebook',
        repo: 'react',
        description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
        language: 'JavaScript',
        stars: 215000,
        forks: 45600,
        watchers: 215000,
        updatedAt: new Date('2024-01-14'),
        defaultBranch: 'main',
        size: 165400
      }
    ];
  },
  methods: {
    formatDate,
    async importRepo() {
      try {
        this.importing = true;
        this.importError = '';

        const repoUrl = this.repoUrl;
        const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
        if (!match) {
          throw new Error('无效的GitHub仓库地址');
        }

        const [, owner, repo] = match;
        const repoName = repo.replace('.git', '');

        // 创建axios实例，添加重试配置
        const github = axios.create({
          baseURL: 'https://api.github.com',
          timeout: 10000,
          headers: {
            'Authorization': `token ${GITHUB_CONFIG.defaultToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        // 添加重试拦截
        github.interceptors.response.use(null, async (error) => {
          if (error.response?.status === 403) {
            this.$message.error('API请求次数超限，请稍后再试');
            return Promise.reject(error);
          }
          
          if (error.code === 'ECONNRESET' || error.code === 'ECONNABORTED') {
            // 重试请求
            try {
              const response = await axios.get(`https://api.github.com/repos/${owner}/${repoName}`, {
                headers: {
                  'Authorization': `token ${GITHUB_CONFIG.defaultToken}`,
                  'Accept': 'application/vnd.github.v3+json'
                },
                timeout: 15000 // 增加超时时间
              });
              return response;
            } catch (retryError) {
              console.error('Retry failed:', retryError);
              return Promise.reject(retryError);
            }
          }
          
          return Promise.reject(error);
        });

        // 获取仓库信息
        const response = await github.get(`/repos/${owner}/${repoName}`);

        // 添加到项目列表
        this.projects.unshift({
          id: Date.now(),
          name: repoName,
          description: response.data.description,
          language: response.data.language,
          stars: response.data.stargazers_count,
          forks: response.data.forks_count,
          watchers: response.data.watchers_count,
          updatedAt: new Date(response.data.updated_at),
          owner,
          repo: repoName,
          defaultBranch: response.data.default_branch,
          size: response.data.size,
          license: response.data.license?.name
        });

        this.$message.success('导入成功');
        this.repoUrl = '';
      } catch (error) {
        console.error('Import Error:', error);
        let errorMessage = '导入失败';
        
        if (error.response) {
          switch (error.response.status) {
            case 404:
              errorMessage = '仓库不存在或无法访问';
              break;
            case 403:
              errorMessage = 'API请求次数超限，请稍后再试';
              break;
            case 401:
              errorMessage = 'Token无效或已过期';
              break;
            default:
              errorMessage = error.response.data?.message || '导入失败';
          }
        } else if (error.code === 'ECONNRESET') {
          errorMessage = '网络连接重置，请重试';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = '请求超时，请重试';
        }
        
        this.importError = errorMessage;
        this.$message.error(errorMessage);
      } finally {
        this.importing = false;
      }
    },

    async selectProject(project) {
      this.selectedProject = project;
      await this.fetchRepoContents(project.owner, project.repo);
    },

    async fetchRepoContents(owner, repo, path = '') {
      try {
        this.loading = true;
        const response = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            headers: {
              'Authorization': `token ${GITHUB_CONFIG.defaultToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        
        this.repoContents = response.data.map(item => ({
          ...item,
          owner,
          repo
        }));
        this.currentPath = path;
        this.updateBreadcrumbs(path);
      } catch (error) {
        this.$message.error('获取仓库内容失败');
      } finally {
        this.loading = false;
      }
    },

    async viewFile(file) {
      try {
        this.loading = true;
        if (file.type === 'dir') {
          await this.fetchRepoContents(file.owner, file.repo, file.path);
        } else {
          // 使用 GitHub API 直接获取文件内容
          const response = await axios.get(
            `https://api.github.com/repos/${file.owner}/${file.repo}/contents/${file.path}`,
            {
              headers: {
                'Authorization': `token ${GITHUB_CONFIG.defaultToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );

          // 解码 base64 内容
          if (response.data.content) {
            this.fileContent = atob(response.data.content.replace(/\n/g, ''));
          }

          // 设置编辑器语言模式
          const extension = file.name.split('.').pop().toLowerCase();
          this.cmOptions = {
            ...this.cmOptions,
            mode: this.getLanguageMode(extension),
            readOnly: true
          };

          this.selectedFile = file;
          this.showFileDialog = true;
        }
      } catch (error) {
        console.error('File Error:', error);
        let errorMessage = '获取文件内容失败';
        if (error.response) {
          switch (error.response.status) {
            case 401:
              errorMessage = 'Token无效或已过期';
              break;
            case 403:
              errorMessage = 'Token权限不足';
              break;
            case 404:
              errorMessage = '文件不存在或无法访问';
              break;
            default:
              errorMessage = error.response.data?.message || '获取文件内容失败';
          }
        }
        this.$message.error(errorMessage);
      } finally {
        this.loading = false;
      }
    },

    updateBreadcrumbs(path) {
      const parts = path.split('/').filter(Boolean);
      this.breadcrumbs = parts.map((part, index) => ({
        name: part,
        path: parts.slice(0, index + 1).join('/')
      }));
    },

    navigateTo(breadcrumb) {
      this.fetchRepoContents(
        this.selectedProject.owner,
        this.selectedProject.repo,
        breadcrumb.path
      );
    },

    removeProject(project) {
      this.$confirm('确定要移除该仓库吗？', '提示', {
        type: 'warning'
      }).then(() => {
        const index = this.projects.findIndex(p => p.id === project.id);
        if (index > -1) {
          this.projects.splice(index, 1);
        }
        if (this.selectedProject?.id === project.id) {
          this.selectedProject = null;
          this.repoContents = [];
        }
        this.$message.success('移除成功');
      });
    },

    getFileIcon(file) {
      if (file.type === 'dir') return 'el-icon-folder';
      
      const extension = file.name.split('.').pop().toLowerCase();
      const iconMap = {
        js: 'el-icon-tickets',
        ts: 'el-icon-tickets',
        vue: 'el-icon-tickets',
        json: 'el-icon-document',
        md: 'el-icon-document',
        txt: 'el-icon-document',
        jpg: 'el-icon-picture',
        png: 'el-icon-picture',
        gif: 'el-icon-picture'
      };
      
      return iconMap[extension] || 'el-icon-document';
    },

    getLanguageMode(extension) {
      const modeMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'text/typescript',
        'tsx': 'text/typescript',
        'vue': 'text/x-vue',
        'json': 'application/json',
        'md': 'text/markdown',
        'html': 'text/html',
        'htm': 'text/html',
        'xml': 'text/xml',
        'css': 'text/css',
        'scss': 'text/x-scss',
        'less': 'text/x-less',
        'py': 'python',
        'java': 'text/x-java',
        'php': 'text/x-php',
        'go': 'text/x-go',
        'rs': 'text/x-rustsrc',
        'rb': 'ruby',
        'sh': 'shell',
        'yml': 'yaml',
        'yaml': 'yaml',
        'sql': 'text/x-sql',
        'txt': 'text/plain'
      };
      return modeMap[extension] || 'text/plain';
    },

    formatSize(size) {
      if (!size) return '-';
      if (size < 1024) return size + ' B';
      if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    },

    // 获取编程语言对应的颜色
    getLanguageColor(language) {
      const colors = {
        JavaScript: '#f1e05a',
        TypeScript: '#2b7489',
        Python: '#3572A5',
        Java: '#b07219',
        Go: '#00ADD8',
        Vue: '#41b883',
        HTML: '#e34c26',
        CSS: '#563d7c',
        Ruby: '#701516',
        PHP: '#4F5D95'
      };
      return colors[language] || '#858585';
    },

    // 打开 GitHub 仓库页面
    openGithub(project) {
      window.open(`https://github.com/${project.owner}/${project.repo}`, '_blank');
    },

    handleFileChange(file) {
      this.uploadForm.file = file.raw;
      // 读取文件内容
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadForm.content = btoa(e.target.result); // 转换为base64
      };
      reader.readAsBinaryString(file.raw);
    },

    async uploadToRepo() {
      if (!this.selectedProject) {
        this.$message.warning('请先选择一个仓库');
        return;
      }

      if (!this.uploadForm.path || !this.uploadForm.content || !this.uploadForm.message) {
        this.$message.warning('请填写完整信息');
        return;
      }

      try {
        this.uploading = true;

        // 检查文件是否已存在
        let existingFile;
        try {
          const response = await axios.get(
            `https://api.github.com/repos/${this.selectedProject.owner}/${this.selectedProject.repo}/contents/${this.uploadForm.path}`,
            {
              headers: {
                'Authorization': `token ${GITHUB_CONFIG.defaultToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );
          existingFile = response.data;
        } catch (error) {
          if (error.response?.status !== 404) {
            throw error;
          }
        }

        // 创建或更新文件
        await axios.put(
          `https://api.github.com/repos/${this.selectedProject.owner}/${this.selectedProject.repo}/contents/${this.uploadForm.path}`,
          {
            message: this.uploadForm.message,
            content: this.uploadForm.content,
            sha: existingFile?.sha // 如果文件存在，需要提供sha
          },
          {
            headers: {
              'Authorization': `token ${GITHUB_CONFIG.defaultToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        this.$message.success('上传成功');
        // 清空表单
        this.uploadForm = {
          path: '',
          file: null,
          message: '',
          content: null
        };
        // 刷新当前目录
        if (this.currentPath) {
          await this.fetchRepoContents(
            this.selectedProject.owner,
            this.selectedProject.repo,
            this.currentPath
          );
        }
      } catch (error) {
        console.error('Upload Error:', error);
        this.$message.error(error.response?.data?.message || '上传失败');
      } finally {
        this.uploading = false;
      }
    },

    // 判断是否为API文件
    isApiFile(file) {
      return file.name.toLowerCase().endsWith('.api.js') || 
             file.name.toLowerCase().endsWith('.api.ts') ||
             file.name.toLowerCase().includes('api') ||
             file.name.toLowerCase().includes('controller');
    },

    // 从文件名中获取请求方法
    getMethodFromFileName(fileName) {
      const methodMap = {
        'get': 'GET',
        'post': 'POST',
        'put': 'PUT',
        'delete': 'DELETE',
        'patch': 'PATCH'
      };

      const lowerFileName = fileName.toLowerCase();
      for (const [key, value] of Object.entries(methodMap)) {
        if (lowerFileName.includes(key)) {
          return value;
        }
      }
      return 'GET'; // 默认为 GET
    }
  }
}
</script>

<style scoped>
.project-dashboard {
  display: flex;
  min-height: calc(100vh - 50px);
  background-color: #f5f7fa;
  padding: 16px;
  gap: 16px;
  overflow: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: fit-content;
}

.project-list-card,
.repo-contents-card,
.github-import-card,
.git-upload-card {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.repo-contents-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 600px;
  overflow: auto;
}

.repo-contents-card .el-card__body {
  flex: 1;
  overflow: auto;
  padding: 0;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.code-editor {
  height: calc(100vh - 200px);
  overflow: auto;
}

/* 其他样式保持不变... */
</style>

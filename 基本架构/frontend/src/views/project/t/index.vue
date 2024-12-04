<template>
  <div class="api-tester">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <el-tabs v-model="sidebarTab" class="sidebar-tabs">
          <el-tab-pane label="历史" name="history">
            <div class="history-list">
              <div v-for="(item, index) in requestHistory" 
                   :key="index" 
                   class="history-item"
                   :class="{ active: selectedHistoryIndex === index }"
                   @click="loadHistory(item, index)">
                <div class="method-badge" :class="item.method.toLowerCase()">
                  {{ item.method }}
                </div>
                <div class="history-url">{{ item.url }}</div>
                <el-button 
                  class="favorite-btn" 
                  :icon="item.isFavorite ? 'el-icon-star-on' : 'el-icon-star-off'"
                  @click.stop="toggleFavorite(index)">
                </el-button>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="收藏" name="favorites">
            <!-- 收藏列表，结构类似历史记录 -->
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 环境选择器 -->
      <div class="environment-bar">
        <el-select v-model="currentEnv" size="small" class="env-select">
          <el-option
            v-for="env in environments"
            :key="env.name"
            :label="env.name"
            :value="env.name">
          </el-option>
        </el-select>
        <el-dropdown @command="handleImport" trigger="click">
          <el-button type="primary" size="small">
            导入 <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="swagger">Swagger</el-dropdown-item>
            <el-dropdown-item command="postman">Postman</el-dropdown-item>
            <el-dropdown-item command="apifox">Apifox</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-button 
          type="success" 
          size="small" 
          @click="showUploadDialog = true"
          style="margin-left: auto;">
          上传到仓库
        </el-button>
      </div>

      <!-- 请求区域 -->
      <div class="request-panel">
        <div class="url-bar">
          <el-select v-model="request.method" class="method-select">
            <el-option v-for="method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']"
                       :key="method"
                       :value="method"
                       :label="method">
            </el-option>
          </el-select>
          <el-input v-model="request.url" 
                    placeholder="输入请求URL" 
                    class="url-input">
            <el-button slot="append" 
                       type="primary" 
                       @click="sendRequest"
                       :loading="loading">
              发送
            </el-button>
          </el-input>
        </div>

        <!-- 请求配置区 -->
        <el-tabs v-model="activeTab" class="request-tabs" type="border-card">
          <el-tab-pane label="Params" name="params">
            <el-table :data="params" class="params-table">
              <el-table-column width="50">
                <template slot-scope="scope">
                  <el-checkbox v-model="scope.row.enabled"></el-checkbox>
                </template>
              </el-table-column>
              <el-table-column label="参数名">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.key" placeholder="Key"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="参数值">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.value" placeholder="Value"></el-input>
                </template>
              </el-table-column>
              <el-table-column width="50">
                <template slot-scope="scope">
                  <el-button type="text" icon="el-icon-delete" @click="removeParam(scope.$index)"></el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="table-actions">
              <el-button type="text" @click="addParam">
                <i class="el-icon-plus"></i> 添加参数
              </el-button>
            </div>
          </el-tab-pane>

          <!-- Headers标签页 -->
          <el-tab-pane label="Headers" name="headers">
            <el-table :data="headers" class="headers-table">
              <el-table-column width="50">
                <template slot-scope="scope">
                  <el-checkbox v-model="scope.row.enabled"></el-checkbox>
                </template>
              </el-table-column>
              <el-table-column label="Header名">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.key" placeholder="Header"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="Header值">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.value" placeholder="Value"></el-input>
                </template>
              </el-table-column>
              <el-table-column width="50">
                <template slot-scope="scope">
                  <el-button type="text" icon="el-icon-delete" @click="removeHeader(scope.$index)"></el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="table-actions">
              <el-button type="text" @click="addHeader">
                <i class="el-icon-plus"></i> 添加Header
              </el-button>
            </div>
          </el-tab-pane>

          <!-- Body标签页 -->
          <el-tab-pane label="Body" name="body">
            <div class="body-type-selector">
              <el-radio-group v-model="bodyType" size="small">
                <el-radio-button label="none">none</el-radio-button>
                <el-radio-button label="form-data">form-data</el-radio-button>
                <el-radio-button label="x-www-form-urlencoded">x-www-form-urlencoded</el-radio-button>
                <el-radio-button label="raw">raw</el-radio-button>
              </el-radio-group>
              
              <el-select v-if="bodyType === 'raw'"
                        v-model="rawContentType"
                        size="small"
                        class="content-type-select">
                <el-option label="JSON" value="application/json"></el-option>
                <el-option label="Text" value="text/plain"></el-option>
                <el-option label="XML" value="application/xml"></el-option>
              </el-select>
            </div>

            <div class="body-content">
              <codemirror v-if="bodyType === 'raw'"
                         v-model="request.body"
                         :options="cmOptions"
                         class="code-editor">
              </codemirror>

              <el-table v-if="bodyType === 'form-data'"
                       :data="formData"
                       class="form-data-table">
                <el-table-column label="Key">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.key" placeholder="Key"></el-input>
                  </template>
                </el-table-column>
                <el-table-column label="Value">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.value" placeholder="Value"></el-input>
                  </template>
                </el-table-column>
                <el-table-column width="50">
                  <template slot-scope="scope">
                    <el-button type="text" 
                              icon="el-icon-delete"
                              @click="removeFormData(scope.$index)">
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <!-- 新增测试标签页 -->
          <el-tab-pane label="Tests" name="tests">
            <div class="test-editor">
              <codemirror
                v-model="testScript"
                :options="cmTestOptions"
                class="code-editor">
              </codemirror>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 响应区域 -->
      <div v-if="response" class="response-panel">
        <div class="response-header">
          <div class="status-badge" 
               :class="{ 
                 'success': response.status < 300,
                 'warning': response.status >= 300 && response.status < 400,
                 'error': response.status >= 400 
               }">
            {{ response.status }} {{ response.statusText }}
          </div>
          <div class="response-meta">
            <span class="time">{{ response.time }}ms</span>
            <span class="size">{{ formatSize(response.size) }}</span>
          </div>
        </div>

        <el-tabs v-model="responseTab" type="border-card">
          <el-tab-pane label="Body" name="body">
            <codemirror v-model="formattedResponse"
                       :options="cmResponseOptions"
                       class="response-editor">
            </codemirror>
          </el-tab-pane>
          <el-tab-pane label="Headers" name="headers">
            <el-table :data="responseHeadersArray" class="headers-table">
              <el-table-column prop="key" label="Header"></el-table-column>
              <el-table-column prop="value" label="Value"></el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- 新增测试结果标签页 -->
          <el-tab-pane label="Test Results" name="testResults">
            <div class="test-results">
              <div v-for="(result, index) in testResults" :key="index" class="test-result-item">
                <i :class="result.passed ? 'el-icon-success' : 'el-icon-error'"
                   :style="{ color: result.passed ? '#67C23A' : '#F56C6C' }"></i>
                <span>{{ result.name }}: {{ result.message }}</span>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 导入对话框 -->
    <el-dialog :title="importDialogTitle" :visible.sync="showImportDialog" width="500px">
      <div class="import-dialog-content">
        <el-radio-group v-model="importType" class="import-type-selector">
          <el-radio label="url">URL导入</el-radio>
          <el-radio label="file">文件导入</el-radio>
          <el-radio label="text">文本导入</el-radio>
        </el-radio-group>

        <div class="import-input-area">
          <!-- URL导入 -->
          <el-input
            v-if="importType === 'url'"
            v-model="importUrl"
            placeholder="请输入Swagger/Postman/Apifox文档URL">
          </el-input>

          <!-- 文件导入 -->
          <el-upload
            v-if="importType === 'file'"
            class="import-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept=".json">
            <div class="upload-area">
              <i class="el-icon-upload"></i>
              <div class="upload-tip">
                <span>点击或拖拽文件到此处上传</span>
                <p>支持 .json 格式文件</p>
              </div>
            </div>
            <div v-if="importFile" class="selected-file">
              已选择: {{ importFile.name }}
            </div>
          </el-upload>

          <!-- 文本导入 -->
          <el-input
            v-if="importType === 'text'"
            type="textarea"
            v-model="importText"
            :rows="10"
            placeholder="请粘贴JSON内容">
          </el-input>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :loading="importing">
          导入
        </el-button>
      </span>
    </el-dialog>

    <!-- 上传对话框 -->
    <el-dialog 
      title="上传到仓库" 
      :visible.sync="showUploadDialog" 
      width="600px">
      <div class="upload-dialog-content">
        <!-- 仓库信息 -->
        <div class="repo-info-section">
          <el-form :model="repoForm" label-width="100px" size="small">
            <el-form-item label="Git仓库地址">
              <el-input v-model="repoForm.repoUrl" placeholder="例如: https://github.com/username/repo"></el-input>
            </el-form-item>
            <el-form-item label="分支">
              <el-input v-model="repoForm.branch" placeholder="例如: main"></el-input>
            </el-form-item>
            <el-form-item label="Token">
              <el-input v-model="repoForm.token" type="password" placeholder="请输入GitHub Token"></el-input>
            </el-form-item>
          </el-form>
        </div>

        <!-- 文件信息 -->
        <div class="file-info-section">
          <h3>API文档信息</h3>
          <el-form :model="fileForm" label-width="100px" size="small">
            <el-form-item label="文件路径">
              <el-input v-model="fileForm.path" placeholder="例如: docs/api.json"></el-input>
            </el-form-item>
            <el-form-item label="提交信息">
              <el-input 
                type="textarea" 
                v-model="fileForm.message" 
                :rows="2"
                placeholder="描述本次更新的内容">
              </el-input>
            </el-form-item>
          </el-form>
        </div>

        <!-- 文件预览 -->
        <div class="preview-section">
          <h3>文件预览</h3>
          <div class="preview-content">
            <codemirror
              v-model="fileContent"
              :options="previewOptions"
              class="preview-editor">
            </codemirror>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleUpload" 
          :loading="uploading">
          {{ uploading ? '上传中...' : '确认上传' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 整体布局 */
.api-tester {
  display: flex;
  height: calc(100vh - 50px); /* 减去可能的顶部导航高度 */
  background-color: #f5f7fa;
  padding: 16px;
  gap: 16px;
}

/* 左侧边栏 */
.sidebar {
  width: 280px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.history-list {
  overflow-y: auto;
  flex: 1;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

/* 环境选择栏 */
.environment-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  gap: 12px;
}

/* 请求面板 */
.request-panel {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  flex: 1;
}

.url-bar {
  padding: 16px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #ebeef5;
}

/* 标签页内容区域 */
.el-tabs__content {
  padding: 16px;
  height: calc(100% - 40px); /* 减去标签页头部高度 */
  overflow-y: auto;
}

/* 表格样式统一 */
.params-table,
.headers-table,
.form-data-table {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

/* 编辑器容器 */
.code-editor,
.response-editor {
  height: 300px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

/* 响应面板 */
.response-panel {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.response-header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 状态徽章 */
.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
}

/* 方法徽章 */
.method-badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

/* 导入对话框 */
.import-dialog-content {
  padding: 24px;
}

.import-type-selector {
  margin-bottom: 24px;
}

.import-uploader {
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .sidebar {
    width: 240px;
  }
}

@media screen and (max-width: 768px) {
  .api-tester {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
  }
}

/* 美化滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background: #f5f7fa;
}

/* 统一间距 */
.el-table {
  margin-bottom: 16px;
}

.table-actions {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
}

/* 编辑器主题覆盖 */
.code-editor >>> .CodeMirror,
.response-editor >>> .CodeMirror {
  height: 100%;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px;
}

/* 统一按钮样式 */
.el-button {
  font-weight: 500;
}

.el-button--text {
  padding: 4px 8px;
}

/* 输入框统一样式 */
.el-input__inner {
  height: 36px;
  line-height: 36px;
}

/* 下拉菜单统一样式 */
.el-select {
  width: auto;
}

.method-select {
  width: 120px;
}

.upload-dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

.repo-info-section,
.file-info-section,
.preview-section {
  margin-bottom: 20px;
}

.preview-section h3 {
  margin-bottom: 10px;
}

.preview-editor {
  height: 200px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.el-form-item {
  margin-bottom: 15px;
}
</style>

<script>
import VueCodemirror from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/xml/xml.js'
import axios from 'axios'

export default {
  name: 'ApiTester',
  components: {
    codemirror: VueCodemirror.codemirror
  },
  data() {
    return {
      request: {
        url: '',
        method: 'GET',
        body: ''
      },
      params: [],
      headers: [],
      formData: [],
      activeTab: 'params',
      responseTab: 'body',
      bodyType: 'none',
      rawContentType: 'application/json',
      response: null,
      environments: [
        {
          name: 'Default',
          variables: {}
        }
      ],
      currentEnv: 'Default',
      showEnvDialog: false,
      cmOptions: {
        tabSize: 2,
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        line: true,
        lineWrapping: true
      },
      cmResponseOptions: {
        tabSize: 2,
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        line: true,
        lineWrapping: true,
        readOnly: true
      },
      sidebarTab: 'history',
      requestHistory: [],
      selectedHistoryIndex: -1,
      loading: false,
      testScript: '// 编写你的测试脚本\npm.test("Status code is 200", function () {\n    pm.response.to.have.status(200);\n});\n',
      cmTestOptions: {
        tabSize: 2,
        mode: 'javascript',
        theme: 'monokai',
        lineNumbers: true,
        line: true,
        lineWrapping: true
      },
      testResults: [],
      showImportDialog: false,
      importDialogTitle: '',
      importType: 'url',
      importUrl: '',
      importText: '',
      importFormat: '', // swagger, postman, apifox
      importing: false,
      importFile: null,
      showUploadDialog: false,
      repoForm: {
        repoUrl: '',
        branch: 'main',
        token: ''
      },
      fileForm: {
        path: 'api-docs/api.json',
        message: '更新API文档'
      },
      fileContent: null,
      previewOptions: {
        tabSize: 2,
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        readOnly: true
      },
      uploading: false
    };
  },
  computed: {
    formattedResponse() {
      try {
        return JSON.stringify(this.response.data, null, 2);
      } catch (e) {
        return this.response?.data || '';
      }
    },
    responseHeadersArray() {
      if (!this.response?.headers) return [];
      return Object.entries(this.response.headers).map(([key, value]) => ({
        key,
        value
      }));
    }
  },
  methods: {
    async sendRequest() {
      try {
        const startTime = Date.now();
        const headers = this.getHeaders();
        const url = this.buildUrl();
        
        const response = await axios({
          method: this.request.method,
          url,
          headers,
          data: this.getRequestBody(),
          validateStatus: () => true
        });

        this.response = {
          ...response,
          time: Date.now() - startTime,
          size: this.calculateSize(response.data)
        };

        // 执行测试脚本
        this.runTests();
      } catch (error) {
        this.$message.error(error.message);
      }
    },
    buildUrl() {
      const url = new URL(this.replaceEnvVariables(this.request.url));
      this.params
        .filter(p => p.enabled)
        .forEach(p => url.searchParams.append(p.key, p.value));
      return url.toString();
    },
    getHeaders() {
      const headers = {};
      this.headers
        .filter(h => h.enabled)
        .forEach(h => {
          headers[h.key] = this.replaceEnvVariables(h.value);
        });
      return headers;
    },
    getRequestBody() {
      if (this.bodyType === 'none') return null;
      if (this.bodyType === 'raw') return JSON.parse(this.request.body);
      if (this.bodyType === 'form-data') {
        const formData = new FormData();
        this.formData.forEach(item => {
          formData.append(item.key, item.value);
        });
        return formData;
      }
      return null;
    },
    replaceEnvVariables(str) {
      const env = this.environments.find(e => e.name === this.currentEnv);
      if (!env) return str;
      return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
        return env.variables[key]?.value || '';
      });
    },
    calculateSize(data) {
      return new Blob([JSON.stringify(data)]).size;
    },
    // 其他辅助方法
    addParam() {
      this.params.push({ key: '', value: '', enabled: true });
    },
    removeParam(index) {
      this.params.splice(index, 1);
    },
    addHeader() {
      this.headers.push({ key: '', value: '', enabled: true });
    },
    removeHeader(index) {
      this.headers.splice(index, 1);
    },
    addFormData() {
      this.formData.push({ key: '', value: '' });
    },
    removeFormData(index) {
      this.formData.splice(index, 1);
    },
    addEnvironment() {
      this.environments.push({
        name: `Environment ${this.environments.length + 1}`,
        variables: {}
      });
    },
    addEnvVar(env) {
      this.$set(env.variables, `var${Object.keys(env.variables).length + 1}`, {
        key: '',
        value: ''
      });
    },
    removeEnvVar(env, key) {
      this.$delete(env.variables, key);
    },
    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },
    toggleFavorite(index) {
      this.$set(this.requestHistory[index], 'isFavorite', 
        !this.requestHistory[index].isFavorite);
    },
    loadHistory(item, index) {
      this.selectedHistoryIndex = index;
      this.request = { ...item };
    },
    runTests() {
      // 创建一个模拟的 pm 对象
      const pm = {
        response: {
          to: {
            have: {
              status: (expectedStatus) => {
                const passed = this.response.status === expectedStatus;
                this.testResults.push({
                  name: `Status code is ${expectedStatus}`,
                  passed: passed,
                  message: passed ? 'Test passed' : `Expected ${expectedStatus}, but got ${this.response.status}`
                });
              }
            }
          }
        },
        test: (name, testFunction) => {
          try {
            testFunction();
          } catch (error) {
            this.testResults.push({
              name: name,
              passed: false,
              message: error.message
            });
          }
        }
      };

      // 清除之前的测试结果
      this.testResults = [];

      // 执行测试脚本
      try {
        eval(this.testScript);
      } catch (error) {
        this.$message.error('Test script error: ' + error.message);
      }
    },
    handleImport(format) {
      this.importFormat = format;
      this.importDialogTitle = `导入${format.charAt(0).toUpperCase() + format.slice(1)}文档`;
      this.showImportDialog = true;
    },
    handleFileChange(file) {
      if (file.raw.type !== 'application/json' && !file.raw.name.endsWith('.json')) {
        this.$message.error('请上传 JSON 格式的文件');
        return false;
      }
      this.importFile = file.raw;
      return false; // 阻止自动上传
    },
    async confirmImport() {
      try {
        this.importing = true;
        let jsonData;

        switch (this.importType) {
          case 'url':
            jsonData = await this.importFromUrl();
            break;
          case 'file':
            jsonData = await this.importFromFile();
            break;
          case 'text':
            jsonData = this.importFromText();
            break;
        }

        if (jsonData) {
          await this.processImportedData(jsonData);
          this.$message.success('导入成功');
          this.showImportDialog = false;
        }
      } catch (error) {
        this.$message.error('导入失败: ' + error.message);
      } finally {
        this.importing = false;
      }
    },
    async importFromUrl() {
      const response = await axios.get(this.importUrl);
      return response.data;
    },
    async importFromFile() {
      if (!this.importFile) {
        throw new Error('请选择文件');
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target.result);
            resolve(json);
          } catch (error) {
            reject(new Error('文件格式错误'));
          }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(this.importFile);
      });
    },
    importFromText() {
      try {
        return JSON.parse(this.importText);
      } catch (error) {
        throw new Error('JSON格式错误');
      }
    },
    async processImportedData(data) {
      switch (this.importFormat) {
        case 'swagger':
          await this.processSwaggerData(data);
          break;
        case 'postman':
          await this.processPostmanData(data);
          break;
        case 'apifox':
          await this.processApifoxData(data);
          break;
      }
    },
    async processSwaggerData(data) {
      // 处理Swagger格式的数据
      const apis = [];
      const paths = data.paths || {};
      
      for (const [path, methods] of Object.entries(paths)) {
        for (const [method, details] of Object.entries(methods)) {
          apis.push({
            name: details.summary || details.operationId || path,
            method: method.toUpperCase(),
            url: this.buildSwaggerUrl(data.servers?.[0]?.url || '', path),
            headers: this.extractSwaggerHeaders(details),
            params: this.extractSwaggerParams(details),
            body: this.extractSwaggerBody(details)
          });
        }
      }
      
      // 将API添加到历史记录或收藏夹
      this.requestHistory.push(...apis);
    },
    async processPostmanData(data) {
      // 处理Postman格式的数据
      const apis = [];
      const items = data.item || [];
      
      for (const item of items) {
        if (item.request) {
          apis.push({
            name: item.name,
            method: item.request.method,
            url: item.request.url.raw || item.request.url,
            headers: this.extractPostmanHeaders(item.request),
            body: this.extractPostmanBody(item.request)
          });
        }
      }
      
      this.requestHistory.push(...apis);
    },
    async processApifoxData(data) {
      // 处理Apifox格式的数据
      // Apifox的格式与Swagger类似，但可能有一些特殊字段
      await this.processSwaggerData(data);
    },
    buildSwaggerUrl(baseUrl, path) {
      return (baseUrl + path).replace(/\/+/g, '/');
    },
    extractSwaggerHeaders(details) {
      const headers = [];
      (details.parameters || [])
        .filter(p => p.in === 'header')
        .forEach(p => {
          headers.push({
            key: p.name,
            value: p.example || '',
            enabled: true,
            description: p.description
          });
        });
      return headers;
    },
    extractSwaggerParams(details) {
      const params = [];
      (details.parameters || [])
        .filter(p => p.in === 'query')
        .forEach(p => {
          params.push({
            key: p.name,
            value: p.example || '',
            enabled: true,
            description: p.description
          });
        });
      return params;
    },
    extractSwaggerBody(details) {
      if (details.requestBody?.content?.['application/json']?.schema) {
        return JSON.stringify(
          this.generateExample(details.requestBody.content['application/json'].schema),
          null,
          2
        );
      }
      return '';
    },
    extractPostmanHeaders(request) {
      return (request.header || []).map(h => ({
        key: h.key,
        value: h.value,
        enabled: true,
        description: h.description
      }));
    },
    extractPostmanBody(request) {
      if (request.body?.raw) {
        try {
          return JSON.stringify(JSON.parse(request.body.raw), null, 2);
        } catch {
          return request.body.raw;
        }
      }
      return '';
    },
    generateExample(schema) {
      // 根据Schema生成示例数据
      if (schema.example) return schema.example;
      if (schema.type === 'object') {
        const result = {};
        if (schema.properties) {
          for (const [key, prop] of Object.entries(schema.properties)) {
            result[key] = this.generateExample(prop);
          }
        }
        return result;
      }
      if (schema.type === 'array') {
        return [this.generateExample(schema.items)];
      }
      // 返回基本类型的默认值
      switch (schema.type) {
        case 'string': return 'string';
        case 'number': return 0;
        case 'integer': return 0;
        case 'boolean': return false;
        default: return null;
      }
    },
    // 检测字符串编码
    detectEncoding(buffer) {
      // 检测是否为UTF-8
      const isUTF8 = this.checkUTF8(buffer);
      if (isUTF8) return 'UTF-8';
      
      // 检测是否为GBK/GB2312
      const isGBK = this.checkGBK(buffer);
      if (isGBK) return 'GBK';
      
      return 'UTF-8'; // 默认返回UTF-8
    },

    // 检查是否为UTF-8编码
    checkUTF8(buffer) {
      try {
        const decoder = new TextDecoder('UTF-8');
        decoder.decode(buffer);
        return true;
      } catch {
        return false;
      }
    },

    // 检查是否为GBK编码
    checkGBK(buffer) {
      try {
        const decoder = new TextDecoder('GBK');
        decoder.decode(buffer);
        return true;
      } catch {
        return false;
      }
    },

    // 转换编码
    async convertEncoding(content, fromEncoding) {
      if (fromEncoding === 'UTF-8') return content;

      try {
        // 将字符串转换为 Uint8Array
        const encoder = new TextEncoder();
        const buffer = encoder.encode(content);

        // 使用正确的编码解码
        const decoder = new TextDecoder(fromEncoding);
        return decoder.decode(buffer);
      } catch (error) {
        console.error('编码转换失败:', error);
        return content;
      }
    },

    // 修改文件内容处理方法
    async processFileContent(content, fileName) {
      // 如果是Java文件，进行编码检测和转换
      if (fileName.endsWith('.java')) {
        // 将字符串转换为 ArrayBuffer
        const buffer = new TextEncoder().encode(content);
        
        // 检测编码
        const encoding = this.detectEncoding(buffer);
        
        // 如果不是UTF-8，进行转换
        if (encoding !== 'UTF-8') {
          content = await this.convertEncoding(content, encoding);
        }

        // 处理特殊字符
        content = content.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        });
      }

      return content;
    },

    // 修改原有的文件内容获取方法
    async fetchFileContent(file) {
      this.fileContent = null; // 重置内容，显示加载状态
      try {
        const contentResponse = await axios.get(file.url);
        let content = contentResponse.data;

        // 处理文件内容
        content = await this.processFileContent(content, file.name);

        this.fileContent = content;
      } catch (error) {
        console.error('获取文件内容失败:', error);
        this.fileContent = '无法加载文件内容';
      }
    },

    // 生成要上传的文件内容
    generateFileContent() {
      // 将当前的API配置转换为文档格式
      const docContent = {
        info: {
          title: "API Documentation",
          version: "1.0.0",
          description: "Generated by API Tester"
        },
        apis: this.requestHistory.map(item => ({
          name: item.name || item.url,
          method: item.method,
          url: item.url,
          headers: this.headers.filter(h => h.enabled),
          params: this.params.filter(p => p.enabled),
          body: this.bodyType === 'raw' ? this.request.body : null
        }))
      };

      return JSON.stringify(docContent, null, 2);
    },

    // 解析仓库URL
    parseRepoUrl(url) {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error('无效的GitHub仓库地址');
      }
      return {
        owner: match[1],
        repo: match[2].replace('.git', '')
      };
    },

    // 处理文件上传
    async handleUpload() {
      try {
        this.uploading = true;

        // 验证表单
        if (!this.repoForm.repoUrl || !this.repoForm.token || !this.fileForm.path) {
          throw new Error('请填写完整信息');
        }

        // 解析仓库信息
        const { owner, repo } = this.parseRepoUrl(this.repoForm.repoUrl);

        // 准备API请求
        const github = axios.create({
          baseURL: 'https://api.github.com',
          headers: {
            'Authorization': `token ${this.repoForm.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        // 获取当前文件（如果存在）
        let currentFile;
        try {
          const response = await github.get(`/repos/${owner}/${repo}/contents/${this.fileForm.path}`, {
            params: { ref: this.repoForm.branch }
          });
          currentFile = response.data;
        } catch (error) {
          if (error.response?.status !== 404) {
            throw error;
          }
        }

        // 准备文件内容
        const content = this.generateFileContent();
        const contentBase64 = btoa(unescape(encodeURIComponent(content)));

        // 创建或更新文件
        await github.put(`/repos/${owner}/${repo}/contents/${this.fileForm.path}`, {
          message: this.fileForm.message,
          content: contentBase64,
          branch: this.repoForm.branch,
          sha: currentFile?.sha
        });

        this.$message.success('上传成功');
        this.showUploadDialog = false;
      } catch (error) {
        this.$message.error(error.message || '上传失败');
        console.error('上传失败:', error);
      } finally {
        this.uploading = false;
      }
    }
  }
};
</script>

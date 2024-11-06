<template>
    <div class="dependency-container">
      <!-- 添加工具栏 -->
      <div class="toolbar">
        <el-button type="primary" @click="showAddNodeDialog">添加节点</el-button>
        <el-button type="success" @click="exportImage">导出图片</el-button>
        <el-button type="warning" @click="scanDependencies">扫描依赖</el-button>
        <el-button type="info" @click="showPermissionDialog">权限管理</el-button>
        <el-radio-group v-model="viewType" @change="handleViewChange">
          <el-radio-button label="force">力导向图</el-radio-button>
          <el-radio-button label="tree">层次树图</el-radio-button>
        </el-radio-group>
      </div>
  
      <div class="chart-container" ref="chartContainer"></div>
  
      <!-- 添加节点弹窗 -->
      <el-dialog title="添加节点" :visible.sync="addNodeDialogVisible" width="40%">
        <el-form :model="newNode" ref="nodeForm" :rules="rules" label-width="80px">
          <el-form-item label="节点名称" prop="name">
            <el-input v-model="newNode.name"></el-input>
          </el-form-item>
          <el-form-item label="节点类型" prop="category">
            <el-select v-model="newNode.category">
              <el-option label="UI层" :value="0"></el-option>
              <el-option label="业务层" :value="1"></el-option>
              <el-option label="基础层" :value="2"></el-option>
              
            </el-select>
          </el-form-item>
          <el-form-item label="依赖节点">
            <el-select v-model="newNode.dependencies" multiple placeholder="选择依赖节点">
              <el-option
                v-for="node in dependencyData.nodes"
                :key="node.id"
                :label="node.name"
                :value="node.id">
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="addNodeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddNode">确定</el-button>
        </span>
      </el-dialog>
  
      <!-- 编辑节点弹窗 -->
      <el-dialog title="编辑节点" :visible.sync="editNodeDialogVisible" width="40%">
        <el-form :model="editingNode" ref="editNodeForm" :rules="rules" label-width="80px">
          <el-form-item label="节点名称" prop="name">
            <el-input v-model="editingNode.name"></el-input>
          </el-form-item>
          <el-form-item label="节点类型" prop="category">
            <el-select v-model="editingNode.category">
              <el-option label="UI层" :value="0"></el-option>
              <el-option label="业务层" :value="1"></el-option>
              <el-option label="基础层" :value="2"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="依赖节点">
            <el-select v-model="editingNode.dependencies" multiple placeholder="选择依赖节点">
              <el-option
                v-for="node in dependencyData.nodes.filter(n => n.id !== editingNode.id)"
                :key="node.id"
                :label="node.name"
                :value="node.id">
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="editNodeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditNode">确定</el-button>
          <el-button type="danger" @click="handleDeleteNode">删除节点</el-button>
        </span>
      </el-dialog>
  
      <!-- 原有的依赖详情弹窗 -->
      <el-dialog title="模块依赖详情" :visible.sync="dialogVisible" width="50%">
        <div v-if="selectedNode">
          <h3>{{ selectedNode.name }}</h3>
          <div class="dependency-info">
            <p>依赖项：</p>
            <ul>
              <li v-for="dep in selectedNode.dependencies" :key="dep.id">
                {{ dep.name }}
              </li>
            </ul>
          </div>
          <el-button type="primary" @click="editNode(selectedNode)">编辑节点</el-button>
        </div>
      </el-dialog>
  
      <!-- 添加扫描配置弹窗 -->
      <el-dialog title="依赖扫描配置" :visible.sync="scanConfigVisible" width="50%">
        <el-form :model="scanConfig" label-width="100px">
          <el-form-item label="项目路径">
            <el-input v-model="scanConfig.projectPath" placeholder="请输入项目根目录路径"></el-input>
          </el-form-item>
          <el-form-item label="扫描类型">
            <el-checkbox-group v-model="scanConfig.scanTypes">
              <el-checkbox label="internal">内部模块依赖</el-checkbox>
              <el-checkbox label="external">外部依赖</el-checkbox>
              <el-checkbox label="api">接口调用</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="文件类型">
            <el-select v-model="scanConfig.fileTypes" multiple placeholder="选择要扫描的文件类型">
              <el-option label="JavaScript" value=".js"></el-option>
              <el-option label="Vue" value=".vue"></el-option>
              <el-option label="TypeScript" value=".ts"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="scanConfigVisible = false">取消</el-button>
          <el-button type="primary" @click="startScan">开始扫描</el-button>
        </span>
      </el-dialog>
  
      <!-- 添加扫描结果弹窗 -->
      <el-dialog title="扫描结果" :visible.sync="scanResultVisible" width="60%">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="模块依赖" name="modules">
            <el-table :data="scanResults.modules" height="400">
              <el-table-column prop="source" label="源模块"></el-table-column>
              <el-table-column prop="target" label="依赖模块"></el-table-column>
              <el-table-column prop="type" label="依赖类型"></el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="外部依赖" name="external">
            <el-table :data="scanResults.external" height="400">
              <el-table-column prop="name" label="包名"></el-table-column>
              <el-table-column prop="version" label="版本"></el-table-column>
              <el-table-column prop="usedIn" label="使用位"></el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="API调用" name="api">
            <el-table :data="scanResults.api" height="400">
              <el-table-column prop="source" label="调用方"></el-table-column>
              <el-table-column prop="api" label="API接口"></el-table-column>
              <el-table-column prop="method" label="请求方法"></el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
        <div class="scan-actions">
          <el-button type="primary" @click="importToGraph">导入到依赖图</el-button>
          <el-button type="success" @click="exportScanResults">导出结果</el-button>
        </div>
      </el-dialog>
  
      <!-- 添加权限管理弹窗 -->
      <el-dialog title="依赖权限管理" :visible.sync="permissionDialogVisible" width="60%">
        <el-tabs v-model="permissionActiveTab">
          <el-tab-pane label="模块权限" name="modulePermissions">
            <el-table :data="modulePermissions" border>
              <el-table-column prop="moduleName" label="模块名称"></el-table-column>
              <el-table-column label="权限设置">
                <template slot-scope="scope">
                  <el-select v-model="scope.row.permission" multiple>
                    <el-option label="查看" value="view"></el-option>
                    <el-option label="编辑" value="edit"></el-option>
                    <el-option label="添加依赖" value="add_dependency"></el-option>
                    <el-option label="删除" value="delete"></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="授权角色">
                <template slot-scope="scope">
                  <el-select v-model="scope.row.roles" multiple>
                    <el-option label="开发人员" value="developer"></el-option>
                    <el-option label="架构师" value="architect"></el-option>
                    <el-option label="项目经理" value="manager"></el-option>
                  </el-select>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="审批流程" name="approvalProcess">
            <el-table :data="approvalRequests" border>
              <el-table-column prop="requestTime" label="申请时间" width="180"></el-table-column>
              <el-table-column prop="requester" label="申请人"></el-table-column>
              <el-table-column prop="type" label="变更类型"></el-table-column>
              <el-table-column prop="content" label="变更内容"></el-table-column>
              <el-table-column prop="status" label="状态">
                <template slot-scope="scope">
                  <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template slot-scope="scope">
                  <el-button 
                    v-if="scope.row.status === '待审批'"
                    size="mini" 
                    type="success" 
                    @click="handleApprove(scope.row)">
                    通过
                  </el-button>
                  <el-button 
                    v-if="scope.row.status === '待审批'"
                    size="mini" 
                    type="danger" 
                    @click="handleReject(scope.row)">
                    拒绝
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
        <div slot="footer" class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="savePermissionSettings">保存设置</el-button>
        </div>
      </el-dialog>
  
      <!-- 添加依赖变更申请弹窗 -->
      <el-dialog title="依赖变更申请" :visible.sync="changeRequestDialogVisible" width="50%">
        <el-form :model="changeRequest" ref="changeRequestForm" :rules="changeRequestRules" label-width="100px">
          <el-form-item label="变更类型" prop="type">
            <el-select v-model="changeRequest.type">
              <el-option label="新增依赖" value="add"></el-option>
              <el-option label="删除依赖" value="delete"></el-option>
              <el-option label="修改依赖" value="modify"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="变更说明" prop="description">
            <el-input type="textarea" v-model="changeRequest.description"></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="changeRequestDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitChangeRequest">提交申请</el-button>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import * as echarts from 'echarts'
  
  export default {
    name: 'DependencyView',
    data() {
      return {
        chart: null,
        viewType: 'force',
        dialogVisible: false,
        selectedNode: null,
        // 模拟依赖数据
        dependencyData: {
          nodes: [
            { id: '1', name: 'UI组件', category: 0 },
            { id: '2', name: '业务逻辑', category: 1 },
            { id: '3', name: '数据层', category: 2 },
            { id: '4', name: '工具函数', category: 2 },
            { id: '5', name: '路由管理', category: 1 }
          ],
          links: [
            { source: '1', target: '2' },
            { source: '2', target: '3' },
            { source: '2', target: '4' },
            { source: '1', target: '5' }
          ]
        },
        addNodeDialogVisible: false,
        editNodeDialogVisible: false,
        newNode: {
          name: '',
          category: 0,
          dependencies: []
        },
        editingNode: {
          id: '',
          name: '',
          category: 0,
          dependencies: []
        },
        rules: {
          name: [
            { required: true, message: '请输入节点名称', trigger: 'blur' }
          ],
          category: [
            { required: true, message: '请选择节点类型', trigger: 'change' }
          ]
        },
        scanConfigVisible: false,
        scanResultVisible: false,
        scanConfig: {
          projectPath: '',
          scanTypes: ['internal'],
          fileTypes: ['.js', '.vue']
        },
        scanResults: {
          modules: [],
          external: [],
          api: []
        },
        activeTab: 'modules',
        permissionDialogVisible: false,
        permissionActiveTab: 'modulePermissions',
        approvalRequests: [
          { requestTime: '2023-04-01', requester: '张三', type: '新增依赖', content: '添加了新的依赖模块', status: '待审批' },
          { requestTime: '2023-04-02', requester: '李四', type: '删除依赖', content: '删除了旧的依赖模块', status: '待审批' },
          { requestTime: '2023-04-03', requester: '王五', type: '修改依赖', content: '修改了依赖模块的代码', status: '待审批' }
        ],
        changeRequestDialogVisible: false,
        changeRequest: {
          type: '',
          description: ''
        },
        changeRequestRules: {
          type: [
            { required: true, message: '请选择变更类型', trigger: 'change' }
          ],
          description: [
            { required: true, message: '请输入变更说明', trigger: 'blur' }
          ]
        },
        modulePermissions: [
          {
            moduleName: 'UI组件',
            permission: ['view', 'edit'],
            roles: ['developer', 'architect']
          },
          {
            moduleName: '业务逻辑',
            permission: ['view'],
            roles: ['developer']
          }
        ],
        approvalRequests: [
          {
            requestTime: '2024-01-20 10:00:00',
            requester: '张三',
            type: '新增依赖',
            content: 'UI组件 -> 数据层',
            status: '待审批'
          }
        ],
        currentUserRole: 'developer' // 模拟当前用户角色
      }
    },
    mounted() {
      this.initChart()
      window.addEventListener('resize', this.resizeChart)
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.resizeChart)
      this.chart && this.chart.dispose()
    },
    methods: {
      initChart() {
        this.chart = echarts.init(this.$refs.chartContainer)
        this.updateChartView()
        
        // 添加点击事件
        this.chart.on('click', params => {
          if (params.dataType === 'node') {
            this.selectedNode = {
              name: params.data.name,
              dependencies: this.getDependencies(params.data.id)
            }
            this.dialogVisible = true
          }
        })
      },
      
      updateChartView() {
        const option = this.viewType === 'force' 
          ? this.getForceOption() 
          : this.getTreeOption()
        
        this.chart.setOption(option)
      },
      
      getForceOption() {
        return {
          tooltip: {},
          legend: {
            data: ['UI层', '业务层', '基础层']
          },
          series: [{
            type: 'graph',
            layout: 'force',
            data: this.dependencyData.nodes,
            links: this.dependencyData.links,
            categories: [
              { name: 'UI层' },
              { name: '业务层' },
              { name: '基础层' }
            ],
            roam: true,
            label: {
              show: true,
              position: 'right'
            },
            force: {
              repulsion: 100
            }
          }]
        }
      },
      
      getTreeOption() {
        // 将数据转换为树形结构
        const treeData = this.convertToTreeData()
        return {
          tooltip: {},
          series: [{
            type: 'tree',
            data: [treeData],
            top: '10%',
            left: '10%',
            bottom: '10%',
            right: '10%',
            symbolSize: 7,
            label: {
              position: 'left',
              verticalAlign: 'middle',
              align: 'right'
            },
            leaves: {
              label: {
                position: 'right',
                verticalAlign: 'middle',
                align: 'left'
              }
            }
          }]
        }
      },
      
      handleViewChange() {
        this.updateChartView()
      },
      
      resizeChart() {
        this.chart && this.chart.resize()
      },
      
      getDependencies(nodeId) {
        return this.dependencyData.links
          .filter(link => link.source === nodeId)
          .map(link => {
            const targetNode = this.dependencyData.nodes.find(node => node.id === link.target)
            return targetNode
          })
      },
      
      convertToTreeData() {
        // 简单的树形结构转换逻辑
        const root = this.dependencyData.nodes[0]
        const convertNode = (node) => {
          const children = this.getDependencies(node.id)
          return {
            name: node.name,
            children: children.map(child => convertNode(child))
          }
        }
        return convertNode(root)
      },
  
      showAddNodeDialog() {
        this.addNodeDialogVisible = true
        this.newNode = {
          name: '',
          category: 0,
          dependencies: []
        }
      },
  
      handleAddNode() {
        if (!this.checkPermission('add_dependency')) {
          this.showChangeRequestDialog()
          return
        }
        this.$refs.nodeForm.validate(valid => {
          if (valid) {
            const newId = String(this.dependencyData.nodes.length + 1)
            // 添加新节点
            this.dependencyData.nodes.push({
              id: newId,
              name: this.newNode.name,
              category: this.newNode.category
            })
            
            // 添加依赖关系
            this.newNode.dependencies.forEach(targetId => {
              this.dependencyData.links.push({
                source: newId,
                target: targetId
              })
            })
            
            this.addNodeDialogVisible = false
            this.updateChartView()
          }
        })
      },
  
      editNode(node) {
        this.editingNode = {
          id: node.id,
          name: node.name,
          category: node.category,
          dependencies: this.getDependencies(node.id).map(dep => dep.id)
        }
        this.editNodeDialogVisible = true
        this.dialogVisible = false
      },
  
      handleEditNode() {
        if (!this.checkPermission('edit')) {
          this.showChangeRequestDialog()
          return
        }
        this.$refs.editNodeForm.validate(valid => {
          if (valid) {
            // 更新节点信息
            const nodeIndex = this.dependencyData.nodes.findIndex(n => n.id === this.editingNode.id)
            this.dependencyData.nodes[nodeIndex] = {
              ...this.dependencyData.nodes[nodeIndex],
              name: this.editingNode.name,
              category: this.editingNode.category
            }
            
            // 更新依赖关系
            this.dependencyData.links = this.dependencyData.links.filter(
              link => link.source !== this.editingNode.id
            )
            this.editingNode.dependencies.forEach(targetId => {
              this.dependencyData.links.push({
                source: this.editingNode.id,
                target: targetId
              })
            })
            
            this.editNodeDialogVisible = false
            this.updateChartView()
          }
        })
      },
  
      handleDeleteNode() {
        this.$confirm('确认删除该节点吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 删除节点
          this.dependencyData.nodes = this.dependencyData.nodes.filter(
            node => node.id !== this.editingNode.id
          )
          // 删除相关的依赖关系
          this.dependencyData.links = this.dependencyData.links.filter(
            link => link.source !== this.editingNode.id && link.target !== this.editingNode.id
          )
          
          this.editNodeDialogVisible = false
          this.updateChartView()
        }).catch(() => {})
      },
  
      exportImage() {
        try {
          const imageUrl = this.chart.getDataURL({
            type: 'png',
            pixelRatio: 2, // 设置导出图片的清晰度
            backgroundColor: '#ffffff' // 设置背景色为白色
          });
  
          // 创建下载链接
          const link = document.createElement('a');
          const timestamp = new Date().getTime();
          link.download = `dependency-chart-${timestamp}.png`;
          link.href = imageUrl;
          
          // 触发下载
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
  
          this.$message({
            type: 'success',
            message: '图片导出成功'
          });
        } catch (error) {
          this.$message.error('图片导出失败：' + error.message);
        }
      },
  
      scanDependencies() {
        this.scanConfigVisible = true
      },
  
      async startScan() {
        try {
          this.$loading({
            lock: true,
            text: '正在扫描项目依赖...',
            spinner: 'el-icon-loading'
          })
  
          // 这里调用后端API进行实际的扫描
          const results = await this.performDependencyScan()
          this.scanResults = results
          
          this.scanConfigVisible = false
          this.scanResultVisible = true
          
          this.$message.success('依赖扫描完成')
        } catch (error) {
          this.$message.error('扫描失败：' + error.message)
        } finally {
          this.$loading().close()
        }
      },
  
      async performDependencyScan() {
        // 这里是模拟的扫描结果，实际项目中需要调用后端API
        return {
          modules: [
            { source: 'src/components/Header.vue', target: 'src/store/user.js', type: 'vuex' },
            { source: 'src/views/Home.vue', target: 'src/api/data.js', type: 'import' }
          ],
          external: [
            { name: 'axios', version: '^0.21.1', usedIn: 'src/utils/request.js' },
            { name: 'vuex', version: '^3.6.2', usedIn: 'src/store/index.js' }
          ],
          api: [
            { source: 'src/api/user.js', api: '/api/user/info', method: 'GET' },
            { source: 'src/api/data.js', api: '/api/data/list', method: 'POST' }
          ]
        }
      },
  
      importToGraph() {
        // 将扫描结果转换为图表数据
        const newNodes = new Set()
        const newLinks = []
  
        // 处理模块依赖
        this.scanResults.modules.forEach(({ source, target }) => {
          newNodes.add(source)
          newNodes.add(target)
          newLinks.push({ source, target })
        })
  
        // 处理外部依赖
        this.scanResults.external.forEach(({ name, usedIn }) => {
          newNodes.add(name)
          newNodes.add(usedIn)
          newLinks.push({ source: usedIn, target: name })
        })
  
        // 更新图表数据
        this.dependencyData.nodes = [...newNodes].map((name, index) => ({
          id: String(index + 1),
          name,
          category: name.includes('node_modules') ? 2 : name.includes('src/api') ? 1 : 0
        }))
  
        this.dependencyData.links = newLinks.map(link => ({
          source: this.getNodeId(link.source),
          target: this.getNodeId(link.target)
        }))
  
        this.updateChartView()
        this.scanResultVisible = false
      },
  
      getNodeId(name) {
        const node = this.dependencyData.nodes.find(n => n.name === name)
        return node ? node.id : null
      },
  
      exportScanResults() {
        const results = JSON.stringify(this.scanResults, null, 2)
        const blob = new Blob([results], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `dependency-scan-${new Date().getTime()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      },
  
      showPermissionDialog() {
        this.permissionDialogVisible = true
      },
  
      getStatusType(status) {
        const statusMap = {
          '待审批': 'warning',
          '已通过': 'success',
          '已拒绝': 'danger'
        }
        return statusMap[status] || 'info'
      },
  
      handleApprove(request) {
        this.$confirm('确认通过此变更申请？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'success'
        }).then(() => {
          request.status = '已通过'
          this.$message.success('审批通过')
        })
      },
  
      handleReject(request) {
        this.$prompt('请输入拒绝原因', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'textarea'
        }).then(({ value }) => {
          request.status = '已拒绝'
          request.rejectReason = value
          this.$message.info('已拒绝该申请')
        })
      },
  
      savePermissionSettings() {
        // 这里应该调用后端API保存权限设置
        this.$message.success('权限设置已保存')
        this.permissionDialogVisible = false
      },
  
      checkPermission(action) {
        // 检查当前用户是否有权限执行操作
        const userModulePermissions = this.modulePermissions.find(
          mp => mp.roles.includes(this.currentUserRole)
        )
        return userModulePermissions && userModulePermissions.permission.includes(action)
      },
  
      showChangeRequestDialog() {
        this.changeRequestDialogVisible = true
        this.changeRequest = {
          type: '',
          description: ''
        }
      },
  
      submitChangeRequest() {
        this.$refs.changeRequestForm.validate(valid => {
          if (valid) {
            // 添加新的变更申请
            this.approvalRequests.unshift({
              requestTime: new Date().toLocaleString(),
              requester: '当前用户',
              type: this.changeRequest.type,
              content: this.changeRequest.description,
              status: '待审批'
            })
            this.changeRequestDialogVisible = false
            this.$message.success('变更申请已提交，请等待审批')
          }
        })
      }
    }
  }
  </script>
  
  <style scoped>
  .dependency-container {
    width: 100%;
    height: 100%;
    position: relative;
  }
  
  .chart-container {
    width: 100%;
    height: calc(100vh - 120px);
  }
  
  .control-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 100;
  }
  
  .dependency-info {
    margin-top: 20px;
  }
  
  .dependency-info ul {
    padding-left: 20px;
  }
  
  .toolbar {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 100;
    display: flex;
    gap: 10px;
  }
  
  .el-form-item {
    margin-bottom: 20px;
  }
  
  .scan-actions {
    margin-top: 20px;
    text-align: right;
  }
  
  .el-table {
    margin-top: 10px;
  }
  
  .el-dialog__body {
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .approval-actions {
    margin-top: 10px;
  }
  
  .el-tag {
    margin-right: 5px;
  }
  </style>
  
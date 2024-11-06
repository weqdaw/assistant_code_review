<template>
  <div class="dashboard-container">
    <!-- 总览面板 -->
    <div class="overview-panel">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="status-card">
            <div class="card-header">
              <span>总模块数</span>
              <el-button type="text" @click="refreshData">
                <i class="el-icon-refresh"></i>
              </el-button>
            </div>
            <div class="card-content">
              <h2>{{ totalModules }}</h2>
              <div class="trend">
                <span :class="{'up': weekGrowth > 0, 'down': weekGrowth < 0}">
                  {{ Math.abs(weekGrowth) }}% 周环比
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6" v-for="status in statusSummary" :key="status.name">
          <el-card class="status-card">
            <div class="card-header">
              <span>{{ status.name }}</span>
            </div>
            <div class="card-content">
              <h2>{{ status.count }}</h2>
              <el-progress 
                :percentage="status.percentage" 
                :color="status.color">
              </el-progress>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 进度图表 -->
    <div class="chart-panel">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <div slot="header">
              <span>模块状态分布</span>
            </div>
            <div class="chart" ref="pieChart"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <div slot="header">
              <span>进度趋势</span>
            </div>
            <div class="chart" ref="lineChart"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 模块列表 -->
    <div class="module-list">
      <el-card>
        <div slot="header" class="list-header">
          <span>模块详情</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="customizeColumns">
              自定义列
            </el-button>
            <el-button type="success" size="small" @click="exportData">
              导出数据
            </el-button>
          </div>
        </div>
        <el-table :data="moduleList" border>
          <el-table-column 
            v-for="col in visibleColumns" 
            :key="col.prop"
            :prop="col.prop"
            :label="col.label"
            :width="col.width">
            <template slot-scope="scope">
              <template v-if="col.prop === 'status'">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
              <template v-else-if="col.prop === 'progress'">
                <el-progress 
                  :percentage="scope.row.progress"
                  :status="getProgressStatus(scope.row.progress)">
                </el-progress>
              </template>
              <template v-else>
                {{ scope.row[col.prop] }}
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 自定义列弹窗 -->
    <el-dialog title="自定义显示列" :visible.sync="columnDialogVisible" width="30%">
      <el-checkbox-group v-model="selectedColumns">
        <el-checkbox 
          v-for="col in allColumns" 
          :key="col.prop" 
          :label="col.prop">
          {{ col.label }}
        </el-checkbox>
      </el-checkbox-group>
      <span slot="footer">
        <el-button @click="columnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveColumnSettings">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ModuleDashboard',
  data() {
    return {
      totalModules: 48,
      weekGrowth: 5.2,
      statusSummary: [
        { name: '进行中', count: 12, percentage: 25, color: '#409EFF' },
        { name: '待测试', count: 8, percentage: 16.7, color: '#E6A23C' },
        { name: '已完成', count: 28, percentage: 58.3, color: '#67C23A' }
      ],
      moduleList: [
        {
          id: 1,
          name: '用户管理模块',
          owner: '张三',
          status: '进行中',
          progress: 45,
          startDate: '2024-01-01',
          endDate: '2024-02-01',
          priority: '高'
        },
        // 更多模块数据...
      ],
      allColumns: [
        { prop: 'name', label: '模块名称', width: '180' },
        { prop: 'owner', label: '负责人', width: '120' },
        { prop: 'status', label: '状态', width: '100' },
        { prop: 'progress', label: '进度', width: '180' },
        { prop: 'startDate', label: '开始日期', width: '120' },
        { prop: 'endDate', label: '结束日期', width: '120' },
        { prop: 'priority', label: '优先级', width: '100' }
      ],
      selectedColumns: ['name', 'owner', 'status', 'progress'],
      columnDialogVisible: false,
      pieChart: null,
      lineChart: null
    }
  },
  computed: {
    visibleColumns() {
      return this.allColumns.filter(col => this.selectedColumns.includes(col.prop))
    }
  },
  mounted() {
    this.initCharts()
    window.addEventListener('resize', this.resizeCharts)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCharts)
    this.pieChart && this.pieChart.dispose()
    this.lineChart && this.lineChart.dispose()
  },
  methods: {
    initCharts() {
      // 初始化饼图
      this.pieChart = echarts.init(this.$refs.pieChart)
      this.pieChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [{
          type: 'pie',
          radius: '70%',
          data: [
            { value: 12, name: '进行中' },
            { value: 8, name: '待测试' },
            { value: 28, name: '已完成' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      })

      // 初始化折线图
      this.lineChart = echarts.init(this.$refs.lineChart)
      this.lineChart.setOption({
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: [30, 35, 40, 45, 50, 55, 58],
          type: 'line',
          smooth: true
        }]
      })
    },
    resizeCharts() {
      this.pieChart && this.pieChart.resize()
      this.lineChart && this.lineChart.resize()
    },
    refreshData() {
      // 刷新数据的逻辑
      this.$message.success('数据已更新')
    },
    customizeColumns() {
      this.columnDialogVisible = true
    },
    saveColumnSettings() {
      this.columnDialogVisible = false
      this.$message.success('列设置已保存')
    },
    exportData() {
      // 导出数据的逻辑
      this.$message.success('数据导出成功')
    },
    getStatusType(status) {
      const typeMap = {
        '进行中': 'primary',
        '待测试': 'warning',
        '已完成': 'success',
        '未开始': 'info'
      }
      return typeMap[status] || 'info'
    },
    getProgressStatus(progress) {
      if (progress >= 100) return 'success'
      if (progress >= 80) return 'warning'
      return ''
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.overview-panel {
  margin-bottom: 20px;
}

.status-card {
  height: 180px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-content {
  text-align: center;
}

.card-content h2 {
  font-size: 28px;
  margin: 10px 0;
}

.trend {
  font-size: 14px;
  color: #909399;
}

.trend .up {
  color: #67C23A;
}

.trend .down {
  color: #F56C6C;
}

.chart {
  height: 300px;
}

.chart-panel {
  margin-bottom: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.module-list {
  margin-bottom: 20px;
}

.el-progress {
  margin-top: 8px;
}
</style>

<template>
    <div class="app-container">
      <el-container>
        <!-- 顶部导航 -->
        <el-header class="mac-header">
          <el-menu mode="horizontal" :default-active="'1'" class="header-menu" background-color="rgba(255,255,255,0.8)">
            <el-menu-item index="1">
              <i class="el-icon-monitor"></i>
              <span class="title">项目数据中心</span>
            </el-menu-item>
          </el-menu>
        </el-header>
  
        <el-main class="mac-main">
          <!-- 项目整体概览仪表盘 -->
          <div class="dashboard">
            <div class="dashboard-header">
              <h2>项目概览</h2>
              <el-date-picker
                v-model="timeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                class="mac-date-picker">
              </el-date-picker>
            </div>
  
            <el-row :gutter="24" class="metrics-grid">
              <el-col :span="6" v-for="(metric, index) in metrics" :key="index">
                <el-card :class="['metric-card', metric.type]" shadow="hover">
                  <div class="metric-icon">
                    <i :class="metric.icon"></i>
                  </div>
                  <div class="metric-content">
                    <h3>{{ metric.title }}</h3>
                    <div class="metric-value">{{ metric.value }}</div>
                    <div :class="['metric-trend', metric.trend > 0 ? 'positive' : 'negative']">
                      {{ metric.trend > 0 ? '↑' : '↓' }} {{ Math.abs(metric.trend) }}%
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
  
          <!-- 图表区域 -->
          <el-row :gutter="24" class="chart-container">
            <el-col :span="12">
              <el-card class="chart-card mac-card">
                <div slot="header" class="chart-header">
                  <span>任务完成趋势</span>
                  <el-radio-group v-model="trendTimeRange" size="small">
                    <el-radio-button label="week">周</el-radio-button>
                    <el-radio-button label="month">月</el-radio-button>
                  </el-radio-group>
                </div>
                <div class="trend-chart">
                  <div class="trend-legend">
                    <div class="legend-item">
                      <span class="dot completed"></span>
                      <span>完成任务</span>
                    </div>
                    <div class="legend-item">
                      <span class="dot new"></span>
                      <span>新增任务</span>
                    </div>
                  </div>
                  <div class="trend-data">
                    <el-table :data="trendData" style="width: 100%">
                      <el-table-column prop="date" label="日期" width="120"></el-table-column>
                      <el-table-column prop="completed" label="完成任务">
                        <template slot-scope="scope">
                          <el-progress :percentage="scope.row.completed" :color="'#42b983'" :show-text="false"></el-progress>
                          <span class="progress-value">{{ scope.row.completed }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="new" label="新增任务">
                        <template slot-scope="scope">
                          <el-progress :percentage="scope.row.new" :color="'#2196f3'" :show-text="false"></el-progress>
                          <span class="progress-value">{{ scope.row.new }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card mac-card">
                <div slot="header" class="chart-header">
                  <span>任务分布</span>
                </div>
                <div class="distribution-chart">
                  <el-row :gutter="20" class="distribution-stats">
                    <el-col :span="6" v-for="(item, index) in distributionData" :key="index">
                      <div class="stat-box">
                        <div class="stat-header">
                          <span class="stat-dot" :style="{ background: item.color }"></span>
                          <span class="stat-label">{{ item.name }}</span>
                        </div>
                        <div class="stat-value">{{ item.value }}</div>
                        <el-progress 
                          :percentage="calculatePercentage(item.value)" 
                          :color="item.color"
                          :show-text="false">
                        </el-progress>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-main>
      </el-container>
    </div>
  </template>
  
  <script>
  import echarts from 'echarts'
  
  export default {
    name: 'App',
    data() {
      return {
        timeRange: '',
        trendTimeRange: 'week',
        metrics: [
          {
            title: '项目完成率',
            value: '78.5%',
            trend: 5.2,
            type: 'primary',
            icon: 'el-icon-data-line'
          },
          {
            title: '延期任务',
            value: '3',
            trend: -2,
            type: 'warning',
            icon: 'el-icon-warning'
          },
          {
            title: '平均完成时间',
            value: '4.2天',
            trend: -0.5,
            type: 'success',
            icon: 'el-icon-timer'
          },
          {
            title: '问题解决率',
            value: '92%',
            trend: 3,
            type: 'info',
            icon: 'el-icon-data-analysis'
          }
        ],
        trendData: [
          { date: '周一', completed: 30, new: 50 },
          { date: '周二', completed: 50, new: 40 },
          { date: '周三', completed: 40, new: 60 },
          { date: '周四', completed: 70, new: 40 },
          { date: '周五', completed: 60, new: 70 },
          { date: '周六', completed: 40, new: 50 },
          { date: '周日', completed: 80, new: 60 }
        ],
        distributionData: [
          { name: '待处理', value: 12, color: '#ff9800' },
          { name: '进行中', value: 8, color: '#2196f3' },
          { name: '审核中', value: 4, color: '#9c27b0' },
          { name: '已完成', value: 16, color: '#4caf50' }
        ]
      }
    },
    mounted() {
      this.initTrendChart()
      this.initDistributionChart()
    },
    methods: {
      initTrendChart() {
        const chart = echarts.init(this.$refs.trendChart)
        chart.setOption({
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['完成任务', '新增任务']
          },
          xAxis: {
            type: 'category',
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '完成任务',
              type: 'line',
              smooth: true,
              data: [3, 5, 4, 7, 6, 4, 8],
              itemStyle: {
                color: '#42b983'
              }
            },
            {
              name: '新增任务',
              type: 'line',
              smooth: true,
              data: [5, 4, 6, 4, 7, 5, 6],
              itemStyle: {
                color: '#2196f3'
              }
            }
          ]
        })
      },
      initDistributionChart() {
        const chart = echarts.init(this.$refs.distributionChart)
        chart.setOption({
          tooltip: {
            trigger: 'item'
          },
          legend: {
            orient: 'vertical',
            left: 'left'
          },
          series: [
            {
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '20',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: [
                { value: 12, name: '待处理', itemStyle: { color: '#ff9800' } },
                { value: 8, name: '进行中', itemStyle: { color: '#2196f3' } },
                { value: 4, name: '审核中', itemStyle: { color: '#9c27b0' } },
                { value: 16, name: '已完成', itemStyle: { color: '#4caf50' } }
              ]
            }
          ]
        })
      },
      calculatePercentage(value) {
        const total = this.distributionData.reduce((sum, item) => sum + item.value, 0)
        return Math.round((value / total) * 100)
      }
    }
  }
  </script>
  
  <style>
  /* 保持原有样式，移除甘特图相关样式 */
  /* 全局样式 */
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #f5f7fa;
    color: #2c3e50;
  }
  
  .app-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 20px;
  }
  
  /* 苹果风格头部 */
  .mac-header {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
  }
  
  .header-menu {
    border: none !important;
    height: 60px;
    line-height: 60px;
  }
  
  .header-menu .el-menu-item {
    font-size: 16px;
    color: #2c3e50 !important;
  }
  
  .title {
    font-weight: 500;
    margin-left: 8px;
  }
  
  /* 主要内容区域 */
  .mac-main {
    padding: 32px;
    background-color: #f5f7fa;
  }
  
  /* 仪表盘样式 */
  .dashboard-header {
    margin-bottom: 32px;
  }
  
  .dashboard-header h2 {
    font-size: 24px;
    font-weight: 500;
    color: #2c3e50;
  }
  
  /* 指标卡片样式 */
  .metric-card {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px !important;
    transition: all 0.3s ease;
    border: none !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
  }
  
  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  }
  
  .metric-icon {
    font-size: 28px;
    margin-right: 20px;
    opacity: 0.8;
  }
  
  .metric-content h3 {
    font-size: 15px;
    color: #8c8c8c;
    font-weight: normal;
  }
  
  .metric-value {
    font-size: 28px;
    font-weight: 500;
    color: #2c3e50;
  }
  
  /* 图表卡片样式 */
  .mac-card {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px !important;
    border: none !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
  }
  
  .chart-header {
    padding: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .chart-header span {
    font-size: 16px;
    font-weight: 500;
    color: #2c3e50;
  }
  
  .chart {
    height: 350px;
    padding: 20px;
  }
  
  /* 趋势指标样式 */
  .metric-trend {
    font-size: 13px;
    font-weight: 500;
  }
  
  .metric-trend.positive {
    color: #34c759;
  }
  
  .metric-trend.negative {
    color: #ff3b30;
  }
  
  /* 卡片边框颜色 */
  .metric-card.primary {
    border-left: 3px solid #007aff !important;
  }
  
  .metric-card.warning {
    border-left: 3px solid #ff9500 !important;
  }
  
  .metric-card.success {
    border-left: 3px solid #34c759 !important;
  }
  
  .metric-card.info {
    border-left: 3px solid #5856d6 !important;
  }
  
  /* Element UI 组件样式覆盖 */
  .el-card__header {
    padding: 0;
    border-bottom: none;
  }
  
  .el-date-editor.el-input {
    width: 260px;
  }
  
  .el-radio-button__inner {
    border-radius: 6px !important;
    padding: 8px 16px;
  }
  
  .el-radio-group {
    display: flex;
    gap: 8px;
  }
  
  /* 响应式布局调整 */
  @media (max-width: 1200px) {
    .app-container {
      padding: 16px;
    }
    
    .mac-main {
      padding: 24px;
    }
    
    .metrics-grid .el-col {
      margin-bottom: 16px;
    }
  }
  
  .trend-chart {
    padding: 20px;
  }
  
  .trend-legend {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .dot.completed {
    background: #42b983;
  }
  
  .dot.new {
    background: #2196f3;
  }
  
  .trend-data .el-table {
    background: transparent;
  }
  
  .trend-data .el-table th {
    background: #f5f7fa;
    color: #2c3e50;
  }
  
  .progress-value {
    margin-left: 8px;
    color: #606266;
    font-size: 13px;
  }
  
  .distribution-chart {
    padding: 20px;
  }
  
  .distribution-stats {
    margin-top: 20px;
  }
  
  .stat-box {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .stat-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .stat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .stat-label {
    font-size: 14px;
    color: #606266;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 8px;
  }
  
  .el-progress-bar__outer {
    background-color: rgba(0, 0, 0, 0.04) !important;
  }
  
  .el-table td, .el-table th {
    padding: 8px 0;
  }
  
  .el-table--enable-row-hover .el-table__body tr:hover > td {
    background-color: #f5f7fa;
  }
  </style>
  
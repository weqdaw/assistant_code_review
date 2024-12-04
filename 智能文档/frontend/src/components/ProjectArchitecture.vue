<template>
  <div class="project-architecture">
    <div class="content-area">
      <div class="upload-section">
        <div class="upload-area" v-if="!projectFiles.length">
          <input 
            type="file" 
            webkitdirectory
            directory
            multiple
            @change="handleFileUpload"
            ref="fileInput"
            style="display: none"
          >
          <button class="upload-button" @click="$refs.fileInput.click()">
            <span class="upload-icon">📁</span>
            <span>上传项目文件夹</span>
          </button>
        </div>
        <div v-else class="file-list">
          <div class="file-list-header">
            <h3>已上传文件</h3>
            <div class="action-buttons">
              <button class="analyze-button" @click="generateArchitecture">
                <span class="analyze-icon">🔄</span>
                生成架构图
              </button>
              <button class="clear-button" @click="clearFiles">
                <span class="clear-icon">🗑️</span>
                清除文件
              </button>
            </div>
          </div>
          <div class="files">
            <div v-for="(file, index) in projectFiles" 
                 :key="index" 
                 class="file-item">
              {{ file.name }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="architecture-diagram" v-if="showDiagram">
        <div class="diagram-container">
          <div class="diagram-header">
            <h3>项目架构图</h3>
            <div class="export-buttons">
              <button class="export-button" @click="exportAsPNG">
                <span class="export-icon">💾</span>
                导出PNG
              </button>
              <button class="export-button" @click="exportAsSVG">
                <span class="export-icon">📊</span>
                导出SVG
              </button>
            </div>
          </div>
          <div class="diagram-content">
            <div ref="mermaidDiv" class="mermaid"></div>
            <img v-if="diagramImage" :src="diagramImage" alt="项目架构图" class="diagram-image">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import html2canvas from 'html2canvas'

export default {
  name: 'ProjectArchitecture',
  data() {
    return {
      projectFiles: [],
      showDiagram: false,
      fileStructure: null,
      isGenerating: false,
      diagramImage: null
    }
  },
  mounted() {
    // 确保 mermaid 已初始化
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        flowchart: {
          curve: 'basis',
          nodeSpacing: 60,
          rankSpacing: 80,
          padding: 20,
          useMaxWidth: true
        }
      })
    }
  },
  methods: {
    handleFileUpload(event) {
      const files = Array.from(event.target.files)
      this.projectFiles = files
      this.showDiagram = false
      this.analyzeFileStructure(files)
    },
    analyzeFileStructure(files) {
      const structure = {}
      files.forEach(file => {
        const path = file.webkitRelativePath.split('/')
        let current = structure
        path.forEach((part, index) => {
          if (index === path.length - 1) {
            if (!current.files) current.files = []
            current.files.push({
              name: part,
              type: this.getFileType(part)
            })
          } else {
            if (!current.dirs) current.dirs = {}
            if (!current.dirs[part]) current.dirs[part] = {}
            current = current.dirs[part]
          }
        })
      })
      this.fileStructure = structure
    },
    async generateArchitecture() {
      if (!this.fileStructure || this.isGenerating) return
      
      this.isGenerating = true
      this.showDiagram = true
      
      try {
        const diagram = `
          graph TB
          classDef default fill:#f5f7fa,stroke:#1e88e5,stroke-width:2px
          classDef folder fill:#e3f2fd,stroke:#1e88e5,stroke-width:2px
          classDef file fill:#ffffff,stroke:#1e88e5,stroke-width:1px
          linkStyle default stroke:#1e88e5,stroke-width:1px
          ${this.generateMermaidNodes(this.fileStructure, 'root')}
        `

        await this.$nextTick()
        const element = this.$refs.mermaidDiv
        element.innerHTML = diagram
        
        // 渲染完成后转换为图片
        await window.mermaid.init(undefined, element)
        await this.$nextTick()
        
        // 获取生成的 SVG
        const svg = element.querySelector('svg')
        if (svg) {
          // 设置 SVG 的背景色
          svg.style.background = 'white'
          
          // 转换 SVG 为字符串
          const svgData = new XMLSerializer().serializeToString(svg)
          
          // 创建 Blob
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
          
          // 如果已存在旧的图片 URL，先释放它
          if (this.diagramImage) {
            URL.revokeObjectURL(this.diagramImage)
          }
          
          // 创建新的图片 URL
          this.diagramImage = URL.createObjectURL(svgBlob)
        }
      } catch (error) {
        console.error('生成架构图失败:', error)
        alert('生成架构图失败，请重试')
      } finally {
        this.isGenerating = false
      }
    },
    formatNodeLabel(label) {
      // 限制标签长度，避免节点过宽
      return label.length > 25 ? label.substring(0, 22) + '...' : label
    },
    generateMermaidNodes(structure, parentId, level = 0) {
      let diagram = ''
      let counter = 0
      
      // 首先处理根节点
      if (parentId === 'root') {
        diagram += `root["📁 项目根目录"]\n`
      }
      
      // 处理目录，过滤掉隐藏文件夹
      if (structure.dirs) {
        Object.entries(structure.dirs)
          .filter(([dirName]) => !dirName.startsWith('.'))
          .sort()
          .forEach(([dirName, content]) => {
            const currentId = `${parentId}_d${counter}`
            const displayName = this.formatNodeLabel(dirName)
            diagram += `${currentId}["📁 ${displayName}"]\n`
            diagram += `${parentId} --> ${currentId}\n`
            diagram += `class ${currentId} folder\n`
            diagram += this.generateMermaidNodes(content, currentId, level + 1)
            counter++
          })
      }
      
      // 处理文件，过滤掉隐藏文件
      if (structure.files) {
        const visibleFiles = structure.files.filter(file => !file.name.startsWith('.'))
        const groupedFiles = this.groupFilesByType(visibleFiles)
        
        Object.entries(groupedFiles)
          .sort((a, b) => {
            const order = {
              'JavaScript': 1,
              'TypeScript': 2,
              'Vue组件': 3,
              'JSON配置': 4,
              '其他文件': 99
            }
            return (order[a[0]] || 50) - (order[b[0]] || 50)
          })
          .forEach(([type, files]) => {
            if (files.length > 0) {
              const fileId = `${parentId}_f${counter}`
              const fileNames = files
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(f => this.formatNodeLabel(f.name))
                .join('\\n')
              
              diagram += `${fileId}["${this.getFileIcon(type)} ${type}\\n${fileNames}"]\n`
              diagram += `${parentId} --> ${fileId}\n`
              diagram += `class ${fileId} file\n`
              counter++
            }
          })
      }
      
      return diagram
    },
    groupFilesByType(files) {
      const groups = {}
      files.forEach(file => {
        if (!groups[file.type]) groups[file.type] = []
        groups[file.type].push(file)
      })
      return groups
    },
    getFileType(filename) {
      // 忽略隐藏文件
      if (filename.startsWith('.')) {
        return null
      }
      
      const ext = filename.split('.').pop().toLowerCase()
      const typeMap = {
        'js': 'JavaScript',
        'ts': 'TypeScript',
        'vue': 'Vue组件',
        'jsx': 'React组件',
        'tsx': 'React组件',
        'css': 'CSS样式',
        'scss': 'SCSS样式',
        'less': 'LESS样式',
        'html': 'HTML页面',
        'json': 'JSON配置',
        'md': 'Markdown文档',
        'yaml': 'YAML配置',
        'yml': 'YAML配置',
        'xml': 'XML文件',
        'svg': 'SVG图标',
        'png': '图片资源',
        'jpg': '图片资源',
        'jpeg': '图片资源',
        'gif': '图片资源'
      }
      return typeMap[ext] || '其他文件'
    },
    getFileIcon(type) {
      const iconMap = {
        'JavaScript': '📜',
        'Vue组件': '⚡',
        'React组件': '⚛️',
        'TypeScript': '📘',
        'CSS样式': '🎨',
        'SCSS样式': '🎨',
        'HTML页面': '🌐',
        'JSON配置': '⚙️',
        'Markdown文档': '📝'
      }
      return iconMap[type] || '📄'
    },
    clearFiles() {
      this.projectFiles = []
      this.fileStructure = null
      this.showDiagram = false
      if (this.diagramImage) {
        URL.revokeObjectURL(this.diagramImage)
        this.diagramImage = null
      }
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    },
    async exportAsPNG() {
      try {
        const element = this.$refs.mermaidDiv
        const svg = element.querySelector('svg')
        if (!svg) {
          throw new Error('未找到SVG元素')
        }

        // 创建一个包装容器
        const container = document.createElement('div')
        container.style.position = 'absolute'
        container.style.left = '-9999px'
        container.style.background = 'white'
        container.style.padding = '20px'
        
        // 克隆 SVG 并设置尺寸
        const svgClone = svg.cloneNode(true)
        svgClone.style.background = 'white'
        container.appendChild(svgClone)
        document.body.appendChild(container)

        // 使用 html2canvas 捕获
        const canvas = await html2canvas(container, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          allowTaint: true,
          useCORS: true
        })

        // 创建下载链接
        const link = document.createElement('a')
        link.download = `项目架构图_${new Date().toISOString().slice(0,10)}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()

        // 清理临时元素
        document.body.removeChild(container)
      } catch (error) {
        console.error('导出PNG失败:', error)
        alert('导出PNG失败，请重试')
      }
    },
    async exportAsSVG() {
      try {
        const element = this.$refs.mermaidDiv
        const svg = element.querySelector('svg')
        if (!svg) {
          throw new Error('未找到SVG元素')
        }

        // 克隆 SVG 以保留样式
        const svgClone = svg.cloneNode(true)
        
        // 添加白色背景
        svgClone.style.background = 'white'
        
        // 收集所有相关样式
        const styleSheets = document.styleSheets
        let styleText = ''
        for (let sheet of styleSheets) {
          try {
            const rules = sheet.cssRules || sheet.rules
            for (let rule of rules) {
              if (rule.selectorText && 
                  (rule.selectorText.includes('.node') || 
                   rule.selectorText.includes('.edgePath'))) {
                styleText += rule.cssText + '\n'
              }
            }
          } catch (e) {
            console.warn('无法读取样式表:', e)
          }
        }

        // 添加样式到 SVG
        const styleElement = document.createElement('style')
        styleElement.textContent = styleText
        svgClone.insertBefore(styleElement, svgClone.firstChild)

        // 创建 SVG blob
        const svgData = new XMLSerializer().serializeToString(svgClone)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        
        // 创建下载链接
        const link = document.createElement('a')
        link.download = `项目架构图_${new Date().toISOString().slice(0,10)}.svg`
        link.href = URL.createObjectURL(svgBlob)
        link.click()
        
        // 清理资源
        URL.revokeObjectURL(link.href)
      } catch (error) {
        console.error('导出SVG失败:', error)
        alert('导出SVG失败，请重试')
      }
    }
  }
}
</script>

<style scoped>
.project-architecture {
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

.upload-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.upload-area {
  text-align: center;
  padding: 40px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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

.file-list {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.file-list h3 {
  color: #1e88e5;
  margin-bottom: 0;
}

.files {
  flex: 1;
  overflow-y: auto;
  background: #f8faff;
  border-radius: 8px;
  padding: 12px;
}

.file-item {
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #2c3e50;
}

.analyze-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.analyze-button:hover {
  background-color: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analyze-icon {
  font-size: 1rem;
}

.architecture-diagram {
  flex: 2;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: all 0.3s ease;
}

.diagram-container h3 {
  color: #1e88e5;
  margin-bottom: 16px;
}

.diagram-placeholder {
  height: calc(100% - 40px);
  background: #f8faff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #78909c;
}

.mermaid {
  width: 100%;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.diagram-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.architecture-diagram {
  transition: all 0.3s ease;
}


::v-deep .node text {
  font-family: 'Helvetica Neue', Arial, sans-serif !important;
  font-size: 13px !important;
  font-weight: normal !important;
}

::v-deep .node rect {
  rx: 8px;
  ry: 8px;
  stroke-width: 1.5px !important;
}

::v-deep .edgePath path {
  stroke-width: 1px !important;
}

::v-deep .edgePath marker {
  fill: #1e88e5;
}

::v-deep svg {
  max-width: 100%;
  height: auto !important;
}

.diagram-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.export-buttons {
  display: flex;
  gap: 12px;
}

.export-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #f8faff;
  color: #1e88e5;
  border: 1px solid #1e88e5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.export-button:hover {
  background-color: #e3f2fd;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.export-button:active {
  transform: translateY(0);
}

.export-icon {
  font-size: 1.1rem;
}

.mermaid-diagram :deep(svg) {
  max-width: 100%;
  height: auto;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #fff;
  color: #dc3545;
  border: 1px solid #dc3545;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background-color: #dc3545;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.clear-icon {
  font-size: 1rem;
}

.image-container {
  width: 100%;
  height: calc(100vh - 200px);
  overflow: auto;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.diagram-image {
  width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

/* 添加图片缩放动画 */
.diagram-image {
  transition: transform 0.3s ease;
}

.diagram-image:hover {
  transform: scale(1.02);
}

/* 优化滚动条样式 */
.image-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.image-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.image-container::-webkit-scrollbar-thumb {
  background: #1e88e5;
  border-radius: 4px;
}

.image-container::-webkit-scrollbar-thumb:hover {
  background: #1976d2;
}

/* 添加一些动画效果 */
.architecture-diagram {
  transition: all 0.3s ease;
}

.diagram-content {
  position: relative;
  width: 100%;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  overflow: auto;
}

.mermaid {
  position: absolute;
  visibility: hidden;
  width: 100%;
  height: 100%;
}

.diagram-image {
  width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

/* 添加滚动条样式 */
.diagram-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.diagram-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.diagram-content::-webkit-scrollbar-thumb {
  background: #1e88e5;
  border-radius: 4px;
}

.diagram-content::-webkit-scrollbar-thumb:hover {
  background: #1976d2;
}

::v-deep .node rect {
  rx: 8px;
  ry: 8px;
}

::v-deep .node text {
  font-family: 'Helvetica Neue', Arial, sans-serif !important;
  font-size: 14px !important;
}

::v-deep .edgePath path {
  stroke-width: 1.5px;
}

::v-deep .edgePath marker {
  fill: #1e88e5;
}
</style> 
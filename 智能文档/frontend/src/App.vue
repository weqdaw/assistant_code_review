<template>
  <div id="app">
    <nav class="navbar">
      <div class="logo">智能工程助手Teachmind</div>
      <div class="nav-buttons">
        <router-link 
          v-for="route in routes" 
          :key="route.path"
          :to="route.path"
          custom
          v-slot="{ navigate, isActive }"
        >
          <button 
            @click="navigate" 
            :class="{ active: isActive }"
          >
            <span class="nav-icon">{{ route.icon }}</span>
            {{ route.name }}
          </button>
        </router-link>
      </div>
    </nav>
    <transition name="fade" mode="out-in">
      <router-view></router-view>
    </transition>
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isLoading: false,
      routes: [
        { path: '/document-chat', name: '文档查询', icon: '📄' },
        { path: '/project-architecture', name: '绘制架构图', icon: '📐' }
      ]
    }
  },
  created() {// 页面加载完成后，默认跳转到文档查询页面
    // 添加路由默认跳转
    if (this.$route.path === '/') {
      this.$router.push('/document-chat')
    }
  },
  watch: {// 路由切换时，显示/隐藏加载动画
    '$route'() {
      this.isLoading = true
      this.$nextTick(() => {
        setTimeout(() => {
          this.isLoading = false
        }, 300)
      })
    }
  }

}
</script>

<style>
#app {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 1.5rem;
  font-weight: 500;
  color: #1e88e5;
  user-select: none;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
}

.nav-buttons button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1.2rem;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 140px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.nav-buttons button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s;
}

.nav-buttons button:hover {
  background-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.nav-buttons button:hover::after {
  opacity: 1;
}

.nav-buttons button:active {
  transform: translateY(0);
}

.nav-buttons button.active {
  background-color: #1565c0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  font-size: 1.1rem;
  line-height: 1;
}

/* 页面切换动画 */
.fade-enter-active, 
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
  }
  
  .nav-buttons {
    gap: 0.5rem;
  }
  
  .nav-buttons button {
    min-width: auto;
    padding: 0.5rem 1rem;
  }
  
  .logo {
    font-size: 1.2rem;
  }
}

/* 禁用文本选择 */
button {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* 优化滚动行为 */
html {
  scroll-behavior: smooth;
}

/* 添加暗色模式支持 */
@media (prefers-color-scheme: dark) {
  #app {
    background-color: #1a1a1a;
    color: #ffffff;
  }
  
  .navbar {
    background-color: #2d2d2d;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1e88e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

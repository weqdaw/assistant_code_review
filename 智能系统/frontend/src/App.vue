<template>
  <div id="app">
    <!-- 路由视图 -->
    <router-view></router-view>

    <!-- 半透明悬浮导航栏 -->
    <nav class="floating-nav">
      <router-link 
        v-for="route in routes" 
        :key="route.path"
        :to="route.path"
        class="nav-item"
        :class="{ active: currentRoute === route.path }"
      >
        {{ route.name }}
      </router-link>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      routes: [
        { path: '/qa', name: '项目问答' },
        { path: '/review', name: '智能审查' },
        { path: '/reading', name: '智能导读' }
      ],
      currentRoute: '/qa'
    }
  },
  watch: {
    '$route'(to) {
      this.currentRoute = to.path;
    }
  },
  mounted() {
    this.currentRoute = this.$route.path;
  }
}
</script>

<style>
/* 悬浮导航栏样式 */
.floating-nav {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.nav-item {
  padding: 10px 20px;
  color: #666;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.nav-item.active {
  background: rgba(0, 122, 255, 0.8);
  color: white;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .floating-nav {
    background: rgba(30, 30, 30, 0.6);
  }

  .nav-item {
    color: #999;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .nav-item.active {
    background: rgba(10, 132, 255, 0.8);
    color: white;
  }
}
</style>

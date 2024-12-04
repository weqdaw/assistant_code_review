import Vue from 'vue'
import App from './App.vue'
import router from './router'  // 导入路由配置

Vue.config.productionTip = false

new Vue({
  router,  // 添加路由配置
  render: h => h(App)
}).$mount('#app')

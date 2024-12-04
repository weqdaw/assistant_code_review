import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

Vue.config.errorHandler = function(err) {
  console.error('Vue Error:', err)
  // 这里可以添加错误上报逻辑
}

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

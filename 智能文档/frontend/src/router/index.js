import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 使用路由懒加载
const routes = [
  {
    path: '/',
    redirect: '/document-chat'
  },
  {
    path: '/document-chat',
    name: 'DocumentChat',
    component: () => import(/* webpackChunkName: "document-chat" */ '../components/DocumentChat.vue')
  },
  {
    path: '/project-architecture',
    name: 'ProjectArchitecture',
    component: () => import(/* webpackChunkName: "project-architecture" */ '../components/ProjectArchitecture.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router 
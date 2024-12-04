import Vue from 'vue'
import VueRouter from 'vue-router'
import App1 from '../components/App1.vue'
import App2 from '../components/App2.vue'
import App3 from '../components/App3.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/qa'
  },
  {
    path: '/qa',
    name: 'ProjectQA',
    component: App1
  },
  {
    path: '/review',
    name: 'CodeReview',
    component: App2
  },
  {
    path: '/reading',
    name: 'CodeReading',
    component: App3
  }
]

const router = new VueRouter({
  routes
})

export default router 
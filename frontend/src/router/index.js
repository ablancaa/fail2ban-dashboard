import { createRouter, createWebHistory } from 'vue-router'

import DashBoardView from '@/views/DashBoardView.vue'
import JailsView from '@/views/JailsView.vue'
import BannedIpView from '@/views/BannedIpView.vue'
import JailConfigView from '@/views/JailConfigView.vue'
import LogHistoryView from '@/views/LogHistoryView.vue'



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    {
      path: '/',
      name: 'DashBoardView',
      component: DashBoardView
    },
    {
      path: '/JailsView',
      name: 'JailsView',
      component: JailsView
    },
    {
      path: '/BannedIpView',
      name: 'BannedIpView',
      component: BannedIpView
    },
    {
      path: '/JailConfigView',
      name: 'JailConfigView',
      component: JailConfigView
    },
    {
      path: '/LogHistoryView',
      name: 'LogHistoryView',
      component: LogHistoryView
    }
  ],
})

export default router

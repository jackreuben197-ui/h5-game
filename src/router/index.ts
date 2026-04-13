import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: () => import('@/views/LobbyView.vue'),
    },
    {
      path: '/bridge-debug',
      name: 'bridge-debug',
      component: () => import('@/views/BridgeDebugView.vue'),
    },
  ],
})

export default router

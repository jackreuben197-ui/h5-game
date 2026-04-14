import { createRouter, createWebHashHistory } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/stores/pinia'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/',
      name: 'lobby',
      component: () => import('@/views/lobby/LobbyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/bridge-debug',
      name: 'bridge-debug',
      component: () => import('@/views/debug/BridgeDebugView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken

  if (to.meta.requiresAuth && !token) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.name === 'login' && token) {
    return { name: 'lobby' }
  }

  return true
})

export default router

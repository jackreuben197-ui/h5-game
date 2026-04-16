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

      component: () => import('@/views/main/MainLayoutView.vue'),
      meta: { requiresAuth: true },
      redirect: '/home',
      children: [
        {
          path: 'home',
          name: 'lobby',

          component: () => import('@/views/home/HomeIndexView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'home',
            moduleTitle: '首页',
          },
        },
        {
          path: 'club',
          name: 'club',
          component: () => import('@/views/club/ClubIndexView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'club',
            moduleTitle: '俱乐部',
          },
        },
        {
          path: 'recharge',
          name: 'recharge',
          component: () => import('@/views/recharge/RechargeIndexView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'recharge',
            moduleTitle: '充值',
          },
        },
        {
          path: 'message',
          name: 'message',
          component: () => import('@/views/message/MessageIndexView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'message',
            moduleTitle: '消息',
          },
        },
        {
          path: 'mine',
          name: 'mine',
          component: () => import('@/views/mine/MineIndexView.vue'),
          meta: {
            requiresAuth: true,
            tabKey: 'mine',
            moduleTitle: '我的',
          },
        },
      ],
    },
    // 子页面独立路由：按业务需要决定是否复用 MainLayoutView。
    {
      path: '/home/task',
      name: 'home-task',
      component: () => import('@/views/home/HomeTaskView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/club/members',
      name: 'club-members',
      component: () => import('@/views/club/ClubMembersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/recharge/records',
      name: 'recharge-records',
      component: () => import('@/views/recharge/RechargeRecordsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/message/detail',
      name: 'message-detail',
      component: () => import('@/views/message/MessageDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mine/settings',
      name: 'mine-settings',
      component: () => import('@/views/mine/MineSettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/gameList',
      name: 'game-list',
      component: () => import('@/views/home/gameList.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken

  if (to.meta.requiresAuth && !token) {
    // 未登录统一进入登录页；登录成功后固定回首页，不做业务页重定向。
    return { name: 'login' }
  }

  if (to.name === 'login' && token) {
    return { name: 'lobby' }
  }

  return true
})

export default router

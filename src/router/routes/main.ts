import type { RouteRecordRaw } from 'vue-router'
import { clubTabRoute } from './club'
import { messageTabRoute } from './message'
import { mineTabRoute } from './mine'

export const mainRoute: RouteRecordRaw = {
  path: '/',
  component: () => import('@/views/main/MainLayoutView.vue'),
  redirect: '/home',
  children: [
    {
      path: 'home',
      alias: ['guest/home'],
      name: 'lobby',
      component: () => import('@/views/home/HomeIndexView.vue'),
      meta: {
        requiresAuth: true,
        guestPreview: true,
        tabKey: 'home',
        moduleTitle: '首页',
        desktopLayout: 'primary',
      },
    },
    clubTabRoute,
    {
      path: 'friendsTable',
      name: 'friendsTable',
      component: () => import('@/views/friendsTable/FriendsTableIndexView.vue'),
      meta: {
        requiresAuth: true,
        guestPreview: true,
        tabKey: 'friendsTable',
        moduleTitle: '朋友桌',
        desktopLayout: 'primary',
      },
    },
    messageTabRoute,
    mineTabRoute,
  ],
}

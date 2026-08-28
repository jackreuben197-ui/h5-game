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
      name: 'lobby',
      component: () => import('@/views/home/HomeIndexView.vue'),
      meta: {
        requiresAuth: true,
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
        tabKey: 'friendsTable',
        moduleTitle: '朋友桌',
        desktopLayout: 'primary',
      },
    },
    messageTabRoute,
    mineTabRoute,
    // 访客（未登录）专用页面，与登录版共用 MainLayoutView 与底部 Tab。
    {
      path: 'guest/home',
      name: 'guest-home',
      component: () => import('@/views/guest/GuestHomeView.vue'),
      meta: { tabKey: 'home', moduleTitle: '首页', desktopLayout: 'primary' },
    },
    {
      path: 'guest/club',
      name: 'guest-club',
      component: () => import('@/views/guest/GuestClubView.vue'),
      meta: { tabKey: 'club', moduleTitle: '俱乐部', desktopLayout: 'primary' },
    },
    {
      path: 'guest/friendsTable',
      name: 'guest-friendsTable',
      component: () => import('@/views/guest/GuestFriendsTableView.vue'),
      meta: { tabKey: 'friendsTable', moduleTitle: '朋友桌', desktopLayout: 'primary' },
    },
    {
      path: 'guest/message',
      name: 'guest-message',
      component: () => import('@/views/guest/GuestMessageView.vue'),
      meta: { tabKey: 'message', moduleTitle: '消息', desktopLayout: 'primary' },
    },
    {
      path: 'guest/mine',
      name: 'guest-mine',
      component: () => import('@/views/guest/GuestMineView.vue'),
      meta: { tabKey: 'mine', moduleTitle: '我的', desktopLayout: 'primary' },
    },
  ],
}

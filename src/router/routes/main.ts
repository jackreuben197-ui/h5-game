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
      path: 'channel/tables',
      name: 'channel-c-poker',
      component: () => import('@/components/ChannelC/ChannelCHome.vue'),
      props: { section: 'poker' },
      meta: { requiresAuth: true, guestPreview: true, tabKey: 'poker', desktopLayout: 'primary' },
    },
    {
      path: 'channel/matches',
      name: 'channel-c-mtt',
      component: () => import('@/components/ChannelC/ChannelCHome.vue'),
      props: { section: 'mtt' },
      meta: { requiresAuth: true, guestPreview: true, tabKey: 'mtt', desktopLayout: 'primary' },
    },
    {
      path: 'channel/search',
      name: 'channel-c-search',
      component: () => import('@/components/ChannelC/ChannelCSearch.vue'),
      meta: {
        requiresAuth: true,
        guestPreview: true,
        tabKey: 'home',
        moduleTitle: '搜索',
        desktopLayout: 'primary',
      },
    },
    ...(import.meta.env.DEV
      ? [
          {
            path: 'dev/channel-c',
            name: 'channel-c-preview',
            redirect: '/home',
          },
        ]
      : []),
    {
      path: 'home',
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

import type { RouteRecordRaw } from 'vue-router'

export const messageTabRoute: RouteRecordRaw = {
  path: 'message',
  name: 'message',
  component: () => import('@/views/message/MessageIndexView.vue'),
  meta: {
    requiresAuth: true,
    tabKey: 'message',
    moduleTitle: '消息',
    desktopLayout: 'primary',
  },
}

export const messageRoutes: RouteRecordRaw[] = [
  {
    path: '/message',
    meta: { requiresAuth: true, desktopLayout: 'content' },
    children: [
      {
        path: 'detail',
        name: 'message-detail',
        component: () => import('@/views/message/detail/MessageDetailView.vue'),
      },
    ],
  },
]

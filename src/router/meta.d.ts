import 'vue-router'
import type { MainLayout } from '@/utils/mainLayout'

export {}

declare module 'vue-router' {
  interface RouteMeta {
    /** 桌面 / Pad 页面框架。一级主页面使用 primary；二三级页面按需逐步接入。 */
    desktopLayout?: MainLayout
  }
}

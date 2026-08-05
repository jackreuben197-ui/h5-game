export const MAIN_LAYOUTS = ['primary', 'content'] as const

export type MainLayout = (typeof MAIN_LAYOUTS)[number]

function isMainLayout(layout: unknown): layout is MainLayout {
  return MAIN_LAYOUTS.includes(layout as MainLayout)
}

/**
 * 把路由声明的页面框架同步到 html，供首层画布、rem 和桌面样式共同读取。
 * primary 用于五个一级 Tab 页，content 用于已完成桌面适配的二三级内容页。
 */
export function syncMainLayout(layout: unknown): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const nextLayout = isMainLayout(layout) ? layout : undefined

  if (root.dataset.mainLayout === nextLayout) {
    return
  }

  if (nextLayout) {
    root.dataset.mainLayout = nextLayout
  } else {
    delete root.dataset.mainLayout
  }

  window.dispatchEvent(new Event('h5:main-layout-change'))
  window.dispatchEvent(new Event('resize'))
}

export function clearMainLayout(): void {
  syncMainLayout(undefined)
}

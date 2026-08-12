export const MAIN_LAYOUTS = ['primary', 'content'] as const

export type MainLayout = (typeof MAIN_LAYOUTS)[number]

const DESKTOP_MEDIA_QUERY = '(min-width: 600px)'
const desktopStylePromises: Partial<Record<MainLayout, Promise<unknown>>> = {}
let activeLayout: MainLayout | undefined
let desktopMediaQuery: MediaQueryList | null = null

const desktopStyleLoaders: Record<MainLayout, () => Promise<unknown>> = {
  primary: () => import('@/styles/_main_desktop.scss'),
  content: () => import('@/styles/_content_desktop.scss'),
}

function isMainLayout(layout: unknown): layout is MainLayout {
  return MAIN_LAYOUTS.includes(layout as MainLayout)
}

function loadDesktopStyles(layout: MainLayout): Promise<unknown> {
  if (!desktopStylePromises[layout]) {
    desktopStylePromises[layout] = desktopStyleLoaders[layout]().catch((error: unknown) => {
      // 网络瞬断时允许下一次导航或视口变化重新尝试加载。
      delete desktopStylePromises[layout]
      throw error
    })
  }
  return desktopStylePromises[layout]
}

function ensureDesktopStyles(): void {
  if (!activeLayout || typeof window === 'undefined') {
    return
  }

  desktopMediaQuery ??= window.matchMedia(DESKTOP_MEDIA_QUERY)
  if (desktopMediaQuery.matches) {
    const layout = activeLayout
    void loadDesktopStyles(layout).catch((error: unknown) => {
      console.warn(`[layout] failed to load ${layout} desktop styles:`, error)
    })
  }
}

function ensureDesktopMediaListener(): void {
  if (desktopMediaQuery || typeof window === 'undefined') {
    return
  }

  desktopMediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
  if (typeof desktopMediaQuery.addEventListener === 'function') {
    desktopMediaQuery.addEventListener('change', ensureDesktopStyles)
  } else {
    // iOS 12 旧 WebView 仅支持已废弃的 addListener。
    desktopMediaQuery.addListener(ensureDesktopStyles)
  }
}

/** 在桌面导航确认前准备对应页面族 CSS，避免异步样式造成首帧闪动。 */
export async function preloadMainLayoutStyles(layout: unknown): Promise<void> {
  if (!isMainLayout(layout) || typeof window === 'undefined') {
    return
  }

  const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
  if (mediaQuery.matches) {
    try {
      await loadDesktopStyles(layout)
    } catch (error) {
      // 样式分包失败不应阻断路由；后续布局同步仍会自动重试。
      console.warn(`[layout] failed to preload ${layout} desktop styles:`, error)
    }
  }
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

  activeLayout = nextLayout
  if (nextLayout) {
    ensureDesktopMediaListener()
    ensureDesktopStyles()
  }

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

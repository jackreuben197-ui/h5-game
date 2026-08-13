export const MAIN_LAYOUTS = ['primary', 'content'] as const

export type MainLayout = (typeof MAIN_LAYOUTS)[number]

const DESKTOP_MEDIA_QUERY = '(min-width: 600px)'
const desktopStylePromises = new Map<string, Promise<unknown>>()
let activeLayout: MainLayout | undefined
let activePath = ''
let desktopMediaQuery: MediaQueryList | null = null

const desktopStyleLoaders: Record<MainLayout, () => Promise<unknown>> = {
  primary: () => import('@/styles/_main_desktop.scss'),
  content: () => import('@/styles/_content_desktop.scss'),
}

const contentStyleLoaders = {
  table: () => import('@/styles/_content_desktop_table.scss'),
  club: () => import('@/styles/_content_desktop_club.scss'),
  wallet: () => import('@/styles/_content_desktop_wallet.scss'),
  career: () => import('@/styles/_content_desktop_career.scss'),
  mtt: () => import('@/styles/_content_desktop_mtt.scss'),
  message: () => import('@/styles/_content_desktop_message.scss'),
  careerExtra: () => import('@/styles/_content_desktop_career_extra.scss'),
  mine: () => import('@/styles/_content_desktop_mine.scss'),
  walletExtra: () => import('@/styles/_content_desktop_wallet_extra.scss'),
  landing: () => import('@/styles/_content_desktop_landing.scss'),
} as const

type ContentStyleGroup = keyof typeof contentStyleLoaders

function isMainLayout(layout: unknown): layout is MainLayout {
  return MAIN_LAYOUTS.includes(layout as MainLayout)
}

function loadStyle(key: string, loader: () => Promise<unknown>): Promise<unknown> {
  const cached = desktopStylePromises.get(key)
  if (cached) return cached

  const promise = loader().catch((error: unknown) => {
      // 网络瞬断时允许下一次导航或视口变化重新尝试加载。
      desktopStylePromises.delete(key)
      throw error
    })
  desktopStylePromises.set(key, promise)
  return promise
}

function resolveContentStyleGroups(path: string): ContentStyleGroup[] {
  if (path === '/download' || path === '/tableGameEnd') return ['landing']
  if (path === '/createTable' || path === '/createMtt' || path === '/club/table/create') {
    return ['table']
  }
  if (path === '/gameList' || path === '/mttList') return []
  if (path.startsWith('/mtt/detail')) return ['mtt']
  if (path.startsWith('/message/') || path === '/mine/bill' || path === '/mine/message-board') {
    return ['message']
  }
  if (path.startsWith('/mine/career')) return ['career', 'careerExtra']
  if (path.startsWith('/mine/hand-collection')) return ['careerExtra']
  if (
    path.startsWith('/mine/settings') ||
    path === '/mine/backpack' ||
    path.startsWith('/mine/profile') ||
    path === '/mine/shop'
  ) {
    return ['mine']
  }
  if (path === '/club/wallet/logs' || path === '/wallet/gift-uc') return ['walletExtra']
  if (path === '/wallet' || path.startsWith('/wallet/')) return ['wallet']
  if (path.startsWith('/club/')) return ['club']
  return []
}

function loadDesktopStyles(layout: MainLayout, path = ''): Promise<unknown> {
  const tasks = [loadStyle(layout, desktopStyleLoaders[layout])]
  if (layout === 'content') {
    for (const group of resolveContentStyleGroups(path)) {
      tasks.push(loadStyle(`content:${group}`, contentStyleLoaders[group]))
    }
  }
  return Promise.all(tasks)
}

function ensureDesktopStyles(): void {
  if (!activeLayout || typeof window === 'undefined') {
    return
  }

  desktopMediaQuery ??= window.matchMedia(DESKTOP_MEDIA_QUERY)
  if (desktopMediaQuery.matches) {
    const layout = activeLayout
    void loadDesktopStyles(layout, activePath).catch((error: unknown) => {
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
export async function preloadMainLayoutStyles(layout: unknown, path = ''): Promise<void> {
  if (!isMainLayout(layout) || typeof window === 'undefined') {
    return
  }

  const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
  if (mediaQuery.matches) {
    try {
      await loadDesktopStyles(layout, path)
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
export function syncMainLayout(layout: unknown, path = ''): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const nextLayout = isMainLayout(layout) ? layout : undefined

  activeLayout = nextLayout
  activePath = path
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

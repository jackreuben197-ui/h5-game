const DESIGN_WIDTH = 375
const MAX_WIDTH = Infinity
const BASE_REM_AT_DESIGN = 37.5
// 已迁移页面的桌面 / Pad 不再按整屏宽度放大 rem。固定 40px 保持正文可读，
// 页面横向尺寸由响应式 Grid/Flex 负责。
const DESKTOP_REM = 40
const DESKTOP_BREAKPOINT = 600
const RESTORE_REFRESH_DELAYS = [0, 32, 120, 320]

let teardownRem: (() => void) | null = null
let pendingTimers: number[] = []
let refreshFrame: number | null = null
let notifyHostOnRefresh = false

function getPositiveWidth(value: number | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null
  }
  return value
}

function getViewportWidth(): number {
  // 正常缩放只读取视口值，避免每一帧读取 clientWidth 强制刷新布局。
  const viewportWidths = [
    getPositiveWidth(window.visualViewport?.width),
    getPositiveWidth(window.innerWidth),
  ].filter((width): width is number => width !== null)

  if (viewportWidths.length) {
    return Math.min(...viewportWidths)
  }

  return (
    getPositiveWidth(document.documentElement.clientWidth) ??
    getPositiveWidth(document.body?.clientWidth) ??
    DESIGN_WIDTH
  )
}

function usesAdaptiveMainLayout(width: number): boolean {
  const root = document.documentElement
  return width >= DESKTOP_BREAKPOINT && Boolean(root.dataset.mainLayout)
}

function refreshRem(): void {
  const docEl = document.documentElement
  const width = getViewportWidth()
  const rem = usesAdaptiveMainLayout(width)
    ? DESKTOP_REM
    : (Math.min(width, MAX_WIDTH) / DESIGN_WIDTH) * BASE_REM_AT_DESIGN
  const nextFontSize = `${rem}px`

  // 桌面布局始终是 40px；窗口拖动时不重复写相同值，避免整页样式重算。
  if (docEl.style.fontSize !== nextFontSize) {
    docEl.style.fontSize = nextFontSize
  }
}

function dispatchSyntheticResize(): void {
  if (typeof Event === 'function') {
    window.dispatchEvent(new Event('resize'))
    return
  }

  const resizeEvent = document.createEvent('UIEvents')
  resizeEvent.initUIEvent('resize', false, false, window, 0)
  window.dispatchEvent(resizeEvent)
}

function notifyCocosResize(): void {
  const cc = (
    window as unknown as {
      cc?: {
        view?: {
          resizeWithBrowserSize?: (enabled: boolean) => void
        }
      }
    }
  ).cc

  cc?.view?.resizeWithBrowserSize?.(true)
  dispatchSyntheticResize()
}

function scheduleRefresh(notifyHost = false): void {
  notifyHostOnRefresh ||= notifyHost
  if (refreshFrame !== null) {
    return
  }

  refreshFrame = window.requestAnimationFrame(() => {
    refreshFrame = null
    const shouldNotifyHost = notifyHostOnRefresh
    notifyHostOnRefresh = false
    refreshRem()
    if (shouldNotifyHost) {
      notifyCocosResize()
    }
  })
}

function scheduleRestoreRefresh(): void {
  pendingTimers.forEach((timer) => window.clearTimeout(timer))
  // bfcache restore may report a stale viewport before the next layout pass.
  pendingTimers = RESTORE_REFRESH_DELAYS.map((delay) =>
    window.setTimeout(() => {
      scheduleRefresh(true)
    }, delay),
  )
}

export function setupRem(): void {
  if (teardownRem) {
    scheduleRestoreRefresh()
    return
  }

  const handleResize = (): void => scheduleRefresh()
  // 路由布局切换发生在新页面渲染前，根字号需要同步刷新，避免首帧使用旧布局字号。
  const handleMainLayoutChange = (): void => refreshRem()
  const handleRestore = (): void => scheduleRestoreRefresh()
  const handleVisibilityChange = (): void => {
    if (!document.hidden) {
      scheduleRestoreRefresh()
    }
  }

  refreshRem()
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleRestore)
  window.addEventListener('pageshow', handleRestore)
  window.addEventListener('focus', handleRestore)
  window.addEventListener('h5:main-layout-change', handleMainLayoutChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.visualViewport?.addEventListener('resize', handleResize)

  teardownRem = () => {
    pendingTimers.forEach((timer) => window.clearTimeout(timer))
    pendingTimers = []
    if (refreshFrame !== null) {
      window.cancelAnimationFrame(refreshFrame)
      refreshFrame = null
    }
    notifyHostOnRefresh = false
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleRestore)
    window.removeEventListener('pageshow', handleRestore)
    window.removeEventListener('focus', handleRestore)
    window.removeEventListener('h5:main-layout-change', handleMainLayoutChange)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.visualViewport?.removeEventListener('resize', handleResize)
    teardownRem = null
  }
}

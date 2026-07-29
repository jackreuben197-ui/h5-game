const DESIGN_WIDTH = 375
const MAX_WIDTH = 480
const BASE_REM_AT_DESIGN = 37.5
// 桌面 / Pad 不再按整屏宽度放大 rem。40px 让 0.35~0.4rem 的正文稳定在 14~16px，
// 组件仍可复用移动端 rem 尺寸，横向布局交给媒体查询和 Grid/Flex。
const DESKTOP_REM = 40
const DESKTOP_BREAKPOINT = 600
const RESTORE_REFRESH_DELAYS = [0, 32, 120, 320]

let teardownRem: (() => void) | null = null
let pendingTimers: number[] = []

function getPositiveWidth(value: number | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null
  }
  return value
}

function getViewportWidth(): number {
  const docEl = document.documentElement
  const widths = [
    getPositiveWidth(window.visualViewport?.width),
    getPositiveWidth(window.innerWidth),
    getPositiveWidth(docEl.clientWidth),
    getPositiveWidth(document.body?.clientWidth),
  ].filter((width): width is number => width !== null)

  if (!widths.length) {
    return DESIGN_WIDTH
  }

  return Math.min(...widths)
}

function usesAdaptiveDesktopLayout(width: number): boolean {
  const root = document.documentElement
  return (
    width >= DESKTOP_BREAKPOINT &&
    root.dataset.guestDesktop === '1' &&
    root.dataset.desktopLayout !== 'phone'
  )
}

function refreshRem(): void {
  const docEl = document.documentElement
  const width = getViewportWidth()
  const rem = usesAdaptiveDesktopLayout(width)
    ? DESKTOP_REM
    : (Math.min(width, MAX_WIDTH) / DESIGN_WIDTH) * BASE_REM_AT_DESIGN
  docEl.style.fontSize = `${rem}px`
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
  window.requestAnimationFrame(() => {
    refreshRem()
    if (notifyHost) {
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
  window.addEventListener('h5:desktop-layout-change', handleResize)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.visualViewport?.addEventListener('resize', handleResize)

  teardownRem = () => {
    pendingTimers.forEach((timer) => window.clearTimeout(timer))
    pendingTimers = []
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleRestore)
    window.removeEventListener('pageshow', handleRestore)
    window.removeEventListener('focus', handleRestore)
    window.removeEventListener('h5:desktop-layout-change', handleResize)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.visualViewport?.removeEventListener('resize', handleResize)
    teardownRem = null
  }
}

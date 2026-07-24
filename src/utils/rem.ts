const DESIGN_WIDTH = 375
const MAX_WIDTH = Infinity
const BASE_REM_AT_DESIGN = 37.5
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

  return Math.min(...widths, MAX_WIDTH)
}

function refreshRem(): void {
  const docEl = document.documentElement
  const width = getViewportWidth()
  const rem = (width / DESIGN_WIDTH) * BASE_REM_AT_DESIGN
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
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.visualViewport?.addEventListener('resize', handleResize)

  teardownRem = () => {
    pendingTimers.forEach((timer) => window.clearTimeout(timer))
    pendingTimers = []
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleRestore)
    window.removeEventListener('pageshow', handleRestore)
    window.removeEventListener('focus', handleRestore)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.visualViewport?.removeEventListener('resize', handleResize)
    teardownRem = null
  }
}

let firstPaintPromise: Promise<void> | null = null

/**
 * 等待 Vue 首屏至少完成一次绘制。
 *
 * cocos-h5-entry 会在双 RAF 后派发 h5:first-paint；超时兜底用于隐藏 WebView，
 * 这类环境的 requestAnimationFrame 可能会被系统暂停。
 */
export function waitForH5FirstPaint(): Promise<void> {
  if (typeof window === 'undefined' || window.__H5_FIRST_PAINT_DONE__) {
    return Promise.resolve()
  }
  if (firstPaintPromise) {
    return firstPaintPromise
  }

  firstPaintPromise = new Promise<void>((resolve) => {
    let settled = false
    const done = (): void => {
      if (settled) return
      settled = true
      window.clearTimeout(fallbackTimer)
      window.removeEventListener('h5:first-paint', done)
      resolve()
    }
    const fallbackTimer = window.setTimeout(done, 1200)
    window.addEventListener('h5:first-paint', done, { once: true })
  })

  return firstPaintPromise
}

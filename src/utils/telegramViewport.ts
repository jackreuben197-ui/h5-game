import { isTelegramMiniAppEnv } from './telegramStartParam'

// Telegram Mini App exposes a viewport that can differ from 100dvh: the native
// header, a non-expanded sheet, or the bottom gesture area all shrink the truly
// visible region. Mirror WebApp.viewportStableHeight into --app-viewport-height so
// the fixed-height layout matches the visible area. Plain browsers never set the
// variable and keep the 100dvh fallback untouched.
export function setupTelegramViewport(): void {
  if (typeof window === 'undefined' || !isTelegramMiniAppEnv()) {
    return
  }

  const webApp = window.Telegram?.WebApp
  if (!webApp) {
    return
  }

  try {
    webApp.ready?.()
    webApp.expand?.()
  } catch (error) {
    console.warn('[tg-viewport] ready/expand failed:', error)
  }

  const applyViewportHeight = (): void => {
    const height = Number(webApp.viewportStableHeight || webApp.viewportHeight || 0)
    if (height > 0) {
      document.documentElement.style.setProperty('--app-viewport-height', `${height}px`)
    }
  }

  applyViewportHeight()
  webApp.onEvent?.('viewportChanged', applyViewportHeight)
}

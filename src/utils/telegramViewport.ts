import { isTelegramMiniAppEnv } from './telegramStartParam'

// In a Telegram Mini App the sheet can open non-expanded (half height). Calling
// expand() makes the webview take the full available height so #app (position:
// fixed; inset:0) maps to the whole visible area — which the layout inherits via
// height:100%. No-op outside Telegram.
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
}

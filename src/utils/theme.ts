import { ref, readonly } from 'vue'

export type ThemeName = 'dark' | 'light'

const DEFAULT_THEME: ThemeName = 'dark'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'
const SDK_POLL_INTERVAL_MS = 200
const SDK_POLL_TIMEOUT_MS = 30_000

const currentTheme = ref<ThemeName>(DEFAULT_THEME)

export const theme = readonly(currentTheme)

type TelegramWebApp = NonNullable<NonNullable<Window['Telegram']>['WebApp']>

function isTelegramHost(webApp: TelegramWebApp): boolean {
  const platform = String(webApp.platform ?? '')
    .trim()
    .toLowerCase()
  if (platform) {
    return platform !== 'unknown'
  }

  return Boolean(webApp.initData) || Boolean(window.__H5_TG_INIT_DATA__)
}

function getTelegramThemeSource(): TelegramWebApp | null {
  const webApp = window.Telegram?.WebApp
  if (!webApp) {
    return null
  }
  return isTelegramHost(webApp) ? webApp : null
}

function readSystemTheme(): ThemeName | null {
  if (typeof window.matchMedia !== 'function') {
    return null
  }
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light'
}
function resolveTheme(): ThemeName {
  const scheme = getTelegramThemeSource()?.colorScheme
  if (scheme === 'light' || scheme === 'dark') {
    return scheme
  }
  return readSystemTheme() ?? DEFAULT_THEME
}
function applyTheme(next: ThemeName): void {
  currentTheme.value = next
  document.documentElement.setAttribute('data-theme', next)
}
function listenMediaQuery(media: MediaQueryList, handler: () => void): () => void {
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }
  media.addListener(handler)
  return () => media.removeListener(handler)
}

export function setupTheme(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }

  const sync = () => applyTheme(resolveTheme())
  sync()

  const cleanups: Array<() => void> = []

  if (typeof window.matchMedia === 'function') {
    cleanups.push(listenMediaQuery(window.matchMedia(DARK_MEDIA_QUERY), sync))
  }

  const bindTelegram = (): boolean => {
    const webApp = getTelegramThemeSource()
    if (!webApp?.onEvent) {
      return false
    }
    webApp.onEvent('themeChanged', sync)
    cleanups.push(() => webApp.offEvent?.('themeChanged', sync))
    sync()
    return true
  }

  if (!bindTelegram()) {
    const startedAt = performance.now()
    const timer = window.setInterval(() => {
      if (bindTelegram() || performance.now() - startedAt > SDK_POLL_TIMEOUT_MS) {
        window.clearInterval(timer)
      }
    }, SDK_POLL_INTERVAL_MS)
    cleanups.push(() => window.clearInterval(timer))
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup())
    cleanups.length = 0
  }
}

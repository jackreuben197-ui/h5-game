import { ref, readonly } from 'vue'

export type ThemeName = 'dark' | 'light'

const DEFAULT_THEME: ThemeName = 'dark'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'
const SDK_POLL_INTERVAL_MS = 200
// Telegram SDK 由 index.html 从 telegram.org 异步加载。弱网/被限速时 6s 远远不够，
// 而超时后轮询会被永久清掉 —— themeChanged 再也不会绑上，Telegram 主题永久失效。
// 放宽到 30s：200ms × 150 次，开销可忽略。
const SDK_POLL_TIMEOUT_MS = 30_000

const currentTheme = ref<ThemeName>(DEFAULT_THEME)

export const theme = readonly(currentTheme)

type TelegramWebApp = NonNullable<NonNullable<Window['Telegram']>['WebApp']>

// 是否真的跑在 Telegram 宿主里。
// 不能用 window.Telegram?.WebApp 是否存在来判断：index.html 无条件加载
// telegram-web-app.js，普通浏览器里 WebApp 同样存在（此时 colorScheme 默认 'light'），
// __H5_TG_MINI_APP__ 也会被置真 —— 两者都只代表「SDK 已加载」。
// 也不宜只用 initData：它是鉴权数据，与主题无关，且部分启动方式下为空，
// 会导致 Telegram 明明在深色却读不到 colorScheme；反之 URL 上残留 tgWebAppData 时，
// 普通浏览器会被误判为 Telegram 而锁死在 'light'、永远无视系统主题。
// platform 由宿主注入，非 Telegram 环境固定为 'unknown'，是最可靠的判据。
function isTelegramHost(webApp: TelegramWebApp): boolean {
  const platform = String(webApp.platform ?? '')
    .trim()
    .toLowerCase()
  if (platform) {
    return platform !== 'unknown'
  }
  // 老版本 SDK 没有 platform 字段时，退回 initData 判据。
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

// Safari < 14 / 旧 WebView 的 MediaQueryList 只有 addListener，没有 addEventListener。
// 直接调用会抛 TypeError；而 setupTheme() 在 main.ts 里位于 createApp 之前且不在
// try 内 —— 一旦抛错整个应用都挂不起来（白屏），不只是主题失效。
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

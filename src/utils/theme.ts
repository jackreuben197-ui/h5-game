import { readonly, ref } from 'vue'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'

// 主题运行时：维护 html[data-theme] 属性 + <meta name="theme-color">。
// 首帧防闪烁由 index.html 内联脚本完成，这里在应用启动时接管
// （恢复持久化模式、监听系统主题变化）。

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeName = 'light' | 'dark'

// 默认跟随当前运行环境：Telegram Mini App 优先使用 WebApp.colorScheme，
// 普通手机浏览器使用 prefers-color-scheme。
export const DEFAULT_THEME_MODE: ThemeMode = 'system'

const THEME_COLOR_META: Record<ThemeName, string> = {
  dark: '#c487a8',
  light: '#f3f4f6',
}

const themeMode = ref<ThemeMode>(DEFAULT_THEME_MODE)
const resolvedTheme = ref<ThemeName>('dark')

let initialized = false
let systemThemeQuery: MediaQueryList | null = null
let telegramThemeBound = false
let telegramReadyListenerBound = false
// URL ?theme=xxx 预览覆盖：仅当次会话生效不落存储，供美术/测试对照走查浅色稿。
let urlOverrideMode: ThemeMode | null = null

type TelegramWebApp = NonNullable<NonNullable<Window['Telegram']>['WebApp']>

// SDK 在普通浏览器中也会加载且 colorScheme 恒为 'light'，
// 只有真实 Mini App 环境（platform / initData 非空）才可信。
function isTelegramHost(webApp: TelegramWebApp): boolean {
  const platform = String(webApp.platform ?? '')
    .trim()
    .toLowerCase()
  if (platform) {
    return platform !== 'unknown'
  }

  return Boolean(webApp.initData) || Boolean(window.__H5_TG_INIT_DATA__)
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function readUrlOverride(): ThemeMode | null {
  // hash 路由下 query 可能挂在 hash 段内，两段都解析（同 index.html 内联脚本）。
  const match = `${window.location.search} ${window.location.hash}`.match(
    /[?&]theme=(light|dark|system)\b/,
  )
  return match && isThemeMode(match[1]) ? match[1] : null
}

function readStoredMode(): ThemeMode | null {
  const stored = localStore.getItem<string>(StorageKey.THEME_MODE)
  return isThemeMode(stored) ? stored : null
}

function systemPrefersLight(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : false
}

function readTelegramTheme(): ThemeName | null {
  const webApp = window.Telegram?.WebApp
  if (!webApp || !isTelegramHost(webApp)) {
    return null
  }
  const colorScheme = webApp.colorScheme
  return colorScheme === 'light' || colorScheme === 'dark' ? colorScheme : null
}

function resolveTheme(mode: ThemeMode): ThemeName {
  if (mode === 'system') {
    // Telegram Mini App 以应用自身主题为准；普通浏览器回退到系统媒体查询。
    const telegramTheme = readTelegramTheme()
    if (telegramTheme) {
      return telegramTheme
    }
    return systemPrefersLight() ? 'light' : 'dark'
  }
  return mode
}

function syncThemeColorMeta(theme: ThemeName): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  meta?.setAttribute('content', THEME_COLOR_META[theme])
}

function applyTheme(): void {
  const theme = resolveTheme(urlOverrideMode ?? themeMode.value)
  resolvedTheme.value = theme
  document.documentElement.setAttribute('data-theme', theme)
  syncThemeColorMeta(theme)
}

function bindSystemThemeListener(): void {
  if (systemThemeQuery || typeof window.matchMedia !== 'function') {
    return
  }
  systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)')
  const onChange = (): void => {
    // 仅 system 模式需要响应系统主题变化。
    if ((urlOverrideMode ?? themeMode.value) === 'system') {
      applyTheme()
    }
  }
  if (typeof systemThemeQuery.addEventListener === 'function') {
    systemThemeQuery.addEventListener('change', onChange)
  } else if (typeof systemThemeQuery.addListener === 'function') {
    // 旧 iOS WebView 兜底：MediaQueryList 只有废弃的 addListener。
    systemThemeQuery.addListener(onChange)
  }
}

function bindTelegramThemeListener(): void {
  if (telegramThemeBound) {
    return
  }
  const webApp = window.Telegram?.WebApp
  if (!webApp || typeof webApp.onEvent !== 'function') {
    return
  }
  webApp.onEvent('themeChanged', () => {
    if ((urlOverrideMode ?? themeMode.value) === 'system') {
      applyTheme()
    }
  })
  telegramThemeBound = true
}

function bindTelegramReadyListener(): void {
  if (telegramReadyListenerBound) {
    return
  }
  window.addEventListener('h5:telegram-ready', () => {
    bindTelegramThemeListener()
    if ((urlOverrideMode ?? themeMode.value) === 'system') {
      applyTheme()
    }
  })
  telegramReadyListenerBound = true
}

/** 应用启动时调用（可重入）：恢复持久化的主题模式并开始监听系统主题变化。 */
export function initTheme(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  if (initialized) {
    applyTheme()
    return
  }
  initialized = true
  urlOverrideMode = readUrlOverride()
  themeMode.value = readStoredMode() ?? DEFAULT_THEME_MODE
  bindSystemThemeListener()
  bindTelegramReadyListener()
  bindTelegramThemeListener()
  applyTheme()
}

/** 切换主题模式（设置页手动切换入口用），持久化并立即生效。 */
export function setThemeMode(mode: ThemeMode): void {
  // 手动设置优先级高于 URL 预览参数。
  urlOverrideMode = null
  themeMode.value = mode
  localStore.setItem(StorageKey.THEME_MODE, mode)
  applyTheme()
}

// 只读响应式出口，组件侧经 useTheme() 消费。
export const themeModeRef = readonly(themeMode)
export const resolvedThemeRef = readonly(resolvedTheme)

// 兼容旧调用方（views 里 import { theme }）。
export const theme = resolvedThemeRef

import { readonly, ref } from 'vue'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'

// 主题运行时：维护 html[data-theme] 属性 + <meta name="theme-color">，
// 与 _themes.scss 的 --c-* 变量层配套。首帧防闪烁由 index.html 内联脚本完成，
// 这里在应用启动时接管（恢复持久化模式、监听系统主题变化）。

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeName = 'light' | 'dark'

// 迁移期锁定深色（与当前线上观感一致）。浅色主题页面全部迁移完成后改为 'system'，
// 即满足「跟随手机系统明暗自动切换」的需求。
// ⚠️ index.html 首帧内联脚本中的默认值需同步修改。
export const DEFAULT_THEME_MODE: ThemeMode = 'dark'

// 各主题的地址栏 / PWA 状态栏着色。dark 与 index.html 现有取值保持一致。
const THEME_COLOR_META: Record<ThemeName, string> = {
  dark: '#c487a8',
  light: '#f3f4f6',
}

const themeMode = ref<ThemeMode>(DEFAULT_THEME_MODE)
const resolvedTheme = ref<ThemeName>('dark')

let initialized = false
let systemThemeQuery: MediaQueryList | null = null
// URL ?theme=xxx 预览覆盖：仅当次会话生效不落存储，供美术/测试对照走查浅色稿。
let urlOverrideMode: ThemeMode | null = null

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

function resolveTheme(mode: ThemeMode): ThemeName {
  if (mode === 'system') {
    // 深色为产品基准：系统未明确表达浅色偏好（含旧 WebView 不支持该查询）时回退深色。
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

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredInstallPrompt = event as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
  })
}

// 当前 WebView 底层是否已暴露浏览器原生的 PWA 安装弹窗（beforeinstallprompt）
// Chrome / Edge / Samsung Internet 系会触发；iOS Safari、原生 App 内嵌 WebView 一般不会触发
export function canPromptInstall(): boolean {
  return deferredInstallPrompt !== null
}

// 是否已经以独立窗口（standalone）模式运行，即已安装到桌面
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

// 是否运行在 Telegram Mini App 内（原生注入的全局标记优先，其次是官方 WebApp SDK 对象）
export function isTelegramMiniAppEnv(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  if (window.__H5_TG_MINI_APP__) {
    return true
  }
  return false
}

// 当前 WebView 底层是否为 iOS Safari —— 它不支持 beforeinstallprompt，需要引导用户走分享菜单
export function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIos =
    /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return isIos && isSafari
}

// 触发浏览器"添加到主屏幕"安装弹窗
// 返回 'accepted' | 'dismissed' | 'unavailable'（unavailable 表示当前 WebView 底层不支持原生弹窗）
export async function showAddToHomeScreenPrompt(): Promise<
  'accepted' | 'dismissed' | 'unavailable'
> {
  if (!deferredInstallPrompt) return 'unavailable'
  try {
    await deferredInstallPrompt.prompt()
    const choice = await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    return choice.outcome
  } catch {
    deferredInstallPrompt = null
    return 'unavailable'
  }
}

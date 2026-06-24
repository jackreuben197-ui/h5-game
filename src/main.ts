import { createApp, type App as VueApp } from 'vue'
import App from './App.vue'
import router from './router'
// 函数式 Toast 不会自动按模板组件注入样式，这里在入口统一引入。
import 'vant/es/dialog/style'
import 'vant/es/toast/style'
import 'vant/es/icon/style'
import './bridge/core'
import {
  setupGlobalBridgeDialogChannel,
  setupGlobalBridgePanelChannel,
  setupGlobalBridgeToastChannel,
  setupH5VisibilityBridgeChannel,
} from './bridge/channels'
import { setupWsProxyBridgeChannel } from './bridge/ws'
import { installCcStorageProxy } from './bridge/sync/ccStorageProxy'
import { syncPostAuthData } from './session/postAuthSync'
import {
  checkLocalTokenAtBootstrap,
  startTokenRefreshLoop,
  stopTokenRefreshLoop,
} from './session/tokenRefresh'
import './styles/main.scss'
import { setupRem } from './utils/rem'
import { initDebugConsole, recordDebugEvent } from './utils/debugConsole'
import { createLogger } from './utils/logger'
import { useGameStore } from './stores/game'
import {
  cacheAgentInviteCodeIfPresent,
  isChannelPackageHost,
  restoreStorageFromUrl,
} from '@/utils/channelPackage'
import { ensureTelegramAutoLogin } from '@/api/http'

const log = createLogger('[h5]')
import { pinia } from './stores/pinia'
import { textI18nPlugin } from './i18n'

let app: VueApp<Element> | null = null
let stopBridgeDialogChannel: (() => void) | null = null
let stopBridgePanelChannel: (() => void) | null = null
let stopBridgeToastChannel: (() => void) | null = null
let stopWsProxyBridgeChannel: (() => void) | null = null
let stopH5VisibilityBridgeChannel: (() => void) | null = null
let stopCcStorageProxy: (() => void) | null = null
let stopNativeMenuGuard: (() => void) | null = null

// 启动时缓存 URL 中的代理邀请码，防止跨页面丢失
cacheAgentInviteCodeIfPresent()
// 启动时从 URL 恢复可能的存储数据，子域名跳转主域名时使用。
restoreStorageFromUrl()

if (typeof document !== 'undefined' && isChannelPackageHost()) {
  document.documentElement.setAttribute('data-channel-package', '1')
}

initDebugConsole()

function setupNativeMenuGuard(): () => void {
  if (import.meta.env.VITE_NATIVE_MENU_GUARD === 'open') {
    return () => {}
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }

  const onContextMenu = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      event.preventDefault()
      return
    }

    // 在可编辑区域保留系统菜单，避免输入能力受影响。
    const editable = target.closest('input, textarea, [contenteditable="true"], [contenteditable=""]')
    if (editable) {
      return
    }

    event.preventDefault()
  }

  document.addEventListener('contextmenu', onContextMenu, { capture: true })

  return () => {
    document.removeEventListener('contextmenu', onContextMenu, { capture: true })
  }
}

export function mountH5App(container: string | Element = '#app'): VueApp<Element> | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (app) {
    recordDebugEvent('[h5]', 'mount skipped: app already mounted')
    return app
  }

  recordDebugEvent('[h5]', 'mount start', {
    container: typeof container === 'string' ? container : '<element>',
    route: window.location.hash || window.location.pathname,
  })

  const mountTarget =
    typeof container === 'string' ? document.querySelector(container) : container

  if (!mountTarget) {
    log.warn('mount target not found:', container)
    recordDebugEvent('[h5]', 'mount target not found', {
      container: typeof container === 'string' ? container : '<element>',
    })
    return null
  }

  setupRem()
  stopNativeMenuGuard = setupNativeMenuGuard()

  try {
    app = createApp(App)
    app.use(pinia)
    app.use(textI18nPlugin)
    app.use(router)
    const gameStore = useGameStore(pinia)
    // 启动时若已有 token，则同步用户资料/配置/WS；任意路由刷新都不依赖首页布局。
    if (gameStore.sessionToken.trim()) {
      // 本地 token 已过期：先清登录并弹登录窗，避免 syncPostAuthData/wsConnect 用旧 token。
      if (checkLocalTokenAtBootstrap()) {
        syncPostAuthData()
      }
    } else {
      // Telegram Mini App: trigger auto-login at startup before the user sees any guest page.
      void ensureTelegramAutoLogin()
    }
    // 无条件启动 token 续期循环：内部按 sessionToken 是否存在自动跳过，登录后无需额外触发。
    startTokenRefreshLoop()
    // 启动 WS 代理通道：Cocos 发指令给 H5，由 H5 执行 websocket 收发并回传结果。
    stopWsProxyBridgeChannel = setupWsProxyBridgeChannel()
    // 启动全局桥接 dialog：接收 Cocos 消息后统一弹窗并回传交互结果。
    stopBridgeDialogChannel = setupGlobalBridgeDialogChannel()
    // 启动全局桥接 panel：接收 Cocos 消息后展示复杂 H5 交互面板。
    stopBridgePanelChannel = setupGlobalBridgePanelChannel()
    // 启动全局桥接 toast：接收 Cocos 消息后统一弹窗。
    stopBridgeToastChannel = setupGlobalBridgeToastChannel()
    // 启动 H5 UI 桥接：接收 Cocos 下发的 h5Hide/h5Show/h5Navigate。
    stopH5VisibilityBridgeChannel = setupH5VisibilityBridgeChannel()
    // 启动持久化代理：Cocos 把 indexedDB/localStorage 操作经 bridge 委托给 H5，
    // h5 与 cocos 共用 user_cache_${userId} 一个 IndexedDB；localStorage 用 dzpk_cc_ 前缀隔离。
    stopCcStorageProxy = installCcStorageProxy()
    app.mount(mountTarget)
    recordDebugEvent('[h5]', 'mount success', {
      route: window.location.hash || window.location.pathname,
      visible: window.__H5_VISIBLE__ !== false,
    })
    return app
  } catch (error) {
    recordDebugEvent('[h5]', 'mount failed', error)
    throw error
  }
}

export function unmountH5App(): void {
  if (!app) {
    return
  }
  recordDebugEvent('[h5]', 'unmount start')
  // 卸载时释放桥接订阅，避免重复监听。
  stopBridgeDialogChannel?.()
  stopBridgeDialogChannel = null
  stopBridgePanelChannel?.()
  stopBridgePanelChannel = null
  stopBridgeToastChannel?.()
  stopBridgeToastChannel = null
  stopWsProxyBridgeChannel?.()
  stopWsProxyBridgeChannel = null
  stopH5VisibilityBridgeChannel?.()
  stopH5VisibilityBridgeChannel = null
  stopCcStorageProxy?.()
  stopCcStorageProxy = null
  stopNativeMenuGuard?.()
  stopNativeMenuGuard = null
  stopTokenRefreshLoop()
  app.unmount()
  app = null
  recordDebugEvent('[h5]', 'unmount success')
}

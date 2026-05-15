import { createApp, type App as VueApp } from 'vue'
import App from './App.vue'
import router from './router'
// 函数式 Toast 不会自动按模板组件注入样式，这里在入口统一引入。
import 'vant/es/dialog/style'
import 'vant/es/toast/style'
import 'vant/es/icon/style'
import './bridge/core'
import {
  // setupGlobalBridgeDialogChannel,
  setupGlobalBridgePanelChannel,
  setupGlobalBridgeToastChannel,
  setupH5VisibilityBridgeChannel,
} from './bridge/channels'
import { setupWsProxyBridgeChannel } from './bridge/ws'
import LoginSession from './session/loginSession'
import './styles/main.scss'
import { setupRem } from './utils/rem'
import { createLogger } from './utils/logger'
import { useGameStore } from './stores/game'

const log = createLogger('[h5]')
import { pinia } from './stores/pinia'
import { textI18nPlugin } from './i18n'

let app: VueApp<Element> | null = null
// let stopBridgeDialogChannel: (() => void) | null = null
let stopBridgePanelChannel: (() => void) | null = null
let stopBridgeToastChannel: (() => void) | null = null
let stopWsProxyBridgeChannel: (() => void) | null = null
let stopH5VisibilityBridgeChannel: (() => void) | null = null

export function mountH5App(container: string | Element = '#app'): VueApp<Element> | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (app) {
    return app
  }

  const mountTarget =
    typeof container === 'string' ? document.querySelector(container) : container

  if (!mountTarget) {
    log.warn('mount target not found:', container)
    return null
  }

  setupRem()

  app = createApp(App)
  app.use(pinia)
  app.use(textI18nPlugin)
  app.use(router)
  const gameStore = useGameStore(pinia)
  // 启动时优先根据本地缓存补齐 WS/Register，保证刷新后也能尽快恢复桥接通道。
  if (gameStore.sessionToken.trim()) {
    void LoginSession.EnsureWS().catch(() => {
      // 无 token 或端口未就绪时忽略；登录成功后会再次走 SyncWS/EnsureWS。
    })
  }
  // 启动 WS 代理通道：Cocos 发指令给 H5，由 H5 执行 websocket 收发并回传结果。
  stopWsProxyBridgeChannel = setupWsProxyBridgeChannel()
  // 启动全局桥接 dialog：接收 Cocos 消息后统一弹窗并回传交互结果。
  // stopBridgeDialogChannel = setupGlobalBridgeDialogChannel()
  // 启动全局桥接 panel：接收 Cocos 消息后展示复杂 H5 交互面板。
  stopBridgePanelChannel = setupGlobalBridgePanelChannel()
  // 启动全局桥接 toast：接收 Cocos 消息后统一弹窗。
  stopBridgeToastChannel = setupGlobalBridgeToastChannel()
  // 启动 H5 UI 桥接：接收 Cocos 下发的 h5Hide/h5Show/h5Navigate。
  stopH5VisibilityBridgeChannel = setupH5VisibilityBridgeChannel()
  app.mount(mountTarget)
  return app
}

export function unmountH5App(): void {
  if (!app) {
    return
  }
  // 卸载时释放桥接订阅，避免重复监听。
  // stopBridgeDialogChannel?.()
  // stopBridgeDialogChannel = null
  stopBridgePanelChannel?.()
  stopBridgePanelChannel = null
  stopBridgeToastChannel?.()
  stopBridgeToastChannel = null
  stopWsProxyBridgeChannel?.()
  stopWsProxyBridgeChannel = null
  stopH5VisibilityBridgeChannel?.()
  stopH5VisibilityBridgeChannel = null
  app.unmount()
  app = null
}

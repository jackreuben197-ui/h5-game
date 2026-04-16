import { createApp, type App as VueApp } from 'vue'
import App from './App.vue'
import router from './router'
import './bridge/bridge'
import { setupGlobalBridgeToastChannel } from './bridge/globalToast'
import { setupWsProxyBridgeChannel } from './bridge/wsBridge'
import LoginSession from './session/loginSession'
import './styles/main.scss'
import { setupRem } from './utils/rem'
import { pinia } from './stores/pinia'
import { textI18nPlugin } from './i18n'

let app: VueApp<Element> | null = null
let stopBridgeToastChannel: (() => void) | null = null
let stopWsProxyBridgeChannel: (() => void) | null = null

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
    console.warn('[h5] mount target not found:', container)
    return null
  }

  setupRem()

  app = createApp(App)
  app.use(pinia)
  app.use(textI18nPlugin)
  app.use(router)
  // 启动时优先根据本地缓存补齐 WS/Register，保证刷新后也能尽快恢复桥接通道。
  void LoginSession.EnsureWS().catch(() => {
    // 无 token 或端口未就绪时忽略；登录成功后会再次走 SyncWS/EnsureWS。
  })
  // 启动 WS 代理通道：Cocos 发指令给 H5，由 H5 执行 websocket 收发并回传结果。
  stopWsProxyBridgeChannel = setupWsProxyBridgeChannel()
  // 启动全局桥接 toast：接收 Cocos 消息后统一弹窗。
  stopBridgeToastChannel = setupGlobalBridgeToastChannel()
  app.mount(mountTarget)
  return app
}

export function unmountH5App(): void {
  if (!app) {
    return
  }
  // 卸载时释放桥接订阅，避免重复监听。
  stopBridgeToastChannel?.()
  stopBridgeToastChannel = null
  stopWsProxyBridgeChannel?.()
  stopWsProxyBridgeChannel = null
  app.unmount()
  app = null
}

import { createApp, type App as VueApp } from 'vue'
import App from './App.vue'
import router from './router'
import './bridge/bridge'
import { setupGlobalBridgeToastChannel } from './bridge/globalToast'
import './styles/main.scss'
import { setupRem } from './utils/rem'
import { pinia } from './stores/pinia'
import { textI18nPlugin } from './i18n'

let app: VueApp<Element> | null = null
let stopBridgeToastChannel: (() => void) | null = null

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
  app.unmount()
  app = null
}

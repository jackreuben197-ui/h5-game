import { createApp, type App as VueApp } from 'vue'
import App from './App.vue'
import router from './router'
import './bridge/bridge'
import './styles/main.scss'
import { setupRem } from './utils/rem'
import { pinia } from './stores/pinia'
import { textI18nPlugin } from './i18n'

let app: VueApp<Element> | null = null

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
  app.mount(mountTarget)
  return app
}

export function unmountH5App(): void {
  if (!app) {
    return
  }
  app.unmount()
  app = null
}

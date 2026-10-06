import { mountH5App, unmountH5App } from '../main'
import { useAppConfigStore } from '../stores/appConfig'
import { pinia } from '../stores/pinia'
import { recordDebugEvent } from '../utils/debugCapture'

recordDebugEvent('[boot]', 'cocos h5 entry loaded', {
  href: typeof window !== 'undefined' ? window.location.href : '',
})

let mountRevision = 0
let mountTask: Promise<void> | null = null
let cocosBootScheduled = false

function startCocosAfterFirstPaint(): void {
  if (cocosBootScheduled || typeof window === 'undefined') return
  cocosBootScheduled = true

  let dispatched = false
  const dispatchReady = (): void => {
    if (dispatched) return
    dispatched = true
    window.clearTimeout(fallbackTimer)
    window.performance?.mark?.('h5-first-paint')
    window.dispatchEvent(new Event('h5:first-paint'))
  }

  // 可见页面用双 RAF 保证 Vue 挂载结果至少已经交给浏览器绘制一帧；
  // 后台/隐藏 WebView 的 RAF 可能被暂停，保留超时兜底避免 Cocos 永远不启动。
  const fallbackTimer = window.setTimeout(dispatchReady, 1000)
  if (typeof window.requestAnimationFrame !== 'function') return
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(dispatchReady)
  })
}

async function preparePlatformDomains(): Promise<void> {
  const appConfigStore = useAppConfigStore(pinia)
  await appConfigStore.ensureGuestGlobalConfig()
  if (!appConfigStore.globalConfig) {
    await appConfigStore.restorePublicConfigCache()
  }
}

const host = {
  mount(container = '#app'): void {
    recordDebugEvent('[boot]', 'mount requested', { container })
    if (mountTask) return
    const revision = ++mountRevision
    mountTask = preparePlatformDomains()
      .catch((error) => {
        console.warn('[boot] prepare platform domains failed:', error)
      })
      .then(() => {
        if (revision === mountRevision) {
          const mountedApp = mountH5App(container)
          if (mountedApp) {
            startCocosAfterFirstPaint()
          }
        }
      })
      .finally(() => {
        if (revision === mountRevision) {
          mountTask = null
        }
      })
  },
  unmount(): void {
    recordDebugEvent('[boot]', 'unmount requested')
    mountRevision += 1
    mountTask = null
    unmountH5App()
  },
}

// 提供给 Cocos 调用的统一入口，最终同页融合时可直接复用。
window.H5LobbyHost = host

// 独立 H5 调试时自动挂载；融合到 Cocos 后也可改为手动调用 mount。
host.mount('#app')

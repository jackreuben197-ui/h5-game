import { mountH5App, unmountH5App } from '../main'
import { initDebugConsole } from '../utils/debugConsole'
import { useAppConfigStore } from '../stores/appConfig'
import { pinia } from '../stores/pinia'
import { recordDebugEvent } from '../utils/debugCapture'
import { configReady } from '../utils/appConfig'

recordDebugEvent('[boot]', 'cocos h5 entry loaded', {
  href: typeof window !== 'undefined' ? window.location.href : '',
})

let mountRevision = 0
let mountTask: Promise<void> | null = null

async function preparePlatformDomains(): Promise<void> {
  await configReady.catch(() => undefined)
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
          mountH5App(container)
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

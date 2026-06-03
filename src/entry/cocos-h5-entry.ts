import { mountH5App, unmountH5App } from '../main'
import { initDebugConsole, recordDebugEvent } from '../utils/debugConsole'

initDebugConsole()
recordDebugEvent('[boot]', 'cocos h5 entry loaded', {
  href: typeof window !== 'undefined' ? window.location.href : '',
})

const host = {
  mount(container = '#app'): void {
    recordDebugEvent('[boot]', 'mount requested', { container })
    mountH5App(container)
  },
  unmount(): void {
    recordDebugEvent('[boot]', 'unmount requested')
    unmountH5App()
  },
}

// 提供给 Cocos 调用的统一入口，最终同页融合时可直接复用。
window.H5LobbyHost = host

// 独立 H5 调试时自动挂载；融合到 Cocos 后也可改为手动调用 mount。
host.mount('#app')

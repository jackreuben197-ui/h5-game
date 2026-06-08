import { mountH5App, unmountH5App } from '../main'
import { initDebugConsole, recordDebugEvent } from '../utils/debugConsole'
import { configReady } from '../utils/appConfig'

initDebugConsole()
recordDebugEvent('[boot]', 'cocos h5 entry loaded', {
  href: typeof window !== 'undefined' ? window.location.href : '',
})

const host = {
  mount(container = '#app'): void {
    recordDebugEvent('[boot]', 'mount requested', { container })
    // 等待运行时配置（config.json）加载完成后再挂载，确保 API 基础地址已就绪。
    void configReady.finally(() => mountH5App(container))
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

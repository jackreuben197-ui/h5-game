import { mountH5App, unmountH5App } from '../main'

const host = {
  mount(container = '#app'): void {
    mountH5App(container)
  },
  unmount(): void {
    unmountH5App()
  },
}

// 提供给 Cocos 调用的统一入口，最终同页融合时可直接复用。
window.H5LobbyHost = host

// 独立 H5 调试时自动挂载；融合到 Cocos 后也可改为手动调用 mount。
host.mount('#app')

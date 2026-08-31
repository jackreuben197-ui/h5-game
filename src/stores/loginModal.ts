import { defineStore } from 'pinia'
import type { H5LoginContext } from '@bridge-protocol'

export type LoginModalMode = 'login' | 'register'
export type LoginModalContext = '' | H5LoginContext

interface LoginModalOpenOptions {
  redirect?: string
  mode?: LoginModalMode
  context?: LoginModalContext
}

interface LoginModalState {
  visible: boolean
  mode: LoginModalMode | ''
  // 登录成功后需要跳转的目标路径；未登录时点击钱包等需要登录态的入口会写入
  pendingRedirect: string
  // 牌桌内登录使用专用覆盖层，不能把 H5 路由切回大厅。
  context: LoginModalContext
}

export const useLoginModalStore = defineStore('h5-login-modal-store', {
  state: (): LoginModalState => ({
    visible: false,
    mode: '',
    pendingRedirect: '',
    context: '',
  }),
  actions: {
    open(options?: string | LoginModalOpenOptions): void {
      if (typeof options === 'string') {
        if (options) {
          this.pendingRedirect = options
        }
      } else if (options) {
        if (options.redirect) {
          this.pendingRedirect = options.redirect
        }
        if (options.mode) {
          this.mode = options.mode
        }
        if (options.context) {
          this.context = options.context
        }
      }
      this.visible = true
    },
    close(): void {
      this.visible = false
      this.mode = ''
      this.pendingRedirect = ''
    },
    resetContext(): void {
      this.context = ''
    },
    consumePendingRedirect(): string {
      const target = this.pendingRedirect
      this.pendingRedirect = ''
      return target
    },
  },
})

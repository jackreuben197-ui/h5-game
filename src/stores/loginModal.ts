import { defineStore } from 'pinia'

export type LoginModalMode = 'login' | 'register'

interface LoginModalOpenOptions {
  redirect?: string
  mode?: LoginModalMode
}

interface LoginModalState {
  visible: boolean
  mode: LoginModalMode | ''
  // 登录成功后需要跳转的目标路径；未登录时点击钱包等需要登录态的入口会写入
  pendingRedirect: string
}

export const useLoginModalStore = defineStore('h5-login-modal-store', {
  state: (): LoginModalState => ({
    visible: false,
    mode: '',
    pendingRedirect: '',
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
      }
      this.visible = true
    },
    close(): void {
      this.visible = false
      this.mode = ''
      this.pendingRedirect = ''
    },
    consumePendingRedirect(): string {
      const target = this.pendingRedirect
      this.pendingRedirect = ''
      return target
    },
  },
})

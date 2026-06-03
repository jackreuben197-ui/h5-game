import { defineStore } from 'pinia'

interface LoginModalState {
  visible: boolean
  // 登录成功后需要跳转的目标路径；未登录时点击钱包等需要登录态的入口会写入
  pendingRedirect: string
}

export const useLoginModalStore = defineStore('h5-login-modal-store', {
  state: (): LoginModalState => ({
    visible: false,
    pendingRedirect: '',
  }),
  actions: {
    open(redirect?: string): void {
      if (typeof redirect === 'string' && redirect) {
        this.pendingRedirect = redirect
      }
      this.visible = true
    },
    close(): void {
      this.visible = false
      this.pendingRedirect = ''
    },
    consumePendingRedirect(): string {
      const target = this.pendingRedirect
      this.pendingRedirect = ''
      return target
    },
  },
})

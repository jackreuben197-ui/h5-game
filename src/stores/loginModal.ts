import { defineStore } from 'pinia'

interface LoginModalState {
  visible: boolean
}

export const useLoginModalStore = defineStore('h5-login-modal-store', {
  state: (): LoginModalState => ({
    visible: false,
  }),
  actions: {
    open(): void {
      this.visible = true
    },
    close(): void {
      this.visible = false
    },
  },
})

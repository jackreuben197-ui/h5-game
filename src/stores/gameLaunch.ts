import { defineStore } from 'pinia'

interface GameLaunchState {
  visible: boolean
  url: string
}

export const useGameLaunchStore = defineStore('h5-game-launch-store', {
  state: (): GameLaunchState => ({
    visible: false,
    url: '',
  }),
  actions: {
    openFallback(url: string): void {
      if (!url) {
        return
      }
      this.url = url
      this.visible = true
    },
    close(): void {
      this.visible = false
      this.url = ''
    },
  },
})

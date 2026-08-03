import { defineStore } from 'pinia'
import type { DeepLinkIntent } from '@/session/telegramDeepLink'

export interface TelegramClubJoinState {
  show: boolean
  clubId: number
  clubRandomId: number
  clubName: string
  pendingIntent: DeepLinkIntent | null
  loading: boolean
}

export const useTelegramClubJoinStore = defineStore('telegram-club-join', {
  state: (): TelegramClubJoinState => ({
    show: false,
    clubId: 0,
    clubRandomId: 0,
    clubName: '',
    pendingIntent: null,
    loading: false,
  }),
  actions: {
    openModal(params: {
      clubId: number
      clubRandomId: number
      clubName?: string
      pendingIntent?: DeepLinkIntent | null
    }): void {
      this.clubId = params.clubId
      this.clubRandomId = params.clubRandomId
      this.clubName = params.clubName || ''
      this.pendingIntent = params.pendingIntent || null
      this.show = true
      this.loading = false
    },
    closeModal(): void {
      this.show = false
      this.loading = false
      this.pendingIntent = null
    },
    setLoading(value: boolean): void {
      this.loading = value
    },
  },
})

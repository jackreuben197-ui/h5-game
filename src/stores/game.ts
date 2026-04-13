import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import type { EnterTablePayload } from '@/bridge/protocol'

interface GameState {
  sessionToken: string
  lastEnterTable: EnterTablePayload | null
  lastEnterAt: number
  lastBridgeAck: string
  lastBridgeAckAt: number
}

export const useGameStore = defineStore(
  'h5-game-store',
  {
    state: (): GameState => ({
      sessionToken: '',
      lastEnterTable: null,
      lastEnterAt: 0,
      lastBridgeAck: '',
      lastBridgeAckAt: 0,
    }),
    actions: {
      setSessionToken(token: string): void {
        this.sessionToken = token
      },
      setLastEnterTable(payload: EnterTablePayload): void {
        this.lastEnterTable = payload
        this.lastEnterAt = dayjs().valueOf()
      },
      setBridgeAck(message: string): void {
        this.lastBridgeAck = message
        this.lastBridgeAckAt = dayjs().valueOf()
      },
    },
    persist: {
      key: 'h5-game-store',
      storage: localStorage,
      pick: ['sessionToken', 'lastEnterTable', 'lastEnterAt'],
    },
  },
)

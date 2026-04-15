import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import type { EnterTablePayload } from '@/bridge/protocol'
import StorageKey from '@/constants/storageKey'
import { dzpkPersistStorage, localStore } from '@/utils/localStore'

interface GameState {
  sessionToken: string
  loginAccount: string
  loginNickname: string
  loginUserId: string
  lastEnterTable: EnterTablePayload | null
  lastEnterAt: number
  lastBridgeAck: string
  lastBridgeAckAt: number
}

export const useGameStore = defineStore(
  'h5-game-store',
  {
    state: (): GameState => ({
      // 启动时从 dzpk_TOKEN 恢复 token，保证与 Cocos 键名一致。
      sessionToken: localStore.getItem<string>(StorageKey.TOKEN, '') || '',
      loginAccount: '',
      loginNickname: '',
      loginUserId: '',
      lastEnterTable: null,
      lastEnterAt: 0,
      lastBridgeAck: '',
      lastBridgeAckAt: 0,
    }),
    actions: {
      setSessionToken(token: string): void {
        this.sessionToken = token
        // 双写到本地存储，便于非 Pinia 场景也能读取同一 token key。
        localStore.setItem(StorageKey.TOKEN, token)
      },
      setLoginUser(payload: { account: string; nickname: string; userId: string }): void {
        this.loginAccount = payload.account
        this.loginNickname = payload.nickname
        this.loginUserId = payload.userId
      },
      clearLogin(): void {
        this.sessionToken = ''
        this.loginAccount = ''
        this.loginNickname = ''
        this.loginUserId = ''
        // 退出登录时同步清理 dzpk_TOKEN。
        localStore.removeItem(StorageKey.TOKEN)
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
      // 与 Cocos StorageKey.LOGIN_DATA 对齐，最终落地为 dzpk_LOGIN_DATA。
      key: StorageKey.LOGIN_DATA,
      storage: dzpkPersistStorage,
      pick: [
        'sessionToken',
        'loginAccount',
        'loginNickname',
        'loginUserId',
        'lastEnterTable',
        'lastEnterAt',
      ],
    },
  },
)

import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import type { EnterTablePayload } from '@/bridge/protocol'
import StorageKey from '@/constants/storageKey'
import { useUserInfoStore } from '@/stores/userInfo'
import { dzpkPersistStorage, localStore } from '@/utils/localStore'

interface GameState {
  sessionToken: string
  websocketPort: number
  loginAccount: string
  loginNickname: string
  loginUserId: string
  syncedProfileToken: string
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
      // 启动时恢复 websocket 端口缓存，对齐 Cocos LoginSession 的 SyncWS 能力。
      websocketPort: Number(localStore.getItem<number | string>(StorageKey.WS_PORT, 0)) || 0,
      loginAccount: '',
      loginNickname: '',
      loginUserId: '',
      syncedProfileToken: '',
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
      setWebsocketPort(port: number): void {
        const safePort = Number.isFinite(port) && port > 0 ? Math.floor(port) : 0
        this.websocketPort = safePort
        if (safePort > 0) {
          localStore.setItem(StorageKey.WS_PORT, safePort)
          localStore.setItem(StorageKey.WS_PORT_UPDATED_AT, Date.now())
          return
        }
        localStore.removeItem(StorageKey.WS_PORT)
        localStore.removeItem(StorageKey.WS_PORT_UPDATED_AT)
      },
      setLoginUser(payload: { account: string; nickname: string; userId: string }): void {
        this.loginAccount = payload.account
        this.loginNickname = payload.nickname
        this.loginUserId = payload.userId
      },
      // 同一 token 在当前应用会话内只允许同步一次用户/俱乐部资料。
      shouldSyncProfile(token: string): boolean {
        const safeToken = token.trim()
        if (!safeToken) {
          return false
        }
        return this.syncedProfileToken !== safeToken
      },
      markProfileSynced(token: string): void {
        const safeToken = token.trim()
        if (safeToken) {
          this.syncedProfileToken = safeToken
        }
      },
      clearLogin(): void {
        this.sessionToken = ''
        this.websocketPort = 0
        this.loginAccount = ''
        this.loginNickname = ''
        this.loginUserId = ''
        this.syncedProfileToken = ''
        // 登录态清空时，同步清理全局共享缓存。
        const userInfoStore = useUserInfoStore()
        userInfoStore.clearInfo()
        // 退出登录时同步清理 dzpk_TOKEN。
        localStore.removeItem(StorageKey.TOKEN)
        localStore.removeItem(StorageKey.WS_PORT)
        localStore.removeItem(StorageKey.WS_PORT_UPDATED_AT)
        // 登录态清空时同步清理房间相关缓存，避免下个账号看到旧牌桌。
        localStore.removeItem(StorageKey.ROOM_LIST_CACHE)
        localStore.removeItem(StorageKey.MTT_LIST_CACHE)
        localStore.removeItem(StorageKey.HOME_ROOM_STATS_CACHE)
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
        'websocketPort',
        'loginAccount',
        'loginNickname',
        'loginUserId',
        'lastEnterTable',
        'lastEnterAt',
      ],
    },
  }
)

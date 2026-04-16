import { getUserWsApi } from '@/api/auth'
import { registerToCocos } from '@/bridge/bridge'
import type { RegisterPayload } from '@/bridge/protocol'
import StorageKey from '@/constants/storageKey'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/stores/pinia'
import { localStore } from '@/utils/localStore'

// 与 Cocos LoginSession 保持同名职责：管理登录会话相关的 websocket 端口同步。
export default class LoginSession {
  private static _wsPort = 0
  private static _lastRegisterSignature = ''

  // 当前缓存的 websocket 端口（优先内存，其次本地存储）。
  static get WSPort(): number {
    if (Number.isFinite(this._wsPort) && this._wsPort > 0) {
      return this._wsPort
    }
    const fromLocal = Number(localStore.getItem<number | string>(StorageKey.WS_PORT, 0))
    return Number.isFinite(fromLocal) && fromLocal > 0 ? fromLocal : 0
  }

  // 写入 websocket 端口并同步到 store/localStorage。
  static set WSPort(value: number) {
    const safeValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
    this._wsPort = safeValue

    const gameStore = useGameStore(pinia)
    gameStore.setWebsocketPort(safeValue)

    if (safeValue > 0) {
      localStore.setItem(StorageKey.WS_PORT, safeValue)
      localStore.setItem(StorageKey.WS_PORT_UPDATED_AT, Date.now())
      return
    }

    localStore.removeItem(StorageKey.WS_PORT)
    localStore.removeItem(StorageKey.WS_PORT_UPDATED_AT)
  }

  // 对应 Cocos LoginSession.SyncWS：请求 /api/user/ws 并更新端口缓存。
  static async SyncWS(): Promise<number> {
    const data = await getUserWsApi()
    const port = Number(data.port)
    if (!Number.isFinite(port) || port <= 0) {
      throw new Error('websocket 端口无效')
    }

    this.WSPort = port
    // 对齐需求：拿到端口后立即向 Cocos 发送 Register（token + websocketPort）。
    this.SendRegisterToCocos(true)
    return this.WSPort
  }

  // 进入牌桌前确保有 websocket 端口；有缓存直接用，没有则请求。
  static async EnsureWS(): Promise<number> {
    const cached = this.WSPort
    if (cached > 0) {
      // 命中缓存时也尝试补发 Register，防止 Cocos 侧状态重置后未同步。
      this.SendRegisterToCocos()
      return cached
    }
    return this.SyncWS()
  }

  // 向 Cocos 发送 Register：携带 token + websocketPort。
  static SendRegisterToCocos(force = false): boolean {
    const gameStore = useGameStore(pinia)
    const token = (gameStore.sessionToken || localStore.getItem<string>(StorageKey.TOKEN, '') || '').trim()
    const websocketPort = Number(gameStore.websocketPort || this.WSPort || 0)

    if (!token || !Number.isFinite(websocketPort) || websocketPort <= 0) {
      return false
    }

    const signature = `${token}@${websocketPort}`
    if (!force && signature === this._lastRegisterSignature) {
      return true
    }

    const payload: RegisterPayload = {
      token,
      websocketPort,
    }
    registerToCocos(payload)
    this._lastRegisterSignature = signature
    return true
  }

  // 退出登录时清空 websocket 端口缓存。
  static ClearWS(): void {
    this.WSPort = 0
    this._lastRegisterSignature = ''
  }
}

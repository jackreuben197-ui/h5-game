import { getUserWsApi } from '@/api/auth'
import { closeWsProxy, ensureWsProxyConnected } from '@/bridge/wsBridge'
import StorageKey from '@/constants/storageKey'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/stores/pinia'
import { localStore } from '@/utils/localStore'

// 与 Cocos LoginSession 保持同名职责：管理登录会话相关的 websocket 端口同步。
export default class LoginSession {
  private static _wsPort = 0

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
    // 对齐最新流程：登录阶段拿到端口后，H5 直接主动建连，不再等待 Cocos 下发 wsConnect。
    ensureWsProxyConnected({ port: this.WSPort })
    return this.WSPort
  }

  // 进入牌桌前确保有 websocket 端口；有缓存直接用，没有则请求。
  static async EnsureWS(): Promise<number> {
    const cached = this.WSPort
    if (cached > 0) {
      // 命中缓存时也主动建连，避免刷新后 Cocos/H5 侧连接状态不一致。
      ensureWsProxyConnected({ port: cached })
      return cached
    }
    return this.SyncWS()
  }

  // 退出登录时清空 websocket 端口缓存。
  static ClearWS(): void {
    // 清空登录态时主动关闭 WS，避免旧会话残留。
    closeWsProxy({ code: 1000, reason: 'login session cleared' })
    this.WSPort = 0
  }
}

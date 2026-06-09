// H5 -> Cocos：websocket 已连接。
export interface WsOpenPayload {
  url: string
}

// H5 -> Cocos：websocket 收到消息。
export interface WsMessageTextPayload {
  dataType: 'text'
  text?: string
}

export interface WsMessageBinaryPayload {
  dataType: 'binary'
  data?: ArrayBuffer | ArrayBufferView | Blob
}

export type WsMessagePayload = WsMessageTextPayload | WsMessageBinaryPayload

// H5 -> Cocos：H5/CC 握手完成通知；已有登录态时附带 token。
export interface H5ReadyPayload {
  token?: string
  safeArea?: SafeArea
}

export interface SafeArea {
  top: number
  left: number
  right: number
  bottom: number
  source?: string
}

// H5 -> Cocos：websocket 错误消息。
export interface WsErrorPayload {
  message: string
}

// H5 -> Cocos：websocket 已关闭。
export interface WsClosedPayload {
  code?: number
  reason?: string
  wasClean?: boolean
}

// H5 -> Cocos：已安排一次重连尝试（attempt 从 1 开始；delayMs 是本次等待时长）。
export interface WsReconnectingPayload {
  attempt: number
  delayMs: number
  // 触发本次重连的来源：close=连接关闭、heartbeat=心跳超时、visibility=切回前台、online=网络恢复、force=Cocos 主动触发。
  reason: 'close' | 'heartbeat' | 'visibility' | 'online' | 'force'
}

// H5 -> Cocos：重连成功（已 onopen 并完成 REGISTER）。
export interface WsReconnectedPayload {
  url: string
  attempt: number
  // 从首次失败到本次成功的总耗时（毫秒）。
  durationMs: number
}

// H5 -> Cocos：放弃重连（命中次数或整体超时）。
export interface WsReconnectFailedPayload {
  reason: 'max-attempts' | 'overall-timeout' | 'auth-invalid'
  attempts: number
  // 累计耗时（毫秒）。
  durationMs: number
}

export interface DialogResultPayload {
  dialogRequestId: string
  action: 'confirm' | 'cancel' | 'close'
}

export interface PanelEventPayload {
  panelRequestId: string
  event: string
  payload?: unknown
}

// 请求进入牌桌时发送给 Cocos 的负载。
export interface EnterTablePayload {
  userName: string
  userId: string
  token: string
  // websocket 端口（来自 /api/user/ws 的 data.port）。
  websocketPort: number
  from: string
  // 当前俱乐部 ID，Cocos 入桌后用于按俱乐部上下文处理。
  clubId?: number
  // 当前俱乐部随机 ID，Cocos 入桌后用于展示/业务上下文。
  clubRandomId?: number
  // 点击的目标房间 ID，方便 Cocos 精确切桌；Cocos 不需要时可忽略。
  roomId?: string
  roomName?: string
  roomInfo: any
}

// 请求进入 MTT 牌桌时发送给 Cocos 的负载。
export interface EnterMttPayload {
  userName?: string
  userId: string
  token?: string
  websocketPort: number
  from: string
  matchId: number
  matchName?: string
  // 观战指定牌桌时传入，对应 Unity ShowGameplayUI(isLookOn:true, roomid)。
  roomId?: number
  isLookOn?: boolean
  // MTT 详情原始数据，供 Cocos 读取 type/gold_type 等字段。
  matchInfo: unknown
}

// 用户信息变化后的同步负载。
export interface SyncUserPayload {
  uid: string
  nickname: string
  avatar?: string
  // 保留原始 user/info data，方便 Cocos 做兼容字段读取。
  raw?: unknown
}

// H5 转发 club 接口响应（通过 action=syncUserClub 区分）。
export interface SyncUserClubPayload {
  response: unknown
}

// H5 转发 rooms/list 请求与响应（通过 action=syncRoomsList 区分）。
export interface SyncRoomsListPayload {
  request: unknown
  response: unknown
}

// H5 当前语言变化同步。
export interface SyncLanguagePayload {
  locale: string
}

// globalConfig 同步（raw 为 key → 值映射；值可以是数字、字符串或嵌套对象）。
export interface SyncGlobalConfigPayload {
  raw: Record<string, unknown>
}

// diamondConfig 同步。
export interface SyncDiamondConfigPayload {
  raw: unknown
}

// Cocos 回执通用负载。
export interface CocosAckPayload {
  ok: boolean
  message: string
}

// H5 -> Cocos：ccStorageOp 的回包。读操作的命中值放在 value 里；
// 写操作只看 ok（成功为 true，失败时 error 给原因，如 'store_not_allowed'）。
export interface CcStorageResultPayload {
  requestId: string
  ok: boolean
  value?: unknown
  error?: string
}

// H5 -> Cocos：握手完成后把 cocos 命名空间下的 localStorage 一次性回灌。
// entries 已经把 'dzpk_cc_' 前缀去掉，Cocos 内存镜像直接以原始 key 索引。
export interface CcStorageSnapshotPayload {
  entries: Record<string, string>
}

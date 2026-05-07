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

// 请求进入牌桌时发送给 Cocos 的负载。
export interface EnterTablePayload {
  userName: string
  userId: string
  token: string
  // websocket 端口（来自 /api/user/ws 的 data.port）。
  websocketPort: number
  from: string
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

// globalConfig 同步。
export interface SyncGlobalConfigPayload {
  raw: unknown
}

// Cocos 回执通用负载。
export interface CocosAckPayload {
  ok: boolean
  message: string
}

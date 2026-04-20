// Cocos -> H5：连接 websocket 请求。
export interface WsConnectPayload {
  // 优先使用完整 URL。
  url?: string
  // 或者传端口，H5 根据模板拼接（如 wss://host{0}）。
  port?: number
}

// Cocos -> H5：发送 websocket 文本消息。
export interface WsSendTextPayload {
  dataType: 'text'
  text?: string
}

// Cocos -> H5：发送 websocket 二进制（原始 binary，推荐）。
export interface WsSendBinaryPayload {
  dataType: 'binary'
  data?: ArrayBuffer | ArrayBufferView | Blob
}

// Cocos -> H5：通用 websocket 发送负载。
export type WsSendPayload = WsSendTextPayload | WsSendBinaryPayload

// Cocos -> H5：关闭 websocket 请求。
export interface WsClosePayload {
  code?: number
  reason?: string
}

// Cocos -> H5 的全局 toast 消息负载。
export interface CocosToastPayload {
  // success: 成功提示；danger: 失败/风险提示。
  type: 'success' | 'danger'
  // 展示文案。
  message: string
  // 可选显示时长（毫秒）。
  duration?: number
}

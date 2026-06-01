// Cocos -> H5：连接 websocket 请求。
export interface WsConnectPayload {
  // 优先使用完整 URL。
  url?: string
  // 或者传端口，H5 根据模板拼接（如 wss://host{0}）。
  port?: number
  // 当前房间/比赛 ID（Cocos 随连接请求一并下发，H5 仅作透传参考）。
  roomId?: number
  matchId?: number
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

// Cocos -> H5：显示通用业务弹窗。
export interface CocosDialogPayload {
  title?: string
  message: string
  showCancelButton?: boolean
  showConfirmButton?: boolean
  cancelButtonText?: string
  confirmButtonText?: string
  // 点击遮罩是否允许关闭，默认 false。
  closeOnClickOverlay?: boolean
  // 是否在展示前确保 H5 可见，默认 false。
  ensureVisible?: boolean
}

export interface CocosPanelPayload {
  panelType: string
  title?: string
  // 自定义面板渲染参数，交由对应 panelType 的组件解释。
  props?: Record<string, unknown>
  // 点击遮罩是否允许关闭，默认 true。
  closeOnClickOverlay?: boolean
  ensureVisible?: boolean
  showH5Bg?: boolean
}

export interface ClosePanelPayload {
  requestId?: string
  panelType?: string
}

// Cocos -> H5：控制 H5 根节点显隐（显示 Cocos 画布时可下发 h5Hide）。
export interface H5VisibilityPayload {
  // 可选附加原因，仅用于日志。
  reason?: string
}

// Cocos -> H5：路由跳转控制。
export interface H5NavigatePayload {
  // 二选一：path 或 name 至少传一个。
  path?: string
  name?: string
  // 路由参数（按 Vue Router 规范透传）。
  params?: Record<string, unknown>
  query?: Record<string, unknown>
  hash?: string
  // true: replace；false/undefined: push。
  replace?: boolean
  // 可选：跳转前先显示 H5 层。
  ensureVisible?: boolean
}

// ─── CC → H5 Payload 映射表 ────────────────────────────────────────────────
// 将每一个 Cocos→H5 的 action 字符串映射到它对应的 payload 类型。
// H5 侧的 subscribeCocosMessages handler 可用此表获得精确类型：
//   (message.payload as CocosToH5PayloadMap['showPanel'])
//
// 注意：wsSend 在 H5 接收时已由 Cocos 的 sendToH5 包装为 WsSendPayload 信封，
// 不再是原始 Uint8Array。若需要修改 action，两端同步更新：
//   pokerqueen/assets/script/H5MsgMgr.ts → CocosToH5PayloadMap
export interface CocosToH5PayloadMap {
  // 握手
  ccReady: undefined
  ccAck: undefined
  // WebSocket 代理（wsSend 走 msgtype=0；其余走 msgtype=1）
  wsConnect: WsConnectPayload
  /** H5 接收到的 wsSend payload 为已包装的 binary 信封（Cocos 内部自动封装）。*/
  wsSend: WsSendPayload
  wsClose: WsClosePayload
  // UI 控制
  showToast: CocosToastPayload
  showDialog: CocosDialogPayload
  showPanel: CocosPanelPayload
  closePanel: ClosePanelPayload
  // H5 显隐
  h5Hide: H5VisibilityPayload | undefined
  h5Show: H5VisibilityPayload | undefined
  // 路由跳转
  h5Navigate: H5NavigatePayload
}

// Bridge 动作定义（H5 <-> Cocos）。
export const BRIDGE_ACTION = {
  // H5/CC 就绪握手动作。
  H5_READY: 'h5Ready',
  CC_READY: 'ccReady',
  H5_ACK: 'h5Ack',
  CC_ACK: 'ccAck',
  // Cocos -> H5：要求 H5 建立/发送/关闭 websocket。
  WS_CONNECT: 'wsConnect',
  WS_SEND: 'wsSend',
  WS_CLOSE: 'wsClose',
  // H5 -> Cocos：同步 websocket 生命周期与消息。
  WS_OPEN: 'wsOpen',
  WS_MESSAGE: 'wsMessage',
  WS_ERROR: 'wsError',
  WS_CLOSED: 'wsClosed',
  // Cocos -> H5
  SHOW_TOAST: 'showToast',
  SHOW_DIALOG: 'showDialog',
  SHOW_PANEL: 'showPanel',
  CLOSE_PANEL: 'closePanel',
  H5_HIDE: 'h5Hide',
  H5_SHOW: 'h5Show',
  H5_NAVIGATE: 'h5Navigate',
  // H5 -> Cocos
  PANEL_EVENT: 'panelEvent',
  SYNC_USER: 'syncUser',
  SYNC_USER_CLUB: 'syncUserClub',
  SYNC_ROOMS_LIST: 'syncRoomsList',
  SYNC_LANGUAGE: 'syncLanguage',
  SYNC_GLOBAL_CONFIG: 'syncGlobalConfig',
  SYNC_DIAMOND_CONFIG: 'syncDiamondConfig',
  ENTER_TABLE: 'enterTable',
  ENTER_MTT: 'enterMtt',
  DIALOG_RESULT: 'dialogResult',
} as const

export type BridgeAction = (typeof BRIDGE_ACTION)[keyof typeof BRIDGE_ACTION]

export const BRIDGE_MSG_TYPE = {
  // 0：网络透传链路（默认值，兼容旧协议未带 msgtype 的场景）。
  FORWARD: 0,
  // 1：H5 业务层处理链路（例如 toast、ready 握手等）。
  H5: 1,
} as const

export type BridgeMsgType = (typeof BRIDGE_MSG_TYPE)[keyof typeof BRIDGE_MSG_TYPE]

export function normalizeBridgeMsgType(raw: unknown): BridgeMsgType {
  return Number(raw) === BRIDGE_MSG_TYPE.H5 ? BRIDGE_MSG_TYPE.H5 : BRIDGE_MSG_TYPE.FORWARD
}

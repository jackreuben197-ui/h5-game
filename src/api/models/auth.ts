// 登录接口请求参数。
export interface LoginRequest {
  phone: string
  password: string
  area: string
}

// 登录接口返回结构（重点字段 token）。
export interface LoginResponse {
  token: string
  [key: string]: unknown
}

// 用户信息接口外层响应。
export interface UserInfoResponse {
  code: number
  data: UserInfoData
  message: string
  [key: string]: unknown
}

// 用户信息接口 data。
export interface UserInfoData {
  closeChatTime?: number
  muteList: Array<Record<string, unknown>>
  openChat: boolean
  user: UserInfoUser
  [key: string]: unknown
}

// 用户对象（按当前业务使用保留常用字段）。
export interface UserInfoUser {
  nickname: string
  unid?: number
  userid?: number
  id?: number
  wUid?: number
  pUid?: number
  [key: string]: unknown
}

// /api/user/ws 外层响应。
export interface UserWsResponse {
  code: number
  message: string
  data?: UserWsData
  [key: string]: unknown
}

// /api/user/ws 的 data。
export interface UserWsData {
  // websocket 端口，来自 /api/user/ws。
  port?: number
  [key: string]: unknown
}

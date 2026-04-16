import http from '@/api/http'
import type {
  LoginRequest,
  LoginResponse,
  UserInfoData,
  UserInfoResponse,
  UserWsData,
  UserWsResponse,
} from '@/api/models/auth'

// 登录：返回 token 等登录态信息。
export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<{ data?: LoginResponse; token?: string }>('/user/login', payload)
  const token = res.data?.data?.token ?? res.data?.token

  if (!token) {
    throw new Error('登录接口返回缺少 token')
  }

  return { ...res.data?.data, ...res.data, token }
}

// 用户信息：用于大厅初始化与用户态同步。
export async function getUserInfoApi(): Promise<UserInfoData> {
  const res = await http.post<UserInfoResponse>('/user/info')

  const body = res.data
  if (body.code !== 0) {
    throw new Error(body.message || '获取用户信息失败')
  }

  if (!body.data?.user) {
    throw new Error('用户信息为空')
  }

  return body.data
}

// 同步 websocket 端口：对应 Cocos LoginSession.SyncWS。
export async function getUserWsApi(): Promise<UserWsData> {
  const res = await http.post<UserWsResponse>('/user/ws')
  const body = res.data
  if (body.code !== 0) {
    throw new Error(body.message || '获取 websocket 端口失败')
  }
  return body.data || {}
}

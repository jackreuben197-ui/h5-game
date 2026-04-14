import http from '@/api/http'

export interface LoginRequest {
  phone: string
  password: string
  area: string
}

export interface LoginResponse {
  token: string
  [key: string]: unknown
}

export interface UserInfoResponse {
  code: number
  data: UserInfoData
  message: string
  [key: string]: unknown
}

export interface UserInfoData {
  closeChatTime?: number
  muteList: Array<Record<string, unknown>>
  openChat: boolean
  user: UserInfoUser
  [key: string]: unknown
}

export interface UserInfoUser {
  nickname: string
  unid?: number
  userid?: number
  id?: number
  wUid?: number
  pUid?: number
  [key: string]: unknown
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<{ data?: LoginResponse; token?: string }>('/user/login', payload)
  const token = res.data?.data?.token ?? res.data?.token

  if (!token) {
    throw new Error('登录接口返回缺少 token')
  }

  return { ...res.data?.data, ...res.data, token }
}

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

import http from '@/api/http'
import type {
  LoginRequest,
  LoginResponse,
  UserInfoData,
  UserInfoResponse,
  UserWsData,
  UserWsResponse,
} from '@/api/models/auth'
import type { ApiResponse } from '@/api/models/common'
import { forwardUserClubToCocos, forwardUserInfoToCocos } from '@/bridge/httpSync'
import { pinia } from '@/stores/pinia'
import { type ClubInfo, useUserInfoStore } from '@/stores/userInfo'

function isClubInfo(raw: unknown): raw is ClubInfo {
  if (!raw || typeof raw !== 'object') {
    return false
  }
  const club = raw as Record<string, unknown>
  const clubId = club.club_id
  return clubId !== undefined && clubId !== null && String(clubId).trim() !== ''
}

function extractClubList(raw: unknown, depth = 0): ClubInfo[] {
  if (depth > 4 || raw === null || raw === undefined) {
    return []
  }

  if (Array.isArray(raw)) {
    const direct = raw.filter(isClubInfo)
    if (direct.length) {
      return direct
    }

    for (const item of raw) {
      const nested = extractClubList(item, depth + 1)
      if (nested.length) {
        return nested
      }
    }
    return []
  }

  if (isClubInfo(raw)) {
    return [raw]
  }

  if (typeof raw !== 'object') {
    return []
  }

  const obj = raw as Record<string, unknown>
  const priorityKeys = ['list', 'records', 'clubs', 'club_list', 'items', 'data']
  for (const key of priorityKeys) {
    if (key in obj) {
      const nested = extractClubList(obj[key], depth + 1)
      if (nested.length) {
        return nested
      }
    }
  }

  for (const value of Object.values(obj)) {
    const nested = extractClubList(value, depth + 1)
    if (nested.length) {
      return nested
    }
  }

  return []
}

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

  // 与 Cocos 同步登录用户信息（msgtype=1）。
  forwardUserInfoToCocos(body.data)
  // 每次请求都更新 userInfo 全局缓存。
  const userInfoStore = useUserInfoStore(pinia)
  userInfoStore.setUserInfo(body.data)
  return body.data
}

// 俱乐部信息：供 H5/CC 对齐用户俱乐部状态。
export async function getUserClubApi(): Promise<ApiResponse<unknown>> {
  const res = await http.post<ApiResponse<unknown>>('/org/club/user_club')
  const body = res.data
  if (body.code !== 0) {
    throw new Error(body.message || '获取俱乐部信息失败')
  }

  // 每次请求都更新 clubList 全局缓存；currentClub 默认取第一条，可手动切换。
  const userInfoStore = useUserInfoStore(pinia)
  userInfoStore.setClubList(extractClubList(body.data))
  // 把 club 接口响应转发到 Cocos（msgtype=1）。
  forwardUserClubToCocos(body)
  return body
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

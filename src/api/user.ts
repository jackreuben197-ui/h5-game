import http, { type HttpRequestConfigExt } from '@/api/http'
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/api/models/common'
import type {
  LoginRequest,
  LoginResponse,
  LoginV2Request,
  OtherUserInfoData,
  OtherUserInfoRequest,
  UserCheckEmailData,
  UserCheckEmailRequest,
  UserInfoData,
  UserInfoResponse,
  UserAvatarsData,
  UserCheckNicknameData,
  UserBindEmailRequest,
  UserBindPhoneRequest,
  UserBindStatusData,
  UserBindThirdPartyRequest,
  UserCheckNicknameRequest,
  UserCheckPhoneData,
  UserCheckPhoneRequest,
  UserGoldChangeLogData,
  UserGoldChangeLogRequest,
  UserModifyInfoRequest,
  UserModifyInfoData,
  UserModifyPasswordData,
  UserModifyPasswordRequest,
  UserMuteListData,
  UserMyWalletsData,
  UserRefreshData,
  UserRefreshRequest,
  UserRegisterData,
  UserRegisterRequest,
  UserRoomData,
  UserRoomRequest,
  UserRoomSettleDetailData,
  UserRoomSettleDetailRequest,
  UserSendCodeRequest,
  UserDeleteCodeRequest,
  UserDeleteCodeResponseData,
  UserSendEmailCodeData,
  UserSendEmailCodeRequest,
  UserWsData,
  UserWsResponse,
  UserDeleteRequest,
  UserDeleteResponseData,
  UserVerifyPasswordRequest,
  UserVerifyPasswordResponseData,
  UserModifyQuickInfoRequest,
  UserModifyQuickInfoResponseData,
  UserModifyQuickSwitchRequest,
  UserModifyQuickSwitchResponseData,
  UserModifyBringInSwitchRequest,
  UserModifyBringInSwitchResponseData,
  UserBillRequest,
  UserBillResponseData,
  UserWalletRequest,
  UserWalletResponseData,
  USDTApplyListRequest,
  USDTApplyListResponseData,
  USDTApplyRequest,
  USDTApplyResponseData,
  USDTApplyReadRequest,
  USDTApplyReadResponseData,
  NewSafetyRequest,
  NewSafetyResponseData,
} from '@/api/models/user'
import { forwardUserClubToCocos, forwardUserInfoToCocos } from '@/bridge/sync'
import { pinia } from '@/stores/pinia'
import { type ClubInfo, useUserInfoStore } from '@/stores/userInfo'

interface ApiRequestExtOptions extends AxiosRequestConfig {
  suppressBusinessToast?: boolean
  suppressBusinessCodes?: number[]
}

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

// 对齐 Cocos Login2：支持手机号/邮箱登录。
export async function loginV2Api(
  payload: LoginV2Request,
  config?: Partial<HttpRequestConfigExt>,
): Promise<LoginResponse> {
  try {
    const res = await http.post<{ data?: LoginResponse; token?: string; message?: string }>(
      '/user/login2',
      payload,
      config as InternalAxiosRequestConfig,
    )
    const token = res.data?.data?.token ?? res.data?.token
    if (!token) {
      throw new Error(res.data?.message || '登录失败')
    }
    return { ...res.data?.data, ...res.data, token }
  } catch (error) {
    throw error
  }
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

// 对齐 cocos WebRefreshToken.API。
export async function postUserRefreshApi(
  payload: UserRefreshRequest = {},
): Promise<ApiResponse<UserRefreshData>> {
  const response = await http.post<ApiResponse<UserRefreshData>>('/user/refresh', payload)
  return response.data
}

// 对齐 cocos WebUserCheckPhone.API。
export async function postUserCheckPhoneApi(
  payload: UserCheckPhoneRequest,
  options: ApiRequestExtOptions = {},
): Promise<ApiResponse<UserCheckPhoneData>> {
  const response = await http.post<ApiResponse<UserCheckPhoneData>>(
    '/user/check_phone',
    payload,
    options,
  )
  return response.data
}

// 对齐 cocos WebUserSendCode.API。
export async function postUserSendCodeApi(
  payload: UserSendCodeRequest,
): Promise<ApiResponse<Record<string, unknown>>> {
  const response = await http.post<ApiResponse<Record<string, unknown>>>('/user/sendcode', payload)
  return response.data
}

// 对齐 cocos WebUserCheckEmail.API。
export async function postUserCheckEmailApi(
  payload: UserCheckEmailRequest,
): Promise<ApiResponse<UserCheckEmailData>> {
  const response = await http.post<ApiResponse<UserCheckEmailData>>('/user/check_email', payload)
  return response.data
}

// 对齐 cocos WebUserSendEmailCode.API。
export async function postUserSendEmailCodeApi(
  payload: UserSendEmailCodeRequest,
): Promise<ApiResponse<UserSendEmailCodeData>> {
  const response = await http.post<ApiResponse<UserSendEmailCodeData>>(
    '/user/send_email_code',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUserModifyPassword.API。
export async function postUserModifyPasswordApi(
  payload: UserModifyPasswordRequest,
): Promise<ApiResponse<UserModifyPasswordData>> {
  const response = await http.post<ApiResponse<UserModifyPasswordData>>(
    '/user/modify/password',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUserModifyUserInfo.API。
export async function postUserModifyInfoApi(
  payload: UserModifyInfoRequest,
): Promise<ApiResponse<UserModifyInfoData>> {
  const response = await http.post<ApiResponse<UserModifyInfoData>>(
    '/user/modify/user_info',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUserCheckNickname.API。
export async function postUserCheckNicknameApi(
  payload: UserCheckNicknameRequest,
): Promise<ApiResponse<UserCheckNicknameData>> {
  const response = await http.post<ApiResponse<UserCheckNicknameData>>(
    '/user/check_nickname',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUserRegister.API。
export async function postUserRegisterApi(
  payload: UserRegisterRequest,
): Promise<ApiResponse<UserRegisterData>> {
  const response = await http.post<ApiResponse<UserRegisterData>>('/user/register', payload)
  return response.data
}

// 对齐 cocos WebOtherUserInfo.API。
export async function getOtherUserInfoApi(
  userId: number | string,
  payload: OtherUserInfoRequest = {},
): Promise<ApiResponse<OtherUserInfoData[]>> {
  const endpoint = `/user/${userId}/info`
  const response = await http.post<ApiResponse<OtherUserInfoData[]>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebUserRoom.API。
export async function getUserRoomApi(
  roomId: number | string,
  payload: UserRoomRequest = {},
): Promise<ApiResponse<UserRoomData>> {
  const endpoint = `/user/room/${roomId}`
  const response = await http.post<ApiResponse<UserRoomData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebUserRoomSettleDetail.API。
export async function getUserRoomSettleDetailApi(
  roomId: number | string,
  payload: UserRoomSettleDetailRequest = {},
): Promise<ApiResponse<UserRoomSettleDetailData>> {
  const endpoint = `/user/room_settle/detail/${roomId}`
  const response = await http.post<ApiResponse<UserRoomSettleDetailData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos /api/user/bind_status。
export async function postUserBindStatusApi(
  payload: Record<string, unknown> = {},
): Promise<ApiResponse<UserBindStatusData>> {
  const response = await http.post<ApiResponse<UserBindStatusData>>('/user/bind_status', payload)
  return response.data
}

// 对齐 cocos /api/user/bind_email。
export async function postUserBindEmailApi(
  payload: UserBindEmailRequest,
): Promise<ApiResponse<Record<string, unknown>>> {
  const response = await http.post<ApiResponse<Record<string, unknown>>>(
    '/user/bind_email',
    payload,
  )
  return response.data
}

// 对齐 cocos /api/user/bind_phone。
export async function postUserBindPhoneApi(
  payload: UserBindPhoneRequest,
): Promise<ApiResponse<Record<string, unknown>>> {
  const response = await http.post<ApiResponse<Record<string, unknown>>>(
    '/user/bind_phone',
    payload,
  )
  return response.data
}

// 对齐 cocos /api/user/bind_third_party。
export async function postUserBindThirdPartyApi(
  payload: UserBindThirdPartyRequest,
): Promise<ApiResponse<Record<string, unknown>>> {
  const response = await http.post<ApiResponse<Record<string, unknown>>>(
    '/user/bind_third_party',
    payload,
  )
  return response.data
}

// 对齐 cocos /api/user/get_avatars。
export async function postUserAvatarsApi(
  payload: Record<string, unknown> = {},
): Promise<ApiResponse<UserAvatarsData>> {
  const response = await http.post<ApiResponse<UserAvatarsData>>('/user/get_avatars', payload)
  return response.data
}

// 对齐 cocos /api/user/mute/list。
export async function postUserMuteListApi(
  payload: Record<string, unknown> = {},
): Promise<ApiResponse<UserMuteListData>> {
  const response = await http.post<ApiResponse<UserMuteListData>>('/user/mute/list', payload)
  return response.data
}

// 对齐 cocos /api/user/my_wallets。
export async function postUserMyWalletsApi(
  payload: Record<string, unknown> = {},
): Promise<ApiResponse<UserMyWalletsData>> {
  const response = await http.post<ApiResponse<UserMyWalletsData>>('/user/my_wallets', payload)
  return response.data
}

// 对齐 cocos WebUserDeleteCode.API
export async function postUserDeleteCodeApi(
  payload: UserDeleteCodeRequest = {} as UserDeleteCodeRequest,
): Promise<ApiResponse<UserDeleteCodeResponseData>> {
  const response = await http.post<ApiResponse<UserDeleteCodeResponseData>>(
    '/user/send_verify_code',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUserDelete.API
export async function postUserDeleteApi(
  payload: UserDeleteRequest = {} as UserDeleteRequest,
): Promise<ApiResponse<UserDeleteResponseData>> {
  const response = await http.post<ApiResponse<UserDeleteResponseData>>('/user/delete', payload)
  return response.data
}

// 对齐 cocos WebUserVerifyPassword.API
export async function postUserVerifyPasswordApi(
  payload: UserVerifyPasswordRequest = {} as UserVerifyPasswordRequest,
): Promise<ApiResponse<UserVerifyPasswordResponseData>> {
  const response = await http.post<ApiResponse<UserVerifyPasswordResponseData>>(
    '/user/quick_password/verify',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUserModifyQuickInfo.API
export async function postUserModifyQuickInfoApi(
  payload: UserModifyQuickInfoRequest = {} as UserModifyQuickInfoRequest,
): Promise<ApiResponse<UserModifyQuickInfoResponseData>> {
  const response = await http.post<ApiResponse<UserModifyQuickInfoResponseData>>(
    '/user/quick_password/modify',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUserModifyQuickSwitch.API
export async function postUserModifyQuickSwitchApi(
  payload: UserModifyQuickSwitchRequest = {} as UserModifyQuickSwitchRequest,
): Promise<ApiResponse<UserModifyQuickSwitchResponseData>> {
  const response = await http.post<ApiResponse<UserModifyQuickSwitchResponseData>>(
    '/user/modify/quick/login/switch',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUserModifyBringInSwitch.API
export async function postUserModifyBringInSwitchApi(
  payload: UserModifyBringInSwitchRequest = {} as UserModifyBringInSwitchRequest,
): Promise<ApiResponse<UserModifyBringInSwitchResponseData>> {
  const response = await http.post<ApiResponse<UserModifyBringInSwitchResponseData>>(
    '/user/modify/bringin/password/switch',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUserBill.API
export async function postUserBillApi(
  payload: UserBillRequest = {} as UserBillRequest,
): Promise<ApiResponse<UserBillResponseData>> {
  const response = await http.post<ApiResponse<UserBillResponseData>>('/user/wallets_log', payload)
  return response.data
}

// 对齐 cocos WebUserWallet.API
export async function postUserWalletApi(
  payload: UserWalletRequest = {} as UserWalletRequest,
): Promise<ApiResponse<UserWalletResponseData>> {
  const response = await http.post<ApiResponse<UserWalletResponseData>>('/user/my_wallets', payload)
  return response.data
}

// /api/user/gold_change/log —玩家资金变动明细。
export async function postUserGoldChangeLogApi(
  payload: UserGoldChangeLogRequest = {},
): Promise<ApiResponse<UserGoldChangeLogData>> {
  const response = await http.post<ApiResponse<UserGoldChangeLogData>>(
    '/user/gold_change/log',
    payload,
  )
  return response.data
}

// 对齐 cocos WebUSDTApplyList.API
export async function postUSDTApplyListApi(
  payload: USDTApplyListRequest = {} as USDTApplyListRequest
): Promise<ApiResponse<USDTApplyListResponseData>> {
  const response = await http.post<ApiResponse<USDTApplyListResponseData>>('/user/trader/apply/list', payload)
  return response.data
}

// 对齐 cocos WebUSDTApply.API
export async function postUSDTApplyApi(
  payload: USDTApplyRequest = {} as USDTApplyRequest
): Promise<ApiResponse<USDTApplyResponseData>> {
  const response = await http.post<ApiResponse<USDTApplyResponseData>>('/user/trader/apply', payload)
  return response.data
}

// 对齐 cocos WebUSDTApplyRead.API
export async function postUSDTApplyReadApi(
  payload: USDTApplyReadRequest = {} as USDTApplyReadRequest
): Promise<ApiResponse<USDTApplyReadResponseData>> {
  const response = await http.post<ApiResponse<USDTApplyReadResponseData>>('/user/trader/apply/read', payload)
  return response.data
}

// 对齐 cocos WebNewSafety.API
export async function postNewSafetyApi(
  payload: NewSafetyRequest = {} as NewSafetyRequest
): Promise<ApiResponse<NewSafetyResponseData>> {
  const response = await http.post<ApiResponse<NewSafetyResponseData>>('/user/freeze/public/list', payload)
  return response.data
}

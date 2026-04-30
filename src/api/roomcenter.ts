import http from '@/api/http'
import type { AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/api/models/common'
import type {
  AllMttSngIdsData,
  AllMttSngIdsRequest,
  MttBuyInRequest,
  MttRebuyRequest,
  MttUserWalletData,
  MttListData,
  MttListRequest,
  RoomDetailData,
  RoomDetailRequest,
  RoomIdsData,
  RoomcenterFriendRoomApplyAuditData,
  RoomcenterFriendRoomApplyAuditRequest,
  RoomcenterFriendRoomApplyListData,
  RoomcenterFriendRoomApplyListRequest,
  RoomcenterFriendRoomsData,
  RoomcenterFriendRoomsRequest,
  RoomcenterGroupsRecord,
  RoomcenterGroupsRequest,
  RoomcenterMttDetailData,
  RoomcenterMttDetailRequest,
  RoomcenterMttHunterRanksData,
  RoomcenterMttHunterRanksRequest,
  RoomcenterMttListData,
  RoomcenterMttListRequest,
  RoomcenterMttRanksData,
  RoomcenterMttRanksRequest,
  RoomcenterMttRealPrize,
  RoomcenterMttRealPrizeRequest,
  RoomcenterMttRoomsData,
  RoomcenterMttRoomsRequest,
  RoomcenterRandomEnterData,
  RoomcenterRandomEnterRequest,
  RoomcenterRoomBlindsData,
  RoomcenterRoomBlindsRequest,
  RoomcenterRoomInfoData,
  RoomcenterRoomInfoRequest,
  RoomcenterRoomsAndMttListData,
  RoomcenterRoomsAndMttListRequest,
  RoomcenterRoomsData,
  RoomcenterRoomsRequest,
  RoomcenterUserAllRoomsData,
  RoomcenterUserAllRoomsRequest,
} from '@/api/models/roomcenter'
import { forwardRoomsListToCocos } from '@/bridge/sync'

export interface RoomcenterRequestOptions extends AxiosRequestConfig {
  suppressBusinessToast?: boolean
  suppressBusinessCodes?: number[]
}

// 对齐 cocos WebRoomCenterGroups.API。
export async function postRoomcenterGroupsApi(
  payload: RoomcenterGroupsRequest = {},
): Promise<ApiResponse<RoomcenterGroupsRecord[]>> {
  const response = await http.post<ApiResponse<RoomcenterGroupsRecord[]>>('/roomcenter/groups', payload)
  return response.data
}

// 对齐 cocos WebRoomCenterRoomsBlinds.API。
export async function postRoomcenterRoomBlindsApi(
  payload: RoomcenterRoomBlindsRequest,
): Promise<ApiResponse<RoomcenterRoomBlindsData>> {
  const response = await http.post<ApiResponse<RoomcenterRoomBlindsData>>(
    '/roomcenter/room_blinds',
    payload,
  )
  return response.data
}

// 对齐 cocos WebRoomCenterRooms.API。
export async function postRoomcenterRoomsApi(
  payload: RoomcenterRoomsRequest,
): Promise<ApiResponse<RoomcenterRoomsData>> {
  const response = await http.post<ApiResponse<RoomcenterRoomsData>>('/roomcenter/rooms', payload)
  return response.data
}

// 对齐 cocos /api/roomcenter/friend/rooms。
export async function postRoomcenterFriendRoomsApi(
  payload: RoomcenterFriendRoomsRequest = {},
): Promise<ApiResponse<RoomcenterFriendRoomsData>> {
  const response = await http.post<ApiResponse<RoomcenterFriendRoomsData>>(
    '/roomcenter/friend/rooms',
    payload,
  )
  return response.data
}

// 对齐 cocos /api/roomcenter/friend/room/apply/list。
export async function postRoomcenterFriendRoomApplyListApi(
  payload: RoomcenterFriendRoomApplyListRequest,
): Promise<ApiResponse<RoomcenterFriendRoomApplyListData>> {
  const response = await http.post<ApiResponse<RoomcenterFriendRoomApplyListData>>(
    '/roomcenter/friend/room/apply/list',
    payload,
  )
  return response.data
}

// 对齐 cocos /api/roomcenter/friend/room/apply/audit。
export async function postRoomcenterFriendRoomApplyAuditApi(
  payload: RoomcenterFriendRoomApplyAuditRequest,
): Promise<ApiResponse<RoomcenterFriendRoomApplyAuditData>> {
  const response = await http.post<ApiResponse<RoomcenterFriendRoomApplyAuditData>>(
    '/roomcenter/friend/room/apply/audit',
    payload,
  )
  return response.data
}

// 对齐 cocos /api/roomcenter/room/info。
export async function postRoomcenterRoomInfoApi(
  payload: RoomcenterRoomInfoRequest,
): Promise<ApiResponse<RoomcenterRoomInfoData>> {
  const response = await http.post<ApiResponse<RoomcenterRoomInfoData>>('/roomcenter/room/info', payload)
  return response.data
}

// 对齐 cocos /api/roomcenter/mtt/list。
export async function postRoomcenterMttListApi(
  payload: RoomcenterMttListRequest = {},
): Promise<ApiResponse<RoomcenterMttListData>> {
  const response = await http.post<ApiResponse<RoomcenterMttListData>>('/roomcenter/mtt/list', payload)
  return response.data
}

// 对齐 cocos /api/roomcenter/rooms_and_mtt/list。
export async function postRoomcenterRoomsAndMttListApi(
  payload: RoomcenterRoomsAndMttListRequest = {},
): Promise<ApiResponse<RoomcenterRoomsAndMttListData>> {
  const response = await http.post<ApiResponse<RoomcenterRoomsAndMttListData>>(
    '/roomcenter/rooms_and_mtt/list',
    payload,
  )
  return response.data
}

// 对齐 cocos /api/roomcenter/random_enter。
export async function postRoomcenterRandomEnterApi(
  payload: RoomcenterRandomEnterRequest,
): Promise<ApiResponse<RoomcenterRandomEnterData>> {
  const response = await http.post<ApiResponse<RoomcenterRandomEnterData>>(
    '/roomcenter/random_enter',
    payload,
  )
  return response.data
}

// 对齐 cocos /api/roomcenter/mtt/{id}/detail。
export async function getRoomcenterMttDetailApi(
  mttId: number | string,
  payload: RoomcenterMttDetailRequest = {},
): Promise<ApiResponse<RoomcenterMttDetailData>> {
  const endpoint = `/roomcenter/mtt/${mttId}/detail`
  const response = await http.post<ApiResponse<RoomcenterMttDetailData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos /api/roomcenter/mtt/{id}/ranks。
export async function postRoomcenterMttRanksApi(
  mttId: number | string,
  payload: RoomcenterMttRanksRequest = {},
  requestOptions: RoomcenterRequestOptions = {},
): Promise<ApiResponse<RoomcenterMttRanksData>> {
  const endpoint = `/roomcenter/mtt/${mttId}/ranks`
  const response = await http.post<ApiResponse<RoomcenterMttRanksData>>(endpoint, payload, requestOptions)
  return response.data
}

// 对齐 cocos /api/roomcenter/mtt/{id}/hranks。
export async function postRoomcenterMttHunterRanksApi(
  mttId: number | string,
  payload: RoomcenterMttHunterRanksRequest = {},
  requestOptions: RoomcenterRequestOptions = {},
): Promise<ApiResponse<RoomcenterMttHunterRanksData>> {
  const endpoint = `/roomcenter/mtt/${mttId}/hranks`
  const response = await http.post<ApiResponse<RoomcenterMttHunterRanksData>>(endpoint, payload, requestOptions)
  return response.data
}

// 对齐 cocos /api/roomcenter/mtt/{id}/real_prize。
export async function postRoomcenterMttRealPrizeApi(
  mttId: number | string,
  payload: RoomcenterMttRealPrizeRequest = {},
): Promise<ApiResponse<RoomcenterMttRealPrize>> {
  const endpoint = `/roomcenter/mtt/${mttId}/real_prize`
  const response = await http.post<ApiResponse<RoomcenterMttRealPrize>>(endpoint, payload)
  return response.data
}

// 对齐 cocos /api/roomcenter/mtt/{id}/rooms。
export async function postRoomcenterMttRoomsApi(
  mttId: number | string,
  payload: RoomcenterMttRoomsRequest = {},
  requestOptions: RoomcenterRequestOptions = {},
): Promise<ApiResponse<RoomcenterMttRoomsData>> {
  const endpoint = `/roomcenter/mtt/${mttId}/rooms`
  const response = await http.post<ApiResponse<RoomcenterMttRoomsData>>(endpoint, payload, requestOptions)
  return response.data
}

// 对齐 cocos /api/roomcenter/user/all/rooms。
export async function postRoomcenterUserAllRoomsApi(
  payload: RoomcenterUserAllRoomsRequest = {},
): Promise<ApiResponse<RoomcenterUserAllRoomsData>> {
  const response = await http.post<ApiResponse<RoomcenterUserAllRoomsData>>(
    '/roomcenter/user/all/rooms',
    payload,
  )
  return response.data
}

// 请求所有可见牌桌 ID。
export async function getRoomIdsApi(payload: Record<string, unknown>): Promise<ApiResponse<RoomIdsData>> {
  const response = await http.post<ApiResponse<RoomIdsData>>('/roomcenter/user/all/room/ids', payload)
  return response.data
}

// 根据房间 ID 批量请求牌桌详情。
export async function getRoomsDetailApi(payload: RoomDetailRequest): Promise<ApiResponse<RoomDetailData>> {
  const response = await http.post<ApiResponse<RoomDetailData>>('/roomcenter/user/rooms/list', payload)
  const body = response.data
  // 把 rooms/list 请求结果转发给 Cocos（msgtype=1）。
  forwardRoomsListToCocos(payload, body)
  return body
}

// MTT 列表：用于首页 MTT 入口统计。
export async function getMttListApi(payload: MttListRequest): Promise<ApiResponse<MttListData>> {
  const response = await http.post<ApiResponse<MttListData>>('/roomcenter/mtt/list', payload)
  return response.data
}

// 玩家可见的 MTT/SNG ID 与系列信息（与 Unity UpdateDataSource 对齐）。
export async function getAllMttSngIdsApi(
  payload: AllMttSngIdsRequest = {},
): Promise<ApiResponse<AllMttSngIdsData>> {
  const response = await http.post<ApiResponse<AllMttSngIdsData>>(
    '/roomcenter/user/all/mtt/sng/ids',
    payload,
  )
  return response.data
}

// 对齐 Unity HttpMTTUserWalletProtocol.API。
export async function getMttUserWalletApi(
  mttId: number | string,
): Promise<ApiResponse<MttUserWalletData>> {
  const response = await http.post<ApiResponse<MttUserWalletData>>(
    `/roomcenter/mtt/${mttId}/user_wallet`,
    {},
  )
  return response.data
}

// 对齐 cocos /api/roomcenter/mtt/{id}/buyin。
export async function mttBuyInApi(
  mttId: number | string,
  payload: MttBuyInRequest = {},
): Promise<ApiResponse<unknown>> {
  const response = await http.post<ApiResponse<unknown>>(`/roomcenter/mtt/${mttId}/buyin`, payload)
  return response.data
}

// 对齐 cocos /api/roomcenter/mtt/{id}/quit。
export async function mttQuitApi(mttId: number | string): Promise<ApiResponse<unknown>> {
  const response = await http.post<ApiResponse<unknown>>(`/roomcenter/mtt/${mttId}/quit`, {})
  return response.data
}

// 对齐 cocos /api/roomcenter/mtt/{id}/rebuy。
export async function mttRebuyApi(
  mttId: number | string,
  payload: MttRebuyRequest = {},
): Promise<ApiResponse<unknown>> {
  const response = await http.post<ApiResponse<unknown>>(`/roomcenter/mtt/${mttId}/rebuy`, payload)
  return response.data
}

import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  AllMttSngIdsData,
  AllMttSngIdsRequest,
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
  RoomcenterMttListData,
  RoomcenterMttListRequest,
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

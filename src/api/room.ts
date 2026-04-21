import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type { RoomDetailData, RoomDetailRequest, RoomIdsData } from '@/api/models/room'
import { forwardRoomsListToCocos } from '@/bridge/sync'

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

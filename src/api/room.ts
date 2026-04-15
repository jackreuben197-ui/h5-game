import http from '@/api/http'

// 通用接口响应结构。
export interface ApiResponse<TData> {
  code: number
  message: string
  data: TData
  [key: string]: unknown
}

// 牌桌 ID 列表项。
export interface RoomIdRecord {
  rid: number | string
}

// 牌桌 ID 列表响应数据。
export interface RoomIdsData {
  records: RoomIdRecord[]
}

// 牌桌用户信息。
export interface RoomUser {
  seat?: number | string
  avatar?: string
  name?: string
  [key: string]: unknown
}

// 牌桌详情结构（字段来自旧版 roomList 页面）。
export interface RoomRecord {
  rid: number | string
  name?: string
  game_type: number
  poker_type: number
  sb: number
  roomers?: number
  seat_count?: number
  users?: RoomUser[]
  start_time?: string
  play_duration?: number
  min_rate?: number
  [key: string]: unknown
}

// 牌桌详情响应数据。
export interface RoomDetailData {
  records: RoomRecord[]
}

// 请求所有可见牌桌 ID。
export async function getRoomIdsApi(payload: Record<string, unknown>): Promise<ApiResponse<RoomIdsData>> {
  const response = await http.post<ApiResponse<RoomIdsData>>('/roomcenter/user/all/room/ids', payload)
  return response.data
}

// 根据房间 ID 批量请求牌桌详情。
export async function getRoomsDetailApi(payload: {
  room_ids: number[]
  room_type: number
}): Promise<ApiResponse<RoomDetailData>> {
  const response = await http.post<ApiResponse<RoomDetailData>>('/roomcenter/user/rooms/list', payload)
  return response.data
}

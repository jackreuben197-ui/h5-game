// 牌桌 ID 列表项。
export interface RoomIdRecord {
  rid: number | string
}

// 牌桌 ID 列表响应 data。
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

// 牌桌详情响应 data。
export interface RoomDetailData {
  records: RoomRecord[]
}

// 批量查询牌桌详情请求体。
export interface RoomDetailRequest {
  room_ids: number[]
  room_type: number
}

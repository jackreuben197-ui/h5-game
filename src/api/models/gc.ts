// 牛仔房间列表请求参数。
export interface CowboyRoomListRequest {
  limit?: number
  offset?: number
  [key: string]: unknown
}

// 牛仔房间信息（首页仅关注 online 字段）。
export interface CowboyRoomInfo {
  room_id?: number
  online?: number
  [key: string]: unknown
}

// 牛仔房间列表响应 data（服务端可能返回不同层级，统一做兼容）。
export interface CowboyRoomListData {
  online?: number
  records?: CowboyRoomInfo[]
  data?: CowboyRoomListData
  [key: string]: unknown
}

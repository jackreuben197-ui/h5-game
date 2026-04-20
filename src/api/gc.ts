import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type { CowboyRoomListData, CowboyRoomListRequest } from '@/api/models/gc'

// 小游戏（牛仔）房间列表：用于首页在线人数统计。
export async function getCowboyRoomListApi(
  payload: CowboyRoomListRequest,
): Promise<ApiResponse<CowboyRoomListData>> {
  const response = await http.post<ApiResponse<CowboyRoomListData>>('/gc/cowboy/room/list', payload)
  return response.data
}

import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  AllMttSngIdsData,
  AllMttSngIdsRequest,
  MttListData,
  MttListRequest,
} from '@/api/models/mtt'

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

import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type { MttListData, MttListRequest } from '@/api/models/mtt'

// MTT 列表：用于首页 MTT 入口统计。
export async function getMttListApi(payload: MttListRequest): Promise<ApiResponse<MttListData>> {
  const response = await http.post<ApiResponse<MttListData>>('/roomcenter/mtt/list', payload)
  return response.data
}

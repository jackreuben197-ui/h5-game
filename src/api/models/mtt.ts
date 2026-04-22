// MTT 列表请求参数。
export interface MttListRequest {
  limit: number
  offset: number
  status?: number[]
  order?: string[]
  [key: string]: unknown
}

// MTT 列表项（首页统计只用到 rooms / participants）。
export interface MttListRecord {
  match_id?: number
  rooms?: number
  participants?: number
  [key: string]: unknown
}

// MTT 列表响应 data。
export interface MttListData {
  limit?: number
  offset?: number
  total?: number
  records: MttListRecord[]
}

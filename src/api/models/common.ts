// 通用接口响应结构。
export interface ApiResponse<TData> {
  code: number
  message: string
  data: TData
  [key: string]: unknown
}

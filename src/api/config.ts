import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type { MultiLanguageTemplateRecord } from '@/api/models/config'

// 对齐 Unity HttpConfigMultiLanguageProtocol.API。
export async function getMultiLanguageTemplateApi(): Promise<
  ApiResponse<MultiLanguageTemplateRecord[]>
> {
  const response = await http.post<ApiResponse<MultiLanguageTemplateRecord[]>>(
    '/config/multi_language/template',
    {},
  )
  return response.data
}


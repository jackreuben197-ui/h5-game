import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  ChromedpQrCodeVideoFileRequest,
  ChromedpQrCodeVideoFileResponseData,
} from '@/api/models/chromedp'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))
void formatPath

// 对齐 cocos WebChromedpQrCodeVideoFile.API
export async function postChromedpQrCodeVideoFileApi(
  payload: ChromedpQrCodeVideoFileRequest = {} as ChromedpQrCodeVideoFileRequest
): Promise<ApiResponse<ChromedpQrCodeVideoFileResponseData>> {
  const endpoint = '/chromedp/qrcode/video_file'
  const response = await http.post<ApiResponse<ChromedpQrCodeVideoFileResponseData>>(endpoint, payload)
  return response.data
}

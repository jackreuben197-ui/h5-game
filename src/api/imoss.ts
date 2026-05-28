import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  ImossGameClientUploadAudioRequest,
  ImossGameClientUploadAudioResponseData,
  ImossGameClientUploadImageRequest,
  ImossGameClientUploadImageResponseData,
} from '@/api/models/imoss'

export interface ImossUploadRuntimeConfig {
  oss_key?: string
  base_url?: string
}

/**
 * 构建 imoss 上传请求的 axios config
 * 通过 request-level baseURL 覆盖实例默认值，避免修改 http.defaults.baseURL 带来的全局副作用
 */
function buildImossUploadConfig(runtime: ImossUploadRuntimeConfig = {}): { baseURL: string; headers: Record<string, string> } {
  const baseURL = runtime.base_url
    ? runtime.base_url.replace(/\/$/, '') + '/api'
    : '/api'
  return {
    baseURL,
    headers: {
      Osskey: runtime.oss_key || '',
    },
  }
}

// 对齐 cocos WebImossGameClientUploadAudio.API
export async function postImossGameClientUploadAudioApi(
  payload: ImossGameClientUploadAudioRequest = {} as ImossGameClientUploadAudioRequest,
  runtime: ImossUploadRuntimeConfig = {},
): Promise<ApiResponse<ImossGameClientUploadAudioResponseData>> {
  const config = buildImossUploadConfig(runtime)
  const response = await http.post<ApiResponse<ImossGameClientUploadAudioResponseData>>(
    '/imoss/game_client/upload/audio',
    payload,
    config,
  )
  return response.data
}

// 对齐 cocos WebImossGameClientUploadImage.API
export async function postImossGameClientUploadImageApi(
  payload: ImossGameClientUploadImageRequest = {} as ImossGameClientUploadImageRequest,
  runtime: ImossUploadRuntimeConfig = {},
): Promise<ApiResponse<ImossGameClientUploadImageResponseData>> {
  const config = buildImossUploadConfig(runtime)
  const response = await http.post<ApiResponse<ImossGameClientUploadImageResponseData>>(
    '/imoss/game_client/upload/image',
    payload,
    config,
  )
  return response.data
}

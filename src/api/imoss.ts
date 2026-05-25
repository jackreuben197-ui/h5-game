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

// 对齐 cocos WebImossGameClientUploadAudio.API
export async function postImossGameClientUploadAudioApi(
  payload: ImossGameClientUploadAudioRequest = {} as ImossGameClientUploadAudioRequest,
  runtime: ImossUploadRuntimeConfig = {},
): Promise<ApiResponse<ImossGameClientUploadAudioResponseData>> {
  const endpoint = '/imoss/game_client/upload/audio'
  // 由于上传接口可能在不同的域名下，且不一定与 VITE_API_BASE_URL 相同，因此允许通过 runtime 参数覆盖 baseURL 的默认值
  const baseURL = import.meta.env.VITE_API_BASE_URL ? (runtime.base_url ? runtime.base_url.replace(/\/$/, '') + '/api' : '/api') : '/api'
  http.defaults.baseURL = baseURL
  const response = await http.post<ApiResponse<ImossGameClientUploadAudioResponseData>>(endpoint, payload, {
    headers: {
      'Osskey': runtime.oss_key || '',
    },
  })
  // 恢复默认 baseURL，避免影响后续其他 API 请求
  http.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  return response.data
}

// 对齐 cocos WebImossGameClientUploadImage.API
export async function postImossGameClientUploadImageApi(
  payload: ImossGameClientUploadImageRequest = {} as ImossGameClientUploadImageRequest,
  runtime: ImossUploadRuntimeConfig = {},
): Promise<ApiResponse<ImossGameClientUploadImageResponseData>> {
  const endpoint = '/imoss/game_client/upload/image'
  // 由于上传接口可能在不同的域名下，且不一定与 VITE_API_BASE_URL 相同，因此允许通过 runtime 参数覆盖 baseURL 的默认值
  const baseURL = import.meta.env.VITE_API_BASE_URL ? (runtime.base_url ? runtime.base_url.replace(/\/$/, '') + '/api' : '/api') : '/api'
  http.defaults.baseURL = baseURL
  const response = await http.post<ApiResponse<ImossGameClientUploadImageResponseData>>(endpoint, payload, {
    headers: {
      'Osskey': runtime.oss_key || '',
    },
  })
  // 恢复默认 baseURL，避免影响后续其他 API 请求
  http.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  return response.data
}

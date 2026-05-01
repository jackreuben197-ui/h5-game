import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  ImossGameClientUploadAudioRequest,
  ImossGameClientUploadAudioResponseData,
  ImossGameClientUploadImageRequest,
  ImossGameClientUploadImageResponseData,
} from '@/api/models/imoss'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))
void formatPath

// 对齐 cocos WebImossGameClientUploadAudio.API
export async function postImossGameClientUploadAudioApi(
  payload: ImossGameClientUploadAudioRequest = {} as ImossGameClientUploadAudioRequest
): Promise<ApiResponse<ImossGameClientUploadAudioResponseData>> {
  const endpoint = '/imoss/game_client/upload/audio'
  const response = await http.post<ApiResponse<ImossGameClientUploadAudioResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebImossGameClientUploadImage.API
export async function postImossGameClientUploadImageApi(
  payload: ImossGameClientUploadImageRequest = {} as ImossGameClientUploadImageRequest
): Promise<ApiResponse<ImossGameClientUploadImageResponseData>> {
  const endpoint = '/imoss/game_client/upload/image'
  const response = await http.post<ApiResponse<ImossGameClientUploadImageResponseData>>(endpoint, payload)
  return response.data
}

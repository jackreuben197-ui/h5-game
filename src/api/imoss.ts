import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  ImossGameClientUploadAudioRequest,
  ImossGameClientUploadAudioResponseData,
  ImossGameClientUploadImageRequest,
  ImossGameClientUploadImageResponseData,
} from '@/api/models/imoss'

export interface ImossUploadRuntimeConfig {
  ossKey?: string
}

// 对齐 cocos WebImossGameClientUploadAudio.API
export async function postImossGameClientUploadAudioApi(
  payload: ImossGameClientUploadAudioRequest = {} as ImossGameClientUploadAudioRequest,
  runtime: ImossUploadRuntimeConfig = {},
): Promise<ApiResponse<ImossGameClientUploadAudioResponseData>> {
  const endpoint = '/imoss/game_client/upload/audio'

  const response = await http.post<ApiResponse<ImossGameClientUploadAudioResponseData>>(endpoint, payload, {
    headers: {
      'Osskey': runtime.ossKey || '',
    },
  })
  return response.data
}

// 对齐 cocos WebImossGameClientUploadImage.API
export async function postImossGameClientUploadImageApi(
  payload: ImossGameClientUploadImageRequest = {} as ImossGameClientUploadImageRequest,
  runtime: ImossUploadRuntimeConfig = {},
): Promise<ApiResponse<ImossGameClientUploadImageResponseData>> {
  const endpoint = '/imoss/game_client/upload/image'

  const response = await http.post<ApiResponse<ImossGameClientUploadImageResponseData>>(endpoint, payload, {
    headers: {
      'Osskey': runtime.ossKey || '',
    },
  })
  return response.data
}

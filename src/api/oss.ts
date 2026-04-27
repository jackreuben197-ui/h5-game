import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  OrgClubUploadIconRequest,
  OrgClubUploadIconResponseData,
  OssUploadAudioRequest,
  OssUploadAudioResponseData,
  OssUploadChatAudioRequest,
  OssUploadChatAudioResponseData,
  OssUploadImageRequest,
  OssUploadImageResponseData,
  OssUploadLogRequest,
  OssUploadLogResponseData,
} from '@/api/models/oss'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? "")))
void formatPath

// 对齐 cocos WebOssUploadAudio.API
export async function postOssUploadAudioApi(
  payload: OssUploadAudioRequest = {} as OssUploadAudioRequest
): Promise<ApiResponse<OssUploadAudioResponseData>> {
  const endpoint = '/oss/upload/audio'
  const response = await http.post<ApiResponse<OssUploadAudioResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubUploadIcon.API
export async function postOrgClubUploadIconApi(
  payload: OrgClubUploadIconRequest = {} as OrgClubUploadIconRequest
): Promise<ApiResponse<OrgClubUploadIconResponseData>> {
  const endpoint = '/oss/upload/avatar'
  const response = await http.post<ApiResponse<OrgClubUploadIconResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOssUploadChatAudio.API
export async function postOssUploadChatAudioApi(
  payload: OssUploadChatAudioRequest = {} as OssUploadChatAudioRequest
): Promise<ApiResponse<OssUploadChatAudioResponseData>> {
  const endpoint = '/oss/upload/chat_audio'
  const response = await http.post<ApiResponse<OssUploadChatAudioResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOssUploadImage.API
export async function postOssUploadImageApi(
  payload: OssUploadImageRequest = {} as OssUploadImageRequest
): Promise<ApiResponse<OssUploadImageResponseData>> {
  const endpoint = '/oss/upload/image'
  const response = await http.post<ApiResponse<OssUploadImageResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOssUploadLog.API
export async function postOssUploadLogApi(
  payload: OssUploadLogRequest = {} as OssUploadLogRequest
): Promise<ApiResponse<OssUploadLogResponseData>> {
  const endpoint = '/oss/upload/log'
  const response = await http.post<ApiResponse<OssUploadLogResponseData>>(endpoint, payload)
  return response.data
}

import type { AxiosRequestConfig } from 'axios'
import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  ChatMessageReportRequest,
  ChatMessageReportResponseData,
  ChatRoomMessageSyncRequest,
  ChatRoomMessageSyncResponseData,
  ChatSupportChannelListRequest,
  ChatSupportChannelListResponseData,
  ChatSupportMessageListRequest,
  ChatSupportMessageListResponseData,
  ChatSupportMessageReadRequest,
  ChatSupportMessageReadResponseData,
  ChatSupportMessageSendRequest,
  ChatSupportMessageSendResponseData,
  DelmsgTemplateRequest,
  DelmsgTemplateResponseData,
  GetmsgListRequest,
  GetmsgListResponseData,
  OrgSendMessRequest,
  OrgSendMessResponseData,
  OrggetMessListRequest,
  OrggetMessListResponseData,
  OrggetNewMessNumRequest,
  OrggetNewMessNumResponseData,
  SendMsgRequest,
  SendMsgResponseData,
  SetmsgTemplateRequest,
  SetmsgTemplateResponseData,
} from '@/api/models/chat'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))
void formatPath

// 对齐 cocos WebDelmsgTemplate.API
export async function postDelmsgTemplateApi(
  payload: DelmsgTemplateRequest = {} as DelmsgTemplateRequest
): Promise<ApiResponse<DelmsgTemplateResponseData>> {
  const endpoint = '/chat/club/inform/template/del'
  const response = await http.post<ApiResponse<DelmsgTemplateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebGetmsgList.API
export async function postGetmsgListApi(
  payload: GetmsgListRequest = {} as GetmsgListRequest
): Promise<ApiResponse<GetmsgListResponseData>> {
  const endpoint = '/chat/club/inform/template/list'
  const response = await http.post<ApiResponse<GetmsgListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebSetmsgTemplate.API
export async function postSetmsgTemplateApi(
  payload: SetmsgTemplateRequest = {} as SetmsgTemplateRequest
): Promise<ApiResponse<SetmsgTemplateResponseData>> {
  const endpoint = '/chat/club/inform/template/set'
  const response = await http.post<ApiResponse<SetmsgTemplateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrggetMessList.API
export async function postOrggetMessListApi(
  payload: OrggetMessListRequest = {} as OrggetMessListRequest
): Promise<ApiResponse<OrggetMessListResponseData>> {
  const endpoint = '/chat/club/messages'
  const response = await http.post<ApiResponse<OrggetMessListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrggetNewMessNum.API
export async function postOrggetNewMessNumApi(
  payload: OrggetNewMessNumRequest = {} as OrggetNewMessNumRequest
): Promise<ApiResponse<OrggetNewMessNumResponseData>> {
  const endpoint = '/chat/club/messages/new_count'
  const response = await http.post<ApiResponse<OrggetNewMessNumResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebSendMsg.API
export async function postSendMsgApi(
  payload: SendMsgRequest = {} as SendMsgRequest
): Promise<ApiResponse<SendMsgResponseData>> {
  const endpoint = '/chat/club/send_messages'
  const response = await http.post<ApiResponse<SendMsgResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgSendMess.API
export async function postOrgSendMessApi(
  payload: OrgSendMessRequest = {} as OrgSendMessRequest
): Promise<ApiResponse<OrgSendMessResponseData>> {
  const endpoint = '/chat/club/send_messages'
  const response = await http.post<ApiResponse<OrgSendMessResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebChatMessageReport.API
export async function postChatMessageReportApi(
  payload: ChatMessageReportRequest = {} as ChatMessageReportRequest
): Promise<ApiResponse<ChatMessageReportResponseData>> {
  const endpoint = '/chat/message/report'
  const response = await http.post<ApiResponse<ChatMessageReportResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebChatRoomMessageSync.API
export async function postChatRoomMessageSyncApi(
  payload: ChatRoomMessageSyncRequest = {} as ChatRoomMessageSyncRequest
): Promise<ApiResponse<ChatRoomMessageSyncResponseData>> {
  const endpoint = '/chat/room/message/sync'
  const response = await http.post<ApiResponse<ChatRoomMessageSyncResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebChatSupportChannelList.API
export async function postChatSupportChannelListApi(
  payload: ChatSupportChannelListRequest = {} as ChatSupportChannelListRequest,
  options: AxiosRequestConfig & { suppressBusinessToast?: boolean } = {},
): Promise<ApiResponse<ChatSupportChannelListResponseData>> {
  const endpoint = '/chat/support/channel/list'
  const response = await http.post<ApiResponse<ChatSupportChannelListResponseData>>(
    endpoint,
    payload,
    options,
  )
  return response.data
}

// 对齐 cocos WebChatSupportMessageList.API
export async function postChatSupportMessageListApi(
  payload: ChatSupportMessageListRequest = {} as ChatSupportMessageListRequest
): Promise<ApiResponse<ChatSupportMessageListResponseData>> {
  const endpoint = '/chat/support/message/list'
  const response = await http.post<ApiResponse<ChatSupportMessageListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebChatSupportMessageRead.API
export async function postChatSupportMessageReadApi(
  payload: ChatSupportMessageReadRequest = {} as ChatSupportMessageReadRequest
): Promise<ApiResponse<ChatSupportMessageReadResponseData>> {
  const endpoint = '/chat/support/message/read'
  const response = await http.post<ApiResponse<ChatSupportMessageReadResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebChatSupportMessageSend.API
export async function postChatSupportMessageSendApi(
  payload: ChatSupportMessageSendRequest = {} as ChatSupportMessageSendRequest
): Promise<ApiResponse<ChatSupportMessageSendResponseData>> {
  const endpoint = '/chat/support/message/send'
  const response = await http.post<ApiResponse<ChatSupportMessageSendResponseData>>(endpoint, payload)
  return response.data
}

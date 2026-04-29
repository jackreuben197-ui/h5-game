import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  MessageRednumRequest,
  MessageRednumResponseData,
  MsgMessageListRequest,
  MsgMessageListResponseData,
  MsgMessageReadRequest,
  MsgMessageReadResponseData,
  MsgMessageSystemBroadcastNumRequest,
  MsgMessageSystemBroadcastNumResponseData,
  MsgMessageTodoAllInfoRequest,
  MsgMessageTodoAllInfoResponseData,
  MsgMessageTodoRequest,
  MsgMessageTodoResponseData,
  MsgMessageUnreadClearRequest,
  MsgMessageUnreadClearResponseData,
  MsgMessageUnreadRequest,
  MsgMessageUnreadResponseData,
} from '@/api/models/msg'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))
void formatPath

// 对齐 cocos WebMsgMessageUnreadClear.API
export async function postMsgMessageUnreadClearApi(
  payload: MsgMessageUnreadClearRequest = {} as MsgMessageUnreadClearRequest
): Promise<ApiResponse<MsgMessageUnreadClearResponseData>> {
  const endpoint = '/msg/message/clear_unread'
  const response = await http.post<ApiResponse<MsgMessageUnreadClearResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMsgMessageList.API
export async function postMsgMessageListApi(
  payload: MsgMessageListRequest = {} as MsgMessageListRequest
): Promise<ApiResponse<MsgMessageListResponseData>> {
  const endpoint = '/msg/message/list'
  const response = await http.post<ApiResponse<MsgMessageListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMsgMessageRead.API
export async function postMsgMessageReadApi(
  payload: MsgMessageReadRequest = {} as MsgMessageReadRequest
): Promise<ApiResponse<MsgMessageReadResponseData>> {
  const endpoint = '/msg/message/read'
  const response = await http.post<ApiResponse<MsgMessageReadResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMessageRednum.API
export async function postMessageRednumApi(
  payload: MessageRednumRequest = {} as MessageRednumRequest
): Promise<ApiResponse<MessageRednumResponseData>> {
  const endpoint = '/msg/message/red_num'
  const response = await http.post<ApiResponse<MessageRednumResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMsgMessageSystemBroadcastNum.API
export async function postMsgMessageSystemBroadcastNumApi(
  payload: MsgMessageSystemBroadcastNumRequest = {} as MsgMessageSystemBroadcastNumRequest
): Promise<ApiResponse<MsgMessageSystemBroadcastNumResponseData>> {
  const endpoint = '/msg/message/system/broadcast/num'
  const response = await http.post<ApiResponse<MsgMessageSystemBroadcastNumResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMsgMessageTodo.API
export async function postMsgMessageTodoApi(
  payload: MsgMessageTodoRequest = {} as MsgMessageTodoRequest
): Promise<ApiResponse<MsgMessageTodoResponseData>> {
  const endpoint = '/msg/message/todo'
  const response = await http.post<ApiResponse<MsgMessageTodoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMsgMessageTodoAllInfo.API
export async function postMsgMessageTodoAllInfoApi(
  payload: MsgMessageTodoAllInfoRequest = {} as MsgMessageTodoAllInfoRequest
): Promise<ApiResponse<MsgMessageTodoAllInfoResponseData>> {
  const endpoint = '/msg/message/todo/all_info'
  const response = await http.post<ApiResponse<MsgMessageTodoAllInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMsgMessageUnread.API
export async function postMsgMessageUnreadApi(
  payload: MsgMessageUnreadRequest = {} as MsgMessageUnreadRequest
): Promise<ApiResponse<MsgMessageUnreadResponseData>> {
  const endpoint = '/msg/message/unread'
  const response = await http.post<ApiResponse<MsgMessageUnreadResponseData>>(endpoint, payload)
  return response.data
}

import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  MiscAgoraTokenRequest,
  MiscAgoraTokenResponseData,
  MiscArtiCleIdRequest,
  MiscArtiCleIdResponseData,
  MiscArtiCleInfoRequest,
  MiscArtiCleInfoResponseData,
  MiscArtiCleListRequest,
  MiscArtiCleListResponseData,
  MiscArtiClePushListRequest,
  MiscArtiClePushListResponseData,
  MiscArtiClenumSetRequest,
  MiscArtiClenumSetResponseData,
  MiscBannerListRequest,
  MiscBannerListResponseData,
  MiscBannerLobbyRequest,
  MiscBannerLobbyResponseData,
  MiscCombineRequest,
  MiscCombineResponseData,
  MiscCurrencyDescriptionInfoRequest,
  MiscCurrencyDescriptionInfoResponseData,
  MiscCurrencyExchAgeRateListRequest,
  MiscCurrencyExchAgeRateListResponseData,
  MiscCurrencyExchAgeRateRequest,
  MiscCurrencyExchAgeRateResponseData,
  MiscFaceDetectRequest,
  MiscFaceDetectResponseData,
  MiscFaceLivenessMultiPhotoRequest,
  MiscFaceLivenessMultiPhotoResponseData,
  MiscFaceRecogCheckRequest,
  MiscFaceRecogCheckResponseData,
  MiscFaceRecogConfirmRequest,
  MiscFaceRecogConfirmResponseData,
  MiscFaceRecogRequest,
  MiscFaceRecogRequestRequest,
  MiscFaceRecogRequestResponseData,
  MiscFaceRecogResponseData,
  MiscFaceRecogResultRequest,
  MiscFaceRecogResultResponseData,
  MiscFaceRecogRoomLastRequest,
  MiscFaceRecogRoomLastResponseData,
  MiscFaceSaveLimitRequest,
  MiscFaceSaveLimitResponseData,
  MiscFaceSaveRequest,
  MiscFaceSaveResponseData,
  MiscFaceSeatCancelRecogRequest,
  MiscFaceSeatCancelRecogResponseData,
  MiscFaceSeatRecogRequest,
  MiscFaceSeatRecogResponseData,
  MiscGameRecordRoundRequest,
  MiscGameRecordRoundResponseData,
  MiscGameRemoveRoundRequest,
  MiscGameRemoveRoundResponseData,
  MiscGameRoundListDataByRoomRequest,
  MiscGameRoundListDataByRoomResponseData,
  MiscGameRoundListRequest,
  MiscGameRoundListResponseData,
  MiscGameRoundStatusRequest,
  MiscGameRoundStatusResponseData,
  MiscPopupNewerRequest,
  MiscPopupNewerResponseData,
  MiscReportFeedbackQuestIonRequest,
  MiscReportFeedbackQuestIonResponseData,
  MiscTranslateRequest,
  MiscTranslateResponseData,
} from '@/api/models/misc'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? "")))
void formatPath

// 对齐 cocos WebMiscAgoraToken.API
export async function postMiscAgoraTokenApi(
  payload: MiscAgoraTokenRequest = {} as MiscAgoraTokenRequest
): Promise<ApiResponse<MiscAgoraTokenResponseData>> {
  const endpoint = '/misc/agora/token'
  const response = await http.post<ApiResponse<MiscAgoraTokenResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscArtiCleId.API
export async function postMiscArtiCleIdApi(
  payload: MiscArtiCleIdRequest = {} as MiscArtiCleIdRequest,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<MiscArtiCleIdResponseData>> {
  const endpoint = formatPath('/misc/article/{id}', pathParams)
  const response = await http.post<ApiResponse<MiscArtiCleIdResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscArtiCleInfo.API
export async function postMiscArtiCleInfoApi(
  payload: MiscArtiCleInfoRequest = {} as MiscArtiCleInfoRequest
): Promise<ApiResponse<MiscArtiCleInfoResponseData>> {
  const endpoint = '/misc/article/info'
  const response = await http.post<ApiResponse<MiscArtiCleInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscArtiCleList.API
export async function postMiscArtiCleListApi(
  payload: MiscArtiCleListRequest = {} as MiscArtiCleListRequest
): Promise<ApiResponse<MiscArtiCleListResponseData>> {
  const endpoint = '/misc/article/list'
  const response = await http.post<ApiResponse<MiscArtiCleListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscArtiClenumSet.API
export async function postMiscArtiClenumSetApi(
  payload: MiscArtiClenumSetRequest = {} as MiscArtiClenumSetRequest
): Promise<ApiResponse<MiscArtiClenumSetResponseData>> {
  const endpoint = '/misc/article/num/set'
  const response = await http.post<ApiResponse<MiscArtiClenumSetResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscArtiClePushList.API
export async function postMiscArtiClePushListApi(
  payload: MiscArtiClePushListRequest = {} as MiscArtiClePushListRequest
): Promise<ApiResponse<MiscArtiClePushListResponseData>> {
  const endpoint = '/misc/article/push/list'
  const response = await http.post<ApiResponse<MiscArtiClePushListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscBannerLobby.API
export async function postMiscBannerLobbyApi(
  payload: MiscBannerLobbyRequest = {} as MiscBannerLobbyRequest
): Promise<ApiResponse<MiscBannerLobbyResponseData>> {
  const endpoint = '/misc/banner_lobby'
  const response = await http.post<ApiResponse<MiscBannerLobbyResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscBannerList.API
export async function postMiscBannerListApi(
  payload: MiscBannerListRequest = {} as MiscBannerListRequest
): Promise<ApiResponse<MiscBannerListResponseData>> {
  const endpoint = '/misc/banner/list'
  const response = await http.post<ApiResponse<MiscBannerListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscCombine.API
export async function postMiscCombineApi(
  payload: MiscCombineRequest = {} as MiscCombineRequest
): Promise<ApiResponse<MiscCombineResponseData>> {
  const endpoint = '/misc/combine'
  const response = await http.post<ApiResponse<MiscCombineResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscCurrencyDescriptionInfo.API
export async function postMiscCurrencyDescriptionInfoApi(
  payload: MiscCurrencyDescriptionInfoRequest = {} as MiscCurrencyDescriptionInfoRequest
): Promise<ApiResponse<MiscCurrencyDescriptionInfoResponseData>> {
  const endpoint = '/misc/currency_description/info'
  const response = await http.post<ApiResponse<MiscCurrencyDescriptionInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscCurrencyExchAgeRate.API
export async function postMiscCurrencyExchAgeRateApi(
  payload: MiscCurrencyExchAgeRateRequest = {} as MiscCurrencyExchAgeRateRequest
): Promise<ApiResponse<MiscCurrencyExchAgeRateResponseData>> {
  const endpoint = '/misc/currency_exchage_rate'
  const response = await http.post<ApiResponse<MiscCurrencyExchAgeRateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscCurrencyExchAgeRateList.API
export async function postMiscCurrencyExchAgeRateListApi(
  payload: MiscCurrencyExchAgeRateListRequest = {} as MiscCurrencyExchAgeRateListRequest
): Promise<ApiResponse<MiscCurrencyExchAgeRateListResponseData>> {
  const endpoint = '/misc/currency_exchage_rate/list'
  const response = await http.post<ApiResponse<MiscCurrencyExchAgeRateListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceDetect.API
export async function postMiscFaceDetectApi(
  payload: MiscFaceDetectRequest = {} as MiscFaceDetectRequest
): Promise<ApiResponse<MiscFaceDetectResponseData>> {
  const endpoint = '/misc/face/detect'
  const response = await http.post<ApiResponse<MiscFaceDetectResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceLivenessMultiPhoto.API
export async function postMiscFaceLivenessMultiPhotoApi(
  payload: MiscFaceLivenessMultiPhotoRequest = {} as MiscFaceLivenessMultiPhotoRequest
): Promise<ApiResponse<MiscFaceLivenessMultiPhotoResponseData>> {
  const endpoint = '/misc/face/liveness/multi_photo'
  const response = await http.post<ApiResponse<MiscFaceLivenessMultiPhotoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceRecog.API
export async function postMiscFaceRecogApi(
  payload: MiscFaceRecogRequest = {} as MiscFaceRecogRequest
): Promise<ApiResponse<MiscFaceRecogResponseData>> {
  const endpoint = '/misc/face/recog'
  const response = await http.post<ApiResponse<MiscFaceRecogResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceRecogCheck.API
export async function postMiscFaceRecogCheckApi(
  payload: MiscFaceRecogCheckRequest = {} as MiscFaceRecogCheckRequest
): Promise<ApiResponse<MiscFaceRecogCheckResponseData>> {
  const endpoint = '/misc/face/recog/check'
  const response = await http.post<ApiResponse<MiscFaceRecogCheckResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceRecogConfirm.API
export async function postMiscFaceRecogConfirmApi(
  payload: MiscFaceRecogConfirmRequest = {} as MiscFaceRecogConfirmRequest
): Promise<ApiResponse<MiscFaceRecogConfirmResponseData>> {
  const endpoint = '/misc/face/recog/confirm'
  const response = await http.post<ApiResponse<MiscFaceRecogConfirmResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceRecogRequest.API
export async function postMiscFaceRecogRequestApi(
  payload: MiscFaceRecogRequestRequest = {} as MiscFaceRecogRequestRequest
): Promise<ApiResponse<MiscFaceRecogRequestResponseData>> {
  const endpoint = '/misc/face/recog/request'
  const response = await http.post<ApiResponse<MiscFaceRecogRequestResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceRecogResult.API
export async function postMiscFaceRecogResultApi(
  payload: MiscFaceRecogResultRequest = {} as MiscFaceRecogResultRequest
): Promise<ApiResponse<MiscFaceRecogResultResponseData>> {
  const endpoint = '/misc/face/recog/result'
  const response = await http.post<ApiResponse<MiscFaceRecogResultResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceRecogRoomLast.API
export async function postMiscFaceRecogRoomLastApi(
  payload: MiscFaceRecogRoomLastRequest = {} as MiscFaceRecogRoomLastRequest
): Promise<ApiResponse<MiscFaceRecogRoomLastResponseData>> {
  const endpoint = '/misc/face/recog/room_last'
  const response = await http.post<ApiResponse<MiscFaceRecogRoomLastResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceSave.API
export async function postMiscFaceSaveApi(
  payload: MiscFaceSaveRequest = {} as MiscFaceSaveRequest
): Promise<ApiResponse<MiscFaceSaveResponseData>> {
  const endpoint = '/misc/face/save'
  const response = await http.post<ApiResponse<MiscFaceSaveResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceSaveLimit.API
export async function postMiscFaceSaveLimitApi(
  payload: MiscFaceSaveLimitRequest = {} as MiscFaceSaveLimitRequest
): Promise<ApiResponse<MiscFaceSaveLimitResponseData>> {
  const endpoint = '/misc/face/save/limit'
  const response = await http.post<ApiResponse<MiscFaceSaveLimitResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceSeatCancelRecog.API
export async function postMiscFaceSeatCancelRecogApi(
  payload: MiscFaceSeatCancelRecogRequest = {} as MiscFaceSeatCancelRecogRequest
): Promise<ApiResponse<MiscFaceSeatCancelRecogResponseData>> {
  const endpoint = '/misc/face/seat_cancel_recog'
  const response = await http.post<ApiResponse<MiscFaceSeatCancelRecogResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscFaceSeatRecog.API
export async function postMiscFaceSeatRecogApi(
  payload: MiscFaceSeatRecogRequest = {} as MiscFaceSeatRecogRequest
): Promise<ApiResponse<MiscFaceSeatRecogResponseData>> {
  const endpoint = '/misc/face/seat_recog'
  const response = await http.post<ApiResponse<MiscFaceSeatRecogResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscGameRoundStatus.API
export async function postMiscGameRoundStatusApi(
  payload: MiscGameRoundStatusRequest = {} as MiscGameRoundStatusRequest
): Promise<ApiResponse<MiscGameRoundStatusResponseData>> {
  const endpoint = '/misc/game/get_round_status'
  const response = await http.post<ApiResponse<MiscGameRoundStatusResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscGameRecordRound.API
export async function postMiscGameRecordRoundApi(
  payload: MiscGameRecordRoundRequest = {} as MiscGameRecordRoundRequest
): Promise<ApiResponse<MiscGameRecordRoundResponseData>> {
  const endpoint = '/misc/game/record_round'
  const response = await http.post<ApiResponse<MiscGameRecordRoundResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscGameRemoveRound.API
export async function postMiscGameRemoveRoundApi(
  payload: MiscGameRemoveRoundRequest = {} as MiscGameRemoveRoundRequest
): Promise<ApiResponse<MiscGameRemoveRoundResponseData>> {
  const endpoint = '/misc/game/remove_round'
  const response = await http.post<ApiResponse<MiscGameRemoveRoundResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscGameRoundList.API
export async function postMiscGameRoundListApi(
  payload: MiscGameRoundListRequest = {} as MiscGameRoundListRequest
): Promise<ApiResponse<MiscGameRoundListResponseData>> {
  const endpoint = '/misc/game/round/list'
  const response = await http.post<ApiResponse<MiscGameRoundListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscGameRoundListDataByRoom.API
export async function postMiscGameRoundListDataByRoomApi(
  payload: MiscGameRoundListDataByRoomRequest = {} as MiscGameRoundListDataByRoomRequest
): Promise<ApiResponse<MiscGameRoundListDataByRoomResponseData>> {
  const endpoint = '/misc/game/round/list/data_by_room'
  const response = await http.post<ApiResponse<MiscGameRoundListDataByRoomResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscPopupNewer.API
export async function postMiscPopupNewerApi(
  payload: MiscPopupNewerRequest = {} as MiscPopupNewerRequest
): Promise<ApiResponse<MiscPopupNewerResponseData>> {
  const endpoint = '/misc/popup/newer'
  const response = await http.post<ApiResponse<MiscPopupNewerResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscReportFeedbackQuestIon.API
export async function postMiscReportFeedbackQuestIonApi(
  payload: MiscReportFeedbackQuestIonRequest = {} as MiscReportFeedbackQuestIonRequest
): Promise<ApiResponse<MiscReportFeedbackQuestIonResponseData>> {
  const endpoint = '/misc/report/feedback_question'
  const response = await http.post<ApiResponse<MiscReportFeedbackQuestIonResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMiscTranslate.API
export async function postMiscTranslateApi(
  payload: MiscTranslateRequest = {} as MiscTranslateRequest
): Promise<ApiResponse<MiscTranslateResponseData>> {
  const endpoint = '/misc/translate'
  const response = await http.post<ApiResponse<MiscTranslateResponseData>>(endpoint, payload)
  return response.data
}

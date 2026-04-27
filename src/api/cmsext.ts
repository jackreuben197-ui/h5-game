import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  CmsExtActivityClubAddRequest,
  CmsExtActivityClubAddResponseData,
  CmsExtActivityClubAdminListRequest,
  CmsExtActivityClubAdminListResponseData,
  CmsExtActivityClubMyListRequest,
  CmsExtActivityClubMyListResponseData,
  CmsExtClubShare0ListRequest,
  CmsExtClubShare0ListResponseData,
  CmsExtHotUpdateTemplateListRequest,
  CmsExtHotUpdateTemplateListResponseData,
  CmsExtImServiceLinkRequest,
  CmsExtImServiceLinkResponseData,
  CmsExtImServiceListRequest,
  CmsExtImServiceListResponseData,
  CmsExtMiniGameClubConfigCreateRequest,
  CmsExtMiniGameClubConfigCreateResponseData,
  CmsExtMiniGameConfigCreateRequest,
  CmsExtMiniGameConfigCreateResponseData,
  CmsExtMiniGameTribeConfigCreateRequest,
  CmsExtMiniGameTribeConfigCreateResponseData,
  CmsExtMttConfigCreateRequest,
  CmsExtMttConfigCreateResponseData,
  CmsExtMttCreateRequest,
  CmsExtMttCreateResponseData,
  CmsExtMttTemplateCreateRequest,
  CmsExtMttTemplateCreateResponseData,
  CmsExtMttTemplateDeleteIdRequest,
  CmsExtMttTemplateDeleteIdResponseData,
  CmsExtMttTemplateListRequest,
  CmsExtMttTemplateListResponseData,
  CmsExtMttTemplateUpdateRequest,
  CmsExtMttTemplateUpdateResponseData,
  CmsExtMttTemplateWeekSwitchUpdateRequest,
  CmsExtMttTemplateWeekSwitchUpdateResponseData,
  CmsExtRoomSmallBlindAnteRequest,
  CmsExtRoomSmallBlindAnteResponseData,
  CmsExtRoomTemplate0Request,
  CmsExtRoomTemplate0ResponseData,
  CmsExtRoomTemplateStatusRequest,
  CmsExtRoomTemplateStatusResponseData,
  CmsExtRoomTribeConfigCreateRequest,
  CmsExtRoomTribeConfigCreateResponseData,
  CmsExtRoomUserBatchCreateRequest,
  CmsExtRoomUserBatchCreateResponseData,
  CmsExtRoomUserTemplateListRequest,
  CmsExtRoomUserTemplateListResponseData,
  CmsExtSngClubConfigCreateRequest,
  CmsExtSngClubConfigCreateResponseData,
  CmsExtSngConfigCreateRequest,
  CmsExtSngConfigCreateResponseData,
  CmsExtSngTribeConfigCreateRequest,
  CmsExtSngTribeConfigCreateResponseData,
  CmsExtUserComplaIntReportRequest,
  CmsExtUserComplaIntReportResponseData,
  CmsExtWheelTemplateListRequest,
  CmsExtWheelTemplateListResponseData,
  MttUserWalletRequest,
  MttUserWalletResponseData,
  OrgClubActivityCreateRequest,
  OrgClubActivityCreateResponseData,
  OrgClubActivityInfoRequest,
  OrgClubActivityInfoResponseData,
  OrgClubNoticeGetRequest,
  OrgClubNoticeGetResponseData,
  OrgClubNoticeIgnoreRequest,
  OrgClubNoticeIgnoreResponseData,
  OrgClubNoticeRequest,
  OrgClubNoticeResponseData,
  OrgClubNoticeUpdateRequest,
  OrgClubNoticeUpdateResponseData,
  OrgClubShareApplyListRequest,
  OrgClubShareApplyListResponseData,
  OrgClubShareApproveListRequest,
  OrgClubShareApproveListResponseData,
  OrgClubShareAuditRequest,
  OrgClubShareAuditResponseData,
  OrgClubSharePendingListRequest,
  OrgClubSharePendingListResponseData,
  OrgCreateTemplateRequest,
  OrgCreateTemplateResponseData,
  OrgRoomBatchCreateRequest,
  OrgRoomBatchCreateResponseData,
  OrgRoomClubCreateRequest,
  OrgRoomClubCreateResponseData,
  OrgRoomConfigCreateRequest,
  OrgRoomConfigCreateResponseData,
  OrgRoomCreateRequest,
  OrgRoomCreateResponseData,
  OrgTemplateDeleteRequest,
  OrgTemplateDeleteResponseData,
  OrgUpdateTemplateRequest,
  OrgUpdateTemplateResponseData,
  OrggetRoomConfigRequest,
  OrggetRoomConfigResponseData,
  OrggetTemplateRequest,
  OrggetTemplateResponseData,
  TicketCreateRequest,
  TicketCreateResponseData,
} from '@/api/models/cmsext'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? "")))
void formatPath

// 对齐 cocos WebCmsExtActivityClubAdd.API
export async function postCmsExtActivityClubAddApi(
  payload: CmsExtActivityClubAddRequest = {} as CmsExtActivityClubAddRequest
): Promise<ApiResponse<CmsExtActivityClubAddResponseData>> {
  const endpoint = '/cmsext/activity/club/add'
  const response = await http.post<ApiResponse<CmsExtActivityClubAddResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtActivityClubAdminList.API
export async function postCmsExtActivityClubAdminListApi(
  payload: CmsExtActivityClubAdminListRequest = {} as CmsExtActivityClubAdminListRequest
): Promise<ApiResponse<CmsExtActivityClubAdminListResponseData>> {
  const endpoint = '/cmsext/activity/club/admin_list'
  const response = await http.post<ApiResponse<CmsExtActivityClubAdminListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubActivityInfo.API
export async function postOrgClubActivityInfoApi(
  payload: OrgClubActivityInfoRequest = {} as OrgClubActivityInfoRequest
): Promise<ApiResponse<OrgClubActivityInfoResponseData>> {
  const endpoint = '/cmsext/activity/club/info'
  const response = await http.post<ApiResponse<OrgClubActivityInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtActivityClubMyList.API
export async function postCmsExtActivityClubMyListApi(
  payload: CmsExtActivityClubMyListRequest = {} as CmsExtActivityClubMyListRequest
): Promise<ApiResponse<CmsExtActivityClubMyListResponseData>> {
  const endpoint = '/cmsext/activity/club/my_list'
  const response = await http.post<ApiResponse<CmsExtActivityClubMyListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubActivityCreate.API
export async function postOrgClubActivityCreateApi(
  payload: OrgClubActivityCreateRequest = {} as OrgClubActivityCreateRequest
): Promise<ApiResponse<OrgClubActivityCreateResponseData>> {
  const endpoint = '/cmsext/activity/club/update'
  const response = await http.post<ApiResponse<OrgClubActivityCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubNotice.API
export async function postOrgClubNoticeApi(
  payload: OrgClubNoticeRequest = {} as OrgClubNoticeRequest
): Promise<ApiResponse<OrgClubNoticeResponseData>> {
  const endpoint = '/cmsext/club/notice'
  const response = await http.post<ApiResponse<OrgClubNoticeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubNoticeGet.API
export async function postOrgClubNoticeGetApi(
  payload: OrgClubNoticeGetRequest = {} as OrgClubNoticeGetRequest
): Promise<ApiResponse<OrgClubNoticeGetResponseData>> {
  const endpoint = '/cmsext/club/notice_get'
  const response = await http.post<ApiResponse<OrgClubNoticeGetResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubNoticeUpdate.API
export async function postOrgClubNoticeUpdateApi(
  payload: OrgClubNoticeUpdateRequest = {} as OrgClubNoticeUpdateRequest
): Promise<ApiResponse<OrgClubNoticeUpdateResponseData>> {
  const endpoint = '/cmsext/club/notice_update'
  const response = await http.post<ApiResponse<OrgClubNoticeUpdateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtClubShare0List.API
export async function postCmsExtClubShare0ListApi(
  payload: CmsExtClubShare0ListRequest = {} as CmsExtClubShare0ListRequest,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<CmsExtClubShare0ListResponseData>> {
  const endpoint = formatPath('/cmsext/club/share/{0}/list', pathParams)
  const response = await http.post<ApiResponse<CmsExtClubShare0ListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubShareApplyList.API
export async function postOrgClubShareApplyListApi(
  payload: OrgClubShareApplyListRequest = {} as OrgClubShareApplyListRequest
): Promise<ApiResponse<OrgClubShareApplyListResponseData>> {
  const endpoint = '/cmsext/club/share/apply/list'
  const response = await http.post<ApiResponse<OrgClubShareApplyListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubShareApproveList.API
export async function postOrgClubShareApproveListApi(
  payload: OrgClubShareApproveListRequest = {} as OrgClubShareApproveListRequest
): Promise<ApiResponse<OrgClubShareApproveListResponseData>> {
  const endpoint = '/cmsext/club/share/approve/list'
  const response = await http.post<ApiResponse<OrgClubShareApproveListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMttUserWallet.API
export async function postMttUserWalletApi(
  payload: MttUserWalletRequest = {} as MttUserWalletRequest
): Promise<ApiResponse<MttUserWalletResponseData>> {
  const endpoint = '/cmsext/club/share/approve/list'
  const response = await http.post<ApiResponse<MttUserWalletResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubShareAudit.API
export async function postOrgClubShareAuditApi(
  payload: OrgClubShareAuditRequest = {} as OrgClubShareAuditRequest
): Promise<ApiResponse<OrgClubShareAuditResponseData>> {
  const endpoint = '/cmsext/club/share/audit'
  const response = await http.post<ApiResponse<OrgClubShareAuditResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubSharePendingList.API
export async function postOrgClubSharePendingListApi(
  payload: OrgClubSharePendingListRequest = {} as OrgClubSharePendingListRequest
): Promise<ApiResponse<OrgClubSharePendingListResponseData>> {
  const endpoint = '/cmsext/club/share/pending/list'
  const response = await http.post<ApiResponse<OrgClubSharePendingListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubNoticeIgnore.API
export async function postOrgClubNoticeIgnoreApi(
  payload: OrgClubNoticeIgnoreRequest = {} as OrgClubNoticeIgnoreRequest
): Promise<ApiResponse<OrgClubNoticeIgnoreResponseData>> {
  const endpoint = '/cmsext/club/user/notice_ignore'
  const response = await http.post<ApiResponse<OrgClubNoticeIgnoreResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebTicketCreate.API
export async function postTicketCreateApi(
  payload: TicketCreateRequest = {} as TicketCreateRequest
): Promise<ApiResponse<TicketCreateResponseData>> {
  const endpoint = '/cmsext/exchange/ticket/create'
  const response = await http.post<ApiResponse<TicketCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtHotUpdateTemplateList.API
export async function postCmsExtHotUpdateTemplateListApi(
  payload: CmsExtHotUpdateTemplateListRequest = {} as CmsExtHotUpdateTemplateListRequest
): Promise<ApiResponse<CmsExtHotUpdateTemplateListResponseData>> {
  const endpoint = '/cmsext/hot_update/template/list'
  const response = await http.post<ApiResponse<CmsExtHotUpdateTemplateListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtImServiceLink.API
export async function postCmsExtImServiceLinkApi(
  payload: CmsExtImServiceLinkRequest = {} as CmsExtImServiceLinkRequest
): Promise<ApiResponse<CmsExtImServiceLinkResponseData>> {
  const endpoint = '/cmsext/im/service/link'
  const response = await http.post<ApiResponse<CmsExtImServiceLinkResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtImServiceList.API
export async function postCmsExtImServiceListApi(
  payload: CmsExtImServiceListRequest = {} as CmsExtImServiceListRequest
): Promise<ApiResponse<CmsExtImServiceListResponseData>> {
  const endpoint = '/cmsext/im/service/list'
  const response = await http.post<ApiResponse<CmsExtImServiceListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMiniGameClubConfigCreate.API
export async function postCmsExtMiniGameClubConfigCreateApi(
  payload: CmsExtMiniGameClubConfigCreateRequest = {} as CmsExtMiniGameClubConfigCreateRequest
): Promise<ApiResponse<CmsExtMiniGameClubConfigCreateResponseData>> {
  const endpoint = '/cmsext/mini_game/club/config/create'
  const response = await http.post<ApiResponse<CmsExtMiniGameClubConfigCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMiniGameConfigCreate.API
export async function postCmsExtMiniGameConfigCreateApi(
  payload: CmsExtMiniGameConfigCreateRequest = {} as CmsExtMiniGameConfigCreateRequest
): Promise<ApiResponse<CmsExtMiniGameConfigCreateResponseData>> {
  const endpoint = '/cmsext/mini_game/config/create'
  const response = await http.post<ApiResponse<CmsExtMiniGameConfigCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMiniGameTribeConfigCreate.API
export async function postCmsExtMiniGameTribeConfigCreateApi(
  payload: CmsExtMiniGameTribeConfigCreateRequest = {} as CmsExtMiniGameTribeConfigCreateRequest
): Promise<ApiResponse<CmsExtMiniGameTribeConfigCreateResponseData>> {
  const endpoint = '/cmsext/mini_game/tribe/config/create'
  const response = await http.post<ApiResponse<CmsExtMiniGameTribeConfigCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMttConfigCreate.API
export async function postCmsExtMttConfigCreateApi(
  payload: CmsExtMttConfigCreateRequest = {} as CmsExtMttConfigCreateRequest
): Promise<ApiResponse<CmsExtMttConfigCreateResponseData>> {
  const endpoint = '/cmsext/mtt/config/create'
  const response = await http.post<ApiResponse<CmsExtMttConfigCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMttCreate.API
export async function postCmsExtMttCreateApi(
  payload: CmsExtMttCreateRequest = {} as CmsExtMttCreateRequest
): Promise<ApiResponse<CmsExtMttCreateResponseData>> {
  const endpoint = '/cmsext/mtt/create'
  const response = await http.post<ApiResponse<CmsExtMttCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMttTemplateCreate.API
export async function postCmsExtMttTemplateCreateApi(
  payload: CmsExtMttTemplateCreateRequest = {} as CmsExtMttTemplateCreateRequest
): Promise<ApiResponse<CmsExtMttTemplateCreateResponseData>> {
  const endpoint = '/cmsext/mtt/template/create'
  const response = await http.post<ApiResponse<CmsExtMttTemplateCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMttTemplateDeleteId.API
export async function postCmsExtMttTemplateDeleteIdApi(
  payload: CmsExtMttTemplateDeleteIdRequest = {} as CmsExtMttTemplateDeleteIdRequest,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<CmsExtMttTemplateDeleteIdResponseData>> {
  const endpoint = formatPath('/cmsext/mtt/template/delete/{id}', pathParams)
  const response = await http.post<ApiResponse<CmsExtMttTemplateDeleteIdResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMttTemplateList.API
export async function postCmsExtMttTemplateListApi(
  payload: CmsExtMttTemplateListRequest = {} as CmsExtMttTemplateListRequest
): Promise<ApiResponse<CmsExtMttTemplateListResponseData>> {
  const endpoint = '/cmsext/mtt/template/list'
  const response = await http.post<ApiResponse<CmsExtMttTemplateListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMttTemplateUpdate.API
export async function postCmsExtMttTemplateUpdateApi(
  payload: CmsExtMttTemplateUpdateRequest = {} as CmsExtMttTemplateUpdateRequest
): Promise<ApiResponse<CmsExtMttTemplateUpdateResponseData>> {
  const endpoint = '/cmsext/mtt/template/update'
  const response = await http.post<ApiResponse<CmsExtMttTemplateUpdateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtMttTemplateWeekSwitchUpdate.API
export async function postCmsExtMttTemplateWeekSwitchUpdateApi(
  payload: CmsExtMttTemplateWeekSwitchUpdateRequest = {} as CmsExtMttTemplateWeekSwitchUpdateRequest
): Promise<ApiResponse<CmsExtMttTemplateWeekSwitchUpdateResponseData>> {
  const endpoint = '/cmsext/mtt/template/week_switch/update'
  const response = await http.post<ApiResponse<CmsExtMttTemplateWeekSwitchUpdateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgRoomBatchCreate.API
export async function postOrgRoomBatchCreateApi(
  payload: OrgRoomBatchCreateRequest = {} as OrgRoomBatchCreateRequest
): Promise<ApiResponse<OrgRoomBatchCreateResponseData>> {
  const endpoint = '/cmsext/room/club/batch/create'
  const response = await http.post<ApiResponse<OrgRoomBatchCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgRoomClubCreate.API
export async function postOrgRoomClubCreateApi(
  payload: OrgRoomClubCreateRequest = {} as OrgRoomClubCreateRequest
): Promise<ApiResponse<OrgRoomClubCreateResponseData>> {
  const endpoint = '/cmsext/room/club/config/create'
  const response = await http.post<ApiResponse<OrgRoomClubCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgRoomConfigCreate.API
export async function postOrgRoomConfigCreateApi(
  payload: OrgRoomConfigCreateRequest = {} as OrgRoomConfigCreateRequest
): Promise<ApiResponse<OrgRoomConfigCreateResponseData>> {
  const endpoint = '/cmsext/room/config/create'
  const response = await http.post<ApiResponse<OrgRoomConfigCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgRoomCreate.API
export async function postOrgRoomCreateApi(
  payload: OrgRoomCreateRequest = {} as OrgRoomCreateRequest
): Promise<ApiResponse<OrgRoomCreateResponseData>> {
  const endpoint = '/cmsext/room/create'
  const response = await http.post<ApiResponse<OrgRoomCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrggetRoomConfig.API
export async function postOrggetRoomConfigApi(
  payload: OrggetRoomConfigRequest = {} as OrggetRoomConfigRequest
): Promise<ApiResponse<OrggetRoomConfigResponseData>> {
  const endpoint = '/cmsext/room/fixed/config'
  const response = await http.post<ApiResponse<OrggetRoomConfigResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtRoomSmallBlindAnte.API
export async function postCmsExtRoomSmallBlindAnteApi(
  payload: CmsExtRoomSmallBlindAnteRequest = {} as CmsExtRoomSmallBlindAnteRequest
): Promise<ApiResponse<CmsExtRoomSmallBlindAnteResponseData>> {
  const endpoint = '/cmsext/room/small_blind/ante'
  const response = await http.post<ApiResponse<CmsExtRoomSmallBlindAnteResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtRoomTemplate0.API
export async function postCmsExtRoomTemplate0Api(
  payload: CmsExtRoomTemplate0Request = {} as CmsExtRoomTemplate0Request,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<CmsExtRoomTemplate0ResponseData>> {
  const endpoint = formatPath('/cmsext/room/template/{0}', pathParams)
  const response = await http.post<ApiResponse<CmsExtRoomTemplate0ResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgCreateTemplate.API
export async function postOrgCreateTemplateApi(
  payload: OrgCreateTemplateRequest = {} as OrgCreateTemplateRequest
): Promise<ApiResponse<OrgCreateTemplateResponseData>> {
  const endpoint = '/cmsext/room/template/create'
  const response = await http.post<ApiResponse<OrgCreateTemplateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTemplateDelete.API
export async function postOrgTemplateDeleteApi(
  payload: OrgTemplateDeleteRequest = {} as OrgTemplateDeleteRequest
): Promise<ApiResponse<OrgTemplateDeleteResponseData>> {
  const endpoint = '/cmsext/room/template/delete'
  const response = await http.post<ApiResponse<OrgTemplateDeleteResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrggetTemplate.API
export async function postOrggetTemplateApi(
  payload: OrggetTemplateRequest = {} as OrggetTemplateRequest
): Promise<ApiResponse<OrggetTemplateResponseData>> {
  const endpoint = '/cmsext/room/template/list'
  const response = await http.post<ApiResponse<OrggetTemplateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtRoomTemplateStatus.API
export async function postCmsExtRoomTemplateStatusApi(
  payload: CmsExtRoomTemplateStatusRequest = {} as CmsExtRoomTemplateStatusRequest
): Promise<ApiResponse<CmsExtRoomTemplateStatusResponseData>> {
  const endpoint = '/cmsext/room/template/status'
  const response = await http.post<ApiResponse<CmsExtRoomTemplateStatusResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUpdateTemplate.API
export async function postOrgUpdateTemplateApi(
  payload: OrgUpdateTemplateRequest = {} as OrgUpdateTemplateRequest
): Promise<ApiResponse<OrgUpdateTemplateResponseData>> {
  const endpoint = '/cmsext/room/template/update'
  const response = await http.post<ApiResponse<OrgUpdateTemplateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtRoomTribeConfigCreate.API
export async function postCmsExtRoomTribeConfigCreateApi(
  payload: CmsExtRoomTribeConfigCreateRequest = {} as CmsExtRoomTribeConfigCreateRequest
): Promise<ApiResponse<CmsExtRoomTribeConfigCreateResponseData>> {
  const endpoint = '/cmsext/room/tribe/config/create'
  const response = await http.post<ApiResponse<CmsExtRoomTribeConfigCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtRoomUserBatchCreate.API
export async function postCmsExtRoomUserBatchCreateApi(
  payload: CmsExtRoomUserBatchCreateRequest = {} as CmsExtRoomUserBatchCreateRequest
): Promise<ApiResponse<CmsExtRoomUserBatchCreateResponseData>> {
  const endpoint = '/cmsext/room/user/batch/create'
  const response = await http.post<ApiResponse<CmsExtRoomUserBatchCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtRoomUserTemplateList.API
export async function postCmsExtRoomUserTemplateListApi(
  payload: CmsExtRoomUserTemplateListRequest = {} as CmsExtRoomUserTemplateListRequest
): Promise<ApiResponse<CmsExtRoomUserTemplateListResponseData>> {
  const endpoint = '/cmsext/room/user/template/list'
  const response = await http.post<ApiResponse<CmsExtRoomUserTemplateListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtSngClubConfigCreate.API
export async function postCmsExtSngClubConfigCreateApi(
  payload: CmsExtSngClubConfigCreateRequest = {} as CmsExtSngClubConfigCreateRequest
): Promise<ApiResponse<CmsExtSngClubConfigCreateResponseData>> {
  const endpoint = '/cmsext/sng/club/config/create'
  const response = await http.post<ApiResponse<CmsExtSngClubConfigCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtSngConfigCreate.API
export async function postCmsExtSngConfigCreateApi(
  payload: CmsExtSngConfigCreateRequest = {} as CmsExtSngConfigCreateRequest
): Promise<ApiResponse<CmsExtSngConfigCreateResponseData>> {
  const endpoint = '/cmsext/sng/config/create'
  const response = await http.post<ApiResponse<CmsExtSngConfigCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtSngTribeConfigCreate.API
export async function postCmsExtSngTribeConfigCreateApi(
  payload: CmsExtSngTribeConfigCreateRequest = {} as CmsExtSngTribeConfigCreateRequest
): Promise<ApiResponse<CmsExtSngTribeConfigCreateResponseData>> {
  const endpoint = '/cmsext/sng/tribe/config/create'
  const response = await http.post<ApiResponse<CmsExtSngTribeConfigCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtUserComplaIntReport.API
export async function postCmsExtUserComplaIntReportApi(
  payload: CmsExtUserComplaIntReportRequest = {} as CmsExtUserComplaIntReportRequest
): Promise<ApiResponse<CmsExtUserComplaIntReportResponseData>> {
  const endpoint = '/cmsext/user/complaint/report'
  const response = await http.post<ApiResponse<CmsExtUserComplaIntReportResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebCmsExtWheelTemplateList.API
export async function postCmsExtWheelTemplateListApi(
  payload: CmsExtWheelTemplateListRequest = {} as CmsExtWheelTemplateListRequest
): Promise<ApiResponse<CmsExtWheelTemplateListResponseData>> {
  const endpoint = '/cmsext/wheel/template/list'
  const response = await http.post<ApiResponse<CmsExtWheelTemplateListResponseData>>(endpoint, payload)
  return response.data
}

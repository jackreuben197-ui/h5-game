import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  APIOrgTribeRoomPermissionsRequest,
  APIOrgTribeRoomPermissionsResponseData,
  APIOrgUserNewLabelReadNumRequest,
  APIOrgUserNewLabelReadNumResponseData,
  APIOrgUserNewLabelReadRequest,
  APIOrgUserNewLabelReadResponseData,
  ClubAgentAddRequest,
  ClubAgentAddResponseData,
  ClubAgentDelRequest,
  ClubAgentDelResponseData,
  ClubAgentListRequest,
  ClubAgentListResponseData,
  ClubAgentUserListCoverRequest,
  ClubAgentUserListCoverResponseData,
  ClubAgentUserListRequest,
  ClubAgentUserListResponseData,
  ClubFundChangeLogRequest,
  ClubFundChangeLogResponseData,
  ClubJoinListRequest,
  ClubJoinListResponseData,
  ClubQuitListRequest,
  ClubQuitListResponseData,
  ClubUserWalletRequest,
  ClubUserWalletResponseData,
  DeleleUserRequest,
  DeleleUserResponseData,
  GuildAdminHasRequest,
  GuildAdminHasResponseData,
  LockUserRequest,
  LockUserResponseData,
  ModifyDigitalWalletAddressRequest,
  ModifyDigitalWalletAddressResponseData,
  OrgClubAddAdminRequest,
  OrgClubAddAdminResponseData,
  OrgClubAdminPermissionSwitchRequest,
  OrgClubAdminPermissionSwitchResponseData,
  OrgClubAgentCreditBalaNceRequest,
  OrgClubAgentCreditBalaNceResponseData,
  OrgClubAgentCreditLimitRequest,
  OrgClubAgentCreditLimitResponseData,
  OrgClubAgentInviTationRequest,
  OrgClubAgentInviTationResponseData,
  OrgClubAgentRatioInfoRequest,
  OrgClubAgentRatioInfoResponseData,
  OrgClubAgentRatioUpdateRequest,
  OrgClubAgentRatioUpdateResponseData,
  OrgClubApplyTribeListRequest,
  OrgClubApplyTribeListResponseData,
  OrgClubApproValJoinRequest,
  OrgClubApproValJoinResponseData,
  OrgClubCancleJoinClubRequest,
  OrgClubCancleJoinClubResponseData,
  OrgClubCancleJoinTribeRequest,
  OrgClubCancleJoinTribeResponseData,
  OrgClubCloneApplyRequest,
  OrgClubCloneApplyResponseData,
  OrgClubClubWalletStatsRequest,
  OrgClubClubWalletStatsResponseData,
  OrgClubCreateIsFirstRequest,
  OrgClubCreateIsFirstResponseData,
  OrgClubCreateRequest,
  OrgClubCreateResponseData,
  OrgClubCreateRoomChangeRequest,
  OrgClubCreateRoomChangeResponseData,
  OrgClubCreditBalaNceRequest,
  OrgClubCreditBalaNceResponseData,
  OrgClubCreditLimitRequest,
  OrgClubCreditLimitResponseData,
  OrgClubCreditLogRequest,
  OrgClubCreditLogResponseData,
  OrgClubDelAdminRequest,
  OrgClubDelAdminResponseData,
  OrgClubDelayRoomAuditSwitchUpdateRequest,
  OrgClubDelayRoomAuditSwitchUpdateResponseData,
  OrgClubDisbAndRequest,
  OrgClubDisbAndResponseData,
  OrgClubGetJoinlListRequest,
  OrgClubGetJoinlListResponseData,
  OrgClubGetRequest,
  OrgClubGetResponseData,
  OrgClubGoldRequest,
  OrgClubGoldResponseData,
  OrgClubIdJoinRequest,
  OrgClubIdJoinResponseData,
  OrgClubIdRequest,
  OrgClubIdResponseData,
  OrgClubInviTationRequest,
  OrgClubInviTationResponseData,
  OrgClubIsMangerRequest,
  OrgClubIsMangerResponseData,
  OrgClubJackpotRechargeRequest,
  OrgClubJackpotRechargeResponseData,
  OrgClubJackpotTemplateCreateRequest,
  OrgClubJackpotTemplateCreateResponseData,
  OrgClubJackpotTemplateDelRequest,
  OrgClubJackpotTemplateDelResponseData,
  OrgClubJackpotTemplateListRequest,
  OrgClubJackpotTemplateListResponseData,
  OrgClubJackpotTemplateUpdateRequest,
  OrgClubJackpotTemplateUpdateResponseData,
  OrgClubJackpotWithdrawRequest,
  OrgClubJackpotWithdrawResponseData,
  OrgClubJoinRequest,
  OrgClubJoinResponseData,
  OrgClubLevelBenefitRequest,
  OrgClubLevelBenefitResponseData,
  OrgClubLevelCostRequest,
  OrgClubLevelCostResponseData,
  OrgClubLevelInfoRequest,
  OrgClubLevelInfoResponseData,
  OrgClubListRequest,
  OrgClubListResponseData,
  OrgClubMasterSlaveClubListRequest,
  OrgClubMasterSlaveClubListResponseData,
  OrgClubMasterSlaveClubRatioRequest,
  OrgClubMasterSlaveClubRatioResponseData,
  OrgClubMasterSlaveClubRemarkRequest,
  OrgClubMasterSlaveClubRemarkResponseData,
  OrgClubMemberRakeBackRequest,
  OrgClubMemberRakeBackResponseData,
  OrgClubMemberRequest,
  OrgClubMemberResponseData,
  OrgClubModifyClubDescRequest,
  OrgClubModifyClubDescResponseData,
  OrgClubMyCreateClubsRequest,
  OrgClubMyCreateClubsResponseData,
  OrgClubPlayerApplyListRequest,
  OrgClubPlayerApplyListResponseData,
  OrgClubQuitRequest,
  OrgClubQuitResponseData,
  OrgClubSearchByIdRequest,
  OrgClubSearchByIdResponseData,
  OrgClubSearchInfoRequest,
  OrgClubSearchInfoResponseData,
  OrgClubSetTimeZoneRequest,
  OrgClubSetTimeZoneResponseData,
  OrgClubSetUserUcadvaNceRequest,
  OrgClubSetUserUcadvaNceResponseData,
  OrgClubSubscrIptionBuyRequest,
  OrgClubSubscrIptionBuyResponseData,
  OrgClubSubscrIptionListRequest,
  OrgClubSubscrIptionListResponseData,
  OrgClubUpLevelRequest,
  OrgClubUpLevelResponseData,
  OrgClubUserInfoRequest,
  OrgClubUserInfoResponseData,
  OrgClubUserPageActiveRequest,
  OrgClubUserPageActiveResponseData,
  OrgClubUserRemaRksRequest,
  OrgClubUserRemaRksResponseData,
  OrgClubUserRoleChangeRequest,
  OrgClubUserRoleChangeResponseData,
  OrgClubUserWalletRelationGrantRequest,
  OrgClubUserWalletRelationGrantResponseData,
  OrgClubUserWalletRelationListRequest,
  OrgClubUserWalletRelationListResponseData,
  OrgJackpotTemplateInfoRequest,
  OrgJackpotTemplateInfoResponseData,
  OrgJoinTripRequest,
  OrgJoinTripResponseData,
  OrgMangerListRequest,
  OrgMangerListResponseData,
  OrgMemberListRequest,
  OrgMemberListResponseData,
  OrgTribeApplyListRequest,
  OrgTribeApplyListResponseData,
  OrgTribeApplyUpgrAdeRequest,
  OrgTribeApplyUpgrAdeResponseData,
  OrgTribeAuditApplyRequest,
  OrgTribeAuditApplyResponseData,
  OrgTribeBlackUserListRequest,
  OrgTribeBlackUserListResponseData,
  OrgTribeCheckUpgrAdeRequest,
  OrgTribeCheckUpgrAdeResponseData,
  OrgTribeClubFundGoldChangeLogRequest,
  OrgTribeClubFundGoldChangeLogResponseData,
  OrgTribeClubKickOutRequest,
  OrgTribeClubKickOutResponseData,
  OrgTribeClubListAllRequest,
  OrgTribeClubListAllResponseData,
  OrgTribeClubListRequest,
  OrgTribeClubListResponseData,
  OrgTribeClubLockRequest,
  OrgTribeClubLockResponseData,
  OrgTribeClubRemarkListRequest,
  OrgTribeClubRemarkListResponseData,
  OrgTribeClubRemarkRequest,
  OrgTribeClubRemarkResponseData,
  OrgTribeClubUnlockRequest,
  OrgTribeClubUnlockResponseData,
  OrgTribeCreateIsFirstRequest,
  OrgTribeCreateIsFirstResponseData,
  OrgTribeCreateRequest,
  OrgTribeCreateResponseData,
  OrgTribeFundGoldChangeLogRequest,
  OrgTribeFundGoldChangeLogResponseData,
  OrgTribeInfoByClubRequest,
  OrgTribeInfoByClubResponseData,
  OrgTribeListRequest,
  OrgTribeListResponseData,
  OrgTribeRoomPermissionSRequest,
  OrgTribeRoomPermissionSResponseData,
  OrgTribeSearchByIdRequest,
  OrgTribeSearchByIdResponseData,
  OrgTribeSetTimeZoneRequest,
  OrgTribeSetTimeZoneResponseData,
  OrgTribeSettIngClubProfitRatioRequest,
  OrgTribeSettIngClubProfitRatioResponseData,
  OrgTribeWalletRequest,
  OrgTribeWalletResponseData,
  OrgUserAdminFavorIteRequest,
  OrgUserAdminFavorIteResponseData,
  OrgUserCheckOrgRequest,
  OrgUserCheckOrgResponseData,
  OrgUserClubAdminListRequest,
  OrgUserClubAdminListResponseData,
  OrgUserNewLabelReadNumRequest,
  OrgUserNewLabelReadNumResponseData,
  OrgUserNewLabelReadRequest,
  OrgUserNewLabelReadResponseData,
  OrgUserSelfProfitBillNotifyConfimRequest,
  OrgUserSelfProfitBillNotifyConfimResponseData,
  OrgUserSelfProfitBillUnnotIfyRequest,
  OrgUserSelfProfitBillUnnotIfyResponseData,
  OrgUserSelfProfitUnpayRecordsRequest,
  OrgUserSelfProfitUnpayRecordsResponseData,
  OrgUserTribeAdminListRequest,
  OrgUserTribeAdminListResponseData,
  OrgChangeClubDataRequest,
  OrgChangeClubDataResponseData,
  UnlockUserRequest,
  UnlockUserResponseData,
} from '@/api/models/org'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))
void formatPath

// 对齐 cocos WebOrgClubId.API
export async function postOrgClubIdApi(
  payload: OrgClubIdRequest = {} as OrgClubIdRequest,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<OrgClubIdResponseData>> {
  const endpoint = formatPath('/org/club/{id}', pathParams)
  const response = await http.post<ApiResponse<OrgClubIdResponseData>>(endpoint, payload, {
    headers: {
      'X-Club': String(pathParams.id ?? ''),
    },
  })
  return response.data
}

// 对齐 cocos WebOrgClubIdJoin.API
export async function postOrgClubIdJoinApi(
  payload: OrgClubIdJoinRequest = {} as OrgClubIdJoinRequest,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<OrgClubIdJoinResponseData>> {
  const endpoint = formatPath('/org/club/{id}/join', pathParams)
  const response = await http.post<ApiResponse<OrgClubIdJoinResponseData>>(endpoint, payload, {
    headers: {
      'X-Club': String(pathParams.id ?? ''),
    },
  })
  return response.data
}

// 对齐 cocos WebOrgClubAddAdmin.API
export async function postOrgClubAddAdminApi(
  payload: OrgClubAddAdminRequest = {} as OrgClubAddAdminRequest
): Promise<ApiResponse<OrgClubAddAdminResponseData>> {
  const endpoint = '/org/club/admin/add_admin'
  const response = await http.post<ApiResponse<OrgClubAddAdminResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubCreateRoomChange.API
export async function postOrgClubCreateRoomChangeApi(
  payload: OrgClubCreateRoomChangeRequest = {} as OrgClubCreateRoomChangeRequest
): Promise<ApiResponse<OrgClubCreateRoomChangeResponseData>> {
  const endpoint = '/org/club/admin/create_room_switch'
  const response = await http.post<ApiResponse<OrgClubCreateRoomChangeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubDelAdmin.API
export async function postOrgClubDelAdminApi(
  payload: OrgClubDelAdminRequest = {} as OrgClubDelAdminRequest
): Promise<ApiResponse<OrgClubDelAdminResponseData>> {
  const endpoint = '/org/club/admin/del_admin'
  const response = await http.post<ApiResponse<OrgClubDelAdminResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebDeleleUser.API
export async function postDeleleUserApi(
  payload: DeleleUserRequest = {} as DeleleUserRequest
): Promise<ApiResponse<DeleleUserResponseData>> {
  const endpoint = '/org/club/admin/delele/user'
  const response = await http.post<ApiResponse<DeleleUserResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubIsManger.API
export async function postOrgClubIsMangerApi(
  payload: OrgClubIsMangerRequest = {} as OrgClubIsMangerRequest
): Promise<ApiResponse<OrgClubIsMangerResponseData>> {
  const endpoint = '/org/club/admin/has'
  const response = await http.post<ApiResponse<OrgClubIsMangerResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgMangerList.API
export async function postOrgMangerListApi(
  payload: OrgMangerListRequest = {} as OrgMangerListRequest
): Promise<ApiResponse<OrgMangerListResponseData>> {
  const endpoint = '/org/club/admin/list'
  const response = await http.post<ApiResponse<OrgMangerListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebLockUser.API
export async function postLockUserApi(
  payload: LockUserRequest = {} as LockUserRequest
): Promise<ApiResponse<LockUserResponseData>> {
  const endpoint = '/org/club/admin/lock/user'
  const response = await http.post<ApiResponse<LockUserResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubAdminPermissionSwitch.API
export async function postOrgClubAdminPermissionSwitchApi(
  payload: OrgClubAdminPermissionSwitchRequest = {} as OrgClubAdminPermissionSwitchRequest
): Promise<ApiResponse<OrgClubAdminPermissionSwitchResponseData>> {
  const endpoint = '/org/club/admin/permission_switch'
  const response = await http.post<ApiResponse<OrgClubAdminPermissionSwitchResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebUnlockUser.API
export async function postUnlockUserApi(
  payload: UnlockUserRequest = {} as UnlockUserRequest
): Promise<ApiResponse<UnlockUserResponseData>> {
  const endpoint = '/org/club/admin/unlock/user'
  const response = await http.post<ApiResponse<UnlockUserResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubAgentCreditBalaNce.API
export async function postOrgClubAgentCreditBalaNceApi(
  payload: OrgClubAgentCreditBalaNceRequest = {} as OrgClubAgentCreditBalaNceRequest
): Promise<ApiResponse<OrgClubAgentCreditBalaNceResponseData>> {
  const endpoint = '/org/club/agent/credit/balance'
  const response = await http.post<ApiResponse<OrgClubAgentCreditBalaNceResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubAgentCreditLimit.API
export async function postOrgClubAgentCreditLimitApi(
  payload: OrgClubAgentCreditLimitRequest = {} as OrgClubAgentCreditLimitRequest
): Promise<ApiResponse<OrgClubAgentCreditLimitResponseData>> {
  const endpoint = '/org/club/agent/credit/limit'
  const response = await http.post<ApiResponse<OrgClubAgentCreditLimitResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubAgentInviTation.API
export async function postOrgClubAgentInviTationApi(
  payload: OrgClubAgentInviTationRequest = {} as OrgClubAgentInviTationRequest
): Promise<ApiResponse<OrgClubAgentInviTationResponseData>> {
  const endpoint = '/org/club/agent/invitation'
  const response = await http.post<ApiResponse<OrgClubAgentInviTationResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubAgentList.API
export async function postClubAgentListApi(
  payload: ClubAgentListRequest = {} as ClubAgentListRequest
): Promise<ApiResponse<ClubAgentListResponseData>> {
  const endpoint = '/org/club/agent/list'
  const response = await http.post<ApiResponse<ClubAgentListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubAgentRatioInfo.API
export async function postOrgClubAgentRatioInfoApi(
  payload: OrgClubAgentRatioInfoRequest = {} as OrgClubAgentRatioInfoRequest
): Promise<ApiResponse<OrgClubAgentRatioInfoResponseData>> {
  const endpoint = '/org/club/agent/ratio/info'
  const response = await http.post<ApiResponse<OrgClubAgentRatioInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubAgentRatioUpdate.API
export async function postOrgClubAgentRatioUpdateApi(
  payload: OrgClubAgentRatioUpdateRequest = {} as OrgClubAgentRatioUpdateRequest
): Promise<ApiResponse<OrgClubAgentRatioUpdateResponseData>> {
  const endpoint = '/org/club/agent/ratio/update'
  const response = await http.post<ApiResponse<OrgClubAgentRatioUpdateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubAgentUserList.API
export async function postClubAgentUserListApi(
  payload: ClubAgentUserListRequest = {} as ClubAgentUserListRequest
): Promise<ApiResponse<ClubAgentUserListResponseData>> {
  const endpoint = '/org/club/agent/user_list'
  const response = await http.post<ApiResponse<ClubAgentUserListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubAgentUserListCover.API
export async function postClubAgentUserListCoverApi(
  payload: ClubAgentUserListCoverRequest = {} as ClubAgentUserListCoverRequest
): Promise<ApiResponse<ClubAgentUserListCoverResponseData>> {
  const endpoint = '/org/club/agent/user_list_cover'
  const response = await http.post<ApiResponse<ClubAgentUserListCoverResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubCloneApply.API
export async function postOrgClubCloneApplyApi(
  payload: OrgClubCloneApplyRequest = {} as OrgClubCloneApplyRequest
): Promise<ApiResponse<OrgClubCloneApplyResponseData>> {
  const endpoint = '/org/club/clone/apply'
  const response = await http.post<ApiResponse<OrgClubCloneApplyResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubUserWallet.API
export async function postClubUserWalletApi(
  payload: ClubUserWalletRequest = {} as ClubUserWalletRequest
): Promise<ApiResponse<ClubUserWalletResponseData>> {
  const endpoint = '/org/club/club_user/wallet'
  const response = await http.post<ApiResponse<ClubUserWalletResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubClubWalletStats.API
export async function postOrgClubClubWalletStatsApi(
  payload: OrgClubClubWalletStatsRequest = {} as OrgClubClubWalletStatsRequest
): Promise<ApiResponse<OrgClubClubWalletStatsResponseData>> {
  const endpoint = '/org/club/club_wallet/stats'
  const response = await http.post<ApiResponse<OrgClubClubWalletStatsResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubCreate.API
export async function postOrgClubCreateApi(
  payload: OrgClubCreateRequest = {} as OrgClubCreateRequest
): Promise<ApiResponse<OrgClubCreateResponseData>> {
  const endpoint = '/org/club/create'
  const response = await http.post<ApiResponse<OrgClubCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubCreateIsFirst.API
export async function postOrgClubCreateIsFirstApi(
  payload: OrgClubCreateIsFirstRequest = {} as OrgClubCreateIsFirstRequest
): Promise<ApiResponse<OrgClubCreateIsFirstResponseData>> {
  const endpoint = '/org/club/create/is_first'
  const response = await http.post<ApiResponse<OrgClubCreateIsFirstResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubCreditBalaNce.API
export async function postOrgClubCreditBalaNceApi(
  payload: OrgClubCreditBalaNceRequest = {} as OrgClubCreditBalaNceRequest
): Promise<ApiResponse<OrgClubCreditBalaNceResponseData>> {
  const endpoint = '/org/club/credit/balance'
  const response = await http.post<ApiResponse<OrgClubCreditBalaNceResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubCreditLimit.API
export async function postOrgClubCreditLimitApi(
  payload: OrgClubCreditLimitRequest = {} as OrgClubCreditLimitRequest
): Promise<ApiResponse<OrgClubCreditLimitResponseData>> {
  const endpoint = '/org/club/credit/limit'
  const response = await http.post<ApiResponse<OrgClubCreditLimitResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubCreditLog.API
export async function postOrgClubCreditLogApi(
  payload: OrgClubCreditLogRequest = {} as OrgClubCreditLogRequest
): Promise<ApiResponse<OrgClubCreditLogResponseData>> {
  const endpoint = '/org/club/credit/log'
  const response = await http.post<ApiResponse<OrgClubCreditLogResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubDelayRoomAuditSwitchUpdate.API
export async function postOrgClubDelayRoomAuditSwitchUpdateApi(
  payload: OrgClubDelayRoomAuditSwitchUpdateRequest = {} as OrgClubDelayRoomAuditSwitchUpdateRequest
): Promise<ApiResponse<OrgClubDelayRoomAuditSwitchUpdateResponseData>> {
  const endpoint = '/org/club/delay_room_audit_switch/update'
  const response = await http.post<ApiResponse<OrgClubDelayRoomAuditSwitchUpdateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubDisbAnd.API
export async function postOrgClubDisbAndApi(
  payload: OrgClubDisbAndRequest = {} as OrgClubDisbAndRequest
): Promise<ApiResponse<OrgClubDisbAndResponseData>> {
  const endpoint = '/org/club/disband'
  const response = await http.post<ApiResponse<OrgClubDisbAndResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubGold.API
export async function postOrgClubGoldApi(
  payload: OrgClubGoldRequest = {} as OrgClubGoldRequest
): Promise<ApiResponse<OrgClubGoldResponseData>> {
  const endpoint = '/org/club/fund/detail'
  const response = await http.post<ApiResponse<OrgClubGoldResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubFundChangeLog.API
export async function postClubFundChangeLogApi(
  payload: ClubFundChangeLogRequest = {} as ClubFundChangeLogRequest
): Promise<ApiResponse<ClubFundChangeLogResponseData>> {
  const endpoint = '/org/club/fund/gold_change/log'
  const response = await http.post<ApiResponse<ClubFundChangeLogResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubSearchById.API
export async function postOrgClubSearchByIdApi(
  payload: OrgClubSearchByIdRequest = {} as OrgClubSearchByIdRequest
): Promise<ApiResponse<OrgClubSearchByIdResponseData>> {
  const endpoint = '/org/club/info'
  const response = await http.post<ApiResponse<OrgClubSearchByIdResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubInviTation.API
export async function postOrgClubInviTationApi(
  payload: OrgClubInviTationRequest = {} as OrgClubInviTationRequest
): Promise<ApiResponse<OrgClubInviTationResponseData>> {
  const endpoint = '/org/club/invitation'
  const response = await http.post<ApiResponse<OrgClubInviTationResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubJackpotRecharge.API
export async function postOrgClubJackpotRechargeApi(
  payload: OrgClubJackpotRechargeRequest = {} as OrgClubJackpotRechargeRequest
): Promise<ApiResponse<OrgClubJackpotRechargeResponseData>> {
  const endpoint = '/org/club/jackpot/recharge'
  const response = await http.post<ApiResponse<OrgClubJackpotRechargeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubJackpotTemplateCreate.API
export async function postOrgClubJackpotTemplateCreateApi(
  payload: OrgClubJackpotTemplateCreateRequest = {} as OrgClubJackpotTemplateCreateRequest
): Promise<ApiResponse<OrgClubJackpotTemplateCreateResponseData>> {
  const endpoint = '/org/club/jackpot/template/create'
  const response = await http.post<ApiResponse<OrgClubJackpotTemplateCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubJackpotTemplateDel.API
export async function postOrgClubJackpotTemplateDelApi(
  payload: OrgClubJackpotTemplateDelRequest = {} as OrgClubJackpotTemplateDelRequest
): Promise<ApiResponse<OrgClubJackpotTemplateDelResponseData>> {
  const endpoint = '/org/club/jackpot/template/del'
  const response = await http.post<ApiResponse<OrgClubJackpotTemplateDelResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubJackpotTemplateList.API
export async function postOrgClubJackpotTemplateListApi(
  payload: OrgClubJackpotTemplateListRequest = {} as OrgClubJackpotTemplateListRequest
): Promise<ApiResponse<OrgClubJackpotTemplateListResponseData>> {
  const endpoint = '/org/club/jackpot/template/list'
  const response = await http.post<ApiResponse<OrgClubJackpotTemplateListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubJackpotTemplateUpdate.API
export async function postOrgClubJackpotTemplateUpdateApi(
  payload: OrgClubJackpotTemplateUpdateRequest = {} as OrgClubJackpotTemplateUpdateRequest
): Promise<ApiResponse<OrgClubJackpotTemplateUpdateResponseData>> {
  const endpoint = '/org/club/jackpot/template/update'
  const response = await http.post<ApiResponse<OrgClubJackpotTemplateUpdateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubJackpotWithdraw.API
export async function postOrgClubJackpotWithdrawApi(
  payload: OrgClubJackpotWithdrawRequest = {} as OrgClubJackpotWithdrawRequest
): Promise<ApiResponse<OrgClubJackpotWithdrawResponseData>> {
  const endpoint = '/org/club/jackpot/withdraw'
  const response = await http.post<ApiResponse<OrgClubJackpotWithdrawResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubGetJoinlList.API
export async function postOrgClubGetJoinlListApi(
  payload: OrgClubGetJoinlListRequest = {} as OrgClubGetJoinlListRequest
): Promise<ApiResponse<OrgClubGetJoinlListResponseData>> {
  const endpoint = '/org/club/join/list'
  const response = await http.post<ApiResponse<OrgClubGetJoinlListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubLevelBenefit.API
export async function postOrgClubLevelBenefitApi(
  payload: OrgClubLevelBenefitRequest = {} as OrgClubLevelBenefitRequest
): Promise<ApiResponse<OrgClubLevelBenefitResponseData>> {
  const endpoint = '/org/club/level_benefit'
  const response = await http.post<ApiResponse<OrgClubLevelBenefitResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubLevelCost.API
export async function postOrgClubLevelCostApi(
  payload: OrgClubLevelCostRequest = {} as OrgClubLevelCostRequest
): Promise<ApiResponse<OrgClubLevelCostResponseData>> {
  const endpoint = '/org/club/level_cost'
  const response = await http.post<ApiResponse<OrgClubLevelCostResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubLevelInfo.API
export async function postOrgClubLevelInfoApi(
  payload: OrgClubLevelInfoRequest = {} as OrgClubLevelInfoRequest
): Promise<ApiResponse<OrgClubLevelInfoResponseData>> {
  const endpoint = '/org/club/level_info'
  const response = await http.post<ApiResponse<OrgClubLevelInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubUpLevel.API
export async function postOrgClubUpLevelApi(
  payload: OrgClubUpLevelRequest = {} as OrgClubUpLevelRequest
): Promise<ApiResponse<OrgClubUpLevelResponseData>> {
  const endpoint = '/org/club/level_up'
  const response = await http.post<ApiResponse<OrgClubUpLevelResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubList.API
export async function postOrgClubListApi(
  payload: OrgClubListRequest = {} as OrgClubListRequest
): Promise<ApiResponse<OrgClubListResponseData>> {
  const endpoint = '/org/club/list'
  const response = await http.post<ApiResponse<OrgClubListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubMasterSlaveClubList.API
export async function postOrgClubMasterSlaveClubListApi(
  payload: OrgClubMasterSlaveClubListRequest = {} as OrgClubMasterSlaveClubListRequest
): Promise<ApiResponse<OrgClubMasterSlaveClubListResponseData>> {
  const endpoint = '/org/club/master/slave_club/list'
  const response = await http.post<ApiResponse<OrgClubMasterSlaveClubListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubMasterSlaveClubRatio.API
export async function postOrgClubMasterSlaveClubRatioApi(
  payload: OrgClubMasterSlaveClubRatioRequest = {} as OrgClubMasterSlaveClubRatioRequest
): Promise<ApiResponse<OrgClubMasterSlaveClubRatioResponseData>> {
  const endpoint = '/org/club/master/slave_club/ratio'
  const response = await http.post<ApiResponse<OrgClubMasterSlaveClubRatioResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubMasterSlaveClubRemark.API
export async function postOrgClubMasterSlaveClubRemarkApi(
  payload: OrgClubMasterSlaveClubRemarkRequest = {} as OrgClubMasterSlaveClubRemarkRequest
): Promise<ApiResponse<OrgClubMasterSlaveClubRemarkResponseData>> {
  const endpoint = '/org/club/master/slave_club/remark'
  const response = await http.post<ApiResponse<OrgClubMasterSlaveClubRemarkResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgMemberList.API
export async function postOrgMemberListApi(
  payload: OrgMemberListRequest = {} as OrgMemberListRequest
): Promise<ApiResponse<OrgMemberListResponseData>> {
  const endpoint = '/org/club/member/list'
  const response = await http.post<ApiResponse<OrgMemberListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubMember.API
export async function postOrgClubMemberApi(
  payload: OrgClubMemberRequest = {} as OrgClubMemberRequest
): Promise<ApiResponse<OrgClubMemberResponseData>> {
  const endpoint = '/org/club/member/ordinary_list'
  const response = await http.post<ApiResponse<OrgClubMemberResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubMemberRakeBack.API
export async function postOrgClubMemberRakeBackApi(
  payload: OrgClubMemberRakeBackRequest = {} as OrgClubMemberRakeBackRequest
): Promise<ApiResponse<OrgClubMemberRakeBackResponseData>> {
  const endpoint = '/org/club/member/rake_back'
  const response = await http.post<ApiResponse<OrgClubMemberRakeBackResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubModifyClubDesc.API
export async function postOrgClubModifyClubDescApi(
  payload: OrgClubModifyClubDescRequest = {} as OrgClubModifyClubDescRequest
): Promise<ApiResponse<OrgClubModifyClubDescResponseData>> {
  const endpoint = '/org/club/modify/club_desc'
  const response = await http.post<ApiResponse<OrgClubModifyClubDescResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgchaNgeClubData.API
export async function postOrgchaNgeClubDataApi(
  payload: OrgChangeClubDataRequest = {} as OrgChangeClubDataRequest
): Promise<ApiResponse<OrgChangeClubDataResponseData>> {
  const endpoint = '/org/club/modify/club_info'
  const response = await http.post<ApiResponse<OrgChangeClubDataResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebModifyDigitalWalletAddress.API
export async function postModifyDigitalWalletAddressApi(
  payload: ModifyDigitalWalletAddressRequest = {} as ModifyDigitalWalletAddressRequest
): Promise<ApiResponse<ModifyDigitalWalletAddressResponseData>> {
  const endpoint = '/org/club/modify/digital_wallet_address'
  const response = await http.post<ApiResponse<ModifyDigitalWalletAddressResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubMyCreateClubs.API
export async function postOrgClubMyCreateClubsApi(
  payload: OrgClubMyCreateClubsRequest = {} as OrgClubMyCreateClubsRequest
): Promise<ApiResponse<OrgClubMyCreateClubsResponseData>> {
  const endpoint = '/org/club/my_create_clubs'
  const response = await http.post<ApiResponse<OrgClubMyCreateClubsResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubUserRoleChange.API
export async function postOrgClubUserRoleChangeApi(
  payload: OrgClubUserRoleChangeRequest = {} as OrgClubUserRoleChangeRequest
): Promise<ApiResponse<OrgClubUserRoleChangeResponseData>> {
  const endpoint = '/org/club/role_change'
  const response = await http.post<ApiResponse<OrgClubUserRoleChangeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubSearchInfo.API
export async function postOrgClubSearchInfoApi(
  payload: OrgClubSearchInfoRequest = {} as OrgClubSearchInfoRequest
): Promise<ApiResponse<OrgClubSearchInfoResponseData>> {
  const endpoint = '/org/club/search_info'
  const response = await http.post<ApiResponse<OrgClubSearchInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubSetTimeZone.API
export async function postOrgClubSetTimeZoneApi(
  payload: OrgClubSetTimeZoneRequest = {} as OrgClubSetTimeZoneRequest
): Promise<ApiResponse<OrgClubSetTimeZoneResponseData>> {
  const endpoint = '/org/club/set/time_zone'
  const response = await http.post<ApiResponse<OrgClubSetTimeZoneResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubSetUserUcadvaNce.API
export async function postOrgClubSetUserUcadvaNceApi(
  payload: OrgClubSetUserUcadvaNceRequest = {} as OrgClubSetUserUcadvaNceRequest
): Promise<ApiResponse<OrgClubSetUserUcadvaNceResponseData>> {
  const endpoint = '/org/club/set/user/uc_advance'
  const response = await http.post<ApiResponse<OrgClubSetUserUcadvaNceResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubSubscrIptionBuy.API
export async function postOrgClubSubscrIptionBuyApi(
  payload: OrgClubSubscrIptionBuyRequest = {} as OrgClubSubscrIptionBuyRequest
): Promise<ApiResponse<OrgClubSubscrIptionBuyResponseData>> {
  const endpoint = '/org/club/subscription/buy'
  const response = await http.post<ApiResponse<OrgClubSubscrIptionBuyResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubSubscrIptionList.API
export async function postOrgClubSubscrIptionListApi(
  payload: OrgClubSubscrIptionListRequest = {} as OrgClubSubscrIptionListRequest
): Promise<ApiResponse<OrgClubSubscrIptionListResponseData>> {
  const endpoint = '/org/club/subscription/list'
  const response = await http.post<ApiResponse<OrgClubSubscrIptionListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubGet.API
export async function postOrgClubGetApi(
  payload: OrgClubGetRequest = {} as OrgClubGetRequest
): Promise<ApiResponse<OrgClubGetResponseData>> {
  const endpoint = '/org/club/user_club'
  const response = await http.post<ApiResponse<OrgClubGetResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubAgentAdd.API
export async function postClubAgentAddApi(
  payload: ClubAgentAddRequest = {} as ClubAgentAddRequest
): Promise<ApiResponse<ClubAgentAddResponseData>> {
  const endpoint = '/org/club/user/add_agent'
  const response = await http.post<ApiResponse<ClubAgentAddResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebGuildAdminHas.API
export async function postGuildAdminHasApi(
  payload: GuildAdminHasRequest = {} as GuildAdminHasRequest
): Promise<ApiResponse<GuildAdminHasResponseData>> {
  const endpoint = '/org/club/user/admin/has'
  const response = await http.post<ApiResponse<GuildAdminHasResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubAgentDel.API
export async function postClubAgentDelApi(
  payload: ClubAgentDelRequest = {} as ClubAgentDelRequest
): Promise<ApiResponse<ClubAgentDelResponseData>> {
  const endpoint = '/org/club/user/del_agent'
  const response = await http.post<ApiResponse<ClubAgentDelResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubUserInfo.API
export async function postOrgClubUserInfoApi(
  payload: OrgClubUserInfoRequest = {} as OrgClubUserInfoRequest
): Promise<ApiResponse<OrgClubUserInfoResponseData>> {
  const endpoint = '/org/club/user/info'
  const response = await http.post<ApiResponse<OrgClubUserInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubJoin.API
export async function postOrgClubJoinApi(
  payload: OrgClubJoinRequest = {} as OrgClubJoinRequest
): Promise<ApiResponse<OrgClubJoinResponseData>> {
  const endpoint = '/org/club/user/join/apply'
  const response = await http.post<ApiResponse<OrgClubJoinResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubApproValJoin.API
export async function postOrgClubApproValJoinApi(
  payload: OrgClubApproValJoinRequest = {} as OrgClubApproValJoinRequest
): Promise<ApiResponse<OrgClubApproValJoinResponseData>> {
  const endpoint = '/org/club/user/join/audit'
  const response = await http.post<ApiResponse<OrgClubApproValJoinResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubCancleJoinClub.API
export async function postOrgClubCancleJoinClubApi(
  payload: OrgClubCancleJoinClubRequest = {} as OrgClubCancleJoinClubRequest
): Promise<ApiResponse<OrgClubCancleJoinClubResponseData>> {
  const endpoint = '/org/club/user/join/cancel'
  const response = await http.post<ApiResponse<OrgClubCancleJoinClubResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubPlayerApplyList.API
export async function postOrgClubPlayerApplyListApi(
  payload: OrgClubPlayerApplyListRequest = {} as OrgClubPlayerApplyListRequest
): Promise<ApiResponse<OrgClubPlayerApplyListResponseData>> {
  const endpoint = '/org/club/user/join/list'
  const response = await http.post<ApiResponse<OrgClubPlayerApplyListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubJoinList.API
export async function postClubJoinListApi(
  payload: ClubJoinListRequest = {} as ClubJoinListRequest
): Promise<ApiResponse<ClubJoinListResponseData>> {
  const endpoint = '/org/club/user/join/list'
  const response = await http.post<ApiResponse<ClubJoinListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubUserPageActive.API
export async function postOrgClubUserPageActiveApi(
  payload: OrgClubUserPageActiveRequest = {} as OrgClubUserPageActiveRequest
): Promise<ApiResponse<OrgClubUserPageActiveResponseData>> {
  const endpoint = '/org/club/user/page/active'
  const response = await http.post<ApiResponse<OrgClubUserPageActiveResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubQuit.API
export async function postOrgClubQuitApi(
  payload: OrgClubQuitRequest = {} as OrgClubQuitRequest
): Promise<ApiResponse<OrgClubQuitResponseData>> {
  const endpoint = '/org/club/user/quit'
  const response = await http.post<ApiResponse<OrgClubQuitResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubQuitList.API
export async function postClubQuitListApi(
  payload: ClubQuitListRequest = {} as ClubQuitListRequest
): Promise<ApiResponse<ClubQuitListResponseData>> {
  const endpoint = '/org/club/user/quit/log'
  const response = await http.post<ApiResponse<ClubQuitListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubUserRemaRks.API
export async function postOrgClubUserRemaRksApi(
  payload: OrgClubUserRemaRksRequest = {} as OrgClubUserRemaRksRequest
): Promise<ApiResponse<OrgClubUserRemaRksResponseData>> {
  const endpoint = '/org/club/user/update'
  const response = await http.post<ApiResponse<OrgClubUserRemaRksResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubUserWalletRelationGrant.API
export async function postOrgClubUserWalletRelationGrantApi(
  payload: OrgClubUserWalletRelationGrantRequest = {} as OrgClubUserWalletRelationGrantRequest
): Promise<ApiResponse<OrgClubUserWalletRelationGrantResponseData>> {
  const endpoint = '/org/club/user/wallet/relation/grant'
  const response = await http.post<ApiResponse<OrgClubUserWalletRelationGrantResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubUserWalletRelationList.API
export async function postOrgClubUserWalletRelationListApi(
  payload: OrgClubUserWalletRelationListRequest = {} as OrgClubUserWalletRelationListRequest
): Promise<ApiResponse<OrgClubUserWalletRelationListResponseData>> {
  const endpoint = '/org/club/user/wallet/relation/list'
  const response = await http.post<ApiResponse<OrgClubUserWalletRelationListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgJackpotTemplateInfo.API
export async function postOrgJackpotTemplateInfoApi(
  payload: OrgJackpotTemplateInfoRequest = {} as OrgJackpotTemplateInfoRequest
): Promise<ApiResponse<OrgJackpotTemplateInfoResponseData>> {
  const endpoint = '/org/jackpot/template/info'
  const response = await http.post<ApiResponse<OrgJackpotTemplateInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeApplyList.API
export async function postOrgTribeApplyListApi(
  payload: OrgTribeApplyListRequest = {} as OrgTribeApplyListRequest
): Promise<ApiResponse<OrgTribeApplyListResponseData>> {
  const endpoint = '/org/tribe/apply_list'
  const response = await http.post<ApiResponse<OrgTribeApplyListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeApplyUpgrAde.API
export async function postOrgTribeApplyUpgrAdeApi(
  payload: OrgTribeApplyUpgrAdeRequest = {} as OrgTribeApplyUpgrAdeRequest
): Promise<ApiResponse<OrgTribeApplyUpgrAdeResponseData>> {
  const endpoint = '/org/tribe/apply_upgrade'
  const response = await http.post<ApiResponse<OrgTribeApplyUpgrAdeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeAuditApply.API
export async function postOrgTribeAuditApplyApi(
  payload: OrgTribeAuditApplyRequest = {} as OrgTribeAuditApplyRequest
): Promise<ApiResponse<OrgTribeAuditApplyResponseData>> {
  const endpoint = '/org/tribe/audit/apply'
  const response = await http.post<ApiResponse<OrgTribeAuditApplyResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeBlackUserList.API
export async function postOrgTribeBlackUserListApi(
  payload: OrgTribeBlackUserListRequest = {} as OrgTribeBlackUserListRequest
): Promise<ApiResponse<OrgTribeBlackUserListResponseData>> {
  const endpoint = '/org/tribe/black/user/list'
  const response = await http.post<ApiResponse<OrgTribeBlackUserListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeCheckUpgrAde.API
export async function postOrgTribeCheckUpgrAdeApi(
  payload: OrgTribeCheckUpgrAdeRequest = {} as OrgTribeCheckUpgrAdeRequest
): Promise<ApiResponse<OrgTribeCheckUpgrAdeResponseData>> {
  const endpoint = '/org/tribe/check_upgrade'
  const response = await http.post<ApiResponse<OrgTribeCheckUpgrAdeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeClubFundGoldChangeLog.API
export async function postOrgTribeClubFundGoldChangeLogApi(
  payload: OrgTribeClubFundGoldChangeLogRequest = {} as OrgTribeClubFundGoldChangeLogRequest
): Promise<ApiResponse<OrgTribeClubFundGoldChangeLogResponseData>> {
  const endpoint = '/org/tribe/club/fund/gold_change/log'
  const response = await http.post<ApiResponse<OrgTribeClubFundGoldChangeLogResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgJoinTrip.API
export async function postOrgJoinTripApi(
  payload: OrgJoinTripRequest = {} as OrgJoinTripRequest
): Promise<ApiResponse<OrgJoinTripResponseData>> {
  const endpoint = '/org/tribe/club/join/apply'
  const response = await http.post<ApiResponse<OrgJoinTripResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubApplyTribeList.API
export async function postOrgClubApplyTribeListApi(
  payload: OrgClubApplyTribeListRequest = {} as OrgClubApplyTribeListRequest
): Promise<ApiResponse<OrgClubApplyTribeListResponseData>> {
  const endpoint = '/org/tribe/club/join/apply_list'
  const response = await http.post<ApiResponse<OrgClubApplyTribeListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubCancleJoinTribe.API
export async function postOrgClubCancleJoinTribeApi(
  payload: OrgClubCancleJoinTribeRequest = {} as OrgClubCancleJoinTribeRequest
): Promise<ApiResponse<OrgClubCancleJoinTribeResponseData>> {
  const endpoint = '/org/tribe/club/join/cancel_apply'
  const response = await http.post<ApiResponse<OrgClubCancleJoinTribeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeClubKickOut.API
export async function postOrgTribeClubKickOutApi(
  payload: OrgTribeClubKickOutRequest = {} as OrgTribeClubKickOutRequest
): Promise<ApiResponse<OrgTribeClubKickOutResponseData>> {
  const endpoint = '/org/tribe/club/kickout'
  const response = await http.post<ApiResponse<OrgTribeClubKickOutResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeClubList.API
export async function postOrgTribeClubListApi(
  payload: OrgTribeClubListRequest = {} as OrgTribeClubListRequest
): Promise<ApiResponse<OrgTribeClubListResponseData>> {
  const endpoint = '/org/tribe/club/list'
  const response = await http.post<ApiResponse<OrgTribeClubListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeClubListAll.API
export async function postOrgTribeClubListAllApi(
  payload: OrgTribeClubListAllRequest = {} as OrgTribeClubListAllRequest
): Promise<ApiResponse<OrgTribeClubListAllResponseData>> {
  const endpoint = '/org/tribe/club/list/all'
  const response = await http.post<ApiResponse<OrgTribeClubListAllResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeClubLock.API
export async function postOrgTribeClubLockApi(
  payload: OrgTribeClubLockRequest = {} as OrgTribeClubLockRequest
): Promise<ApiResponse<OrgTribeClubLockResponseData>> {
  const endpoint = '/org/tribe/club/lock'
  const response = await http.post<ApiResponse<OrgTribeClubLockResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeClubRemark.API
export async function postOrgTribeClubRemarkApi(
  payload: OrgTribeClubRemarkRequest = {} as OrgTribeClubRemarkRequest
): Promise<ApiResponse<OrgTribeClubRemarkResponseData>> {
  const endpoint = '/org/tribe/club/remark'
  const response = await http.post<ApiResponse<OrgTribeClubRemarkResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeClubRemarkList.API
export async function postOrgTribeClubRemarkListApi(
  payload: OrgTribeClubRemarkListRequest = {} as OrgTribeClubRemarkListRequest
): Promise<ApiResponse<OrgTribeClubRemarkListResponseData>> {
  const endpoint = '/org/tribe/club/remark/list'
  const response = await http.post<ApiResponse<OrgTribeClubRemarkListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeClubUnlock.API
export async function postOrgTribeClubUnlockApi(
  payload: OrgTribeClubUnlockRequest = {} as OrgTribeClubUnlockRequest
): Promise<ApiResponse<OrgTribeClubUnlockResponseData>> {
  const endpoint = '/org/tribe/club/unlock'
  const response = await http.post<ApiResponse<OrgTribeClubUnlockResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeCreate.API
export async function postOrgTribeCreateApi(
  payload: OrgTribeCreateRequest = {} as OrgTribeCreateRequest
): Promise<ApiResponse<OrgTribeCreateResponseData>> {
  const endpoint = '/org/tribe/create'
  const response = await http.post<ApiResponse<OrgTribeCreateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeCreateIsFirst.API
export async function postOrgTribeCreateIsFirstApi(
  payload: OrgTribeCreateIsFirstRequest = {} as OrgTribeCreateIsFirstRequest
): Promise<ApiResponse<OrgTribeCreateIsFirstResponseData>> {
  const endpoint = '/org/tribe/create/is_first'
  const response = await http.post<ApiResponse<OrgTribeCreateIsFirstResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeFundGoldChangeLog.API
export async function postOrgTribeFundGoldChangeLogApi(
  payload: OrgTribeFundGoldChangeLogRequest = {} as OrgTribeFundGoldChangeLogRequest
): Promise<ApiResponse<OrgTribeFundGoldChangeLogResponseData>> {
  const endpoint = '/org/tribe/fund/gold_change/log'
  const response = await http.post<ApiResponse<OrgTribeFundGoldChangeLogResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeSearchById.API
export async function postOrgTribeSearchByIdApi(
  payload: OrgTribeSearchByIdRequest = {} as OrgTribeSearchByIdRequest
): Promise<ApiResponse<OrgTribeSearchByIdResponseData>> {
  const endpoint = '/org/tribe/info'
  const response = await http.post<ApiResponse<OrgTribeSearchByIdResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeInfoByClub.API
export async function postOrgTribeInfoByClubApi(
  payload: OrgTribeInfoByClubRequest = {} as OrgTribeInfoByClubRequest
): Promise<ApiResponse<OrgTribeInfoByClubResponseData>> {
  const endpoint = '/org/tribe/info_by_club'
  const response = await http.post<ApiResponse<OrgTribeInfoByClubResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeList.API
export async function postOrgTribeListApi(
  payload: OrgTribeListRequest = {} as OrgTribeListRequest
): Promise<ApiResponse<OrgTribeListResponseData>> {
  const endpoint = '/org/tribe/list'
  const response = await http.post<ApiResponse<OrgTribeListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos APIOrgTribeRoomPermissions.API
export async function postAPIOrgTribeRoomPermissionsApi(
  payload: APIOrgTribeRoomPermissionsRequest = {} as APIOrgTribeRoomPermissionsRequest
): Promise<ApiResponse<APIOrgTribeRoomPermissionsResponseData>> {
  const endpoint = '/org/tribe/room_permissions'
  const response = await http.post<ApiResponse<APIOrgTribeRoomPermissionsResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeRoomPermissionS.API
export async function postOrgTribeRoomPermissionSApi(
  payload: OrgTribeRoomPermissionSRequest = {} as OrgTribeRoomPermissionSRequest
): Promise<ApiResponse<OrgTribeRoomPermissionSResponseData>> {
  const endpoint = '/org/tribe/room_permissions'
  const response = await http.post<ApiResponse<OrgTribeRoomPermissionSResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeSetTimeZone.API
export async function postOrgTribeSetTimeZoneApi(
  payload: OrgTribeSetTimeZoneRequest = {} as OrgTribeSetTimeZoneRequest
): Promise<ApiResponse<OrgTribeSetTimeZoneResponseData>> {
  const endpoint = '/org/tribe/set/time_zone'
  const response = await http.post<ApiResponse<OrgTribeSetTimeZoneResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeSettIngClubProfitRatio.API
export async function postOrgTribeSettIngClubProfitRatioApi(
  payload: OrgTribeSettIngClubProfitRatioRequest = {} as OrgTribeSettIngClubProfitRatioRequest
): Promise<ApiResponse<OrgTribeSettIngClubProfitRatioResponseData>> {
  const endpoint = '/org/tribe/setting/club_profit_ratio'
  const response = await http.post<ApiResponse<OrgTribeSettIngClubProfitRatioResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgTribeWallet.API
export async function postOrgTribeWalletApi(
  payload: OrgTribeWalletRequest = {} as OrgTribeWalletRequest
): Promise<ApiResponse<OrgTribeWalletResponseData>> {
  const endpoint = '/org/tribe/wallet'
  const response = await http.post<ApiResponse<OrgTribeWalletResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUserAdminFavorIte.API
export async function postOrgUserAdminFavorIteApi(
  payload: OrgUserAdminFavorIteRequest = {} as OrgUserAdminFavorIteRequest
): Promise<ApiResponse<OrgUserAdminFavorIteResponseData>> {
  const endpoint = '/org/user/admin/favorite'
  const response = await http.post<ApiResponse<OrgUserAdminFavorIteResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUserCheckOrg.API
export async function postOrgUserCheckOrgApi(
  payload: OrgUserCheckOrgRequest = {} as OrgUserCheckOrgRequest
): Promise<ApiResponse<OrgUserCheckOrgResponseData>> {
  const endpoint = '/org/user/check/org'
  const response = await http.post<ApiResponse<OrgUserCheckOrgResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUserClubAdminList.API
export async function postOrgUserClubAdminListApi(
  payload: OrgUserClubAdminListRequest = {} as OrgUserClubAdminListRequest
): Promise<ApiResponse<OrgUserClubAdminListResponseData>> {
  const endpoint = '/org/user/club/admin/list'
  const response = await http.post<ApiResponse<OrgUserClubAdminListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos APIOrgUserNewLabelRead.API
export async function postAPIOrgUserNewLabelReadApi(
  payload: APIOrgUserNewLabelReadRequest = {} as APIOrgUserNewLabelReadRequest
): Promise<ApiResponse<APIOrgUserNewLabelReadResponseData>> {
  const endpoint = '/org/user/new_label/read'
  const response = await http.post<ApiResponse<APIOrgUserNewLabelReadResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUserNewLabelRead.API
export async function postOrgUserNewLabelReadApi(
  payload: OrgUserNewLabelReadRequest = {} as OrgUserNewLabelReadRequest
): Promise<ApiResponse<OrgUserNewLabelReadResponseData>> {
  const endpoint = '/org/user/new_label/read'
  const response = await http.post<ApiResponse<OrgUserNewLabelReadResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos APIOrgUserNewLabelReadNum.API
export async function postAPIOrgUserNewLabelReadNumApi(
  payload: APIOrgUserNewLabelReadNumRequest = {} as APIOrgUserNewLabelReadNumRequest
): Promise<ApiResponse<APIOrgUserNewLabelReadNumResponseData>> {
  const endpoint = '/org/user/new_label/read/num'
  const response = await http.post<ApiResponse<APIOrgUserNewLabelReadNumResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUserNewLabelReadNum.API
export async function postOrgUserNewLabelReadNumApi(
  payload: OrgUserNewLabelReadNumRequest = {} as OrgUserNewLabelReadNumRequest
): Promise<ApiResponse<OrgUserNewLabelReadNumResponseData>> {
  const endpoint = '/org/user/new_label/read/num'
  const response = await http.post<ApiResponse<OrgUserNewLabelReadNumResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUserSelfProfitBillNotifyConfim.API
export async function postOrgUserSelfProfitBillNotifyConfimApi(
  payload: OrgUserSelfProfitBillNotifyConfimRequest = {} as OrgUserSelfProfitBillNotifyConfimRequest
): Promise<ApiResponse<OrgUserSelfProfitBillNotifyConfimResponseData>> {
  const endpoint = '/org/user/self_profit/bill_notify/confim'
  const response = await http.post<ApiResponse<OrgUserSelfProfitBillNotifyConfimResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUserSelfProfitBillUnnotIfy.API
export async function postOrgUserSelfProfitBillUnnotIfyApi(
  payload: OrgUserSelfProfitBillUnnotIfyRequest = {} as OrgUserSelfProfitBillUnnotIfyRequest
): Promise<ApiResponse<OrgUserSelfProfitBillUnnotIfyResponseData>> {
  const endpoint = '/org/user/self_profit/bill_unnotify'
  const response = await http.post<ApiResponse<OrgUserSelfProfitBillUnnotIfyResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUserSelfProfitUnpayRecords.API
export async function postOrgUserSelfProfitUnpayRecordsApi(
  payload: OrgUserSelfProfitUnpayRecordsRequest = {} as OrgUserSelfProfitUnpayRecordsRequest
): Promise<ApiResponse<OrgUserSelfProfitUnpayRecordsResponseData>> {
  const endpoint = '/org/user/self_profit/unpay_records'
  const response = await http.post<ApiResponse<OrgUserSelfProfitUnpayRecordsResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgUserTribeAdminList.API
export async function postOrgUserTribeAdminListApi(
  payload: OrgUserTribeAdminListRequest = {} as OrgUserTribeAdminListRequest
): Promise<ApiResponse<OrgUserTribeAdminListResponseData>> {
  const endpoint = '/org/user/tribe/admin/list'
  const response = await http.post<ApiResponse<OrgUserTribeAdminListResponseData>>(endpoint, payload)
  return response.data
}

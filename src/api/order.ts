import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  ClubFundApplyListRequest,
  ClubFundApplyListResponseData,
  ClubFundAuditRequest,
  ClubFundAuditResponseData,
  ClubFundExchangeRequest,
  ClubFundExchangeResponseData,
  ClubFundOrderListRequest,
  ClubFundOrderListResponseData,
  ClubPlayerExchangeRequest,
  ClubPlayerExchangeResponseData,
  ClubPlayerOrderRecordRequest,
  ClubPlayerOrderRecordResponseData,
  ExchangeRateRequest,
  ExchangeRateResponseData,
  GuildGiveRecyCleRequest,
  GuildGiveRecyCleResponseData,
  OrderTribeOrderAuditRequest,
  OrderTribeOrderAuditResponseData,
  OrderTribeOrderListRequest,
  OrderTribeOrderListResponseData,
  OrderTribeRechargeGoldRequest,
  OrderTribeRechargeGoldResponseData,
  OrderTribeRechargeRequest,
  OrderTribeRechargeResponseData,
  OrderTribeTransFerDiamondToTribeRequest,
  OrderTribeTransFerDiamondToTribeResponseData,
  OrderTribeTransFerDiamondToUserRequest,
  OrderTribeTransFerDiamondToUserResponseData,
  OrderTribeWithdrawRequest,
  OrderTribeWithdrawResponseData,
  OrderUserClubOrderCancelRequest,
  OrderUserClubOrderCancelResponseData,
  OrderUserRechargeNoRequest,
  OrderUserRechargeNoResponseData,
  OrderUserUsdtOrderListRequest,
  OrderUserUsdtOrderListResponseData,
  OrderUserUsdtRechargeRequest,
  OrderUserUsdtRechargeResponseData,
  RechargeGoldClubRequest,
  RechargeGoldClubResponseData,
  RechargeGoldRequest,
  RechargeGoldResponseData,
  TiquGoldClubRequest,
  TiquGoldClubResponseData,
  TiquGoldRequest,
  TiquGoldResponseData,
} from '@/api/models/order'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))
void formatPath

// 对齐 cocos WebClubFundAudit.API
export async function postClubFundAuditApi(
  payload: ClubFundAuditRequest = {} as ClubFundAuditRequest
): Promise<ApiResponse<ClubFundAuditResponseData>> {
  const endpoint = '/order/club/audit/member_order'
  const response = await http.post<ApiResponse<ClubFundAuditResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubFundExchange.API
export async function postClubFundExchangeApi(
  payload: ClubFundExchangeRequest = {} as ClubFundExchangeRequest
): Promise<ApiResponse<ClubFundExchangeResponseData>> {
  const endpoint = '/order/club/exchange'
  const response = await http.post<ApiResponse<ClubFundExchangeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebExchangeRate.API
export async function postExchangeRateApi(
  payload: ExchangeRateRequest = {} as ExchangeRateRequest
): Promise<ApiResponse<ExchangeRateResponseData>> {
  const endpoint = '/order/club/exchange_rate'
  const response = await http.post<ApiResponse<ExchangeRateResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubFundApplyList.API
export async function postClubFundApplyListApi(
  payload: ClubFundApplyListRequest = {} as ClubFundApplyListRequest
): Promise<ApiResponse<ClubFundApplyListResponseData>> {
  const endpoint = '/order/club/member_order/list'
  const response = await http.post<ApiResponse<ClubFundApplyListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebGuildGiveRecyCle.API
export async function postGuildGiveRecyCleApi(
  payload: GuildGiveRecyCleRequest = {} as GuildGiveRecyCleRequest
): Promise<ApiResponse<GuildGiveRecyCleResponseData>> {
  const endpoint = '/order/club/member/grant'
  const response = await http.post<ApiResponse<GuildGiveRecyCleResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubFundOrderList.API
export async function postClubFundOrderListApi(
  payload: ClubFundOrderListRequest = {} as ClubFundOrderListRequest
): Promise<ApiResponse<ClubFundOrderListResponseData>> {
  const endpoint = '/order/club/order_list'
  const response = await http.post<ApiResponse<ClubFundOrderListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebRechargeGoldClub.API
export async function postRechargeGoldClubApi(
  payload: RechargeGoldClubRequest = {} as RechargeGoldClubRequest
): Promise<ApiResponse<RechargeGoldClubResponseData>> {
  const endpoint = '/order/club/recharge'
  const response = await http.post<ApiResponse<RechargeGoldClubResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebTiquGoldClub.API
export async function postTiquGoldClubApi(
  payload: TiquGoldClubRequest = {} as TiquGoldClubRequest
): Promise<ApiResponse<TiquGoldClubResponseData>> {
  const endpoint = '/order/club/withdraw'
  const response = await http.post<ApiResponse<TiquGoldClubResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderTribeOrderList.API
export async function postOrderTribeOrderListApi(
  payload: OrderTribeOrderListRequest = {} as OrderTribeOrderListRequest
): Promise<ApiResponse<OrderTribeOrderListResponseData>> {
  const endpoint = '/order/tribe/order_list'
  const response = await http.post<ApiResponse<OrderTribeOrderListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderTribeOrderAudit.API
export async function postOrderTribeOrderAuditApi(
  payload: OrderTribeOrderAuditRequest = {} as OrderTribeOrderAuditRequest
): Promise<ApiResponse<OrderTribeOrderAuditResponseData>> {
  const endpoint = '/order/tribe/order/audit'
  const response = await http.post<ApiResponse<OrderTribeOrderAuditResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderTribeRecharge.API
export async function postOrderTribeRechargeApi(
  payload: OrderTribeRechargeRequest = {} as OrderTribeRechargeRequest
): Promise<ApiResponse<OrderTribeRechargeResponseData>> {
  const endpoint = '/order/tribe/recharge'
  const response = await http.post<ApiResponse<OrderTribeRechargeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderTribeRechargeGold.API
export async function postOrderTribeRechargeGoldApi(
  payload: OrderTribeRechargeGoldRequest = {} as OrderTribeRechargeGoldRequest
): Promise<ApiResponse<OrderTribeRechargeGoldResponseData>> {
  const endpoint = '/order/tribe/recharge_gold'
  const response = await http.post<ApiResponse<OrderTribeRechargeGoldResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderTribeTransFerDiamondToTribe.API
export async function postOrderTribeTransFerDiamondToTribeApi(
  payload: OrderTribeTransFerDiamondToTribeRequest = {} as OrderTribeTransFerDiamondToTribeRequest
): Promise<ApiResponse<OrderTribeTransFerDiamondToTribeResponseData>> {
  const endpoint = '/order/tribe/transfer_diamond/to_tribe'
  const response = await http.post<ApiResponse<OrderTribeTransFerDiamondToTribeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderTribeTransFerDiamondToUser.API
export async function postOrderTribeTransFerDiamondToUserApi(
  payload: OrderTribeTransFerDiamondToUserRequest = {} as OrderTribeTransFerDiamondToUserRequest
): Promise<ApiResponse<OrderTribeTransFerDiamondToUserResponseData>> {
  const endpoint = '/order/tribe/transfer_diamond/to_user'
  const response = await http.post<ApiResponse<OrderTribeTransFerDiamondToUserResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderTribeWithdraw.API
export async function postOrderTribeWithdrawApi(
  payload: OrderTribeWithdrawRequest = {} as OrderTribeWithdrawRequest
): Promise<ApiResponse<OrderTribeWithdrawResponseData>> {
  const endpoint = '/order/tribe/withdraw'
  const response = await http.post<ApiResponse<OrderTribeWithdrawResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderUserClubOrderCancel.API
export async function postOrderUserClubOrderCancelApi(
  payload: OrderUserClubOrderCancelRequest = {} as OrderUserClubOrderCancelRequest
): Promise<ApiResponse<OrderUserClubOrderCancelResponseData>> {
  const endpoint = '/order/user/club_order/cancel'
  const response = await http.post<ApiResponse<OrderUserClubOrderCancelResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubPlayerExchange.API
export async function postClubPlayerExchangeApi(
  payload: ClubPlayerExchangeRequest = {} as ClubPlayerExchangeRequest
): Promise<ApiResponse<ClubPlayerExchangeResponseData>> {
  const endpoint = '/order/user/exchange'
  const response = await http.post<ApiResponse<ClubPlayerExchangeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubPlayerOrderRecord.API
export async function postClubPlayerOrderRecordApi(
  payload: ClubPlayerOrderRecordRequest = {} as ClubPlayerOrderRecordRequest
): Promise<ApiResponse<ClubPlayerOrderRecordResponseData>> {
  const endpoint = '/order/user/order_records'
  const response = await http.post<ApiResponse<ClubPlayerOrderRecordResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebRechargeGold.API
export async function postRechargeGoldApi(
  payload: RechargeGoldRequest = {} as RechargeGoldRequest
): Promise<ApiResponse<RechargeGoldResponseData>> {
  const endpoint = '/order/user/recharge'
  const response = await http.post<ApiResponse<RechargeGoldResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderUserRechargeNo.API
export async function postOrderUserRechargeNoApi(
  payload: OrderUserRechargeNoRequest = {} as OrderUserRechargeNoRequest
): Promise<ApiResponse<OrderUserRechargeNoResponseData>> {
  const endpoint = '/order/user/recharge_no'
  const response = await http.post<ApiResponse<OrderUserRechargeNoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderUserUsdtOrderList.API
export async function postOrderUserUsdtOrderListApi(
  payload: OrderUserUsdtOrderListRequest = {} as OrderUserUsdtOrderListRequest
): Promise<ApiResponse<OrderUserUsdtOrderListResponseData>> {
  const endpoint = '/order/user/usdt/order/list'
  const response = await http.post<ApiResponse<OrderUserUsdtOrderListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrderUserUsdtRecharge.API
export async function postOrderUserUsdtRechargeApi(
  payload: OrderUserUsdtRechargeRequest = {} as OrderUserUsdtRechargeRequest
): Promise<ApiResponse<OrderUserUsdtRechargeResponseData>> {
  const endpoint = '/order/user/usdt/recharge'
  const response = await http.post<ApiResponse<OrderUserUsdtRechargeResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebTiquGold.API
export async function postTiquGoldApi(
  payload: TiquGoldRequest = {} as TiquGoldRequest
): Promise<ApiResponse<TiquGoldResponseData>> {
  const endpoint = '/order/user/withdraw'
  const response = await http.post<ApiResponse<TiquGoldResponseData>>(endpoint, payload)
  return response.data
}

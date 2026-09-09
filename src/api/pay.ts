import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  PayAppleOrderRechargeRequest,
  PayAppleOrderRechargeResponseData,
  PaymentInfoListRequest,
  PaymentInfoListData,
  CreatePaymentInfoRequest,
  PayOrderInfoRequest,
  PayOrderInfoData,
} from '@/api/models/pay'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))
void formatPath

// 对齐 cocos WebPayAppleOrderRecharge.API
export async function postPayAppleOrderRechargeApi(
  payload: PayAppleOrderRechargeRequest = {} as PayAppleOrderRechargeRequest
): Promise<ApiResponse<PayAppleOrderRechargeResponseData>> {
  const endpoint = '/pay/apple/order/recharge'
  const response = await http.post<ApiResponse<PayAppleOrderRechargeResponseData>>(endpoint, payload)
  return response.data
}

export async function postPaymentInfoListApi(
  payload: PaymentInfoListRequest = {}
): Promise<ApiResponse<PaymentInfoListData>> {
  const response = await http.post<ApiResponse<PaymentInfoListData>>('/pay/cpay/pay/info/list', payload)
  return response.data
}

export async function postPaymentInfoCreateApi(
  payload: CreatePaymentInfoRequest = {}
): Promise<ApiResponse<Record<string, unknown>>> {
  const response = await http.post<ApiResponse<Record<string, unknown>>>('/pay/cpay/pay/info/create', payload)
  return response.data
}

// 软删除：cpay/pay/info/update 用 status 标记，1=正常，2=删除。
export async function postPaymentInfoDeleteApi(id: number): Promise<ApiResponse<null>> {
  const response = await http.post<ApiResponse<null>>('/pay/cpay/pay/info/update', {
    id,
    status: 2,
  })
  return response.data
}

export async function postPayOrderInfoApi(
  payload: PayOrderInfoRequest = {},
  options: { suppressBusinessToast?: boolean } = {},
): Promise<ApiResponse<PayOrderInfoData>> {
  const response = await http.post<ApiResponse<PayOrderInfoData> | string>('/pay/order/info', payload, options)
  const data = response.data
  return typeof data === 'string' ? (JSON.parse(data) as ApiResponse<PayOrderInfoData>) : data
}

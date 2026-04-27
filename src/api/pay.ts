import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  PayAppleOrderRechargeRequest,
  PayAppleOrderRechargeResponseData,
} from '@/api/models/pay'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? "")))
void formatPath

// 对齐 cocos WebPayAppleOrderRecharge.API
export async function postPayAppleOrderRechargeApi(
  payload: PayAppleOrderRechargeRequest = {} as PayAppleOrderRechargeRequest
): Promise<ApiResponse<PayAppleOrderRechargeResponseData>> {
  const endpoint = '/pay/apple/order/recharge'
  const response = await http.post<ApiResponse<PayAppleOrderRechargeResponseData>>(endpoint, payload)
  return response.data
}

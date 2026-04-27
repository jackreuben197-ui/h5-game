import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  UserProxyImAuthUserTokenRequest,
  UserProxyImAuthUserTokenResponseData,
} from '@/api/models/userproxy'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? "")))
void formatPath

// 对齐 cocos WebUserProxyImAuthUserToken.API
export async function postUserProxyImAuthUserTokenApi(
  payload: UserProxyImAuthUserTokenRequest = {} as UserProxyImAuthUserTokenRequest
): Promise<ApiResponse<UserProxyImAuthUserTokenResponseData>> {
  const endpoint = '/userproxy/im/auth/user_token'
  const response = await http.post<ApiResponse<UserProxyImAuthUserTokenResponseData>>(endpoint, payload)
  return response.data
}

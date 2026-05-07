import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  BaseConfigCombineData,
  BaseConfigCombineRequest,
  BeforeLoginConfigData,
  BeforeLoginConfigRequest,
  DiamondConfigData,
  DiamondConfigRequest,
  GlobalConfigData,
  GlobalConfigRequest,
  MaintenanceData,
  MaintenanceTfData,
  MultiLanguageTemplateRecord,
  OnlineWithdrawDescriptionData,
  OnlineWithdrawDescriptionRequest,
  OnlineWithdrawTypeListData,
  RegisterAreaData,
  UserWhitelistInfoData,
  UserWhitelistInfoRequest,
} from '@/api/models/config'

// 对齐 Unity HttpConfigMultiLanguageProtocol.API。
export async function getMultiLanguageTemplateApi(): Promise<
  ApiResponse<MultiLanguageTemplateRecord[]>
  > {
  const response = await http.post<ApiResponse<MultiLanguageTemplateRecord[]>>(
    '/config/multi_language/template',
    {},
  )
  return response.data
}

// 对齐 cocos WebConfigGlobalConfig.API。
export async function postGlobalConfigApi(
  payload: GlobalConfigRequest = {},
): Promise<ApiResponse<GlobalConfigData>> {
  const response = await http.post<ApiResponse<GlobalConfigData>>('/config/global/config', payload)
  return response.data
}

// 对齐 cocos /api/config/diamond/config。
export async function postDiamondConfigApi(
  payload: DiamondConfigRequest = {},
): Promise<ApiResponse<DiamondConfigData>> {
  const response = await http.post<ApiResponse<DiamondConfigData>>('/config/diamond/config', payload)
  return response.data
}

// 对齐 cocos WebConfigBaseConfigCombine.API。
export async function postBaseConfigCombineApi(
  payload: BaseConfigCombineRequest,
): Promise<ApiResponse<BaseConfigCombineData>> {
  const response = await http.post<ApiResponse<BaseConfigCombineData>>(
    '/config/base/config/combine',
    payload,
  )
  return response.data
}

// 对齐 cocos WebConfigBeforeLoginConfig.API。
export async function postBeforeLoginConfigApi(
  payload: BeforeLoginConfigRequest,
): Promise<ApiResponse<BeforeLoginConfigData>> {
  const response = await http.post<ApiResponse<BeforeLoginConfigData>>(
    '/config/before/login/config',
    payload,
  )
  return response.data
}

// 对齐 cocos WebConfigMaintenance.API。
export async function postMaintenanceApi(
  payload: Record<string, unknown> = {},
): Promise<ApiResponse<MaintenanceData>> {
  const response = await http.post<ApiResponse<MaintenanceData>>('/config/maintenance', payload)
  return response.data
}

// 对齐 cocos WebConfigMaintenanceTf.API。
export async function postMaintenanceTfApi(
  payload: Record<string, unknown> = {},
): Promise<ApiResponse<MaintenanceTfData>> {
  const response = await http.post<ApiResponse<MaintenanceTfData>>('/config/maintenance_tf', payload)
  return response.data
}

// 对齐 cocos /api/config/register/area。
export async function postRegisterAreaApi(
  payload: Record<string, unknown> = {},
): Promise<ApiResponse<RegisterAreaData>> {
  const response = await http.post<ApiResponse<RegisterAreaData>>('/config/register/area', payload)
  return response.data
}

// 对齐 cocos WebConfigUserWhiteListInfo.API。
export async function postUserWhitelistInfoApi(
  payload: UserWhitelistInfoRequest = {},
): Promise<ApiResponse<UserWhitelistInfoData>> {
  const response = await http.post<ApiResponse<UserWhitelistInfoData>>(
    '/config/user/whitelist/info',
    payload,
  )
  return response.data
}

// /api/config/online_withdraw_type_list
export async function postOnlineWithdrawTypeListApi(
  payload: Record<string, unknown> = {},
): Promise<ApiResponse<OnlineWithdrawTypeListData>> {
  const response = await http.post<ApiResponse<OnlineWithdrawTypeListData>>(
    '/config/online_withdraw_type_list',
    payload,
  )
  return response.data
}

// /api/config/online_withdraw_description
export async function postOnlineWithdrawDescriptionApi(
  payload: OnlineWithdrawDescriptionRequest,
): Promise<ApiResponse<OnlineWithdrawDescriptionData>> {
  const response = await http.post<ApiResponse<OnlineWithdrawDescriptionData>>(
    '/config/online_withdraw_description',
    payload,
  )
  return response.data
}

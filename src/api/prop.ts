import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  BagCurrentPendantListRequest,
  BagCurrentPendantListResponseData,
  BagPendantListRequest,
  BagPendantListResponseData,
  BagpAndantDownRequest,
  BagpAndantDownResponseData,
  BagpandantupRequest,
  BagpandantupResponseData,
  MallBuyRequest,
  MallBuyResponseData,
  MallShopListRequest,
  MallShopListResponseData,
  PropBuyRequest,
  PropBuyResponseData,
  PropChatPropListRequest,
  PropChatPropListResponseData,
  PropChatPropUsedRequest,
  PropChatPropUsedResponseData,
  PropGoldPriceListRequest,
  PropGoldPriceListData,
  PropListRequest,
  PropListResponseData,
  PropMallGoodsBuyRequest,
  PropMallGoodsBuyResponseData,
  PropMallGoodsDetailRequest,
  PropMallGoodsDetailResponseData,
  PropMallGoodsListRequest,
  PropMallGoodsListResponseData,
  PropMallPrettyIdBuyRequest,
  PropMallPrettyIdBuyResponseData,
  PropMallPrettyIdListRequest,
  PropMallPrettyIdListResponseData,
  PropMallPrettyIdTotalRequest,
  PropMallPrettyIdTotalResponseData,
  PropShareContEntRequest,
  PropShareContEntResponseData,
  PropShareDoneRequest,
  PropShareDoneResponseData,
  PropShopPingAppleVerifyReceIptRequest,
  PropShopPingAppleVerifyReceIptResponseData,
  PropShopPingGoogleVerifyOrderRequest,
  PropShopPingGoogleVerifyOrderResponseData,
  PropSignInActivityDetailRequest,
  PropSignInActivityDetailResponseData,
  PropSignInActivitySignInRequest,
  PropSignInActivitySignInResponseData,
  PropTaskListRequest,
  PropTaskListResponseData,
  PropTaskReceIveRequest,
  PropTaskReceIveResponseData,
  PropTestSignInActivityResetRequest,
  PropTestSignInActivityResetResponseData,
  PropTribeGoldPriceListRequest,
  PropTribeGoldPriceListResponseData,
  PropUserBuyPropRequest,
  PropUserBuyPropResponseData,
  PropUserCheckPropInfoRequest,
  PropUserCheckPropInfoResponseData,
  PropUserOfflInetIcketsGainRequest,
  PropUserOfflInetIcketsGainResponseData,
  PropUserOfflInetIcketsRequest,
  PropUserOfflInetIcketsResponseData,
  PropUserOfflInetIcketsTransFerRequest,
  PropUserOfflInetIcketsTransFerResponseData,
  PropUserPropGroupListRequest,
  PropUserPropGroupListResponseData,
  PropUserPropInfoRequest,
  PropUserPropInfoData,
  PropUserPropListRequest,
  PropUserPropListResponseData,
  PropUserPropUsedRequest,
  PropUserPropUsedResponseData,
  PropWheelLottEryListRequest,
  PropWheelLottEryListResponseData,
  PropWheelLottEryRequest,
  PropWheelLottEryResponseData,
  PropWheelUserHandNumRequest,
  PropWheelUserHandNumResponseData,
  RoomCenterMttGetdisCountSRequest,
  RoomCenterMttGetdisCountSResponseData,
  ShareUsableRequest,
  ShareUsableResponseData,
} from '@/api/models/prop'

const formatPath = (
  template: string,
  pathParams: Record<string, string | number>,
): string => template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))
void formatPath

// 对齐 cocos WebPropBuy.API
export async function postPropBuyApi(
  payload: PropBuyRequest = {} as PropBuyRequest
): Promise<ApiResponse<PropBuyResponseData>> {
  const endpoint = '/prop/buy'
  const response = await http.post<ApiResponse<PropBuyResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropChatPropList.API
export async function postPropChatPropListApi(
  payload: PropChatPropListRequest = {} as PropChatPropListRequest
): Promise<ApiResponse<PropChatPropListResponseData>> {
  const endpoint = '/prop/chat/prop/list'
  const response = await http.post<ApiResponse<PropChatPropListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropChatPropUsed.API
export async function postPropChatPropUsedApi(
  payload: PropChatPropUsedRequest = {} as PropChatPropUsedRequest
): Promise<ApiResponse<PropChatPropUsedResponseData>> {
  const endpoint = '/prop/chat/prop/used'
  const response = await http.post<ApiResponse<PropChatPropUsedResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropGoldPriceList.API
export async function postPropGoldPriceListApi(
  payload: PropGoldPriceListRequest = {} as PropGoldPriceListRequest,
  clubId?: number
): Promise<ApiResponse<PropGoldPriceListData>> {
  const endpoint = '/prop/gold/price/list'
  const headers = clubId != null ? { 'X-Club': String(clubId) } : undefined
  const response = await http.post<ApiResponse<PropGoldPriceListData>>(endpoint, payload, { headers })
  return response.data
}

// 对齐 cocos WebPropList.API
export async function postPropListApi(
  payload: PropListRequest = {} as PropListRequest
): Promise<ApiResponse<PropListResponseData>> {
  const endpoint = '/prop/list'
  const response = await http.post<ApiResponse<PropListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropMallGoodsBuy.API
export async function postPropMallGoodsBuyApi(
  payload: PropMallGoodsBuyRequest = {} as PropMallGoodsBuyRequest
): Promise<ApiResponse<PropMallGoodsBuyResponseData>> {
  const endpoint = '/prop/mall/goods/buy'
  const response = await http.post<ApiResponse<PropMallGoodsBuyResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropMallGoodsDetail.API
export async function postPropMallGoodsDetailApi(
  payload: PropMallGoodsDetailRequest = {} as PropMallGoodsDetailRequest
): Promise<ApiResponse<PropMallGoodsDetailResponseData>> {
  const endpoint = '/prop/mall/goods/detail'
  const response = await http.post<ApiResponse<PropMallGoodsDetailResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropMallGoodsList.API
export async function postPropMallGoodsListApi(
  payload: PropMallGoodsListRequest = {} as PropMallGoodsListRequest
): Promise<ApiResponse<PropMallGoodsListResponseData>> {
  const endpoint = '/prop/mall/goods/list'
  const response = await http.post<ApiResponse<PropMallGoodsListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropMallPrettyIdBuy.API
export async function postPropMallPrettyIdBuyApi(
  payload: PropMallPrettyIdBuyRequest = {} as PropMallPrettyIdBuyRequest
): Promise<ApiResponse<PropMallPrettyIdBuyResponseData>> {
  const endpoint = '/prop/mall/pretty_id/buy'
  const response = await http.post<ApiResponse<PropMallPrettyIdBuyResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropMallPrettyIdList.API
export async function postPropMallPrettyIdListApi(
  payload: PropMallPrettyIdListRequest = {} as PropMallPrettyIdListRequest
): Promise<ApiResponse<PropMallPrettyIdListResponseData>> {
  const endpoint = '/prop/mall/pretty_id/list'
  const response = await http.post<ApiResponse<PropMallPrettyIdListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropMallPrettyIdTotal.API
export async function postPropMallPrettyIdTotalApi(
  payload: PropMallPrettyIdTotalRequest = {} as PropMallPrettyIdTotalRequest
): Promise<ApiResponse<PropMallPrettyIdTotalResponseData>> {
  const endpoint = '/prop/mall/pretty_id/total'
  const response = await http.post<ApiResponse<PropMallPrettyIdTotalResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropShareContEnt.API
export async function postPropShareContEntApi(
  payload: PropShareContEntRequest = {} as PropShareContEntRequest
): Promise<ApiResponse<PropShareContEntResponseData>> {
  const endpoint = '/prop/share/content'
  const response = await http.post<ApiResponse<PropShareContEntResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropShareDone.API
export async function postPropShareDoneApi(
  payload: PropShareDoneRequest = {} as PropShareDoneRequest
): Promise<ApiResponse<PropShareDoneResponseData>> {
  const endpoint = '/prop/share/done'
  const response = await http.post<ApiResponse<PropShareDoneResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebShareUsable.API
export async function postShareUsableApi(
  payload: ShareUsableRequest = {} as ShareUsableRequest
): Promise<ApiResponse<ShareUsableResponseData>> {
  const endpoint = '/prop/share/usable'
  const response = await http.post<ApiResponse<ShareUsableResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropShopPingAppleVerifyReceIpt.API
export async function postPropShopPingAppleVerifyReceIptApi(
  payload: PropShopPingAppleVerifyReceIptRequest = {} as PropShopPingAppleVerifyReceIptRequest
): Promise<ApiResponse<PropShopPingAppleVerifyReceIptResponseData>> {
  const endpoint = '/prop/shopping/apple/verifyreceipt'
  const response = await http.post<ApiResponse<PropShopPingAppleVerifyReceIptResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMallBuy.API
export async function postMallBuyApi(
  payload: MallBuyRequest = {} as MallBuyRequest
): Promise<ApiResponse<MallBuyResponseData>> {
  const endpoint = '/prop/shopping/goods_buy'
  const response = await http.post<ApiResponse<MallBuyResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebMallShopList.API
export async function postMallShopListApi(
  payload: MallShopListRequest = {} as MallShopListRequest
): Promise<ApiResponse<MallShopListResponseData>> {
  const endpoint = '/prop/shopping/goods_list'
  const response = await http.post<ApiResponse<MallShopListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropShopPingGoogleVerifyOrder.API
export async function postPropShopPingGoogleVerifyOrderApi(
  payload: PropShopPingGoogleVerifyOrderRequest = {} as PropShopPingGoogleVerifyOrderRequest
): Promise<ApiResponse<PropShopPingGoogleVerifyOrderResponseData>> {
  const endpoint = '/prop/shopping/google/verifyorder'
  const response = await http.post<ApiResponse<PropShopPingGoogleVerifyOrderResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropSignInActivityDetail.API
export async function postPropSignInActivityDetailApi(
  payload: PropSignInActivityDetailRequest = {} as PropSignInActivityDetailRequest
): Promise<ApiResponse<PropSignInActivityDetailResponseData>> {
  const endpoint = '/prop/sign_in/activity/detail'
  const response = await http.post<ApiResponse<PropSignInActivityDetailResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropSignInActivitySignIn.API
export async function postPropSignInActivitySignInApi(
  payload: PropSignInActivitySignInRequest = {} as PropSignInActivitySignInRequest
): Promise<ApiResponse<PropSignInActivitySignInResponseData>> {
  const endpoint = '/prop/sign_in/activity/sign_in'
  const response = await http.post<ApiResponse<PropSignInActivitySignInResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropTaskList.API
export async function postPropTaskListApi(
  payload: PropTaskListRequest = {} as PropTaskListRequest
): Promise<ApiResponse<PropTaskListResponseData>> {
  const endpoint = '/prop/task/task_list'
  const response = await http.post<ApiResponse<PropTaskListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropTaskReceIve.API
export async function postPropTaskReceIveApi(
  payload: PropTaskReceIveRequest = {} as PropTaskReceIveRequest
): Promise<ApiResponse<PropTaskReceIveResponseData>> {
  const endpoint = '/prop/task/task_receive'
  const response = await http.post<ApiResponse<PropTaskReceIveResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropTestSignInActivityReset.API
export async function postPropTestSignInActivityResetApi(
  payload: PropTestSignInActivityResetRequest = {} as PropTestSignInActivityResetRequest
): Promise<ApiResponse<PropTestSignInActivityResetResponseData>> {
  const endpoint = '/prop/test/sign_in/activity/reset'
  const response = await http.post<ApiResponse<PropTestSignInActivityResetResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropTribeGoldPriceList.API
export async function postPropTribeGoldPriceListApi(
  payload: PropTribeGoldPriceListRequest = {} as PropTribeGoldPriceListRequest
): Promise<ApiResponse<PropTribeGoldPriceListResponseData>> {
  const endpoint = '/prop/tribe_gold/price/list'
  const response = await http.post<ApiResponse<PropTribeGoldPriceListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebBagCurrentPendantList.API
export async function postBagCurrentPendantListApi(
  payload: BagCurrentPendantListRequest = {} as BagCurrentPendantListRequest
): Promise<ApiResponse<BagCurrentPendantListResponseData>> {
  const endpoint = '/prop/user_prop/current_pendant_list'
  const response = await http.post<ApiResponse<BagCurrentPendantListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropUserPropGroupList.API
export async function postPropUserPropGroupListApi(
  payload: PropUserPropGroupListRequest = {} as PropUserPropGroupListRequest
): Promise<ApiResponse<PropUserPropGroupListResponseData>> {
  const endpoint = '/prop/user_prop/group/list'
  const response = await http.post<ApiResponse<PropUserPropGroupListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropUserPropList.API
export async function postPropUserPropListApi(
  payload: PropUserPropListRequest = {} as PropUserPropListRequest
): Promise<ApiResponse<PropUserPropListResponseData>> {
  const endpoint = '/prop/user_prop/list'
  const response = await http.post<ApiResponse<PropUserPropListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebRoomCenterMttGetdisCountS.API
export async function postRoomCenterMttGetdisCountSApi(
  payload: RoomCenterMttGetdisCountSRequest = {} as RoomCenterMttGetdisCountSRequest
): Promise<ApiResponse<RoomCenterMttGetdisCountSResponseData>> {
  const endpoint = '/prop/user_prop/mtt/list'
  const response = await http.post<ApiResponse<RoomCenterMttGetdisCountSResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebBagpAndantDown.API
export async function postBagpAndantDownApi(
  payload: BagpAndantDownRequest = {} as BagpAndantDownRequest
): Promise<ApiResponse<BagpAndantDownResponseData>> {
  const endpoint = '/prop/user_prop/pendant_down'
  const response = await http.post<ApiResponse<BagpAndantDownResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebBagPendantList.API
export async function postBagPendantListApi(
  payload: BagPendantListRequest = {} as BagPendantListRequest
): Promise<ApiResponse<BagPendantListResponseData>> {
  const endpoint = '/prop/user_prop/pendant_list'
  const response = await http.post<ApiResponse<BagPendantListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebBagpandantup.API
export async function postBagpandantupApi(
  payload: BagpandantupRequest = {} as BagpandantupRequest
): Promise<ApiResponse<BagpandantupResponseData>> {
  const endpoint = '/prop/user_prop/pendant_up'
  const response = await http.post<ApiResponse<BagpandantupResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropUserPropUsed.API
export async function postPropUserPropUsedApi(
  payload: PropUserPropUsedRequest = {} as PropUserPropUsedRequest
): Promise<ApiResponse<PropUserPropUsedResponseData>> {
  const endpoint = '/prop/user_prop/used'
  const response = await http.post<ApiResponse<PropUserPropUsedResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropUserBuyProp.API
export async function postPropUserBuyPropApi(
  payload: PropUserBuyPropRequest = {} as PropUserBuyPropRequest
): Promise<ApiResponse<PropUserBuyPropResponseData>> {
  const endpoint = '/prop/user/buy_inner_prop'
  const response = await http.post<ApiResponse<PropUserBuyPropResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropUserCheckPropInfo.API
export async function postPropUserCheckPropInfoApi(
  payload: PropUserCheckPropInfoRequest = {} as PropUserCheckPropInfoRequest
): Promise<ApiResponse<PropUserCheckPropInfoResponseData>> {
  const endpoint = '/prop/user/check_prop_info'
  const response = await http.post<ApiResponse<PropUserCheckPropInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropUserOfflInetIckets.API
export async function postPropUserOfflInetIcketsApi(
  payload: PropUserOfflInetIcketsRequest = {} as PropUserOfflInetIcketsRequest
): Promise<ApiResponse<PropUserOfflInetIcketsResponseData>> {
  const endpoint = '/prop/user/offline_tickets'
  const response = await http.post<ApiResponse<PropUserOfflInetIcketsResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropUserOfflInetIcketsGain.API
export async function postPropUserOfflInetIcketsGainApi(
  payload: PropUserOfflInetIcketsGainRequest = {} as PropUserOfflInetIcketsGainRequest
): Promise<ApiResponse<PropUserOfflInetIcketsGainResponseData>> {
  const endpoint = '/prop/user/offline_tickets/gain'
  const response = await http.post<ApiResponse<PropUserOfflInetIcketsGainResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropUserOfflInetIcketsTransFer.API
export async function postPropUserOfflInetIcketsTransFerApi(
  payload: PropUserOfflInetIcketsTransFerRequest = {} as PropUserOfflInetIcketsTransFerRequest
): Promise<ApiResponse<PropUserOfflInetIcketsTransFerResponseData>> {
  const endpoint = '/prop/user/offline_tickets/transfer'
  const response = await http.post<ApiResponse<PropUserOfflInetIcketsTransFerResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropUserPropInfo.API
export async function postPropUserPropInfoApi(
  payload: PropUserPropInfoRequest = {} as PropUserPropInfoRequest
): Promise<ApiResponse<PropUserPropInfoData>> {
  const endpoint = '/prop/user/prop_info'
  const response = await http.post<ApiResponse<PropUserPropInfoData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropWheelLottEry.API
export async function postPropWheelLottEryApi(
  payload: PropWheelLottEryRequest = {} as PropWheelLottEryRequest
): Promise<ApiResponse<PropWheelLottEryResponseData>> {
  const endpoint = '/prop/wheel/lottery'
  const response = await http.post<ApiResponse<PropWheelLottEryResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropWheelLottEryList.API
export async function postPropWheelLottEryListApi(
  payload: PropWheelLottEryListRequest = {} as PropWheelLottEryListRequest
): Promise<ApiResponse<PropWheelLottEryListResponseData>> {
  const endpoint = '/prop/wheel/lottery/list'
  const response = await http.post<ApiResponse<PropWheelLottEryListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebPropWheelUserHandNum.API
export async function postPropWheelUserHandNumApi(
  payload: PropWheelUserHandNumRequest = {} as PropWheelUserHandNumRequest
): Promise<ApiResponse<PropWheelUserHandNumResponseData>> {
  const endpoint = '/prop/wheel/user/handnum'
  const response = await http.post<ApiResponse<PropWheelUserHandNumResponseData>>(endpoint, payload)
  return response.data
}

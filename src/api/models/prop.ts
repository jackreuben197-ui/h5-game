// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/prop

// /api/prop/buy (PropBuy)
export interface PropBuyRequest {

    prop_id?: number;
    valid_date?: number;
    pay_price?: number;
    count?: number;
    fram_mall?: boolean;

  [key: string]: unknown
}

export interface PropBuyResponseData {
  [key: string]: unknown
}

// /api/prop/chat/prop/list (PropChatPropList)
export interface PropChatPropListRequest {

    limit?: number;
    offset?: number;
    prop_type?: number;
    prop_types?: number[];
    user_type?: number;

  [key: string]: unknown
}

export interface PropChatPropListResponseData {

    data?: PropChatPropListData;

  [key: string]: unknown
}

export interface PropChatPropListData {

    list?: PropChatPropListLableData[];

  [key: string]: unknown
}

export interface PropChatPropListLableData {

    prop_id?: number;
    prop_type?: number;
    price_id?: number;
    prop_code?: string;
    raw_price?: number;
    pay_price?: number;
    start_time?: number;
    end_time?: number;
    subscription_name?: string;
    prop_amount?: number;
    game_prop_id?: number;

  [key: string]: unknown
}

// /api/prop/chat/prop/used (PropChatPropUsed)
export interface PropChatPropUsedRequest {

    list?: PropChatPropUsedProp[];

  [key: string]: unknown
}

export interface PropChatPropUsedResponseData {
  [key: string]: unknown
}

export interface PropChatPropUsedProp {
  [key: string]: unknown
}

// /api/prop/gold/price/list (PropGoldPriceList)
export interface PropGoldPriceListRequest {
  source_type?: number;
  club_id?: number;
  gold_types?: number[];
  [key: string]: unknown
}

export interface PropGoldPriceListData {
  from_tribe?: boolean;
  limit?: number;
  offset?: number;
  total?: number;
  list?: PropGoldPriceListGoldInfo[];
  pay_types?: PropGoldPriceListPayType[];
  [key: string]: unknown
}

export interface PropGoldPriceListGoldInfo {
  id?: number;
  gold_count?: number;
  raw_price?: number;
  pay_price?: number;
  op_id?: number;
  gold_type?: number;
  pay_gold_type?: number;
  status?: number;
  sort?: number;
  source_type?: number;
  trader_type?: number;
  give_gold_count?: number;
  club_id?: number;
  tribe_id?: number;
  create_time?: string;
  update_time?: string;
  [key: string]: unknown
}

export interface PropGoldPriceListWalletAddress {
  address?: string;
  qr_code?: string;
  [key: string]: unknown
}

export interface PropGoldPriceListPayType {
  id?: number;
  name?: string;
  image?: string;
  rate?: number;
  discount?: number;
  type?: number;
  fee_type?: number;
  fee_rate?: number;
  user_recharge_min?: number;
  user_recharge_max?: number;
  increase_interval?: number;
  price_ids?: number[] | null;
  price_list?: PropGoldPriceListGoldInfo[];
  wallet_addresses?: PropGoldPriceListWalletAddress[] | null;
  [key: string]: unknown
}

// /api/prop/list (PropList)
export interface PropListRequest {

    limit?: number;
    offset?: number;
    prop_type?: number;
    prop_type_category?: number[];
    has_bag_info?: boolean;
    game_type?: number[];

  [key: string]: unknown
}

export interface PropListResponseData {

    data?: PropListData;

  [key: string]: unknown
}

export interface PropListData {

    limit?: number;
    offset?: number;
    total?: number;
    category?: PropListCategory[];
    list?: PropListProp[];

  [key: string]: unknown
}

export interface PropListCategory {

    id?: number;
    name?: string;

  [key: string]: unknown
}

export interface PropListProp {

    id?: number;
    prop_name?: string;
    prop_icon?: string;
    price?: PropListPrice[];
    prop_type_category?: number;
    special_effect_code?: string;
    prop_amount?: number;
    expired_time?: number;
    subscription_status?: number;
    subscription_ids?: number[];
    prop_property_type?: number;
    subscription_name?: string;

  [key: string]: unknown
}

export interface PropListPrice {

    raw_price?: number;
    pay_price?: number;
    valid_date?: number;

  [key: string]: unknown
}

// /api/prop/mall/goods/buy (PropMallGoodsBuy)
export interface PropMallGoodsBuyRequest {

    goods_id?: number;
    days?: number;
    count?: number;

  [key: string]: unknown
}

export interface PropMallGoodsBuyResponseData {

    data?: PropMallGoodsBuyData;

  [key: string]: unknown
}

export interface PropMallGoodsBuyData {
  [key: string]: unknown
}

// /api/prop/mall/goods/detail (PropMallGoodsDetail)
export interface PropMallGoodsDetailRequest {

    goods_id?: number;

  [key: string]: unknown
}

export interface PropMallGoodsDetailResponseData {

    data?: PropMallGoodsDetailData;

  [key: string]: unknown
}

export interface PropMallGoodsDetailData {

    detail?: PropMallGoodsDetailGoods;
    items?: PropMallGoodsDetailItem[];

  [key: string]: unknown
}

export interface PropMallGoodsDetailGoods {

    id?: number;
    banner_picture?: string;
    price?: PropMallGoodsDetailPrice[];

  [key: string]: unknown
}

export interface PropMallGoodsDetailItem {

    prop_type?: number;
    id?: number;
    chat_prop_id?: number;
    subscription_ids?: number[];
    special_effect_code?: string;
    num?: number;
    valid_date?: number;
    prop_icon?: string;
    chat_prop_code?: string;

  [key: string]: unknown
}

export interface PropMallGoodsDetailPrice {

    raw_price?: number;
    pay_price?: number;
    valid_date?: number;

  [key: string]: unknown
}

// /api/prop/mall/goods/list (PropMallGoodsList)
export interface PropMallGoodsListRequest {

    goods_type?: number;
    recommend?: number;
    limit?: number;
    offset?: number;

  [key: string]: unknown
}

export interface PropMallGoodsListResponseData {

    data?: PropMallGoodsListData;

  [key: string]: unknown
}

export interface PropMallGoodsListData {

    limit?: number;
    offset?: number;
    total?: number;
    list?: PropMallGoodsListGoods[];

  [key: string]: unknown
}

export interface PropMallGoodsListGoods {

    id?: number;
    banner_picture?: string;
    name?: string;
    goods_type?: number;
    price?: PropMallGoodsListPrice[];
    subscription_status?: number;

  [key: string]: unknown
}

export interface PropMallGoodsListPrice {

    raw_price?: number;
    pay_price?: number;

  [key: string]: unknown
}

// /api/prop/mall/pretty_id/buy (PropMallPrettyIdBuy)
export interface PropMallPrettyIdBuyRequest {

    goods_id?: number;
    club_id?: number;

  [key: string]: unknown
}

export interface PropMallPrettyIdBuyResponseData {

    data?: PropMallPrettyIdBuyData;

  [key: string]: unknown
}

export interface PropMallPrettyIdBuyData {
  [key: string]: unknown
}

// /api/prop/mall/pretty_id/list (PropMallPrettyIdList)
export interface PropMallPrettyIdListRequest {

    pretty_type?: number;
    limit?: number;
    offset?: number;
    length_type?: number;
    search?: string;

  [key: string]: unknown
}

export interface PropMallPrettyIdListResponseData {

    data?: PropMallPrettyIdListData;

  [key: string]: unknown
}

export interface PropMallPrettyIdListData {

    list?: PropMallPrettyIdListInfo[];
    limit?: number;
    offset?: number;
    total?: number;

  [key: string]: unknown
}

export interface PropMallPrettyIdListInfo {

    id?: number;
    pretty_id?: number;
    pay_price?: number;

  [key: string]: unknown
}

// /api/prop/mall/pretty_id/total (PropMallPrettyIdTotal)
export interface PropMallPrettyIdTotalRequest {
  [key: string]: unknown
}

export interface PropMallPrettyIdTotalResponseData {

    data?: PropMallPrettyIdTotalData;

  [key: string]: unknown
}

export interface PropMallPrettyIdTotalData {

    list?: PropMallPrettyIdTotalItem[];

  [key: string]: unknown
}

export interface PropMallPrettyIdTotalItem {

    length_type?: number;

  [key: string]: unknown
}

// /api/prop/share/content (PropShareContEnt)
export interface PropShareContEntRequest {

    entry_type?: number;

  [key: string]: unknown
}

export interface PropShareContEntResponseData {

    data?: PropShareContEntData;

  [key: string]: unknown
}

export interface PropShareContEntData {

    url?: string;
    type?: string;

  [key: string]: unknown
}

// /api/prop/share/done (PropShareDone)
export interface PropShareDoneRequest {

    entry_type?: number;

  [key: string]: unknown
}

export interface PropShareDoneResponseData {
  [key: string]: unknown
}

// /api/prop/share/usable (ShareUsable)
export interface ShareUsableRequest {
  [key: string]: unknown
}

export interface ShareUsableResponseData {
    data?: ShareUsableData;

  [key: string]: unknown
}

// /api/prop/shopping/apple/verifyreceipt (PropShopPingAppleVerifyReceIpt)
export interface PropShopPingAppleVerifyReceIptRequest {

    receipt_data?: string;
    order_id?: string;
    transaction_id?: string;

  [key: string]: unknown
}

export interface PropShopPingAppleVerifyReceIptResponseData {

    data?: PropShopPingAppleVerifyReceIptData;

  [key: string]: unknown
}

export interface PropShopPingAppleVerifyReceIptData {

    data?: boolean;

  [key: string]: unknown
}

// /api/prop/shopping/goods_buy (MallBuy)
export interface MallBuyRequest {
  [key: string]: unknown
}

export interface MallBuyResponseData {
    data?: MallBuyData;

  [key: string]: unknown
}

// /api/prop/shopping/goods_list (MallShopList)
export interface MallShopListRequest {
  [key: string]: unknown
}

export interface MallShopListResponseData {
    data?: MallShopListData;

  [key: string]: unknown
}

// /api/prop/shopping/google/verifyorder (PropShopPingGoogleVerifyOrder)
export interface PropShopPingGoogleVerifyOrderRequest {

    product_id?: string;
    order_id?: string;
    purchase_token?: string;

  [key: string]: unknown
}

export interface PropShopPingGoogleVerifyOrderResponseData {

    data?: PropShopPingGoogleVerifyOrderData;

  [key: string]: unknown
}

export interface PropShopPingGoogleVerifyOrderData {
  [key: string]: unknown
}

// /api/prop/sign_in/activity/detail (PropSignInActivityDetail)
export interface PropSignInActivityDetailRequest {
  [key: string]: unknown
}

export interface PropSignInActivityDetailResponseData {

    data?: PropSignInActivityDetailData;

  [key: string]: unknown
}

export interface PropSignInActivityDetailData {

    sign_in_activity?: PropSignInActivityDetailSignInActivity;
    user_sign_in_log?: PropSignInActivityDetailUserSignInLog[];

  [key: string]: unknown
}

export interface PropSignInActivityDetailUserSignInLog {

    activity_id?: number;
    activity_day?: number;
    sign_in_day?: number;
    sign_in_time?: number;
    user_sign_in_status?: unknown;

  [key: string]: unknown
}

export interface PropSignInActivityDetailSignInActivity {
  [key: string]: unknown
}

export interface PropSignInActivityDetailActivityDetail {
  [key: string]: unknown
}

export interface PropSignInActivityDetailProp {

    prop_name?: string;
    quantity?: number;
    prop_icon?: string;
    multi_lang_names_obj?: unknown;

  [key: string]: unknown
}

// /api/prop/sign_in/activity/sign_in (PropSignInActivitySignIn)
export interface PropSignInActivitySignInRequest {

    activity_id?: number;
    activity_day?: number;

  [key: string]: unknown
}

export interface PropSignInActivitySignInResponseData {

    data?: PropSignInActivitySignInData;

  [key: string]: unknown
}

export interface PropSignInActivitySignInData {
  [key: string]: unknown
}

// /api/prop/task/task_list (PropTaskList)
export interface PropTaskListRequest {

  //     type: number, // 类型ID  任务类型  1；每日任务 2：成就任务
  //     timezone: number, // 时区 0-巴西 1-utc
  //     limit: number,
  //     offset: number,
  //
  [key: string]: unknown
}

export interface PropTaskListResponseData {
  [key: string]: unknown
}

// /api/prop/task/task_receive (PropTaskReceIve)
export interface PropTaskReceIveRequest {

  //     task_id: number,
  //     timezone: number,
  //
  [key: string]: unknown
}

export interface PropTaskReceIveResponseData {

  //
  [key: string]: unknown
}

// /api/prop/test/sign_in/activity/reset (PropTestSignInActivityReset)
export interface PropTestSignInActivityResetRequest {

    activity_id?: number;
    begin_date?: string;
    signin_day?: number;

  [key: string]: unknown
}

export interface PropTestSignInActivityResetResponseData {

    data?: PropTestSignInActivityResetData;

  [key: string]: unknown
}

export interface PropTestSignInActivityResetData {
  [key: string]: unknown
}

// /api/prop/tribe_gold/price/list (PropTribeGoldPriceList)
export interface PropTribeGoldPriceListRequest {

    limit?: number;
    offset?: number;

  [key: string]: unknown
}

export interface PropTribeGoldPriceListResponseData {

    data?: PropTribeGoldPriceListData;

  [key: string]: unknown
}

export interface PropTribeGoldPriceListData {

    list?: PropTribeGoldPriceListInfo[];
    total?: number;
    limit?: number;
    offset?: number;

  [key: string]: unknown
}

export interface PropTribeGoldPriceListInfo {

    price_id?: number;
    gold_count?: number;
    raw_price?: number;
    pay_price?: number;

  [key: string]: unknown
}

// /api/prop/user_prop/current_pendant_list (BagCurrentPendantList)
export interface BagCurrentPendantListRequest {

  //     prop_type: number,
  //
  [key: string]: unknown
}

export interface BagCurrentPendantListResponseData {
  [key: string]: unknown
}

// /api/prop/user_prop/group/list (PropUserPropGroupList)
export interface PropUserPropGroupListRequest {
  [key: string]: unknown
}

export interface PropUserPropGroupListResponseData {

    data?: PropUserPropGroupListData;

  [key: string]: unknown
}

export interface PropUserPropGroupListData {
  [key: string]: unknown
}

export interface PropUserPropGroupListPropInfo {

    prop_type?: number;
    bag_num?: number;

  [key: string]: unknown
}

// /api/prop/user_prop/list (PropUserPropList)
export interface PropUserPropListRequest {

  //     prop_type: number,//道具类型(prop_type):0-全部;1-mtt门票，2-实物，3-电话卡，4-购物卡，5-代金卷 6-线下门票 7-免服务费代金券 8-充值代金券 9-金豆券 10-一元购活动券 11-道具代替劵
  //     limit: number,//条目
  //     offset: number,//开始下标。例子（offset=0，limit=10，0-9。）
  //
  [key: string]: unknown
}

export interface PropUserPropListResponseData {

  //
    data?: PropUserPropListData;

  [key: string]: unknown
}

// /api/prop/user_prop/mtt/list (RoomCenterMttGetdisCountS)
export interface RoomCenterMttGetdisCountSRequest {
  [key: string]: unknown
}

export interface RoomCenterMttGetdisCountSResponseData {

    data: RoomCenterMttGetdisCountSData[];

  [key: string]: unknown
}

export interface RoomCenterMttGetdisCountSData {

    is_free_service_charge: number; //是否免服务费
    prop_balance: string; //道具余量
    prop_property_type: number; //1 普通，2 免服务费
    wallet_balance: string; //钱包余额

  [key: string]: unknown
}

// /api/prop/user_prop/pendant_down (BagpAndantDown)
export interface BagpAndantDownRequest {

  //     prop_id: number, //道具id
  //
  [key: string]: unknown
}

export interface BagpAndantDownResponseData {

  //
  [key: string]: unknown
}

// /api/prop/user_prop/pendant_list (BagPendantList)
export interface BagPendantListRequest {

  //     prop_type: number,
  //
  [key: string]: unknown
}

export interface BagPendantListResponseData {
  [key: string]: unknown
}

// /api/prop/user_prop/pendant_up (Bagpandantup)
export interface BagpandantupRequest {

  //     prop_id: number, //道具id
  //
  [key: string]: unknown
}

export interface BagpandantupResponseData {

  //
  [key: string]: unknown
}

// /api/prop/user_prop/used (PropUserPropUsed)
export interface PropUserPropUsedRequest {
  [key: string]: unknown
}

export interface PropUserPropUsedResponseData {
    data?: PropUserPropUsedData;

  [key: string]: unknown
}

// /api/prop/user/buy_inner_prop (PropUserBuyProp)
export interface PropUserBuyPropRequest {

    prop_id?: number; //道具id
    match_id?: number; //比赛id

  [key: string]: unknown
}

export interface PropUserBuyPropResponseData {

    data: PropUserBuyPropData[];

  [key: string]: unknown
}

export interface PropUserBuyPropData {
  [key: string]: unknown
}

// /api/prop/user/check_prop_info (PropUserCheckPropInfo)
export interface PropUserCheckPropInfoRequest {

    prop_id?: number; //道具id

  [key: string]: unknown
}

export interface PropUserCheckPropInfoResponseData {

    data: PropUserCheckPropInfoData[];

  [key: string]: unknown
}

export interface PropUserCheckPropInfoData {

    is_free_service_charge: number; //是否免服务费
    prop_balance: string; //道具余量
    prop_property_type: number; //1 普通，2 免服务费
    wallet_balance: string; //钱包余额

  [key: string]: unknown
}

// /api/prop/user/offline_tickets (PropUserOfflInetIckets)
export interface PropUserOfflInetIcketsRequest {

    prop_id?: number;

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsResponseData {

    data?: PropUserOfflInetIcketsData;

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsData {

    prop_name?: string;
    offline_tickets?: PropUserOfflInetIcketsOffline_tickets_Datails;

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsOffline_tickets_Datails {

    google_addr?: string;
    waze_addr?: string;
    site?: string;
    area?: string;
    phone?: string;
    entry_certificate?: PropUserOfflInetIcketsEntry_certificate;
    announcements?: string;
    sectional_seat_list?: PropUserOfflInetIcketsSectional_seat[];

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsEntry_certificate {

    cpf?: boolean;
    id?: boolean;
    phone_num?: boolean;

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsSectional_seat {

    id?: number;
    sectional?: string;
    seat?: number;
    use_seat?: number;
    start_time?: string;
    enter_time?: string;

  [key: string]: unknown
}

// /api/prop/user/offline_tickets/gain (PropUserOfflInetIcketsGain)
export interface PropUserOfflInetIcketsGainRequest {

    prop_id?: number;
    sectional_seat_id?: number;
    certificate_type?: number;
    certificate?: string;

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsGainResponseData {

    data?: PropUserOfflInetIcketsGainData;

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsGainData {
  [key: string]: unknown
}

// /api/prop/user/offline_tickets/transfer (PropUserOfflInetIcketsTransFer)
export interface PropUserOfflInetIcketsTransFerRequest {

    prop_id?: number;
    transfer_user_random_id?: number;

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsTransFerResponseData {

    data?: PropUserOfflInetIcketsTransFerData;

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsTransFerData {
  [key: string]: unknown
}

// /api/prop/user/prop_info (PropUserPropInfo)
export interface PropUserPropInfoRequest {

    prop_id?: number;

  [key: string]: unknown
}

export interface PropUserPropInfoResponseData {

    data?: PropUserPropInfoData;

  [key: string]: unknown
}

export interface PropUserPropInfoData {

    info?: PropUserPropInfoInfo;
    prop_amount?: number;

  [key: string]: unknown
}

export interface PropUserPropInfoInfo {

    prop_name?: string;

  [key: string]: unknown
}

// /api/prop/wheel/lottery (PropWheelLottEry)
export interface PropWheelLottEryRequest {

    wheel_template_id?: number;

  [key: string]: unknown
}

export interface PropWheelLottEryResponseData {

    data?: PropWheelLottEryData;

  [key: string]: unknown
}

export interface PropWheelLottEryData {

    win_prop?: PropWheelLottEryPropInfo;

  [key: string]: unknown
}

export interface PropWheelLottEryPropInfo {

    prop_type?: number;

  [key: string]: unknown
}

// /api/prop/wheel/lottery/list (PropWheelLottEryList)
export interface PropWheelLottEryListRequest {

    wheel_template_id?: number;
    scope_type?: number;
    limit?: number;
    offset?: number;

  [key: string]: unknown
}

export interface PropWheelLottEryListResponseData {

    data?: PropWheelLottEryListData;

  [key: string]: unknown
}

export interface PropWheelLottEryListData {

    list?: PropWheelLottEryListRecord[];
    limit?: number;
    offset?: number;
    total?: number;
    isDirty?: boolean;

  [key: string]: unknown
}

export interface PropWheelLottEryListRecord {

    user_name?: string;
    u_random_id?: number;
    id?: number;
    wheel_template_id?: number;
    avatar?: string;
    prop_type?: number;
    create_time?: string;

  [key: string]: unknown
}

// /api/prop/wheel/user/handnum (PropWheelUserHandNum)
export interface PropWheelUserHandNumRequest {

    wheel_template_id?: number;
    club_id?: number;

  [key: string]: unknown
}

export interface PropWheelUserHandNumResponseData {

    data?: PropWheelUserHandNumData;

  [key: string]: unknown
}

export interface PropWheelUserHandNumData {

    hand_num?: number;
    participate_state?: number;
    wheel_template?: PropWheelUserHandNumTemplateInfo;

  [key: string]: unknown
}

export interface PropWheelUserHandNumTemplateInfo {

    id?: number;
    club_id?: number;
    tribe_id?: number;
    status?: number;
    reset_type?: number;
    all_room_template?: number;
    all_manual_room?: number;
    name?: string;
    lottery_hande_num?: number;
    start_time?: number;
    end_time?: number;
    wheel_props?: PropWheelUserHandNumRewardData[];

  [key: string]: unknown
}

export interface PropWheelUserHandNumRewardData {

    prop_type?: number;
    prop_icon?: string;
    prop_value?: number;

  [key: string]: unknown
}

export interface ShareUsableData {
    usable?: boolean;

  [key: string]: unknown
}

export interface MallBuyData {
    order_id?: string;

  [key: string]: unknown
}

export interface MallShopListData {
    list?: MallShopListItems[];
    limit?: number;
    offset?: number;
    total?: number;

  [key: string]: unknown
}

export interface MallShopListItems {
    id?: number;
    picture?: string;
    num?: number;
    price?: number;
    discount?: number;
    product_id?: string;

  [key: string]: unknown
}

export interface PropUserPropListData {
    limit?: number;
    offset?: number;
    total?: number;
    list?: PropUserPropListRecord[];

  [key: string]: unknown
}

export interface PropUserPropListRecord {
    id?: number;
    prop_id?: number;
    prop_amount?: number;
    prop_type?: number;
    use_status?: number;
    club_id?: number;
    tribe_id?: number;
    club_name?: string;
    tribe_name?: string;
    game_prop?: PropUserPropListGameProp;
    expired_time?: string;

  [key: string]: unknown
}

export interface PropUserPropListGameProp {
    id?: number;
    prop_name?: string;
    prop_type?: number;
    prop_icon?: string;
    prop_value?: number;

  [key: string]: unknown
}

export interface PropUserPropUsedData {
  [key: string]: unknown
}


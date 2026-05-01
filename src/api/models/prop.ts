// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/prop

// /api/prop/buy (PropBuy)
export interface PropBuyRequest {

    prop_id?: number; // 道具ID 1 视频特效 2 头像聊天框 3 表情 4 弹幕框 5 互动道具 6 静态桌布 7 头像 8 动态桌布
    valid_date?: number; // 有效期天数
    pay_price?: number; // 支付价格
    count?: number; // 购买数量
    fram_mall?: boolean; // 是否从商城购买

  [key: string]: unknown
}

export interface PropBuyResponseData {
  [key: string]: unknown
}

// /api/prop/chat/prop/list (PropChatPropList)
export interface PropChatPropListRequest {

    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    prop_type?: number; // 道具类型：1 表情，2 弹幕，3 聊天框
    prop_types?: number[]; // 道具类型：1 表情，2 弹幕，3 聊天框
    user_type?: number; // 用户类型排序方式： 0 默认（创建时间倒序） 1 常用 2 最近使用 3 创建时间正序 4 价格正序 5 价格倒序

  [key: string]: unknown
}

export interface PropChatPropListResponseData extends PropChatPropListData {
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

    source_type?: number; // 来源类型：1-联盟，2-玩家
    club_id?: number; // 俱乐部ID
    gold_types?: number[]; // 币种列表

  [key: string]: unknown
}

export interface PropGoldPriceListResponseData extends PropGoldPriceListData {
  [key: string]: unknown
}

export interface PropGoldPriceListData {

    limit?: number; // 条目数
    offset?: number; // 起始下标
    total?: number; // 总条目数
    list?: PropGoldPriceListGoldInfo[]; // 金币信息列表
    pay_types?: PropGoldPriceListPayType[]; // 支付方式列表
    /** 联盟直充：为 true 时订单列表走 /order/club/order_list?my_order */
    from_tribe?: boolean

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
    gold_count?: number; // 金币数量
    pay_price?: number; // 支付价格
    id?: number; // 唯一ID
    trader_type?: unknown; // 交易方类型：1-普通玩家，2-批发商
    give_gold_count?: number; // 赠送金额

  [key: string]: unknown
}

export interface PropGoldPriceListPayType {

    id?: number; // 唯一ID
    name?: string; // 名称
    image?: string; // 图标
    rate?: number; // 汇率（例如：0.0001 表示 1钻石/UC = 0.0001 货币，精确到4位小数）
    discount?: number; // 折扣优惠（例如：0.0001 表示总额减少 0.01%，精确到4位小数）
    type?: number; // 类型：1-数字钱包，2-API 3-客服撮合
    fee_type?: number; // 手续费类型：0-无手续费，1-俱乐部出，2-玩家出
    fee_rate?: number; // 手续费率（精确到0.0001）
    user_recharge_min?: number; // 玩家最小充值额度
    user_recharge_max?: number; // 玩家最大充值额度
    increase_interval?: number; // 唯一识别金额，大于0表示开启
    price_list?: PropGoldPriceListGoldInfo[]; // 金币信息列表
    price_ids?: number[];
    wallet_addresses?: unknown[]; // 钱包地址列表； 这里有用信息的是qr_code, 为的是提前预缓存二维码图片

  [key: string]: unknown
}

// /api/prop/list (PropList)
export interface PropListRequest {

    limit?: number; // 条目数
    offset?: number; // 开始下标。例子（offset=0，limit=10，0-9。）
    prop_type?: number; // 道具类型（17-视频特效）
    prop_type_category?: number[]; // 道具分类列表（0-所有）
    has_bag_info?: boolean; // 是否包含背包信息
    game_type?: number[]; // 游戏类型列表

  [key: string]: unknown
}

export interface PropListResponseData extends PropListData {
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

    id?: number; // 道具ID
    prop_name?: string; // 道具名称
    prop_icon?: string; // 道具图标
    price?: PropListPrice[]; // 价格列表
    prop_type_category?: number; // 对应 Category 里的 ID
    special_effect_code?: string; // 特效编号，例如：2_0
    prop_amount?: number; // 背包数量
    expired_time?: number; // 到期时间
    subscription_status?: number; // 会员专属（1 是，2 不是）
    subscription_ids?: number[]; // 会员 ID 列表
    prop_property_type?: number; // 道具属性类型（3 静态桌布；4 动态桌布）
    subscription_name?: string; // 会员名称

  [key: string]: unknown
}

export interface PropListPrice {

    raw_price?: number; // 原价
    pay_price?: number; // 支付价格
    valid_date?: number; // 有效期（单位：天）

  [key: string]: unknown
}

// /api/prop/mall/goods/buy (PropMallGoodsBuy)
export interface PropMallGoodsBuyRequest {

    goods_id?: number; // 商品ID，用于指定购买的商品
    days?: number; // 选择的有效期（天数）
    count?: number; // 购买数量，默认为 1

  [key: string]: unknown
}

export interface PropMallGoodsBuyResponseData extends PropMallGoodsBuyData {
  [key: string]: unknown
}

export interface PropMallGoodsBuyData {
  [key: string]: unknown
}

// /api/prop/mall/goods/detail (PropMallGoodsDetail)
export interface PropMallGoodsDetailRequest {

    goods_id?: number; // 商品ID

  [key: string]: unknown
}

export interface PropMallGoodsDetailResponseData extends PropMallGoodsDetailData {
  [key: string]: unknown
}

export interface PropMallGoodsDetailData {

    detail?: PropMallGoodsDetailGoods; // 商品详情
    items?: PropMallGoodsDetailItem[]; // 道具明细列表

  [key: string]: unknown
}

export interface PropMallGoodsDetailGoods {

    id?: number; // 商品ID
    banner_picture?: string; // 商品Banner图片地址
    price?: PropMallGoodsDetailPrice[]; // 商品价格列表

  [key: string]: unknown
}

export interface PropMallGoodsDetailItem {

    prop_type?: number; // 道具类型
    id?: number; // id
    chat_prop_id?: number; // 聊天道具Id
    subscription_ids?: number[]; // 适用的会员ID列表
    special_effect_code?: string; // 商品编号（特效代码）
    num?: number; // 数量
    valid_date?: number; // 有效天数
    prop_icon?: string; // 道具图标
    chat_prop_code?: string; // 聊天道具编码

  [key: string]: unknown
}

export interface PropMallGoodsDetailPrice {

    raw_price?: number; // 原价
    pay_price?: number; // 支付价格
    valid_date?: number; // 有效期（单位：天）

  [key: string]: unknown
}

// /api/prop/mall/goods/list (PropMallGoodsList)
export interface PropMallGoodsListRequest {

    goods_type?: number; // 商品分类：1 视频特效 2 头像聊天框 3 表情 4 弹幕框 5 互动道具 6 静态桌布 7 头像 8 动态桌布 9 活动道具
    recommend?: number; // 是否推荐，1 是；2 否
    limit?: number; // 条目数
    offset?: number; // 开始下标

  [key: string]: unknown
}

export interface PropMallGoodsListResponseData extends PropMallGoodsListData {
  [key: string]: unknown
}

export interface PropMallGoodsListData {

    limit?: number; // 条目数
    offset?: number; // 开始下标
    total?: number; // 总条数
    list?: PropMallGoodsListGoods[]; // 商品列表

  [key: string]: unknown
}

export interface PropMallGoodsListGoods {

    id?: number; // 商品ID
    banner_picture?: string; // Banner图片地址
    name?: string; // 商品名称
    goods_type?: number; // 商品分类
    price?: PropMallGoodsListPrice[]; // 商品价格列表
    subscription_status?: number; // 订阅状态，1是 2非

  [key: string]: unknown
}

export interface PropMallGoodsListPrice {

    raw_price?: number; // 原价
    pay_price?: number; // 支付价格

  [key: string]: unknown
}

// /api/prop/mall/pretty_id/buy (PropMallPrettyIdBuy)
export interface PropMallPrettyIdBuyRequest {

    goods_id?: number; // 靓号
    club_id?: number; // 俱乐部ID

  [key: string]: unknown
}

export interface PropMallPrettyIdBuyResponseData extends PropMallPrettyIdBuyData {
  [key: string]: unknown
}

export interface PropMallPrettyIdBuyData {
  [key: string]: unknown
}

// /api/prop/mall/pretty_id/list (PropMallPrettyIdList)
export interface PropMallPrettyIdListRequest {

    pretty_type?: number; // 靓号类型： 1 "AAAAB" 2 "ABBBB" 3 "AAABB" 4 "AABBB" 5 "A顺子" 6 "顺子A" 7 "豹子" 8 "顺子"
    limit?: number; // 条目数
    offset?: number; // 开始下标
    length_type?: number; // 靓号长度类型
    search?: string; // 搜索关键字

  [key: string]: unknown
}

export interface PropMallPrettyIdListResponseData extends PropMallPrettyIdListData {
  [key: string]: unknown
}

export interface PropMallPrettyIdListData {

    list?: PropMallPrettyIdListInfo[]; // 靓号信息列表
    limit?: number; // 条目数
    offset?: number; // 开始下标
    total?: number; // 总条目数

  [key: string]: unknown
}

export interface PropMallPrettyIdListInfo {

    id?: number; // 唯一ID
    pretty_id?: number; // 靓号ID
    pay_price?: number; // 支付金额

  [key: string]: unknown
}

// /api/prop/mall/pretty_id/total (PropMallPrettyIdTotal)
export interface PropMallPrettyIdTotalRequest {
  [key: string]: unknown
}

export interface PropMallPrettyIdTotalResponseData extends PropMallPrettyIdTotalData {
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

    entry_type?: number; // 入口类型： 1 - MTT赛事结果 2 - 牌桌界面牌普 3 - 牌普详情界面 4 - 牌桌界面邀请 5 - 任务列表 6 - 一元购任务列表 7 - 一元购我的奖品

  [key: string]: unknown
}

export interface PropShareContEntResponseData extends PropShareContEntData {
  [key: string]: unknown
}

export interface PropShareContEntData {

    url?: string; // 分享的图片
    type?: string; // 分享类型：link 链接；picture 图片

  [key: string]: unknown
}

// /api/prop/share/done (PropShareDone)
export interface PropShareDoneRequest {

    entry_type?: number; // 1 mtt赛事结果 2牌桌界面牌普 3牌普详情界面 4牌桌界面邀请 5任务列表 6一元购任务列表 7一元购我的奖品

  [key: string]: unknown
}

export interface PropShareDoneResponseData {
  [key: string]: unknown
}

// /api/prop/share/usable (ShareUsable)
export interface ShareUsableRequest {
    entry_type?: number; // 入口类型： 1 - MTT赛事结果 2 - 牌桌界面牌普 3 - 牌普详情界面 4 - 牌桌界面邀请 5 - 任务列表 6 - 一元购任务列表 7 - 一元购我的奖品

  [key: string]: unknown
}

export interface ShareUsableResponseData extends ShareUsableData {
  [key: string]: unknown
}

// /api/prop/shopping/apple/verifyreceipt (PropShopPingAppleVerifyReceIpt)
export interface PropShopPingAppleVerifyReceIptRequest {

    receipt_data?: string;
    order_id?: string;
    transaction_id?: string;

  [key: string]: unknown
}

export interface PropShopPingAppleVerifyReceIptResponseData extends PropShopPingAppleVerifyReceIptData {
  [key: string]: unknown
}

export interface PropShopPingAppleVerifyReceIptData {

    data?: boolean;

  [key: string]: unknown
}

// /api/prop/shopping/goods_buy (MallBuy)
export interface MallBuyRequest {
    goods_id?: number; // 商品ID

  [key: string]: unknown
}

export interface MallBuyResponseData extends MallBuyData {
  [key: string]: unknown
}

// /api/prop/shopping/goods_list (MallShopList)
export interface MallShopListRequest {
    channel?: number; // 渠道：1 - iOS渠道
    shopping_type_id?: number; // 商品类型：1 - 钻石

  [key: string]: unknown
}

export interface MallShopListResponseData extends MallShopListData {
  [key: string]: unknown
}

// /api/prop/shopping/google/verifyorder (PropShopPingGoogleVerifyOrder)
export interface PropShopPingGoogleVerifyOrderRequest {

    product_id?: string;
    order_id?: string;
    purchase_token?: string;

  [key: string]: unknown
}

export interface PropShopPingGoogleVerifyOrderResponseData extends PropShopPingGoogleVerifyOrderData {
  [key: string]: unknown
}

export interface PropShopPingGoogleVerifyOrderData {
  [key: string]: unknown
}

// /api/prop/sign_in/activity/detail (PropSignInActivityDetail)
export interface PropSignInActivityDetailRequest {
  [key: string]: unknown
}

export interface PropSignInActivityDetailResponseData extends PropSignInActivityDetailData {
  [key: string]: unknown
}

export interface PropSignInActivityDetailData {

    sign_in_activity?: PropSignInActivityDetailSignInActivity; // 活动签到
    user_sign_in_log?: PropSignInActivityDetailUserSignInLog[]; // 用户签到详情

  [key: string]: unknown
}

export interface PropSignInActivityDetailUserSignInLog {

    activity_id?: number; // 活动ID
    activity_day?: number; // 第几天
    sign_in_day?: number; // 日期
    sign_in_time?: number; // 真实签到时间
    user_sign_in_status?: unknown; // 签到状态

  [key: string]: unknown
}

export interface PropSignInActivityDetailSignInActivity {
  [key: string]: unknown
}

export interface PropSignInActivityDetailActivityDetail {
  [key: string]: unknown
}

export interface PropSignInActivityDetailProp {

    prop_name?: string; // 道具的名称
    quantity?: number; // 道具的数量
    prop_icon?: string; // 道具图标
    multi_lang_names_obj?: unknown;

  [key: string]: unknown
}

// /api/prop/sign_in/activity/sign_in (PropSignInActivitySignIn)
export interface PropSignInActivitySignInRequest {

    activity_id?: number; // 签到活动id
    activity_day?: number; // 签到第几天

  [key: string]: unknown
}

export interface PropSignInActivitySignInResponseData extends PropSignInActivitySignInData {
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

    activity_id?: number; // 签到活动id
    begin_date?: string; // 签到第一天
    signin_day?: number; // 签到第几天

  [key: string]: unknown
}

export interface PropTestSignInActivityResetResponseData extends PropTestSignInActivityResetData {
  [key: string]: unknown
}

export interface PropTestSignInActivityResetData {
  [key: string]: unknown
}

// /api/prop/tribe_gold/price/list (PropTribeGoldPriceList)
export interface PropTribeGoldPriceListRequest {

    limit?: number; // 条目数量
    offset?: number; // 开始下标

  [key: string]: unknown
}

export interface PropTribeGoldPriceListResponseData extends PropTribeGoldPriceListData {
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

    price_id?: number; // 价格ID
    gold_count?: number; // 金币数量
    raw_price?: number; // 原始价格
    pay_price?: number; // 支付价格

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

export interface PropUserPropGroupListResponseData extends PropUserPropGroupListData {
  [key: string]: unknown
}

export interface PropUserPropGroupListData {
  [key: string]: unknown
}

export interface PropUserPropGroupListPropInfo {

    prop_type?: number; // 道具类型
    bag_num?: number; // 数量

  [key: string]: unknown
}

// /api/prop/user_prop/list (PropUserPropList)
export interface PropUserPropListRequest {

  //     prop_type: number,//道具类型(prop_type):0-全部;1-mtt门票，2-实物，3-电话卡，4-购物卡，5-代金卷 6-线下门票 7-免服务费代金券 8-充值代金券 9-金豆券 10-一元购活动券 11-道具代替劵
  //     limit: number,//条目
  //     offset: number,//开始下标。例子（offset=0，limit=10，0-9。）
  //
    prop_types?: number[]; // 道具类型数组（券类用此字段） 24=转盘抽奖钻石兑换券 25=转盘抽奖UC兑换券 26=转盘抽奖手机兑换券 27=转盘抽奖电脑兑换券

  [key: string]: unknown
}

export interface PropUserPropListResponseData extends PropUserPropListData {
  [key: string]: unknown
}

// /api/prop/user_prop/mtt/list (RoomCenterMttGetdisCountS)
export interface RoomCenterMttGetdisCountSRequest {
  [key: string]: unknown
}

export type RoomCenterMttGetdisCountSResponseData = RoomCenterMttGetdisCountSData[]

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
    game_type?: number; // 游戏类型 0 - 德州（包括德州、OMAHA4、OMAHA5、OMAHA6） 4 - Fantasy 6 - 麻将 7 - 掼蛋

  [key: string]: unknown
}

export interface BagpandantupResponseData {

  //
  [key: string]: unknown
}

// /api/prop/user_prop/used (PropUserPropUsed)
export interface PropUserPropUsedRequest {
    prop_id?: number; // 道具唯一标识ID
    quantity?: number; // 道具操作数量（必须大于0）
    type?: number; // 道具操作类型： 2 - 转换为UC币 3 - 转换为平台货币 4 - 转换为IM钱包余额
    prop_bag_id?: number; // 玩家背包中道具的唯一标识ID
    recipient_name?: string; // 收货人姓名（实物道具兑换时必填）
    recipient_contact?: string; // 收货人联系方式（实物道具兑换时必填）
    recipient_address?: string; // 收货地址（实物道具兑换时必填）

  [key: string]: unknown
}

export interface PropUserPropUsedResponseData extends PropUserPropUsedData {
  [key: string]: unknown
}

// /api/prop/user/buy_inner_prop (PropUserBuyProp)
export interface PropUserBuyPropRequest {

    prop_id?: number; //道具id
    match_id?: number; //比赛id

  [key: string]: unknown
}

export type PropUserBuyPropResponseData = PropUserBuyPropData[]

export interface PropUserBuyPropData {
  [key: string]: unknown
}

// /api/prop/user/check_prop_info (PropUserCheckPropInfo)
export interface PropUserCheckPropInfoRequest {

    prop_id?: number; //道具id

  [key: string]: unknown
}

export type PropUserCheckPropInfoResponseData = PropUserCheckPropInfoData[]

export interface PropUserCheckPropInfoData {

    is_free_service_charge: number; //是否免服务费
    prop_balance: string; //道具余量
    prop_property_type: number; //1 普通，2 免服务费
    wallet_balance: string; //钱包余额

  [key: string]: unknown
}

// /api/prop/user/offline_tickets (PropUserOfflInetIckets)
export interface PropUserOfflInetIcketsRequest {

    prop_id?: number; // 道具id

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsResponseData extends PropUserOfflInetIcketsData {
  [key: string]: unknown
}

export interface PropUserOfflInetIcketsData {

    prop_name?: string; // 门票名字
    offline_tickets?: PropUserOfflInetIcketsOffline_tickets_Datails; // 线下门票详细信息

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsOffline_tickets_Datails {

    google_addr?: string; // 谷歌地图地址 URL
    waze_addr?: string; // Waze 地址 URL
    site?: string; // 站点名称
    area?: string; // 区域
    phone?: string; // 联系电话
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

    prop_id?: number; // 道具 ID
    sectional_seat_id?: number; // 所选组别 ID
    certificate_type?: number; // 所选凭证类型
    certificate?: string; // 联系方式

  [key: string]: unknown
}

export interface PropUserOfflInetIcketsGainResponseData extends PropUserOfflInetIcketsGainData {
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

export interface PropUserOfflInetIcketsTransFerResponseData extends PropUserOfflInetIcketsTransFerData {
  [key: string]: unknown
}

export interface PropUserOfflInetIcketsTransFerData {
  [key: string]: unknown
}

// /api/prop/user/prop_info (PropUserPropInfo)
export interface PropUserPropInfoRequest {

    prop_id?: number; // 道具ID

  [key: string]: unknown
}

export interface PropUserPropInfoResponseData extends PropUserPropInfoData {
  [key: string]: unknown
}

export interface PropUserPropInfoData {

    info?: PropUserPropInfoInfo; // 道具详细信息
    prop_amount?: number; // 道具数量

  [key: string]: unknown
}

export interface PropUserPropInfoInfo {

    prop_name?: string; // 道具名字（多语言）

  [key: string]: unknown
}

// /api/prop/wheel/lottery (PropWheelLottEry)
export interface PropWheelLottEryRequest {

    wheel_template_id?: number; // 轮盘模版id

  [key: string]: unknown
}

export interface PropWheelLottEryResponseData extends PropWheelLottEryData {
  [key: string]: unknown
}

export interface PropWheelLottEryData {

    win_prop?: PropWheelLottEryPropInfo;

  [key: string]: unknown
}

export interface PropWheelLottEryPropInfo {

    prop_type?: number; // 道具类型

  [key: string]: unknown
}

// /api/prop/wheel/lottery/list (PropWheelLottEryList)
export interface PropWheelLottEryListRequest {

    wheel_template_id?: number; // 轮盘模版ID
    scope_type?: number; // 查询范围类型 0 = 全部 1 = 只查询当前玩家记录
    limit?: number; // 每页条数
    offset?: number; // 开始下标

  [key: string]: unknown
}

export interface PropWheelLottEryListResponseData extends PropWheelLottEryListData {
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

    user_name?: string; // 用户名称
    u_random_id?: number; // 玩家随机Id
    id?: number; // id
    wheel_template_id?: number; // 转盘Id
    avatar?: string; // 玩家头像
    prop_type?: number; // 道具类型
    create_time?: string; // 创建时间

  [key: string]: unknown
}

// /api/prop/wheel/user/handnum (PropWheelUserHandNum)
export interface PropWheelUserHandNumRequest {

    wheel_template_id?: number; // 轮盘模板ID
    club_id?: number; // 钱包俱乐部ID

  [key: string]: unknown
}

export interface PropWheelUserHandNumResponseData extends PropWheelUserHandNumData {
  [key: string]: unknown
}

export interface PropWheelUserHandNumData {

    hand_num?: number;
    participate_state?: number;
    wheel_template?: PropWheelUserHandNumTemplateInfo;

  [key: string]: unknown
}

export interface PropWheelUserHandNumTemplateInfo {

    id?: number; // 模板ID
    club_id?: number; // 俱乐部ID
    tribe_id?: number; // 联盟Id
    status?: number; // 轮盘状态 1.上架 2.下架
    reset_type?: number; // 重置时间类型 1.不重置 2.每月1日重置 3.每周周一重置 4.每天0点重置
    all_room_template?: number; // 支持所有牌桌模版 1.开 2.关
    all_manual_room?: number; // 支持所有手动开桌房间
    name?: string; // 模板名称
    lottery_hande_num?: number; // 抽奖所需手数
    start_time?: number; // 活动开始时间（Unix时间戳，毫秒级）
    end_time?: number; // 活动结束时间（Unix时间戳，毫秒级）
    wheel_props?: PropWheelUserHandNumRewardData[]; // 抽奖道具

  [key: string]: unknown
}

export interface PropWheelUserHandNumRewardData {

    prop_type?: number; // 道具类型
    prop_icon?: string; // 道具图标URL
    prop_value?: number; // 道具数量

  [key: string]: unknown
}

export interface ShareUsableData {
    usable?: boolean; // false关闭 true打开

  [key: string]: unknown
}

export interface MallBuyData {
    order_id?: string; // 订单ID

  [key: string]: unknown
}

export interface MallShopListData {
    list?: MallShopListItems[]; // 商品列表
    limit?: number; // 条目数
    offset?: number; // 开始下标
    total?: number; // 总条数

  [key: string]: unknown
}

export interface MallShopListItems {
    id?: number; // 商品ID
    picture?: string; // 商品图片
    num?: number; // 商品数量
    price?: number; // 价格
    discount?: number; // 折扣，1-100；0表示不显示
    product_id?: string; // 商品编号，苹果使用

  [key: string]: unknown
}

export interface PropUserPropListData {
    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    total?: number; // 总条数
    list?: PropUserPropListRecord[]; // 道具记录列表

  [key: string]: unknown
}

export interface PropUserPropListRecord {
    id?: number; // 记录id
    prop_id?: number; // 道具ID
    prop_amount?: number; // 道具数量
    prop_type?: number; // 道具类型
    use_status?: number; // 使用状态（1=待使用，2=已使用，3=已退还，4=兑换中）
    club_id?: number; // 俱乐部ID
    tribe_id?: number; // 联盟ID
    club_name?: string; // 俱乐部名称
    tribe_name?: string; // 联盟名称
    game_prop?: PropUserPropListGameProp; // 道具详情
    expired_time?: string; // 道具失效时间

  [key: string]: unknown
}

export interface PropUserPropListGameProp {
    id?: number; // 道具ID
    prop_name?: string; // 道具名称
    prop_type?: number; // 道具类型 1=mtt门票，2=实物，3=电话卡，4=购物卡，5=代金卷，6=线下门票
    prop_icon?: string; // 道具图标
    prop_value?: number; // 道具实际价值

  [key: string]: unknown
}

export interface PropUserPropUsedData {
  [key: string]: unknown
}


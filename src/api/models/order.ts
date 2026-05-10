// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/order

// /api/order/club/audit/member_order (ClubFundAudit)
export interface ClubFundAuditRequest {
  order_no?: string // 订单
  audit_type?: number // 审计类型(audit_type):1-同意;2-拒绝

  [key: string]: unknown
}

export interface ClubFundAuditResponseData extends ClubFundAuditData {
  [key: string]: unknown
}

// /api/order/club/exchange (ClubFundExchange)
export interface ClubFundExchangeRequest {
  src_gold_type?: number // 源UC币类型
  dest_gold_type?: number // 兑换目标UC币类型
  src_amount?: number // 源UC币金额，单位分

  [key: string]: unknown
}

export interface ClubFundExchangeResponseData extends ClubFundExchangeData {
  [key: string]: unknown
}

// /api/order/club/exchange_rate (ExchangeRate)
export interface ExchangeRateRequest {
  [key: string]: unknown
}

export interface ExchangeRateResponseData {
  [key: string]: unknown
}

// /api/order/club/member_order/list (ClubFundApplyList)
export interface ClubFundApplyListRequest {
  order_type?: number // 请求全部，订单类型（1 申请充豆；2申请提豆；3发豆；4钱包转换） 订单状态（1-申请中,2-同意,3-拒绝,4-取消申请）
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  order_status?: number // 已审核 1

  [key: string]: unknown
}

export interface ClubFundApplyListResponseData extends ClubFundApplyListData {
  [key: string]: unknown
}

// /api/order/club/member/grant (GuildGiveRecyCle)
export interface GuildGiveRecyCleRequest {
  user_ids?: number[] // 成员ids
  gold_num?: number // 金额
  gold_type?: number // 钱包类型 1-联盟币；2全球币
  op_type?: number // 操作类型 1-发放豆 2-回收豆
  legal_tender?: number // 法币金额，单位 分
  slave_club_id?: number // 从俱乐部id

  [key: string]: unknown
}

export interface GuildGiveRecyCleResponseData {
  [key: string]: unknown
}

// /api/order/club/order_list (ClubFundOrderList)
export interface ClubFundOrderListRequest {
  my_order?: boolean // 是否是联盟直冲
  order_no?: string // 订单号
  order_type?: number // 0-全部；1-充豆；2-提豆；3-发豆；4-转换
  limit?: number
  offset?: number

  [key: string]: unknown
}

export interface ClubFundOrderListResponseData extends ClubFundOrderListData {
  [key: string]: unknown
}

// /api/order/club/recharge (RechargeGoldClub)
export interface RechargeGoldClubRequest {
  //     amount: number,
  //     gold_type: number // 1 联盟币 2 usdt
  //
  legal_tender?: number // 充值原额度

  [key: string]: unknown
}

export interface RechargeGoldClubResponseData extends RechargeGoldClubData {
  [key: string]: unknown
}

// /api/order/club/withdraw (TiquGoldClub)
export interface TiquGoldClubRequest {
  //     amount: number,
  //     gold_type: number,
  //
  [key: string]: unknown
}

export interface TiquGoldClubResponseData extends TiquGoldClubData {
  [key: string]: unknown
}

// /api/order/tribe/order_list (OrderTribeOrderList)
export interface OrderTribeOrderListRequest {
  limit?: number // 条目数量
  offset?: number // 开始下标

  [key: string]: unknown
}

export interface OrderTribeOrderListResponseData extends OrderTribeOrderListData {
  [key: string]: unknown
}

export interface OrderTribeOrderListData {
  limit?: number // 条目数量
  offset?: number // 开始下标。例子（offset=0，limit=10，0-9。）
  total?: number // 总条目数
  list?: OrderTribeOrderListClubInfo[] // 俱乐部信息列表

  [key: string]: unknown
}

export interface OrderTribeOrderListClubInfo {
  club_name?: string // 俱乐部名称
  club_random_id?: number // 俱乐部id
  tribe_name?: string // 联盟名称
  tribe_random_id?: number // 联盟id
  order_no?: string // 申请订单编号
  gold_num?: number // 金额
  club_logo?: string // 俱乐部图标
  tribe_logo?: string // 联盟头像
  club_subscription_id?: number // 俱乐部会员id

  [key: string]: unknown
}

// /api/order/tribe/order/audit (OrderTribeOrderAudit)
export interface OrderTribeOrderAuditRequest {
  order_no?: string // 申请单号
  audit_op?: number // 审批操作：1.通过 2.拒绝
  description?: string // 备注

  [key: string]: unknown
}

export interface OrderTribeOrderAuditResponseData extends OrderTribeOrderAuditData {
  [key: string]: unknown
}

export interface OrderTribeOrderAuditData {
  [key: string]: unknown
}

// /api/order/tribe/recharge (OrderTribeRecharge)
export interface OrderTribeRechargeRequest {
  club_id?: number // 俱乐部ID
  amount?: number // 金额
  gold_type?: number // 钱包类型 1-联盟币；2-全球币
  legal_tender?: number // 法币金额，单位：分

  [key: string]: unknown
}

export interface OrderTribeRechargeResponseData {
  [key: string]: unknown
}

export interface OrderTribeRechargeData {
  [key: string]: unknown
}

// /api/order/tribe/recharge_gold (OrderTribeRechargeGold)
export interface OrderTribeRechargeGoldRequest {
  price_id?: number // 价格id

  [key: string]: unknown
}

export interface OrderTribeRechargeGoldResponseData extends OrderTribeRechargeGoldData {
  [key: string]: unknown
}

export interface OrderTribeRechargeGoldData {
  [key: string]: unknown
}

// /api/order/tribe/transfer_diamond/to_tribe (OrderTribeTransFerDiamondToTribe)
export interface OrderTribeTransFerDiamondToTribeRequest {
  amount?: number // 金额数量

  [key: string]: unknown
}

export interface OrderTribeTransFerDiamondToTribeResponseData extends OrderTribeTransFerDiamondToTribeData {
  [key: string]: unknown
}

export interface OrderTribeTransFerDiamondToTribeData {
  [key: string]: unknown
}

// /api/order/tribe/transfer_diamond/to_user (OrderTribeTransFerDiamondToUser)
export interface OrderTribeTransFerDiamondToUserRequest {
  amount?: number // 金额

  [key: string]: unknown
}

export interface OrderTribeTransFerDiamondToUserResponseData extends OrderTribeTransFerDiamondToUserData {
  [key: string]: unknown
}

export interface OrderTribeTransFerDiamondToUserData {
  [key: string]: unknown
}

// /api/order/tribe/withdraw (OrderTribeWithdraw)
export interface OrderTribeWithdrawRequest {
  club_id?: number // 俱乐部ID
  amount?: number // 金额
  gold_type?: number // 钱包类型 1-联盟币；2-全球币
  legal_tender?: number // 法币金额，单位：分

  [key: string]: unknown
}

export interface OrderTribeWithdrawResponseData {
  [key: string]: unknown
}

export interface OrderTribeWithdrawData {
  [key: string]: unknown
}

// /api/order/user/club_order/cancel (OrderUserClubOrderCancel)
export interface OrderUserClubOrderCancelRequest {
  order_no?: string // 订单号

  [key: string]: unknown
}

export interface OrderUserClubOrderCancelResponseData {
  [key: string]: unknown
}

// /api/order/user/exchange (ClubPlayerExchange)
export interface ClubPlayerExchangeRequest {
  [key: string]: unknown
}

export interface ClubPlayerExchangeResponseData {
  [key: string]: unknown
}

// /api/order/user/order_records (ClubPlayerOrderRecord)
export interface ClubPlayerOrderRecordRequest {
  order_type?: number // 订单类型： 1 = 充值， 2 = 提现， 4 = 转化订单
  limit?: number // 分页条目数
  offset?: number // 分页起始位置
  order_no?: string // 订单号

  [key: string]: unknown
}

export interface ClubPlayerOrderRecordResponseData extends ClubPlayerOrderRecordData {
  [key: string]: unknown
}

// /api/order/user/recharge (RechargeGold)
export interface RechargeGoldRequest {
  amount?: number // 游戏金额
  legal_tender?: number // 法币金额
  gold_type?: number // 类型 金币类型:1-联盟币 2-usdt
  pay_id?: number // 支付渠道ID
  price_id?: number // 商品ID 与amount互斥，优先用price_id
  pay_price?: number // 支付金额 如果pay_id=0，amount忽略使用这个字段，精确到0.0001，四舍五入
  pay_address?: string // 玩家的钱包地址
  pay_address_save?: boolean // 是否保存钱包地址
  order_no?: string // 订单编号

  [key: string]: unknown
}

export interface RechargeGoldResponseData extends RechargeGoldData {
  [key: string]: unknown
}

// /api/order/user/recharge_no (OrderUserRechargeNo)
export interface OrderUserRechargeNoRequest {
  amount?: number // 充值金额（单位：分，必填）
  pay_id?: number // 支付渠道ID（必填）

  [key: string]: unknown
}

export interface OrderUserRechargeNoResponseData extends OrderUserRechargeNoData {
  [key: string]: unknown
}

export interface OrderUserRechargeNoData {
  amount?: number // 带尾数的唯一识别金额（单位：分），原始金额+尾数
  used?: boolean // 该金额是否正在被使用（true-已被使用，false-未被使用）
  price_id?: number // 自动匹配的价格配置ID（小于等于当前金额的最大联盟币价格ID，0表示未匹配）

  [key: string]: unknown
}

// /api/order/user/usdt/order/list (OrderUserUsdtOrderList)
export interface OrderUserUsdtOrderListRequest {
  order_no?: string // 订单号

  [key: string]: unknown
}

export interface OrderUserUsdtOrderListResponseData extends OrderUserUsdtOrderListData {
  [key: string]: unknown
}

export interface OrderUserUsdtOrderListData {
  list?: OrderUserUsdtOrderListOrderData[] // 订单列表

  [key: string]: unknown
}

export interface OrderUserUsdtOrderListOrderData {
  order?: OrderUserUsdtOrderListOrderInfo // 订单详情

  [key: string]: unknown
}

export interface OrderUserUsdtOrderListOrderInfo {
  status?: number // 审核状态 1 - 申请中 2 - 成功 3 - 拒绝 4 - 取消 5 - 超时

  [key: string]: unknown
}

// /api/order/user/usdt/recharge (OrderUserUsdtRecharge)
export interface OrderUserUsdtRechargeRequest {
  price_id?: number // 价格配置ID
  pay_price?: number // 支付金额，用来校验最终结果
  pay_id?: number // 支付渠道ID
  gold_count?: number // 购买数量

  [key: string]: unknown
}

export interface OrderUserUsdtRechargeResponseData extends OrderUserUsdtRechargeData {
  [key: string]: unknown
}

export interface OrderUserUsdtRechargeData {
  order?: OrderUserUsdtRechargeOrderInfo // 订单信息
  usdt_address?: OrderUserUsdtRechargePayInfo // USDT 收款地址信息

  [key: string]: unknown
}

export interface OrderUserUsdtRechargePayInfo {
  address_type?: string // 地址类型，例如 ERC、TRC
  address?: string // 钱包地址
  qr_code?: string // 收款二维码

  [key: string]: unknown
}

export interface OrderUserUsdtRechargeOrderInfo {
  gold_num?: number // 金币数量
  order_no?: string // 订单号
  amount?: number // 支付金额

  [key: string]: unknown
}

// /api/order/user/withdraw (TiquGold)
export interface TiquGoldRequest {
  amount?: number // 提现金额
  gold_type?: number // 金币类型:1-联盟币 2-usdt
  pay_id?: number // 支付渠道ID
  pay_price?: number // 支付金额
  description?: string // 备注
  club_id?: number

  [key: string]: unknown
}

export interface TiquGoldResponseData extends TiquGoldData {
  [key: string]: unknown
}

export interface ClubFundApplyListData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总条目数
  list?: ClubFundApplyListOrderInfo[]

  [key: string]: unknown
}

export interface ClubFundApplyListOrderInfo {
  club_id?: number // 俱乐部id
  order_no?: string // 订单号
  order_type?: number // 0-全部;1-充豆;2-提豆;3-发豆；4-转换
  gold_num?: number // 申请金豆
  amount?: number // 数额
  dest_gold_type?: number
  dest_amount?: number
  gold_type?: number // 币类型:1-联盟币 2-usdt
  user_random_id?: number // 玩家id
  nickname?: string // 玩家昵称
  avatar?: string // 玩家头像
  club_name?: string // 俱乐部名称
  user_desc?: string // 玩家描述
  club_logo?: string // 俱乐部图标
  currency?: string // 货币代码

  [key: string]: unknown
}

export interface ClubFundOrderListData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总条目数
  list?: ClubFundOrderListOrderInfo[]

  [key: string]: unknown
}

export interface ClubFundOrderListOrderInfo {
  order_no?: string // 订单编号
  gold_num?: number // 订单金币
  status?: number // 订单状态 （1-申请中,2-同意,3-拒绝,4-取消申请）
  create_time?: string // 创建订单时间
  dest_gold_type?: number // 目标金币类型。1 联盟币，2 USDT
  dest_amount?: number // 转换目标金额
  gold_type?: number // 原金币类型
  pay_price?: number // 支付金额
  pay_price_fee?: number // 线上支付的手续费（玩家承担的时候才有值）
  fee_rate?: number // 手续费率(fee_type = 2才显示，否则显示0) 精确到0.0001
  fee_type?: number // 手续费类型 0.无手续费 1.俱乐部出 2.玩家出 (等于2时才显示手续费率)
  pay_type_name?: string // 充值类型; 收款名称/付款名称
  pay_type_address?: string // 收款地址
  pay_address?: string // 付款地址

  [key: string]: unknown
}

export interface RechargeGoldClubData {
  more_contact?: string // 联系方式

  [key: string]: unknown
}

export interface ClubPlayerOrderRecordData {
  limit?: number // 分页条目数
  offset?: number // 分页起始位置
  total?: number // 总条目数
  list?: ClubPlayerOrderRecordOrderInfo[] // 订单列表

  [key: string]: unknown
}

export interface ClubPlayerOrderRecordOrderInfo {
  id?: number // 订单真实ID（无业务用途）
  user_id?: number // 用户真实ID（无业务用途）
  club_id?: number // 俱乐部真实ID（无业务用途）
  tribe_id?: number // 联盟真实ID（无业务用途）
  order_no?: string // 订单编号
  order_type?: number // 订单类型： 1 = 充豆， 2 = 提豆
  gold_num?: number // 订单金币数
  status?: number // 订单状态： 1 = 申请中， 2 = 同意， 3 = 拒绝， 4 = 取消申请
  audit_time?: string // 审核时间
  audit_user_id?: number // 审核人真实ID
  audit_type?: number // 审核来源： 1 = CMS， 2 = App
  create_time?: string // 创建时间
  update_time?: string // 更新时间
  desc?: string // 订单描述
  user_random_id?: number // 用户随机ID
  nickname?: string // 用户昵称
  club_random_id?: number // 俱乐部随机ID
  club_name?: string // 俱乐部名称
  tribe_random_id?: number // 联盟随机ID
  tribe_name?: string // 联盟名称
  amount?: number // 金额（用途未知）
  change_id?: number // 转换ID
  dest_gold_type?: number // 目标金币类型： 1 = 联盟币， 2 = USDT
  exchange_rate?: number // 转换汇率
  dest_amount?: number // 转换目标金额
  gold_type?: number // 原金币类型
  avatar?: string // 用户头像
  user_desc?: string // 玩家描述

  [key: string]: unknown
}

export interface RechargeGoldData {
  more_contact?: string // 联系方式
  digital_wallet_erc?: string
  digital_wallet_trc?: string
  tribe_name?: string // 联盟名称
  order_no?: string // 订单编号
  usdt_address?: OrderUserUsdtRechargePayInfo
  order?: OrderUserUsdtRechargeOrderInfo

  [key: string]: unknown
}

export interface TiquGoldData {
  api_type?: number // 1 数字钱包 2 api 3客服撮合

  [key: string]: unknown
}

export interface ClubFundAuditData {
  [key: string]: unknown
}

export interface ClubFundExchangeData {
  [key: string]: unknown
}

export interface TiquGoldClubData {
  [key: string]: unknown
}

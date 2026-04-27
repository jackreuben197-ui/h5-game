// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/order

// /api/order/club/audit/member_order (ClubFundAudit)
export interface ClubFundAuditRequest {
  [key: string]: unknown
}

export interface ClubFundAuditResponseData {
  [key: string]: unknown
}

// /api/order/club/exchange (ClubFundExchange)
export interface ClubFundExchangeRequest {
  [key: string]: unknown
}

export interface ClubFundExchangeResponseData {
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
  [key: string]: unknown
}

export interface ClubFundApplyListResponseData {
  [key: string]: unknown
}

// /api/order/club/member/grant (GuildGiveRecyCle)
export interface GuildGiveRecyCleRequest {
  [key: string]: unknown
}

export interface GuildGiveRecyCleResponseData {
  [key: string]: unknown
}

// /api/order/club/order_list (ClubFundOrderList)
export interface ClubFundOrderListRequest {

  //     order_type: number,
  //     limit?: number,
  //     offset?: number
  // 
  [key: string]: unknown
}

export interface ClubFundOrderListResponseData {
  [key: string]: unknown
}

// /api/order/club/recharge (RechargeGoldClub)
export interface RechargeGoldClubRequest {

  //     amount: number,
  //     gold_type: number // 1 联盟币 2 usdt
  // 
  [key: string]: unknown
}

export interface RechargeGoldClubResponseData {
  [key: string]: unknown
}

// /api/order/club/withdraw (TiquGoldClub)
export interface TiquGoldClubRequest {

  //     amount: number,
  //     gold_type: number,
  // 
  [key: string]: unknown
}

export interface TiquGoldClubResponseData {
  [key: string]: unknown
}

// /api/order/tribe/order_list (OrderTribeOrderList)
export interface OrderTribeOrderListRequest {

    limit?: number;
    offset?: number;

  [key: string]: unknown
}

export interface OrderTribeOrderListResponseData {

    data?: OrderTribeOrderListData;

  [key: string]: unknown
}

export interface OrderTribeOrderListData {

    limit?: number;
    offset?: number;
    total?: number;
    list?: OrderTribeOrderListClubInfo[];

  [key: string]: unknown
}

export interface OrderTribeOrderListClubInfo {

    club_name?: string;
    club_random_id?: number;
    tribe_name?: string;
    tribe_random_id?: number;
    order_no?: string;
    gold_num?: number;
    club_logo?: string;
    tribe_logo?: string;
    club_subscription_id?: number;

  [key: string]: unknown
}

// /api/order/tribe/order/audit (OrderTribeOrderAudit)
export interface OrderTribeOrderAuditRequest {

    order_no?: string;
    audit_op?: number;
    description?: string;

  [key: string]: unknown
}

export interface OrderTribeOrderAuditResponseData {

    data?: OrderTribeOrderAuditData;

  [key: string]: unknown
}

export interface OrderTribeOrderAuditData {
  [key: string]: unknown
}

// /api/order/tribe/recharge (OrderTribeRecharge)
export interface OrderTribeRechargeRequest {

    club_id?: number;
    amount?: number;
    gold_type?: number;
    legal_tender?: number;

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

    price_id?: number;

  [key: string]: unknown
}

export interface OrderTribeRechargeGoldResponseData {

    data?: OrderTribeRechargeGoldData;

  [key: string]: unknown
}

export interface OrderTribeRechargeGoldData {
  [key: string]: unknown
}

// /api/order/tribe/transfer_diamond/to_tribe (OrderTribeTransFerDiamondToTribe)
export interface OrderTribeTransFerDiamondToTribeRequest {

    amount?: number;

  [key: string]: unknown
}

export interface OrderTribeTransFerDiamondToTribeResponseData {

    data?: OrderTribeTransFerDiamondToTribeData;

  [key: string]: unknown
}

export interface OrderTribeTransFerDiamondToTribeData {
  [key: string]: unknown
}

// /api/order/tribe/transfer_diamond/to_user (OrderTribeTransFerDiamondToUser)
export interface OrderTribeTransFerDiamondToUserRequest {

    amount?: number;

  [key: string]: unknown
}

export interface OrderTribeTransFerDiamondToUserResponseData {

    data?: OrderTribeTransFerDiamondToUserData;

  [key: string]: unknown
}

export interface OrderTribeTransFerDiamondToUserData {
  [key: string]: unknown
}

// /api/order/tribe/withdraw (OrderTribeWithdraw)
export interface OrderTribeWithdrawRequest {

    club_id?: number;
    amount?: number;
    gold_type?: number;
    legal_tender?: number;

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

    order_no?: string;

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
  [key: string]: unknown
}

export interface ClubPlayerOrderRecordResponseData {
  [key: string]: unknown
}

// /api/order/user/recharge (RechargeGold)
export interface RechargeGoldRequest {
  [key: string]: unknown
}

export interface RechargeGoldResponseData {
  [key: string]: unknown
}

// /api/order/user/recharge_no (OrderUserRechargeNo)
export interface OrderUserRechargeNoRequest {

    amount?: number;
    pay_id?: number;

  [key: string]: unknown
}

export interface OrderUserRechargeNoResponseData {

    data?: OrderUserRechargeNoData;

  [key: string]: unknown
}

export interface OrderUserRechargeNoData {

    amount?: number;
    used?: boolean;
    price_id?: number;

  [key: string]: unknown
}

// /api/order/user/usdt/order/list (OrderUserUsdtOrderList)
export interface OrderUserUsdtOrderListRequest {

    order_no?: string;

  [key: string]: unknown
}

export interface OrderUserUsdtOrderListResponseData {

    data?: OrderUserUsdtOrderListData;

  [key: string]: unknown
}

export interface OrderUserUsdtOrderListData {

    list?: OrderUserUsdtOrderListOrderData[];

  [key: string]: unknown
}

export interface OrderUserUsdtOrderListOrderData {

    order?: OrderUserUsdtOrderListOrderInfo;

  [key: string]: unknown
}

export interface OrderUserUsdtOrderListOrderInfo {

    status?: number;

  [key: string]: unknown
}

// /api/order/user/usdt/recharge (OrderUserUsdtRecharge)
export interface OrderUserUsdtRechargeRequest {

    price_id?: number;
    pay_price?: number;
    pay_id?: number;
    gold_count?: number;

  [key: string]: unknown
}

export interface OrderUserUsdtRechargeResponseData {

    data?: OrderUserUsdtRechargeData;

  [key: string]: unknown
}

export interface OrderUserUsdtRechargeData {

    order?: OrderUserUsdtRechargeOrderInfo;
    usdt_address?: OrderUserUsdtRechargePayInfo;

  [key: string]: unknown
}

export interface OrderUserUsdtRechargePayInfo {

    address_type?: string;
    address?: string;
    qr_code?: string;

  [key: string]: unknown
}

export interface OrderUserUsdtRechargeOrderInfo {

    gold_num?: number;
    order_no?: string;
    amount?: number;

  [key: string]: unknown
}

// /api/order/user/withdraw (TiquGold)
export interface TiquGoldRequest {
  [key: string]: unknown
}

export interface TiquGoldResponseData {
  [key: string]: unknown
}

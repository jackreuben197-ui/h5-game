// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/pay

// /api/pay/apple/order/recharge (PayAppleOrderRecharge)
export interface PayAppleOrderRechargeRequest {

    product_id?: string; // 订单id
    amount?: number; // 支付金额
    gold_num?: number; // 金额数量

  [key: string]: unknown
}

export interface PayAppleOrderRechargeResponseData extends PayAppleOrderRechargeData {
  [key: string]: unknown
}

export interface PayAppleOrderRechargeData {

    recharge_data?: PayAppleOrderRechargeRechargeData; // 充值数据

  [key: string]: unknown
}

export interface PayAppleOrderRechargeRechargeData {

    product_id?: string; // 订单id
    order_no?: string; // 订单号
    gold_num?: number; // 充豆金额
    pay_amount?: number; // 支付金额
    receipt_md5?: string; // MD5
    transaction_no?: string; // 交易订单

  [key: string]: unknown
}

export interface PaymentInfo {
  id?: number
  account_no?: string
  pix_name?: string
  bank_name?: string
  account_type?: number    // 1=bankcard, 3=alipay, 2=wechat
  [key: string]: unknown
}

export interface PaymentInfoListRequest {
  user_id?: number
  limit?: number
  offset?: number
  account_type?: number
  [key: string]: unknown
}

export interface PaymentInfoListData {
  list?: PaymentInfo[]
  total?: number
  [key: string]: unknown
}

export interface CreatePaymentInfoRequest {
  account_no?: string
  pix_name?: string
  bank_name?: string
  account_type?: number    // 1=bankcard
  [key: string]: unknown
}


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
  account_type?: number    // 1=bankcard, 2=wechat, 3=alipay, 4=usdt, 6=wallet
  status?: number          // 1=normal, 2=deleted
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
  real_name?: string       // 收款人姓名（列表里回显为 pix_name）
  pix_name?: string
  bank_name?: string
  bank_branch?: string     // 二维码图片地址 (QR code image URL)
  account_type?: number    // 1=bankcard, 2=wechat, 3=alipay, 4=usdt, 6=wallet
  [key: string]: unknown
}

export interface PayOrderInfoRequest {
  order_type?: number
  order_no?: string
  [key: string]: unknown
}

export interface PayOrderInfoData {
  order_no?: string
  status?: number
  pay_type?: string
  payment_url?: string
  pay_address?: string
  pay_type_address?: string
  qr_code?: string
  emv?: string
  time_long?: number
  [key: string]: unknown
}

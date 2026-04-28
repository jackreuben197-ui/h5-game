// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/pay

// /api/pay/apple/order/recharge (PayAppleOrderRecharge)
export interface PayAppleOrderRechargeRequest {

    product_id?: string;
    amount?: number;
    gold_num?: number;

  [key: string]: unknown
}

export interface PayAppleOrderRechargeResponseData extends PayAppleOrderRechargeData {
  [key: string]: unknown
}

export interface PayAppleOrderRechargeData {

    recharge_data?: PayAppleOrderRechargeRechargeData;

  [key: string]: unknown
}

export interface PayAppleOrderRechargeRechargeData {

    product_id?: string;
    order_no?: string;
    gold_num?: number;
    pay_amount?: number;
    receipt_md5?: string;
    transaction_no?: string;

  [key: string]: unknown
}


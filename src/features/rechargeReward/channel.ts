import type { RechargeRewardNotification } from './model'

const RECHARGE_ORDER_SUCCEEDED_EVENT = 'h5:recharge-order-succeeded'

export interface RechargeOrderSucceededDetail {
  orderNo: string
}

export function dispatchRechargeOrderSucceeded(
  notification: RechargeRewardNotification,
): void {
  window.dispatchEvent(
    new CustomEvent<RechargeOrderSucceededDetail>(RECHARGE_ORDER_SUCCEEDED_EVENT, {
      detail: { orderNo: notification.orderNo },
    }),
  )
}

export function subscribeRechargeOrderSucceeded(
  listener: (detail: RechargeOrderSucceededDetail) => void,
): () => void {
  const handler = (event: Event) => {
    listener((event as CustomEvent<RechargeOrderSucceededDetail>).detail)
  }
  window.addEventListener(RECHARGE_ORDER_SUCCEEDED_EVENT, handler)
  return () => window.removeEventListener(RECHARGE_ORDER_SUCCEEDED_EVENT, handler)
}

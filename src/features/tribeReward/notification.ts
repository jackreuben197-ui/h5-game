import type { RechargeRewardItem } from '@/features/rechargeReward/model'

export interface RewardReceipt {
  orderNo: string
  rewardGold: number
  rewards: RechargeRewardItem[]
  source: 'recharge' | 'activity'
}
export interface TribeActivityRewardNotification extends RewardReceipt {
  source: 'activity'
  tribeId: number
  clubId: number
  rewardKind: number
  tier: number
}
export interface RewardReceiptQueue {
  current: RewardReceipt | null
  pending: RewardReceipt[]
}
export function showNextReward(queue: RewardReceiptQueue, visible: boolean): void {
  if (!queue.current && visible) queue.current = queue.pending.shift() ?? null
}
export function enqueueReward(
  queue: RewardReceiptQueue,
  receipt: RewardReceipt,
  remember: (orderNo: string) => boolean,
  visible: boolean,
): boolean {
  // 155 的奖励金额和门票是完整数据；与旧订单通知同单时补全正在展示/排队的内容。
  if (queue.current?.orderNo === receipt.orderNo) {
    const updated = receipt.source === 'activity' && queue.current.source !== 'activity'
    if (receipt.source === 'activity') queue.current = receipt
    return updated
  }
  const queued = queue.pending.findIndex((item) => item.orderNo === receipt.orderNo)
  if (queued >= 0) {
    const updated = receipt.source === 'activity' && queue.pending[queued]?.source !== 'activity'
    if (receipt.source === 'activity') queue.pending[queued] = receipt
    return updated
  }
  if (!receipt.orderNo || !remember(receipt.orderNo)) return false
  if (receipt.rewardGold <= 0 && receipt.rewards.length === 0) return true
  // 充值沿用牌局中不补弹的行为；活动奖励可在回到大厅后展示。
  if (receipt.source === 'recharge' && !visible) return true
  queue.pending.push(receipt)
  showNextReward(queue, visible)
  return true
}
export function hideRewardQueue(queue: RewardReceiptQueue): void {
  if (queue.current?.source === 'activity') queue.pending.unshift(queue.current)
  queue.current = null
  queue.pending = queue.pending.filter((item) => item.source === 'activity')
}

import { POKER_SMALL_BLINDS_BY_LEVEL } from '@/constants/pokerBlinds'
import type { RechargeRewardTier } from '@/features/rechargeReward/model'

export type ChannelCAction = 'game' | 'notice' | 'recharge' | 'invite' | 'support'
export type RewardKind = 'game' | 'recharge' | 'invite'

/** CMS 字段；道具多语言元数据沿用到账消息的解析方式。 */
export interface CmsRewardProp {
  prop_id: number
  quantity: number
  prop_value?: number
  prop_name?: string
  multi_language?: unknown
}
export interface HandRewardConfig {
  sb: number
  hand_count: number
  reward_gold: number
  rewards: CmsRewardProp[]
}
export interface InviteRewardConfig {
  invite_count: number
  reward_gold: number
  rewards: CmsRewardProp[]
}
/** 以下是展示模型，不作为服务端请求或响应契约。 */
export interface RewardTicket extends CmsRewardProp {
  name?: string
  icon?: string
  value?: number
}
export interface RewardBundle {
  reward_gold: number
  rewards: RewardTicket[]
}
export interface RewardProgress {
  current: number
  credited: boolean
  completed?: boolean
}
export interface GameRewardTier extends RewardBundle {
  completed?: boolean
  sb: number
  smallBlind: number
  blind: string
  played: number
  required: number
  credited: boolean
}
export interface InviteRewardTier extends RewardBundle {
  current?: number
  completed?: boolean
  target: number
  credited: boolean
}
export interface RechargeActivityTier extends RewardBundle {
  from: number
  to: number
}

export function buildGameRewardGroups(
  configs: readonly HandRewardConfig[],
  progress: ReadonlyMap<number, RewardProgress> = new Map(),
): GameRewardTier[][] {
  const limits = Object.values(POKER_SMALL_BLINDS_BY_LEVEL).map((blinds) =>
    Math.round(Math.max(...blinds) * 100),
  )
  const groups: GameRewardTier[][] = limits.map(() => [])
  for (const config of [...configs].sort((a, b) => a.sb - b.sb)) {
    if (!Number.isFinite(config.sb) || config.sb <= 0) continue
    const smallBlind = config.sb / 100
    const state = progress.get(config.sb)
    const group = limits.findIndex((limit) => config.sb <= limit)
    groups[group < 0 ? groups.length - 1 : group]!.push({
      sb: config.sb,
      smallBlind,
      blind: `${smallBlind}/${Number((smallBlind * 2).toFixed(2))}`,
      played: state?.current ?? 0,
      required: config.hand_count,
      credited: state?.credited ?? false,
      completed: state?.completed ?? false,
      reward_gold: config.reward_gold,
      rewards: config.rewards.map((item) => ({
        ...item,
        name: item.prop_name,
        value: (item.prop_value ?? 0) / 100,
      })),
    })
  }
  return groups
}
export function buildInviteRewardTiers(
  configs: readonly InviteRewardConfig[],
  creditedTargets: ReadonlySet<number> = new Set(),
  progress: ReadonlyMap<number, RewardProgress> = new Map(),
): InviteRewardTier[] {
  return [...configs]
    .sort((a, b) => a.invite_count - b.invite_count)
    .map((config) => ({
      target: config.invite_count,
      current: progress.get(config.invite_count)?.current ?? 0,
      completed: progress.get(config.invite_count)?.completed ?? false,
      reward_gold: config.reward_gold,
      rewards: config.rewards.map((item) => ({
        ...item,
        name: item.prop_name,
        value: (item.prop_value ?? 0) / 100,
      })),
      credited: creditedTargets.has(config.invite_count),
    }))
}
/** 钱包已经换算过金额，展示时不再次除以 100。 */
export function toRechargeActivityTiers(
  tiers: readonly RechargeRewardTier[],
): RechargeActivityTier[] {
  return tiers.map((tier) => ({
    from: tier.startAmount,
    to: tier.endAmount,
    reward_gold: tier.rewardGold ?? 0,
    rewards: tier.rewards.map((item) => ({
      prop_id: item.propId,
      quantity: item.quantity,
      name: item.propName,
      icon: item.propIcon,
      multi_language: item.multiLanguage,
      value: item.propValue,
    })),
  }))
}

export function rewardProgress(current: number, target: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return 0
  return Math.min(100, Math.max(0, (current / target) * 100))
}

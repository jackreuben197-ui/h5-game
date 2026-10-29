import { POKER_SMALL_BLINDS_BY_LEVEL } from '@/constants/pokerBlinds'
import type { RechargeRewardTier } from '@/features/rechargeReward/model'

export type ChannelCAction = 'game' | 'notice' | 'recharge' | 'invite' | 'support'
export type RewardKind = 'game' | 'recharge' | 'invite'

/** CMS 字段；道具多语言元数据沿用到账消息的解析方式。 */
export interface CmsRewardProp {
  prop_id: number
  quantity: number
  prop_value?: number
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
}
export interface GameRewardTier extends RewardBundle {
  sb: number
  smallBlind: number
  blind: string
  played: number
  required: number
  credited: boolean
}
export interface InviteRewardTier extends RewardBundle {
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
  return Object.values(POKER_SMALL_BLINDS_BY_LEVEL).map((blinds) =>
    blinds.flatMap((smallBlind) => {
      const sb = Math.round(smallBlind * 100)
      const config = configs.find((item) => item.sb === sb)
      if (!config) return []
      const state = progress.get(sb)
      return [
        {
          sb,
          smallBlind,
          blind: `${smallBlind}/${Number((smallBlind * 2).toFixed(2))}`,
          played: state?.current ?? 0,
          required: config.hand_count,
          credited: state?.credited ?? false,
          reward_gold: config.reward_gold,
          rewards: config.rewards.map((item) => ({ ...item, value: (item.prop_value ?? 0) / 100 })),
        },
      ]
    }),
  )
}
export function buildInviteRewardTiers(
  configs: readonly InviteRewardConfig[],
  creditedTargets: ReadonlySet<number> = new Set(),
): InviteRewardTier[] {
  return [...configs]
    .sort((a, b) => a.invite_count - b.invite_count)
    .map((config) => ({
      target: config.invite_count,
      reward_gold: config.reward_gold,
      rewards: config.rewards.map((item) => ({ ...item, value: (item.prop_value ?? 0) / 100 })),
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

// 客户端查询接口待服务端确认；这些仅是独立的展示数据，不调用 CMS 接口或发奖。
const previewConfigs: HandRewardConfig[] = []
const previewProgress = new Map<number, RewardProgress>()
Object.values(POKER_SMALL_BLINDS_BY_LEVEL).forEach((blinds) => {
  blinds.forEach((smallBlind, index) => {
    const sb = Math.round(smallBlind * 100)
    previewConfigs.push({
      sb,
      hand_count: [50, 12, 12, 12, 20, 24][index]!,
      reward_gold: 100,
      rewards: index === blinds.length - 1 ? [{ prop_id: 662, quantity: 3 }] : [],
    })
    previewProgress.set(sb, { current: [32, 3, 9, 12, 20, 24][index]!, credited: index >= 3 })
  })
})
export const gameRewardGroups = buildGameRewardGroups(previewConfigs, previewProgress)
export const inviteRewardMock = {
  validInvites: 12,
  tiers: buildInviteRewardTiers(
    [
      { invite_count: 10, reward_gold: 100, rewards: [] },
      { invite_count: 20, reward_gold: 500, rewards: [] },
    ],
    new Set([10]),
  ),
}
export function rewardProgress(current: number, target: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return 0
  return Math.min(100, Math.max(0, (current / target) * 100))
}

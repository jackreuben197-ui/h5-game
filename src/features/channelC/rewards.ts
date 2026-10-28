import { POKER_SMALL_BLINDS_BY_LEVEL } from '@/constants/pokerBlinds'

export type ChannelCAction = 'game' | 'notice' | 'recharge' | 'invite' | 'support'
export type RewardKind = 'game' | 'recharge' | 'invite'

export interface RewardBundle {
  coins: number
  tickets: number
  cashTickets?: number
}

export interface GameRewardTier extends RewardBundle {
  smallBlind: number
  blind: string
  played: number
  required: number
}

// 三个活动弹窗暂用原型数据，不发放奖励、不改写真实钱包或比赛报名状态。
export const gameRewardGroups: GameRewardTier[][] = Object.values(POKER_SMALL_BLINDS_BY_LEVEL).map(
  (blinds) =>
    blinds.map((smallBlind, index) => ({
      smallBlind,
      blind: `${smallBlind}/${Number((smallBlind * 2).toFixed(2))}`,
      played: [32, 3, 9, 12, 20, 24][index]!,
      required: [50, 12, 12, 12, 20, 24][index]!,
      coins: 100,
      tickets: index === blinds.length - 1 ? 3 : 0,
      cashTickets: index === blinds.length - 1 ? 1 : 0,
    })),
)

export const rechargeRewardTiers = [
  { from: 100, to: 150, coins: 0, tickets: 1 },
  { from: 150, to: 200, coins: 100, tickets: 1 },
  { from: 500, to: 700, coins: 0, tickets: 3 },
]

export const inviteRewardMock = {
  validInvites: 12,
  tiers: [
    { target: 10, coins: 100, tickets: 0 },
    { target: 20, coins: 500, tickets: 0 },
  ],
}

export function rewardProgress(current: number, target: number): number {
  return target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0
}

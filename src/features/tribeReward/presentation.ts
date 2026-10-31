import type {
  TribeRewardBundle,
  TribeRewardInfoData,
  TribeRewardProgress,
  TribeRechargeReward,
} from '@/api/models/prop'
import {
  buildGameRewardGroups,
  buildInviteRewardTiers,
  type RechargeActivityTier,
  type RewardBundle,
  type RewardProgress,
} from '@/features/channelC/rewards'

function count(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}
function bundle(value: TribeRewardBundle): RewardBundle {
  return {
    reward_gold: count(value.reward_gold),
    rewards: (Array.isArray(value.rewards) ? value.rewards : [])
      .filter((prop) => prop.prop_id > 0 && prop.quantity > 0)
      .map((prop) => ({
        ...prop,
        name: prop.prop_name,
        value: count(prop.prop_value) / 100,
      })),
  }
}
function progress(value: TribeRewardProgress): RewardProgress {
  return {
    current: count(value.current_count),
    credited: value.rewarded === true,
    completed: value.completed === true || value.earned === true,
  }
}
function rechargeTiers(rows: TribeRechargeReward[] | undefined): RechargeActivityTier[] {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    ...bundle(row),
    // 充值区间已是 UC；道具价值和盲注才使用分单位。
    from: count(row.start_amount),
    to: count(row.end_amount),
  }))
}
export function presentTribeRewards(data: TribeRewardInfoData | null) {
  const hands = (Array.isArray(data?.hand_reward) ? data.hand_reward : []).filter(
    (row) => row.sb > 0 && row.hand_count > 0,
  )
  const invites = (Array.isArray(data?.invite_reward) ? data.invite_reward : []).filter(
    (row) => row.invite_count > 0,
  )
  return {
    groups: buildGameRewardGroups(
      hands.map((row) => ({ ...row, ...bundle(row) })),
      new Map(hands.map((row) => [row.sb, progress(row)])),
    ),
    invite: {
      validInvites: Math.max(0, ...invites.map((row) => count(row.current_count))),
      tiers: buildInviteRewardTiers(
        invites.map((row) => ({ ...row, ...bundle(row) })),
        new Set(invites.filter((row) => row.rewarded === true).map((row) => row.invite_count)),
        new Map(invites.map((row) => [row.invite_count, progress(row)])),
      ),
    },
    recharge: {
      first: rechargeTiers(data?.first_recharge_reward),
      daily: rechargeTiers(data?.daily_recharge_reward),
    },
  }
}

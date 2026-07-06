<script setup lang="ts">
import { computed } from 'vue'
import { GameTable, GameTableColumn } from '@/components/Table'
import chipIcon from '@/assets/icons/icon_chips.png'
import diamondIcon from '@/assets/icons/icon_diamond.png'
import type { RoomcenterMttDetailData, RoomcenterMttRealPrize, RoomcenterMttPrize } from '@/api/models/roomcenter'
import { getLocale, t } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'

interface RewardRecord {
  rank: string
  reward: string
}

const props = defineProps<{
  data: RoomcenterMttDetailData | null
  matchId: number
  rewardData: RoomcenterMttRealPrize | null
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const mtt = computed(() => props.data?.mtt)
const isDiamond = computed(() => (mtt.value?.gold_type ?? 1) === 4)
const currencyIcon = computed(() => (isDiamond.value ? diamondIcon : chipIcon))

function fmtMoney(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  const val = isDiamond.value ? n : n / 100
  return val.toLocaleString()
}

function resolveName(rawName: string | undefined | null): string {
  if (!rawName) return ''
  return resolveTemplateTextByKey(rawName, getLocale()) || t(rawName) || rawName
}

function formatReward(item: RoomcenterMttPrize): string {
  const award = item.award ?? 0
  const goods = Array.isArray(item.goods) ? item.goods : []
  const awardStr = award > 0 ? fmtMoney(award) : ''

  let goodsStr = ''
  goods.forEach((good, index) => {
    const name = resolveName(good.na)
    const count = good.n ?? 0
    if (!name) return
    const segment = `${name} x${count}`
    if (index === 0 && award <= 0) {
      goodsStr += segment
    } else {
      goodsStr += `+${segment}`
    }
  })

  const isHunterOn = (mtt.value?.hunter_on ?? 0) > 0
  const bountyStr = t('UIReward_Bounty')

  if (!isHunterOn) {
    if (award > 0) return `${awardStr}${goodsStr}`
    return goodsStr || '-'
  }

  if (award > 0 || goodsStr) {
    return `${awardStr}${goodsStr}+${bountyStr}`
  }
  return bountyStr
}

const prizePool = computed(() => {
  const value = props.rewardData?.award ?? props.data?.real_prize?.award
  return fmtMoney(value)
})

const paidPlaces = computed(() => {
  const value = props.rewardData?.award_num ?? props.data?.real_prize?.award_num
  if (value === undefined || value === null) return '-'
  return value.toLocaleString()
})

const rewardList = computed<RewardRecord[]>(() => {
  const list = props.rewardData?.prizes ?? props.data?.real_prize?.prizes ?? []
  return list.map((item) => {
    const min = item.min ?? 0
    const max = item.max ?? 0
    return {
      rank: min > 0 ? (min === max || max <= 0 ? String(min) : `${min}-${max}`) : '-',
      reward: formatReward(item),
    }
  })
})
</script>

<template>
  <div class="mtt-rewards-tab">
    <!-- 顶部统计 -->
    <div class="rewards-stats-card">
      <div class="rewards-stat-row">
        <div class="rewards-stat-label">{{ t('UIMTT_zongjiangjin') }}</div>
        <div class="rewards-stat-value">
          <img :src="currencyIcon" class="stat-chip-icon" alt="chip" />
          <span>{{ prizePool }}</span>
        </div>
      </div>
      <div class="rewards-stat-row">
        <div class="rewards-stat-label">{{ t('MTT_State_RewardCircle') }}</div>
        <div class="rewards-stat-value">
          <span>{{ paidPlaces }}</span>
        </div>
      </div>
    </div>

    <!-- 奖励表格 -->
    <GameTable :data="rewardList" :loading="loading" height="7.2rem">
      <GameTableColumn
        prop="rank"
        :label="t('UI_Rank')"
        :flex="1"
        align="center"
      />
      <GameTableColumn
        prop="reward"
        :label="t('MTT_State_Reward')"
        :flex="2"
        align="center"
      >
        <template #default="{ row }">
          <div class="reward-cell">
            <img :src="currencyIcon" class="cell-chip-icon" alt="chip" />
            <span>{{ row.reward }}</span>
          </div>
        </template>
      </GameTableColumn>
    </GameTable>
  </div>
</template>

<style scoped lang="scss">
.mtt-rewards-tab {
  padding-top: 0.2rem;
}

/* ===== 顶部统计卡片 ===== */
.rewards-stats-card {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.4rem;
}

.rewards-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.8rem;
  height: 1.2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3.9rem;
  backdrop-filter: blur(0.16px);
}

.rewards-stat-label {
  text-align: center;
  font-size: 0.36rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}

.rewards-stat-value {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  font-size: 0.36rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 700;
  color: #fff;
}

.stat-chip-icon {
  width: 0.42rem;
  height: 0.42rem;
  vertical-align: top;

  object-fit: contain;
}

/* ===== 表格自定义 ===== */
.reward-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
}

.cell-chip-icon {
  width: 0.36rem;
  height: 0.36rem;
  object-fit: contain;
}
</style>

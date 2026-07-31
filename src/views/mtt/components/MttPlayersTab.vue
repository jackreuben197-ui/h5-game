<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { showToast } from 'vant'
import { GameTable, GameTableColumn } from '@/components/Table'
import defaultAvatar from '@/assets/icons/icon_mtt_avatar.png'
import type {
  RoomcenterMttDetailData,
  RoomcenterMttHunterRanksData,
  RoomcenterMttRanksData,
} from '@/api/models/roomcenter'
import { t } from '@/i18n'

interface PlayerRecord {
  rank: string
  name: string
  avatar: string
  rebuy: string
  chips: string
  hunter: string
  rid: number
}

type PlayersMode = 'rank' | 'hunter'

const props = defineProps<{
  data: RoomcenterMttDetailData | null
  matchId: number
  rankData: RoomcenterMttRanksData | null
  hunterData: RoomcenterMttHunterRanksData | null
  loading: boolean
  playerRequestCode: number | null
}>()

const emit = defineEmits<{
  refresh: [mode: PlayersMode]
}>()

const mode = ref<PlayersMode>('rank')

const showHunterMode = computed(() => (props.data?.mtt?.hunter_on ?? 0) === 1)
const showPlayerNullTips = computed(() => props.playerRequestCode === 10001 && !props.loading)

const isDiamond = computed(() => (props.data?.mtt?.gold_type ?? 1) === 4)

function formatNum(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  return n.toLocaleString()
}

function formatMoney(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  const val = isDiamond.value ? n : n / 100
  return val.toLocaleString()
}

function formatBb(chip: number, sb: number): string {
  if (!sb) return '0BB'
  const bb = chip / (sb * 2)
  const fixed = Number(bb.toFixed(1))
  return `${fixed}BB`
}

const currentSb = computed(() => {
  if (mode.value === 'hunter') return Number(props.hunterData?.sb ?? 0)
  return Number(props.rankData?.sb ?? 0)
})

const playerList = computed<PlayerRecord[]>(() => {
  if (mode.value === 'hunter') {
    const list = props.hunterData?.records ?? []
    return list.map((item) => ({
      rank: item.rank ? String(item.rank) : '-',
      name: item.name ?? '-',
      avatar: defaultAvatar,
      rebuy: '--',
      chips: '--',
      hunter: formatNum(item.award),
      rid: Number(item.rid ?? 0),
    }))
  }

  const list = props.rankData?.records ?? []
  const sb = currentSb.value
  return list.map((item) => {
    const chip = Number(item.chip ?? 0)
    const rawAvatar = (item as Record<string, unknown>).avatar
    const avatarUrl = typeof rawAvatar === 'string' && rawAvatar ? rawAvatar : defaultAvatar
    return {
      rank: item.rank ? String(item.rank) : '-',
      name: item.name ?? '-',
      avatar: avatarUrl,
      rebuy: (item.rebuy ?? 0) > 0 ? String(item.rebuy) : '--',
      chips: chip > 0 ? `${formatMoney(chip)}(${formatBb(chip, sb)})` : '--',
      hunter: '--',
      rid: Number(item.rid ?? 0),
    }
  })
})

const remaining = computed(() => {
  if (showPlayerNullTips.value) return '0/0'
  const alive = props.rankData?.alive ?? props.data?.alive
  const total = props.rankData?.total ?? props.data?.enter_total
  if (alive === undefined || alive === null) return '-'
  return `${alive}/${total ?? '-'}`
})

const participants = computed(() => {
  if (showPlayerNullTips.value) return '0'
  const total = props.rankData?.total ?? props.hunterData?.total ?? props.data?.enter_total
  return formatNum(total)
})

const registered = computed(() => formatNum(props.data?.mtt?.participants))

const rankRecords = computed(() =>
  Array.isArray(props.rankData?.records) ? props.rankData?.records : [],
)

const rebuyCount = computed(() => {
  const count = rankRecords.value.reduce((sum, item) => {
    return sum + (Number(item.rebuy ?? 0) > 0 ? 1 : 0)
  }, 0)
  return formatNum(count)
})

const addonCount = computed(() => {
  const count = rankRecords.value.reduce((sum, item) => {
    return sum + (item.addon === true ? 1 : 0)
  }, 0)
  return formatNum(count)
})

function canEnterTable(): boolean {
  return (props.data?.mtt?.status ?? -1) === 1
}

function handleRowClick(row: Record<string, unknown>): void {
  const rid = Number(row.rid ?? 0)
  if (!rid) return

  if (!canEnterTable()) {
    showToast(t('curr_not_enter'))
    return
  }

  // TODO: Gameplay 联调后接入真正的观战/入桌流程
  showToast(t('UIMTT_EnterTable') + " " + (rid))
}

function handleRefresh(): void {
  emit('refresh', mode.value)
}

// 切换模式时通知父组件刷新对应数据
watch(mode, () => {
  handleRefresh()
})

watch(showHunterMode, (enabled) => {
  if (!enabled && mode.value === 'hunter') {
    mode.value = 'rank'
  }
})
</script>

<template>
  <div class="mtt-players-tab">
    <!-- 排名 / 猎人榜切换 -->
    <div v-if="showHunterMode" class="mode-switch">
      <button :class="['mode-btn', { 'mode-btn--active': mode === 'rank' }]" @click="mode = 'rank'">
        {{ t('Ranking') }}
      </button>
      <button
        :class="['mode-btn', { 'mode-btn--active': mode === 'hunter' }]"
        @click="mode = 'hunter'"
      >
        {{ t('Hunter_Rank') }}
      </button>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="players-stats-card">
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-num">{{ remaining }}</div>
          <div class="stat-desc">{{ t('UIMatchRemainingPlayersCount') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ participants }}</div>
          <div class="stat-desc">{{ t('MTT_Player_Participants') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ registered }}</div>
          <div class="stat-desc">{{ t('UIMatchSignupCount') }}</div>
        </div>
      </div>
      <div class="stats-row stats-row--second">
        <div class="stat-item">
          <div class="stat-num">{{ rebuyCount }}</div>
          <div class="stat-desc">{{ t('UIMatchRebuyCount') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ addonCount }}</div>
          <div class="stat-desc">{{ t('UIMatchAddonCount') }}</div>
        </div>
      </div>
    </div>

    <!-- 玩家表格 -->
    <GameTable :data="playerList" :loading="loading" height="7.2rem" @row-click="handleRowClick">
      <GameTableColumn prop="rank" :label="t('UI_Rank')" :flex="1" align="center" />
      <GameTableColumn prop="name" :label="t('UITexasReport_player')" :flex="2" align="center">
        <template #default="{ row }">
          <div class="player-cell">
            <!-- <img :src="row.avatar" class="player-avatar" alt="avatar" /> -->
            <span>{{ row.name }}</span>
          </div>
        </template>
      </GameTableColumn>
      <GameTableColumn
        v-if="mode === 'rank'"
        prop="rebuy"
        :label="t('UITexas_Rebuy')"
        :flex="1"
        align="center"
      />
      <GameTableColumn
        v-if="mode === 'rank'"
        prop="chips"
        :label="t('UIChipsBB')"
        :flex="3"
        align="center"
      />
      <GameTableColumn
        v-if="mode === 'hunter'"
        prop="hunter"
        :label="t('UIReward_Bounty')"
        :flex="2"
        align="center"
      />
    </GameTable>

    <div v-if="showPlayerNullTips" class="player-null-tips">
      {{ t('MTTDetailPlayer_nulltips') }}
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.mode-switch {
  display: flex;
  justify-content: center;
  gap: 0.2rem;
  margin-bottom: 0.3rem;
}

.mode-btn {
  // min-width: 1.5rem;
  height: 0.7rem;
  border: none;
  padding: 0;
  margin: 0 0.5rem;
  // border-radius: 0.4rem;
  color: rgba(255, 255, 255, 1);
  background: transparent;
  font-size: 0.38rem;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light {
    color: rgba(0, 0, 0, 0.65);
  }
}

.mode-btn--active {
  color: #fff;
  border-bottom: 1px solid #fff;

  @include theme-light {
    color: #000;
    border-bottom-color: #000;
  }
}

/* ===== 顶部统计卡片 ===== */
.players-stats-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.76rem;
  padding: 0.6rem 1rem;
  margin-bottom: 0.4rem;
  backdrop-filter: blur(0.16px);

  @include theme-light {
    background: #fff;
  }
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  &--second {
    justify-content: center;
    gap: 2.2rem;
    margin-top: 0.6rem;
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 0.54rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
  line-height: 1.2;

  @include theme-light {
    color: #000;
  }
}

.stat-desc {
  font-size: 0.22rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.2;

  @include theme-light {
    color: rgba(0, 0, 0, 0.5);
  }
}

/* ===== 玩家列自定义 ===== */
.player-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
}

.player-avatar {
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 50%;
  object-fit: cover;
}

.player-null-tips {
  margin-top: 0.26rem;
  text-align: center;
  font-size: 0.24rem;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.5);

  @include theme-light {
    color: rgba(0, 0, 0, 0.5);
  }
}
</style>

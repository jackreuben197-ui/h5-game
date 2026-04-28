<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { showToast } from 'vant'
import { GameTable, GameTableColumn } from '@/components/Table'
import defaultAvatar from '@/assets/icons/icon_mtt_avatar.png'
import type {
  RoomcenterMttDetailData,
  RoomcenterMttHunterRanksData,
  RoomcenterMttRanksData,
} from '@/api/models/roomcenter'
import { postRoomcenterMttHunterRanksApi, postRoomcenterMttRanksApi } from '@/api/roomcenter'
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
}>()

const loading = ref(false)
const mode = ref<PlayersMode>('rank')
const rankData = ref<RoomcenterMttRanksData | null>(null)
const hunterData = ref<RoomcenterMttHunterRanksData | null>(null)
const playerRequestCode = ref<number | null>(null)

const showHunterMode = computed(() => (props.data?.mtt?.hunter_on ?? 0) === 1)
const showPlayerNullTips = computed(() => playerRequestCode.value === 10001 && !loading.value)

function formatNum(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  return n.toLocaleString()
}

function formatBb(chip: number, sb: number): string {
  if (!sb) return '0BB'
  const bb = chip / (sb * 2)
  const fixed = Number(bb.toFixed(1))
  return `${fixed}BB`
}

const currentSb = computed(() => {
  if (mode.value === 'hunter') return Number(hunterData.value?.sb ?? 0)
  return Number(rankData.value?.sb ?? 0)
})

const playerList = computed<PlayerRecord[]>(() => {
  if (mode.value === 'hunter') {
    const list = hunterData.value?.records ?? []
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

  const list = rankData.value?.records ?? []
  const sb = currentSb.value
  return list.map((item) => {
    const chip = Number(item.chip ?? 0)
    return {
      rank: item.rank ? String(item.rank) : '-',
      name: item.name ?? '-',
      avatar: defaultAvatar,
      rebuy: (item.rebuy ?? 0) > 0 ? String(item.rebuy) : '--',
      chips: chip > 0 ? `${formatNum(chip)}(${formatBb(chip, sb)})` : '--',
      hunter: '--',
      rid: Number(item.rid ?? 0),
    }
  })
})

function emptyRankData(): RoomcenterMttRanksData {
  return { alive: 0, total: 0, sb: 0, limit: 0, offset: 0, records: [] }
}

function emptyHunterData(): RoomcenterMttHunterRanksData {
  return { total: 0, sb: 0, limit: 0, offset: 0, records: [] }
}

const remaining = computed(() => {
  if (showPlayerNullTips.value) return '0/0'
  const alive = rankData.value?.alive ?? props.data?.alive
  const total = rankData.value?.total ?? props.data?.real_prize?.participants
  if (alive === undefined || alive === null) return '-'
  return `${alive}/${total ?? '-'}`
})

const participants = computed(() => {
  if (showPlayerNullTips.value) return '0'
  const total = rankData.value?.total ?? hunterData.value?.total ?? props.data?.mtt?.participants
  return formatNum(total)
})

const registered = computed(() => formatNum(props.data?.enter_total ?? props.data?.mtt?.participants))
const rankRecords = computed(() => (Array.isArray(rankData.value?.records) ? rankData.value?.records : []))

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
  showToast(`准备进入牌桌 ${rid}`)
}

async function loadRankList(): Promise<void> {
  if (!props.matchId) {
    rankData.value = emptyRankData()
    playerRequestCode.value = null
    return
  }

  const response = await postRoomcenterMttRanksApi(
    props.matchId,
    { limit: 200, offset: 0 },
    { suppressBusinessCodes: [10001] },
  )
  const code = Number(response.code ?? -1)
  if (Number(response.code) === 0 && response.data) {
    rankData.value = response.data
    playerRequestCode.value = null
    return
  }
  rankData.value = emptyRankData()
  playerRequestCode.value = Number.isFinite(code) ? code : -1
}

async function loadHunterList(): Promise<void> {
  if (!props.matchId || !showHunterMode.value) {
    hunterData.value = emptyHunterData()
    playerRequestCode.value = null
    return
  }

  const response = await postRoomcenterMttHunterRanksApi(
    props.matchId,
    { limit: 200, offset: 0 },
    { suppressBusinessCodes: [10001] },
  )
  const code = Number(response.code ?? -1)
  if (Number(response.code) === 0 && response.data) {
    hunterData.value = response.data
    playerRequestCode.value = null
    return
  }
  hunterData.value = emptyHunterData()
  playerRequestCode.value = Number.isFinite(code) ? code : -1
}

async function loadCurrentList(): Promise<void> {
  if (!props.matchId) {
    rankData.value = emptyRankData()
    hunterData.value = emptyHunterData()
    playerRequestCode.value = null
    return
  }

  loading.value = true
  try {
    if (mode.value === 'hunter') {
      await loadHunterList()
    } else {
      await loadRankList()
    }
  } catch {
    if (mode.value === 'hunter') {
      hunterData.value = emptyHunterData()
    } else {
      rankData.value = emptyRankData()
    }
    playerRequestCode.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadCurrentList()
})

watch(() => props.matchId, () => {
  void loadCurrentList()
})

watch(mode, () => {
  void loadCurrentList()
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
        排名榜
      </button>
      <button :class="['mode-btn', { 'mode-btn--active': mode === 'hunter' }]" @click="mode = 'hunter'">
        猎人榜
      </button>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="players-stats-card">
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-num">{{ remaining }}</div>
          <div class="stat-desc">比赛剩余人数</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ participants }}</div>
          <div class="stat-desc">参赛人次</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ registered }}</div>
          <div class="stat-desc">报名人次</div>
        </div>
      </div>
      <div class="stats-row stats-row--second">
        <div class="stat-item">
          <div class="stat-num">{{ rebuyCount }}</div>
          <div class="stat-desc">重购人次</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ addonCount }}</div>
          <div class="stat-desc">增购人次</div>
        </div>
      </div>
    </div>

    <!-- 玩家表格 -->
    <GameTable
      :data="playerList"
      :loading="loading"
      height="7.2rem"
      @row-click="handleRowClick"
    >
      <GameTableColumn
        prop="rank"
        label="名次"
        :flex="1"
        align="center"
      />
      <GameTableColumn
        prop="name"
        label="玩家"
        :flex="2"
        align="center"
      >
        <template #default="{ row }">
          <div class="player-cell">
            <img :src="row.avatar" class="player-avatar" alt="avatar" />
            <span>{{ row.name }}</span>
          </div>
        </template>
      </GameTableColumn>
      <GameTableColumn
        v-if="mode === 'rank'"
        prop="rebuy"
        label="重购"
        :flex="1"
        align="center"
      />
      <GameTableColumn
        v-if="mode === 'rank'"
        prop="chips"
        label="筹码(BB)"
        :flex="3"
        align="center"
      />
      <GameTableColumn
        v-if="mode === 'hunter'"
        prop="hunter"
        label="赏金"
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
.mtt-players-tab {
  padding-top: 0.2rem;
}

.mode-switch {
  display: flex;
  justify-content: center;
  gap: 0.2rem;
  margin-bottom: 0.3rem;
}

.mode-btn {
  min-width: 1.5rem;
  height: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 0.4rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.18);
  font-size: 0.28rem;
  font-family: 'HONOR Sans CN', sans-serif;
}

.mode-btn--active {
  color: #fff;
  border-color: #0ab8f7;
  background: rgba(10, 184, 247, 0.28);
}

/* ===== 顶部统计卡片 ===== */
.players-stats-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.76rem;
  padding: 0.4rem 0.5rem;
  margin-bottom: 0.4rem;
  backdrop-filter: blur(0.16px);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  &--second {
    justify-content: center;
    gap: 1.2rem;
    margin-top: 0.3rem;
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
}

.stat-num {
  font-size: 0.54rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
  line-height: 1.2;
}

.stat-desc {
  font-size: 0.22rem;
  font-family: 'SF Pro', 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.2;
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
}
</style>

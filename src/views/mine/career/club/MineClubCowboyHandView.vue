<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postRoomCenterHistoryListApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => t('UICareerRecord'))

import iconChips from '@/assets/icons/icon_chips.png'
import iconMttAvatar from '@/assets/icons/icon_mtt_avatar.png'
import { t } from '@/i18n'

interface CowboyPlayerResult {
  id: string
  name: string
  uid: string
  roomId: string
  matchId: string
  time: string
  amount: string
  up: boolean
}

interface CowboySummary {
  roomName: string
  roomIdText: string
  dateText: string
  gameTypeText: string
  durationText: string
  totalLotText: string
}

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const loading = ref(false)
const playerResults = ref<CowboyPlayerResult[]>([])

const summary = ref<CowboySummary>({
  roomName: 'Hand Game Name',
  roomIdText: 'ID: --',
  dateText: '--',
  gameTypeText: 'Texas Cowboy',
  durationText: '--',
  totalLotText: '0',
})

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatAmount(value: unknown): string {
  const amount = toSafeNumber(value)
  const abs = Math.abs(amount).toLocaleString('en-US')
  if (amount === 0) {
    return '0'
  }
  return amount > 0 ? `+${abs}` : `-${abs}`
}

function formatDuration(seconds: unknown): string {
  const totalSeconds = toSafeNumber(seconds)
  if (totalSeconds <= 0) {
    return '--'
  }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours <= 0) {
    return `${minutes} Min`
  }
  return `${hours} Hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} Min` : ''}`
}

function formatDate(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) {
    return raw
  }
  const timestamp = toSafeNumber(raw)
  if (timestamp <= 0) {
    return '--'
  }
  const date = new Date(timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  return date.toLocaleString('zh-CN', { hour12: false })
}

function extractList(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 4 || value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object',
    )
  }

  if (typeof value !== 'object') {
    return []
  }

  const obj = value as Record<string, unknown>
  for (const key of ['records', 'list', 'items', 'data']) {
    const nested = extractList(obj[key], depth + 1)
    if (nested.length) {
      return nested
    }
  }

  for (const nestedValue of Object.values(obj)) {
    const nested = extractList(nestedValue, depth + 1)
    if (nested.length) {
      return nested
    }
  }

  return []
}

function mapResultItem(row: Record<string, unknown>, index: number): CowboyPlayerResult {
  const roomId = String(row.room_id ?? row.id ?? '')
  const matchId = String(row.match_id ?? row.id ?? '')
  const amountValue = toSafeNumber(row.change ?? row.win_gold ?? row.profit ?? row.amount)
  return {
    id: roomId || matchId || String(index + 1),
    name: String(row.name ?? row.game_room_name ?? row.room_name ?? 'Cowboy'),
    uid: String(row.user_id ?? row.room_id ?? row.match_id ?? '--'),
    roomId,
    matchId,
    time: formatDate(row.end_time ?? row.start_time ?? row.time),
    amount: formatAmount(amountValue),
    up: amountValue >= 0,
  }
}

function mapSummary(row: Record<string, unknown>): CowboySummary {
  const roomId = String(row.room_id ?? row.match_id ?? '--')
  const totalLot = toSafeNumber(row.all_bring_in ?? row.all_bet_pot ?? row.max_bet_pot)
  return {
    roomName: String(row.game_room_name ?? row.room_name ?? 'Cowboy Room'),
    roomIdText: `ID: ${roomId}`,
    dateText: formatDate(row.end_time ?? row.start_time ?? row.time),
    gameTypeText: 'Texas Cowboy',
    durationText: formatDuration(row.player_duration),
    totalLotText: Math.abs(totalLot).toLocaleString('en-US'),
  }
}

async function fetchCowboyHistory(): Promise<void> {
  loading.value = true
  try {
    const response = await postRoomCenterHistoryListApi({
      limit: 20,
      offset: 0,
      game_types: [5],
      time_type: 1,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail4'))
    }

    const rows = extractList(response.data?.records)
    playerResults.value = rows.map((row, index) => mapResultItem(row, index))
    if (rows.length) {
      summary.value = mapSummary(rows[0])
    }
  } catch (error) {
    playerResults.value = []
    summary.value = {
      roomName: 'Hand Game Name',
      roomIdText: 'ID: --',
      dateText: '--',
      gameTypeText: 'Texas Cowboy',
      durationText: '--',
      totalLotText: '0',
    }
    const message = error instanceof Error ? error.message : t('UIClub_LoadFail4')
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function openDetail(item: CowboyPlayerResult): void {
  void router.push({
    path: '/mine/career/club/cowboy/detail',
    query: {
      room_id: item.roomId,
      match_id: item.matchId,
      time: item.time,
    },
  })
}

onMounted(() => {
  void fetchCowboyHistory()
})
</script>

<template>
  <div class="page-shell cowboy-detail-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <section class="glass-card summary-card">
        <div class="summary-top">
          <div class="summary-col">
            <div class="main">{{ summary.roomName }}</div>
            <div class="sub">{{ summary.roomIdText }}</div>
          </div>
          <div class="summary-col summary-col-right">
            <div class="main">{{ summary.dateText }}</div>
            <div class="sub">{{ summary.gameTypeText }}</div>
          </div>
        </div>

        <div class="summary-stats">
          <div class="stat-item">
            <div class="label">hand duration</div>
            <div class="value">{{ summary.durationText }}</div>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <div class="label">total lot size</div>
            <div class="value">{{ summary.totalLotText }}</div>
          </div>
        </div>
      </section>

      <section class="result-list">
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!playerResults.length" class="list-status">{{ t('UIClub_No4') }}</p>
        <article
          v-for="item in playerResults"
          :key="item.id"
          class="glass-card result-card"
          @click="openDetail(item)"
        >
          <div class="left">
            <img :src="iconMttAvatar" alt="avatar" class="avatar" />
            <div class="info">
              <div class="name">{{ item.name }}</div>
              <div class="uid">ID: {{ item.uid }}</div>
            </div>
          </div>

          <div class="right">
            <div class="amount" :class="item.up ? 'up' : 'down'">{{ item.amount }}</div>
            <img :src="iconChips" alt="chips" class="chips" />
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cowboy-detail-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 0.74rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.glass-card {
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
}

.summary-card {
  margin-top: 0.56rem;
  padding: 0.28rem 0.22rem 0.24rem;
}

.summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.18rem;
  padding: 0 0.16rem;
}

.summary-col {
  .main {
    font-size: 0.42rem;
    line-height: 1.2;
    color: #fff;
    font-weight: 500;
  }

  .sub {
    margin-top: 0.05rem;
    font-size: 0.33rem;
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.7);
  }
}

.summary-col-right {
  text-align: right;
}

.summary-stats {
  margin-top: 0.24rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.14rem 0.2rem;
}

.stat-item {
  width: 45%;
  text-align: center;

  .label {
    font-size: 0.34rem;
    line-height: 1.2;
    color: #fff;
    opacity: 0.95;
  }

  .value {
    margin-top: 0.03rem;
    font-size: 0.56rem;
    line-height: 1.1;
    color: #fff;
    font-weight: 500;
  }
}

.divider {
  width: 0.02rem;
  height: 0.7rem;
  background: rgba(255, 255, 255, 0.16);
}

.result-list {
  margin-top: 0.24rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.76;
  padding: 0.2rem 0;
}

.result-card {
  border-radius: 0.84rem;
  padding: 0.34rem 0.42rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.22rem;
}

.avatar {
  width: 1.36rem;
  height: 1.36rem;
  border-radius: 50%;
  border: 0.02rem solid rgba(255, 255, 255, 0.28);
  object-fit: cover;
}

.info {
  .name {
    font-size: 0.5rem;
    line-height: 1.2;
    font-weight: 600;
    color: #f3f3f3;
  }

  .uid {
    margin-top: 0.03rem;
    font-size: 0.32rem;
    line-height: 1.2;
    color: #aaa69e;
  }
}

.right {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.amount {
  font-size: 0.52rem;
  line-height: 1.2;
  font-weight: 600;

  &.up {
    color: #ff132b;
  }

  &.down {
    color: rgba(85, 243, 41, 1);
  }
}

.chips {
  width: 0.52rem;
  height: 0.52rem;
}

@media (max-width: 360px) {
  .cowboy-detail-page {
    padding-left: 0.46rem;
    padding-right: 0.46rem;
  }

  .result-card {
    padding-left: 0.34rem;
    padding-right: 0.34rem;
  }

  .summary-col .main,
  .info .name,
  .amount {
    font-size: 0.44rem;
  }
}
</style>

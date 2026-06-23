<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import { postRoomCenterHistoryListApi, postStatsUserStatsApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'
import { formatDateTime, toTimestampMs } from '@/utils/time'
import dayjs from 'dayjs'

interface SummaryMetric {
  label: string
  value: string
}

interface RecordCard {
  id: string
  roomName: string
  roomId: string
  hands: string
  duration: string
  endAt: string
  endDay: string
  endMonth: string
  profit: string
  isProfitPositive: boolean
}

const router = useRouter()
const userInfoStore = useUserInfoStore()

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => '牛仔战绩')

const timeTabs = ['今天', '7天', '30天']
const selectedTime = ref(timeTabs[0])
const loading = ref(false)

const summaryRows = ref<SummaryMetric[]>([
  { label: '总手数', value: '0' },
  { label: '押中率', value: '0%' },
  { label: '总押注', value: '0' },
  { label: '总盈利', value: '0' },
])

const periodProfit = ref('0')

const records = ref<RecordCard[]>([])

function profitTitle(): string {
  switch (selectedTime.value) {
    case '今天':
      return '今日收益'
    case '7天':
      return '7天收益'
    case '30天':
      return '30天收益'
    default:
      return '今日收益'
  }
}

const profitTitleText = computed(() => profitTitle())

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function resolveTimeType(): number {
  switch (selectedTime.value) {
    case '今天':
      return 1
    case '7天':
      return 2
    case '30天':
      return 3
    default:
      return 1
  }
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '--'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

function isFirstOfDate(index: number): boolean {
  if (index === 0) return true
  const current = dayjs(toTimestampMs(records.value[index].endAt))
  const prev = dayjs(toTimestampMs(records.value[index - 1].endAt))
  return current.format('YYYY-MM-DD') !== prev.format('YYYY-MM-DD')
}

function extractRecords(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 4 || value === null || value === undefined) return []

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === 'object',
    )
  }

  if (typeof value !== 'object') return []

  const obj = value as Record<string, unknown>
  for (const key of ['records', 'list', 'items', 'data']) {
    const nested = extractRecords(obj[key], depth + 1)
    if (nested.length) return nested
  }

  for (const nestedValue of Object.values(obj)) {
    const nested = extractRecords(nestedValue, depth + 1)
    if (nested.length) return nested
  }

  return []
}

function mapRecord(row: Record<string, unknown>, index: number): RecordCard {
  const change = toSafeNumber(row.Change ?? row.change ?? row.profit)
  const durationMinutes = Math.max(0, Math.round(toSafeNumber(row.play_duration) / 60))
  const endTimeRaw = row.end_time ?? row.Time
  const endTs = toTimestampMs(endTimeRaw)

  return {
    id: String(row.RoomID ?? row.room_id ?? row.MatchID ?? row.match_id ?? index + 1),
    roomName: String(row.Name ?? row.name ?? row.game_room_name ?? '--'),
    roomId: String(row.RoomID ?? row.room_id ?? row.MatchID ?? row.match_id ?? '--'),
    hands: toSafeNumber(row.hand_num ?? row.Count ?? row.count).toLocaleString('en-US'),
    duration: formatDuration(durationMinutes),
    endAt: endTs > 0 ? formatDateTime(endTimeRaw) : '--',
    endDay: endTs > 0 ? dayjs(endTs).format('DD') : '',
    endMonth: endTs > 0 ? dayjs(endTs).format('MMM') : '',
    profit: formatUC(change),
    isProfitPositive: change >= 0,
  }
}

function extractStatsFromResponse(data: unknown): void {
  const roomData = (data as Record<string, unknown>)?.room_data as
    | Record<string, unknown>
    | undefined
  if (!roomData) return

  const totalHand = toSafeNumber(roomData.total_hand)
  const cbWins = toSafeNumber(roomData.cb_wins)
  const cbBet = toSafeNumber(roomData.cb_bet)
  const totalEarn = toSafeNumber(roomData.total_earn)

  summaryRows.value = [
    { label: '总手数', value: totalHand.toLocaleString('en-US') },
    { label: '押中率', value: `${cbWins}%` },
    { label: '总押注', value: formatUC(cbBet) },
    { label: '总盈利', value: formatUC(totalEarn) },
  ]

  periodProfit.value = formatUC(totalEarn)
}

async function fetchStatsSummary(): Promise<void> {
  try {
    const response = await postStatsUserStatsApi({
      game_types: [5],
      time_type: resolveTimeType(),
      filter_type: 1,
      room_type: 0,
      ...(userInfoStore.currentClub?.club_id ? { club_id: userInfoStore.currentClub.club_id } : {}),
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载牛仔统计失败')
    }
    extractStatsFromResponse(response.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载牛仔统计失败'
    showFailToast(message)
  }
}

async function fetchCowboyRecords(): Promise<void> {
  loading.value = true
  try {
    const response = await postRoomCenterHistoryListApi({
      limit: 20,
      offset: 0,
      game_types: [5],
      time_type: resolveTimeType(),
      ...(userInfoStore.currentClub?.club_id ? { club_id: userInfoStore.currentClub.club_id } : {}),
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载牛仔战绩失败')
    }

    const rows = extractRecords(response.data?.records)
    records.value = rows.map((row, index) => mapRecord(row, index))
  } catch (error) {
    records.value = []
    const message = error instanceof Error ? error.message : '加载牛仔战绩失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

async function refreshAll(): Promise<void> {
  await Promise.all([fetchStatsSummary(), fetchCowboyRecords()])
}

function goToDetail(item: RecordCard): void {
  const roomId = Number(item.roomId.replace(/\D/g, '')) || 0
  void router.push({
    path: '/mine/career/club/cowboy/detail',
    query: {
      room_id: roomId > 0 ? String(roomId) : undefined,
      time: item.endAt,
    },
  })
}

function selectTime(tab: string): void {
  selectedTime.value = tab
  void refreshAll()
}

onMounted(() => {
  void refreshAll()
})
</script>

<template>
  <div class="page-shell cowboy-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <section class="glass-card stats-card">
        <div class="time-tabs">
          <button
            v-for="item in timeTabs"
            :key="item"
            type="button"
            class="time-tab"
            :class="{ active: selectedTime === item }"
            @click="selectTime(item)"
          >
            {{ item }}
          </button>
        </div>

        <div class="period-profit-box">
          <div class="profit-title">{{ profitTitleText }}</div>
          <div class="profit-value">{{ periodProfit }}</div>
        </div>

        <div class="summary-grid">
          <div v-for="item in summaryRows" :key="item.label" class="summary-item">
            <span class="summary-label">{{ item.label }}</span>
            <span class="summary-value">{{ item.value }}</span>
          </div>
        </div>
      </section>

      <section class="content-list">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!records.length" class="list-status">暂无牛仔战绩记录</p>
        <article
          v-for="(item, index) in records"
          :key="item.id"
          class="glass-card record-card"
          :class="{ 'is-first-of-date': isFirstOfDate(index) }"
          @click="goToDetail(item)"
        >
          <div class="timeline">
            <span v-if="isFirstOfDate(index)" class="date-label"
              >{{ item.endMonth }}<br />{{ item.endDay }}</span
            >
            <span v-else class="date-label"></span>
          </div>
          <div class="card-content">
            <div class="card-head">
              <div>{{ item.roomName }}</div>
              <div class="id">ID: {{ item.roomId }}</div>
            </div>
            <div class="line"></div>
            <div class="card-body">
              <div class="meta">
                <div>
                  <span>手数:</span>
                  <span>{{ item.hands }}</span>
                </div>
                <div>
                  <span>时长:</span>
                  <span>{{ item.duration }}</span>
                </div>
                <div>
                  <span>结束时间:</span>
                  <span>{{ item.endAt }}</span>
                </div>
              </div>
              <div class="profit" :class="{ positive: item.isProfitPositive }">
                {{ item.profit }}
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cowboy-page {
  position: relative;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 0 0.8rem;
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
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.stats-card {
  margin-top: 0.3rem;
  padding: 0.36rem 0.5rem;
}

.time-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.08rem;
  border-radius: 0.5rem;
  padding: 0.08rem;
  background: rgba(255, 255, 255, 0.2);
}

.time-tab {
  border: 0;
  border-radius: 0.42rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.40541rem;
  padding: 0.18rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.18);
    font-weight: 700;
  }
}

.summary-grid {
  margin-top: 0.24rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.2rem 0.12rem;
}

.period-profit-box {
  margin-top: 0.2rem;
  border-radius: 0.24rem;
  border: 0.02rem solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  text-align: center;
  padding: 0.18rem 0.2rem 0.2rem;

  .profit-title {
    font-size: 0.31rem;
    color: rgba(255, 255, 255, 0.78);
  }

  .profit-value {
    margin-top: 0.08rem;
    font-size: 0.62rem;
    line-height: 1;
    font-weight: 700;
    color: #4ee58f;
  }
}

.summary-item {
  min-height: 1.2rem;
  border-radius: 0.24rem;
  border: 0.02rem solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .summary-label {
    font-size: 0.29rem;
    color: rgba(255, 255, 255, 0.72);
  }

  .summary-value {
    margin-top: 0.08rem;
    font-size: 0.4rem;
    font-weight: 700;
    color: #fff;
  }
}

.content-list {
  margin-top: 0.28rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  margin: 0.2rem 0;
}

.record-card {
  padding: 0.28rem;
  display: grid;
  grid-template-columns: 0.8rem 1fr;
  gap: 0.2rem;
  position: relative;
}

.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 0.1rem;

  .date-label {
    font-size: 0.32rem;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
    line-height: 1.2;
    white-space: nowrap;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0.02rem;
    height: calc(100% - 0.3rem);
    background: rgba(255, 255, 255, 0.35);
  }
}

.record-card:not(.is-first-of-date) .timeline {
  &::after {
    background: repeating-linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.35) 0,
      rgba(255, 255, 255, 0.35) 4px,
      transparent 4px,
      transparent 8px
    );
  }
}

.record-card.is-first-of-date .timeline {
  &::after {
    background: rgba(255, 255, 255, 0.35);
  }
}

.card-content {
  .line {
    height: 0.02rem;
    background: rgba(255, 255, 255, 0.15);
    margin: 0.18rem 0;
  }
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.43rem;

  .id {
    font-size: 0.29rem;
    color: rgba(255, 255, 255, 0.78);
  }
}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.07rem;
  font-size: 0.3rem;

  div {
    display: flex;
    gap: 0.16rem;
  }
}

.profit {
  font-size: 0.54rem;
  font-weight: 700;
  color: #ff7a8f;

  &.positive {
    color: #4ee58f;
  }
}
</style>

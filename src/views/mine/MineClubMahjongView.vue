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
  matchId: string
  endDay: string
  endMonth: string
  endTimeRaw: string
  blind: string
  hands: string
  duration: string
  endAt: string
  profit: string
}

const router = useRouter()
const userInfoStore = useUserInfoStore()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => '麻将战绩')

const timeTabs = ['今天', '7天', '30天', '生涯']
const selectedTime = ref(timeTabs[0])
const loading = ref(false)

const leftMetrics = ref<SummaryMetric[]>([
  { label: '总场次', value: '0' },
  { label: '明杠', value: '0' },
])

const rightMetrics = ref<SummaryMetric[]>([
  { label: '全胜次数', value: '0' },
  { label: '暗杠', value: '0' },
])

const bottomMetrics = ref<SummaryMetric[]>([
  { label: '自摸', value: '0' },
  { label: '点炮', value: '0' },
  { label: '接炮', value: '0' },
])

const todayProfit = ref('0')

const records = ref<RecordCard[]>([])

function profitTitle(): string {
  switch (selectedTime.value) {
    case '今天': return '今日收益'
    case '7天': return '7天收益'
    case '30天': return '30天收益'
    case '生涯': return '生涯收益'
    default: return '今日收益'
  }
}

const profitTitleText = computed(() => profitTitle())

function isFirstOfDate(index: number): boolean {
  if (index === 0) return true
  const current = dayjs(toTimestampMs(records.value[index].endTimeRaw))
  const prev = dayjs(toTimestampMs(records.value[index - 1].endTimeRaw))
  return current.format('YYYY-MM-DD') !== prev.format('YYYY-MM-DD')
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatSigned(value: number): string {
  const abs = Math.abs(value).toLocaleString('en-US')
  if (value === 0) {
    return '0'
  }
  return value > 0 ? `+${abs}` : `-${abs}`
}

function formatDuration(seconds: unknown): string {
  const totalSeconds = toSafeNumber(seconds)
  if (totalSeconds <= 0) {
    return '--'
  }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours <= 0) {
    return `${minutes}m`
  }
  return `${hours}h ${minutes}m`
}

function extractRecords(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 4 || value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  }

  if (typeof value !== 'object') {
    return []
  }

  const obj = value as Record<string, unknown>
  for (const key of ['records', 'list', 'items', 'data']) {
    const nested = extractRecords(obj[key], depth + 1)
    if (nested.length) {
      return nested
    }
  }

  return []
}

function mapRecord(row: Record<string, unknown>, index: number): RecordCard {
  const roomId = String(row.RoomID ?? row.room_id ?? row.id ?? '')
  const matchId = String(row.MatchID ?? row.match_id ?? '')
  const endTimeRaw = String(row.end_time ?? row.Time ?? '')
  const endTs = toTimestampMs(endTimeRaw)
  const change = toSafeNumber(row.Change ?? row.change ?? row.profit)

  return {
    id: roomId || matchId || String(index + 1),
    roomName: String(row.Name ?? row.name ?? row.game_room_name ?? '麻将牌局'),
    roomId,
    matchId,
    endDay: endTs > 0 ? dayjs(endTs).format('DD') : '',
    endMonth: endTs > 0 ? dayjs(endTs).format('MMM') : '',
    endTimeRaw,
    blind: String(row.blinds ?? row.blind ?? row.small_blind ?? '--'),
    hands: String(toSafeNumber(row.Count ?? row.count ?? row.hand_num)),
    duration: formatDuration(row.player_duration),
    endAt: endTs > 0 ? formatDateTime(endTimeRaw) : '--',
    profit: formatSigned(change),
  }
}

function resolveTimeType(): number {
  switch (selectedTime.value) {
    case '今天': return 1
    case '7天': return 2
    case '30天': return 3
    case '生涯': return 4
    default: return 1
  }
}

function extractStatsFromResponse(data: unknown): void {
  const roomData = (data as Record<string, unknown>)?.room_data as Record<string, unknown> | undefined
  if (!roomData) return

  leftMetrics.value = [
    { label: '总场次', value: toSafeNumber(roomData.total_game_cnt).toLocaleString('en-US') },
    { label: '明杠', value: toSafeNumber(roomData.mj_exposed_kong_count).toLocaleString('en-US') },
  ]

  rightMetrics.value = [
    { label: '全胜次数', value: toSafeNumber(roomData.full_win).toLocaleString('en-US') },
    { label: '暗杠', value: toSafeNumber(roomData.mj_concealed_kong_count).toLocaleString('en-US') },
  ]

  bottomMetrics.value = [
    { label: '自摸', value: toSafeNumber(roomData.mj_win_self_draw_count).toLocaleString('en-US') },
    { label: '点炮', value: toSafeNumber(roomData.mj_lose_discard_count).toLocaleString('en-US') },
    { label: '接炮', value: toSafeNumber(roomData.mj_win_discard_count).toLocaleString('en-US') },
  ]

  todayProfit.value = formatUC(toSafeNumber(roomData.total_earn))
}

async function fetchStatsSummary(): Promise<void> {
  try {
    const response = await postStatsUserStatsApi({
      game_types: [6],
      time_type: resolveTimeType(),
      filter_type: 1,
      room_type: 0,
      ...(userInfoStore.currentClub?.club_id ? { club_id: userInfoStore.currentClub.club_id } : {}),
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载麻将汇总失败')
    }
    extractStatsFromResponse(response.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载麻将汇总失败'
    showFailToast(message)
  }
}

async function fetchMahjongHistory(): Promise<void> {
  loading.value = true
  try {
    const response = await postRoomCenterHistoryListApi({
      limit: 30,
      offset: 0,
      game_types: [6],
      time_type: resolveTimeType(),
      ...(userInfoStore.currentClub?.club_id ? { club_id: userInfoStore.currentClub.club_id } : {}),
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载麻将战绩失败')
    }

    const rawList = extractRecords(response.data?.records)
    records.value = rawList.map((row, index) => mapRecord(row, index))
  } catch (error) {
    records.value = []
    const message = error instanceof Error ? error.message : '加载麻将战绩失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

async function refreshAll(): Promise<void> {
  await Promise.all([fetchStatsSummary(), fetchMahjongHistory()])
}

function goDetail(item: RecordCard): void {
  void router.push({
    path: '/mine/club-mahjong/detail',
    query: {
      room_id: item.roomId || undefined,
      match_id: item.matchId || undefined,
    },
  })
}

function selectTimeTab(tab: string): void {
  selectedTime.value = tab
  void refreshAll()
}

onMounted(() => {
  void refreshAll()
})
</script>

<template>
  <div class="page-shell mahjong-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="glass-card stats-card">
        <div class="time-tabs">
          <button
            v-for="item in timeTabs"
            :key="item"
            type="button"
            class="time-tab"
            :class="{ active: selectedTime === item }"
            @click="selectTimeTab(item)"
          >
            {{ item }}
          </button>
        </div>

        <div class="main-metrics">
          <div class="metric-col">
            <div v-for="item in leftMetrics" :key="item.label" class="metric-item">
              <span class="metric-label">{{ item.label }}</span>
              <span class="metric-value">{{ item.value }}</span>
            </div>
          </div>

          <div class="profit-box">
            <div class="profit-inner">
              <div class="profit-title">{{ profitTitleText }} <span class="info-dot">i</span></div>
              <div class="profit-value">{{ todayProfit }}</div>
            </div>
          </div>

          <div class="metric-col right">
            <div v-for="item in rightMetrics" :key="item.label" class="metric-item">
              <span class="metric-label">{{ item.label }}</span>
              <span class="metric-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="bottom-metrics">
          <div v-for="item in bottomMetrics" :key="item.label" class="bottom-item">
            <span class="metric-label">{{ item.label }}</span>
            <span class="metric-value">{{ item.value }}</span>
          </div>
        </div>
      </section>

      <section class="list-wrap">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!records.length" class="list-status">暂无麻将战绩</p>
        <article
          v-for="(item, index) in records"
          :key="item.id"
          class="glass-card record-card"
          :class="{ 'is-first-of-date': isFirstOfDate(index) }"
          @click="goDetail(item)"
        >
          <div class="timeline">
            <span v-if="isFirstOfDate(index)" class="date-label">{{ item.endMonth }}<br />{{ item.endDay }}</span>
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
                  <span>盲注级别:</span>
                  <span>{{ item.blind }}</span>
                </div>
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
              <div class="profit" :class="{ pos: item.profit.startsWith('+') }">{{ item.profit }}</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mahjong-page {
  position: relative;
  height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.5rem;
}

.glass-card {
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
}

.glass-card > * {
  position: relative;
  z-index: 2;
}

.stats-card {
  margin-top: 0.3rem;
  padding: 0.3632rem 0.4rem 0.36739rem 0.4rem;
}

.time-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  gap: 0.1rem;
  height: 1.33rem;
  padding: 0.06rem;
  border-radius: 0.68rem;
  background: rgba(0, 0, 0, 0.2);
  margin: 0 0.53rem;
}

.time-tab {
  border: 0;
  border-radius: 0.62rem;
  background: transparent;
  color: #f9f9f9;
  opacity: 0.86;
  font-size: 0.42rem;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: rgba(249, 249, 249, 0.5);
    font-weight: 700;
    opacity: 1;
  }
}

.main-metrics {
  margin-top: 0.28rem;
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 0.2rem;
  align-items: center;
}

.metric-col {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  text-align: center;
}

.metric-col.right {
  text-align: center;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.metric-label {
  font-size: 0.27027rem;
  color: rgba(255, 255, 255, 0.74);
}

.metric-value {
  font-size: 0.35472rem;
  font-weight: 600;
}

.profit-box {
  text-align: center;
}

.profit-inner {
  border-radius: 30px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(1.5px);
  -webkit-backdrop-filter: blur(1.5px);
  box-shadow: 3.4px 4.3px 2.8px rgba(0, 0, 0, 0.05);
  padding: 0.15rem 0.4rem;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.05);
    pointer-events: none;
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 1px;
    background: linear-gradient(139deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 3;
  }

  > * {
    position: relative;
    z-index: 2;
  }

  .profit-title {
    font-size: 0.33821rem;
    display: inline-flex;
    align-items: center;
    gap: 0.08rem;
  }

  .profit-value {
    margin-top: 0.12rem;
    font-size: 0.9rem;
    font-weight: 400;
    font-family: 'Keania One', sans-serif;
    color: #ff132b;
  }
}

.info-dot {
  width: 0.26rem;
  height: 0.26rem;
  border-radius: 50%;
  border: 0.02rem solid rgba(255, 255, 255, 0.7);
  font-size: 0.2rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bottom-metrics {
  margin-top: 0.22rem;
  padding-top: 0.18rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.1rem;
}

.bottom-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.list-wrap {
  margin-top: 0.28rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.8;
  margin: 0.22rem 0;
}

.record-card {
  padding: 0.28rem;
  display: grid;
  grid-template-columns: 1.2rem 1fr;
  gap: 0.24rem;
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
  gap: 0.2rem;
}

.meta {
  display: grid;
  gap: 0.07rem;

  > div {
    font-size: 0.29rem;
    display: flex;
    gap: 0.08rem;
    color: rgba(255, 255, 255, 0.86);

    span:first-child {
      min-width: 1.4rem;
      color: rgba(255, 255, 255, 0.66);
    }
  }
}

.profit {
  align-self: center;
  font-size: 0.5rem;
  font-weight: 700;
  color: #ff8ba4;

  &.pos {
    color: #78E490;
  }
}
</style>

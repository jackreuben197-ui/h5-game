<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import { postRoomCenterHistoryListApi, postStatsUserStatsApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { formatUC } from '@/utils/roomVisibility'
import { formatDateTime, toTimestampMs } from '@/utils/time'
import dayjs from 'dayjs'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => '战绩')

interface SummaryMetric {
  label: string
  value: string
}

interface RecordCard {
  id: string
  roomName: string
  roomId: string
  blinds: string
  hands: string
  duration: string
  endAt: string
  endDay: string
  endMonth: string
  profit: string
}

const gameTabs = ['德州', '奥马哈', '短牌']
const timeTabs = ['今天', '7天', '30天']
const selectedGame = ref(gameTabs[0])
const selectedTime = ref(timeTabs[0])
const loading = ref(false)

// 统计数据（从 postStatsUserStatsApi 获取，默认值 0）
const leftMetrics = ref<SummaryMetric[]>([
  { label: '总局数', value: '0' },
  { label: '手数', value: '0' },
])

const rightMetrics = ref<SummaryMetric[]>([
  { label: '入池率', value: '0%' },
  { label: '胜率', value: '0%' },
])

const detailRowsOne = ref<SummaryMetric[]>([
  { label: '局数', value: '0' },
  { label: '总盈亏', value: '0' },
  { label: '场均战绩', value: '0' },
  { label: '摊牌胜率', value: '0%' },
])

const detailRowsTwo = ref<SummaryMetric[]>([
  { label: '翻牌前加注率', value: '0%' },
  { label: '持续下注率', value: '0%' },
  { label: '全下胜率', value: '0%' },
  { label: '激进程度', value: '0' },
])

const todayProfit = ref('0')

const records = ref<RecordCard[]>([])

// 根据当前选中的时间 tab 返回收益标题
function profitTitle(): string {
  switch (selectedTime.value) {
    case '今天': return '今天收益'
    case '7天': return '7天收益'
    case '30天': return '30天收益'
    default: return '今天收益'
  }
}

const profitTitleText = computed(() => profitTitle())

/**
 * 格式化时长：>=1小时显示 "XhXm"，<1小时显示 "Xm"
 */
function formatDuration(minutes: number): string {
  if (minutes <= 0) return '--'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

/**
 * 判断是否为某日期的第一条记录（用于 timeline 显示）
 */
function isFirstOfDate(index: number): boolean {
  if (index === 0) return true
  const current = dayjs(toTimestampMs(records.value[index].endAt))
  const prev = dayjs(toTimestampMs(records.value[index - 1].endAt))
  return current.format('YYYY-MM-DD') !== prev.format('YYYY-MM-DD')
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function resolveGameTypes(): number[] {
  if (selectedGame.value === '奥马哈') {
    return [1, 2, 3]
  }
  if (selectedGame.value === '短牌') {
    return [0]
  }
  return [0]
}

function resolveTimeType(): number {
  switch (selectedTime.value) {
    case '今天': return 1
    case '7天': return 2
    case '30天': return 3
    default: return 1
  }
}

function extractRecords(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 4 || value === null || value === undefined) return []
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
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
  const change = toSafeNumber(row.Change ?? row.profit)
  const durationMinutes = Math.max(0, Math.round(toSafeNumber(row.play_duration) / 60))
  const endTs = toTimestampMs(row.end_time)
  const endDay = endTs > 0 ? dayjs(endTs).format('DD') : ''
  const endMonth = endTs > 0 ? dayjs(endTs).format('MMM') : ''
  return {
    id: String(row.RoomID ?? row.MatchID ?? index + 1),
    roomName: String(row.Name ?? '--'),
    roomId: String(row.RoomID ?? row.MatchID ?? '--'),
    blinds: `${toSafeNumber(row.small_blind)}/${toSafeNumber(row.ante ?? 0)}`,
    hands: String(row.hand_num),
    duration: formatDuration(durationMinutes),
    endAt: endTs > 0 ? formatDateTime(row.end_time) : '--',
    endDay,
    endMonth,
    profit: formatUC(change),
  }
}

/**
 * 从 postStatsUserStatsApi 中提取统计数据
 */
function extractStatsFromResponse(data: unknown): void {
  const roomData = (data as Record<string, unknown>)?.room_data as Record<string, unknown> | undefined
  if (!roomData) return

  const totalGameCnt = toSafeNumber(roomData.total_game_cnt)
  const totalHand = toSafeNumber(roomData.total_hand)
  const totalEarn = toSafeNumber(roomData.total_earn)
  const vpip = toSafeNumber(roomData.vpip)
  const wins = toSafeNumber(roomData.wins)
  const avgEarn = formatUC(toSafeNumber(roomData.aveage_earn))
  const wtsd = toSafeNumber(roomData.wtsd)
  const prf = toSafeNumber(roomData.prf)
  const cbet = toSafeNumber(roomData.cbet)
  const allinWins = toSafeNumber(roomData.allinWins)
  const af = toSafeNumber(roomData.af)

  leftMetrics.value = [
    { label: '总局数', value: totalGameCnt.toLocaleString('en-US') },
    { label: '手数', value: totalHand.toLocaleString('en-US') },
  ]

  rightMetrics.value = [
    { label: '入池率', value: `${vpip}%` },
    { label: '胜率', value: `${wins}%` },
  ]

  detailRowsOne.value = [
    { label: '局数', value: totalGameCnt.toLocaleString('en-US') },
    { label: '总盈亏', value: formatUC(totalEarn) },
    { label: '场均战绩', value: avgEarn },
    { label: '摊牌胜率', value: `${wtsd}%` },
  ]

  detailRowsTwo.value = [
    { label: '翻牌前加注率', value: `${prf}%` },
    { label: '持续下注率', value: `${cbet}%` },
    { label: '全下胜率', value: `${allinWins}%` },
    { label: '激进程度', value: af.toLocaleString('en-US') },
  ]

  todayProfit.value = formatUC(totalEarn)
}

async function fetchStatsSummary(): Promise<void> {
  try {
    const response = await postStatsUserStatsApi({
      game_types: resolveGameTypes(),
      poker_types: selectedGame.value === '短牌' ? [2] : [0],
      time_type: resolveTimeType(),
      filter_type: 1, // 默认联盟币
      room_type: 1, // 朋友桌
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载统计数据失败')
    }
    extractStatsFromResponse(response.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载统计数据失败'
    showFailToast(message)
  }
}

async function fetchFriendsRecords(): Promise<void> {
  loading.value = true
  try {
    const response = await postRoomCenterHistoryListApi({
      limit: 20,
      offset: 0,
      game_types: resolveGameTypes(),
      poker_types: selectedGame.value === '短牌' ? [2] : [0],
      time_type: resolveTimeType(),
      room_type: 1, // 朋友桌
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载战绩失败')
    }

    const rows = extractRecords(response.data?.records)
    records.value = rows.map((row, index) => mapRecord(row, index))
  } catch (error) {
    records.value = []
    const message = error instanceof Error ? error.message : '加载战绩失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

async function refreshAll(): Promise<void> {
  await Promise.all([fetchStatsSummary(), fetchFriendsRecords()])
}

function goToDetail(item: RecordCard): void {
  const roomId = Number(item.roomId.replace(/\D/g, '')) || 0
  void router.push({
    path: '/mine/friends-record/detail',
    query: {
      room_id: roomId > 0 ? String(roomId) : undefined,
      id: item.roomId,
    },
  })
}

function selectGame(tab: string): void {
  selectedGame.value = tab
  void refreshAll()
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
  <div class="page-shell record-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <div class="game-tabs">
        <button
          v-for="item in gameTabs"
          :key="item"
          type="button"
          class="plain-tab"
          :class="{ active: selectedGame === item }"
          @click="selectGame(item)"
        >
          {{ item }}
        </button>
      </div>

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

        <div class="main-metrics">
          <div class="metric-col">
            <div v-for="item in leftMetrics" :key="item.label" class="metric-item">
              <span class="metric-label">{{ item.label }}</span>
              <span class="metric-value">{{ item.value }}</span>
            </div>
          </div>

          <div class="profit-box">
            <div class="profit-inner">
              <div class="profit-title">{{ profitTitleText }}</div>
              <div :class="['profit-value', { pos: todayProfit.startsWith('-') }]">{{ todayProfit }}</div>
            </div>
          </div>

          <div class="metric-col right">
            <div v-for="item in rightMetrics" :key="item.label" class="metric-item">
              <span class="metric-label">{{ item.label }}</span>
              <span class="metric-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-row">
            <div v-for="item in detailRowsOne" :key="item.label" class="detail-cell">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </div>
          </div>
          <div class="line"></div>
          <div class="detail-row">
            <div v-for="item in detailRowsTwo" :key="item.label" class="detail-cell">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="content-list">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!records.length" class="list-status">暂无战绩记录</p>
        <article
          v-for="(item, index) in records"
          :key="item.id"
          class="glass-card record-card"
          :class="{ 'is-first-of-date': isFirstOfDate(index) }"
          @click="goToDetail(item)"
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
                  <span>{{ item.blinds }}</span>
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
              <div class="profit" :class="{ pos: item.profit.startsWith('-') }">{{ item.profit }}</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.record-page {
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
  padding: 0 0.49rem;
}

.game-tabs {
  margin-top: 0.38rem;
  display: flex;
  justify-content: space-around;
}

.plain-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.42rem;
  padding: 0.05rem 0;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.92);
  }
}

.glass-card {
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
}

.stats-card {
  margin-top: 0.3rem;
  padding: 0.3632rem 0.3rem 0.36739rem 0.3rem;
}

.time-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
    font-weight: 600;
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
  }

  .profit-value {
    margin-top: 0.12rem;
    font-size: 0.9rem;
    font-weight: 400;
    font-family: 'Keania One', sans-serif;
    color: #ff132b;

    &.pos {
      color: #4ee58f;
    }
  }
}

.detail-grid {
  margin-top: 0.22rem;
  padding-top: 0.18rem;

  .line {
    display: none;
  }
}

.detail-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.1rem;
  margin-bottom: 0.1rem;
}

.detail-cell {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;

  .label {
    font-size: 0.27027rem;
    color: rgba(255, 255, 255, 0.74);
  }

  .value {
    font-size: 0.35472rem;
    font-weight: 600;
  }
}

.content-list {
  margin-top: 0.28rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  position: relative;
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

// 同一天的非第一条记录：只显示虚线
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

// 第一条记录：显示实线
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

  &.pos {
    color: #4ee58f;
  }
}
</style>

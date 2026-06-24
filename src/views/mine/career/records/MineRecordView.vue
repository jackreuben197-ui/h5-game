<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postRoomCenterHistoryListApi, postStatsUserStatsApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { formatUC } from '@/utils/roomVisibility'
import { formatDateTime, toTimestampMs } from '@/utils/time'
import { localStore } from '@/utils/localStore'
import { userCache } from '@/utils/userCache'
import { USER_STORE_CAREER } from '@/utils/indexedDB'
import { useGameStore } from '@/stores/game'
import dayjs from 'dayjs'
import { t } from '@/i18n'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

// 路由参数 source 决定数据来源：'club' = 俱乐部生涯，'friends' = 朋友桌生涯。
// 共享同一组组件 + API 与缓存通道；下面所有 buildXxxParams 都根据 source 分支。
const source = computed<'club' | 'friends'>(() =>
  route.params.source === 'friends' ? 'friends' : 'club',
)
const isClub = computed(() => source.value === 'club')

// 生涯页选择的俱乐部 id 持久化在 localStorage 的 dzpk_h5_CAREER_SELECTED_CLUB_ID。
// 'all' 或缺失表示"全部"，返回 0；否则解析为数字 club_id。
// 对齐 Unity CareerRecordPart：「全部」必须显式传 club_id=0，省略字段时服务端会回上一次的俱乐部数据（页面刷新后该值会回到用户信息的 club_id）。
// 仅 source=club 使用；friends 端忽略 club_id。
function getCareerSelectedClubId(): number {
  const stored = localStore.getItem<string>('CAREER_SELECTED_CLUB_ID', null)
  if (!stored || stored === 'all') return 0
  const id = Number(stored)
  return Number.isFinite(id) && id > 0 ? id : 0
}

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => t('UICareerRecord'))

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
  dateKey: string
  showDate: boolean
  isDateLastData: boolean
  profit: string
}

interface TabItem {
  label: string
  key: string
}

const gameTabs: TabItem[] = [
  { label: 'NLH', key: 'nlh' },
  { label: 'PLO', key: 'plo' },
  { label: '6+', key: '6+' },
]
const timeTabs: TabItem[] = [
  { label: '今天', key: 'today' },
  { label: '7天', key: 'week' },
  { label: '30天', key: 'month' },
]
const selectedGame = ref(gameTabs[0].key)
const selectedTime = ref(timeTabs[0].key)
const loading = ref(false)

// 统计数据（从 postStatsUserStatsApi 获取，默认值 0）
const leftMetrics = ref<SummaryMetric[]>([
  { label: t('UITexasInfo_games'), value: '0' },
  { label: t('UIMine_RecordItemsNormal_3RCUa3w8'), value: '0' },
])

const rightMetrics = ref<SummaryMetric[]>([
  { label: t('UIClub_Mlistinfo_rRyW4JkW'), value: '0%' },
  { label: t('UITexasInfo_winrate'), value: '0%' },
])

const detailRowsOne = ref<SummaryMetric[]>([
  { label: t('UIData_YGvXd5iXr_003'), value: '0' },
  { label: t('UIClub_Text46'), value: '0' },
  { label: t('UIData_kpHsdqDe5'), value: '0' },
  { label: t('UIClub_Text39'), value: '0%' },
])

const detailRowsTwo = ref<SummaryMetric[]>([
  { label: t('UIClub_Text47'), value: '0%' },
  { label: t('UIClub_Text48'), value: '0%' },
  { label: t('adaptation10318'), value: '0%' },
  { label: t('UIClub_Text49'), value: '0' },
])

const todayProfit = ref('0')

const records = ref<RecordCard[]>([])

// 根据当前选中的时间 tab 返回收益标题
function profitTitle(): string {
  switch (selectedTime.value) {
    case 'today':
      return '今天收益'
    case 'week':
      return '7天收益'
    case 'month':
      return '30天收益'
    default:
      return t('UIClub_Income3')
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

function applyDateVisibility(cards: RecordCard[]): RecordCard[] {
  return cards.map((card, index) => {
    const prevCard = cards[index - 1]
    const nextCard = cards[index + 1]
    return {
      ...card,
      showDate: card.dateKey !== prevCard?.dateKey,
      isDateLastData: card.dateKey !== nextCard?.dateKey,
    }
  })
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function resolveGameTypes(): number[] {
  if (selectedGame.value === 'plo') {
    return [1, 2, 3]
  }
  if (selectedGame.value === '6+') {
    return [0]
  }
  return [0]
}

function resolveTimeType(): number {
  switch (selectedTime.value) {
    case 'today':
      return 1
    case 'week':
      return 2
    case 'month':
      return 3
    default:
      return 1
  }
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
  const change = toSafeNumber(row.Change ?? row.profit)
  const durationMinutes = Math.max(0, Math.round(toSafeNumber(row.play_duration) / 60))
  const endTs = toTimestampMs(row.end_time)
  const endDay = endTs > 0 ? dayjs(endTs).format('DD') : '--'
  const endMonth = endTs > 0 ? dayjs(endTs).format('M月') : '--'
  const dateKey = endTs > 0 ? dayjs(endTs).format('YYYY-MM-DD') : '--'
  return {
    id: String(row.RoomID ?? row.MatchID ?? index + 1),
    roomName: String(row.Name ?? '--'),
    roomId: String(row.RoomID ?? row.MatchID ?? '--'),
    blinds: `${toSafeNumber(row.small_blind)}/${toSafeNumber(row.ante ?? 0)}`,
    hands: String(row.hand_num),
    duration: formatDuration(durationMinutes),
    endAt: endTs > 0 ? formatDateTime(row.end_time, 'MM/DD HH:mm') : '--',
    endDay,
    endMonth,
    dateKey,
    showDate: true,
    isDateLastData: false,
    profit: formatUC(change),
  }
}

/**
 * 从 postStatsUserStatsApi 响应中提取统计数据
 */
function extractStatsFromResponse(data: unknown): void {
  const roomData = (data as Record<string, unknown>)?.room_data as
    | Record<string, unknown>
    | undefined
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
    { label: '总局数', value: totalGameCnt.toLocaleString() },
    { label: '手数', value: totalHand.toLocaleString() },
  ]

  rightMetrics.value = [
    { label: t('UIClub_Mlistinfo_rRyW4JkW'), value: `${vpip}%` },
    { label: t('UITexasInfo_winrate'), value: `${wins}%` },
  ]

  detailRowsOne.value = [
    { label: '局数', value: totalGameCnt.toLocaleString() },
    { label: '总盈亏', value: formatUC(totalEarn) },
    { label: '场均战绩', value: avgEarn },
    { label: '摊牌胜率', value: `${wtsd}%` },
  ]

  detailRowsTwo.value = [
    { label: '翻牌前加注率', value: `${prf}%` },
    { label: '持续下注率', value: `${cbet}%` },
    { label: '全下胜率', value: `${allinWins}%` },
    { label: '激进程度', value: af.toLocaleString() },
  ]

  todayProfit.value = formatUC(totalEarn)
}

// ── 缓存（IndexedDB career）──────────────────────────────────────────────────
// 库按 loginUserId 分用户，store=USER_STORE_CAREER，
// key = `${sourceId}_record_${time}_${game}`：
//   sourceId = -1(朋友桌) / 0(全部俱乐部) / 俱乐部 id；
//   time = today | week | month；game = nlh | plo | 6+。
// 缓存战绩首页 [统计 + 记录列表] 完整状态。
interface RecordSummaryCache {
  leftMetrics: SummaryMetric[]
  rightMetrics: SummaryMetric[]
  detailRowsOne: SummaryMetric[]
  detailRowsTwo: SummaryMetric[]
  todayProfit: string
  records: RecordCard[]
}

function recordCacheKey(): string {
  const sourceId = isClub.value ? getCareerSelectedClubId() : -1
  return `${sourceId}_record_${selectedTime.value}_${selectedGame.value}`
}

function recordCache() {
  return userCache(gameStore.loginUserId)
}

function plainClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function writeRecordCache(key: string): void {
  const payload: RecordSummaryCache = {
    leftMetrics: plainClone(leftMetrics.value),
    rightMetrics: plainClone(rightMetrics.value),
    detailRowsOne: plainClone(detailRowsOne.value),
    detailRowsTwo: plainClone(detailRowsTwo.value),
    todayProfit: todayProfit.value,
    records: plainClone(records.value),
  }
  void recordCache().put(USER_STORE_CAREER, key, payload)
}

function applyRecordCache(payload: RecordSummaryCache): void {
  leftMetrics.value = payload.leftMetrics
  rightMetrics.value = payload.rightMetrics
  detailRowsOne.value = payload.detailRowsOne
  detailRowsTwo.value = payload.detailRowsTwo
  todayProfit.value = payload.todayProfit
  records.value = payload.records
}

async function fetchStatsSummary(): Promise<void> {
  try {
    // room_type：club 走生涯(0)，friends 走朋友桌(1)；club 额外带 club_id 收窄范围。
    const response = await postStatsUserStatsApi({
      game_types: resolveGameTypes(),
      poker_types: selectedGame.value === '6+' ? [2] : [0],
      time_type: resolveTimeType(),
      filter_type: isClub.value ? 1 : 3,
      room_type: isClub.value ? 2 : 1,
      ...(isClub.value ? { club_id: getCareerSelectedClubId() } : {}),
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadDataFail'))
    }
    extractStatsFromResponse(response.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_LoadDataFail')
    showFailToast(message)
  }
}

async function fetchRecords(silent = false): Promise<void> {
  if (!silent) loading.value = true
  try {
    // club 只传 club_id（不传 room_type，对齐 Unity）；friends 传 room_type=1。
    const response = await postRoomCenterHistoryListApi({
      limit: 20,
      offset: 0,
      game_types: resolveGameTypes(),
      poker_types: selectedGame.value === '6+' ? [2] : [0],
      time_type: resolveTimeType(),
      ...(isClub.value ? { club_id: getCareerSelectedClubId(), room_type: 2 } : { room_type: 1 }),
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail9'))
    }

    const rows = extractRecords(response.data?.records)
    records.value = applyDateVisibility(rows.map((row, index) => mapRecord(row, index)))
  } catch (error) {
    if (!silent) records.value = []
    if (!silent) {
      const message = error instanceof Error ? error.message : '加载战绩失败'
      showFailToast(message)
    }
  } finally {
    if (!silent) loading.value = false
  }
}

// 缓存优先 + 静默刷新：命中缓存直接渲染、后台再请求覆盖缓存；未命中则正常 loading。
async function refreshAll(): Promise<void> {
  const key = recordCacheKey()
  const cached = await recordCache().get<RecordSummaryCache>(USER_STORE_CAREER, key)
  // 请求期间 tab 被切换：丢弃此次缓存。
  if (key !== recordCacheKey()) return

  if (cached) {
    loading.value = false
    applyRecordCache(cached)
    // 静默刷新
    void (async () => {
      await Promise.all([fetchStatsSummary(), fetchRecords(true)])
      if (key !== recordCacheKey()) return
      writeRecordCache(key)
    })()
    return
  }

  await Promise.all([fetchStatsSummary(), fetchRecords()])
  if (key !== recordCacheKey()) return
  writeRecordCache(key)
}

function goToDetail(item: RecordCard): void {
  const roomId = Number(item.roomId.replace(/\D/g, '')) || 0
  void router.push({
    path: `/mine/career/${source.value}/record/detail`,
    query: {
      room_id: roomId > 0 ? String(roomId) : undefined,
      id: item.roomId,
    },
  })
}

function selectGame(key: string): void {
  if (selectedGame.value === key) return
  selectedGame.value = key
  void refreshAll()
}

function selectTime(key: string): void {
  if (selectedTime.value === key) return
  selectedTime.value = key
  void refreshAll()
}

onMounted(() => {
  void refreshAll()
})
</script>

<template>
  <div class="page-shell record-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <div class="game-tabs">
        <button
          v-for="item in gameTabs"
          :key="item.key"
          type="button"
          class="plain-tab"
          :class="{ active: selectedGame === item.key }"
          @click="selectGame(item.key)"
        >
          {{ item.label }}
        </button>
      </div>

      <section class="glass-card stats-card">
        <div class="time-tabs">
          <button
            v-for="item in timeTabs"
            :key="item.key"
            type="button"
            class="time-tab"
            :class="{ active: selectedTime === item.key }"
            @click="selectTime(item.key)"
          >
            {{ item.label }}
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
            <div class="profit-title">{{ profitTitleText }}</div>
            <div :class="['profit-value', { pos: todayProfit.startsWith('-') }]">
              {{ todayProfit }}
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

      <section class="timeline">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!records.length" class="list-status">暂无战绩记录</p>
        <article
          v-for="card in records"
          :key="card.id"
          class="timeline-item"
          :class="{ 'timeline-item--top': card.showDate && records.length > 1 }"
        >
          <div
            :class="[
              'date-col',
              {
                'date-col--continued': !card.showDate,
                'date-col--bottom': card.isDateLastData,
              },
            ]"
          >
            <div v-if="card.showDate" class="date">{{ card.endDay }}</div>
            <div v-if="card.showDate" class="month">{{ card.endMonth }}</div>
            <img v-if="card.showDate" src="@/assets/icons/icon_time.png" class="date-icon" alt="" />
          </div>
          <div class="glass-card record-card" @click="goToDetail(card)">
            <div class="card-head">
              <div>{{ card.roomName }}</div>
              <div class="id">ID: {{ card.roomId }}</div>
            </div>
            <div class="line-content">
              <div class="line"></div>
            </div>
            <div class="card-body">
              <div class="meta">
                <div>
                  <span>盲注级别:</span>
                  <span>{{ card.blinds }}</span>
                </div>
                <div>
                  <span>手数:</span>
                  <span>{{ card.hands }}</span>
                </div>
                <div>
                  <span>时长:</span>
                  <span>{{ card.duration }}</span>
                </div>
                <div>
                  <span>结束时间:</span>
                  <span>{{ card.endAt }}</span>
                </div>
              </div>
              <div class="profit" :class="{ pos: card.profit.startsWith('-') }">
                {{ card.profit }}
              </div>
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

.game-tabs {
  margin-top: 0rem;
  display: flex;
  justify-content: space-around;
}

.plain-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.37rem;
  padding: 0.05rem 0;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.92);
  }
}

.glass-card {
  border-radius: 0.76rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.stats-card {
  margin-top: 0.3rem;
  padding: 0.34rem 0.6rem 0.32rem;
}

.time-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.08rem;
  border-radius: 0.62rem;
  // padding: 0.08rem;
  background: rgba(255, 255, 255, 0.2);
}

.time-tab {
  border: 0;
  border-radius: 0.62rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.40541rem;
  padding: 0.36rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.18);
    font-weight: 700;
  }
}

.main-metrics {
  margin-top: 0.4rem;
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 0.2rem;
  align-items: center;
}

.metric-col {
  display: flex;
  margin-top: 0.3rem;
  flex-direction: column;
  gap: 0.3rem;
  text-align: center;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;

  .metric-label {
    font-size: 0.27027rem;
    color: rgba(255, 255, 255, 0.74);
  }

  .metric-value {
    font-size: 0.35472rem;
    font-weight: 600;
  }
}

.metric-col.right {
  text-align: center;
}

.profit-box {
  border-radius: 0.5rem;
  width: 3.7rem;
  padding: 0.32rem 0;
  text-align: center;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(0.1583614945411682px);

  .profit-title {
    font-size: 0.33821rem;
    line-height: 0.7rem;
  }

  .profit-value {
    font-size: 0.71789rem;
    font-weight: 400;
    &.pos {
      color: #4ee58f;
    }
  }
}

.detail-grid {
  margin-top: 0.3rem;

  .line {
    height: 0.02rem;
    background: rgba(255, 255, 255, 0.18);
    margin: 0.2rem 0;
  }
}

.detail-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.08rem;
}

.detail-cell {
  text-align: center;
  display: flex;
  flex-direction: column;

  .label {
    font-size: 0.27027rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .value {
    margin-top: 0.06rem;
    font-size: 0.36rem;
    font-weight: 600;
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  margin-top: 0.59rem;
}

.list-status {
  text-align: center;
  font-size: 0.26rem;
  opacity: 0.76;
  padding: 0.24rem 0;
}

.timeline-item {
  display: grid;
  grid-template-columns: 1.2rem 1fr;
  gap: 0.18rem;
  margin-bottom: 0.16rem;
}
.timeline-item--top {
  margin-top: 0.6rem;
}

.date-col {
  position: relative;
  text-align: right;
  font-size: 0.24rem;
  min-height: 1rem;
  width: 0.9rem;
  padding-right: 0.3rem;

  &::after {
    content: '';
    position: absolute;
    right: -0rem;
    top: 0.4rem;
    width: 0.02rem;
    bottom: -0.3rem;
    background: rgba(255, 255, 255, 1);
  }
  &.date-col--continued::after {
    top: 0rem;
  }
  &.date-col--continued {
    .date-icon {
      top: 0.05rem;
    }
  }
  &.date-col--bottom::after {
    bottom: 0rem;
  }
  .date,
  .month {
    font-size: 0.3rem;
    line-height: 0.2rem;
    margin-bottom: 0.1rem;
  }

  .date-icon {
    position: absolute;
    right: -0.2rem;
    top: 0rem;
    width: 0.267rem;
    height: 0.267rem;
    border-radius: 50%;
  }
}

.record-card {
  padding: 0.36rem 0.44rem 0.3rem;
  height: 4.46rem;
  display: flex;
  flex-direction: column;

  .line-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    .line {
      height: 0.02rem;
      background: rgba(255, 255, 255, 0.4);
    }
  }
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.405rem;
  font-weight: 400;

  .id {
    font-size: 0.33rem;
    // color: rgba(255, 255, 255, 0.78);
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
  gap: 0.05rem;
  font-size: 0.304rem;

  div {
    display: flex;
    gap: 0.16rem;
    justify-content: space-between;
    span:nth-child(2) {
      font-size: 0.339rem;
    }
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

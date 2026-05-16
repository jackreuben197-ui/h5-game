<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postClubDataStatsDataApi, postClubDataStatsDataInfoApi } from '@/api/stats'
import type { ClubDataStatsDataRecord } from '@/api/models/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import DateRangePicker from '@/components/DateRangePicker/DateRangePicker.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import imgClock from '@/assets/icons/icon_time.png'

interface IncomeItem {
  label: string
  value: string
  positive: boolean
}

interface RoomHistoryItem {
  id: number
  roomId: number
  matchId: number
  mode: string
  title: string
  detailA: string
  detailB?: string
  startedAt: string
  hasSquidLogo?: boolean
  incomes: IncomeItem[]
}
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

type CurrencyTab = 1 | 3

type PickTarget = 'start' | 'end'

interface StatsSummary {
  totalProfit: number
  gameCount: number
  handCount: number
  fee: number
  jackpot: number
  insurance: number
  miniGame: number
}

const router = useRouter()
const userInfoStore = useUserInfoStore()

const activeCurrency = ref<CurrencyTab>(1)

const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const listOffset = ref(0)
const historyList = ref<RoomHistoryItem[]>([])

const summary = ref<StatsSummary>({
  totalProfit: 0,
  gameCount: 0,
  handCount: 0,
  fee: 0,
  jackpot: 0,
  insurance: 0,
  miniGame: 0,
})

const PAGE_SIZE = 20
const now = new Date()
const maxSelectableDate = endOfDay(now)
const minSelectableDate = startOfDay(addMonths(now, -3))

const startDate = ref(startOfDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)))
const endDate = ref(startOfDay(now))

const isDatePickerVisible = ref(false)
const datePickerTarget = ref<PickTarget>('start')

const timezoneText = computed(() => {
  const tz = Number(userInfoStore.currentClub?.time_zone ?? 0)
  return `UTC${tz >= 0 ? '+' : ''}${tz}`
})

const startDateText = computed(() => formatDate(startDate.value))
const endDateText = computed(() => formatDate(endDate.value))

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

function toSafeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatAmount(value: unknown): string {
  return toSafeNumber(value).toLocaleString('en-US')
}

function formatSigned(value: unknown): string {
  const amount = toSafeNumber(value)
  if (amount === 0) {
    return '0'
  }

  const abs = Math.abs(amount).toLocaleString('en-US')
  return amount > 0 ? `+${abs}` : `-${abs}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function addMonths(date: Date, months: number): Date {
  const value = new Date(date)
  value.setMonth(value.getMonth() + months)
  return value
}

function parseTimestampMillSeconds(date: Date, end: boolean): number {
  const normalized = new Date(date)
  if (end) {
    normalized.setHours(23, 59, 59, 999)
  } else {
    normalized.setHours(0, 0, 0, 0)
  }
  return normalized.getTime()
}

function resolveModeLabel(record: ClubDataStatsDataRecord): string {
  if (toSafeNumber(record.is_match) === 1) {
    return 'MTT'
  }

  const gameType = toSafeNumber(record.game_type)
  if (gameType === 0) return 'NLH'
  if (gameType === 1 || gameType === 2 || gameType === 3) return 'PLO'
  if (gameType === 0 && record.poker_types == 2) return '6+'
  if (gameType === 5) return 'Mahjong'

  return '牌局'
}

function resolveDetailA(record: ClubDataStatsDataRecord): string {
  const playerCount = toSafeNumber(record.match_player_num)
  if (playerCount > 0) {
    return `参赛人数: ${playerCount}`
  }

  const sb = toSafeNumber(record.sb)
  if (sb > 0) {
    return `盲注: ${sb}/${sb * 2}`
  }

  const buyIn = toSafeNumber(record.buy_in)
  if (buyIn > 0) {
    return `买入记分牌: ${buyIn}`
  }

  return '牌局详情'
}

function resolveStartAt(record: ClubDataStatsDataRecord): string {
  const raw = String(record.start_time_str || record.game_start_time || record.date || '').trim()
  return raw || '--'
}

function buildIncomeList(record: ClubDataStatsDataRecord): IncomeItem[] {
  const incomes: IncomeItem[] = []

  const fee = toSafeNumber(record.fee)
  if (fee !== 0) {
    incomes.push({ label: '服务费', value: formatSigned(fee), positive: fee > 0 })
  }

  const insurance = toSafeNumber(record.insurance)
  if (insurance !== 0) {
    incomes.push({ label: '保险', value: formatSigned(insurance), positive: insurance > 0 })
  }

  if (!incomes.length) {
    incomes.push({ label: '服务费', value: '0', positive: false })
  }

  return incomes
}

function mapHistoryItem(record: ClubDataStatsDataRecord, index: number): RoomHistoryItem {
  const roomId = toSafeNumber(record.room_id)
  const matchId = toSafeNumber(record.match_id)
  const jackpot = toSafeNumber(record.ante)

  return {
    id: index,
    roomId,
    matchId,
    mode: resolveModeLabel(record),
    title: `局抽数据-${roomId || index}`,
    detailA: resolveDetailA(record),
    detailB: jackpot > 0 ? `Jackpot: ${jackpot}` : undefined,
    startedAt: resolveStartAt(record),
    hasSquidLogo: toSafeNumber(record.is_match) === 1,
    incomes: buildIncomeList(record),
  }
}

async function fetchSummary(): Promise<void> {
  const clubId = toSafeNumber(userInfoStore.currentClub?.club_id)
  const startTime = parseTimestampMillSeconds(startDate.value, false)
  const endTime = parseTimestampMillSeconds(endDate.value, true)

  try {
    const response = await postClubDataStatsDataInfoApi({
      filter_type: activeCurrency.value,
      start_time: startTime,
      end_time: endTime,
      club_id: clubId || undefined,
    })

    if (response.code !== 0 || !response.data?.info) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载统计信息失败')
    }

    const info = response.data.info
    summary.value = {
      totalProfit: toSafeNumber(info.club_total_profit),
      gameCount: toSafeNumber(info.game_num),
      handCount: toSafeNumber(info.hand_num),
      fee: toSafeNumber(info.fee),
      jackpot: toSafeNumber(info.jackpot),
      insurance: toSafeNumber(info.insurence),
      miniGame: toSafeNumber(info.mini_game),
    }
  } catch (error) {
    summary.value = {
      totalProfit: 0,
      gameCount: 0,
      handCount: 0,
      fee: 0,
      jackpot: 0,
      insurance: 0,
      miniGame: 0,
    }
    const message = error instanceof Error ? error.message : '加载统计信息失败'
    showFailToast(message)
  }
}

async function fetchHistory(reset = false): Promise<void> {
  if (loading.value || loadingMore.value) {
    return
  }

  if (!reset && !hasMore.value) {
    return
  }

  if (reset) {
    loading.value = true
    hasMore.value = true
    listOffset.value = 0
  } else {
    loadingMore.value = true
  }

  const startTime = parseTimestampMillSeconds(startDate.value, false)
  const endTime = parseTimestampMillSeconds(endDate.value, true)

  try {
    const currentOffset = reset ? 0 : listOffset.value
    const response = await postClubDataStatsDataApi({
      filter_type: activeCurrency.value,
      limit: PAGE_SIZE,
      offset: currentOffset,
      start_time: startTime,
      end_time: endTime,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '加载牌局记录失败')
    }

    const rows = Array.isArray(response.data?.list) ? response.data.list : []
    const mapped = rows.map((item, index) => mapHistoryItem(item, currentOffset + index + 1))

    historyList.value = reset ? mapped : [...historyList.value, ...mapped]
    listOffset.value = currentOffset + rows.length
    hasMore.value = rows.length >= PAGE_SIZE
  } catch (error) {
    if (reset) {
      historyList.value = []
      hasMore.value = false
    }
    const message = error instanceof Error ? error.message : '加载牌局记录失败'
    showFailToast(message)
  } finally {
    if (reset) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

async function refreshData(): Promise<void> {
  await Promise.all([fetchSummary(), fetchHistory(true)])
}

function onPageScroll(event: Event): void {
  if (loading.value || loadingMore.value || !hasMore.value) {
    return
  }

  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }

  const remain = target.scrollHeight - (target.scrollTop + target.clientHeight)
  if (remain <= 100) {
    void fetchHistory(false)
  }
}

function selectCurrency(tab: CurrencyTab): void {
  if (activeCurrency.value === tab) {
    return
  }

  activeCurrency.value = tab
  void refreshData()
}

function openDatePicker(target: PickTarget): void {
  datePickerTarget.value = target
  isDatePickerVisible.value = true
}

function closeDatePicker(): void {
  isDatePickerVisible.value = false
}

function onDateConfirm(): void {
  void refreshData()
}

function toDetail(item: RoomHistoryItem): void {
  void router.push({
    path: '/club/room/history/detail',
    query: {
      roomId: String(item.roomId || ''),
      matchId: String(item.matchId || ''),
    },
  })
}

onMounted(() => {
  void refreshData()
})
</script>

<template>
  <div class="page-shell club-room-history-bg" :style="backgroundStyle">
    <HeaderBack :title="'牌局记录'" />
    <div class="club-room-history app-scroll-standalone" @scroll="onPageScroll">
      <div class="coin-tabs">
        <button
          type="button"
          class="coin-tab"
          :class="{ 'coin-tab--active': activeCurrency === 1 }"
          @click="selectCurrency(1)"
        >
          联盟币
        </button>
        <button
          type="button"
          class="coin-tab"
          :class="{ 'coin-tab--active': activeCurrency === 3 }"
          @click="selectCurrency(3)"
        >
          授信额度
        </button>
      </div>

      <section class="summary-card">
        <div class="date-range">
          <button type="button" class="date-btn" @click="openDatePicker('start')">
            <span class="calendar-icon-inline" aria-hidden="true"></span>
            <span>{{ startDateText }}</span>
          </button>
          <span class="date-sep"></span>
          <button type="button" class="date-btn" @click="openDatePicker('end')">
            <span class="calendar-icon-inline" aria-hidden="true"></span>
            <span>{{ endDateText }}</span>
          </button>
        </div>

        <div class="stats-row">
          <div class="stats-item">
            <span class="stats-label">总收益</span>
            <strong class="stats-value">{{ formatAmount(summary.totalProfit) }}</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">手数/局数</span>
            <strong class="stats-value">{{ summary.handCount }}/{{ summary.gameCount }}</strong>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stats-item">
            <span class="stats-label">服务费</span>
            <strong class="stats-value">{{ formatAmount(summary.fee) }}</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">JackPot</span>
            <strong class="stats-value">{{ formatAmount(summary.jackpot) }}</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">保险</span>
            <strong class="stats-value">{{ formatAmount(summary.insurance) }}</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">小游戏</span>
            <strong class="stats-value">{{ formatAmount(summary.miniGame) }}</strong>
          </div>
        </div>
      </section>

      <p class="timezone">时区: {{ timezoneText }}</p>

      <section class="record-list">
        <article
          v-for="item in historyList"
          :key="item.id"
          class="record-row"
          @click="toDetail(item)"
        >
          <div class="game-badge">{{ item.mode }}</div>

          <div class="record-card">
            <div class="record-main">
              <p class="record-title">{{ item.title }}</p>

              <div class="record-meta">
                <div class="meta-top">
                  <span>{{ item.detailA }}</span>
                  <span v-if="item.detailB" class="extra">{{ item.detailB }}</span>
                </div>
                <div class="meta-time">
                  <img :src="imgClock" alt="时间" />
                  <span>{{ item.startedAt }}</span>
                </div>
              </div>
            </div>

            <div class="record-right">
              <div class="fee-chip">
                <div
                  v-for="income in item.incomes"
                  :key="`${item.id}-${income.label}`"
                  class="fee-line"
                >
                  <span>{{ income.label }}</span>
                  <span :class="income.positive ? 'value-up' : 'value-down'">
                    {{ income.value }}
                  </span>
                </div>
              </div>
              <span class="chevron">›</span>
            </div>
          </div>
        </article>

        <p v-if="!historyList.length && !loading" class="list-status">暂无牌局记录</p>
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="historyList.length && loadingMore" class="list-status">加载更多...</p>
        <p v-else-if="historyList.length && !hasMore" class="list-status">没有更多了</p>
      </section>
    </div>

    <DateRangePicker
      v-model:visible="isDatePickerVisible"
      v-model:start-date="startDate"
      v-model:end-date="endDate"
      :min-date="minSelectableDate"
      :max-date="maxSelectableDate"
      :initial-target="datePickerTarget"
      tip-text="只支持查询最近三个月数据"
      @close="closeDatePicker"
      @confirm="onDateConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.club-room-history-bg {
  position: relative;
  height: 100dvh;
  background-size: cover;
  color: #f9f9f9;
}

.club-room-history {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.coin-tabs {
  display: flex;
  justify-content: center;
  gap: 0.38rem;
}

.coin-tab {
  border: 0;
  background: transparent;
  color: rgba(235, 245, 255, 0.7);
  font-size: 0.34rem;
  line-height: 1.2;
  padding: 0;
}

.coin-tab--active {
  color: #fff;
  padding-bottom: 0.08rem;
  border-bottom: 0.02rem solid rgba(255, 255, 255, 0.9);
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  padding: 0.36rem 0.44rem;
  border-radius: 0.76rem;
  background: rgba(0, 0, 0, 0.2);
  border: 0.02rem solid rgba(243, 243, 243, 0.1);
  box-shadow: inset 0 0 0.01rem rgba(255, 255, 255, 0.2);
}

.date-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
}

.date-btn {
  min-width: 3.22rem;
  min-height: 1.36rem;
  border-radius: 1.06rem;
  border: 0;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(243, 243, 243, 0.96);
  font-size: 0.32rem;
  line-height: 0.42rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
}

.calendar-icon-inline {
  width: 0.34rem;
  height: 0.34rem;
  border: 0.03rem solid rgba(243, 243, 243, 0.85);
  border-radius: 0.08rem;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -0.06rem;
    width: 0.05rem;
    height: 0.1rem;
    border-radius: 0.03rem;
    background: rgba(243, 243, 243, 0.85);
  }

  &::before {
    left: 0.07rem;
  }

  &::after {
    right: 0.07rem;
  }
}

.date-sep {
  width: 0.32rem;
  height: 0.02rem;
  border-radius: 999px;
  background: rgba(243, 243, 243, 0.55);
}

.stats-row,
.stats-grid {
  display: grid;
  gap: 0;
}

.stats-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  max-width: 4.74rem;
  margin: 0 auto;
}

.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding-top: 0.24rem;
  border-top: 0.02rem solid rgba(243, 243, 243, 0.28);
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;
  text-align: center;
}

.stats-row .stats-item {
  padding: 0 0.2rem;
}

.stats-grid .stats-item {
  padding: 0 0.06rem;
}

.stats-row .stats-item + .stats-item,
.stats-grid .stats-item + .stats-item {
  border-left: 0.02rem solid rgba(243, 243, 243, 0.18);
}

.stats-label {
  font-size: 0.34rem;
  line-height: 1.4;
  color: rgba(243, 243, 243, 0.9);
}

.stats-value {
  font-size: 0.54rem;
  font-weight: 400;
  line-height: 1;
  color: rgba(243, 243, 243, 1);
}

.timezone {
  margin: 0.22rem 0 0;
  text-align: right;
  color: rgba(235, 245, 255, 0.7);
  font-size: 0.26rem;
}

.record-list {
  margin-top: 0.26667rem;
  display: grid;
  gap: 0.26667rem;
}

.record-row {
  position: relative;
  min-height: 2.27648rem;
  padding-left: 0.25333rem;
}

.game-badge {
  position: absolute;
  left: -0.028rem;
  top: 0.40533rem;
  width: 1.4888rem;
  height: 1.4888rem;
  border: 0.02533rem solid rgba(242, 242, 242, 0.4);
  border-radius: 1.7372rem;
  background: rgba(20, 5, 47, 0.33);
  backdrop-filter: blur(0.28112rem);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: pre-line;
  font-size: 0.36235rem;
  line-height: 1.1;
  font-weight: 700;
  z-index: 2;
}

.record-card {
  margin-left: 0.25333rem;
  min-height: 2.25507rem;
  border-radius: 2.0848rem;
  border: 0.02667rem solid rgba(255, 255, 255, 0.56);
  background: linear-gradient(
    95deg,
    rgba(159, 22, 128, 0.64) 0%,
    rgba(130, 26, 142, 0.56) 63%,
    rgba(72, 82, 175, 0.56) 100%
  );
  backdrop-filter: blur(0.67653rem);
  padding: 0.37333rem 0.53333rem 0.37333rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.record-main {
  display: flex;
  flex-direction: column;
  gap: 0.18667rem;
}

.record-title {
  margin: 0;
  font-size: 0.33816rem;
  line-height: 0.83;
  font-weight: 700;
}

.record-meta {
  display: flex;
  flex-direction: column;
  gap: 0.13333rem;
}

.meta-top {
  display: flex;
  align-items: center;
  gap: 0.66667rem;
  font-size: 0.21928rem;
  line-height: 1;

  .extra {
    font-weight: 700;
  }
}

.meta-time {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  font-size: 0.28152rem;
  line-height: 1;
  letter-spacing: 0.01126rem;
  font-weight: 590;

  img {
    width: 0.35829rem;
    height: 0.35829rem;
    object-fit: contain;
  }
}

.record-right {
  display: inline-flex;
  align-items: center;
  gap: 0.18667rem;
}

.fee-chip {
  min-width: 1.776rem;
  border-radius: 0.20376rem;
  background: rgba(0, 0, 0, 0.27);
  padding: 0.13947rem 0.20853rem;
  display: flex;
  flex-direction: column;
  gap: 0.07053rem;
}

.fee-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.13333rem;
  font-size: 0.2116rem;
  line-height: 1;
  letter-spacing: 0.00846rem;
  font-weight: 590;
}

.value-up {
  color: #ff5364;
}

.value-down {
  color: #05e7ae;
}

.chevron {
  font-size: 0.648rem;
  line-height: 1;
  color: #f9f9f9;
}

.list-status {
  margin: 0;
  text-align: center;
  color: rgba(235, 245, 255, 0.72);
  font-size: 0.28rem;
  padding: 0.18rem 0 0.2rem;
}

@media (max-width: 340px) {
  .date-btn {
    min-width: 2.86rem;
  }

  .fee-chip {
    min-width: 1.58rem;
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { postFriendRoomStatsDataApi, postFriendRoomStatsDataInfoApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

import iconTime from '@/assets/icons/icon_time.png'

interface SummaryMetric {
  label: string
  value: string
}

interface RecordItem {
  id: string
  game: string
  title: string
  subtitle: string
  extra?: string
  time: string
  feeText: string
  feeValue: string
  insuranceLabel?: string
  insuranceValue?: string
  feePositive?: boolean
}

const title = computed(() => '数据管理')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const filterTabs = ['今天', '14天', '7天', '自定义']
const activeFilter = ref(filterTabs[0])
const loading = ref(false)

const now = new Date()
const maxSelectableDate = endOfDay(now)
const minSelectableDate = startOfDay(addMonths(now, -3))

const startDateModel = ref(startOfDay(addDays(now, -6)))
const endDateModel = ref(startOfDay(now))

const isDatePickerVisible = ref(false)
const pickingTarget = ref<'start' | 'end'>('start')
const currentMonth = ref(new Date(endDateModel.value.getFullYear(), endDateModel.value.getMonth(), 1))
const weekLabels = ['m', 't', 'w', 't', 'f', 's', 's']

const metrics = ref<SummaryMetric[]>([
  { label: '手数/局数', value: '0/0' },
  { label: '盈利', value: '0' },
  { label: '服务费', value: '0' },
])

const records = ref<RecordItem[]>([])

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatSigned(value: unknown): string {
  const amount = toSafeNumber(value)
  if (amount === 0) {
    return '0'
  }
  const abs = Math.abs(amount).toLocaleString('en-US')
  return amount > 0 ? `+${abs}` : `-${abs}`
}

function toUnixSeconds(date: Date): number {
  return Math.floor(startOfDay(date).getTime() / 1000)
}

function mapGameBadge(gameType: unknown, pokerType: unknown): string {
  const type = toSafeNumber(gameType)
  const poker = toSafeNumber(pokerType)
  if (type === 1 || type === 2 || type === 3) return 'PLO'
  if (type === 5) return 'Cowboy'
  if (type === 6) {
    if (poker === 1) {
      return '血战\n到底'
    } else if (poker === 2) {
      return '血流\n成河'
    } else if (poker === 3) {
      return '推倒胡'
    }
    return '麻将'
  }
  if (type === 7) return '掼蛋'
  return 'NLH'
}

function mapRecordItem(row: Record<string, unknown>, index: number): RecordItem {
  const feeValue = formatSigned(row.fee)
  const insuranceValue = formatSigned(row.insurance)
  const startTime = String(row.start_time_str ?? row.game_start_time ?? '--')
  const matchPlayers = toSafeNumber(row.match_player_num)
  const buyIn = toSafeNumber(row.buy_in)
  const sb = toSafeNumber(row.sb)

  return {
    id: String(row.room_id ?? row.match_id ?? index + 1),
    game: mapGameBadge(row.game_type, row.poker_type),
    title: String(row.name ?? row.room_name ?? row.game_room_name ?? '局抽数据'),
    subtitle: matchPlayers > 0 ? `参赛人数: ${matchPlayers}` : `盲注 : ${sb}`,
    extra: buyIn > 0 ? `买入 : ${buyIn}` : undefined,
    time: startTime,
    feeText: '服务费',
    feeValue,
    insuranceLabel: '保险',
    insuranceValue,
    feePositive: feeValue.startsWith('+'),
  }
}

async function fetchFriendsRecord(): Promise<void> {
  loading.value = true
  try {
    const requestPayload = {
      start_time: toUnixSeconds(startDateModel.value),
      end_time: toUnixSeconds(endDateModel.value),
      limit: 20,
      offset: 0,
    }

    const [listRes, infoRes] = await Promise.all([
      postFriendRoomStatsDataApi(requestPayload),
      postFriendRoomStatsDataInfoApi({
        start_time: requestPayload.start_time,
        end_time: requestPayload.end_time,
      }),
    ])

    if (listRes.code !== 0) {
      throw new Error(typeof listRes.msg === 'string' ? listRes.msg : '加载朋友战绩失败')
    }

    if (infoRes.code !== 0) {
      throw new Error(typeof infoRes.msg === 'string' ? infoRes.msg : '加载统计信息失败')
    }

    const list = Array.isArray(listRes.data?.list) ? listRes.data.list : []
    records.value = list.map((item, index) => mapRecordItem((item as Record<string, unknown>) ?? {}, index))

    const info = (infoRes.data?.info as Record<string, unknown> | undefined) ?? {}
    const handNum = toSafeNumber(info.hand_num)
    const gameNum = toSafeNumber(info.game_num)
    metrics.value = [
      { label: '手数/局数', value: `${handNum}/${gameNum}` },
      { label: '盈利', value: formatSigned(info.profit) },
      { label: '服務費', value: Math.abs(toSafeNumber(info.fee)).toLocaleString('en-US') },
    ]
  } catch (error) {
    records.value = []
    const message = error instanceof Error ? error.message : '加载朋友战绩失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

const startDateText = computed(() => formatDateSlash(startDateModel.value))
const endDateText = computed(() => formatDateSlash(endDateModel.value))
const monthTitle = computed(() => `${currentMonth.value.getFullYear()}年${currentMonth.value.getMonth() + 1}月`)

type DayCell = {
  date: Date
  day: number
  inCurrentMonth: boolean
}

const calendarCells = computed<DayCell[]>(() => {
  const firstDay = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate()
  const offset = (firstDay.getDay() + 6) % 7
  const prevMonthLastDay = new Date(firstDay.getFullYear(), firstDay.getMonth(), 0).getDate()
  const cells: DayCell[] = []

  for (let i = 0; i < offset; i += 1) {
    const day = prevMonthLastDay - offset + i + 1
    cells.push({
      date: new Date(firstDay.getFullYear(), firstDay.getMonth() - 1, day),
      day,
      inCurrentMonth: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(firstDay.getFullYear(), firstDay.getMonth(), day),
      day,
      inCurrentMonth: true,
    })
  }

  const trailingCount = Math.max(0, 35 - cells.length)
  for (let i = 1; i <= trailingCount; i += 1) {
    cells.push({
      date: new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, i),
      day: i,
      inCurrentMonth: false,
    })
  }

  return cells.slice(0, 35)
})

function onFilterClick(tab: string): void {
  if (tab === 'Customize') {
    activeFilter.value = tab
    openDatePicker('start')
    return
  }

  activeFilter.value = tab
  if (tab === '今天') {
    startDateModel.value = startOfDay(now)
    endDateModel.value = startOfDay(now)
    void fetchFriendsRecord()
    return
  }

  if (tab === '7天') {
    startDateModel.value = startOfDay(addDays(now, -6))
    endDateModel.value = startOfDay(now)
    void fetchFriendsRecord()
    return
  }

  if (tab === '14天') {
    startDateModel.value = startOfDay(addDays(now, -13))
    endDateModel.value = startOfDay(now)
    void fetchFriendsRecord()
  }
}

function openDatePicker(target: 'start' | 'end'): void {
  pickingTarget.value = target
  isDatePickerVisible.value = true
  currentMonth.value = new Date(endDateModel.value.getFullYear(), endDateModel.value.getMonth(), 1)
}

function closeDatePicker(): void {
  isDatePickerVisible.value = false
}

function confirmDatePicker(): void {
  if (startDateModel.value > endDateModel.value) {
    const temp = startDateModel.value
    startDateModel.value = endDateModel.value
    endDateModel.value = temp
  }
  activeFilter.value = 'Customize'
  void fetchFriendsRecord()
  closeDatePicker()
}

function goPrevYear(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear() - 1, currentMonth.value.getMonth(), 1)
}

function goPrevMonth(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

function goNextMonth(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

function goNextYear(): void {
  currentMonth.value = new Date(currentMonth.value.getFullYear() + 1, currentMonth.value.getMonth(), 1)
}

function selectDay(date: Date): void {
  if (isDisabledDay(date)) {
    return
  }

  const selectedDate = startOfDay(date)
  if (pickingTarget.value === 'start') {
    startDateModel.value = selectedDate
    if (selectedDate > endDateModel.value) {
      endDateModel.value = selectedDate
    }
    pickingTarget.value = 'end'
  } else {
    endDateModel.value = selectedDate
    if (selectedDate < startDateModel.value) {
      startDateModel.value = selectedDate
    }
    pickingTarget.value = 'start'
  }

  if (selectedDate.getMonth() !== currentMonth.value.getMonth() || selectedDate.getFullYear() !== currentMonth.value.getFullYear()) {
    currentMonth.value = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isRangeStart(date: Date): boolean {
  return isSameDay(date, startDateModel.value)
}

function isRangeEnd(date: Date): boolean {
  return isSameDay(date, endDateModel.value)
}

function isInRange(date: Date): boolean {
  const target = startOfDay(date).getTime()
  const start = startOfDay(startDateModel.value).getTime()
  const end = startOfDay(endDateModel.value).getTime()
  return target > start && target < end
}

function isDisabledDay(date: Date): boolean {
  const target = startOfDay(date).getTime()
  return target < minSelectableDate.getTime() || target > maxSelectableDate.getTime()
}

function formatDateSlash(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function openRecordDetail(_item: RecordItem): void {
  // 待后续接入战绩详情页。
}

onMounted(() => {
  void fetchFriendsRecord()
})
</script>

<template>
  <div class="friends-record-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="summary-card">
        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab"
            type="button"
            class="filter-tab"
            :class="{ active: activeFilter === tab, 'is-customize': tab === 'Customize' }"
            @click="onFilterClick(tab)"
          >
            {{ tab }}
          </button>
        </div>

        <div class="metrics-row">
          <div v-for="(item, idx) in metrics" :key="item.label" class="metric-item">
            <p class="metric-label">{{ item.label }}</p>
            <p class="metric-value">{{ item.value }}</p>
            <span v-if="idx < metrics.length - 1" class="metric-divider" aria-hidden="true"></span>
          </div>
        </div>
      </section>

      <p class="timezone-text">时区：UTC+0</p>

      <section class="record-list">
        <p v-if="loading" class="list-status">加载中...</p>
        <p v-else-if="!records.length" class="list-status">暂无朋友战绩</p>
        <article
          v-for="item in records"
          :key="item.id"
          class="record-row"
          @click="openRecordDetail(item)"
        >
          <div class="game-badge">{{ item.game }}</div>

          <div class="record-card">
            <div class="record-main">
              <p class="record-title">{{ item.title }}</p>

              <div class="record-meta">
                <div class="meta-top">
                  <span>{{ item.subtitle }}</span>
                  <span v-if="item.extra" class="extra">{{ item.extra }}</span>
                </div>
                <div class="meta-time">
                  <img :src="iconTime" alt="时间" />
                  <span>{{ item.time }}</span>
                </div>
              </div>
            </div>

            <div class="record-right">
              <div class="fee-chip">
                <div class="fee-line">
                  <span>{{ item.feeText }}</span>
                  <span :class="item.feePositive ? 'value-up' : 'value-down'">{{ item.feeValue }}</span>
                </div>
                <div v-if="item.insuranceLabel && item.insuranceValue" class="fee-line">
                  <span>{{ item.insuranceLabel }}</span>
                  <span class="value-down">{{ item.insuranceValue }}</span>
                </div>
              </div>
              <span class="chevron">›</span>
            </div>
          </div>
        </article>
      </section>

      <div v-if="isDatePickerVisible" class="date-picker-mask" @click="closeDatePicker">
        <div class="date-picker-sheet" @click.stop>
          <header class="picker-tip">
            <p>只支持查询最近三个月数据</p>
            <button type="button" class="picker-close" @click="closeDatePicker">×</button>
          </header>

          <div class="picker-range-row">
            <button
              type="button"
              class="picker-date-btn"
              :class="{ active: pickingTarget === 'start' }"
              @click="pickingTarget = 'start'"
            >
              <span class="calendar-icon" aria-hidden="true"></span>
              <span>{{ startDateText }}</span>
            </button>
            <button
              type="button"
              class="picker-date-btn"
              :class="{ active: pickingTarget === 'end' }"
              @click="pickingTarget = 'end'"
            >
              <span class="calendar-icon" aria-hidden="true"></span>
              <span>{{ endDateText }}</span>
            </button>
          </div>

          <div class="picker-month-row">
            <div class="month-arrows">
              <button
                type="button"
                class="arrow-btn"
                aria-label="上一年"
                @click="goPrevYear"
              >
                «
              </button>
              <button
                type="button"
                class="arrow-btn"
                aria-label="上一月"
                @click="goPrevMonth"
              >
                ‹
              </button>
            </div>
            <p class="month-title">{{ monthTitle }}</p>
            <div class="month-arrows">
              <button
                type="button"
                class="arrow-btn"
                aria-label="下一月"
                @click="goNextMonth"
              >
                ›
              </button>
              <button
                type="button"
                class="arrow-btn"
                aria-label="下一年"
                @click="goNextYear"
              >
                »
              </button>
            </div>
          </div>

          <div class="calendar-wrap">
            <div class="weekday-row">
              <span v-for="(label, idx) in weekLabels" :key="`${label}-${idx}`">{{ label }}</span>
            </div>

            <div class="day-grid">
              <button
                v-for="cell in calendarCells"
                :key="cell.date.toISOString()"
                type="button"
                class="day-cell"
                :class="{
                  muted: !cell.inCurrentMonth,
                  disabled: isDisabledDay(cell.date),
                  'in-range': isInRange(cell.date),
                  'range-start': isRangeStart(cell.date),
                  'range-end': isRangeEnd(cell.date),
                }"
                @click="selectDay(cell.date)"
              >
                <span>{{ String(cell.day).padStart(2, '0') }}</span>
              </button>
            </div>
          </div>

          <button type="button" class="picker-ok" @click="confirmDatePicker">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.friends-record-page {
  min-height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.459rem);
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.4392rem;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.76845rem;
  line-height: 1;
  padding: 0;
}

.head-space {
  width: 0.76845rem;
  height: 0.76845rem;
}

.summary-card {
  margin-top: 0.38941rem;
  border-radius: 0.76013rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.36317rem 0.4392rem;
}

.filter-tabs {
  width: 7.55067rem;
  max-width: 100%;
  height: 1.35979rem;
  border-radius: 0.76013rem;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 0.05912rem;
  padding: 0.05912rem;
  overflow: hidden;
  margin: 0 auto;
}

.filter-tab {
  flex: 1 1 0;
  min-width: 0;
  border: 0;
  border-radius: 1.3844rem;
  background: transparent;
  color: #f9f9f9;
  font-size: 0.40541rem;
  line-height: 0.44299rem;
  padding: 0.11075rem 0.24rem;

  &.is-customize {
    flex: 1.34 1 0;
    font-size: 0.36235rem;
    padding-left: 0.22rem;
    padding-right: 0.22rem;
  }

  &.active {
    background: rgba(255, 255, 255, 0.17);
    font-weight: 500;
    line-height: 0.83;
  }
}

.metrics-row {
  margin-top: 0.24296rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-item {
  text-align: center;
  position: relative;

  .metric-label {
    margin: 0;
    font-size: 0.33784rem;
    line-height: 1.4;
  }

  .metric-value {
    margin: 0.07357rem 0 0;
    font-size: 0.54053rem;
    line-height: 0.55376rem;
    font-weight: 400;
  }
}

.metric-divider {
  position: absolute;
  right: 0;
  top: 0.12rem;
  width: 0.0192rem;
  height: 0.718rem;
  background: rgba(255, 255, 255, 0.2);
}

.timezone-text {
  margin: 0.072rem 0.11rem 0;
  text-align: right;
  font-size: 0.25861rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.5);
}

.record-list {
  margin-top: 0.26667rem;
  display: grid;
  gap: 0.26667rem;
}

.list-status {
  text-align: center;
  font-size: 0.32rem;
  opacity: 0.78;
  margin: 0.24rem 0;
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
  background: linear-gradient(95deg, rgba(159, 22, 128, 0.64) 0%, rgba(130, 26, 142, 0.56) 63%, rgba(72, 82, 175, 0.56) 100%);
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

.date-picker-mask {
  position: fixed;
  inset: 0;
  z-index: 24;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: flex-end;
}

.date-picker-sheet {
  width: 100%;
  padding: 0.64256rem 0.53211rem 0.5472rem;
  border-radius: 0.84459rem 0.84459rem 0 0;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(0.16064rem);
}

.picker-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;

  p {
    margin: 0;
    font-size: 0.41861rem;
    line-height: 1.4;
    color: #fff;
  }
}

.picker-close {
  width: 1.024rem;
  height: 1.024rem;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.8rem;
  line-height: 1;
}

.picker-range-row {
  margin-top: 0.42667rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42667rem;
}

.picker-date-btn {
  border: 0;
  height: 0.85141rem;
  border-radius: 0.64157rem;
  padding: 0 0.42208rem;
  background: rgba(6, 6, 6, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.1912rem;
  font-size: 0.35893rem;
  line-height: 1.2;

  &.active {
    box-shadow: 0 0 0 0.02rem rgba(5, 231, 174, 0.45) inset;
  }
}

.calendar-icon {
  width: 0.48rem;
  height: 0.48rem;
  border: 0.04rem solid rgba(243, 243, 243, 0.85);
  border-radius: 0.1rem;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -0.06rem;
    width: 0.06rem;
    height: 0.12rem;
    border-radius: 0.03rem;
    background: rgba(243, 243, 243, 0.85);
  }

  &::before {
    left: 0.09rem;
  }

  &::after {
    right: 0.09rem;
  }
}

.picker-month-row {
  margin-top: 0.372rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.month-arrows {
  display: inline-flex;
  align-items: center;
  gap: 0.18667rem;
}

.arrow-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.64rem;
  width: 0.64rem;
  height: 0.64rem;
  line-height: 0.64rem;
  padding: 0;
}

.month-title {
  margin: 0;
  color: #fff;
  font-size: 0.49547rem;
  line-height: 1.4;
}

.calendar-wrap {
  margin-top: 0.16rem;
  padding: 0.26667rem;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  justify-items: center;
  opacity: 0.7;

  span {
    font-size: 0.26667rem;
    line-height: 0.42667rem;
    text-transform: lowercase;
  }
}

.day-grid {
  margin-top: 0.08rem;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.day-cell {
  border: 0;
  background: transparent;
  color: #fff;
  height: 0.98667rem;
  padding: 0;
  position: relative;
  font-size: 0.32rem;
  line-height: 0.42667rem;
  display: grid;
  place-items: center;

  > span {
    position: relative;
    z-index: 2;
  }

  &.disabled,
  &.muted {
    opacity: 0.3;
  }

  &.in-range::before,
  &.range-start::before,
  &.range-end::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0.14667rem;
    bottom: 0.14667rem;
    background: rgba(5, 231, 174, 0.17);
    z-index: 1;
  }

  &.range-start::before {
    border-radius: 0.49333rem 0 0 0.49333rem;
  }

  &.range-end::before {
    border-radius: 0 0.49333rem 0.49333rem 0;
  }

  &.range-start.range-end::before {
    border-radius: 0.49333rem;
  }

  &.range-start::after,
  &.range-end::after {
    content: '';
    position: absolute;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: #05e7ae;
    z-index: 1;
  }
}

.picker-ok {
  margin-top: 0.37333rem;
  width: 100%;
  height: 1.43581rem;
  border: 0.01333rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.05573rem;
  background: linear-gradient(168.11deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-size: 0.4rem;
  font-weight: 500;
}
</style>

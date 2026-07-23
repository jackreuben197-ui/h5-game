<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { postStatsFriendStatsDataApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'

import iconChips from '@/assets/icons/icon_chips.png'
import defaultAvatar from '@/assets/images/default_avatar.png'
import { formatUC } from '@/utils/roomVisibility'
import {
  addDays,
  addMonths,
  endOfDay,
  formatDateTime,
  startOfDay,
  toUnixSeconds,
} from '@/utils/time'
import { useGameStore } from '@/stores/game'
import { userCache } from '@/utils/userCache'
import { createKeyedRefresh } from '@/utils/keyedRefresh'
import { USER_STORE_CAREER } from '@/utils/indexedDB'
import { t } from '@/i18n'

interface SummaryItem {
  label: string
  value: string
}

interface PlayerItem {
  id: string
  name: string
  userId: string
  profit: string
  profitType: 'green' | 'red'
  avatar: string
}

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--friends-data-bg-dark': `url(${mainBgUrl})`,
  '--friends-data-bg-light': `url(${mainBgLightUrl})`,
}))

interface TabItem {
  label: string
  key: string
}

const gameTabs: TabItem[] = [
  { label: t('adaptation10022'), key: 'nlh' },
  // { label: t('Mahjong_Name'), key: 'mahjong' },
  { label: t('Complanin007'), key: 'other' },
]
const activeGameTab = ref(gameTabs[0].key)
const loading = ref(false)

const now = new Date()
const maxSelectableDate = endOfDay(now)
const minSelectableDate = startOfDay(addMonths(now, -3))

const startDateModel = ref(startOfDay(addDays(now, -1)))
const endDateModel = ref(endOfDay(now))

const startTime = ref('00:00')
const endTime = ref('23:59')

const isDatePickerVisible = ref(false)
const pickingTarget = ref<'start' | 'end'>('start')
const currentMonth = ref(
  new Date(endDateModel.value.getFullYear(), endDateModel.value.getMonth(), 1),
)

const weekLabels = ['m', 't', 'w', 't', 'f', 's', 's']

const summary = ref<SummaryItem[]>([
  { label: t('UINumberOfParticipants'), value: '0' },
  { label: t('UITotalNumberOfTables'), value: '0' },
  { label: t('UITableMyProfits'), value: '0' },
])

const players = ref<PlayerItem[]>([])

const gameStore = useGameStore()

interface FriendsDataCacheEntry {
  summary: SummaryItem[]
  players: PlayerItem[]
}

// IDB partition: gameStore.loginUserId
// Store: USER_STORE_CAREER
// Key: `-1_statistics_${YYMMDD}_${gameKey}`
//   -1：朋友桌生涯，不与俱乐部 id 冲突；YYMMDD 取结束日期。
function buildCacheKey(): string {
  const dateCode = formatDateTime(endDateModel.value, 'YYMMDD')
  return `-1_statistics_${dateCode}_${activeGameTab.value}`
}

// 命中缓存后立即触发后台刷新；15s TTL 内同 key 跳过；同 key 已在飞行则合并。
// fetchFriendsData 内部用 begin()/isCurrent() 兜底。
const refresher = createKeyedRefresh(buildCacheKey, { freshTtl: 15_000 })

function applyCache(entry: FriendsDataCacheEntry): void {
  summary.value = entry.summary.map((item) => ({ ...item }))
  players.value = entry.players.map((item) => ({ ...item }))
}

const title = computed(() => t('UIClub_Mlistinfo_GiVUYG7E'))

const startDateText = computed(() => formatDateTime(startDateModel.value, 'DD/MM/YYYY'))
const endDateText = computed(() => formatDateTime(endDateModel.value, 'DD/MM/YYYY'))
const monthTitle = computed(
  () =>
    currentMonth.value.getFullYear() +
    t('UIMine_VIP_year') +
    (currentMonth.value.getMonth() + 1) +
    t('UIMine_VIP_month'),
)

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

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function resolveGameType(): number[] {
  if (activeGameTab.value === t('Mahjong_Name')) {
    return [6]
  }
  if (activeGameTab.value === t('Complanin007')) {
    return [1, 2, 3, 4, 5, 7]
  }
  return [0]
}

async function fetchFriendsData(silent = false): Promise<void> {
  if (!silent) loading.value = true
  const requestKey = buildCacheKey()
  const guard = refresher.begin()
  try {
    const response = await postStatsFriendStatsDataApi({
      start_time: toUnixSeconds(startDateModel.value),
      end_time: toUnixSeconds(endDateModel.value),
      game_types: resolveGameType(),
      limit: 50,
      offset: 0,
    })

    // 切走则丢弃响应（不管 silent 与否，避免首次请求也被旧响应覆盖）。
    if (!guard.isCurrent()) return

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadDataFail3'))
    }

    const info = response.data?.info
    const nextSummary: SummaryItem[] = [
      {
        label: t('UINumberOfParticipants'),
        value: toSafeNumber(info?.user_num).toLocaleString('en-US'),
      },
      {
        label: t('UITotalNumberOfTables'),
        value: toSafeNumber(info?.table_num).toLocaleString('en-US'),
      },
      { label: t('UITableMyProfits'), value: formatUC(toSafeNumber(info?.profit)) },
    ]

    const list = response.data?.list ?? []
    const nextPlayers: PlayerItem[] = list.map((item, index) => {
      const profit = toSafeNumber(item.final_result)
      return {
        id: String(item.user_random_id ?? index + 1),
        name: String(item.user_name ?? 'Player'),
        userId: String(item.user_random_id ?? '--'),
        profit: formatUC(profit),
        profitType: profit >= 0 ? 'red' : 'green',
        avatar:
          typeof item.user_avatar === 'string' && item.user_avatar
            ? item.user_avatar
            : defaultAvatar,
      }
    })

    summary.value = nextSummary
    players.value = nextPlayers

    void userCache(gameStore.loginUserId).put<FriendsDataCacheEntry>(
      USER_STORE_CAREER,
      requestKey,
      { summary: nextSummary, players: nextPlayers },
    )
  } catch (error) {
    if (!guard.isCurrent()) return
    if (silent) return
    const message = error instanceof Error ? error.message : t('UIClub_LoadDataFail3')
    showFailToast(message)
  } finally {
    if (!silent) loading.value = false
  }
}

async function loadFromCacheThenRefresh(): Promise<void> {
  const key = buildCacheKey()
  const cached = await userCache(gameStore.loginUserId).get<FriendsDataCacheEntry>(
    USER_STORE_CAREER,
    key,
  )
  if (cached) {
    applyCache(cached)
    // 命中缓存：立即触发静默刷新；15s TTL 内同 key 跳过；同 key 已在飞行则合并。
    void refresher.refresh(() => fetchFriendsData(true))
  } else {
    await fetchFriendsData()
  }
}

function setGameTab(tab: string): void {
  activeGameTab.value = tab
  void loadFromCacheThenRefresh()
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
  void loadFromCacheThenRefresh()
  closeDatePicker()
}

function goPrevYear(): void {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear() - 1,
    currentMonth.value.getMonth(),
    1,
  )
}

function goPrevMonth(): void {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1,
  )
}

function goNextMonth(): void {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1,
  )
}

function goNextYear(): void {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear() + 1,
    currentMonth.value.getMonth(),
    1,
  )
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

  if (
    selectedDate.getMonth() !== currentMonth.value.getMonth() ||
    selectedDate.getFullYear() !== currentMonth.value.getFullYear()
  ) {
    currentMonth.value = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
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

onMounted(() => {
  void loadFromCacheThenRefresh()
})

onBeforeUnmount(() => {
  refresher.clear()
})
</script>

<template>
  <div class="page-shell friends-data-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap">
      <nav class="game-tabs" :aria-label="t('UIClub_Text43')">
        <button
          v-for="tab in gameTabs"
          :key="tab.key"
          type="button"
          class="game-tab"
          :class="{ active: activeGameTab === tab.key }"
          @click="setGameTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <section class="glass-card summary-card">
        <div class="date-range">
          <button type="button" class="date-pill" @click="openDatePicker('start')">
            <span class="date">{{ startDateText }}</span>
            <span class="time-line">
              <AppSvgIcon name="clock" class="time-icon" />
              <span>{{ startTime }}</span>
            </span>
          </button>

          <span class="dash" aria-hidden="true">——</span>

          <button type="button" class="date-pill" @click="openDatePicker('end')">
            <span class="date">{{ endDateText }}</span>
            <span class="time-line">
              <AppSvgIcon name="clock" class="time-icon" />
              <span>{{ endTime }}</span>
            </span>
          </button>
        </div>

        <div class="metrics">
          <div v-for="(item, index) in summary" :key="item.label" class="metric">
            <p class="metric-label">{{ item.label }}</p>
            <p class="metric-value">{{ item.value }}</p>
            <span
              v-if="index < summary.length - 1"
              class="metric-divider"
              aria-hidden="true"
            ></span>
          </div>
        </div>
      </section>

      <section class="list-head">
        <span>{{ t('UIClub_Text58') }}</span>
        <span>{{ t('UITexasInfo_loss') }}</span>
      </section>

      <section class="player-list">
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!players.length" class="list-status">{{ t('UIClub_NoData2') }}</p>
        <article v-for="item in players" :key="item.id" class="player-card">
          <div class="player-left">
            <img class="avatar" :src="item.avatar" :alt="item.name" />
            <div class="player-meta">
              <p class="name">{{ item.name }}</p>
              <p class="id">ID: {{ item.userId }}</p>
            </div>
          </div>

          <div class="player-right">
            <span
              class="profit"
              :class="item.profitType === 'green' ? 'profit-green' : 'profit-red'"
            >
              {{ item.profit }}
            </span>
            <img class="chip" :src="iconChips" :alt="t('UITexasReport_Text_DeskScoreTip')" />
          </div>
        </article>
      </section>

      <div v-if="isDatePickerVisible" class="date-picker-mask" @click="closeDatePicker">
        <div class="date-picker-sheet" @click.stop>
          <header class="picker-tip">
            <p>{{ t('UIGuildtThreeMonthDataTip') }}</p>
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
                :aria-label="t('UIClub_Text50')"
                @click="goPrevYear"
              >
                «
              </button>
              <button
                type="button"
                class="arrow-btn"
                :aria-label="t('UIClub_Text51')"
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
                :aria-label="t('UIClub_Text52')"
                @click="goNextMonth"
              >
                ›
              </button>
              <button
                type="button"
                class="arrow-btn"
                :aria-label="t('UIClub_Text53')"
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
@use '@/styles/mixins' as *;

.friends-data-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-image: var(--friends-data-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: var(--c-text);
    background-color: var(--c-page);
    background-image: var(--friends-data-bg-light);
  }
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.head-space {
  width: 0.758rem;
  height: 0.758rem;
}

.game-tabs {
  margin-top: 0.42rem;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.game-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.42rem;
  line-height: 1.1;
  padding: 0.06rem 0;

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.92);

    @include theme-light {
      color: var(--c-brand);
      border-bottom-color: var(--c-brand);
    }
  }
}

.glass-card {
  border-radius: 0.76013rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.00421rem);

  @include theme-light {
    background: var(--c-surface);
    backdrop-filter: none;
  }
}

.summary-card {
  margin-top: 0.40541rem;
  padding: 0.36317rem 0;
}

.date-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
}

.date-pill {
  border: 0;
  border-radius: 1.05573rem;
  background: rgba(0, 0, 0, 0.24);
  width: 3.2204rem;
  height: 1.50483rem;
  color: #fff;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.2196rem;

  @include theme-light {
    color: var(--c-text);
    background: rgba(139, 136, 136, 0.15);
  }

  .date {
    font-size: 0.32013rem;
    line-height: 0.42685rem;
  }

  .time-line {
    display: inline-flex;
    align-items: center;
    gap: 0.21341rem;
    font-size: 0.42685rem;
    line-height: 0.53355rem;

    .time-icon {
      width: 0.33147rem;
      height: 0.31867rem;
      color: #fff;
      opacity: 0.95;

      @include theme-light {
        color: #000;
      }
    }
  }
}

.dash {
  font-size: 0.42685rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.9);

  @include theme-light {
    color: var(--c-text);
  }
}

.metrics {
  margin-top: 0.276rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric {
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
  top: 0.05rem;
  width: 0.0192rem;
  height: 0.718rem;
  background: rgba(255, 255, 255, 0.22);

  @include theme-light {
    background: var(--c-divider);
  }
}

.list-head {
  margin: 0.338rem auto 0;
  width: 7.2044rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.33784rem;
  font-weight: 590;
}

.player-list {
  margin-top: 0.3208rem;
  display: grid;
  gap: 0.33rem;
  .list-status {
    text-align: center;
  }
}

.player-card {
  border-radius: 4.223rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.00421rem);
  padding: 0.3rem 0.44rem;
  min-height: 1.93072rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @include theme-light {
    background: var(--c-surface);
    backdrop-filter: none;
  }
}

.player-left {
  display: flex;
  align-items: center;
  gap: 0.21387rem;
}

.avatar {
  width: 1.3693rem;
  height: 1.3775rem;
  border-radius: 50%;
  object-fit: cover;
}

.player-meta {
  .name {
    margin: 0;
    font-size: 0.4392rem;
    line-height: 0.4812rem;
    font-weight: 500;
  }

  .id {
    margin: 0.06rem 0 0;
    font-size: 0.30405rem;
    line-height: 0.42776rem;
    opacity: 0.55;
  }
}

.player-right {
  display: inline-flex;
  align-items: center;
  gap: 0.1352rem;
}

.profit {
  font-size: 0.42267rem;
  line-height: 1.4;
  font-weight: 600;
}

.profit-green {
  color: var(--c-loss);
}

.profit-red {
  color: var(--c-profit);
}

.chip {
  width: 0.53333rem;
  height: 0.53333rem;
  object-fit: contain;
}

.date-picker-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: flex-end;

  @include theme-light {
    background: var(--c-overlay);
  }
}

.date-picker-sheet {
  width: 100%;
  padding: 0.64256rem 0.53211rem 0.5472rem;
  border-radius: 0.84459rem 0.84459rem 0 0;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(0.16064rem);

  @include theme-light {
    color: var(--c-text);
    background: var(--c-surface);
  }
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

    @include theme-light {
      color: var(--c-text);
    }
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

  @include theme-light {
    color: var(--c-text);
    background: rgba(0, 0, 0, 0.1);
  }
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

  @include theme-light {
    color: var(--c-text);
    background: rgba(0, 0, 0, 0.08);
  }

  &.active {
    box-shadow: 0 0 0 0.02rem rgba(var(--c-brand-rgb), 0.45) inset;
  }
}

.calendar-icon {
  width: 0.48rem;
  height: 0.48rem;
  border: 0.04rem solid rgba(243, 243, 243, 0.85);
  border-radius: 0.1rem;
  position: relative;

  @include theme-light {
    border-color: var(--c-text);
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -0.06rem;
    width: 0.06rem;
    height: 0.12rem;
    border-radius: 0.03rem;
    background: rgba(243, 243, 243, 0.85);

    @include theme-light {
      background: var(--c-text);
    }
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

  @include theme-light {
    color: var(--c-text);
  }
}

.month-title {
  margin: 0;
  color: #fff;
  font-size: 0.49547rem;
  line-height: 1.4;

  @include theme-light {
    color: var(--c-text);
  }
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

  @include theme-light {
    color: var(--c-text);
  }

  > span {
    position: relative;
    z-index: 2;
  }

  &.disabled {
    opacity: 0.3;
  }

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
    background: rgba(var(--c-brand-rgb), 0.17);
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
    background: var(--c-brand);
    z-index: 1;
  }
}

.picker-ok {
  margin-top: 0.37333rem;
  width: 100%;
  height: 1.43581rem;
  border: 0.01333rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.05573rem;
  background: linear-gradient(168.11deg, var(--c-brand) 7.55%, rgba(var(--c-brand-rgb), 0.6) 71.92%);
  color: #fff;
  font-size: 0.4rem;
  font-weight: 500;
}
</style>

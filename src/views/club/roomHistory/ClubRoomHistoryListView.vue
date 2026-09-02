<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postClubDataStatsDataApi, postClubDataStatsDataInfoApi } from '@/api/stats'
import type { ClubDataStatsDataRecord } from '@/api/models/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import DateRangePicker from '@/components/DateRangePicker/DateRangePicker.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { useAppConfigStore } from '@/stores/appConfig'
import { USER_STORE_CLUB_MANAGE } from '@/utils/indexedDB'
import { toPlain, userCache } from '@/utils/userCache'
import imgClock from '@/assets/icons/icon_time.png'
import imgGameBadge from '@/assets/icons/wallet/ic_game_badge.png'
import imgArrowRight from '@/assets/icons/ic_arrow_right.svg'
import { FALLBACK_SERVER_LANG, getLocale, t, toServerLang } from '@/i18n'
import { resolveTemplateTextByKey } from '@/utils/multiLanguageTemplate'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import {
  addMonths,
  dateBoundaryTimestamp,
  dateInTimeZone,
  endOfDay,
  formatDateTimeInTimeZone,
  startOfDay,
} from '@/utils/time'
import { formatUC } from '@/utils/roomVisibility'
import { resolveBlindText, resolveGameTypeText } from '@/utils/transText'

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
  '--club-room-history-bg-dark': `url(${mainBgUrl})`,
  '--club-room-history-bg-light': `url(${mainBgLightUrl})`,
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
const gameStore = useGameStore()
const appConfigStore = useAppConfigStore()

function toSafeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function resolveInitialCurrency(): CurrencyTab {
  const stored = Number(
    localStore.getItem<number | string>(StorageKey.GUILD_RECORD_FILTER, 3),
  )
  const savedCurrency: CurrencyTab = stored === 1 ? 1 : 3
  const club = userInfoStore.currentClub

  // 对齐 Unity UIClubGameRecordComponent.OnShow：非联盟俱乐部固定记分牌，代理固定 UC。
  if (toSafeNumber(club?.tribe_id) === 0) return 3
  if (toSafeNumber(club?.user_level) === 4) return 1
  return savedCurrency
}

const activeCurrency = ref<CurrencyTab>(resolveInitialCurrency())

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

// club_manage 缓存：二次进入先渲染上次查询结果，再静默刷新覆盖（key 约定见 utils/indexedDB.ts）。
interface CachedHistoryList {
  items: RoomHistoryItem[]
  offset: number
  hasMore: boolean
}

// 静默刷新在飞标记：期间列表展示的是缓存、listOffset 还未重算，须挡住触底加载防止重复拼页。
let silentListRefreshing = false
let historyRequestSequence = 0

function clubManageCache() {
  return userCache(gameStore.loginUserId)
}

function summaryCacheKey(): string {
  const clubId = toSafeNumber(userInfoStore.currentClub?.club_id)
  return `${clubId}_roomhistory_summary_v2_${queryCacheSuffix()}`
}

function listCacheKey(): string {
  const clubId = toSafeNumber(userInfoStore.currentClub?.club_id)
  return `${clubId}_roomhistory_list_v2_${queryCacheSuffix()}`
}

function platformTimeZone(): number {
  return toSafeNumber(appConfigStore.globalConfig?.platform_role_time_zone)
}

function queryCacheSuffix(): string {
  return [
    activeCurrency.value,
    formatDate(startDate.value),
    formatDate(endDate.value),
    `utc${platformTimeZone()}`,
  ].join('_')
}

const now = dateInTimeZone(Date.now(), platformTimeZone())
const maxSelectableDate = endOfDay(now)
const minSelectableDate = startOfDay(addMonths(now, -3))

// 对齐 Unity 默认筛选：首次进入展示平台时区的今天。
const startDate = ref(startOfDay(now))
const endDate = ref(startOfDay(now))

const isDatePickerVisible = ref(false)
const datePickerTarget = ref<PickTarget>('start')

const timezoneText = computed(() => {
  const tz = platformTimeZone()
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

function formatAmount(value: unknown): string {
  return formatUC(toSafeNumber(value))
}

function formatSigned(value: unknown): string {
  const amount = toSafeNumber(value)
  if (amount === 0) return '0'
  const formatted = formatAmount(Math.abs(amount))
  return amount > 0 ? `+${formatted}` : `-${formatted}`
}

function formatCount(value: unknown): string {
  return toSafeNumber(value).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function parseTimestampMillSeconds(date: Date, end: boolean): number {
  return dateBoundaryTimestamp(date, end, platformTimeZone())
}

function resolveModeLabel(record: ClubDataStatsDataRecord): string {
  const label = resolveGameTypeText(
    toSafeNumber(record.game_type),
    toSafeNumber(record.poker_type ?? record.poker_types),
  )

  if (toSafeNumber(record.is_match) > 0) return `MTT\n${label}`
  if (toSafeNumber(record.sng_id) > 0) return `SNG-${label}`
  return label
}

function resolveDetailA(record: ClubDataStatsDataRecord): string {
  const blind = resolveBlindText({
    gameType: toSafeNumber(record.game_type),
    pokerType: toSafeNumber(record.poker_type ?? record.poker_types),
    sb: toSafeNumber(record.sb) / 100,
    ante: toSafeNumber(record.ante) / 100,
    bombpot: toSafeNumber(record.bombpot),
    isMatch: toSafeNumber(record.is_match) > 0,
    matchPlayerNum: toSafeNumber(record.match_player_num),
  })
  return blind.value ? `${blind.label}: ${blind.value}` : blind.label
}

function resolveStartAt(record: ClubDataStatsDataRecord): string {
  // Unity 的牌局列表展示结束时间；老数据缺失时再回退开始时间。
  const raw = record.end_time_str || record.start_time_str || record.game_start_time || record.date
  if (!raw) {
    return '--'
  }
  return formatDateTimeInTimeZone(raw, platformTimeZone(), 'DD/MM/YYYY HH:mm')
}

function resolveRecordName(record: ClubDataStatsDataRecord, roomId: number, index: number): string {
  const rawName = String(record.name || '').trim()
  const multiLanguage = record.multi_lang_names_obj
  // 14 种语言共用 i18n 的服务端语言映射，服务端缺该语言时回落英文。
  const localeKey = toServerLang(getLocale())
  const localizedValue = multiLanguage?.[localeKey] ?? multiLanguage?.[FALLBACK_SERVER_LANG]
  const localizedName = typeof localizedValue === 'string' ? localizedValue.trim() : ''

  if (toSafeNumber(record.is_match) > 0 || toSafeNumber(record.sng_id) > 0) {
    return resolveTemplateTextByKey(rawName, getLocale()) || rawName || `${t('UIClub_RoundData')}-${roomId || index}`
  }
  return localizedName || rawName || `${t('UIClub_RoundData')}-${roomId || index}`
}

function buildIncomeList(record: ClubDataStatsDataRecord): IncomeItem[] {
  const fee = toSafeNumber(record.fee)
  const incomes: IncomeItem[] = [{
    label: t('UIData_ServiceFee'),
    value: formatSigned(fee),
    positive: fee > 0,
  }]

  const insurance = toSafeNumber(record.insurance)
  const gameType = toSafeNumber(record.game_type)
  const shouldShowInsurance =
    toSafeNumber(record.is_match) <= 0 &&
    toSafeNumber(record.sng_id) <= 0 &&
    gameType !== 6 &&
    gameType !== 7
  if (shouldShowInsurance) {
    incomes.push({
      label: t('adaptation10179'),
      value: formatSigned(insurance),
      positive: insurance > 0,
    })
  }

  return incomes
}

function mapHistoryItem(record: ClubDataStatsDataRecord, index: number): RoomHistoryItem {
  const roomId = toSafeNumber(record.room_id)
  const matchId = toSafeNumber(record.match_id)
  const showJackpot =
    toSafeNumber(record.is_match) <= 0 &&
    toSafeNumber(record.game_type) !== 5 &&
    toSafeNumber(record.jackpot_switch) === 1

  return {
    id: index,
    roomId,
    matchId,
    mode: resolveModeLabel(record),
    title: resolveRecordName(record, roomId, index),
    detailA: resolveDetailA(record),
    detailB: showJackpot ? `Jackpot: ${formatSigned(record.jackpot_profit)}` : undefined,
    startedAt: resolveStartAt(record),
    hasSquidLogo: toSafeNumber(record.squid_on) === 1,
    incomes: buildIncomeList(record),
  }
}

function currentUtcTimeString(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

async function fetchSummary(silent = false): Promise<void> {
  const clubId = toSafeNumber(userInfoStore.currentClub?.club_id)
  const startTime = parseTimestampMillSeconds(startDate.value, false)
  const endTime = parseTimestampMillSeconds(endDate.value, true)
  const cacheKey = summaryCacheKey()

  try {
    const response = await postClubDataStatsDataInfoApi({
      filter_type: activeCurrency.value,
      start_time: startTime,
      end_time: endTime,
      current_time_str: currentUtcTimeString(),
      user_id: 0,
      slave_club_id: 0,
      only_master: false,
      club_id: clubId || undefined,
    })

    if (response.code !== 0 || !response.data?.info) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail'))
    }

    // 响应回来时已切换币种 → 丢弃，避免覆盖新页签的数据/缓存。
    if (cacheKey !== summaryCacheKey()) {
      return
    }

    const info = response.data.info
    const next: StatsSummary = {
      totalProfit: toSafeNumber(info.club_total_profit),
      gameCount: toSafeNumber(info.game_num),
      handCount: toSafeNumber(info.hand_num),
      fee: toSafeNumber(info.fee),
      jackpot: toSafeNumber(info.jackpot),
      insurance: toSafeNumber(info.insurence),
      miniGame: toSafeNumber(info.mini_game),
    }
    summary.value = next
    void clubManageCache().put(USER_STORE_CLUB_MANAGE, cacheKey, next)
  } catch (error) {
    // 静默刷新失败保留缓存展示，不打断用户。
    if (silent || cacheKey !== summaryCacheKey()) {
      return
    }
    summary.value = {
      totalProfit: 0,
      gameCount: 0,
      handCount: 0,
      fee: 0,
      jackpot: 0,
      insurance: 0,
      miniGame: 0,
    }
    const message = error instanceof Error ? error.message : t('UIClub_LoadFail')
    showFailToast(message)
  }
}

async function fetchHistory(reset = false, silent = false): Promise<void> {
  if (!reset && (loading.value || loadingMore.value || silentListRefreshing)) {
    return
  }

  if (!reset && !hasMore.value) {
    return
  }

  if (reset) {
    // 静默刷新期间缓存仍在展示，offset/hasMore 等成功后一并重算。
    loadingMore.value = false
    silentListRefreshing = silent
    loading.value = !silent
    if (!silent) {
      hasMore.value = true
      listOffset.value = 0
    }
  } else {
    loadingMore.value = true
  }

  const startTime = parseTimestampMillSeconds(startDate.value, false)
  const endTime = parseTimestampMillSeconds(endDate.value, true)
  const clubId = toSafeNumber(userInfoStore.currentClub?.club_id)
  const cacheKey = listCacheKey()
  const requestSequence = ++historyRequestSequence

  try {
    const currentOffset = reset ? 0 : listOffset.value
    const response = await postClubDataStatsDataApi({
      filter_type: activeCurrency.value,
      limit: PAGE_SIZE,
      offset: currentOffset,
      start_time: startTime,
      end_time: endTime,
      user_id: 0,
      slave_club_id: 0,
      only_master: false,
      // 对齐当前 Unity UIClubGameRecordComponent：列表由 UTC 字符串返回，展示时再转平台时区。
      time_zone: 0,
      club_id: clubId || undefined,
    })

    if (response.code !== 0) {
      throw new Error(
        typeof response.msg === 'string' ? response.msg : t('UIClub_LoadTableGameRecordFail'),
      )
    }

    // 响应回来时已切换币种 → 丢弃，避免覆盖新页签的数据/缓存。
    if (cacheKey !== listCacheKey()) {
      return
    }

    const rows = Array.isArray(response.data?.list) ? response.data.list : []
    const mapped = rows.map((item, index) => mapHistoryItem(item, currentOffset + index + 1))

    historyList.value = reset ? mapped : [...historyList.value, ...mapped]
    listOffset.value = currentOffset + rows.length
    hasMore.value = rows.length >= PAGE_SIZE
    // 触底加载写回的是累计后的完整列表（更新而非覆盖）。
    void clubManageCache().put(
      USER_STORE_CLUB_MANAGE,
      cacheKey,
      toPlain({
        items: historyList.value,
        offset: listOffset.value,
        hasMore: hasMore.value,
      } satisfies CachedHistoryList),
    )
  } catch (error) {
    if (silent || cacheKey !== listCacheKey()) {
      return
    }
    if (reset) {
      historyList.value = []
      hasMore.value = false
    }
    const message = error instanceof Error ? error.message : t('UIClub_LoadTableGameRecordFail')
    showFailToast(message)
  } finally {
    // 旧筛选条件的请求结束时不能清掉新请求的 loading 状态。
    if (requestSequence === historyRequestSequence) {
      if (reset) {
        if (silent) {
          silentListRefreshing = false
        } else {
          loading.value = false
        }
      } else {
        loadingMore.value = false
      }
    }
  }
}

async function refreshData(silent = false): Promise<void> {
  await Promise.all([fetchSummary(silent), fetchHistory(true, silent)])
}

async function restoreFromCache(): Promise<boolean> {
  const [cachedSummary, cachedList] = await Promise.all([
    clubManageCache().get<StatsSummary>(USER_STORE_CLUB_MANAGE, summaryCacheKey()),
    clubManageCache().get<CachedHistoryList>(USER_STORE_CLUB_MANAGE, listCacheKey()),
  ])

  if (cachedSummary) {
    summary.value = cachedSummary
  } else {
    summary.value = {
      totalProfit: 0,
      gameCount: 0,
      handCount: 0,
      fee: 0,
      jackpot: 0,
      insurance: 0,
      miniGame: 0,
    }
  }
  if (cachedList) {
    historyList.value = Array.isArray(cachedList.items) ? cachedList.items : []
    listOffset.value = cachedList.offset || 0
    hasMore.value = cachedList.hasMore
  } else {
    historyList.value = []
    listOffset.value = 0
    hasMore.value = true
  }

  return Boolean(cachedSummary || cachedList)
}

// 命中缓存 → 先渲染再静默刷新；未命中 → 正常 loading 拉取。
async function loadWithCache(): Promise<void> {
  const hit = await restoreFromCache()
  await refreshData(hit)
}

function onPageScroll(event: Event): void {
  if (loading.value || loadingMore.value || silentListRefreshing || !hasMore.value) {
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
  localStore.setItem(StorageKey.GUILD_RECORD_FILTER, tab)
  void loadWithCache()
}

function openDatePicker(target: PickTarget): void {
  datePickerTarget.value = target
  isDatePickerVisible.value = true
}

function closeDatePicker(): void {
  isDatePickerVisible.value = false
}

function onDateConfirm(): void {
  void loadWithCache()
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
  void loadWithCache()
})
</script>

<template>
  <div
    class="page-shell club-room-history-page club-room-history-bg"
    :style="backgroundStyle"
  >
    <HeaderBack :title="t('UIClubTable_TableRecords')" />
    <div class="club-room-history">
      <div class="coin-tabs">
        <button
          type="button"
          class="coin-tab"
          :class="{ 'coin-tab--active': activeCurrency === 1 }"
          @click="selectCurrency(1)"
        >
          {{ t('UIClubCreditLimit1') }}
        </button>
        <button
          type="button"
          class="coin-tab"
          :class="{ 'coin-tab--active': activeCurrency === 3 }"
          @click="selectCurrency(3)"
        >
          {{ t('UIClubCreditLimit2') }}
        </button>
      </div>

      <section class="summary-card">
        <div class="date-range">
          <button type="button" class="date-pill" @click="openDatePicker('start')">
            <span class="date">{{ startDateText }}</span>
            <span class="time-line">
              <img :src="imgClock" alt="时间" />
              <span>00:00</span>
            </span>
          </button>
          <span class="dash" aria-hidden="true">—</span>
          <button type="button" class="date-pill" @click="openDatePicker('end')">
            <span class="date">{{ endDateText }}</span>
            <span class="time-line">
              <img :src="imgClock" alt="时间" />
              <span>23:59</span>
            </span>
          </button>
        </div>

        <div class="stats-row">
          <div class="stats-item">
            <span class="stats-label">{{ t('UIGUILDDATARecord_TotalRevenueTip01') }}</span>
            <strong class="stats-value">{{ formatAmount(summary.totalProfit) }}</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">
              {{ t('UIMine_RecordItemsNormal_3RCUa3w8') }}/{{ t('UIData_YGvXd5iXr_003') }}
            </span>
            <strong class="stats-value">
              {{ formatCount(summary.handCount) }}/{{ formatCount(summary.gameCount) }}
            </strong>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stats-item">
            <span class="stats-label">{{ t('UIMine_WalletPlatform_fee_f') }}</span>
            <strong class="stats-value">{{ formatAmount(summary.fee) }}</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">JackPot</span>
            <strong class="stats-value">{{ formatAmount(summary.jackpot) }}</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">{{ t('adaptation10179') }}</span>
            <strong class="stats-value">{{ formatAmount(summary.insurance) }}</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">{{ t('UIClub_Text24') }}</span>
            <strong class="stats-value">{{ formatAmount(summary.miniGame) }}</strong>
          </div>
        </div>
      </section>

      <p class="timezone">{{ t('UICommon_TimeZone') }}: {{ timezoneText }}</p>

      <section class="record-list" @scroll="onPageScroll">
        <article
          v-for="item in historyList"
          :key="item.id"
          class="record-row"
          @click="toDetail(item)"
        >
          <div class="game-badge" :style="{ backgroundImage: `url(${imgGameBadge})` }">
            <span>{{ item.mode }}</span>
          </div>

          <div class="record-card">
            <div class="record-main">
              <p class="record-title">{{ item.title }}</p>

              <div class="record-meta">
                <div class="meta-top">
                  <span>{{ item.detailA }}</span>
                  <span v-if="item.detailB" class="extra">{{ item.detailB }}</span>
                </div>
                <div class="meta-time">
                  <img :src="imgClock" :alt="t('TimeItem')" />
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
                  <span class="fee-value">{{ income.value }}</span>
                </div>
              </div>
              <img class="chevron" :src="imgArrowRight" alt="" />
            </div>
          </div>
        </article>

        <p v-if="!historyList.length && !loading" class="list-status">
          {{ t('UIClub_NoTableGameRecord') }}
        </p>
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="historyList.length && loadingMore" class="list-status">
          {{ t('UIClub_LoadMore') }}...
        </p>
        <p v-else-if="historyList.length && !hasMore" class="list-status">
          {{ t('UIClub_NoMore') }}
        </p>
      </section>
    </div>

    <DateRangePicker
      v-model:visible="isDatePickerVisible"
      v-model:start-date="startDate"
      v-model:end-date="endDate"
      :min-date="minSelectableDate"
      :max-date="maxSelectableDate"
      :initial-target="datePickerTarget"
      :tip-text="t('UIGuildtThreeMonthDataTip')"
      @close="closeDatePicker"
      @confirm="onDateConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-room-history-bg {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding-bottom: 0.5rem;
  overflow: hidden;
  background-image: var(--club-room-history-bg-dark);
  background-size: cover;
  color: #f9f9f9;

  @include theme-light-own {
    color: #222;
    background-color: #f3f4f6;
    background-image: var(--club-room-history-bg-light);

    :deep(.back-trigger),
    :deep(.back-icon) {
      color: #000;
    }

    :deep(.title) {
      color: #000;
      text-shadow: none;
    }

    .summary-card,
    .history-card {
      background: #ffffff;
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      color: #000000;

      &::before,
      &::after {
        display: none;
      }
    }

    .date-pill {
      background: rgba(0, 0, 0, 0.05);
      color: #000000;

      .date,
      .time-line {
        color: #000000;
      }

      .time-line img {
        filter: invert(1);
      }
    }

    .stats-label,
    .sub-value,
    .history-meta-sub,
    .fee-line,
    .list-status {
      color: rgba(0, 0, 0, 0.65);
    }

    .stats-value,
    .sub-metric strong,
    .room-name,
    .fee-value {
      color: #000000;
    }

    .fee-chip {
      background: rgba(0, 0, 0, 0.04);
    }

    .chevron {
      filter: invert(1);
    }
  }
}

.club-room-history {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 0.2rem;
  height: 100dvh;
  padding-left: 0.26667rem;
  padding-right: 0.26667rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.coin-tabs {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
}

.coin-tab {
  border: 0;
  background: transparent;
  color: rgba(235, 245, 255, 0.7);
  font-size: 0.34rem;
  line-height: 1.2;
  padding: 0;

  @include theme-light-own {
    color: rgba(34, 34, 34, 0.7);
  }
}

.coin-tab--active {
  color: #fff;
  padding-bottom: 0.08rem;
  border-bottom: 0.02rem solid rgba(255, 255, 255, 0.9);

  @include theme-light-own {
    color: var(--c-brand);
    border-bottom-color: var(--c-brand);
  }
}

.summary-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  padding: 0.36rem 0.44rem;
  border-radius: 0.76rem;
  border: 0.016rem solid rgba(242, 242, 242, 0.1);
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
}

.summary-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  background: linear-gradient(
    107.6deg,
    rgba(249, 249, 249, 0.1) 12.3%,
    rgba(249, 249, 249, 0.14) 33.3%,
    rgba(147, 147, 147, 0.2) 85.1%
  );
  mix-blend-mode: hard-light;
  pointer-events: none;
  z-index: 0;
}

.summary-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow:
    inset 0 0 8.6px rgba(0, 0, 0, 0.5),
    inset 3.4px 2.6px 8.6px rgba(0, 0, 0, 0.1),
    inset 0 0 36.1px rgba(242, 242, 242, 0.3);
  z-index: 0;
}

.summary-card > * {
  position: relative;
  z-index: 1;
}

.date-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
}

.date-pill {
  border: 0.02rem solid rgba(249, 249, 249, 0.08);
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  width: 3.2204rem;
  height: 1.50483rem;
  color: #fff;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.2196rem;

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

    img {
      width: 0.33147rem;
      height: 0.31867rem;
      object-fit: contain;
      opacity: 0.95;
    }
  }
}

.dash {
  font-size: 0.42685rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.9);
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

  @include theme-light {
    border-top-color: rgba(34, 34, 34, 0.14);
  }
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

  @include theme-light {
    border-left-color: rgba(34, 34, 34, 0.14);
  }
}

.stats-label {
  font-size: 0.34rem;
  line-height: 1.4;
  color: rgba(243, 243, 243, 0.9);

  @include theme-light {
    color: #222;
  }
}

.stats-value {
  font-size: 0.34rem;
  font-weight: 400;
  line-height: 1;
  color: rgba(243, 243, 243, 1);

  @include theme-light {
    color: #222;
  }
}

.timezone {
  margin: 0.22rem 0 0;
  text-align: right;
  color: rgba(235, 245, 255, 0.7);
  font-size: 0.26rem;

  @include theme-light {
    color: rgba(0, 0, 0, 0.5);
  }
}

.record-list {
  margin-top: 0.26667rem;
  display: grid;
  flex: 1;
  min-height: 0;
  align-content: start;
  grid-auto-rows: max-content;
  gap: 0.26667rem;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.record-row {
  position: relative;
  min-height: 2.27648rem;
  padding-left: 0.25333rem;
}

.game-badge {
  position: absolute;
  left: -0.02rem;
  top: 0.40533rem;
  width: 1.4888rem;
  height: 1.4888rem;
  border-radius: 50%;
  background-color: transparent;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0.0913rem 0.1141rem 0.0913rem rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: pre-line;
  font-size: 0.4rem;
  line-height: 1.1;
  font-weight: 800;
  color: #fff;
  z-index: 2;
}

.record-card {
  position: relative;
  overflow: hidden;
  margin-left: 0.25333rem;
  min-height: 2.25507rem;
  border-radius: 0.7rem;
  border: 0.0266rem solid rgba(242, 242, 242, 0.146);
  background: rgba(168, 27, 67, 0.886);
  box-shadow: 0.08907rem 0.11133rem 0.17815rem rgba(0, 0, 0, 0.25);
  padding: 0.37333rem 0.53333rem 0.37333rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  cursor: pointer;

  @include theme-light {
    background: rgba(157, 18, 124, 0.59);
    box-shadow:
      inset 0 0.08rem 0.18rem rgba(255, 255, 255, 0.2),
      inset 0 -0.08rem 0.16rem rgba(78, 0, 59, 0.12);
  }
}

.record-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  background: linear-gradient(
    107.6deg,
    rgba(249, 249, 249, 0.1) 12.3%,
    rgba(249, 249, 249, 0.14) 33.3%,
    rgba(147, 147, 147, 0.2) 85.1%
  );
  mix-blend-mode: hard-light;
  pointer-events: none;
  z-index: 0;
}

.record-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow:
    inset 0 0 8.6px rgba(0, 0, 0, 0.5),
    inset 3.4px 2.6px 8.6px rgba(0, 0, 0, 0.1),
    inset 0 0 36.1px rgba(242, 242, 242, 0.3);
  z-index: 0;
}

.record-card > * {
  position: relative;
  z-index: 1;
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
  position: relative;
  min-width: 1.9rem;
  border-radius: 0.2196rem;
  padding: 0.16rem 0.16rem;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.fee-chip::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.15);
  mix-blend-mode: plus-lighter;
  pointer-events: none;
}

.fee-line {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.13333rem;
  font-size: 0.2rem;
  line-height: 1;
  letter-spacing: 0.00846rem;
  font-weight: 400;
  color: #fff;
}

.fee-value {
  color: #fff;
}

.chevron {
  width: 0.2667rem;
  height: 0.48rem;
  object-fit: contain;
}

.list-status {
  margin: 0;
  text-align: center;
  color: rgba(235, 245, 255, 0.72);
  font-size: 0.28rem;
  padding: 0.18rem 0 0.2rem;

  @include theme-light {
    color: rgba(34, 34, 34, 0.62);
  }
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

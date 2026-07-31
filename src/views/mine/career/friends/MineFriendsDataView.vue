<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postFriendRoomStatsDataApi, postFriendRoomStatsDataInfoApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import DateRangePicker from '@/components/DateRangePicker/DateRangePicker.vue'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'

import { t } from '@/i18n'
import {
  addDays,
  addMonths,
  endOfDay,
  formatDateTime,
  startOfDay,
  toTimestampMs,
} from '@/utils/time'
import { useGameStore } from '@/stores/game'
import { userCache } from '@/utils/userCache'
import { createKeyedRefresh } from '@/utils/keyedRefresh'
import { USER_STORE_CAREER } from '@/utils/indexedDB'
import { resolveBlindText } from '@/utils/transText'

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

const title = computed(() => t('UIClub_DataManager'))

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--friends-record-bg-dark': `url(${mainBgUrl})`,
  '--friends-record-bg-light': `url(${mainBgLightUrl})`,
}))

interface FilterTab {
  label: string
  key: 'today' | 'week' | 'halfmonth' | 'customize'
}

const filterTabs: FilterTab[] = [
  { label: t('UIData_Today'), key: 'today' },
  { label: '7' + t('UIHappyShop_ActivityShopDay'), key: 'week' },
  { label: '14' + t('UIHappyShop_ActivityShopDay'), key: 'halfmonth' },
  { label: 'Customize', key: 'customize' },
]
const activeFilter = ref<FilterTab['key']>(filterTabs[0].key)
const loading = ref(false)

const now = new Date()
const maxSelectableDate = endOfDay(now)
const minSelectableDate = startOfDay(addMonths(now, -3))

// 默认按"今天"展示。
const startDateModel = ref<Date>(startOfDay(now))
const endDateModel = ref<Date>(startOfDay(now))

// 自定义日期是否已确认（点过 OK）。控制 Customize tab 是否显示日期。
const customizeApplied = ref(false)

const isDatePickerVisible = ref(false)

const metrics = ref<SummaryMetric[]>([
  { label: t('UIMine_RecordItemsNormal_3RCUa3w8') + '/' + t('UIData_YGvXd5iXr_003'), value: '0/0' },
  { label: t('UIClub_GainNum'), value: '0' },
  { label: t('UIMine_WalletPlatform_fee_f'), value: '0' },
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

const gameStore = useGameStore()
const router = useRouter()

interface RecordCacheEntry {
  metrics: SummaryMetric[]
  records: RecordItem[]
}

// IDB partition: gameStore.loginUserId, store: USER_STORE_CAREER
// Key: `-1_data_${tabKey}`，-1 表示朋友桌生涯。仅 today/week/month 写入，customize 不缓存。
function buildCacheKey(): string | null {
  if (activeFilter.value === 'customize') return null
  return `-1_data_${activeFilter.value}`
}

// 命中缓存后立即触发后台刷新；15s TTL 内同 key 跳过；同 key 已在飞行则合并。
// customize 不进缓存所以也不走 refresh。fetchFriendsRecord 内部用 begin()/isCurrent() 兜底。
const refresher = createKeyedRefresh(() => buildCacheKey() ?? '', { freshTtl: 15_000 })

function applyCache(entry: RecordCacheEntry): void {
  metrics.value = entry.metrics.map((item) => ({ ...item }))
  records.value = entry.records.map((item) => ({ ...item }))
}

function mapGameBadge(gameType: unknown, pokerType: unknown): string {
  const type = toSafeNumber(gameType)
  const poker = toSafeNumber(pokerType)
  if (type === 1 || type === 2 || type === 3) return 'PLO'
  if (type === 5) return 'Cowboy'
  if (type === 6) {
    if (poker === 1) {
      return t('adaptation10181') + '\\n' + t('UIClub_Text54')
    } else if (poker === 2) {
      return t('UIClub_Text55') + '\\n' + t('UIClub_Text56')
    } else if (poker === 3) {
      return t('Mahjong_Standard')
    }
    return t('Mahjong_Name')
  }
  if (type === 7) return t('UIEgg')
  return 'NLH'
}

function mapRecordItem(row: Record<string, unknown>, index: number): RecordItem {
  const feeValue = formatSigned(row.fee)
  const insuranceValue = formatSigned(row.insurance)
  const startTime = formatDateTime(row.start_time_str ?? row.game_start_time, 'DD/MM/YYYY HH:mm')
  const matchPlayers = toSafeNumber(row.match_player_num)
  const buyIn = toSafeNumber(row.buy_in) / 100
  const sb = toSafeNumber(row.sb) / 100
  const blind = resolveBlindText({
    gameType: toSafeNumber(row.game_type),
    pokerType: toSafeNumber(row.poker_type),
    sb,
    bombpot: toSafeNumber(row.bombpot),
  })

  return {
    id: String(row.room_id ?? row.match_id ?? index + 1),
    game: mapGameBadge(row.game_type, row.poker_type),
    title: String(row.name ?? row.room_name ?? row.game_room_name ?? t('UIClub_RoundData')),
    subtitle:
      matchPlayers > 0
        ? t('UIMine_RecordDetailForMatchPariticipants') + ': ' + matchPlayers
        : `${blind.label} : ${blind.value}`,
    extra: buyIn > 0 ? t('MTT_xq_buy') + ' : ' + buyIn : undefined,
    time: startTime,
    feeText: t('UIMine_WalletPlatform_fee_f'),
    feeValue,
    insuranceLabel: t('adaptation10179'),
    insuranceValue,
    feePositive: feeValue.startsWith('+'),
  }
}

async function fetchFriendsRecord(silent = false): Promise<void> {
  if (!silent) loading.value = true
  const requestKey = buildCacheKey()
  const guard = refresher.begin()
  try {
    // 单位为毫秒，对齐客户端协议；end 取当日 23:59:59 包含整天。
    const requestPayload = {
      start_time: toTimestampMs(startOfDay(startDateModel.value)),
      end_time: toTimestampMs(endOfDay(endDateModel.value)),
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

    // 切走则丢弃响应（不管 silent 与否，避免首次请求也被旧响应覆盖）。
    if (!guard.isCurrent()) return

    if (listRes.code !== 0) {
      throw new Error(typeof listRes.msg === 'string' ? listRes.msg : t('UIClub_LoadFail10'))
    }

    if (infoRes.code !== 0) {
      throw new Error(typeof infoRes.msg === 'string' ? infoRes.msg : t('UIClub_LoadFail'))
    }

    const list = Array.isArray(listRes.data?.list) ? listRes.data.list : []
    const nextRecords: RecordItem[] = list.map((item, index) =>
      mapRecordItem((item as Record<string, unknown>) ?? {}, index),
    )

    const info = (infoRes.data?.info as Record<string, unknown> | undefined) ?? {}
    const handNum = toSafeNumber(info.hand_num)
    const gameNum = toSafeNumber(info.game_num)
    const nextMetrics: SummaryMetric[] = [
      {
        label: t('UIMine_RecordItemsNormal_3RCUa3w8') + '/' + t('UIData_YGvXd5iXr_003'),
        value: `${handNum}/${gameNum}`,
      },
      { label: t('UIClub_GainNum'), value: formatSigned(info.profit) },
      {
        label: t('UIClub_Text57'),
        value: Math.abs(toSafeNumber(info.fee)).toLocaleString('en-US'),
      },
    ]

    metrics.value = nextMetrics
    records.value = nextRecords

    if (requestKey) {
      void userCache(gameStore.loginUserId).put<RecordCacheEntry>(USER_STORE_CAREER, requestKey, {
        metrics: nextMetrics,
        records: nextRecords,
      })
    }
  } catch (error) {
    if (!guard.isCurrent()) return
    if (silent) return
    records.value = []
    const message = error instanceof Error ? error.message : t('UIClub_LoadFail10')
    showFailToast(message)
  } finally {
    if (!silent) loading.value = false
  }
}

async function loadFromCacheThenRefresh(): Promise<void> {
  const key = buildCacheKey()
  if (!key) {
    await fetchFriendsRecord()
    return
  }
  const cached = await userCache(gameStore.loginUserId).get<RecordCacheEntry>(
    USER_STORE_CAREER,
    key,
  )
  if (cached) {
    applyCache(cached)
    // 命中缓存：立即触发静默刷新；15s TTL 内同 key 跳过；同 key 已在飞行则合并。
    void refresher.refresh(() => fetchFriendsRecord(true))
  } else {
    await fetchFriendsRecord()
  }
}

const customizeStartText = computed(() => formatDateTime(startDateModel.value, 'DD/MM/YYYY'))
const customizeEndText = computed(() => formatDateTime(endDateModel.value, 'DD/MM/YYYY'))

function onFilterClick(tab: FilterTab): void {
  if (tab.key === 'customize') {
    // 首次进入 Customize，picker 内默认昨天 0 点 → 今天 23:59:59。
    if (!customizeApplied.value) {
      startDateModel.value = startOfDay(addDays(now, -1))
      endDateModel.value = endOfDay(now)
    }
    isDatePickerVisible.value = true
    return
  }

  activeFilter.value = tab.key
  if (tab.key === 'today') {
    startDateModel.value = startOfDay(now)
    endDateModel.value = startOfDay(now)
  } else if (tab.key === 'week') {
    startDateModel.value = startOfDay(addDays(now, -6))
    endDateModel.value = startOfDay(now)
  } else if (tab.key === 'halfmonth') {
    startDateModel.value = startOfDay(addDays(now, -13))
    endDateModel.value = startOfDay(now)
  }
  void loadFromCacheThenRefresh()
}

function onDatePickerConfirm(payload: { startDate: Date; endDate: Date }): void {
  startDateModel.value = payload.startDate
  endDateModel.value = payload.endDate
  customizeApplied.value = true
  activeFilter.value = 'customize'
  void loadFromCacheThenRefresh()
}

function openRecordDetail(item: RecordItem): void {
  const roomId = Number(item.id)
  if (!Number.isFinite(roomId) || roomId <= 0) return
  void router.push({
    path: '/mine/career/friends/data/detail',
    query: { roomId: String(roomId) },
  })
}

onMounted(() => {
  void loadFromCacheThenRefresh()
})

onBeforeUnmount(() => {
  refresher.clear()
})
</script>

<template>
  <div class="page-shell friends-record-page" :style="backgroundStyle">
    <HeaderBack :title="title" :extra-padding="true" />

    <div class="content-wrap">
      <section class="summary-card">
        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            type="button"
            class="filter-tab"
            :class="{ active: activeFilter === tab.key, 'is-customize': tab.key === 'customize' }"
            @click="onFilterClick(tab)"
          >
            <div v-if="tab.key === 'customize' && customizeApplied" class="cunstomize-date">
              <div>
                <p>{{ customizeStartText }}</p>
                <p>{{ customizeEndText }}</p>
              </div>
              <img src="@/assets/icons/wallet/ic_arrow_left.svg" class="icon-arrow" />
            </div>
            <span v-else>{{ tab.label }}</span>
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

      <p class="timezone-text">{{ t('UICommon_TimeZone') }}：UTC+0</p>

      <section class="record-list">
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!records.length" class="list-status">{{ t('UIClub_No7') }}</p>
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
                  <AppSvgIcon name="clock" class="time-icon" />
                  <span>{{ item.time }}</span>
                </div>
              </div>
            </div>

            <div class="record-right">
              <div class="fee-chip">
                <div class="fee-line">
                  <span>{{ item.feeText }}</span>
                  <span :class="item.feePositive ? 'value-up' : 'value-down'">
                    {{ item.feeValue }}
                  </span>
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

      <DateRangePicker
        v-model:visible="isDatePickerVisible"
        :start-date="startDateModel"
        :end-date="endDateModel"
        :min-date="minSelectableDate"
        :max-date="maxSelectableDate"
        @confirm="onDatePickerConfirm"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.friends-record-page {
  height: 100dvh;
  // padding-top: calc(env(safe-area-inset-top) + 0.459rem);
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-image: var(--friends-record-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: var(--c-text);
    background-color: var(--c-page);
    background-image: var(--friends-record-bg-light);
  }
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
  margin-top: 0.35rem;
  border-radius: 0.76013rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.36317rem 0.4392rem;

  @include theme-light {
    background: var(--c-surface);
  }
}

.filter-tabs {
  width: 7.55067rem;
  max-width: 100%;
  height: 1.35979rem;
  border-radius: 0.76013rem;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  overflow: hidden;
  margin: 0 auto;

  @include theme-light {
    background: #e3e3e3;
  }
}

.filter-tab {
  flex: 1 1 0;
  min-width: 0;
  border: 0;
  height: 100%;
  border-radius: 1.3844rem;
  background: transparent;
  color: #f9f9f9;
  font-size: 0.40541rem;
  line-height: 0.44299rem;
  padding: 0.11075rem 0.24rem;

  @include theme-light {
    color: var(--c-text);
  }

  &.is-customize {
    flex: 1.5 1 0;
    font-size: 0.36235rem;
    width: 3rem;
    .cunstomize-date {
      display: flex;
      p {
        margin: 0.1rem 0;
        font-size: 0.3rem;
      }
      img {
        width: 0.25rem;
        height: 0.25rem;
        margin-top: 0.3rem;
        margin-left: 0.1rem;
        transform: rotate(-90deg);

        @include theme-light {
          filter: brightness(0);
        }
      }
    }
  }

  &.active {
    background: rgba(255, 255, 255, 0.17);
    font-weight: 500;
    line-height: 0.83;

    @include theme-light {
      background: #cfcfcf;
    }
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

  @include theme-light {
    background: var(--c-divider);
  }
}

.timezone-text {
  margin: 0.2rem 0.4rem 0.6rem;
  text-align: right;
  font-size: 0.25861rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.5);

  @include theme-light {
    color: var(--c-text-muted);
  }
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

  @include theme-light {
    color: #fff;
    border-color: rgba(242, 242, 242, 0.4);
    background: rgba(89, 42, 111, 0.62);
    box-shadow: 0.09rem 0.11rem 0.18rem rgba(0, 0, 0, 0.14);
    backdrop-filter: blur(0.28112rem);
  }
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

  @include theme-light {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.92);
    background:
      radial-gradient(
        70% 145% at 22% 12%,
        rgba(255, 255, 255, 0.18) 0%,
        rgba(255, 255, 255, 0) 72%
      ),
      linear-gradient(95deg, rgba(157, 18, 124, 0.62) 0%, rgba(183, 53, 158, 0.7) 100%);
    box-shadow:
      inset 0 0.08rem 0.24rem rgba(255, 255, 255, 0.18),
      0 0.08rem 0.18rem rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(0.67653rem);
  }
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

  .time-icon {
    width: 0.35829rem;
    height: 0.35829rem;
    color: #fff;

    @include theme-light {
      color: #fff;
    }
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

  @include theme-light {
    background: rgba(0, 0, 0, 0.27);
  }
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
  color: var(--c-profit);
}

.value-down {
  color: var(--c-loss);
}

.chevron {
  font-size: 0.648rem;
  line-height: 1;
  color: #f9f9f9;

  @include theme-light {
    color: #fff;
  }
}
</style>

<style lang="scss">
:root[data-theme='light'] .friends-record-page {
  --c-brand: #05c297;
  --c-brand-rgb: 5, 194, 151;
  --c-loss: #05c297;
  --c-profit: #e5384f;

  color: rgba(15, 8, 8, 0.85);
  background-color: #f3f4f6;
  background-image: var(--friends-record-bg-light);

  .back-trigger,
  .back-icon {
    color: rgba(15, 8, 8, 0.85);
  }

  .title {
    text-shadow: none;
  }

  .summary-card {
    background: rgba(255, 255, 255, 1);
  }

  .filter-tabs {
    background: rgba(0, 0, 0, 0.06);
  }

  .filter-tab {
    color: rgba(15, 8, 8, 0.85);

    &.is-customize img {
      filter: brightness(0);
    }

    &.active {
      background: rgba(0, 0, 0, 0.14);
    }
  }

  .metric-divider {
    background: rgba(0, 0, 0, 0.1);
  }

  .timezone-text {
    color: rgba(15, 8, 8, 0.45);
  }

  .list-status {
    color: rgba(15, 8, 8, 0.6);
  }
}
</style>

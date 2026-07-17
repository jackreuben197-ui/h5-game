<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'

import { postOrgClubClubWalletStatsApi } from '@/api/org'
import type { OrgClubClubWalletStatsData } from '@/api/models/org'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import DateRangePicker from '@/components/DateRangePicker/DateRangePicker.vue'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { useUserInfoStore } from '@/stores/userInfo'
import { t } from '@/i18n'
import { formatUC } from '@/utils/roomVisibility'

type PickTarget = 'start' | 'end'
type MetricKey = keyof Pick<
  OrgClubClubWalletStatsData,
  | 'recover_club'
  | 'recover_user'
  | 'to_club'
  | 'to_user'
  | 'room_profit'
  | 'insurance'
  | 'mtt_profit'
  | 'sng_profit'
  | 'jackpot_profit'
  | 'mini_game_profit'
>

interface MetricItem {
  key: MetricKey
  label: string
}

const userInfoStore = useUserInfoStore()
const loading = ref(false)
const stats = ref<OrgClubClubWalletStatsData>({})

const now = new Date()
const startDate = ref(startOfDay(now))
const endDate = ref(startOfDay(now))
const minSelectableDate = startOfDay(addMonths(now, -3))
const maxSelectableDate = endOfDay(now)
const isDatePickerVisible = ref(false)
const datePickerTarget = ref<PickTarget>('start')

const backgroundStyle = computed(() => ({
  '--club-wallet-bg-dark': `url(${mainBgUrl})`,
  '--club-wallet-bg-light': `url(${mainBgLightUrl})`,
}))

const pageTitle = computed(() => translated('UIGuildRevenueManagement', '收益管理'))
const startDateText = computed(() => formatDate(startDate.value))
const endDateText = computed(() => formatDate(endDate.value))
const timezoneText = computed(() => {
  const timezone = Number(userInfoStore.currentClub?.time_zone ?? 0)
  return `UTC${timezone >= 0 ? '+' : ''}${timezone}`
})

const transferMetrics = computed<MetricItem[]>(() => [
  { key: 'recover_club', label: translated('UIClub_league_recycling', '联盟回收') },
  { key: 'recover_user', label: translated('UIClub_UnionCoin2', '成员回收') },
  { key: 'to_club', label: translated('UIClub_league_issue', '联盟发放') },
  { key: 'to_user', label: translated('UIClub_UnionCoin3', '成员发放') },
])

const revenueMetrics = computed<MetricItem[]>(() => {
  const revenue = translated('UIData_YGvXd5iXr_010', '收益')
  return [
    { key: 'room_profit', label: translated('UIMine_WalletPlatform_fee_f', '牌局服务费') },
    { key: 'insurance', label: translated('UIClub_Insurance', '保险') },
    { key: 'mtt_profit', label: `MTT${revenue}` },
    { key: 'sng_profit', label: `SNG${revenue}` },
    { key: 'jackpot_profit', label: `Jackpot${revenue}` },
    { key: 'mini_game_profit', label: translated('UIClub_Text24', '小游戏收益') },
  ]
})

function translated(key: string, fallback: string): string {
  const value = t(key)
  return value && value !== key ? value : fallback
}

function toSafeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatBalance(value: unknown): string {
  return formatUC(toSafeNumber(value))
}

function formatSigned(value: unknown): string {
  const amount = toSafeNumber(value)
  if (amount === 0) {
    return '0'
  }

  const formatted = formatUC(Math.abs(amount))
  return `${amount > 0 ? '+' : '-'}${formatted}`
}

function valueClass(value: unknown): string {
  const amount = toSafeNumber(value)
  if (amount > 0) return 'metric-value--profit'
  if (amount < 0) return 'metric-value--loss'
  return 'metric-value--neutral'
}

function metricValue(key: MetricKey): number {
  return toSafeNumber(stats.value[key])
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
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

function toRequestTimestamp(date: Date, end: boolean): number {
  const value = new Date(date)
  if (end) {
    const today = startOfDay(new Date()).getTime()
    if (startOfDay(value).getTime() === today) {
      return Math.floor(Date.now() / 1000)
    }
    value.setHours(23, 59, 59, 999)
  } else {
    value.setHours(0, 0, 0, 0)
  }
  return Math.floor(value.getTime() / 1000)
}

function openDatePicker(target: PickTarget): void {
  datePickerTarget.value = target
  isDatePickerVisible.value = true
}

function closeDatePicker(): void {
  isDatePickerVisible.value = false
}

function onDateConfirm(): void {
  void fetchStats()
}

async function fetchStats(): Promise<void> {
  if (loading.value) {
    return
  }

  loading.value = true
  try {
    const response = await postOrgClubClubWalletStatsApi({
      gold_type: 1,
      start_time: toRequestTimestamp(startDate.value, false),
      end_time: toRequestTimestamp(endDate.value, true),
    })
    if (response.code !== 0 || !response.data) {
      throw new Error(
        typeof response.msg === 'string' ? response.msg : translated('UIClub_LoadFail', '加载失败'),
      )
    }
    stats.value = response.data
  } catch (error) {
    stats.value = {}
    showFailToast(
      error instanceof Error ? error.message : translated('UIClub_LoadFail', '加载失败'),
    )
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchStats()
})
</script>

<template>
  <div class="page-shell club-wallet-logs-bg" :style="backgroundStyle">
    <HeaderBack :title="pageTitle" />

    <main class="wallet-logs-content">
      <section class="fund-card">
        <div class="date-range">
          <button
            type="button"
            class="date-btn"
            :disabled="loading"
            @click="openDatePicker('start')"
          >
            <span class="calendar-icon" aria-hidden="true"></span>
            <span>{{ startDateText }}</span>
          </button>
          <span class="date-separator" aria-hidden="true"></span>
          <button type="button" class="date-btn" :disabled="loading" @click="openDatePicker('end')">
            <span class="calendar-icon" aria-hidden="true"></span>
            <span>{{ endDateText }}</span>
          </button>
        </div>

        <div class="fund-balances">
          <div class="fund-balance-item">
            <span class="fund-label">{{ translated('UIGuildMgr_InitFund', '初始基金') }}</span>
            <strong class="fund-value">{{ formatBalance(stats.gold_before) }}</strong>
          </div>
          <div class="fund-balance-item">
            <span class="fund-label">{{ translated('UIGuildMgr_CrrentFund', '当前基金') }}</span>
            <strong class="fund-value">{{ formatBalance(stats.gold_after) }}</strong>
          </div>
        </div>
      </section>

      <p class="timezone">{{ t('UICommon_TimeZone') }}: {{ timezoneText }}</p>

      <section class="metrics-card metrics-card--transfer">
        <div v-for="item in transferMetrics" :key="item.key" class="metric-item">
          <span class="metric-label">{{ item.label }}</span>
          <strong class="metric-value" :class="valueClass(metricValue(item.key))">
            {{ formatSigned(metricValue(item.key)) }}
          </strong>
        </div>
      </section>

      <section class="metrics-card metrics-card--revenue">
        <div v-for="item in revenueMetrics" :key="item.key" class="metric-item">
          <span class="metric-label">{{ item.label }}</span>
          <strong class="metric-value" :class="valueClass(metricValue(item.key))">
            {{ formatSigned(metricValue(item.key)) }}
          </strong>
        </div>
      </section>

      <p v-if="loading" class="loading-text">{{ t('SuperView2') }}...</p>
    </main>

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

.club-wallet-logs-bg {
  height: 100dvh;
  background-color: #0f0f0f;
  background-image: var(--club-wallet-bg-dark);
  background-size: cover;
  background-position: center top;

  @include theme-light {
    background-color: #f3f4f6;
    background-image: var(--club-wallet-bg-light);
  }
}

.wallet-logs-content {
  display: flex;
  flex-direction: column;
  gap: 0.26667rem;
  padding-top: 0.32rem;
}

.fund-card,
.metrics-card {
  border: 0.02rem solid rgba(243, 243, 243, 0.1);
  background: rgba(0, 0, 0, 0.22);
  box-shadow: inset 0 0 0.01rem rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(0.225rem);

  @include theme-light {
    border-color: transparent;
    background: #fff;
    box-shadow: none;
    backdrop-filter: none;
  }
}

.fund-card {
  padding: 0.36rem 0.44rem 0.42rem;
  border-radius: 0.76rem;
}

.date-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
}

.date-btn {
  flex: 1;
  min-width: 0;
  min-height: 1.36rem;
  padding: 0 0.24rem;
  border: 0.02rem solid rgba(242, 242, 242, 0.34);
  border-radius: 0.84rem;
  background: rgba(255, 255, 255, 0.11);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font-size: 0.36rem;
  line-height: 1;

  &:disabled {
    opacity: 0.7;
  }

  @include theme-light {
    border-color: transparent;
    background: rgba(139, 136, 136, 0.15);
    color: #222;
  }
}

.date-separator {
  width: 0.32rem;
  height: 0.03rem;
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(249, 249, 249, 0.72);

  @include theme-light {
    background: rgba(34, 34, 34, 0.5);
  }
}

.calendar-icon {
  position: relative;
  width: 0.36rem;
  height: 0.34rem;
  flex: 0 0 auto;
  border: 0.025rem solid currentColor;
  border-radius: 0.07rem;

  &::before {
    content: '';
    position: absolute;
    left: -0.025rem;
    right: -0.025rem;
    top: 0.08rem;
    border-top: 0.025rem solid currentColor;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0.07rem;
    right: 0.07rem;
    top: -0.065rem;
    height: 0.1rem;
    border-left: 0.025rem solid currentColor;
    border-right: 0.025rem solid currentColor;
  }
}

.fund-balances {
  margin-top: 0.38rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.fund-balance-item {
  position: relative;
  min-height: 1.22rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;

  & + &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.16rem;
    bottom: 0.16rem;
    width: 0.02rem;
    background: rgba(243, 243, 243, 0.18);
  }

  @include theme-light {
    & + &::before {
      background: rgba(34, 34, 34, 0.14);
    }
  }
}

.fund-label,
.metric-label {
  color: rgba(243, 243, 243, 0.88);

  @include theme-light {
    color: rgba(34, 34, 34, 0.78);
  }
}

.fund-label {
  font-size: 0.34rem;
  line-height: 1.2;
}

.fund-value {
  color: #fff;
  font-size: 0.54rem;
  line-height: 1;
  font-weight: 500;

  @include theme-light {
    color: #222;
  }
}

.timezone {
  margin: -0.04rem 0 0;
  padding-right: 0.08rem;
  color: rgba(235, 245, 255, 0.68);
  font-size: 0.26rem;
  line-height: 1.2;
  text-align: right;

  @include theme-light {
    color: rgba(34, 34, 34, 0.5);
  }
}

.metrics-card {
  border-radius: 0.76rem;
  padding: 0.22rem 0.28rem;
  display: grid;
}

.metrics-card--transfer {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metrics-card--revenue {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-item {
  position: relative;
  min-width: 0;
  min-height: 1.38rem;
  padding: 0.16rem 0.08rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.13rem;
  text-align: center;
}

.metrics-card--transfer .metric-item + .metric-item::before,
.metrics-card--revenue .metric-item:not(:nth-child(3n + 1))::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.2rem;
  bottom: 0.2rem;
  width: 0.02rem;
  background: rgba(243, 243, 243, 0.18);
}

.metrics-card--revenue .metric-item:nth-child(n + 4)::after {
  content: '';
  position: absolute;
  left: 0.18rem;
  right: 0.18rem;
  top: 0;
  height: 0.02rem;
  background: rgba(243, 243, 243, 0.18);
}

.metrics-card {
  @include theme-light {
    .metric-item::before,
    .metric-item::after {
      background: rgba(34, 34, 34, 0.14);
    }
  }
}

.metric-label {
  max-width: 100%;
  font-size: 0.28rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.metric-value {
  max-width: 100%;
  font-size: 0.39rem;
  line-height: 1;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.metric-value--profit {
  color: #ff5364;
}

.metric-value--loss {
  color: var(--c-loss);

  @include theme-light {
    color: #00af83;
  }
}

.metric-value--neutral {
  color: #fff;

  @include theme-light {
    color: #222;
  }
}

.loading-text {
  margin: 0;
  color: rgba(249, 249, 249, 0.72);
  font-size: 0.28rem;
  text-align: center;

  @include theme-light {
    color: rgba(34, 34, 34, 0.6);
  }
}

@media (max-width: 340px) {
  .date-btn {
    min-height: 1.18rem;
    padding: 0 0.12rem;
    font-size: 0.31rem;
  }

  .metric-label {
    font-size: 0.25rem;
  }

  .metric-value {
    font-size: 0.34rem;
  }
}
</style>

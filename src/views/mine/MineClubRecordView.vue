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
import { t } from '@/i18n'

const router = useRouter()
const userInfoStore = useUserInfoStore()

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
  profit: string
}

const gameTabs = [t('adaptation10022'), t('adaptation10009'), t('PokerType_2')]
const timeTabs = [
  t('UIData_Today'),
  '7' + t('UIHappyShop_ActivityShopDay'),
  '30' + t('UIHappyShop_ActivityShopDay'),
]
const selectedGame = ref(gameTabs[0])
const selectedTime = ref(timeTabs[0])
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
    case t('UIData_Today'):
      return t('UIClub_Income3')
    case '7' + t('UIHappyShop_ActivityShopDay'):
      return '7' + t('UIClub_Income')
    case '30' + t('UIHappyShop_ActivityShopDay'):
      return '30' + t('UIClub_Income')
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
  if (selectedGame.value === t('adaptation10009')) {
    return [1, 2, 3]
  }
  if (selectedGame.value === t('PokerType_2')) {
    return [0]
  }
  return [0]
}

function resolveTimeType(): number {
  switch (selectedTime.value) {
    case t('UIData_Today'):
      return 1
    case '7' + t('UIHappyShop_ActivityShopDay'):
      return 2
    case '30' + t('UIHappyShop_ActivityShopDay'):
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
    { label: t('UITexasInfo_games'), value: totalGameCnt.toLocaleString('en-US') },
    { label: t('UIMine_RecordItemsNormal_3RCUa3w8'), value: totalHand.toLocaleString('en-US') },
  ]

  rightMetrics.value = [
    { label: t('UIClub_Mlistinfo_rRyW4JkW'), value: `${vpip}%` },
    { label: t('UITexasInfo_winrate'), value: `${wins}%` },
  ]

  detailRowsOne.value = [
    { label: t('UIData_YGvXd5iXr_003'), value: totalGameCnt.toLocaleString('en-US') },
    { label: t('UIClub_Text46'), value: formatUC(totalEarn) },
    { label: t('UIData_kpHsdqDe5'), value: avgEarn },
    { label: t('UIClub_Text39'), value: `${wtsd}%` },
  ]

  detailRowsTwo.value = [
    { label: t('UIClub_Text47'), value: `${prf}%` },
    { label: t('UIClub_Text48'), value: `${cbet}%` },
    { label: t('adaptation10318'), value: `${allinWins}%` },
    { label: t('UIClub_Text49'), value: af.toLocaleString('en-US') },
  ]

  todayProfit.value = formatUC(totalEarn)
}

async function fetchStatsSummary(): Promise<void> {
  try {
    const response = await postStatsUserStatsApi({
      game_types: resolveGameTypes(),
      poker_types: selectedGame.value === t('PokerType_2') ? [2] : [0],
      time_type: resolveTimeType(),
      filter_type: 1, // 默认联盟币
      room_type: 0, // 生涯
      ...(userInfoStore.currentClub?.club_id ? { club_id: userInfoStore.currentClub.club_id } : {}),
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

async function fetchClubRecords(): Promise<void> {
  loading.value = true
  try {
    const response = await postRoomCenterHistoryListApi({
      limit: 20,
      offset: 0,
      game_types: resolveGameTypes(),
      poker_types: selectedGame.value === t('PokerType_2') ? [2] : [0],
      time_type: resolveTimeType(),
      club_id: userInfoStore.currentClub?.club_id,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail9'))
    }

    const rows = extractRecords(response.data?.records)
    records.value = rows.map((row, index) => mapRecord(row, index))
  } catch (error) {
    records.value = []
    const message = error instanceof Error ? error.message : t('UIClub_LoadFail9')
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

async function refreshAll(): Promise<void> {
  await Promise.all([fetchStatsSummary(), fetchClubRecords()])
}

function goToDetail(item: RecordCard): void {
  const roomId = Number(item.roomId.replace(/\D/g, '')) || 0
  void router.push({
    path: '/mine/club-record/detail',
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
    <HeaderBack :title="title" extra-padding />

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

      <section class="content-list">
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!records.length" class="list-status">{{ t('UIClub_NoRecord3') }}</p>
        <article
          v-for="(item, index) in records"
          :key="item.id"
          class="glass-card record-card"
          :class="{ 'is-first-of-date': isFirstOfDate(index) }"
          @click="goToDetail(item)"
        >
          <div class="timeline">
            <span v-if="isFirstOfDate(index)" class="date-label">
              {{ item.endMonth }}<br />{{ item.endDay }}
            </span>
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
                  <span>{{ t('UIJackPotInfo_blindLevel') }}:</span>
                  <span>{{ item.blinds }}</span>
                </div>
                <div>
                  <span>{{ t('UIMine_RecordItemsNormal_3RCUa3w8') }}:</span>
                  <span>{{ item.hands }}</span>
                </div>
                <div>
                  <span>{{ t('UIClub_Text36') }}:</span>
                  <span>{{ item.duration }}</span>
                </div>
                <div>
                  <span>{{ t('RecordDetail102') }}:</span>
                  <span>{{ item.endAt }}</span>
                </div>
              </div>
              <div class="profit" :class="{ pos: item.profit.startsWith('-') }">
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
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.stats-card {
  margin-top: 0.3rem;
  padding: 0.3632rem 0.67864rem 0.36739rem 0.67864rem;
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
  text-align: center;

  .profit-title {
    font-size: 0.33821rem;
  }

  .profit-value {
    margin-top: 0.12rem;
    font-size: 0.71789rem;
    font-weight: 700;
    color: #ff7a8f;
    &.pos {
      color: #4ee58f;
    }
  }
}

.detail-grid {
  margin-top: 0.22rem;

  .line {
    height: 0.02rem;
    background: rgba(255, 255, 255, 0.18);
    margin: 0.14rem 0;
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

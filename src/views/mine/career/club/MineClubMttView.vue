<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { postStatsMttHistoryListByDateApi, postStatsUserStatsApi } from '@/api/stats'
import type { StatsMttHistoryDateGroup, StatsMttHistoryRecord } from '@/api/models/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import iconChips from '@/assets/icons/icon_chips.png'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'
import { formatDateTime } from '@/utils/time'
import {
  multiLanguageTemplateVersion,
  resolveTemplateTextByKey,
} from '@/utils/multiLanguageTemplate'
import { getLocale, t } from '@/i18n'

const router = useRouter()
const userInfoStore = useUserInfoStore()

const title = computed(() => 'MTT')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

// 对齐客户端 TexasBusiness.CheckRequestPara：NLH/PLO/6+ 的 game_types + poker_types 组合。
interface GameTab {
  label: string
  key: string
  gameTypes: number[]
  pokerTypes: number[]
}
interface TabItem {
  label: string
  key: string
}

const gameTabs: GameTab[] = [
  { label: 'NLH', key: 'nlh', gameTypes: [0], pokerTypes: [0] },
  { label: 'PLO', key: 'plo', gameTypes: [1, 2, 3], pokerTypes: [0] },
  { label: '6+', key: '6+', gameTypes: [0, 1, 2, 3], pokerTypes: [2] },
]

const dateTabs: TabItem[] = [
  { label: t('UIData_Today'), key: 'today' },
  { label: '7' + t('UIHappyShop_ActivityShopDay'), key: 'week' },
  { label: '30' + t('UIHappyShop_ActivityShopDay'), key: 'month' },
]

// 币种筛选：1-USDT 2-联盟币 3-记分牌（俱乐部生涯固定记分牌）
const FILTER_TYPE = 3
const PAGE_SIZE = 10

const selectedGame = ref(gameTabs[0])
const selectedTime = ref(dateTabs[0].key)
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const listOffset = ref(0)

interface MttRecord {
  matchId: number
  rawName: string
  rankText: string
  hasRank: boolean
  rewardText: string
  hasReward: boolean
  isDiamond: boolean
  goldType: number
  endTimeText: string
  dateKey: string
  endDay: string
  endMonth: string
}

interface MttRecordView extends MttRecord {
  name: string
  showDate: boolean
  isDateLastData: boolean
}

const records = ref<MttRecord[]>([])

// 名称走多语言模板映射（对齐客户端 GetRoomNameByKey），模板异步加载完成后随版本号重算；
// 同时按 dateKey 计算日期列的显示/收尾状态（参考 MineRecordView）。
const displayRecords = computed<MttRecordView[]>(() => {
  void multiLanguageTemplateVersion.value
  return records.value.map((card, index) => {
    const prevCard = records.value[index - 1]
    const nextCard = records.value[index + 1]
    return {
      ...card,
      name: resolveTemplateTextByKey(card.rawName, getLocale()) || t(card.rawName) || card.rawName,
      showDate: card.dateKey !== prevCard?.dateKey,
      isDateLastData: card.dateKey !== nextCard?.dateKey,
    }
  })
})

const summary = ref([
  { label: t('UIData_YGvXd5iXr_005'), value: '0' },
  { label: t('UITexasInfo_wincount'), value: '0' },
  { label: t('UIData_YGvXd5iXr_006'), value: '0' },
  { label: t('UIData_YGvXd5iXr_007'), value: '0' },
  { label: t('UIData_YGvXd5iXr_008'), value: '0' },
])

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function resolveTimeType(): number {
  switch (selectedTime.value) {
    case 'week':
      return 2
    case 'month':
      return 3
    default:
      return 1
  }
}

// 时区偏移（小时），对齐客户端 time_zone 语义。
function resolveTimeZone(): number {
  return -Math.round(new Date().getTimezoneOffset() / 60)
}

// 奖金显示对齐客户端：钻石(4)按原值，其余币种按 1/100。
function formatAward(value: number, goldType: number): string {
  return goldType === 4 ? value.toLocaleString('en-US') : formatUC(value)
}

// 对齐客户端 UIRecordMatchListItem.UpdateListItemRecord 的奖金显示规则。
function buildRewardText(row: StatsMttHistoryRecord): { text: string; visible: boolean } {
  const goldType = toSafeNumber(row.gold_type)
  const award = toSafeNumber(row.award)
  const hunterAward = toSafeNumber(row.hunter_award)

  if (toSafeNumber(row.apply_fee_hunter) > 0) {
    if (award === 0 && hunterAward === 0) {
      return { text: '', visible: false }
    }
    return {
      text: `${formatAward(award, goldType)}/${formatAward(hunterAward, goldType)}`,
      visible: true,
    }
  }
  if (award === 0) {
    return { text: '', visible: false }
  }
  return { text: formatAward(award, goldType), visible: true }
}

function mapMttRecord(
  row: StatsMttHistoryRecord,
  dateKey: string,
  endDay: string,
  endMonth: string,
): MttRecord {
  const rank = toSafeNumber(row.rank)
  const goldType = toSafeNumber(row.gold_type)
  const reward = buildRewardText(row)
  const endTime = toSafeNumber(row.end_time)

  return {
    matchId: toSafeNumber(row.match_id),
    rawName: String(row.match_name ?? '--'),
    rankText: `${rank}/${toSafeNumber(row.all_apply_count)}(${toSafeNumber(row.all_award_count)})`,
    hasRank: rank > 0,
    rewardText: reward.text,
    hasReward: reward.visible,
    isDiamond: goldType === 4,
    goldType,
    endTimeText: endTime > 0 ? formatDateTime(endTime, 'DD/MM HH:mm') : '--',
    dateKey,
    endDay,
    endMonth,
  }
}

// 一个日期分组拍平为多条记录，日期信息挂在每条记录上（显隐由 displayRecords 统一计算）。
function flattenDateGroup(group: StatsMttHistoryDateGroup): MttRecord[] {
  const date = String(group.date ?? '')
  const dateTs = date ? dayjs(date) : null
  const isValid = Boolean(dateTs?.isValid())
  const dateKey = isValid ? dateTs!.format('YYYY-MM-DD') : '--'
  const endDay = isValid ? dateTs!.format('DD') : '--'
  const endMonth = isValid ? dateTs!.format('M' + t('UIMine_VIP_month')) : '--'

  const rows = Array.isArray(group.list) ? group.list : []
  return rows.map((row) => mapMttRecord(row, dateKey, endDay, endMonth))
}

async function fetchSummary(): Promise<void> {
  try {
    const response = await postStatsUserStatsApi({
      game_types: selectedGame.value.gameTypes,
      poker_types: selectedGame.value.pokerTypes,
      time_type: resolveTimeType(),
      filter_type: FILTER_TYPE,
      room_type: 0,
      time_zone: resolveTimeZone(),
      ...(userInfoStore.currentClub?.club_id ? { club_id: userInfoStore.currentClub.club_id } : {}),
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail5'))
    }

    // 汇总五项使用服务端聚合（对齐客户端 mtt_room_data），分页时不受当前页影响。
    const mttData = response.data?.mtt_room_data
    summary.value = [
      { label: t('UIData_YGvXd5iXr_005'), value: String(toSafeNumber(mttData?.play_times)) },
      { label: t('UITexasInfo_wincount'), value: String(toSafeNumber(mttData?.win_times)) },
      { label: t('UIData_YGvXd5iXr_006'), value: String(toSafeNumber(mttData?.frist_times)) },
      { label: t('UIData_YGvXd5iXr_007'), value: String(toSafeNumber(mttData?.second_times)) },
      { label: t('UIData_YGvXd5iXr_008'), value: String(toSafeNumber(mttData?.third_times)) },
    ]
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_LoadFail5')
    showFailToast(message)
  }
}

async function fetchMttHistory(reset = false): Promise<void> {
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

  try {
    const currentOffset = reset ? 0 : listOffset.value
    const response = await postStatsMttHistoryListByDateApi({
      timeType: resolveTimeType(),
      filterType: FILTER_TYPE,
      gameTypes: selectedGame.value.gameTypes,
      pokerTypes: selectedGame.value.pokerTypes,
      currentTimeStr: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      timeZone: resolveTimeZone(),
      limit: PAGE_SIZE,
      offset: currentOffset,
      ...(userInfoStore.currentClub?.club_id ? { clubid: userInfoStore.currentClub.club_id } : {}),
    })
    if (response.code !== 0) {
      throw new Error(
        typeof response.msg === 'string'
          ? response.msg
          : t('UIClub_Load') + ' MTT ' + t('UIClub_Fail11'),
      )
    }

    const groups = Array.isArray(response.data?.records) ? response.data.records : []
    const flattened = groups.flatMap((group) => flattenDateGroup(group))

    records.value = reset ? flattened : [...records.value, ...flattened]

    listOffset.value = currentOffset + groups.length
    const total = toSafeNumber(response.data?.total)
    hasMore.value = groups.length >= PAGE_SIZE && (total === 0 || listOffset.value < total)
  } catch (error) {
    if (reset) {
      records.value = []
      hasMore.value = false
    }
    const message =
      error instanceof Error ? error.message : t('UIClub_Load') + ' MTT ' + t('UIClub_Fail11')
    showFailToast(message)
  } finally {
    if (reset) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

async function refreshAll(): Promise<void> {
  await Promise.all([fetchSummary(), fetchMttHistory(true)])
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
    void fetchMttHistory(false)
  }
}

function goDetail(item: MttRecord): void {
  if (item.matchId <= 0) {
    return
  }
  void router.push({
    path: '/mine/career/club/mtt/detail',
    query: {
      id: String(item.matchId),
      gold_type: String(item.goldType),
    },
  })
}

function selectGame(tab: GameTab): void {
  if (selectedGame.value === tab) {
    return
  }
  selectedGame.value = tab
  void refreshAll()
}

function selectTime(tab: string): void {
  if (selectedTime.value === tab) {
    return
  }
  selectedTime.value = tab
  void refreshAll()
}

onMounted(() => {
  void refreshAll()
})
</script>

<template>
  <div class="page-shell club-mtt-page" :style="backgroundStyle">
    <HeaderBack :title="title" extra-padding />

    <div class="content-wrap" @scroll="onPageScroll">
      <nav class="game-tabs" :aria-label="t('UIClub_Text43')">
        <button
          v-for="item in gameTabs"
          :key="item.key"
          type="button"
          class="plain-tab"
          :class="{ active: selectedGame.key === item.key }"
          @click="selectGame(item)"
        >
          {{ item.label }}
        </button>
      </nav>

      <section class="glass-card summary-card">
        <div class="time-tabs">
          <button
            v-for="item in dateTabs"
            :key="item.key"
            type="button"
            class="time-tab"
            :class="{ active: selectedTime === item.key }"
            @click="selectTime(item.key)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="summary-row">
          <div v-for="item in summary" :key="item.label" class="summary-item">
            <div class="value">{{ item.value }}</div>
            <div class="label">{{ item.label }}</div>
          </div>
        </div>
      </section>

      <section class="timeline">
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!displayRecords.length" class="list-status">
          {{ t('UIUCWalletAddress3') }} MTT {{ t('UICareerRecord') }}
        </p>

        <article
          v-for="card in displayRecords"
          :key="`${card.dateKey}-${card.matchId}`"
          class="timeline-item"
          :class="{ 'timeline-item--top': card.showDate && displayRecords.length > 1 }"
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

          <div class="glass-card mtt-card" @click="goDetail(card)">
            <div class="row-top">
              <div class="match-info">
                <div class="name">{{ card.name }}</div>
                <div class="sub">(ID: {{ card.matchId }})</div>
              </div>
              <div class="result">
                <div v-if="card.hasReward" class="reward">
                  <span class="reward-label">{{ t('MTT_State_Reward') }}</span>
                  <img :src="card.isDiamond ? iconDiamond : iconChips" alt="coin" />
                  <span>{{ card.rewardText }}</span>
                </div>
              </div>
            </div>
            <div class="line"></div>
            <div class="row-bottom">
              <div class="time">{{ t('RecordDetail102') }}: {{ card.endTimeText }}</div>
              <div v-if="card.hasRank" class="rank">
                {{ t('UIMTT_Howtoplay_mc') }}: {{ card.rankText }}
              </div>
            </div>
          </div>
        </article>

        <p v-if="displayRecords.length && loadingMore" class="list-status">
          {{ t('UIClub_LoadMore') }}...
        </p>
        <p v-else-if="displayRecords.length && !hasMore" class="list-status">
          {{ t('UIClub_NoMore') }}
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-mtt-page {
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
  height: calc(100% - 1.6rem);
  padding: 0 0.49rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.game-tabs {
  margin-top: 0.1rem;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.plain-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.37rem;
  padding-bottom: 0.06rem;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.92);
  }
}

.glass-card {
  border-radius: 0.7rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.summary-card {
  margin-top: 0.45rem;
  padding: 0.34rem 0.8rem 0.32rem;
  background: rgba(42, 26, 43, 0.2);
  backdrop-filter: blur(0.03rem);
}

.time-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.1rem;
  padding: 0;
  border-radius: 0.68rem;
  background: rgba(255, 255, 255, 0.2);
}

.time-tab {
  border: 0;
  border-radius: 0.62rem;
  background: transparent;
  color: #f9f9f9;
  opacity: 0.86;
  font-size: 0.42rem;
  padding: 0.36rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.16);
    font-weight: 700;
    opacity: 1;
  }
}

.summary-row {
  margin-top: 0.24rem;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.1rem;
}

.summary-item {
  text-align: center;

  .value {
    font-size: 0.54rem;
    font-weight: 700;
    line-height: 0.65rem;
  }

  .label {
    margin-top: 0rem;
    font-size: 0.22rem;
    color: rgba(255, 255, 255, 0.5);
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  margin-top: 0.46rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  padding: 0.2rem 0;
}

.timeline-item {
  display: grid;
  grid-template-columns: 1.2rem 1fr;
  gap: 0.18rem;
  margin-bottom: 0.16rem;
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

.mtt-card {
  padding: 0.36rem 0.42rem 0.32rem;
}

.match-info {
  min-width: 0;

  .name {
    font-size: 0.3844rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
    max-width: 4rem;
  }

  .sub {
    margin-top: 0.03rem;
    font-size: 0.3314rem;
    color: rgba(255, 255, 255, 0.76);
  }
}

.row-top {
  display: flex;
  justify-content: space-between;
  gap: 0.2rem;
}

.result {
  text-align: right;
  flex-shrink: 0;

  .rank {
    font-size: 0.32rem;
    font-weight: 700;
    color: #ffe084;
  }

  .reward {
    margin-top: 0.05rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.08rem;
    font-size: 0.33rem;

    img {
      width: 0.36rem;
      height: 0.36rem;
      object-fit: contain;
    }
  }
}

.line {
  margin: 0.24rem 0 0.3rem;
  height: 0.02rem;
  background: rgba(255, 255, 255, 0.16);
}

.row-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 0.33rem;
  color: rgba(255, 255, 255, 0.8);
}
</style>

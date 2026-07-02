<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { postClubDataStatsDataDetailApi, postClubDataStatsDataDetailInfoApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'

import { t } from '@/i18n'

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
interface SummaryMetric {
  label: string
  value: string
}

interface PlayerRecord {
  id: number
  name: string
  userId: string
  win: string
  fee: string
  insurance: string
  buyIn: string
  hands: string
  jp: string
  avatar: string
}

interface DetailInfo {
  roomName: string
  creator: string
  creatorId: string
  roomIdText: string
  jackpot: string
  topMetrics: SummaryMetric[]
  middleMetrics: SummaryMetric[]
}

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()

const loading = ref(false)
const detailInfo = ref<DetailInfo>({
  roomName: '--',
  creator: '--',
  creatorId: '--',
  roomIdText: '--',
  jackpot: '0',
  topMetrics: [
    { label: '买入', value: '--' },
    { label: '底分', value: '--' },
    { label: '服务费', value: '--' },
  ],
  middleMetrics: [
    { label: '总人数', value: '--' },
    { label: '保险', value: '0' },
    { label: '总服务费', value: '0' },
  ],
})

const tableHeaders = ['User', '赢', '服务费', '保险', '买入', '手数', 'JP']

const records = ref<PlayerRecord[]>([])

const roomId = computed(() => toSafeNumber(route.query.roomId))
const matchId = computed(() => toSafeNumber(route.query.matchId))

function toSafeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function pickNumber(source: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = Number(source[key])
      if (Number.isFinite(value)) {
        return value
      }
    }
  }
  return fallback
}

function pickString(source: Record<string, unknown>, keys: string[], fallback = '--'): string {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = String(source[key] ?? '').trim()
      if (value) {
        return value
      }
    }
  }
  return fallback
}

function formatNumber(value: unknown): string {
  return toSafeNumber(value).toLocaleString('en-US')
}

function mapDetailInfo(payload: unknown): DetailInfo {
  const info = (payload ?? {}) as Record<string, unknown>
  const buyInMin = pickNumber(info, ['buy_in_min', 'min_buy_in'])
  const buyInMax = pickNumber(info, ['buy_in_max', 'max_buy_in'])
  const sb = pickNumber(info, ['sb', 'small_blind'])
  const bb = pickNumber(info, ['bb', 'big_blind'], sb > 0 ? sb * 2 : 0)
  const feeRate = pickNumber(info, ['fee_ratio'])
  const totalPlayer = pickNumber(info, ['total_player_num', 'player_num', 'total_user_num'])
  const insurance = pickNumber(info, ['insurance', 'insurence'])
  const totalFee = pickNumber(info, ['total_fee', 'fee'])
  const jackpot = pickNumber(info, ['jackpot'], pickNumber(info, ['jackpot']))

  const buyInValue =
    buyInMin > 0 || buyInMax > 0 ? `${formatUC(buyInMin)}~${formatUC(buyInMax || buyInMin)}` : '--'

  return {
    roomName: pickString(info, ['name']),
    creator: pickString(info, ['creator_name', 'create_user_name', 'host_name']),
    creatorId: pickString(info, ['creator_id', 'create_user_id', 'host_user_id']),
    roomIdText: String(roomId.value || '--'),
    jackpot: formatNumber(jackpot),
    topMetrics: [
      { label: '买入', value: buyInValue },
      { label: '底分', value: `${formatUC(sb)}/${formatUC(bb)}` },
      { label: '服务费', value: feeRate > 0 ? `${feeRate / 10}%` : '--' },
    ],
    middleMetrics: [
      { label: '总人数', value: String(totalPlayer || '--') },
      { label: '保险', value: formatUC(insurance) },
      { label: '总服务费', value: formatUC(totalFee) },
    ],
  }
}

function mapPlayerRecord(item: unknown, index: number): PlayerRecord {
  const row = (item ?? {}) as Record<string, unknown>
  return {
    id: index + 1,
    name: pickString(row, ['nick_name']),
    userId: pickString(row, ['random_id'], '--'),
    win: formatUC(pickNumber(row, ['profit', 'win_gold', 'win'])),
    fee: formatUC(pickNumber(row, ['fee'])),
    insurance: formatUC(pickNumber(row, ['insurance', 'insurence'])),
    buyIn: formatUC(pickNumber(row, ['buy_in', 'buy_in_gold'])),
    hands: formatNumber(pickNumber(row, ['hand_num', 'hands'])),
    jp: formatUC(pickNumber(row, ['jackpot', 'jp'])),
    avatar: pickString(row, ['avatar']),
  }
}

async function fetchDetailInfo(): Promise<void> {
  const response = await postClubDataStatsDataDetailInfoApi({
    room_id: roomId.value || undefined,
    match_id: matchId.value || undefined,
    only_master: false,
    slave_club_id: toSafeNumber(userInfoStore.currentClub?.club_id) || undefined,
  })

  if (response.code !== 0) {
    throw new Error(typeof response.msg === 'string' ? response.msg : '加载详情统计失败')
  }

  detailInfo.value = mapDetailInfo(response.data?.info)
}

async function fetchDetailRows(): Promise<void> {
  const response = await postClubDataStatsDataDetailApi({
    room_id: roomId.value || undefined,
    match_id: matchId.value || undefined,
    offset: 0,
    limit: 200,
    only_master: false,
    slave_club_id: toSafeNumber(userInfoStore.currentClub?.club_id) || undefined,
  })

  if (response.code !== 0) {
    throw new Error(typeof response.msg === 'string' ? response.msg : '加载详情列表失败')
  }

  const list = Array.isArray(response.data?.list) ? response.data.list : []
  records.value = list.map((item, idx) => mapPlayerRecord(item, idx))

  const roomInfo = (response.data?.room_info ?? {}) as Record<string, unknown>
  const jackpot = toSafeNumber(roomInfo.jackpot)
  if (jackpot > 0) {
    detailInfo.value = {
      ...detailInfo.value,
      jackpot: formatNumber(jackpot),
    }
  }
}

async function initPage(): Promise<void> {
  if (!roomId.value && !matchId.value) {
    showFailToast(t('UIClub_Text31') + ' roomId/matchId ' + t('UIClub_Text32'))
    void router.back()
    return
  }

  loading.value = true
  try {
    await Promise.all([fetchDetailInfo(), fetchDetailRows()])
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载数据详情失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void initPage()
})
</script>

<template>
  <div class="page-shell club-room-history-detail-bg" :style="backgroundStyle">
    <HeaderBack :title="'数据详情'" />
    <div class="club-room-history-detail">
      <section class="meta-panel">
        <div class="meta-title-row">
          <span class="meta-title">完成的</span>
          <strong class="meta-main-value">{{ detailInfo.roomName }}</strong>
        </div>

        <div class="meta-sub-row">
          <div class="creator-wrap">
            <span class="meta-sub-label">创作者</span>
            <span class="meta-sub-value">{{ detailInfo.creator }}</span>
            <div class="id-pill-wrap">
              <span class="id-pill">ID</span>
              <span class="id-number">{{ detailInfo.creatorId }}</span>
            </div>
          </div>

          <div class="id-pill-wrap">
            <span class="id-pill">ID</span>
            <span class="id-number">{{ detailInfo.roomIdText }}</span>
          </div>
        </div>
      </section>

      <section class="summary-card">
        <div class="summary-row summary-row--three">
          <div
            v-for="metric in detailInfo.topMetrics"
            :key="metric.label"
            class="metric-item metric-item--with-divider"
          >
            <span class="metric-label">{{ metric.label }}</span>
            <span class="metric-value">{{ metric.value }}</span>
          </div>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-row summary-row--three">
          <div
            v-for="metric in detailInfo.middleMetrics"
            :key="metric.label"
            class="metric-item metric-item--with-divider"
          >
            <span class="metric-label">{{ metric.label }}</span>
            <span class="metric-value">{{ metric.value }}</span>
          </div>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-row summary-row--single">
          <div class="metric-item">
            <span class="metric-label">Jackpot</span>
            <span class="metric-value">{{ detailInfo.jackpot }}</span>
          </div>
        </div>
      </section>

      <section class="record-board">
        <div class="board-head-wrap">
          <div class="board-head-strip"></div>
          <div class="board-head board-grid">
            <span
              v-for="header in tableHeaders"
              :key="header"
              class="head-cell"
              :class="{ 'head-cell--user': header === 'User' }"
            >
              {{ header }}
            </span>
          </div>
        </div>

        <div class="record-list">
          <article v-for="row in records" :key="row.id" class="record-row board-grid">
            <div class="user-cell">
              <img class="user-avatar" :src="row.avatar" alt="" />
              <div class="user-meta">
                <span class="user-name">{{ row.name }}</span>
                <span class="user-id">ID: {{ row.userId }}</span>
              </div>
            </div>
            <span class="value-cell">{{ row.win }}</span>
            <span class="value-cell">{{ row.fee }}</span>
            <span class="value-cell">{{ row.insurance }}</span>
            <span class="value-cell">{{ row.buyIn }}</span>
            <span class="value-cell">{{ row.hands }}</span>
            <span class="value-cell">{{ row.jp }}</span>
          </article>
          <p v-if="!records.length && !loading" class="list-status">暂无玩家记录</p>
          <p v-if="loading" class="list-status">加载中...</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-room-history-detail-bg {
  position: relative;
  height: 100dvh;
  background-size: cover;
}

.club-room-history-detail {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.meta-panel {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  color: #fff;
}

.meta-title-row,
.meta-sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta-title {
  font-size: 0.43rem;
  line-height: 1.2;
}

.meta-main-value {
  font-size: 0.48rem;
  line-height: 1.2;
  font-weight: 500;
}

.meta-sub-row {
  font-size: 0.3rem;
  color: rgba(255, 255, 255, 0.66);
}

.creator-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.16rem;
}

.id-pill-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.id-pill {
  padding: 0.03rem 0.09rem;
  border-radius: 0.09rem;
  background: rgba(255, 255, 255, 0.36);
  color: #fff;
  font-size: 0.2rem;
  line-height: 1;
}

.id-number {
  font-size: 0.25rem;
  color: rgba(255, 255, 255, 0.72);
}

.summary-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  border-radius: 0.6rem;
  padding: 0.34rem 0.3rem;
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

.summary-row {
  display: grid;
}

.summary-row--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-row--single {
  justify-items: center;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.06rem;
  color: #fff;
}

.metric-item--with-divider + .metric-item--with-divider {
  border-left: 0.02rem solid rgba(249, 249, 249, 0.16);
}

.metric-label {
  font-size: 0.3rem;
  line-height: 1.35;
}

.metric-value {
  font-size: 0.5rem;
  line-height: 1;
  color: #f9f9f9;
}

.summary-divider {
  height: 0.02rem;
  background: rgba(249, 249, 249, 0.2);
}

.record-board {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  padding-bottom: 0.28rem;
}

.board-head-wrap {
  position: relative;
  padding-top: 0.1rem;
}

.board-head-strip {
  position: absolute;
  inset: 0.16rem 0.1rem auto;
  height: 0.462rem;
  border-radius: 999px;
  background: #5699cd;
}

.board-head {
  position: relative;
  min-height: 0.62rem;
  border-radius: 999px;
  padding: 0 0.18rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(0.24rem);
  -webkit-backdrop-filter: blur(0.24rem);
}

.board-grid {
  display: grid;
  grid-template-columns: 2.25rem repeat(6, minmax(0, 1fr));
  align-items: center;
  column-gap: 0.09rem;
}

.head-cell {
  font-size: 0.22rem;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  line-height: 1;
}

.head-cell--user {
  text-align: left;
  padding-left: 0.2rem;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.record-row {
  min-height: 1.23rem;
  border-radius: 999px;
  padding: 0.21rem 0.24rem;
  background: rgba(66, 66, 66, 0.2);
  color: #f9f9f9;
}

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  min-width: 0;
}

.user-avatar {
  width: 0.57rem;
  height: 0.57rem;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
}

.user-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.user-name {
  font-size: 0.3rem;
  color: rgba(255, 255, 255, 0.95);
}

.user-id {
  margin-top: 0.03rem;
  font-size: 0.21rem;
  color: rgba(255, 255, 255, 0.54);
}

.value-cell {
  text-align: center;
  font-size: 0.33rem;
  color: rgba(249, 249, 249, 0.94);
  white-space: nowrap;
}

.list-status {
  margin: 0;
  text-align: center;
  font-size: 0.24rem;
  color: rgba(255, 255, 255, 0.72);
  padding: 0.2rem 0;
}

@media (max-width: 340px) {
  .board-grid {
    grid-template-columns: 1.92rem repeat(6, minmax(0, 1fr));
  }

  .head-cell {
    font-size: 0.2rem;
  }

  .value-cell {
    font-size: 0.3rem;
  }
}
</style>

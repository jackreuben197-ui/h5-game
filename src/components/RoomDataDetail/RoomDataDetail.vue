<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { showFailToast } from 'vant'
import {
  postClubDataStatsDataDetailApi,
  postClubDataStatsDataDetailInfoApi,
  postFriendRoomStatsDataDetailApi,
  postFriendRoomStatsDataDetailInfoApi,
} from '@/api/stats'
import { useUserInfoStore } from '@/stores/userInfo'
import { useGameStore } from '@/stores/game'
import { USER_STORE_CLUB_MANAGE } from '@/utils/indexedDB'
import { toPlain, userCache } from '@/utils/userCache'
import { formatUC } from '@/utils/roomVisibility'
import { t } from '@/i18n'

type Source = 'club' | 'friend'

interface Props {
  source: Source
  roomId?: number
  matchId?: number
}

const props = defineProps<Props>()

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

const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()

const loading = ref(false)
const detailInfo = ref<DetailInfo>(buildEmptyDetailInfo())
const records = ref<PlayerRecord[]>([])

// club_manage 缓存：俱乐部牌局详情二次打开先渲染上次结果，再静默刷新覆盖
//（key 约定见 utils/indexedDB.ts）；朋友桌详情不属于俱乐部管理，不缓存。
interface CachedDetail {
  info: DetailInfo
  records: PlayerRecord[]
}

function clubManageCache() {
  return userCache(gameStore.loginUserId)
}

function detailCacheKey(): string {
  const clubId = toSafeNumber(userInfoStore.currentClub?.club_id)
  return `${clubId}_roomdetail_${props.roomId || 0}_${props.matchId || 0}`
}

const tableHeaders = ['User', t('UIMine_Paipu_win'), t('UIMine_WalletPlatform_fee_f'), t('adaptation10179'), t('MTT_xq_buy'), t('UIMine_RecordItemsNormal_3RCUa3w8'), 'JP']

function buildEmptyDetailInfo(): DetailInfo {
  return {
    roomName: '--',
    creator: '--',
    creatorId: '--',
    roomIdText: '--',
    jackpot: '0',
    topMetrics: [
      { label: t('MTT_xq_buy'), value: '--' },
      { label: t('Mahjong_LowScore'), value: '--' },
      { label: t('UIMine_WalletPlatform_fee_f'), value: '--' },
    ],
    middleMetrics: [
      { label: t('UIFriendsTable_playercount'), value: '--' },
      { label: t('adaptation10179'), value: '0' },
      { label: t('UIFriendsTable_totalfee'), value: '0' },
    ],
  }
}

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
  const jackpot = pickNumber(info, ['jackpot'])

  const buyInValue =
    buyInMin > 0 || buyInMax > 0 ? `${formatUC(buyInMin)}~${formatUC(buyInMax || buyInMin)}` : '--'

  return {
    roomName: pickString(info, ['name']),
    creator: pickString(info, ['creator_name', 'create_user_name', 'host_name']),
    creatorId: pickString(info, ['creator_id', 'create_user_id', 'host_user_id']),
    roomIdText: String(props.roomId || '--'),
    jackpot: formatNumber(jackpot),
    topMetrics: [
      { label: t('MTT_xq_buy'), value: buyInValue },
      { label: t('Mahjong_LowScore'), value: `${formatUC(sb)}/${formatUC(bb)}` },
      { label: t('UIMine_WalletPlatform_fee_f'), value: feeRate > 0 ? `${feeRate / 10}%` : '--' },
    ],
    middleMetrics: [
      { label: t('UIFriendsTable_playercount'), value: String(totalPlayer || '--') },
      { label: t('adaptation10179'), value: formatUC(insurance) },
      { label: t('UIFriendsTable_totalfee'), value: formatUC(totalFee) },
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

async function fetchClubDetail(): Promise<void> {
  const cacheKey = detailCacheKey()
  const slaveClubId = toSafeNumber(userInfoStore.currentClub?.club_id) || undefined
  const [infoRes, listRes] = await Promise.all([
    postClubDataStatsDataDetailInfoApi({
      room_id: props.roomId || undefined,
      match_id: props.matchId || undefined,
      only_master: false,
      slave_club_id: slaveClubId,
    }),
    postClubDataStatsDataDetailApi({
      room_id: props.roomId || undefined,
      match_id: props.matchId || undefined,
      offset: 0,
      limit: 200,
      only_master: false,
      slave_club_id: slaveClubId,
    }),
  ])

  if (infoRes.code !== 0) {
    throw new Error(typeof infoRes.msg === 'string' ? infoRes.msg : t('UIClub_LoadDetailFail'))
  }
  if (listRes.code !== 0) {
    throw new Error(typeof listRes.msg === 'string' ? listRes.msg : t('UIClub_LoadDetailFail2'))
  }

  // 响应回来时 props 已切换 → 丢弃，避免旧房间数据覆盖新房间的展示与缓存。
  if (cacheKey !== detailCacheKey()) {
    return
  }

  detailInfo.value = mapDetailInfo(infoRes.data?.info)

  const list = Array.isArray(listRes.data?.list) ? listRes.data.list : []
  records.value = list.map((item, idx) => mapPlayerRecord(item, idx))

  const roomInfo = (listRes.data?.room_info ?? {}) as Record<string, unknown>
  const jackpot = toSafeNumber(roomInfo.jackpot)
  if (jackpot > 0) {
    detailInfo.value = { ...detailInfo.value, jackpot: formatNumber(jackpot) }
  }

  void clubManageCache().put(
    USER_STORE_CLUB_MANAGE,
    cacheKey,
    toPlain({
      info: detailInfo.value,
      records: records.value,
    } satisfies CachedDetail),
  )
}

async function fetchFriendDetail(): Promise<void> {
  const [infoRes, listRes] = await Promise.all([
    postFriendRoomStatsDataDetailInfoApi({
      room_id: props.roomId || undefined,
    }),
    postFriendRoomStatsDataDetailApi({
      room_id: props.roomId || undefined,
      offset: 0,
      limit: 200,
    }),
  ])

  if (infoRes.code !== 0) {
    throw new Error(typeof infoRes.msg === 'string' ? infoRes.msg : t('UIClub_LoadDetailFail'))
  }
  if (listRes.code !== 0) {
    throw new Error(typeof listRes.msg === 'string' ? listRes.msg : t('UIClub_LoadDetailFail2'))
  }

  detailInfo.value = mapDetailInfo(infoRes.data?.info)
  const list = Array.isArray(listRes.data?.list) ? listRes.data.list : []
  records.value = list.map((item, idx) => mapPlayerRecord(item, idx))
}

async function loadDetail(): Promise<void> {
  if (!props.roomId && !props.matchId) {
    return
  }

  // 命中缓存 → 先渲染再静默刷新，不再展示 loading；未命中走原 loading 流程。
  let silent = false
  if (props.source === 'club') {
    const cacheKey = detailCacheKey()
    const cached = await clubManageCache().get<CachedDetail>(USER_STORE_CLUB_MANAGE, cacheKey)
    if (cached && cacheKey === detailCacheKey()) {
      detailInfo.value = cached.info
      records.value = cached.records
      silent = true
    }
  }

  if (!silent) {
    loading.value = true
  }
  try {
    if (props.source === 'club') {
      await fetchClubDetail()
    } else {
      await fetchFriendDetail()
    }
  } catch (error) {
    if (!silent) {
      const message = error instanceof Error ? error.message : t('UIClub_LoadDataDetailFail')
      showFailToast(message)
    }
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

const hasIdentifier = computed(() => Boolean(props.roomId || props.matchId))

watch(
  () => [props.source, props.roomId, props.matchId],
  () => {
    detailInfo.value = buildEmptyDetailInfo()
    records.value = []
    void loadDetail()
  },
)

onMounted(() => {
  void loadDetail()
})
</script>

<template>
  <div class="room-data-detail" :class="`room-data-detail--${source}`">
    <section class="meta-panel">
      <div class="meta-title-row">
        <span class="meta-title">{{ t('UIClub_Of') }}</span>
        <strong class="meta-main-value">{{ detailInfo.roomName }}</strong>
      </div>

      <div class="meta-sub-row">
        <div class="creator-wrap">
          <span class="meta-sub-label">{{ t('UIClub_Text30') }}</span>
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
        <p v-if="!records.length && !loading && hasIdentifier" class="list-status">
          {{ t('UIClub_NoPlayerRecord') }}
        </p>
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.room-data-detail {
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

  @include theme-light-own {
    color: #111;
  }
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

  @include theme-light-own {
    color: rgba(17, 17, 17, 0.58);
  }
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
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 0.2rem;
  line-height: 1;

  @include theme-light-own {
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
  }
}

.id-number {
  font-size: 0.25rem;
  color: rgba(255, 255, 255, 0.72);

  @include theme-light-own {
    color: rgba(17, 17, 17, 0.62);
  }
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  border-radius: 0.6rem;
  padding: 0.34rem 0.3rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0.02rem rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(0.32rem);

  @include theme-light-own {
    border-color: rgba(0, 0, 0, 0.04);
    background: #fff;
    box-shadow: none;
  }
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

  @include theme-light-own {
    color: #111;
  }
}

.metric-item--with-divider + .metric-item--with-divider {
  border-left: 0.02rem solid rgba(249, 249, 249, 0.16);

  @include theme-light-own {
    border-left-color: rgba(17, 17, 17, 0.12);
  }
}

.metric-label {
  font-size: 0.3rem;
  line-height: 1.35;
}

.metric-value {
  font-size: 0.34rem;
  line-height: 1;
  color: #f9f9f9;

  @include theme-light-own {
    color: #111;
  }
}

.summary-divider {
  height: 0.02rem;
  background: rgba(249, 249, 249, 0.24);

  @include theme-light-own {
    background: rgba(17, 17, 17, 0.14);
  }
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
  height: 0.44rem;
  border-radius: 999px;
  background: #00af83;

  @include theme-light-own {
    background: var(--c-brand);
  }
}

.board-head {
  position: relative;
  min-height: 0.62rem;
  border-radius: 999px;
  padding: 0 0.18rem;
  background: rgba(255, 255, 255, 0.12);

  @include theme-light-own {
    background: rgba(var(--c-brand-rgb), 0.82);
  }
}

.board-grid {
  display: grid;
  grid-template-columns: 1.5rem repeat(6, minmax(0, 1fr));
  align-items: center;
  column-gap: 0.06rem;
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
  gap: 0.1rem;
}

.record-row {
  min-height: 0.82rem;
  border-radius: 999px;
  padding: 0.14rem 0.16rem;
  background: rgba(0, 0, 0, 0.2);
  color: #f9f9f9;

  @include theme-light-own {
    color: #111;
    background: #fff;
  }
}

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
  min-width: 0;
}

.user-avatar {
  width: 0.38rem;
  height: 0.38rem;
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
  font-size: 0.2rem;
  color: rgba(255, 255, 255, 0.95);

  @include theme-light-own {
    color: #111;
  }
}

.user-id {
  margin-top: 0.02rem;
  font-size: 0.14rem;
  color: rgba(255, 255, 255, 0.54);

  @include theme-light-own {
    color: rgba(17, 17, 17, 0.48);
  }
}

.value-cell {
  text-align: center;
  font-size: 0.22rem;
  color: rgba(249, 249, 249, 0.94);
  white-space: nowrap;

  @include theme-light-own {
    color: #111;
  }
}

.list-status {
  margin: 0;
  text-align: center;
  font-size: 0.24rem;
  color: rgba(255, 255, 255, 0.72);
  padding: 0.2rem 0;

  @include theme-light-own {
    color: rgba(17, 17, 17, 0.58);
  }
}

.room-data-detail--club {
  @include theme-light-own {
    .meta-panel {
      color: #222;
    }

    .meta-sub-row {
      color: rgba(0, 0, 0, 0.5);
    }

    .id-pill {
      color: #fff;
      background: rgba(0, 0, 0, 0.4);
    }

    .id-number {
      color: rgba(0, 0, 0, 0.78);
    }

    .summary-card {
      border-color: transparent;
      background: #fff;
      box-shadow: none;
      backdrop-filter: none;
    }

    .metric-item,
    .metric-value {
      color: #222;
    }

    .metric-item--with-divider + .metric-item--with-divider {
      border-left-color: rgba(34, 34, 34, 0.12);
    }

    .summary-divider {
      background: rgba(34, 34, 34, 0.12);
    }

    .board-head-strip {
      background: #69beff;
    }

    .board-head {
      border: 0.02rem solid rgba(255, 255, 255, 0.72);
      background: rgba(105, 190, 255, 0.78);
      box-shadow: inset 0 0.06rem 0.16rem rgba(255, 255, 255, 0.42);
    }

    .record-row {
      color: #222;
      background: #fff;
    }

    .user-name,
    .value-cell {
      color: #222;
    }

    .user-id {
      color: rgba(0, 0, 0, 0.5);
    }

    .list-status {
      color: rgba(34, 34, 34, 0.62);
    }
  }
}

@media (max-width: 340px) {
  .board-grid {
    grid-template-columns: 1.28rem repeat(6, minmax(0, 1fr));
  }

  .head-cell,
  .value-cell {
    font-size: 0.2rem;
  }
}
</style>

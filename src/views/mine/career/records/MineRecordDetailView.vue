<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postStatsRoomDetailApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import rankBgUrl from '@/assets/images/rank_bg.png'
import defaultAvatarUrl from '@/assets/images/default_avatar.png'
import insuranceIconUrl from '@/assets/icons/icon_insurance.svg'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import CareerSvgIcon from '../../components/CareerSvgIcon.vue'
import { localStore } from '@/utils/localStore'
import { formatUC } from '@/utils/roomVisibility'
import { formatDateTime } from '@/utils/time'
import { userCache } from '@/utils/userCache'
import { USER_STORE_CAREER } from '@/utils/indexedDB'
import { useGameStore } from '@/stores/game'
import { t } from '@/i18n'

// 生涯页选择的俱乐部 id 持久化在 localStorage 的 dzpk_h5_CAREER_SELECTED_CLUB_ID。
// 'all' 或缺失表示"全部"，返回 0；否则解析为数字 club_id。
// 对齐 Unity CareerRecordPart：「全部」必须显式传 club_id=0，省略字段时服务端会回上一次的俱乐部数据（页面刷新后该值会回到用户信息的 club_id）。
// 仅 source=club 使用；friends 端忽略 club_id。
function getCareerSelectedClubId(): number {
  const stored = localStore.getItem<string>('CAREER_SELECTED_CLUB_ID', null)
  if (!stored || stored === 'all') return 0
  const id = Number(stored)
  return Number.isFinite(id) && id > 0 ? id : 0
}

// 头像 URL 缓存：跨组件重渲染保持同一引用，依赖浏览器 HTTP 缓存避免重复下载。
const avatarUrlCache = new Map<string, string>()
function resolveAvatar(url: string | undefined | null): string {
  if (!url) return defaultAvatarUrl
  const cached = avatarUrlCache.get(url)
  if (cached) return cached
  avatarUrlCache.set(url, url)
  return url
}

const title = computed(() => t('adaptation10217'))

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

// 路由参数 source 决定数据来源：'club' = 俱乐部生涯，'friends' = 朋友桌生涯。
const source = computed<'club' | 'friends'>(() =>
  route.params.source === 'friends' ? 'friends' : 'club',
)
const isClub = computed(() => source.value === 'club')

// 背景素材由 CSS 根据 data-theme 选择，切换主题时无需重建页面。
const backgroundStyle = computed(() => ({
  '--record-detail-bg-dark': `url(${mainBgUrl})`,
  '--record-detail-bg-light': `url(${mainBgLightUrl})`,
}))

const rankSectionStyle = computed(() => ({
  backgroundImage: `url(${rankBgUrl})`,
}))

type RankKind = 'mvp' | 'tuhao' | 'fish'

interface PodiumSeat {
  rank: 1 | 2 | 3
  kind: RankKind
  tagText: string
  name: string
  value: string
  avatar: string
}

interface PlayerResult {
  id: string
  name: string
  uid: string
  avatar: string
  buyIn: string
  hands: string
  vpip: string
  profit: string
  profitPositive: boolean
}

const loading = ref(false)

const podiumSeats = ref<PodiumSeat[]>([])

const summaryItems = ref([
  { label: t('UICareerRecord_totalLiushui'), value: '0' },
  { label: t('UITexasGameEnding_BigPot'), value: '0' },
  { label: t('UITexasGameEnding_allhand'), value: '0' },
  { label: t('UIClub_Text94'), value: '0' },
])

const playerResults = ref<PlayerResult[]>([])

const detailTitle = ref('Hand Name')
const detailSub = ref('ID: --')
const detailTime = ref('--')
const insurancePool = ref('0')
const currentRoomId = ref(0)

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

// 金额展示（已除以 100，无逗号，对齐客户端 LanguageUtility.GetFormatLongNumber）。
// 正数保留 + 号便于区分盈利/亏损，负数交由 formatUC 自带的 - 号。
function formatAmount(value: number, withSign = false): string {
  if (!Number.isFinite(value) || value === 0) return '0'
  if (!withSign) return formatUC(value)
  return value > 0 ? `+${formatUC(value)}` : formatUC(value)
}

function extractRoomId(): number {
  const raw = route.query.room_id ?? route.query.id
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

// 参考客户端 UIRecordDetailStatistics.cs UpdateRankInfo：
// MVP=净盈利最高(finally - bringIn 最大), 土豪=带入最高(bringIn 最大), 大鱼=净盈利最低。
// DOM 顺序排为 [土豪左, MVP中, 大鱼右] 以对齐领奖台底图。
function buildPodiumSeats(users: Record<string, unknown>[]): PodiumSeat[] {
  if (!users.length) return []
  let mvp = users[0]
  let tuhao = users[0]
  let fish = users[0]
  let mvpNet = toSafeNumber(mvp.finally_game_results) - toSafeNumber(mvp.bring_in)
  let fishNet = mvpNet
  for (const user of users) {
    const net = toSafeNumber(user.finally_game_results) - toSafeNumber(user.bring_in)
    if (toSafeNumber(user.bring_in) > toSafeNumber(tuhao.bring_in)) {
      tuhao = user
    }
    if (net > mvpNet) {
      mvp = user
      mvpNet = net
    }
    if (net < fishNet) {
      fish = user
      fishNet = net
    }
  }

  function makeSeat(
    user: Record<string, unknown>,
    rank: 1 | 2 | 3,
    kind: RankKind,
    tagText: string,
    value: number,
  ): PodiumSeat {
    return {
      rank,
      kind,
      tagText,
      name: String(user.nick_name ?? '--'),
      value: formatAmount(value, kind !== 'tuhao'),
      avatar: resolveAvatar(typeof user.avatar === 'string' ? user.avatar : ''),
    }
  }

  return [
    makeSeat(tuhao, 2, 'tuhao', t('UITexasGameEnding_richman'), toSafeNumber(tuhao.bring_in)),
    makeSeat(mvp, 1, 'mvp', 'MVP', mvpNet),
    makeSeat(fish, 3, 'fish', t('UITexasGameEnding_bigFish'), fishNet),
  ]
}

// ── 缓存（IndexedDB career）──────────────────────────────────────────────────
// 详情数据按 room_id 缓存，命中则不再请求（同一房间的结算数据固定不变）。
// key 形如 `detail-${roomId}`，与战绩首页 `${clubId}-${game}-${time}` 的 key 形式分隔。
interface RecordDetailCache {
  detailTitle: string
  detailSub: string
  detailTime: string
  summaryItems: { label: string; value: string }[]
  podiumSeats: PodiumSeat[]
  playerResults: PlayerResult[]
  insurancePool: string
  currentRoomId: number
}

// 房间结算数据按 room_id 全局唯一，不需要再加 source 前缀。
function detailCacheKey(roomId: number): string {
  return `detail-${roomId}`
}

function detailCache() {
  return userCache(gameStore.loginUserId)
}

function plainClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function applyDetailCache(payload: RecordDetailCache): void {
  detailTitle.value = payload.detailTitle
  detailSub.value = payload.detailSub
  detailTime.value = payload.detailTime
  summaryItems.value = payload.summaryItems
  podiumSeats.value = payload.podiumSeats
  playerResults.value = payload.playerResults
  insurancePool.value = payload.insurancePool
  currentRoomId.value = payload.currentRoomId
}

function writeDetailCache(roomId: number): void {
  const payload: RecordDetailCache = {
    detailTitle: detailTitle.value,
    detailSub: detailSub.value,
    detailTime: detailTime.value,
    summaryItems: plainClone(summaryItems.value),
    podiumSeats: plainClone(podiumSeats.value),
    playerResults: plainClone(playerResults.value),
    insurancePool: insurancePool.value,
    currentRoomId: currentRoomId.value,
  }
  void detailCache().put(USER_STORE_CAREER, detailCacheKey(roomId), payload)
}

async function fetchRecordDetail(): Promise<void> {
  const roomId = extractRoomId()
  if (roomId <= 0) {
    return
  }

  const cached = await detailCache().get<RecordDetailCache>(
    USER_STORE_CAREER,
    detailCacheKey(roomId),
  )
  if (cached) {
    applyDetailCache(cached)
    return
  }

  loading.value = true
  try {
    // club 端按 club_id 收窄；friends 端不传 club_id。
    const response = await postStatsRoomDetailApi(
      {
        limit: 50,
        offset: 0,
        ...(isClub.value ? { club_id: getCareerSelectedClubId() } : {}),
      },
      { id: roomId },
    )

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadDetailFail5'))
    }

    const roomData = response.data?.room_data
    const users = roomData?.user_list
    const userList = (Array.isArray(users) ? users : []) as Record<string, unknown>[]

    detailTitle.value = String(roomData?.game_room_name ?? 'Hand Name')
    currentRoomId.value = toSafeNumber(roomData?.room_id)
    detailSub.value = `ID: ${String(roomData?.room_id ?? '--')}`
    detailTime.value = `${formatDateTime(roomData?.start_time, 'DD/MM HH:mm')} - ${formatDateTime(
      roomData?.end_time,
      'DD/MM HH:mm',
    )}`

    // 对齐客户端 UIRecordDetailStatistics.UpdateTexasInfo：总流水/最大底池/总手数/总代入数。
    summaryItems.value = [
      {
        label: t('UICareerRecord_totalLiushui'),
        value: formatAmount(toSafeNumber(roomData?.all_bet_pot)),
      },
      {
        label: t('UITexasGameEnding_BigPot'),
        value: formatAmount(toSafeNumber(roomData?.max_bet_pot)),
      },
      {
        label: t('UITexasGameEnding_allhand'),
        value: String(toSafeNumber(roomData?.room_total_hand_num)),
      },
      { label: t('UIClub_Text94'), value: formatAmount(toSafeNumber(roomData?.all_bring_in)) },
    ]

    podiumSeats.value = buildPodiumSeats(userList)

    playerResults.value = userList.map((user, index) => {
      const result = toSafeNumber(user.finally_game_results ?? user.original_results)
      return {
        id: String(user.user_random_id ?? index + 1),
        name: String(user.nick_name ?? 'Player Name'),
        uid: String(user.user_random_id ?? '--'),
        avatar: resolveAvatar(typeof user.avatar === 'string' ? user.avatar : ''),
        buyIn: formatAmount(toSafeNumber(user.bring_in)),
        hands: String(toSafeNumber(user.user_room_hand_num)),
        vpip: `${toSafeNumber(user.in_pool_cnt)}%`,
        profit: formatAmount(result, true),
        profitPositive: result >= 0,
      }
    })

    insurancePool.value = formatAmount(toSafeNumber(roomData?.insurance_total), true)
    writeDetailCache(roomId)
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_LoadDetailFail5')
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function goToHands(): void {
  void router.push({
    path: `/mine/career/${source.value}/record/hand`,
    query: {
      room_id: currentRoomId.value > 0 ? String(currentRoomId.value) : undefined,
    },
  })
}

function onAvatarError(event: Event): void {
  const target = event.target as HTMLImageElement
  if (target && target.src !== defaultAvatarUrl) {
    target.src = defaultAvatarUrl
  }
}

onMounted(() => {
  void fetchRecordDetail()
})
</script>

<template>
  <div class="page-shell record-detail-page" :style="backgroundStyle">
    <HeaderBack :title="title" :extra-padding="true" />

    <div class="content-wrap">
      <section class="glass-card sort-bar" @click="goToHands">
        <span>{{ t('UIMine_RecordDetailForNormal_FENSVUz3') }}</span>
        <CareerSvgIcon name="dropdown" class="arrow" />
      </section>

      <section class="rank-section" :style="rankSectionStyle">
        <article
          v-for="seat in podiumSeats"
          :key="`rank-${seat.kind}-${seat.name}`"
          class="rank-seat"
          :class="[`rank-${seat.rank}`]"
        >
          <div class="rank-tag">
            <img src="@/assets/icons/icon_chips.png" class="icon-chips" alt="" />
            <span> {{ seat.tagText }}</span>
          </div>
          <img class="avatar" :src="seat.avatar" alt="avatar" @error="onAvatarError" />
          <div class="rank-info">
            <div class="name">{{ seat.name }}</div>
            <div class="value">{{ seat.value }}</div>
          </div>
        </article>
      </section>

      <section class="glass-card table-section">
        <div class="hand-summary">
          <div class="name-line">
            <div class="title-block">
              <div class="title">{{ detailTitle }}</div>
              <div class="sub">{{ detailSub }}</div>
            </div>
          </div>
          <div class="time">{{ detailTime }}</div>
          <div class="summary-grid">
            <div v-for="item in summaryItems" :key="item.label" class="summary-item">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="result-section">
        <div class="insurance-bar">
          <div class="left">
            <img class="icon" :src="insuranceIconUrl" alt="insurance" />
            <span>{{ t('UIMine_RecordDetailForNormal_soxaxJz1') }}</span>
          </div>
          <div class="right">{{ insurancePool }}</div>
        </div>

        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!playerResults.length" class="list-status">{{ t('UIClub_NoData') }}</p>

        <article v-for="item in playerResults" :key="item.id" class="glass-card player-card">
          <div class="result-row">
            <div class="left">
              <img class="avatar small" :src="item.avatar" alt="avatar" @error="onAvatarError" />
              <div>
                <div class="name">{{ item.name }}</div>
                <div class="sub">ID: {{ item.uid }}</div>
              </div>
            </div>
            <div class="right">
              <div class="profit" :class="{ pos: item.profitPositive }">{{ item.profit }}</div>
            </div>
          </div>
          <div class="sub-row">
            <div class="sub-cell">
              <span class="sub-title">{{ t('UIMine_RecordItemsNormal_eodrjcHJ') }}:</span>
              <span class="sub-value">{{ item.buyIn }}</span>
            </div>
            <div class="sub-cell">
              <span class="sub-title">{{ t('UIMine_RecordItemsNormal_3RCUa3w8') }}:</span>
              <span class="sub-value">{{ item.hands }}</span>
            </div>
            <div class="sub-cell">
              <span class="sub-title">{{ t('UIClub_Mlistinfo_rRyW4JkW') }}:</span>
              <span class="sub-value">{{ item.vpip }}</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.record-detail-page {
  height: 100dvh;
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-image: var(--record-detail-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: var(--c-text);
    background-color: var(--c-page);
    background-image: var(--record-detail-bg-light);
  }
}

.content-wrap {
  padding: 0 0.45rem;
}

.glass-card {
  border-radius: 0.76rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);

  @include theme-light {
    border-color: transparent;
    background: var(--c-surface);
  }
}

.sort-bar {
  margin-top: 0.2rem;
  padding: 0.48rem 0.62rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.405rem;

  .arrow {
    width: 0.4rem;
    height: 0.4rem;
    color: #fff;
    transform: rotate(-90deg);

    @include theme-light {
      color: #000;
    }
  }
}

.rank-section {
  position: relative;
  margin-top: 0.35rem;
  height: 4.9rem;
  background-size: 9.4rem 3.7rem;
  background-position: bottom center;
  background-repeat: no-repeat;
  display: grid;
  z-index: 2;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.rank-seat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  text-align: center;

  .rank-tag {
    position: relative;
    z-index: 2;
    padding: 0.08rem 0.22rem 0;
    border-radius: 100rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(0.06rem);
    font-size: 0.264rem;
    line-height: 0.1rem;
    color: #fff;
    margin-bottom: -0.18rem;
    // @include theme-light {
    //   color: #000;白色看不清
    // }
  }
  span {
    vertical-align: top;
    line-height: 0.5rem;
  }
  .icon-chips {
    width: 0.42rem;
    margin-right: 0.1rem;
    margin-top: 0.02rem;
  }

  .avatar {
    position: relative;
    z-index: 1;
    width: 1.3rem;
    height: 1.3rem;
    border-radius: 50%;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.32);
    border: 0.02rem solid rgba(255, 255, 255, 0.4);
  }

  .rank-info {
    position: relative;
    z-index: 2;
    width: 1.49rem;
    padding: 0.10587rem 0.08235rem;
    border-radius: 0.24rem;
    background: rgba(51, 48, 48, 0.28);
    font-size: 0.23rem;
    line-height: 0.23rem;
    backdrop-filter: blur(0.06rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.04rem;
    color: #fff;
    margin-top: -0.24rem;

    .name {
      font-size: 0.23rem;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border-bottom: 0.5px solid rgba($color: #fff, $alpha: 0.28);
    }

    .value {
      font-size: 0.23rem;
    }
  }

  &.rank-1 {
    padding-bottom: 2.55rem;

    .avatar {
      width: 2.06rem;
      height: 2.06rem;
    }

    .rank-tag {
      margin-bottom: -0.22rem;
    }

    .rank-info {
      margin-top: -0.4rem;
      width: 2.04rem;
      line-height: 0.35rem;
      .value {
        font-size: 0.25rem;
        font-style: normal;
        font-weight: 700;
      }
    }
  }

  &.rank-2 {
    .rank-tag {
      padding: 0 0.22rem;
    }
    padding-bottom: 2rem;
  }

  &.rank-3 {
    .rank-tag {
      padding: 0 0.22rem;
    }
    padding-bottom: 2rem;
  }
}

.table-section {
  margin-top: -0.6rem;
  z-index: 1;
  padding: 0.65rem 0.43rem 0.4rem;
}

.hand-summary {
  padding-top: 0.04rem;
}

.name-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  line-height: 0.5rem;
  gap: 0.06rem;

  .title {
    font-size: 0.45rem;
  }

  .sub {
    font-size: 0.38rem;
    color: rgba(255, 255, 255, 0.74);

    @include theme-light {
      color: rgba(0, 0, 0, 0.7);
    }
  }
}

.time {
  margin-top: 0.12rem;
  font-size: 0.45rem;
  color: rgba(255, 255, 255, 0.78);

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }
}

.summary-grid {
  border-radius: 0.76rem;
  background-color: rgba($color: #ffffff, $alpha: 0.2);
  margin-top: 0.25rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 0.02rem 0.51rem 0.1rem;
  gap: 0.08rem;

  @include theme-light {
    background-color: #e3e3e3;
  }
}

.summary-item {
  text-align: center;

  .label {
    font-size: 0.31rem;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.72);

    @include theme-light {
      color: rgba(0, 0, 0, 0.7);
    }
  }

  .value {
    display: block;
    font-size: 0.53rem;
    line-height: 1.1;
    font-weight: 600;
  }
}

.result-section {
  margin-top: 0.4rem;
}

.insurance-bar {
  padding: 0.1rem 0.5rem 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.33rem;

  .left {
    display: flex;
    align-items: center;
    gap: 0.12rem;
  }

  .icon {
    width: 0.6rem;
    height: 0.6rem;
  }

  .right {
    font-size: 0.38rem;
  }
}

.player-card {
  padding: 0.35rem 0.5rem 0.2rem;

  & + & {
    margin-top: 0.2rem;
  }
}

.result-row {
  display: flex;
  justify-content: space-between;
  gap: 0.18rem;
}

.list-status {
  margin: 0.2rem 0;
  text-align: center;
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 0.78);

  @include theme-light {
    color: var(--c-text-muted);
  }
}

.left {
  display: flex;
  gap: 0.2rem;
  align-items: center;

  .avatar.small {
    width: 0.86rem;
    height: 0.86rem;
    border-radius: 50%;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.32);
  }

  .name {
    font-size: 0.34rem;
  }

  .sub {
    font-size: 0.33rem;
  }
}

.right {
  text-align: right;

  .profit {
    font-size: 0.45rem;
    color: var(--c-loss);
    font-weight: 700;

    &.pos {
      color: var(--c-profit);
    }
  }
}

.sub-row {
  margin-top: 0.23rem;
  display: flex;
  justify-content: space-around;
  padding: 0.2rem 0rem 0rem;
  border-top: 1px solid rgba(163, 163, 163, 0.2);
}

.sub-cell {
  display: flex;
  align-items: center;
  gap: 0.06rem;

  .sub-title {
    font-size: 0.27rem;
    color: rgba(255, 255, 255, 0.78);

    @include theme-light {
      color: rgba(0, 0, 0, 0.7);
    }
  }

  .sub-value {
    font-size: 0.32rem;
    font-weight: 800;
  }
}
</style>

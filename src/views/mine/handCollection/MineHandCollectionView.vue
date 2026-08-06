<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import type {
  MiscGameRoundListDataByRoomRecord,
  MiscGameRoundListDataByRoomRoomRecord,
  MiscGameRoundListDataByRoomUserGameRecord,
} from '@/api/models/misc'
import type {
  StatsUserGameRecordListRecord,
  StatsUserGameRecordListRoom_record,
} from '@/api/models/stats'
import {
  decodeCard,
  GetWinDesc,
  parseHandRecordCards,
  parseReplayLike,
  type CardItem,
  type StatsReplayData,
  type StatsReplayFantasyData,
} from '@/api/models/replayDisplay'
import { postMiscGameRoundListDataByRoomApi } from '@/api/misc'
import { postStatsUserGameRecordListApi } from '@/api/stats'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import PokerCard from '@/components/GameCard/PokerCard.vue'
import { setHandReplaySession } from '@/session/handReplaySession'
import { formatUC } from '@/utils/roomVisibility'
import { t } from '@/i18n'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { userCache } from '@/utils/userCache'
import { USER_STORE_H5_REPLAY } from '@/utils/indexedDB'

const title = computed(() => t('UIMine_Paipu_title'))
const router = useRouter()
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()

// 对齐客户端 UIReplayComponent：每页 limit=10。
const PAGE_LIMIT = 10
// 触底前提前加载的像素距离（IntersectionObserver rootMargin）。
const LOAD_MORE_ROOT_MARGIN = '200px'

// 客户端 RequestReplayData 显式带 club_id；服务端在按俱乐部过滤时取这个值。
// 无俱乐部时回退 0（= 不按俱乐部过滤）。
function currentClubIdNumber(): number {
  const raw = userInfoStore.currentClubId
  const num = Number(raw)
  return Number.isFinite(num) ? num : 0
}

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--hand-collection-bg-dark': `url(${mainBgUrl})`,
  '--hand-collection-bg-light': `url(${mainBgLightUrl})`,
}))

const gameTabs = [t('adaptation10022'), t('PokerType_2'), t('adaptation10009')]
const modeTabs = [t('UIPaipu_Jinqi'), t('adaptation10212')]
const selectedGame = ref(gameTabs[0])
const selectedMode = ref(modeTabs[0])

interface HandCard {
  id: string
  title: string
  handCards: CardItem[]
  handId: string
  table: string
  pot: string
  hands: string
  profit: string
  negative?: boolean
  roomRecord?: StatsUserGameRecordListRoom_record
  handRecord?: StatsUserGameRecordListRecord
}

const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const handCards = ref<HandCard[]>([])

// ── 缓存（IndexedDB h5_replay）──────────────────────────────────────────────
// key 形如 `${game}_${mode}`，game ∈ texas/sixplus/omaha，mode ∈ recent/collected。
// 服务端牌谱一旦写入就不再变更，所以二次请求只会多不会少也不会变，可直接用 server ∪ cache（按 handId 去重）。
function gameCacheToken(game: string): string {
  if (game === gameTabs[1]) return 'sixplus'
  if (game === gameTabs[2]) return 'omaha'
  return 'texas'
}

function modeCacheToken(mode: string): string {
  return mode === modeTabs[1] ? 'collected' : 'recent'
}

function currentCacheKey(): string {
  return `${gameCacheToken(selectedGame.value)}_${modeCacheToken(selectedMode.value)}`
}

function handCardsCache() {
  return userCache(gameStore.loginUserId)
}

function plainClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// 合并：server 优先（同一 handId 用 server 的字段），cache 仅补充 server 没返回的历史记录。
function mergeHandCards(cached: HandCard[], fresh: HandCard[]): HandCard[] {
  const seen = new Set<string>()
  const merged: HandCard[] = []
  for (const card of fresh) {
    if (!card.handId || seen.has(card.handId)) continue
    seen.add(card.handId)
    merged.push(card)
  }
  for (const card of cached) {
    if (!card.handId || seen.has(card.handId)) continue
    seen.add(card.handId)
    merged.push(card)
  }
  return merged
}

async function readHandCardsCache(): Promise<HandCard[]> {
  const cached = await handCardsCache().get<HandCard[]>(USER_STORE_H5_REPLAY, currentCacheKey())
  return Array.isArray(cached) ? cached : []
}

async function writeHandCardsCache(value: HandCard[]): Promise<void> {
  await handCardsCache().put(USER_STORE_H5_REPLAY, currentCacheKey(), plainClone(value))
}

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

function resolveGameFilter(): { game_types: number[]; poker_types?: number[] } {
  if (selectedGame.value === t('adaptation10009')) {
    return { game_types: [1, 2, 3] }
  }
  if (selectedGame.value === t('PokerType_2')) {
    return { game_types: [0], poker_types: [2] }
  }
  return { game_types: [0] }
}

function buildDisplayCards(record: { data?: unknown }): CardItem[] {
  const parsed = parseHandRecordCards(record.data)
  const cards = parsed.slice(0, 2).map((item) => decodeCard(item))
  const placeholder: CardItem = { rank: '--', suit: 's' }
  if (!cards.length) return [placeholder, placeholder]
  if (cards.length === 1) return [cards[0], placeholder]
  return cards
}

function buildCardTitle(record: StatsUserGameRecordListRecord): string {
  const replay = parseReplayLike<StatsReplayData>(record.replay)
  const replayFantasy = parseReplayLike<StatsReplayFantasyData>(record.replay_ft)
  return GetWinDesc(replay, replayFantasy)
}

type HandCollectionRow = {
  room_record?: StatsUserGameRecordListRoom_record | MiscGameRoundListDataByRoomRoomRecord
  user_game_records?: Array<
    StatsUserGameRecordListRecord | MiscGameRoundListDataByRoomUserGameRecord
  >
}

function mapRowToCards(row: HandCollectionRow, index: number): HandCard[] {
  const roomRecord = row.room_record ?? {}
  const gameRecords = Array.isArray(row.user_game_records) ? row.user_game_records : []
  let sb = toSafeNumber(roomRecord.small_blind)
  const handTable = `${formatUC(sb)}/${formatUC(sb * 2)}`

  return gameRecords.map((item, itemIndex) => {
    const record = { ...(item ?? {}) } as StatsUserGameRecordListRecord
    const normalizedRoomRecord = { ...roomRecord } as StatsUserGameRecordListRoom_record
    const handId = String(record.id ?? '--')
    const pot = formatUC(record.bet_pot ?? 0)
    const hands = toSafeNumber(record.hand_num).toLocaleString('en-US')
    const profit = formatSigned(formatUC(record.change ?? 0))
    return {
      id: `${index + 1}-${itemIndex + 1}-${handId}`,
      title: buildCardTitle(record),
      handCards: buildDisplayCards(record),
      handId,
      table: handTable,
      pot,
      hands,
      profit,
      negative: toSafeNumber(record.change) < 0,
      roomRecord: normalizedRoomRecord,
      handRecord: record,
    }
  })
}

async function fetchHandCollection(append = false): Promise<void> {
  const cacheKey = currentCacheKey()
  let cached: HandCard[] = []

  if (append) {
    if (!hasMore.value || loading.value || loadingMore.value) return
    loadingMore.value = true
  } else {
    // 首屏 / tab 切换：复位分页，先用缓存渲染再静默刷新。
    offset.value = 0
    hasMore.value = true
    cached = await readHandCardsCache()
    if (cached.length) {
      handCards.value = cached
      loading.value = false
    } else {
      handCards.value = []
      loading.value = true
    }
  }

  try {
    const filter = resolveGameFilter()
    let fresh: HandCard[] = []
    if (selectedMode.value === t('adaptation10212')) {
      // 对齐客户端 UIReplayComponent：collected list 必带 club_id + tribe_id。
      const response = await postMiscGameRoundListDataByRoomApi({
        ...filter,
        club_id: currentClubIdNumber(),
        tribe_id: 0,
        limit: PAGE_LIMIT,
        offset: offset.value,
      })

      if (response.code !== 0) {
        throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_LoadFail11'))
      }

      const rows = Array.isArray(response.data?.records) ? response.data.records : []
      fresh = rows.flatMap((row, index) =>
        mapRowToCards((row as MiscGameRoundListDataByRoomRecord) ?? {}, index),
      )
    } else {
      const response = await postStatsUserGameRecordListApi({
        ...filter,
        club_id: currentClubIdNumber(),
        tribe_id: 0,
        room_type: 0,
        limit: PAGE_LIMIT,
        offset: offset.value,
      })
      if (response.code !== 0) {
        throw new Error(
          typeof response.msg === 'string' ? response.msg : t('UIClub_LoadRecordFail'),
        )
      }

      const records = Array.isArray(response.data?.records) ? response.data.records : []
      fresh = records.flatMap((row, index) =>
        mapRowToCards((row as HandCollectionRow) ?? {}, index),
      )
    }

    // 切 tab 期间 cacheKey 可能已经变了；只在 key 仍是当前选择时才落表，避免脏数据。
    if (currentCacheKey() !== cacheKey) return

    // 按 handId 去重：服务端返回的优先级最高，本地缓存（或之前页）补齐其余历史项。
    const base = append ? handCards.value : cached
    const merged = mergeHandCards(base, fresh)
    handCards.value = merged
    void writeHandCardsCache(merged)

    // 收到 < limit 条说明这是最后一页；否则推进 offset 等待下一次 loadMore。
    if (fresh.length < PAGE_LIMIT) {
      hasMore.value = false
    } else {
      offset.value += PAGE_LIMIT
    }
  } catch (error) {
    if (!append && !cached.length) {
      handCards.value = []
      const message = error instanceof Error ? error.message : t('UIClub_LoadRecordFail')
      showFailToast(message)
    }
    // append 失败时不弹错也不清空，让用户保留已展示的列表，下次滚动可重试。
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMoreHandCollection(): void {
  void fetchHandCollection(true)
}

// IntersectionObserver 触底加载：把哨兵元素放在列表底部，进入视口就触发下一页。
const bottomSentinel = ref<HTMLElement | null>(null)
let bottomObserver: IntersectionObserver | null = null

function attachBottomObserver(): void {
  detachBottomObserver()
  if (typeof IntersectionObserver === 'undefined') return
  const target = bottomSentinel.value
  if (!target) return
  bottomObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting) loadMoreHandCollection()
    },
    { rootMargin: LOAD_MORE_ROOT_MARGIN },
  )
  bottomObserver.observe(target)
}

function detachBottomObserver(): void {
  bottomObserver?.disconnect()
  bottomObserver = null
}

// 哨兵在 v-if (hasMore) 切换后会被销毁/重建，要等下一帧重新绑定观察器。
watch([hasMore, handCards], () => {
  void nextTick(attachBottomObserver)
})

onBeforeUnmount(detachBottomObserver)

function selectGame(tab: string): void {
  if (selectedGame.value === tab) return
  selectedGame.value = tab
  void fetchHandCollection()
}

function selectMode(tab: string): void {
  if (selectedMode.value === tab) return
  selectedMode.value = tab
  void fetchHandCollection()
}

function goHandDetail(card: HandCard): void {
  if (!card.handRecord) {
    showFailToast(t('UIClub_DataError'))
    return
  }

  setHandReplaySession({
    handId: card.handId,
    roomRecord: card.roomRecord,
    handRecord: card.handRecord,
  })

  void router.push({
    path: '/mine/hand-collection/detail',
    query: {
      hand_id: card.handId,
    },
  })
}

onMounted(() => {
  void fetchHandCollection()
})
</script>

<template>
  <div class="page-shell mine-glass-page hand-collection-page" :style="backgroundStyle">
    <HeaderBack :title="title" :extra-padding="true" />

    <div class="content-wrap">
      <div class="tabs game-tabs">
        <button
          v-for="item in gameTabs"
          :key="item"
          type="button"
          :class="['plain-tab', { active: selectedGame === item }]"
          @click="selectGame(item)"
        >
          {{ item }}
        </button>
      </div>

      <div class="tabs mode-tabs">
        <button
          v-for="item in modeTabs"
          :key="item"
          type="button"
          :class="['capsule-tab', { active: selectedMode === item }]"
          @click="selectMode(item)"
        >
          {{ item }}
        </button>
      </div>

      <section class="list-wrap">
        <p v-if="loading" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!handCards.length" class="list-status">{{ t('UIClub_NoRecord2') }}</p>
        <article
          v-for="card in handCards"
          :key="card.id"
          class="glass-card hand-card"
          @click="goHandDetail(card)"
        >
          <div class="top-row">
            <div class="poker-pair">
              <PokerCard
                v-for="(value, idx) in card.handCards"
                :key="`${card.id}-card-${idx}`"
                :rank="value.rank"
                :suit="value.suit"
                size="0.82rem"
              />
            </div>
            <div class="title" v-html="card.title"></div>
          </div>
          <div class="line"></div>
          <div class="bottom-row">
            <div class="meta">
              <div>{{ t('UIPaipu_HandId') }}: {{ card.handId }}</div>
              <div class="bottom-info">
                <img class="icon-sb" src="@/assets/icons/icon_sb.svg" alt="" />
                <span>{{ card.table }}</span>
                <span>{{ t('adaptation20005') }}:</span>
                <span>{{ card.pot }}</span>
              </div>
            </div>
            <div class="profit">
              <div :class="['money', { negative: card.negative !== false }]">{{ card.profit }}</div>
              <div class="profit-hands">
                <img class="icon-sb" src="@/assets/icons/icon_cards2.svg" alt="" />
                <span>{{ t('UITexasReport_hand') }}:{{ card.hands }}</span>
              </div>
            </div>
          </div>
        </article>

        <!-- 触底加载哨兵：仅在还有下一页时挂上，IntersectionObserver 监听它进入视口。 -->
        <div
          v-if="hasMore && handCards.length"
          ref="bottomSentinel"
          class="list-sentinel"
          aria-hidden="true"
        ></div>
        <p v-if="loadingMore" class="list-status">{{ t('SuperView2') }}...</p>
        <p v-else-if="!hasMore && handCards.length" class="list-status list-status-end">
          {{ t('UIClub_NoMore') }}
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.mine-glass-page {
  height: 100dvh;
  // padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-image: var(--hand-collection-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: var(--c-text);
    background-color: var(--c-page);
    background-image: var(--hand-collection-bg-light);
  }
}

.content-wrap {
  padding: 0 0.45rem;
}

.tabs {
  display: flex;
}

.game-tabs {
  margin-top: 0.4rem;
  justify-content: space-around;
}

.plain-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.37rem;
  padding-bottom: 0.06rem;

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.9);

    @include theme-light {
      color: var(--c-brand);
      border-bottom-color: var(--c-brand);
    }
  }
}

.mode-tabs {
  margin-top: 0.3rem;
  border-radius: 1.38rem;
  background: rgba(255, 255, 255, 0.2);
  // padding: 0.08rem;

  @include theme-light {
    background: #e3e3e3;
  }
}

.capsule-tab {
  flex: 1;
  border: 0;
  border-radius: 1.38rem;
  background: transparent;
  color: #fff;
  font-size: 0.44rem;
  padding: 0.35rem 0;

  @include theme-light {
    color: var(--c-text);
  }

  &.active {
    background: rgba(255, 255, 255, 0.2);
    font-weight: 700;

    @include theme-light {
      background: #cfcfcf;
    }
  }
}

.list-wrap {
  margin-top: 0.42rem;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.list-status {
  text-align: center;
  font-size: 0.3rem;
  opacity: 0.78;
  padding: 0.24rem 0;
}

.list-status-end {
  opacity: 0.55;
}

.list-sentinel {
  width: 100%;
  height: 0.04rem;
}

.glass-card {
  border-radius: 0.76rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);

  @include theme-light {
    border-color: transparent;
    background: var(--c-surface);
    backdrop-filter: none;
  }
}

.hand-card {
  padding: 0.5rem 0.45rem 0.24rem;
}
.poker-card {
  margin-right: 0.1rem;
}

.top-row,
.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .meta {
    padding: 0.2rem 0;
  }
  .bottom-info {
    display: flex;
    align-items: center;
    margin-top: 0.1rem;
  }
  .icon-sb {
    width: 0.37rem;
    height: 0.37rem;
    margin-right: 0.1rem;

    @include theme-light {
      filter: brightness(0);
    }
  }
  span {
    margin-right: 0.1rem;
  }
}

.poker-pair {
  display: flex;
  gap: 0.08rem;
}

.title {
  flex: 1;
  text-align: right;
  font-size: 0.34rem;
  font-weight: 600;
}

.line {
  height: 0.02rem;
  background: rgba(249, 249, 249, 0.2);
  margin: 0.25rem 0 0rem;

  @include theme-light {
    background: rgba(0, 0, 0, 0.1);
  }
}

.meta {
  font-size: 0.31rem;
  line-height: 1.4;
}

.profit {
  text-align: right;
  font-size: 0.31rem;
  .profit-hands {
    img {
      width: 0.37rem;
      height: 0.37rem;

      @include theme-light {
        filter: brightness(0);
      }
    }
    display: flex;
    align-items: flex-end;
  }
}

.money {
  color: var(--c-profit);
  font-size: 0.52rem;
  font-weight: 700;

  line-height: 0.45rem;

  &.negative {
    color: var(--c-loss);
  }
}
</style>

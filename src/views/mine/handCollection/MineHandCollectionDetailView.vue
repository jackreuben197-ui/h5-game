<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRoute } from 'vue-router'
import type { StatsReplayData, StatsReplayFantasyData } from '@/api/models/replayDisplay'
import type {
  StatsUserGameRecordListRecord,
  StatsUserGameRecordListRoom_record,
} from '@/api/models/stats'
import {
  buildReplayDisplaySections,
  buildShowdownSection,
  formatChipAmount,
  type ReplayDisplayMetric,
  type ReplayDisplayStreetSection,
  type ReplayShowdownSection,
} from '@/api/models/replayDisplay'
import {
  postMiscGameRecordRoundApi,
  postMiscGameRemoveRoundApi,
  postMiscGameRoundStatusApi,
} from '@/api/misc'
import { useGameStore } from '@/stores/game'
import { userCache } from '@/utils/userCache'
import { USER_STORE_H5_REPLAY } from '@/utils/indexedDB'
import iconChips from '@/assets/icons/icon_chips.png'
import iconMushroom from '@/assets/icons/table_icon_mushroom.png'
import iconBlind from '@/assets/icons/ic_glif.svg'
import iconTime from '@/assets/icons/wallet/ic_time.svg'
import iconStar from '@/assets/icons/ic_star.svg'
import iconShare from '@/assets/icons/ic_share.svg'
import iconPeople from '@/assets/icons/icon_people2.svg'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import PokerCard from '@/components/GameCard/PokerCard.vue'
import { getHandReplaySession } from '@/session/handReplaySession'
import { t } from '@/i18n'

const title = computed(() => t('adaptation10210'))
const route = useRoute()
const gameStore = useGameStore()

// 客户端 OnClickCollect 成功后会 Game.EventSystem.Run(UI_MINE_REFRESH_REPLAY) 让列表页刷新；
// H5 用清缓存替代——下一次进入列表会触发完整 server fetch，避免看到旧的收藏状态。
const COLLECTED_CACHE_KEYS = ['texas_collected', 'sixplus_collected', 'omaha_collected']
async function invalidateCollectedCache(): Promise<void> {
  const cache = userCache(gameStore.loginUserId)
  await Promise.all(
    COLLECTED_CACHE_KEYS.map((key) => cache.delete(USER_STORE_H5_REPLAY, key).catch(() => undefined)),
  )
}

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

function parseReplayLike<T>(value: unknown): T | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  if (typeof value === 'object') return value as T
  return null
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatDateTime(unixSeconds?: number): string {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) return '--/-- --:--'
  const d = new Date(unixSeconds * 1000)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

const handId = computed(() => {
  const raw = route.query.hand_id
  return typeof raw === 'string' && raw.trim() ? raw.trim() : ''
})

const payload = computed(() => getHandReplaySession(handId.value || undefined))
const roomRecord = computed<StatsUserGameRecordListRoom_record>(
  () => payload.value?.roomRecord ?? {},
)
const handRecord = computed<StatsUserGameRecordListRecord | null>(
  () => payload.value?.handRecord ?? null,
)

const replay = computed(() => parseReplayLike<StatsReplayData>(handRecord.value?.replay))
const replayFantasy = computed(() =>
  parseReplayLike<StatsReplayFantasyData>(handRecord.value?.replay_ft),
)

const summaryTitle = computed(() => {
  if (replay.value?.name) return String(replay.value.name)
  if (replayFantasy.value?.name) return String(replayFantasy.value.name)
  if (handRecord.value?.name) return String(handRecord.value.name)
  return 'Hand Replay'
})

const finishedAt = computed(() => {
  if (replay.value?.etime) return formatDateTime(toSafeNumber(replay.value.etime))
  if (replayFantasy.value?.etime) return formatDateTime(toSafeNumber(replayFantasy.value.etime))
  return '--/-- --:--'
})

// 对齐客户端 UIReplayDetailTexasComponent.InitRoomInfo：sb/bb 都来自 replay.table，
// GetFormatLongNumber 内部 /100。ante 大于 0 时尾随 "(ante)"。
const blindInfo = computed(() => {
  const table = replay.value?.table
  if (table) {
    const sb = toSafeNumber(table.sb?.bet)
    const bb = toSafeNumber(table.bb?.bet)
    const blind = sb > 0 ? sb : Math.floor(bb / 2)
    const ante = toSafeNumber(table.ante)
    if (blind > 0 || bb > 0 || ante > 0) {
      const base = `${formatChipAmount(blind)}/${formatChipAmount(blind * 2)}`
      return ante > 0 ? `${base}(${formatChipAmount(ante)})` : base
    }
  }
  const sbFallback = toSafeNumber(roomRecord.value.small_blind)
  const anteFallback = toSafeNumber(roomRecord.value.random_ante)
  if (sbFallback > 0 || anteFallback > 0) {
    return `${formatChipAmount(sbFallback)}/${formatChipAmount(anteFallback)}`
  }
  return '1/2'
})

const headerHandId = computed(() => {
  if (handId.value) return handId.value
  const fallback = handRecord.value?.room_unique_id ?? handRecord.value?.id
  return String(fallback ?? '--')
})

const streetSections = computed<ReplayDisplayStreetSection[]>(() => {
  return buildReplayDisplaySections(replay.value, replayFantasy.value)
})

const showdownSections = computed<ReplayShowdownSection[]>(() => buildShowdownSection(replay.value))

// 对齐客户端 GetCardNameByNum(0) 渲染的占位牌：手牌数取 result[].card 的最大长度，缺省 2。
const handCardCount = computed<number>(() => {
  const lens = (replay.value?.result ?? [])
    .map((r) => (Array.isArray(r.card) ? r.card.length : 0))
    .filter((n) => n > 0)
  if (lens.length) return Math.max(...lens)
  return 2
})

const placeholderHandSlots = computed<number[]>(() =>
  Array.from({ length: handCardCount.value }, (_, i) => i),
)

// 用 maxcard_idx 标记胜牌。客户端：>=5 是手牌（idx-5），<5 是公共牌位置。
function makeHighlightSet(idxList: number[] | undefined): Set<number> | null {
  if (!idxList || !idxList.length) return null
  return new Set(idxList)
}

function isBoardHighlighted(highlights: Set<number> | null, boardIdx: number): boolean {
  if (!highlights) return true
  return highlights.has(boardIdx)
}

function isHandHighlighted(highlights: Set<number> | null, handIdx: number): boolean {
  if (!highlights) return true
  return highlights.has(handIdx + 5)
}

const isCollected = ref(false)
const collectBusy = ref(false)

// 对齐客户端：保存/取消/再次校验都用 _cacheUnique（来自 replay.unique），不是 listing 的 room_unique_id。
// 两者通常一致，但在“收藏列表/最近列表”两种入口下偶有差异，用 replay.unique 才能确保和服务端规范一致。
function canonicalUniqueId(): string {
  const fromReplay = String(replay.value?.unique ?? '').trim()
  if (fromReplay) return fromReplay
  return String(handRecord.value?.room_unique_id ?? '').trim()
}

function buildCollectStatusPayload(): Record<string, unknown> | null {
  const record = handRecord.value
  if (!record) return null
  return {
    room_id: toSafeNumber(record.room_id) || toSafeNumber(roomRecord.value.room_id),
    room_unique_id: canonicalUniqueId(),
    hand_num: toSafeNumber(record.hand_num),
  }
}

async function refreshCollectStatus(): Promise<void> {
  const payload = buildCollectStatusPayload()
  if (!payload) return
  try {
    const resp = await postMiscGameRoundStatusApi(payload)
    if (resp?.code !== 0) return
    const records = resp?.data?.records ?? []
    const first = Array.isArray(records) ? records[0] : null
    isCollected.value = !!(first && first.remove === 0)
  } catch {
    // 静默：不阻断详情展示
  }
}

onMounted(() => {
  if (!handRecord.value) {
    showFailToast(t('UIClub_NotFoundData') + '，' + t('UIClub_Enter'))
    return
  }
  void refreshCollectStatus()
})

function metricIcon(metric: ReplayDisplayMetric): string {
  if (metric.icon === 'people') return iconPeople
  if (metric.icon === 'mushroom') return iconMushroom
  return iconChips
}

async function onFavorite(): Promise<void> {
  if (collectBusy.value) return
  const record = handRecord.value
  if (!record) return
  const uniqueId = canonicalUniqueId()
  if (!uniqueId) {
    showFailToast(t('UIClub_DataError'))
    return
  }
  const roomId = toSafeNumber(record.room_id) || toSafeNumber(roomRecord.value.room_id)
  const handNum = toSafeNumber(record.hand_num)
  collectBusy.value = true
  try {
    if (isCollected.value) {
      const resp = await postMiscGameRemoveRoundApi({
        room_id: roomId,
        room_unique_id: uniqueId,
        hand_num: handNum,
      })
      if (resp?.code !== 0) {
        showFailToast(typeof resp?.message === 'string' ? resp.message : t('UIClub_LoadFail11'))
        return
      }
      showSuccessToast(t('adaptation10211'))
    } else {
      const resp = await postMiscGameRecordRoundApi({
        id: toSafeNumber(record.id),
        room_id: roomId,
        match_id: toSafeNumber(record.match_id),
        room_unique_id: uniqueId,
        name: record.name ?? '',
        hand_num: handNum,
        change: toSafeNumber(record.change),
        type: toSafeNumber(record.type),
        open: toSafeNumber(record.open),
      })
      if (resp?.code !== 0) {
        showFailToast(typeof resp?.message === 'string' ? resp.message : t('UIClub_LoadFail11'))
        return
      }
      showSuccessToast(t('Collection_success'))
    }
    // 以服务端为准回写一次，避免本地状态与服务端漂移（也覆盖跨入口的 unique 差异）。
    await refreshCollectStatus()
    // 收藏 / 取消都让列表的「收藏」缓存失效，等价于客户端的 UI_MINE_REFRESH_REPLAY 事件。
    void invalidateCollectedCache()
  } catch {
    showFailToast(t('UIClub_LoadFail11'))
  } finally {
    collectBusy.value = false
  }
}

function onShare(): void {
  showSuccessToast(t('UIClub_InDeve3'))
}
</script>

<template>
  <div class="page-shell hand-detail-page" :style="backgroundStyle">
    <HeaderBack :title="title" :extra-padding="true" />

    <main class="page-content">
      <section class="summary-wrap">
        <p class="summary-title">{{ summaryTitle }}</p>
        <div class="summary-meta">
          <div class="meta-item">
            <img class="meta-icon" :src="iconBlind" alt="" aria-hidden="true" />
            <span>{{ blindInfo }}</span>
          </div>
          <div class="meta-item">
            <img class="meta-icon" :src="iconTime" alt="" aria-hidden="true" />
            <span>{{ finishedAt }}</span>
          </div>
          <div class="meta-item hand-code">{{ headerHandId }}</div>
        </div>
      </section>

      <section v-for="section in streetSections" :key="section.id" class="street-card">
        <header class="street-head">
          <div class="head-left">
            <h3 class="street-title">{{ section.title }}</h3>
            <div v-if="section.boardCards?.length" class="board-stack">
              <div class="board-cards">
                <PokerCard
                  v-for="(card, idx) in section.boardCards"
                  :key="`${section.id}-a-${idx}`"
                  :rank="card.rank"
                  :suit="card.suit"
                  :size="section.boardCardsSecond?.length ? '0.6rem' : '0.73rem'"
                />
              </div>
              <div v-if="section.boardCardsSecond?.length" class="board-cards">
                <PokerCard
                  v-for="(card, idx) in section.boardCardsSecond"
                  :key="`${section.id}-b-${idx}`"
                  :rank="card.rank"
                  :suit="card.suit"
                  size="0.6rem"
                />
              </div>
            </div>
            <p v-else class="street-sub">{{ t('UITexas_History_xxgc') }}</p>
          </div>

          <div class="head-right">
            <p
              v-for="(metric, metricIdx) in section.metrics"
              :key="`${section.id}-metric-${metricIdx}`"
              class="head-stat"
            >
              <img class="head-icon" :src="metricIcon(metric)" alt="" />
              {{ metric.value }}
            </p>
          </div>
        </header>

        <div class="divider"></div>

        <div class="rows-wrap">
          <div
            v-for="(row, idx) in section.rows"
            :key="`${section.id}-${idx}`"
            class="action-row"
            :class="{ folded: row.muted }"
          >
            <div class="name-part">
              <span class="seat-tag">{{ row.seat }}</span>
              <span class="player-name" :class="{ 'name-folded': row.muted }">{{ row.name }}</span>
            </div>
            <div class="move-part">
              <div>
                <span class="move-tag" :class="`tone-${row.actionTone}`">{{ row.action }}</span>
                <span class="move-amount">{{ row.amount }}</span>
              </div>
              <span v-if="row.mushroomGain" class="mush-gain">
                <img class="mush-icon" :src="iconMushroom" alt="" />
                +{{ row.mushroomGain }}
              </span>
            </div>
            <div class="result-part">
              <span class="result-num" :class="row.isAllin ? 'stack-allin' : 'stack-green'">
                {{ row.stack }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        v-for="(sd, sdIdx) in showdownSections"
        :key="`sd-section-${sdIdx}`"
        class="street-card showdown-card"
      >
        <header class="street-head">
          <div class="head-left">
            <h3 class="street-title">{{ sd.title ?? 'Showdown' }}</h3>
            <div v-if="sd.boardCards.length" class="board-stack">
              <div class="board-cards">
                <PokerCard
                  v-for="(card, idx) in sd.boardCards"
                  :key="`sd-${sdIdx}-head-${idx}`"
                  :rank="card.rank"
                  :suit="card.suit"
                  size="0.6rem"
                />
              </div>
            </div>
            <p v-else class="street-sub">{{ t('UIClub_Text59') }}</p>
          </div>
          <div class="head-right">
            <p
              v-for="(metric, metricIdx) in sd.metrics"
              :key="`sd-${sdIdx}-metric-${metricIdx}`"
              class="head-stat"
            >
              <img class="head-icon" :src="metricIcon(metric)" alt="" />
              {{ metric.value }}
            </p>
          </div>
        </header>

        <div class="divider"></div>

        <div class="showdown-list">
          <div
            v-for="(player, pIdx) in sd.rows"
            :key="`sd-${sdIdx}-${pIdx}`"
            class="showdown-player"
            :class="{ winner: player.isWinner }"
          >
            <div class="showdown-player-head">
              <div class="showdown-left">
                <span class="seat-tag">{{ player.seat }}</span>
                <p v-if="player.handType" class="showdown-type">{{ player.handType }}</p>
              </div>
              <div class="showdown-mid">
                <div class="player-name">{{ player.name }}</div>
                <div class="showdown-cards">
                  <!-- 2 张手牌 -->
                  <div class="cards-group cards-hand">
                    <template v-if="player.cards.length">
                      <PokerCard
                        v-for="(card, cIdx) in player.cards"
                        :key="`sd-${sdIdx}-${pIdx}-c-${cIdx}`"
                        :rank="card.rank"
                        :suit="card.suit"
                        :class="{
                          'card-dim': !isHandHighlighted(makeHighlightSet(player.maxCardIdx), cIdx),
                        }"
                        size="0.6rem"
                      />
                    </template>
                    <template v-else>
                      <span
                        v-for="slot in placeholderHandSlots"
                        :key="`sd-${sdIdx}-${pIdx}-ph-${slot}`"
                        class="card-placeholder"
                      ></span>
                    </template>
                  </div>
                  <!-- 5 张公共牌 -->
                  <div class="cards-group cards-board">
                    <PokerCard
                      v-for="(card, bIdx) in sd.boardCards"
                      :key="`sd-${sdIdx}-${pIdx}-b-${bIdx}`"
                      :rank="card.rank"
                      :suit="card.suit"
                      :class="{
                        'card-dim': !isBoardHighlighted(makeHighlightSet(player.maxCardIdx), bIdx),
                      }"
                      size="0.6rem"
                    />
                  </div>
                </div>
                <span v-if="player.mushroomGain" class="mush-gain">
                  <img class="mush-icon" :src="iconMushroom" alt="" />
                  +{{ player.mushroomGain }}
                </span>
              </div>
              <span class="showdown-win" :class="{ positive: player.isWinner }">
                {{ player.winAmount }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="action-bar">
      <button
        type="button"
        class="action-btn"
        :class="{ 'is-collected': isCollected }"
        :disabled="collectBusy"
        @click="onFavorite"
      >
        <img class="icon" :src="iconStar" alt="" aria-hidden="true" />
        <span>{{ t('adaptation10212') }}</span>
      </button>
      <button type="button" class="action-btn" @click="onShare">
        <img class="icon" :src="iconShare" alt="" aria-hidden="true" />
        <span>{{ t('UITexasHistory_share') }}</span>
      </button>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.hand-detail-page {
  height: 100dvh;
  // padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding: 0 0 calc(env(safe-area-inset-bottom) + 2.2rem);
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.page-content {
  padding: 0.24rem 0.35rem 0;
}

.summary-wrap {
  padding: 0.1rem 0.02rem 0;
}

.summary-title {
  margin: 0;
  font-size: 0.41rem;
  line-height: 1.1;
  font-weight: 300;
}

.summary-meta {
  margin-top: 0.14rem;
  display: flex;
  align-items: center;
  gap: 0.32rem;
  font-size: 0.4rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.meta-icon {
  width: 0.34rem;
  height: 0.34rem;
  object-fit: contain;
  opacity: 0.9;
}

.hand-code {
  font-weight: 400;
}

.street-card {
  margin-top: 0.34rem;
  border-radius: 0.8rem;
  border: none;
  background: rgba(0, 0, 0, 0.25);
  padding: 0.28rem 0.32rem 0.24rem;
}

.street-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 0.22rem;
}

.street-title {
  margin-left: 0.02rem;
  font-size: 0.4rem;
  font-weight: 400;
}

.street-sub {
  margin: 0;
  font-size: 0.36rem;
  opacity: 0.8;
}

.board-stack {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.board-cards {
  display: flex;
  gap: 0.06rem;
}

.head-right {
  text-align: right;
}

.head-stat {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.08rem;
  margin: 0;
  font-size: 0.4rem;
  line-height: 1.1;
  font-weight: 400;
}

.head-stat + .head-stat {
  margin-top: 0.06rem;
}

.head-stat.strong {
  color: #d6ebff;
}

.head-icon {
  width: 0.42rem;
  height: 0.42rem;
  object-fit: contain;
}

.divider {
  height: 0.02rem;
  background: rgba(249, 249, 249, 0.1);
  margin: 0.3rem 0 0.16rem;
}

.rows-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.action-row {
  display: grid;
  grid-template-columns: minmax(3rem, 1.5fr) minmax(3rem, 2fr) minmax(1.8rem, auto);
  align-items: center;
  gap: 0.12rem;
  font-size: 0.3rem;
}

.name-folded {
  opacity: 0.5;
}

.name-part {
  display: flex;
  align-items: center;
  gap: 0.12rem;
  min-width: 0;
}

.move-part {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.12rem;
  min-width: 0;
  .move-amount {
    width: 1.2rem;
  }
}

.seat-tag,
.move-tag {
  min-width: 0.66rem;
  height: 0.55rem;
  border-radius: 0.12rem;
  padding: 0 0.12rem;
  font-size: 0.26rem;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.move-tag {
  margin-right: 0.1rem;
}

.seat-tag {
  background: #8053fd;
}

.tone-blue {
  background: #78e490;
  color: #111;
}

.tone-green {
  background: #80cd10;
  color: #f9f9f9;
}

.tone-red {
  background: #ff4368;
  color: #f9f9f9;
}

.tone-gray {
  background: #9d9d9d;
  color: #f9f9f9;
}

.tone-teal {
  background: #39c2b2;
  color: #f9f9f9;
}

.player-name,
.move-amount,
.result-num {
  font-size: 0.38rem;
}

.result-num {
  font-weight: 400;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.4rem;
}

.result-part {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.08rem;
  min-width: 0;
}

.mush-gain {
  display: inline-flex;
  align-items: center;
  gap: 0.04rem;
  font-size: 0.28rem;
  color: #f9f9f9;
  white-space: nowrap;
}

.mush-icon {
  width: 0.32rem;
  height: 0.32rem;
  object-fit: contain;
}

.showdown-card {
  margin-bottom: 0.32rem;
  .seat-tag {
    margin-top: 0.3rem;
  }
}

.showdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.showdown-player {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;

  &.winner .player-name {
    color: #ffd673;
  }
  &.winner .showdown-win.positive {
    color: red;
  }
}

.showdown-player-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.12rem;
  font-size: 0.32rem;
  .showdown-left {
    width: 2rem;
  }
  .showdown-mid {
    flex: 1;
  }

  .player-name {
    font-size: 0.19rem;
  }
  .showdown-win {
    width: 1.5rem;
    text-align: right;
  }
}

.showdown-win {
  font-size: 0.4rem;
  font-weight: 600;
  color: #d6ebff;
  white-space: nowrap;

  &.positive {
    color: #ffd673;
  }
}

.showdown-cards {
  display: flex;
  gap: 0.22rem; // 手牌组与公共牌组之间的间隔
  align-items: center;
}

.cards-group {
  display: inline-flex;
  gap: 0.05rem;
  align-items: center;
}

// 对齐客户端：未参与最大牌型的牌置灰（Color32(127,127,127,255)）。
.card-dim {
  filter: grayscale(1) brightness(0.55);
  opacity: 0.7;
}

// 对齐客户端 _handCards.Count<=0 时画牌背的占位：H5 用虚线框。
.card-placeholder {
  display: inline-block;
  width: calc(1.85rem * 0.6 / 1.84);
  height: calc(2.75rem * 0.6 / 1.84);
  border-radius: calc(0.32rem * 0.6 / 1.84);
  border: 1px dashed rgba(249, 249, 249, 0.45);
  box-sizing: border-box;
}

// 对齐客户端 SetPlayerItem：默认 Text_wins 颜色 TEXT_GREEN；actList==9 (all in) 染为 Color32(198,198,198,160)。
.stack-green {
  color: #00d4a6;
}

.stack-allin {
  color: rgba(198, 198, 198, 0.63);
}

.showdown-type {
  margin: 0;
  font-size: 0.19rem;
  opacity: 0.85;
  margin-left: 0.1rem;
  // color: #ffd673;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.24rem 0.24rem calc(env(safe-area-inset-bottom) + 0.24rem);
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  gap: 0.2rem;
}

.action-btn {
  flex: 1;
  height: 0.86rem;
  border-radius: 0.43rem;
  border: 0.02rem solid rgba(242, 242, 242, 0.1);
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.1) 21.11%, rgba(230, 230, 230, 0.1) 71.43%);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  color: #f9f9f9;
  font-size: 0.32rem;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;

  &.is-collected {
    color: #ffd673;
  }

  &:disabled {
    opacity: 0.5;
  }
}

.icon {
  width: 0.36rem;
  height: 0.36rem;
  object-fit: contain;
}
</style>

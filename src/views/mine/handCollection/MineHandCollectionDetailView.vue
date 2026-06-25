<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRoute } from 'vue-router'
import type { StatsReplayData, StatsReplayFantasyData } from '@/api/models/replayDisplay'
import type {
  StatsUserGameRecordListRecord,
  StatsUserGameRecordListRoom_record,
} from '@/api/models/stats'
import {
  buildReplayDisplaySections,
  decodeCard,
  type CardItem,
  type ReplayDisplayMetric,
  type ReplayDisplayStreetSection,
} from '@/api/models/replayDisplay'
import iconChips from '@/assets/icons/icon_chips.png'
import iconMushroom from '@/assets/icons/table_icon_mushroom.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import PokerCard from '@/components/GameCard/PokerCard.vue'
import { getHandReplaySession } from '@/session/handReplaySession'
import { t } from '@/i18n'

const title = computed(() => t('adaptation10210'))
const route = useRoute()

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

function cardListFromUnknown(value: unknown): CardItem[] {
  if (!Array.isArray(value)) return []
  return (value as number[])
    .map((item) => decodeCard(toSafeNumber(item)))
    .filter((c) => c.rank !== '--')
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

const blindInfo = computed(() => {
  const sb = toSafeNumber(roomRecord.value.small_blind)
  const ante = toSafeNumber(roomRecord.value.random_ante)
  if (sb > 0 || ante > 0) return `${sb}/${ante}`
  return '1/2'
})

const headerHandId = computed(() => {
  if (handId.value) return handId.value
  const fallback = handRecord.value?.room_unique_id ?? handRecord.value?.id
  return String(fallback ?? '--')
})

const streetSections = computed<ReplayDisplayStreetSection[]>(() => {
  return buildReplayDisplaySections(replay.value, replayFantasy.value, {
    topMetricValue: blindInfo.value,
    bottomMetricValue: toSafeNumber(handRecord.value?.bet_pot).toLocaleString('en-US'),
  })
})

const showdownCards = computed(() => {
  if (replay.value?.result?.[0]?.card?.length) {
    return cardListFromUnknown(replay.value.result[0].card)
  }
  const fallbackCards = cardListFromUnknown(
    replay.value?.procedure?.river?.card ?? replay.value?.procedure?.turn?.card ?? [],
  )
  return fallbackCards.length ? fallbackCards : []
})

const showdownProfit = computed(() => {
  const win = toSafeNumber(replay.value?.result?.[0]?.win)
  if (win > 0) return `+${win.toLocaleString('en-US')}`
  if (win < 0) return `-${Math.abs(win).toLocaleString('en-US')}`
  return '0'
})

onMounted(() => {
  if (!handRecord.value) {
    showFailToast(t('UIClub_NotFoundData') + "，" + t('UIClub_Enter'))
  }
})

function metricIcon(metric: ReplayDisplayMetric): string {
  return metric.icon === 'mushroom' ? iconMushroom : iconChips
}

function onFavorite(): void {
  showSuccessToast(t('UIClub_Done2'))
}

function onShare(): void {
  showSuccessToast(t('UIClub_InDeve3'))
}
</script>

<template>
  <div class="page-shell hand-detail-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <main class="page-content">
      <section class="summary-wrap">
        <p class="summary-title">{{ summaryTitle }}</p>
        <div class="summary-meta">
          <div class="meta-item">
            <span class="meta-icon">♠</span>
            <span>{{ blindInfo }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">◷</span>
            <span>{{ finishedAt }}</span>
          </div>
          <div class="meta-item hand-code">{{ headerHandId }}</div>
        </div>
      </section>

      <section v-for="section in streetSections" :key="section.id" class="street-card">
        <header class="street-head">
          <div class="head-left">
            <h3 class="street-title">{{ section.title }}</h3>
            <div v-if="section.boardCards?.length" class="board-cards">
              <PokerCard
                v-for="(card, idx) in section.boardCards"
                :key="`${section.id}-${idx}`"
                :rank="card.rank"
                :suit="card.suit"
                size="0.6rem"
              />
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
            :class="{ muted: row.muted }"
          >
            <div class="name-part">
              <span class="seat-tag">{{ row.seat }}</span>
              <span class="player-name">{{ row.name }}</span>
            </div>
            <div class="move-part">
              <span class="move-tag" :class="`tone-${row.actionTone}`">{{ row.action }}</span>
              <span class="move-amount">{{ row.amount }}</span>
            </div>
            <span class="result-num">{{ row.stack }}</span>
          </div>
        </div>
      </section>

      <section v-if="showdownCards.length" class="street-card showdown-card">
        <header class="street-head">
          <div class="head-left">
            <h3 class="street-title">Showdown</h3>
            <p class="street-sub">{{ t('UIClub_Text59') }}</p>
          </div>
          <div class="head-right">
            <p class="head-stat strong">{{ showdownProfit }}</p>
          </div>
        </header>

        <div class="divider"></div>

        <div class="showdown-row">
          <div class="showdown-main">
            <div class="showdown-cards">
              <PokerCard
                v-for="(card, idx) in showdownCards"
                :key="`show-${idx}`"
                :rank="card.rank"
                :suit="card.suit"
                size="0.6rem"
              />
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="action-bar">
      <button type="button" class="action-btn" @click="onFavorite">
        <span class="icon">★</span>
        <span>{{ t('adaptation10212') }}</span>
      </button>
      <button type="button" class="action-btn" @click="onShare">
        <span class="icon">↗</span>
        <span>{{ t('UITexasHistory_share') }}</span>
      </button>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.hand-detail-page {
  height: 100dvh;
  // padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding-bottom: calc(env(safe-area-inset-bottom) + 2.2rem);
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
  font-size: 0.56rem;
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
  opacity: 0.9;
}

.hand-code {
  font-weight: 500;
}

.street-card {
  margin-top: 0.34rem;
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.08);
  background: rgba(0, 0, 0, 0.33);
  backdrop-filter: blur(0.08rem);
  padding: 0.28rem 0.32rem 0.24rem;
}

.street-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 0.22rem;
}

.street-title {
  margin: 0;
  font-size: 0.5rem;
  font-weight: 500;
}

.street-sub {
  margin: 0;
  font-size: 0.36rem;
  opacity: 0.8;
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
  font-size: 0.5rem;
  line-height: 1.1;
  font-weight: 600;
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
  margin: 0.2rem 0 0.16rem;
}

.rows-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.action-row {
  display: grid;
  grid-template-columns: minmax(3rem, 1.5fr) minmax(2.4rem, 1fr) 1.8rem;
  align-items: center;
  gap: 0.12rem;
  font-size: 0.3rem;

  &.muted {
    opacity: 0.58;
  }
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
  gap: 0.12rem;
  min-width: 0;
}

.seat-tag,
.move-tag {
  min-width: 0.66rem;
  height: 0.46rem;
  border-radius: 0.12rem;
  padding: 0 0.12rem;
  font-size: 0.26rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.seat-tag {
  background: linear-gradient(180deg, #00d4a6 0%, #007e63 100%);
}

.tone-blue {
  background: #4caaf4;
  color: #222;
}

.tone-red {
  background: #fa2b4b;
  color: #f9f9f9;
}

.tone-black {
  background: #222;
  color: #f9f9f9;
}

.player-name,
.move-amount,
.result-num {
  font-size: 0.37rem;
}

.result-num {
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.showdown-card {
  margin-bottom: 0.32rem;
}

.showdown-row {
  display: flex;
  align-items: center;
}

.showdown-main {
  min-width: 0;
}

.showdown-cards {
  margin-top: 0.08rem;
  display: flex;
  gap: 0.05rem;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.24rem 0.24rem calc(env(safe-area-inset-bottom) + 0.24rem);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.08rem);
  display: flex;
  gap: 0.2rem;
}

.action-btn {
  flex: 1;
  border: 0;
  height: 0.86rem;
  border-radius: 0.43rem;
  background: rgba(0, 0, 0, 0.62);
  color: #f9f9f9;
  font-size: 0.32rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
}

.icon {
  font-size: 0.34rem;
}
</style>

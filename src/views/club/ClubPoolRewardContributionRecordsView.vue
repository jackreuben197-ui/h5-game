<script setup lang="ts">
import { computed } from 'vue'
import mainBgUrl from '@/assets/images/main_bg.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

interface CardItem {
  rank: string
  suit: 'c' | 'h' | 'd' | 's'
}

interface ContributionRecord {
  id: string
  player: string
  playerId: string
  gameId: string
  gameIdSub: string
  contribution: string
  gameType: string
  cards: CardItem[]
}

const SUIT_SYMBOL: Record<string, string> = { c: '♣', h: '♥', d: '♦', s: '♠' }

function suitSymbol(suit: string) {
  return SUIT_SYMBOL[suit] ?? ''
}
function isRed(suit: string) {
  return suit === 'h' || suit === 'd'
}

const records: ContributionRecord[] = [
  {
    id: '1',
    player: 'name',
    playerId: 'ID:187548724',
    gameId: 'name',
    gameIdSub: 'ID:187548724',
    contribution: '+123456',
    gameType: 'NLH',
    cards: [
      { rank: '2', suit: 'c' },
      { rank: '2', suit: 'h' },
      { rank: '2', suit: 'd' },
      { rank: '2', suit: 's' },
      { rank: '2', suit: 'h' },
    ],
  },
  {
    id: '2',
    player: 'name',
    playerId: 'ID:187548724',
    gameId: 'name',
    gameIdSub: 'ID:187548724',
    contribution: '+123456',
    gameType: 'PLO',
    cards: [
      { rank: '2', suit: 'c' },
      { rank: '2', suit: 'h' },
      { rank: '2', suit: 'd' },
      { rank: '2', suit: 's' },
      { rank: '2', suit: 'h' },
    ],
  },
  {
    id: '3',
    player: 'name',
    playerId: 'ID:187548724',
    gameId: 'name',
    gameIdSub: 'ID:187548724',
    contribution: '-123456',
    gameType: 'NLH',
    cards: [
      { rank: '2', suit: 'c' },
      { rank: '2', suit: 'h' },
      { rank: '2', suit: 'd' },
      { rank: '2', suit: 's' },
      { rank: '2', suit: 'h' },
    ],
  },
  {
    id: '4',
    player: 'name',
    playerId: 'ID:187548724',
    gameId: 'name',
    gameIdSub: 'ID:187548724',
    contribution: '-123456',
    gameType: '6+',
    cards: [
      { rank: '2', suit: 'c' },
      { rank: '2', suit: 'h' },
      { rank: '2', suit: 'd' },
      { rank: '2', suit: 's' },
      { rank: '2', suit: 'h' },
    ],
  },
  {
    id: '5',
    player: 'name',
    playerId: 'ID:187548724',
    gameId: 'name',
    gameIdSub: 'ID:187548724',
    contribution: '+123456',
    gameType: 'NLH',
    cards: [
      { rank: '2', suit: 'c' },
      { rank: '2', suit: 'h' },
      { rank: '2', suit: 'd' },
      { rank: '2', suit: 's' },
      { rank: '2', suit: 'h' },
    ],
  },
  {
    id: '6',
    player: 'name',
    playerId: 'ID:187548724',
    gameId: 'name',
    gameIdSub: 'ID:187548724',
    contribution: '-123456',
    gameType: '6+',
    cards: [
      { rank: '2', suit: 'c' },
      { rank: '2', suit: 'h' },
      { rank: '2', suit: 'd' },
      { rank: '2', suit: 's' },
      { rank: '2', suit: 'h' },
    ],
  },
]
</script>

<template>
  <div class="page-shell record-page" :style="backgroundStyle">
    <HeaderBack :title="'贡献记录'" />

    <div class="record-overlay"></div>

    <section class="record-table-wrap">
      <!-- 表头：底层绿色光晕 + 半透明 pill -->
      <div class="record-header-wrap">
        <div class="record-header-glow"></div>
        <div class="record-header-pill">
          <div class="col-player">Player</div>
          <div class="col-gameid">Game ID</div>
          <div class="col-value">贡献</div>
          <div class="col-type">Game type</div>
          <div class="col-hand">Hand</div>
        </div>
      </div>

      <!-- 数据行 -->
      <div class="record-rows">
        <div v-for="row in records" :key="row.id" class="record-row-pill">
          <div class="col-player">
            <div class="cell-info">
              <span class="info-name">{{ row.player }}</span>
              <span class="info-sub">{{ row.playerId }}</span>
            </div>
          </div>
          <div class="col-gameid">
            <div class="cell-info">
              <span class="info-name">{{ row.gameId }}</span>
              <span class="info-sub">{{ row.gameIdSub }}</span>
            </div>
          </div>
          <div class="col-value" :class="row.contribution.startsWith('+') ? 'val-pos' : 'val-neg'">
            {{ row.contribution }}
          </div>
          <div class="col-type">{{ row.gameType }}</div>
          <div class="col-hand">
            <div class="cards-row">
              <div
                v-for="(card, i) in row.cards"
                :key="i"
                class="mini-card"
                :class="{ 'mini-card--red': isRed(card.suit) }"
              >
                <span class="mini-card__rank">{{ card.rank }}</span>
                <span class="mini-card__suit">{{ suitSymbol(card.suit) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
// 1rem = 37.5px

.record-page {
  position: relative;
  height: 100dvh;
  padding: 0 0.3467rem 0.64rem;
  overflow-x: hidden;
  overflow-y: auto;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.record-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  backdrop-filter: blur(36.5px);
  background: rgba(0, 0, 0, 0.2);
  mix-blend-mode: luminosity;
  z-index: 0;
}

:deep(.page-back-header) {
  position: relative;
  z-index: 2;
  padding-left: 0;
  padding-right: 0;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
  min-height: 1.46rem;
}

// 表格容器
.record-table-wrap {
  position: relative;
  z-index: 2;
  margin: 0.1293rem auto 0; // 4.837px / 37.5
  width: 9.2863rem; // 348.237px / 37.5
  max-width: calc(100vw - 0.6934rem);
  display: flex;
  flex-direction: column;
  gap: 0.1293rem;
}

// 表头
.record-header-wrap {
  position: relative;
  width: 100%;
  flex-shrink: 0;
}

.record-header-glow {
  position: absolute;
  left: 1.76%;
  top: 0.172rem; // 6.45px / 37.5
  width: 96.2%;
  height: 0.5073rem; // 19.024px / 37.5
  border-radius: 0.7136rem; // 26.763px / 37.5
  background: rgba(86, 153, 205, 1);
}

.record-header-pill {
  position: relative;
  display: flex;
  align-items: center;
  height: 0.8512rem; // 31.922px / 37.5
  padding: 0 0.4471rem; // 16.767px / 37.5
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4.2992rem; // 161.221px / 37.5
  color: #f9f9f9;
  font-size: 0.308rem; // 11.54px / 37.5
}

// 数据行
.record-rows {
  display: flex;
  flex-direction: column;
  gap: 0.1293rem;
}

.record-row-pill {
  display: flex;
  align-items: center;
  height: 0.8512rem;
  padding: 0 0.4127rem; // 15.477px / 37.5
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4.2992rem;
  color: rgba(225, 238, 255, 0.9);
}

// 列定义
.col-player {
  flex-shrink: 0;
  width: 1.617rem; // 60.619px / 37.5
  display: flex;
  align-items: center;
}

.col-gameid {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.col-value {
  flex-shrink: 0;
  width: 1.617rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.3009rem; // 11.285px / 37.5
  white-space: nowrap;
}

.col-type {
  flex-shrink: 0;
  width: 1.617rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.3009rem;
  color: #f9f9f9;
  white-space: nowrap;
}

.col-hand {
  flex-shrink: 0;
  width: 2.1066rem; // 78.998px / 37.5
  display: flex;
  align-items: center;
  justify-content: center;
}

// 表头列居中覆盖
.record-header-pill .col-player {
  justify-content: center;
}

// 双行信息单元格
.cell-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.info-name {
  font-size: 0.2933rem; // 11px / 37.5
  color: #ffffff;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 1.547rem; // 58px / 37.5
}

.info-sub {
  font-size: 0.2133rem; // 8px / 37.5
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.2;
  white-space: nowrap;
}

// 金额颜色
.val-pos {
  color: #ff132b;
}

.val-neg {
  color: rgba(225, 238, 255, 0.65);
}

// 扑克牌
.cards-row {
  display: flex;
  gap: 0.0533rem; // 1.997px / 37.5
}

.mini-card {
  flex-shrink: 0;
  width: 0.3416rem; // 12.809px / 37.5
  height: 0.5123rem; // 19.211px / 37.5
  background: #ffffff;
  border-radius: 0.1867rem; // 7px / 37.5
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.0267rem 0.0267rem 0.04rem;

  &__rank {
    font-size: 0.1333rem; // 5px / 37.5
    font-weight: 700;
    line-height: 1;
    color: #000000;
  }

  &__suit {
    font-size: 0.1493rem; // ~5.6px
    line-height: 1;
    color: #000000;
    align-self: center;
  }

  &--red {
    .mini-card__rank,
    .mini-card__suit {
      color: #fa2b4b;
    }
  }
}
</style>

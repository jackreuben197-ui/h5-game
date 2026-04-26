<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => 'Data')

type MainTabKey = 'personal' | 'opponent' | 'allin' | 'deck'

type ProfitRow = {
  id: string
  name: string
  hands: number
  lose: number
  win: number
  profit: number
}

type DeckRow = {
  id: string
  cards: [string, string]
  winCount: number
  totalHands: number
  winRate: number
  profit: number
}

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const mainTabs: Array<{ key: MainTabKey; label: string }> = [
  { key: 'personal', label: '个人' },
  { key: 'opponent', label: '对手' },
  { key: 'allin', label: '全下' },
  { key: 'deck', label: '牌组' },
]

const personalGameTabs = ['德州', '奥马哈', '短牌']
const opponentPeriodTabs = ['本周', '本月', '历史']
const allInModeTabs = ['Texas', 'Omaha', '6+', 'AOF 6+', 'AOF Texas', 'AOF Omaha']
const deckModeTabs = ['Texas', 'Omaha', 'AOF', 'AOF']

const selectedMainTab = ref<MainTabKey>('personal')
const selectedPersonalGame = ref(personalGameTabs[0])
const selectedOpponentPeriod = ref(opponentPeriodTabs[0])
const selectedAllInMode = ref(allInModeTabs[0])
const selectedDeckMode = ref(deckModeTabs[0])

const personalRings = [
  { key: 'vpip', label: '入池率', value: 60, color: '#ff5b5b' },
  { key: 'win-rate', label: '胜率', value: 60, color: '#3c6dff' },
  { key: 'flop-raise', label: '翻牌加注率', value: 60, color: '#f7bb46' },
  { key: 'showdown', label: '摊牌率', value: 60, color: '#ff2626' },
  { key: 'wt-sd', label: '摊牌率', value: 60, color: '#66b7ff' },
  { key: 'rerise', label: '再加注率', value: 60, color: '#20f2c2' },
]

const opponentRows: ProfitRow[] = [
  { id: '1', name: 'name', hands: 20, lose: 25, win: 10, profit: 10000 },
  { id: '2', name: 'name', hands: 20, lose: 25, win: 10, profit: -10000 },
  { id: '3', name: 'name', hands: 20, lose: 25, win: 10, profit: -10000 },
  { id: '4', name: 'name', hands: 20, lose: 25, win: 10, profit: 10000 },
  { id: '5', name: 'name', hands: 20, lose: 25, win: 10, profit: -10000 },
]

const deckRows: DeckRow[] = [
  { id: '1', cards: ['10♣', 'J♦'], winCount: 20, totalHands: 25, winRate: 10, profit: -10000 },
  { id: '2', cards: ['10♣', 'J♦'], winCount: 20, totalHands: 25, winRate: 10, profit: 10000 },
  { id: '3', cards: ['10♣', 'J♦'], winCount: 20, totalHands: 25, winRate: 10, profit: 10000 },
  { id: '4', cards: ['10♣', 'J♦'], winCount: 20, totalHands: 25, winRate: 10, profit: 10000 },
  { id: '5', cards: ['10♣', 'J♦'], winCount: 20, totalHands: 25, winRate: 10, profit: 10000 },
  { id: '6', cards: ['10♣', 'J♦'], winCount: 20, totalHands: 25, winRate: 10, profit: 10000 },
  { id: '7', cards: ['10♣', 'J♦'], winCount: 20, totalHands: 25, winRate: 10, profit: 10000 },
  { id: '8', cards: ['10♣', 'J♦'], winCount: 20, totalHands: 25, winRate: 10, profit: -10000 },
]

const allInSummary = [
  { label: '累计盈利', value: '+98741', highlight: 'up' as const },
  { label: 'All in', value: '0' },
  { label: '手数', value: '0' },
  { label: '获胜', value: '0' },
  { label: '失利', value: '0' },
]

const personalHasData = computed(() => selectedPersonalGame.value !== '短牌')

function goBack(): void {
  void router.push('/mine/club-career')
}

function setMainTab(tab: MainTabKey): void {
  selectedMainTab.value = tab
}

function formatProfit(value: number): string {
  const absValue = Math.abs(value)
  return `${value >= 0 ? '+' : '-'}${absValue}`
}

function profitClass(value: number): string {
  return value >= 0 ? 'profit-up' : 'profit-down'
}
</script>

<template>
  <div class="club-data-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <div class="main-tabs">
        <button
          v-for="tab in mainTabs"
          :key="tab.key"
          type="button"
          class="main-tab"
          :class="{ active: selectedMainTab === tab.key }"
          @click="setMainTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <template v-if="selectedMainTab === 'personal'">
        <div class="segmented game-segmented">
          <button
            v-for="tab in personalGameTabs"
            :key="tab"
            type="button"
            class="segment"
            :class="{ active: selectedPersonalGame === tab }"
            @click="selectedPersonalGame = tab"
          >
            {{ tab }}
          </button>
        </div>

        <template v-if="personalHasData">
          <section class="ring-grid">
            <article
              v-for="ring in personalRings"
              :key="ring.key"
              class="ring-card"
              :style="{ '--ring-color': ring.color, '--ring-progress': ring.value + '%' }"
            >
              <div class="ring-donut">
                <div class="ring-inner">
                  <div class="ring-value">{{ ring.value }}%</div>
                  <div class="ring-label">{{ ring.label }}</div>
                </div>
              </div>
            </article>
          </section>

          <section class="glass-pill title-pill">
            <span>近3个月内玩牌数据统计</span>
            <span class="pie-icon" aria-hidden="true"></span>
          </section>

          <section class="glass-card biggest-card">
            <div class="biggest-title">Possible Biggest Hand</div>
            <div class="card-row">
              <div class="poker-card">A ♣</div>
              <div class="poker-card red">J ♥</div>
              <div class="poker-card">10 ◆</div>
              <div class="poker-card back"></div>
              <div class="poker-card back"></div>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="title-row">
            <div class="title-text">Statistics of the week</div>
            <button class="sort-btn" type="button">
              Descending
              <span class="arrow">▾</span>
            </button>
          </section>

          <section class="empty-wrap">
            <div class="empty-icon" aria-hidden="true">✕</div>
            <div class="empty-text">暂无数据</div>
          </section>
        </template>
      </template>

      <template v-else-if="selectedMainTab === 'opponent'">
        <div class="segmented period-segmented">
          <button
            v-for="tab in opponentPeriodTabs"
            :key="tab"
            type="button"
            class="segment"
            :class="{ active: selectedOpponentPeriod === tab }"
            @click="selectedOpponentPeriod = tab"
          >
            {{ tab }}
          </button>
        </div>

        <section class="title-row">
          <div class="title-text">Statistics of the week</div>
          <button class="sort-btn" type="button">
            Descending
            <span class="arrow">▾</span>
          </button>
        </section>

        <section class="glass-card table-card">
          <header class="table-head">
            <span>玩家</span>
            <span>手数</span>
            <span>负</span>
            <span>胜</span>
            <span>盈利</span>
          </header>

          <article v-for="row in opponentRows" :key="row.id" class="table-row">
            <div class="player-cell">
              <span class="avatar" aria-hidden="true"></span>
              <span class="name">{{ row.name }}</span>
            </div>
            <span>{{ row.hands }}</span>
            <span>{{ row.lose }}</span>
            <span>{{ row.win }}</span>
            <span :class="profitClass(row.profit)">{{ formatProfit(row.profit) }}</span>
          </article>
        </section>
      </template>

      <template v-else-if="selectedMainTab === 'allin'">
        <section class="glass-card allin-summary-card">
          <div class="allin-mode-grid">
            <button
              v-for="mode in allInModeTabs"
              :key="mode"
              type="button"
              class="mode-chip"
              :class="{ active: selectedAllInMode === mode }"
              @click="selectedAllInMode = mode"
            >
              {{ mode }}
            </button>
          </div>

          <div class="section-title">
            <span>近3个月内玩牌数据统计</span>
            <span class="pie-icon" aria-hidden="true"></span>
          </div>

          <div class="summary-list">
            <div v-for="item in allInSummary" :key="item.label" class="summary-row">
              <span>{{ item.label }}</span>
              <span :class="item.highlight === 'up' ? 'profit-up' : ''">{{ item.value }}</span>
            </div>
          </div>
        </section>

        <section class="glass-card radar-card">
          <div class="section-title">
            <span>ALL IN 胜率分布图</span>
            <span class="pie-icon" aria-hidden="true"></span>
          </div>

          <div class="radar-wrap">
            <div class="tag tag-top">rate<br />80%</div>
            <div class="tag tag-left">Passive<br />80%</div>
            <div class="tag tag-right">Backward<br />80%</div>
            <div class="tag tag-bottom">Leading<br />80%</div>
            <div class="radar-core">
              <div class="diamond d1"></div>
              <div class="diamond d2"></div>
              <div class="diamond d3"></div>
              <div class="diamond d4"></div>
              <div class="diamond fill"></div>
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="glass-card deck-tabs-card">
          <div class="deck-tab-grid">
            <button
              v-for="mode in deckModeTabs"
              :key="mode"
              type="button"
              class="mode-chip deck-mode-chip"
              :class="{ active: selectedDeckMode === mode }"
              @click="selectedDeckMode = mode"
            >
              {{ mode }}
            </button>
          </div>
        </section>

        <section class="deck-title">近三个月内玩牌数据统计</section>

        <section class="glass-card table-card deck-table-card">
          <header class="table-head deck-head">
            <span>hand type</span>
            <span>获胜</span>
            <span class="sortable-head">
              总手数
              <span class="sort-caret" aria-hidden="true"></span>
            </span>
            <span class="sortable-head">
              胜率
              <span class="sort-caret" aria-hidden="true"></span>
            </span>
            <span>盈利</span>
          </header>

          <article v-for="row in deckRows" :key="row.id" class="table-row deck-row">
            <div class="deck-hand-cell">
              <div class="mini-card">
                <span class="rank">{{ row.cards[0].slice(0, -1) }}</span>
                <span class="suit">{{ row.cards[0].slice(-1) }}</span>
              </div>
              <div class="mini-card red">
                <span class="rank">{{ row.cards[1].slice(0, -1) }}</span>
                <span class="suit">{{ row.cards[1].slice(-1) }}</span>
              </div>
            </div>
            <span>{{ row.winCount }}</span>
            <span>{{ row.totalHands }}</span>
            <span>{{ row.winRate }}</span>
            <span :class="profitClass(row.profit)">{{ formatProfit(row.profit) }}</span>
          </article>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-data-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.72rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.back-btn {
  width: 0.8rem;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
  text-align: left;
  padding: 0;
}

.head-spacer {
  width: 0.8rem;
}

.main-tabs {
  margin-top: 0.28rem;
  display: flex;
  justify-content: space-around;
}

.main-tab {
  border: 0;
  padding: 0.08rem 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.38rem;
  line-height: 1.1;

  &.active {
    color: #fff;
    font-weight: 600;
    border-bottom: 0.03rem solid rgba(249, 249, 249, 0.95);
  }
}

.segmented {
  margin-top: 0.34rem;
  border-radius: 0.56rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.06rem;
  display: grid;
  gap: 0.06rem;
}

.game-segmented,
.period-segmented {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.segment {
  border: 0;
  border-radius: 0.52rem;
  background: transparent;
  color: #f9f9f9;
  font-size: 0.42rem;
  padding: 0.2rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.16);
    border: 0.02rem solid rgba(249, 249, 249, 0.9);
    font-weight: 700;
  }
}

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.15);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.06rem);
}

.glass-pill {
  border-radius: 0.4rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.12);
  background: rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(0.06rem);
}

.ring-grid {
  margin-top: 0.3rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.3rem 0.34rem;
}

.ring-card {
  display: flex;
  justify-content: center;
}

.ring-donut {
  width: 1.92rem;
  height: 1.92rem;
  border-radius: 50%;
  padding: 0.12rem;
  background:
    conic-gradient(var(--ring-color) var(--ring-progress), rgba(255, 255, 255, 0.15) var(--ring-progress)),
    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 60%, rgba(0, 0, 0, 0.28) 100%);
  box-shadow: 0 0.06rem 0.18rem rgba(0, 0, 0, 0.2);
}

.ring-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(116, 90, 116, 0.56);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-value {
  font-size: 0.36rem;
  font-weight: 700;
  line-height: 1.1;
}

.ring-label {
  margin-top: 0.05rem;
  font-size: 0.18rem;
  line-height: 1.1;
  color: rgba(249, 249, 249, 0.86);
}

.title-pill {
  margin-top: 0.28rem;
  padding: 0.25rem 0.42rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.42rem;
  font-weight: 600;
}

.pie-icon {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  border: 0.04rem solid rgba(249, 249, 249, 0.95);
  border-right-color: transparent;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    width: 0.24rem;
    height: 0.04rem;
    background: rgba(249, 249, 249, 0.95);
    top: 0.18rem;
    right: -0.02rem;
    transform: rotate(-34deg);
    border-radius: 0.03rem;
  }
}

.biggest-card {
  margin-top: 0.24rem;
  padding: 0.3rem 0.35rem 0.36rem;
}

.biggest-title {
  text-align: center;
  font-size: 0.44rem;
  color: rgba(249, 249, 249, 0.72);
  font-weight: 600;
}

.card-row {
  margin-top: 0.24rem;
  display: flex;
  justify-content: center;
  gap: 0.08rem;
}

.poker-card {
  width: 0.76rem;
  height: 1.1rem;
  border-radius: 0.12rem;
  background: #fff;
  color: #1a1a1a;
  font-size: 0.28rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;

  &.red {
    color: #fa2b4b;
  }

  &.back {
    background:
      repeating-linear-gradient(45deg, #30b6ff 0, #30b6ff 0.08rem, #2f86e7 0.08rem, #2f86e7 0.16rem);
    border: 0.02rem solid rgba(249, 249, 249, 0.28);
    box-shadow: inset 0 0 0 0.02rem rgba(255, 255, 255, 0.24);
  }
}

.title-row {
  margin-top: 0.46rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-text {
  font-size: 0.46rem;
  font-weight: 500;
}

.sort-btn {
  border: 0;
  border-radius: 0.4rem;
  background: rgba(0, 0, 0, 0.46);
  color: #fff;
  font-size: 0.33rem;
  padding: 0.12rem 0.24rem;
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;

  .arrow {
    font-size: 0.24rem;
    line-height: 1;
  }
}

.empty-wrap {
  margin-top: 3.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  width: 0.98rem;
  height: 1.08rem;
  border: 0.1rem solid rgba(249, 249, 249, 0.65);
  border-radius: 0.24rem;
  clip-path: polygon(50% 0, 100% 18%, 100% 80%, 50% 100%, 0 80%, 0 18%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(249, 249, 249, 0.75);
  font-size: 0.42rem;
  line-height: 1;
}

.empty-text {
  margin-top: 0.18rem;
  font-size: 0.42rem;
  color: rgba(249, 249, 249, 0.9);
}

.table-card {
  margin-top: 0.22rem;
  padding: 0.2rem 0.22rem 0.12rem;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1.55fr repeat(4, 1fr);
  align-items: center;
}

.table-head {
  border-radius: 0.46rem;
  background: rgba(255, 255, 255, 0.2);
  min-height: 0.9rem;
  padding: 0 0.2rem;
  font-size: 0.28rem;
  font-weight: 600;
}

.table-row {
  min-height: 1.05rem;
  padding: 0 0.2rem;
  font-size: 0.32rem;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.11);

  &:last-child {
    border-bottom: 0;
  }
}

.player-cell {
  display: flex;
  align-items: center;
  gap: 0.12rem;
}

.avatar {
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 28%, #ffd8b6 0%, #c88145 42%, #5e3a26 100%);
  border: 0.02rem solid rgba(249, 249, 249, 0.34);
}

.name {
  font-size: 0.31rem;
}

.profit-up {
  color: #ff2748;
  font-weight: 600;
}

.profit-down {
  color: #05e7ae;
  font-weight: 600;
}

.allin-summary-card {
  margin-top: 0.34rem;
  padding: 0.28rem 0.28rem 0.24rem;
}

.allin-mode-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.12rem;
}

.mode-chip {
  border: 0;
  border-radius: 0.38rem;
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 0.34rem;
  min-height: 0.78rem;

  &.active {
    background: rgba(5, 231, 174, 0.6);
    font-weight: 600;
  }
}

.section-title {
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.4rem;
  font-weight: 600;
}

.summary-list {
  margin-top: 0.2rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 0.7rem;
  font-size: 0.42rem;
}

.radar-card {
  margin-top: 0.28rem;
  padding: 0.28rem;
}

.radar-wrap {
  margin-top: 0.14rem;
  height: 4.7rem;
  position: relative;
}

.tag {
  position: absolute;
  min-width: 1.28rem;
  padding: 0.08rem 0.18rem;
  border-radius: 0.24rem;
  border: 0.03rem solid rgba(249, 249, 249, 0.95);
  text-align: center;
  font-size: 0.34rem;
  font-weight: 700;
  line-height: 1.14;
  color: #fff;
}

.tag-top {
  left: 50%;
  top: 0.15rem;
  transform: translateX(-50%);
  background: #50a7ec;
}

.tag-left {
  left: 0.1rem;
  top: 1.45rem;
  background: #fa2b4b;
}

.tag-right {
  right: 0.1rem;
  top: 1.45rem;
  background: #b519d8;
}

.tag-bottom {
  left: 50%;
  bottom: 0.16rem;
  transform: translateX(-50%);
  background: #109657;
}

.radar-core {
  position: absolute;
  left: 50%;
  top: 2.42rem;
  width: 2.8rem;
  height: 2.8rem;
  transform: translate(-50%, -50%);
}

.diamond {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 0.02rem solid rgba(249, 249, 249, 0.34);
  transform: translate(-50%, -50%) rotate(45deg);
}

.d1 {
  width: 2.6rem;
  height: 2.6rem;
}

.d2 {
  width: 2rem;
  height: 2rem;
}

.d3 {
  width: 1.46rem;
  height: 1.46rem;
}

.d4 {
  width: 0.9rem;
  height: 0.9rem;
}

.fill {
  width: 1.55rem;
  height: 1.2rem;
  border: 0;
  background: rgba(249, 249, 249, 0.18);
}

.deck-tabs-card {
  margin-top: 0.34rem;
  border-radius: 0.67rem;
  padding: 0.38rem 0.32rem;
}

.deck-tab-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.14rem;
}

.deck-mode-chip {
  height: 0.78rem;
  border-radius: 0.58rem;
  font-size: 0.34rem;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.19);

  &.active {
    background: rgba(5, 231, 174, 0.6);
    color: #fff;
    font-weight: 600;
  }
}

.deck-title {
  margin-top: 0.28rem;
  font-size: 0.34rem;
  line-height: 1.2;
  font-weight: 500;
}

.deck-table-card {
  margin-top: 0.24rem;
  border-radius: 0.67rem;
  padding: 0.36rem 0.36rem 0.24rem;
  max-height: 9.15rem;
  overflow: auto;
}

.deck-head,
.deck-row {
  grid-template-columns: 1.85fr 0.8fr 1fr 0.8fr 1fr;
}

.deck-head {
  min-height: 0.96rem;
  border-radius: 0.72rem;
  font-size: 0.3rem;
  padding: 0 0.24rem;
}

.deck-row {
  min-height: 1rem;
  padding: 0 0.24rem;
  border-bottom: 0.01rem solid rgba(249, 249, 249, 0.2);
  font-size: 0.28rem;

  &:last-child {
    border-bottom: 0;
  }
}

.sortable-head {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;
}

.sort-caret {
  width: 0;
  height: 0;
  border-left: 0.06rem solid transparent;
  border-right: 0.06rem solid transparent;
  border-top: 0.1rem solid rgba(249, 249, 249, 0.92);
}

.deck-hand-cell {
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.mini-card {
  width: 0.62rem;
  height: 0.9rem;
  border-radius: 0.1rem;
  border: 0.01rem solid rgba(20, 44, 69, 0.28);
  box-shadow: inset 0 0 0 0.01rem rgba(255, 255, 255, 0.35);
  background: linear-gradient(170deg, #ffffff 0%, #f1f6ff 100%);
  color: #111;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0.04rem 0.06rem;

  .rank {
    font-size: 0.17rem;
    line-height: 1;
    font-weight: 700;
  }

  .suit {
    margin-top: 0.03rem;
    font-size: 0.15rem;
    line-height: 1;
    font-weight: 700;
  }

  &.red {
    color: #fa2b4b;
  }
}

@media (max-width: 360px) {
  .club-data-page {
    padding-left: 0.34rem;
    padding-right: 0.34rem;
  }

  .ring-donut {
    width: 1.78rem;
    height: 1.78rem;
  }

  .ring-label {
    font-size: 0.16rem;
  }
}
</style>

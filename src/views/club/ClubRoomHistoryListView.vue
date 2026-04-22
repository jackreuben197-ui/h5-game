<script setup lang="ts">
import { useRouter } from 'vue-router'

interface IncomeItem {
  label: string
  value: string
  positive: boolean
}

interface RoomHistoryItem {
  id: number
  mode: string
  title: string
  detailA: string
  detailB?: string
  startedAt: string
  hasSquidLogo?: boolean
  incomes: IncomeItem[]
}

const router = useRouter()

const imgImage12 = 'https://www.figma.com/api/mcp/asset/3647e32e-8c05-4ee3-8184-1e9d5a4eb5e7'
const imgImage13 = 'https://www.figma.com/api/mcp/asset/21757333-7a5e-423d-b7f7-df8009bef12e'
const imgSquidLogo = 'https://www.figma.com/api/mcp/asset/c042856c-0a68-438e-9b1b-8ec2a651fe7f'
const imgCalendar = 'https://www.figma.com/api/mcp/asset/f6d38ab4-2f1f-4bf9-8a7b-ca6f25663280'
const imgArrow = 'https://www.figma.com/api/mcp/asset/b09b6244-bba5-44ae-a2eb-30c056715078'
const imgClock = 'https://www.figma.com/api/mcp/asset/bce8d82d-1869-4899-9bf5-da22da334f54'

const historyList: RoomHistoryItem[] = [
  {
    id: 1,
    mode: 'NLH',
    title: '局抽数据-3',
    detailA: '参赛人数: 100',
    startedAt: '08/02/2026 07:50',
    incomes: [
      { label: '服务费', value: '+666', positive: true },
      { label: '保险', value: '-666', positive: false },
    ],
  },
  {
    id: 2,
    mode: 'NLH',
    title: '局抽数据-3',
    detailA: '参赛人数: 100',
    startedAt: '08/02/2026 07:50',
    hasSquidLogo: true,
    incomes: [{ label: '服务费', value: '-666', positive: false }],
  },
  {
    id: 3,
    mode: '6+',
    title: '局抽数据-3',
    detailA: '盲注: 1/2',
    detailB: 'Jackpot: 12345',
    startedAt: '08/02/2026 07:50',
    incomes: [{ label: '服务费', value: '-666', positive: false }],
  },
  {
    id: 4,
    mode: 'PLO',
    title: '局抽数据-3',
    detailA: '盲注: 1/2',
    detailB: 'Jackpot: 12345',
    startedAt: '08/02/2026 07:50',
    incomes: [
      { label: '服务费', value: '+666', positive: true },
      { label: '保险', value: '-666', positive: false },
    ],
  },
  {
    id: 5,
    mode: '血战到底',
    title: '局抽数据-3',
    detailA: '底分: 2',
    startedAt: '08/02/2026 07:50',
    incomes: [{ label: '服务费', value: '+666', positive: true }],
  },
  {
    id: 6,
    mode: '血流成河',
    title: '局抽数据-3',
    detailA: '底分: 2',
    startedAt: '08/02/2026 07:50',
    incomes: [{ label: '服务费', value: '-666', positive: false }],
  },
  {
    id: 7,
    mode: '推倒胡',
    title: '局抽数据-3',
    detailA: '底分: 2',
    startedAt: '08/02/2026 07:50',
    incomes: [{ label: '服务费', value: '-666', positive: false }],
  },
  {
    id: 8,
    mode: 'Cowboy',
    title: '局抽数据-3',
    detailA: '最低下注: 999',
    startedAt: '08/02/2026 07:50',
    incomes: [{ label: '收益', value: '+666', positive: true }],
  },
]

function backToClub(): void {
  void router.push('/club/detail')
}
function toDetail(): void {
  void router.push('/club/room/history/detail')
}
</script>

<template>
  <div class="club-room-history-bg">
    <img class="bg-image bg-image--large" :src="imgImage12" alt="" />
    <img class="bg-image bg-image--overlay" :src="imgImage13" alt="" />
    <div class="glow glow--pink" />
    <div class="glow glow--blue" />

    <div class="page-shell club-room-history">
      <VanNavBar title="牌局记录" left-arrow @click-left="backToClub" />

      <div class="coin-tabs">
        <button type="button" class="coin-tab coin-tab--active">联盟币</button>
        <button type="button" class="coin-tab">授信额度</button>
      </div>
      <section class="summary-card">
        <div class="date-range">
          <button type="button" class="date-btn">
            <img class="icon-xs" :src="imgCalendar" alt="" />
            <span>11/03/2024</span>
          </button>
          <span class="date-sep" />
          <button type="button" class="date-btn">
            <img class="icon-xs" :src="imgCalendar" alt="" />
            <span>11/03/2024</span>
          </button>
        </div>

        <div class="stats-row">
          <div class="stats-item">
            <span class="stats-label">总收益</span>
            <strong class="stats-value">0.15</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">手数/局数</span>
            <strong class="stats-value">7/1</strong>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stats-item">
            <span class="stats-label">服务费</span>
            <strong class="stats-value">0.15</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">JackPot</span>
            <strong class="stats-value">0</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">保险</span>
            <strong class="stats-value">0</strong>
          </div>
          <div class="stats-item">
            <span class="stats-label">小游戏</span>
            <strong class="stats-value">0</strong>
          </div>
        </div>
      </section>
      <p class="timezone">时区: UTC+0</p>

      <section class="history-list">
        <article v-for="item in historyList" :key="item.id" class="history-card">
          <div class="mode-oval">
            <div class="mode-badge">{{ item.mode }}</div>
          </div>
          <div class="base-blur-20" />

          <div class="history-main">
            <div class="history-left">
              <div class="title-line">
                <div class="title-with-logo">
                  <h3 class="history-title">{{ item.title }}</h3>
                  <img v-if="item.hasSquidLogo" class="squid-logo" :src="imgSquidLogo" alt="" />
                </div>
              </div>

              <div class="meta-line">
                <span>{{ item.detailA }}</span>
                <span v-if="item.detailB">{{ item.detailB }}</span>
              </div>

              <p class="time-line">
                <img class="icon-xs" :src="imgClock" alt="" />
                <span>{{ item.startedAt }}</span>
              </p>
            </div>

            <div class="income-list">
              <div
                v-for="income in item.incomes"
                :key="`${item.id}-${income.label}`"
                class="income-row"
              >
                <span class="income-label">{{ income.label }}</span>
                <span class="income-value" :class="income.positive ? 'is-positive' : 'is-negative'">
                  {{ income.value }}
                </span>
              </div>
            </div>
          </div>

          <img class="card-arrow" :src="imgArrow" alt="" @click="toDetail" />
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
body {
  position: relative;
  overflow: auto;
}
.club-room-history-bg {
  position: relative;
  min-height: 100dvh;
  background:
    radial-gradient(
      120% 70% at 50% -10%,
      rgba(91, 18, 115, 0.72),
      rgba(18, 11, 47, 0.86) 45%,
      #0a0f2f 85%
    ),
    linear-gradient(180deg, #120a33, #090d2a);
  // overflow: hidden;
}

.bg-image {
  position: absolute;
  pointer-events: none;
  user-select: none;
}

.bg-image--large {
  width: 44.72rem;
  height: 97.5rem;
  left: -32.2rem;
  top: -11rem;
  opacity: 0.44;
  object-fit: cover;
}

.bg-image--overlay {
  width: 14rem;
  height: 30.5rem;
  left: -1.2rem;
  top: -0.2rem;
  opacity: 0.62;
  object-fit: cover;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(1.2rem);
  opacity: 0.65;
  pointer-events: none;
}

.glow--pink {
  width: 6rem;
  height: 6rem;
  top: -2rem;
  right: -1.4rem;
  background: rgba(210, 45, 168, 0.56);
}

.glow--blue {
  width: 5.4rem;
  height: 5.4rem;
  left: -1.8rem;
  top: 9rem;
  background: rgba(60, 102, 255, 0.52);
}

.club-room-history {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}

:deep(.van-nav-bar) {
  background: transparent;
}

:deep(.van-nav-bar__title) {
  color: #fff;
  font-size: 0.44rem;
}

:deep(.van-icon-arrow-left) {
  color: #fff;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  padding: 0.36rem 0.44rem;
  border-radius: 0.76rem;
  background: rgba(0, 0, 0, 0.2);
  border: 0.02rem solid rgba(243, 243, 243, 0.1);
  box-shadow: inset 0 0 0.01rem rgba(255, 255, 255, 0.2);
}

.coin-tabs {
  display: flex;
  justify-content: center;
  gap: 0.38rem;
}

.coin-tab {
  border: 0;
  background: transparent;
  color: rgba(235, 245, 255, 0.7);
  font-size: 0.34rem;
  line-height: 1.2;
  padding: 0;
}

.coin-tab--active {
  color: #fff;
  padding-bottom: 0.08rem;
  border-bottom: 0.02rem solid rgba(255, 255, 255, 0.9);
}

.date-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
}

.date-btn {
  min-width: 3.22rem;
  min-height: 1.36rem;
  border-radius: 1.06rem;
  border: 0;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(243, 243, 243, 0.96);
  font-size: 0.32rem;
  line-height: 0.42rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
}

.icon-xs {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
}

.date-sep {
  width: 0.32rem;
  height: 0.02rem;
  border-radius: 999px;
  background: rgba(243, 243, 243, 0.55);
}

.stats-row,
.stats-grid {
  display: grid;
  gap: 0;
}

.stats-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  max-width: 4.74rem;
  margin: 0 auto;
}

.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding-top: 0.24rem;
  border-top: 0.02rem solid rgba(243, 243, 243, 0.28);
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;
  text-align: center;
}

.stats-row .stats-item {
  padding: 0 0.2rem;
}

.stats-grid .stats-item {
  padding: 0 0.06rem;
}

.stats-row .stats-item + .stats-item,
.stats-grid .stats-item + .stats-item {
  border-left: 0.02rem solid rgba(243, 243, 243, 0.18);
}

.stats-label {
  font-size: 0.34rem;
  line-height: 1.4;
  color: rgba(243, 243, 243, 0.9);
}

.stats-value {
  font-size: 0.54rem;
  font-weight: 400;
  line-height: 1;
  color: rgba(243, 243, 243, 1);
}

.timezone {
  margin: 0.22rem 0 0;
  text-align: right;
  color: rgba(235, 245, 255, 0.7);
  font-size: 0.26rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-bottom: 0.26rem;
}

.history-card {
  position: relative;
  border-radius: 0.46rem;
  overflow: visible;
  border: 0.02rem solid rgba(255, 255, 255, 0.24);
  background:
    radial-gradient(95% 120% at -5% -10%, rgba(250, 255, 255, 0.28), rgba(255, 255, 255, 0.04) 52%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.08));
  backdrop-filter: blur(0.25rem);
  box-shadow: 0 0.2rem 0.6rem rgba(6, 10, 28, 0.32);
  min-height: 1.752rem;
  backdrop-filter: blur(51.23px);
  border-radius: 158.36px;
}

.mode-oval {
  position: absolute;
  left: -0.24rem;
  top: 50%;
  width: 1.64rem;
  height: 1.64rem;
  transform: translateY(-50%);
  border-radius: 50%;
  border: 0.02rem solid rgba(255, 255, 255, 0.55);
  background: linear-gradient(130deg, rgba(28, 11, 69, 0.82), rgba(61, 35, 113, 0.56));
  box-shadow: inset 0 0.06rem 0.18rem rgba(255, 255, 255, 0.1);
}

.mode-badge {
  position: absolute;
  left: 0rem;
  top: 50%;
  width: 1.6rem;
  height: 1.6rem;
  transform: translateY(-50%);
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 0.02rem solid rgba(255, 255, 255, 0.62);
  background: linear-gradient(145deg, rgba(253, 246, 255, 0.3), rgba(255, 255, 255, 0.08));
  font-size: 0.3rem;
  line-height: 1.05;
  text-align: center;
  padding: 0 0.06rem;
  color: #fff;
  z-index: 2;
}
.base-blur-20 {
  position: absolute;
  height: calc(100% + 0.1px);
  width: calc(100% + 0.1px);
  top: 0rem;
  right: -0.006rem;
  bottom: -0.006rem;
  left: 0rem;
  backdrop-filter: blur(51.23px);
  border-radius: 158.36px;
  background-color: rgba(157, 18, 124, 0.59);
  z-index: -1;
}

.history-main {
  margin-left: 1.9rem;
  padding: 0.32rem 0.38rem 0.3rem 0.16rem;
}

.history-left {
  width: 70%;
  float: left;
}

.title-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.24rem;
}

.title-with-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
}

.squid-logo {
  width: 0.32rem;
  height: 0.4rem;
  object-fit: contain;
}

.history-title {
  margin: 0;
  color: #fff;
  font-size: 0.34rem;
  line-height: 1.2;
}

.income-list {
  position: absolute;
  border-radius: 0.16rem;
  background: rgba(9, 11, 22, 0.28);
  padding: 0.12rem 0.16rem;
  float: right;
  right: -3%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 25%;
}

.income-row {
  min-width: 1.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.12rem;
}

.income-row + .income-row {
  margin-top: 0.06rem;
}

.income-label {
  font-size: 0.26rem;
  color: rgba(255, 255, 255, 0.92);
}

.income-value {
  font-size: 0.27rem;
  font-weight: 600;
}

.is-positive {
  color: #ff5b73;
}

.is-negative {
  color: #05e7ae;
}

.meta-line {
  margin-top: 0.16rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.16rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.25rem;
}

.time-line {
  margin: 0.12rem 0 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.24rem;
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.card-arrow {
  position: absolute;
  right: 0.36rem;
  top: 50%;
  width: 0.34rem;
  height: 0.34rem;
  transform: translateY(-50%) scaleX(-1);
  object-fit: contain;
  opacity: 0.95;
}

@media (max-width: 340px) {
  .date-btn {
    min-width: 2.86rem;
  }

  .income-row {
    min-width: 1.7rem;
  }
}
</style>

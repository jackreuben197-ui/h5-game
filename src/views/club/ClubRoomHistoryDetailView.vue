<script setup lang="ts">
import { useRouter } from 'vue-router'

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
}

const router = useRouter()

const imgImage11 = 'https://www.figma.com/api/mcp/asset/1e8698a9-6c7e-4bdd-8b98-dc5f472aca35'
const imgImage12 = 'https://www.figma.com/api/mcp/asset/3834c952-ecb2-459c-974a-fc9d81434b1f'
const imgAvatar = 'https://www.figma.com/api/mcp/asset/c1d3a438-ee2a-41b1-8720-7f1e986a055b'

const topMetrics: SummaryMetric[] = [
  { label: '买入', value: '123~456' },
  { label: '底分', value: '1/2' },
  { label: '服务费', value: '12%' },
]

const middleMetrics: SummaryMetric[] = [
  { label: '总人数', value: '123' },
  { label: '保险', value: '12345' },
  { label: '总服务费', value: '123' },
]

const tableHeaders = ['User', '赢', '服务费', '保险', '买入', '手数', 'JP']

const records: PlayerRecord[] = [
  {
    id: 1,
    name: '备注',
    userId: '11440454',
    win: '+123',
    fee: '+1234',
    insurance: '+99999',
    buyIn: '999999',
    hands: '12345',
    jp: '+123',
  },
  {
    id: 2,
    name: '备注',
    userId: '11440454',
    win: '+123',
    fee: '+1234',
    insurance: '+99999',
    buyIn: '999999',
    hands: '12345',
    jp: '+123',
  },
  {
    id: 3,
    name: '备注',
    userId: '11440454',
    win: '+123',
    fee: '+1234',
    insurance: '+99999',
    buyIn: '999999',
    hands: '12345',
    jp: '+123',
  },
  {
    id: 4,
    name: '备注',
    userId: '11440454',
    win: '+123',
    fee: '+1234',
    insurance: '+99999',
    buyIn: '999999',
    hands: '12345',
    jp: '+123',
  },
  {
    id: 5,
    name: '备注',
    userId: '11440454',
    win: '+123',
    fee: '+1234',
    insurance: '+99999',
    buyIn: '999999',
    hands: '12345',
    jp: '+123',
  },
  {
    id: 6,
    name: '备注',
    userId: '11440454',
    win: '+123',
    fee: '+1234',
    insurance: '+99999',
    buyIn: '999999',
    hands: '12345',
    jp: '+123',
  },
  {
    id: 7,
    name: '备注',
    userId: '11440454',
    win: '+123',
    fee: '+1234',
    insurance: '+99999',
    buyIn: '999999',
    hands: '12345',
    jp: '+123',
  },
  {
    id: 8,
    name: '备注',
    userId: '11440454',
    win: '+99999',
    fee: '+99999',
    insurance: '+99999',
    buyIn: '999999',
    hands: '999999',
    jp: '+99999',
  },
]

function backToHistory(): void {
  void router.push('/club/room/history')
}
</script>

<template>
  <div class="club-room-history-detail-bg">
    <img class="bg-image bg-image--base" :src="imgImage11" alt="" />
    <img class="bg-image bg-image--overlay" :src="imgImage12" alt="" />
    <div class="fx-glow fx-glow--pink" />
    <div class="fx-glow fx-glow--cyan" />

    <div class="page-shell club-room-history-detail">
      <VanNavBar title="数据详情" left-arrow @click-left="backToHistory" />

      <section class="meta-panel">
        <div class="meta-title-row">
          <span class="meta-title">完成的</span>
          <strong class="meta-main-value">12345</strong>
        </div>

        <div class="meta-sub-row">
          <div class="creator-wrap">
            <span class="meta-sub-label">创作者</span>
            <span class="meta-sub-value">Charlie</span>
            <div class="id-pill-wrap">
              <span class="id-pill">ID</span>
              <span class="id-number">12345678</span>
            </div>
          </div>

          <div class="id-pill-wrap">
            <span class="id-pill">ID</span>
            <span class="id-number">12345678</span>
          </div>
        </div>
      </section>

      <section class="summary-card">
        <div class="summary-row summary-row--three">
          <div
            v-for="metric in topMetrics"
            :key="metric.label"
            class="metric-item metric-item--with-divider"
          >
            <span class="metric-label">{{ metric.label }}</span>
            <span class="metric-value">{{ metric.value }}</span>
          </div>
        </div>

        <div class="summary-divider" />

        <div class="summary-row summary-row--three">
          <div
            v-for="metric in middleMetrics"
            :key="metric.label"
            class="metric-item metric-item--with-divider"
          >
            <span class="metric-label">{{ metric.label }}</span>
            <span class="metric-value">{{ metric.value }}</span>
          </div>
        </div>

        <div class="summary-divider" />

        <div class="summary-row summary-row--single">
          <div class="metric-item">
            <span class="metric-label">Jackpot</span>
            <span class="metric-value">123456</span>
          </div>
        </div>
      </section>

      <section class="record-board">
        <div class="board-head-wrap">
          <div class="board-head-strip" />
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
              <img class="user-avatar" :src="imgAvatar" alt="" />
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
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-room-history-detail-bg {
  position: relative;
  min-height: 100dvh;
  background:
    radial-gradient(
      120% 82% at 50% -8%,
      rgba(201, 77, 114, 0.5),
      rgba(38, 45, 99, 0.64) 55%,
      #12284e 88%
    ),
    linear-gradient(180deg, #af6680 0%, #34779f 86%);
  overflow: hidden;
}

.bg-image {
  position: absolute;
  pointer-events: none;
  user-select: none;
}

.bg-image--base {
  width: 100%;
  height: 100%;
  inset: 0;
  object-fit: cover;
  opacity: 0.46;
}

.bg-image--overlay {
  width: 5.4rem;
  height: 11.8rem;
  top: -0.28rem;
  left: -1.1rem;
  object-fit: cover;
  opacity: 0.55;
}

.fx-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(0.8rem);
  pointer-events: none;
}

.fx-glow--pink {
  width: 2.4rem;
  height: 2.4rem;
  top: 5.2rem;
  left: -0.9rem;
  background: rgba(228, 109, 165, 0.42);
}

.fx-glow--cyan {
  width: 2.7rem;
  height: 2.7rem;
  right: -0.9rem;
  bottom: 2rem;
  background: rgba(55, 190, 255, 0.4);
}

.club-room-history-detail {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

:deep(.van-nav-bar) {
  background: transparent;
}

:deep(.van-nav-bar__title) {
  color: #fff;
  font-size: 0.48rem;
  font-weight: 500;
}

:deep(.van-icon-arrow-left) {
  color: #fff;
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
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  border-radius: 0.6rem;
  padding: 0.34rem 0.3rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0.02rem rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(0.32rem);
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
  background: rgba(249, 249, 249, 0.24);
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
}

.board-head {
  position: relative;
  min-height: 0.62rem;
  border-radius: 999px;
  padding: 0 0.18rem;
  background: rgba(255, 255, 255, 0.12);
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
}

.user-id {
  margin-top: 0.02rem;
  font-size: 0.14rem;
  color: rgba(255, 255, 255, 0.54);
}

.value-cell {
  text-align: center;
  font-size: 0.22rem;
  color: rgba(249, 249, 249, 0.94);
  white-space: nowrap;
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

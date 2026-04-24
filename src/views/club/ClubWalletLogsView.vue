<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const dateStart = '11/03/2024'
const dateEnd = '11/03/2024'

const summaryCards = [
  [
    { label: '联盟回收', value: '+999999', trend: 'up' },
    { label: '回收联盟币', value: '0', trend: 'neutral' },
    { label: '联盟发放', value: '-999999', trend: 'down' },
    { label: '发放联盟币', value: '+999999', trend: 'up' },
  ],
  [
    { label: '服务费', value: '+999999', trend: 'up' },
    { label: '保险盈', value: '-999999', trend: 'down' },
    { label: 'MTT收益', value: '-999999', trend: 'down' },
  ],
] as const

function goBack(): void {
  void router.push('/club/members')
}

function valueClass(trend: 'up' | 'down' | 'neutral'): string {
  if (trend === 'down') {
    return 'metric-value--down'
  }

  if (trend === 'neutral') {
    return 'metric-value--neutral'
  }

  return 'metric-value--up'
}
</script>

<template>
  <div class="club-wallet-logs-bg">
    <div class="bg-blur bg-blur--pink" aria-hidden="true" />
    <div class="bg-blur bg-blur--cyan" aria-hidden="true" />

    <div class="page-shell club-wallet-logs">
      <header class="top-bar">
        <button type="button" class="back-btn" @click="goBack">
          <span class="back-icon" aria-hidden="true" />
          <span class="back-title">收益管理</span>
        </button>
      </header>

      <section class="range-card">
        <div class="date-row">
          <button type="button" class="date-pill">
            <span class="calendar-icon" aria-hidden="true" />
            <span>{{ dateStart }}</span>
          </button>
          <span class="range-divider" aria-hidden="true" />
          <button type="button" class="date-pill">
            <span class="calendar-icon" aria-hidden="true" />
            <span>{{ dateEnd }}</span>
          </button>
        </div>

        <div class="balance-row">
          <div class="balance-col">
            <p class="balance-label">初始基金余额</p>
            <p class="balance-value">123456</p>
          </div>
          <span class="balance-split" aria-hidden="true" />
          <div class="balance-col">
            <p class="balance-label">实时基金余额</p>
            <p class="balance-value">123456</p>
          </div>
        </div>
      </section>

      <p class="timezone">时区：UTC+0</p>

      <section class="metrics-wrap">
        <article v-for="(group, groupIndex) in summaryCards" :key="groupIndex" class="metrics-card">
          <div
            v-for="(item, itemIndex) in group"
            :key="item.label"
            class="metric-item"
            :class="{ 'metric-item--with-divider': itemIndex < group.length - 1 }"
          >
            <p class="metric-label">{{ item.label }}</p>
            <p class="metric-value" :class="valueClass(item.trend)">{{ item.value }}</p>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-wallet-logs-bg {
  position: relative;
  min-height: 100dvh;
  background:
    radial-gradient(145% 88% at 46% -8%, rgba(219, 155, 140, 0.66), rgba(154, 97, 145, 0.64) 45%, rgba(33, 136, 168, 0.84) 100%),
    linear-gradient(180deg, #ba8d82 0%, #35a6c6 100%);
  overflow: hidden;
}

.bg-blur {
  position: absolute;
  border-radius: 999px;
  filter: blur(1rem);
  opacity: 0.5;
  pointer-events: none;
}

.bg-blur--pink {
  width: 3rem;
  height: 3rem;
  top: 4.1rem;
  left: -1rem;
  background: rgba(221, 50, 131, 0.48);
}

.bg-blur--cyan {
  width: 3.2rem;
  height: 3.2rem;
  right: -1.2rem;
  bottom: 1.1rem;
  background: rgba(45, 214, 255, 0.55);
}

.club-wallet-logs {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
  padding-bottom: calc(0.2rem + env(safe-area-inset-bottom));
  gap: 0.08rem;
}

.top-bar {
  min-height: 0.7rem;
  display: flex;
  align-items: center;
	padding-left: 0.32rem;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #f9f9f9;
  display: inline-flex;
  align-items: center;
  gap: 0.16rem;
  padding: 0;
}

.back-icon {
  width: 0.18rem;
  height: 0.18rem;
  border-left: 0.03rem solid rgba(249, 249, 249, 0.95);
  border-bottom: 0.03rem solid rgba(249, 249, 249, 0.95);
  transform: rotate(45deg);
}

.back-title {
  font-size: 0.52rem;
  line-height: 1;
  font-weight: 500;
}

.range-card {
  border-radius: 0.44rem;
  padding: 0.18rem 0.2rem;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.16rem);
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.date-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.14rem;
}

.date-pill {
  min-width: 2.26rem;
  min-height: 0.82rem;
  border: 0.01rem solid rgba(255, 255, 255, 0.26);
  border-radius: 0.42rem;
  background: rgba(255, 255, 255, 0.14);
  color: #f3f3f3;
  font-size: 0.31rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
}

.range-divider {
  width: 0.25rem;
  height: 0.03rem;
  border-radius: 999px;
  background: rgba(249, 249, 249, 0.72);
}

.calendar-icon {
  width: 0.2rem;
  height: 0.2rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.9);
  border-radius: 0.05rem;
  position: relative;
}

.calendar-icon::before,
.calendar-icon::after {
  content: '';
  position: absolute;
  top: -0.05rem;
  width: 0.03rem;
  height: 0.05rem;
  border-radius: 999px;
  background: rgba(249, 249, 249, 0.9);
}

.calendar-icon::before {
  left: 0.03rem;
}

.calendar-icon::after {
  right: 0.03rem;
}

.balance-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.08rem;
}

.balance-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.04rem;
}

.balance-label {
  margin: 0;
  font-size: 0.27rem;
  line-height: 1.3;
  color: #f3f3f3;
}

.balance-value {
  margin: 0;
  font-size: 0.53rem;
  line-height: 1;
  color: #f9f9f9;
  font-weight: 500;
}

.balance-split {
  width: 0.01rem;
  height: 0.54rem;
  background: rgba(255, 255, 255, 0.24);
}

.timezone {
  margin: 0;
  align-self: flex-end;
  color: rgba(249, 249, 249, 0.52);
  font-size: 0.22rem;
  line-height: 1;
  padding-right: 0.02rem;
}

.metrics-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.metrics-card {
  border-radius: 0.42rem;
  padding: 0.16rem 0.12rem;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.16rem);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.03rem;
  min-height: 0.82rem;
}

.metric-item--with-divider {
  border-right: 0.01rem solid rgba(255, 255, 255, 0.18);
}

.metric-label {
  margin: 0;
  font-size: 0.24rem;
  line-height: 1.2;
  color: #f9f9f9;
}

.metric-value {
  margin: 0;
  font-size: 0.35rem;
  line-height: 1;
  font-weight: 700;
}

.metric-value--up {
  color: #ff5364;
}

.metric-value--down {
  color: #05e7ae;
}

.metric-value--neutral {
  color: #f9f9f9;
}

@media (max-width: 340px) {
  .back-title {
    font-size: 0.43rem;
  }

  .date-pill {
    min-width: 2.04rem;
    font-size: 0.27rem;
  }

  .balance-value {
    font-size: 0.43rem;
  }

  .metric-label {
    font-size: 0.21rem;
  }

  .metric-value {
    font-size: 0.29rem;
  }
}
</style>

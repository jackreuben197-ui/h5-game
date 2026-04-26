<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import iconDiamond from '@/assets/icons/icon_diamond.png'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => '我的账单')

const tabs = ['UC', 'Club记分牌', '朋友桌记分牌', '钻石']
const activeTab = ref(tabs[0])

interface DayItem {
  day: string
  month: string
}

interface FlowItem {
  id: string
  title: string
  club: string
  inAmount: string
  outAmount: string
  records: Array<{ name: string; time: string; amount: string; positive?: boolean }>
}

const dayList: DayItem[] = [
  { day: '04', month: 'April' },
  { day: '03', month: 'April' },
  { day: '02', month: 'April' },
]

const flowCards: FlowItem[] = [
  {
    id: '1',
    title: 'XXXX牌局名称',
    club: 'XXX俱乐部',
    inAmount: '400,000',
    outAmount: '300,000',
    records: [
      { name: 'Tour Nickname', time: '20/04/2026 22:56', amount: '+123,456', positive: true },
      { name: 'Tour Nickname', time: '20/04/2026 22:56', amount: '-123,456' },
      { name: 'Tour Nickname', time: '20/04/2026 22:56', amount: '+123,456', positive: true },
      { name: 'Tour Nickname', time: '20/04/2026 22:56', amount: '-123,456' },
    ],
  },
  {
    id: '2',
    title: 'XXXX牌局名称',
    club: 'XXX俱乐部',
    inAmount: '400,000',
    outAmount: '300,000',
    records: [],
  },
]

function goBack(): void {
  void router.push('/mine')
}
</script>

<template>
  <div class="mine-glass-page bill-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <p class="hint">只支持查询最近三个月数据</p>

      <div class="bill-tabs">
        <button
          v-for="item in tabs"
          :key="item"
          type="button"
          :class="['tab', { active: activeTab === item }]"
          @click="activeTab = item"
        >
          {{ item }}
        </button>
      </div>

      <section class="glass-card total-card">
        <div class="label">UC总余额</div>
        <div class="amount-row">
          <img :src="iconDiamond" alt="chip" />
          <strong>123,456,789</strong>
        </div>
        <button class="detail-btn" type="button">查看明细</button>
      </section>

      <section class="timeline">
        <article v-for="(card, index) in flowCards" :key="card.id" class="timeline-item">
          <div class="date-col">
            <div class="date">{{ dayList[index]?.day }}</div>
            <div class="month">{{ dayList[index]?.month }}</div>
            <span class="dot"></span>
          </div>

          <div class="glass-card flow-card">
            <div class="flow-head">
              <div>
                <div class="title">{{ card.title }} <small>(ID: 11440454)</small></div>
                <div class="sub">{{ card.club }}</div>
                <div class="sub">总带入:{{ card.inAmount }}</div>
              </div>
              <div class="sub right">总带出: {{ card.outAmount }}</div>
            </div>

            <div v-for="row in card.records" :key="`${card.id}-${row.time}-${row.amount}`" class="flow-row">
              <div>
                <div class="name">{{ row.name }}</div>
                <div class="time">{{ row.time }}</div>
              </div>
              <div :class="['money', { positive: row.positive }]">{{ row.amount }}</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.8rem;
  color: #f3f3f3;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}

.placeholder {
  width: 0.72rem;
}

.hint {
  margin: 0.1rem 0 0;
  font-size: 0.24rem;
  opacity: 0.7;
}

.bill-tabs {
  margin-top: 0.24rem;
  display: flex;
  gap: 0.26rem;
  overflow-x: auto;
}

.tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.32rem;
  padding: 0.1rem 0;
  white-space: nowrap;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.9);
  }
}

.glass-card {
  border-radius: 0.44rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.total-card {
  margin-top: 0.3rem;
  padding: 0.3rem 0.4rem;

  .label {
    font-size: 0.26rem;
    opacity: 0.72;
  }

  .amount-row {
    margin-top: 0.08rem;
    display: flex;
    align-items: center;
    gap: 0.14rem;

    img {
      width: 0.5rem;
    }

    strong {
      font-size: 0.66rem;
      line-height: 1;
    }
  }
}

.detail-btn {
  margin-top: 0.2rem;
  width: 100%;
  border: 0;
  background: transparent;
  color: #f3f3f3;
  font-size: 0.28rem;
  padding-top: 0.16rem;
  border-top: 0.02rem solid rgba(249, 249, 249, 0.2);
}

.timeline {
  margin-top: 0.34rem;
  display: flex;
  flex-direction: column;
  gap: 0.26rem;
}

.timeline-item {
  display: grid;
  grid-template-columns: 0.76rem 1fr;
  gap: 0.18rem;
}

.date-col {
  position: relative;
  text-align: right;
  font-size: 0.24rem;

  .dot {
    position: absolute;
    right: -0.12rem;
    top: 0.14rem;
    width: 0.14rem;
    height: 0.14rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
  }
}

.flow-card {
  padding: 0.26rem 0.3rem;
}

.flow-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.16rem;
  padding-bottom: 0.16rem;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.2);

  .title {
    font-size: 0.34rem;

    small {
      opacity: 0.8;
      font-size: 0.25rem;
    }
  }

  .sub {
    margin-top: 0.04rem;
    font-size: 0.26rem;
    opacity: 0.78;
  }

  .right {
    white-space: nowrap;
    margin-top: 0.52rem;
  }
}

.flow-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.18rem 0;
  border-bottom: 0.02rem solid rgba(249, 249, 249, 0.18);

  &:last-child {
    border-bottom: 0;
  }

  .name {
    font-size: 0.34rem;
  }

  .time {
    font-size: 0.25rem;
    opacity: 0.7;
  }
}

.money {
  font-size: 0.38rem;
  color: #05e7ae;
  font-weight: 700;

  &.positive {
    color: #ff132b;
  }
}
</style>

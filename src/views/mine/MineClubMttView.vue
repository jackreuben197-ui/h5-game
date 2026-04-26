<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'

const router = useRouter()

const title = computed(() => 'SNG')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

interface MttRecord {
  id: string
  month: string
  nickname: string
  playerId: string
  detailVariant: 'v1' | 'v2'
  rank: string
  reward: string
  rewardType: string
  finishTime: string
  blind: string
}

const gameTabs = ['NLH', 'PLO', '6+']
const timeTabs = ['今天', '7天', '30天']
const selectedGame = ref(gameTabs[0])
const selectedTime = ref(timeTabs[0])

const summary = [
  { label: 'total games', value: '20' },
  { label: 'awards', value: '15' },
  { label: 'first', value: '1' },
  { label: 'second', value: '6' },
  { label: 'third', value: '6' },
]

const mttRecords: MttRecord[] = [
  {
    id: 'm1',
    month: '6月',
    nickname: 'Tour Nickname',
    playerId: '11440454',
    detailVariant: 'v1',
    rank: '#1',
    reward: '500',
    rewardType: '积分',
    finishTime: '06/04 22:56',
    blind: '1/4 (1)',
  },
  {
    id: 'm2',
    month: '6月',
    nickname: 'Tour Nickname',
    playerId: '11440454',
    detailVariant: 'v1',
    rank: '#3',
    reward: '200',
    rewardType: '积分',
    finishTime: '06/03 20:25',
    blind: '1/4 (1)',
  },
  {
    id: 'm3',
    month: '5月',
    nickname: 'Tour Nickname',
    playerId: '11440454',
    detailVariant: 'v2',
    rank: '#2',
    reward: '300',
    rewardType: '积分',
    finishTime: '05/28 18:40',
    blind: '2/4 (1)',
  },
  {
    id: 'm4',
    month: '5月',
    nickname: 'Tour Nickname',
    playerId: '11440454',
    detailVariant: 'v2',
    rank: '#6',
    reward: '80',
    rewardType: '积分',
    finishTime: '05/20 21:10',
    blind: '1/2 (1)',
  },
]

function goBack(): void {
  void router.push('/mine/club-career')
}

function goDetail(item: MttRecord): void {
  void router.push({
    path: '/mine/club-mtt/detail',
    query: {
      variant: item.detailVariant,
      id: item.id,
    },
  })
}
</script>

<template>
  <div class="club-mtt-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <nav class="game-tabs" aria-label="玩法切换">
        <button
          v-for="item in gameTabs"
          :key="item"
          type="button"
          class="plain-tab"
          :class="{ active: selectedGame === item }"
          @click="selectedGame = item"
        >
          {{ item }}
        </button>
      </nav>

      <section class="glass-card summary-card">
        <div class="time-tabs">
          <button
            v-for="item in timeTabs"
            :key="item"
            type="button"
            class="time-tab"
            :class="{ active: selectedTime === item }"
            @click="selectedTime = item"
          >
            {{ item }}
          </button>
        </div>
        <div class="summary-row">
          <div v-for="item in summary" :key="item.label" class="summary-item">
            <div class="value">{{ item.value }}</div>
            <div class="label">{{ item.label }}</div>
          </div>
        </div>
      </section>

      <section class="list-wrap">
        <article
          v-for="item in mttRecords"
          :key="item.id"
          class="glass-card mtt-card"
          @click="goDetail(item)"
        >
          <div class="timeline">{{ item.month }}</div>
          <div class="card-content">
            <div class="row-top">
              <div>
                <div class="name">{{ item.nickname }}</div>
                <div class="sub">(ID: {{ item.playerId }})</div>
              </div>
              <div class="result">
                <div class="rank">{{ item.rank }}</div>
                <div class="reward">{{ item.rewardType }} {{ item.reward }}</div>
              </div>
            </div>
            <div class="line"></div>
            <div class="row-bottom">
              <div class="time">结束: {{ item.finishTime }}</div>
              <div class="blind">盲注: {{ item.blind }}</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-mtt-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
}



.game-tabs {
  margin-top: 0.34rem;
  display: flex;
  justify-content: space-around;
}

.plain-tab {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.42rem;
  padding-bottom: 0.06rem;

  &.active {
    color: #fff;
    border-bottom: 0.03rem solid rgba(255, 255, 255, 0.92);
  }
}

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.summary-card {
  margin-top: 0.3rem;
  padding: 0.24rem 0.28rem;
}

.time-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.08rem;
  padding: 0.08rem;
  border-radius: 0.52rem;
  background: rgba(255, 255, 255, 0.2);
}

.time-tab {
  border: 0;
  border-radius: 0.44rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.35rem;
  padding: 0.18rem 0;

  &.active {
    background: rgba(255, 255, 255, 0.16);
    font-weight: 700;
  }
}

.summary-row {
  margin-top: 0.24rem;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.1rem;
}

.summary-item {
  text-align: center;

  .value {
    font-size: 0.43rem;
    font-weight: 700;
  }

  .label {
    margin-top: 0.06rem;
    font-size: 0.22rem;
    color: rgba(255, 255, 255, 0.72);
  }
}

.list-wrap {
  margin-top: 0.26rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.mtt-card {
  padding: 0.26rem;
  display: grid;
  grid-template-columns: 0.74rem 1fr;
  gap: 0.16rem;
}

.timeline {
  font-size: 0.3rem;
  color: rgba(255, 255, 255, 0.92);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0.42rem;
    left: 0.35rem;
    width: 0.02rem;
    height: calc(100% - 0.28rem);
    background: rgba(255, 255, 255, 0.28);
  }
}

.name {
  font-size: 0.36rem;
}

.sub {
  margin-top: 0.03rem;
  font-size: 0.27rem;
  color: rgba(255, 255, 255, 0.76);
}

.row-top {
  display: flex;
  justify-content: space-between;
  gap: 0.2rem;
}

.result {
  text-align: right;

  .rank {
    font-size: 0.34rem;
    font-weight: 700;
    color: #ffe084;
  }

  .reward {
    margin-top: 0.05rem;
    font-size: 0.28rem;
  }
}

.line {
  margin: 0.16rem 0;
  height: 0.02rem;
  background: rgba(255, 255, 255, 0.16);
}

.row-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 0.26rem;
  color: rgba(255, 255, 255, 0.8);
}
</style>

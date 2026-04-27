<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import iconTicket from '@/assets/icons/icon_ticket.png'
import iconDiamond from '@/assets/icons/icon_diamond.png'

const route = useRoute()
const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => 'MTT')

interface RankPlayerV1 {
  id: string
  name: string
  uid: string
  tickets: string
  reward: string
}

interface RankPlayerV2 {
  id: string
  name: string
  uid: string
  reward: string
}

type VariantType = 'v1' | 'v2'

const headMetrics = [
  { label: '总参赛', value: '1200' },
  { label: '奖励池', value: '5000' },
  { label: '名次', value: '1' },
  { label: '奖励', value: '1200' },
]

const rankPlayers: RankPlayerV1[] = [
  { id: '1', name: 'Player Name', uid: '11440454', tickets: '12', reward: '200' },
  { id: '2', name: 'Player Name', uid: '11440454', tickets: '8', reward: '120' },
  { id: '3', name: 'Player Name', uid: '11440454', tickets: '4', reward: '80' },
  { id: '4', name: 'Player Name', uid: '11440454', tickets: '2', reward: '40' },
  { id: '5', name: 'Player Name', uid: '11440454', tickets: '1', reward: '20' },
  { id: '6', name: 'Player Name', uid: '11440454', tickets: '1', reward: '20' },
]

const topMetricsV2 = [
  { label: '总参赛人数', value: '1200' },
  { label: '总奖池', value: '5000' },
  { label: '排名', value: '1' },
]

const sideMetricsV2 = [
  { label: '奖励', value: '1200' },
  { label: '票数', value: '60' },
]

const rankPlayersV2: RankPlayerV2[] = [
  { id: '1', name: 'Player Name', uid: '11440454', reward: '800' },
  { id: '2', name: 'Player Name', uid: '11440454', reward: '300' },
  { id: '3', name: 'Player Name', uid: '11440454', reward: '200' },
  { id: '4', name: 'Player Name', uid: '11440454', reward: '150' },
  { id: '5', name: 'Player Name', uid: '11440454', reward: '120' },
  { id: '6', name: 'Player Name', uid: '11440454', reward: '90' },
]

const variant = computed<VariantType>(() => {
  return route.query.variant === 'v2' ? 'v2' : 'v1'
})

function goBack(): void {
  void router.push('/mine/club-mtt')
}
</script>

<template>
  <div class="club-mtt-detail-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <template v-if="variant === 'v1'">
        <section class="glass-card top-card">
          <div class="title-row">
            <div>
              <div class="title">Hand Name</div>
              <div class="sub">ID: 11440454</div>
            </div>
            <div class="time">29/12 14:00</div>
          </div>
          <div class="metrics-row">
            <div
              v-for="(item, index) in headMetrics"
              :key="item.label"
              class="metric"
              :class="{ split: index > 0 }"
            >
              <div class="label">{{ item.label }}</div>
              <div class="value">{{ item.value }}</div>
            </div>
          </div>
        </section>

        <section class="list-wrap">
          <article
            v-for="item in rankPlayers"
            :key="item.id"
            class="glass-card rank-row"
          >
            <div class="left">
              <div class="avatar"></div>
              <div>
                <div class="name">{{ item.name }}</div>
                <div class="sub">ID: {{ item.uid }}</div>
              </div>
            </div>
            <div class="right">
              <div class="right-item">
                <img :src="iconTicket" alt="ticket" />
                <span>{{ item.tickets }}</span>
              </div>
              <span class="plus">+</span>
              <div class="right-item">
                <img :src="iconDiamond" alt="diamond" />
                <span>{{ item.reward }}</span>
              </div>
            </div>
          </article>
        </section>
      </template>

      <template v-else>
        <section class="glass-card top-card top-card--v2">
          <div class="title-row title-row--v2">
            <div>
              <div class="title">Hand Name</div>
              <div class="sub">ID: 11440454</div>
            </div>
            <div class="time">29/12 14:00-29/12 15:00</div>
          </div>

          <div class="metrics-wrap-v2">
            <div class="top-metrics-v2">
              <div
                v-for="(item, index) in topMetricsV2"
                :key="item.label"
                class="metric v2"
                :class="{ split: index > 0 }"
              >
                <div class="label">{{ item.label }}</div>
                <div class="value">{{ item.value }}</div>
              </div>
            </div>
            <div class="bottom-metrics-v2">
              <div
                v-for="(item, index) in sideMetricsV2"
                :key="item.label"
                class="metric v2"
                :class="{ split: index > 0 }"
              >
                <div class="label">{{ item.label }}</div>
                <div class="value">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="list-wrap list-wrap--v2">
          <article v-for="item in rankPlayersV2" :key="item.id" class="glass-card rank-row rank-row--v2">
            <div class="left">
              <div class="avatar"></div>
              <div>
                <div class="name">{{ item.name }}</div>
                <div class="sub">ID: {{ item.uid }}</div>
              </div>
            </div>
            <div class="right right--v2">
              <div class="right-item right-item--inline">
                <img :src="iconDiamond" alt="diamond" />
                <span>{{ item.reward }}</span>
              </div>
            </div>
          </article>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-mtt-detail-page {
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

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.top-card {
  margin-top: 0.34rem;
  padding: 0.26rem 0.24rem 0.22rem;
}

.top-card--v2 {
  padding: 0.28rem 0.22rem 0.24rem;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 0.16rem;

  .title {
    font-size: 0.5rem;
    line-height: 1.05;
    font-weight: 500;
  }

  .sub,
  .time {
    margin-top: 0.04rem;
    font-size: 0.32rem;
    line-height: 1.1;
    color: rgba(255, 255, 255, 0.76);
  }

  .time {
    transform: translateY(-0.03rem);
  }
}

.title-row--v2 {
  gap: 0.18rem;

  .title {
    font-size: 0.42rem;
  }

  .sub,
  .time {
    font-size: 0.28rem;
  }

  .time {
    text-align: right;
    transform: none;
  }
}

.metrics-row {
  margin-top: 0.28rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  min-height: 1.32rem;
}

.metrics-wrap-v2 {
  margin-top: 0.24rem;
  padding-top: 0.18rem;
  border-top: 0.02rem solid rgba(255, 255, 255, 0.16);
}

.top-metrics-v2 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 1.12rem;
}

.bottom-metrics-v2 {
  margin: 0.2rem auto 0;
  width: 4.8rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 1.12rem;
}

.metric {
  text-align: center;
  min-height: 1.12rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;

  &.split::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.16rem;
    width: 0.02rem;
    height: 0.8rem;
    background: rgba(255, 255, 255, 0.2);
  }

  .label {
    font-size: 0.3rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.72);
  }

  .value {
    margin-top: 0.11rem;
    font-size: 0.56rem;
    line-height: 1;
    font-weight: 700;
  }
}

.metric.v2 {
  .label {
    font-size: 0.28rem;
  }

  .value {
    font-size: 0.48rem;
  }
}

.list-wrap {
  margin-top: 0.42rem;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.list-wrap--v2 {
  margin-top: 0.3rem;
  gap: 0.14rem;
}

.rank-row {
  min-height: 2rem;
  padding: 0.36rem 0.44rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-row--v2 {
  min-height: 1.82rem;
  padding: 0.28rem 0.34rem;

  .avatar {
    width: 0.84rem;
    height: 0.84rem;
  }

  .name {
    font-size: 0.33rem;
  }

  .sub {
    margin-top: 0.05rem;
    font-size: 0.25rem;
  }
}

.left {
  display: flex;
  align-items: center;
  gap: 0.22rem;

  .avatar {
    width: 1.27rem;
    height: 1.27rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.52);
  }

  .name {
    font-size: 0.4rem;
    line-height: 1;
  }

  .sub {
    margin-top: 0.09rem;
    font-size: 0.3rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.74);
  }
}

.right {
  display: flex;
  align-items: center;
  gap: 0.12rem;
  font-size: 0.34rem;
  font-weight: 500;

  .plus {
    font-size: 0.28rem;
    color: rgba(255, 255, 255, 0.72);
    transform: translateY(-0.02rem);
  }

  .right-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0.95rem;

    img {
      width: 0.58rem;
      height: 0.58rem;
      object-fit: contain;
    }

    span {
      margin-top: 0.06rem;
      font-size: 0.34rem;
      line-height: 1;
    }
  }
}

.right--v2 {
  .right-item--inline {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.1rem;
    min-width: auto;

    img {
      width: 0.46rem;
      height: 0.46rem;
    }

    span {
      margin-top: 0;
      font-size: 0.33rem;
      color: #ffe084;
    }
  }
}
</style>

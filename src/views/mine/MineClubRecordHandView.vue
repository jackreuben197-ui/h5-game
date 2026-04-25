<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

interface HandRow {
  id: string
  title: string
  handId: string
  pot: string
  profit: string
  hands: string
}

const handRows: HandRow[] = [
  { id: 'h1', title: 'john wins with Royal Flush', handId: '11440454', pot: '80', profit: '-5000', hands: '10' },
  { id: 'h2', title: 'john wins with Royal Flush', handId: '11440454', pot: '120', profit: '+1400', hands: '14' },
]

function goBack(): void {
  void router.push('/mine/club-record/detail')
}

function goReport(): void {
  void router.push('/mine/club-record/report')
}
</script>

<template>
  <div class="record-hand-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>Result</h1>
      <button class="head-action" type="button" @click="goReport">report</button>
    </header>

    <section class="glass-card overview-card">
      <div class="left-user">
        <div class="avatar" />
        <div>
          <div class="name">Player Name</div>
          <div class="hands">Hands 123</div>
        </div>
      </div>
      <div class="right-info">
        <div class="title">牌局名称</div>
        <div class="sub">ID: 11440454</div>
      </div>
    </section>

    <section class="list-wrap">
      <article v-for="item in handRows" :key="item.id" class="glass-card hand-card" @click="goReport">
        <div class="top-row">
          <div class="poker-pair">
            <div class="poker">10</div>
            <div class="poker red">J</div>
          </div>
          <div class="title">{{ item.title }}</div>
        </div>
        <div class="line" />
        <div class="bottom-row">
          <div class="meta">
            <div>Hand ID: {{ item.handId }}</div>
            <div>Pot: {{ item.pot }}</div>
          </div>
          <div class="profit" :class="{ positive: item.profit.startsWith('+') }">
            <div class="money">{{ item.profit }}</div>
            <div class="hands-count">Hands: {{ item.hands }}</div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.record-hand-page {
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.46rem) 0.45rem 0.8rem;
  color: #f9f9f9;
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.6) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 25% 85%, rgba(206, 107, 160, 0.6) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.58) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-size: 0.66rem;
    font-weight: 500;
  }
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
}

.head-action {
  border: 0;
  border-radius: 0.26rem;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.3rem;
  padding: 0.08rem 0.2rem;
}

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.overview-card {
  margin-top: 0.35rem;
  padding: 0.24rem 0.32rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.2rem;
}

.left-user {
  display: flex;
  align-items: center;
  gap: 0.16rem;

  .avatar {
    width: 0.84rem;
    height: 0.84rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.48);
  }

  .name {
    font-size: 0.35rem;
  }

  .hands {
    margin-top: 0.05rem;
    font-size: 0.27rem;
    color: rgba(255, 255, 255, 0.74);
  }
}

.right-info {
  text-align: right;

  .title {
    font-size: 0.42rem;
  }

  .sub {
    margin-top: 0.08rem;
    font-size: 0.28rem;
    color: rgba(255, 255, 255, 0.78);
  }
}

.list-wrap {
  margin-top: 0.34rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.hand-card {
  padding: 0.28rem 0.3rem;
}

.top-row,
.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.poker-pair {
  display: flex;
  gap: 0.08rem;
}

.poker {
  width: 0.52rem;
  height: 0.8rem;
  border-radius: 0.1rem;
  background: #fff;
  color: #111;
  font-size: 0.28rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;

  &.red {
    color: #df495f;
  }
}

.title {
  flex: 1;
  text-align: right;
  font-size: 0.34rem;
}

.line {
  height: 0.02rem;
  margin: 0.16rem 0;
  background: rgba(255, 255, 255, 0.15);
}

.meta {
  font-size: 0.3rem;
  line-height: 1.5;
}

.profit {
  text-align: right;

  .money {
    font-size: 0.52rem;
    color: #ff8498;
    font-weight: 700;
  }

  .hands-count {
    margin-top: 0.04rem;
    font-size: 0.29rem;
  }

  &.positive {
    .money {
      color: #65e89f;
    }
  }
}
</style>

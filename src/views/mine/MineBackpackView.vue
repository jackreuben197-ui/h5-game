<script setup lang="ts">
import { useRouter } from 'vue-router'
import iconTicket from '@/assets/icons/icon_ticket.png'

const router = useRouter()

const list = Array.from({ length: 6 }).map((_, idx) => ({
  id: `${idx + 1}`,
  name: 'Tickets 2*1',
  expire: '19/03/2026 12:00',
}))

function goBack(): void {
  void router.push('/mine')
}
</script>

<template>
  <div class="mine-glass-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>My Items</h1>
      <div class="placeholder" />
    </header>

    <section class="item-list">
      <article v-for="item in list" :key="item.id" class="glass-card item-card">
        <div class="icon-wrap">
          <img :src="iconTicket" :alt="item.name" />
        </div>
        <div>
          <div class="name">{{ item.name }}</div>
          <div class="time">{{ item.expire }}</div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.46rem) 0.45rem 0.8rem;
  color: #f3f3f3;
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

.placeholder {
  width: 0.72rem;
}

.item-list {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.glass-card {
  border-radius: 0.82rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.item-card {
  display: flex;
  align-items: center;
  gap: 0.22rem;
  padding: 0.22rem;
}

.icon-wrap {
  width: 1.06rem;
  height: 1.06rem;
  border-radius: 0.28rem;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 0.76rem;
    height: 0.76rem;
  }
}

.name {
  font-size: 0.5rem;
  line-height: 1.1;
}

.time {
  margin-top: 0.06rem;
  font-size: 0.31rem;
  opacity: 0.86;
}
</style>

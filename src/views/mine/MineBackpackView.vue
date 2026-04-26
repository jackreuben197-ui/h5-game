<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import iconTicket from '@/assets/icons/icon_ticket.png'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => 'My Items')

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
  <div class="mine-glass-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
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

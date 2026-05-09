<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))


interface PoolRewardItem {
  id: string
  name: string
  jpAmount: string
  tags: string[]
}

type TabKey = 'reward' | 'contribution'

const activeTab = ref<TabKey>('reward')

const rewardItems = ref<PoolRewardItem[]>([
  { id: '1', name: 'Game Name', jpAmount: '666999', tags: ['NLH', 'PLO', '6+'] },
  { id: '2', name: 'Game Name', jpAmount: '666999', tags: ['NLH', 'PLO', '6+'] },
  { id: '3', name: 'Game Name', jpAmount: '666999', tags: ['NLH', 'PLO', '6+'] },
  { id: '4', name: 'Game Name', jpAmount: '666999', tags: ['NLH', 'PLO', '6+'] },
])

const contributionItems = ref<PoolRewardItem[]>([
  { id: '5', name: 'Game Name', jpAmount: '666999', tags: ['NLH', 'PLO', '6+'] },
  { id: '6', name: 'Game Name', jpAmount: '666999', tags: ['NLH', 'PLO', '6+'] },
])

const currentItems = computed(() =>
  activeTab.value === 'reward' ? rewardItems.value : contributionItems.value,
)

const router = useRouter()

function onOpenRecord(item: PoolRewardItem): void {
  if (activeTab.value === 'reward') {
    void router.push({
      path: '/club/jackpot/pool-reward/reward-records',
      query: { id: item.id },
    })
    return
  }

  void router.push({
    path: '/club/jackpot/pool-reward/contribution-records',
    query: { id: item.id },
  })
}
</script>

<template>
  <div class="page-shell pool-reward-page" :style="backgroundStyle">
    <div class="page-overlay"></div>

    <HeaderBack :title="'奖池记录'" />

    <section class="pool-body">
      <div class="tab-switch" role="tablist" aria-label="奖池记录类型">
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'reward' }"
          @click="activeTab = 'reward'"
        >
          获奖记录
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'contribution' }"
          @click="activeTab = 'contribution'"
        >
          贡献记录
        </button>
      </div>

      <ul class="pool-list">
        <li
          v-for="item in currentItems"
          :key="item.id"
          class="pool-card"
          role="button"
          tabindex="0"
          @click="onOpenRecord(item)"
          @keydown.enter="onOpenRecord(item)"
          @keydown.space.prevent="onOpenRecord(item)"
        >
          <div class="card-bg"></div>

          <div class="jackpot-badge">
            <span>JACKPOT</span>
          </div>

          <div class="pool-info">
            <p class="game-name">{{ item.name }}</p>
            <div class="pool-tags">
              <span v-for="tag in item.tags" :key="`${item.id}-${tag}`" class="tag-item">
                <i class="tag-icon"></i>
                {{ tag }}
              </span>
            </div>
          </div>

          <span class="jp-badge">JP {{ item.jpAmount }}</span>
        </li>
      </ul>
    </section>

    <div class="footer-action">
      <button type="button" class="create-btn">Create Jackpot Table</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pool-reward-page {
  position: relative;
  height: 100dvh;
  padding: 0 0.4267rem calc(2.88rem + env(safe-area-inset-bottom));
  overflow-x: hidden;
  overflow-y: auto;
}

.page-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  backdrop-filter: blur(0.9733rem);
  background: rgba(0, 0, 0, 0.2);
  mix-blend-mode: luminosity;
  z-index: 0;
}

:deep(.page-back-header) {
  position: relative;
  z-index: 2;
  padding-left: 0;
  padding-right: 0;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
  min-height: 1.46rem;
}

.pool-body {
  position: relative;
  z-index: 2;
  margin-top: 0.8rem;
  width: 9.1216rem;
  max-width: calc(100vw - 0.8534rem);
  margin-left: auto;
  margin-right: auto;
}

.tab-switch {
  width: 4.5514rem;
  height: 0.5152rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tab-btn {
  border: 0;
  padding: 0;
  min-width: 1.6rem;
  height: 0.5152rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.3991rem;
  line-height: 0.95;
  border-bottom: 0.0363rem solid transparent;
}

.tab-btn--active {
  color: #ffffff;
  font-weight: 700;
  border-bottom-color: #ffffff;
}

.pool-list {
  margin: 0.5387rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4223rem;
}

.pool-card {
  position: relative;
  height: 2.2765rem;
  cursor: pointer;
}

.card-bg {
  position: absolute;
  left: 0.2534rem;
  top: 0.0253rem;
  width: 8.7753rem;
  height: 2.2551rem;
  border-radius: 2.0848rem;
  border: 0.0267rem solid rgba(255, 255, 255, 0.96);
  background:
    radial-gradient(74% 96% at 42% 42%, rgba(104, 75, 255, 0.3) 0%, rgba(104, 75, 255, 0) 62%),
    rgba(5, 13, 231, 0.6);
  backdrop-filter: blur(0.1098rem);
  overflow: hidden;
}

.card-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0.0149rem rgba(255, 255, 255, 0.5);
}

.jackpot-badge {
  position: absolute;
  left: -0.028rem;
  top: 0.4053rem;
  width: 1.4888rem;
  height: 1.4888rem;
  border-radius: 1.7372rem;
  border: 0.0253rem solid rgba(242, 242, 242, 0.4);
  box-shadow: 0.0913rem 0.1141rem 0.0913rem rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(0.2811rem);
  background: #7a45d6;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.jackpot-badge span {
  font-size: 0.2824rem;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
}

.pool-info {
  position: absolute;
  left: 1.4533rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4.1rem;
  z-index: 1;
}

.game-name {
  margin: 0;
  font-size: 0.354rem;
  line-height: 0.83;
  color: #f9f9f9;
  font-weight: 700;
}

.pool-tags {
  margin-top: 0.1493rem;
  display: flex;
  align-items: center;
  gap: 0.3467rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.1333rem;
  font-size: 0.2933rem;
  line-height: normal;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.0117rem;
}

.tag-icon {
  width: 0.24rem;
  height: 0.2667rem;
  display: inline-block;
  background: linear-gradient(180deg, rgba(190, 232, 255, 0.95), rgba(136, 188, 255, 0.85));
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.jp-badge {
  position: absolute;
  left: 6.4267rem;
  top: 0.853rem;
  width: 1.84rem;
  height: 0.4755rem;
  border-radius: 0.2232rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #69ffe6, #079a8b);
  font-size: 0.2951rem;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  z-index: 1;
}

.pool-card:active {
  opacity: 0.92;
}

.footer-action {
  position: fixed;
  left: 50%;
  bottom: calc(0.6933rem + env(safe-area-inset-bottom));
  width: 8.9358rem;
  max-width: calc(100vw - 1.0667rem);
  transform: translateX(-50%);
  z-index: 6;
}

.create-btn {
  width: 100%;
  height: 1.4716rem;
  border: 0.0358rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.082rem;
  font-size: 0.48rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(168.09deg, #05e7ae 7.55%, #027a5c 71.92%);
  box-shadow:
    inset 0 0.04rem 0.2rem rgba(255, 255, 255, 0.25),
    0 0.16rem 0.36rem rgba(0, 120, 100, 0.45);
}

@media (max-width: 360px) {
  .pool-body {
    max-width: calc(100vw - 0.64rem);
  }

  .pool-info {
    left: 1.38rem;
    width: 3.8rem;
  }

  .jp-badge {
    left: auto;
    right: 0.72rem;
  }

  .footer-action {
    max-width: calc(100vw - 0.8533rem);
  }
}
</style>

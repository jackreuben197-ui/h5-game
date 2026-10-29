<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import bannerYangduoduo from '@/assets/images/banner_yangduoduo.png'
import bannerVipBonus from '@/assets/images/banner_vip_bonus.png'

const props = withDefaults(
  defineProps<{
    autoplayDuration?: number // Duration in ms each banner stays (default 3500ms)
    transitionDuration?: number // Slide transition speed in ms (default 500ms)
  }>(),
  {
    autoplayDuration: 3500,
    transitionDuration: 500,
  },
)

const banners = [
  {
    id: 'yangduoduo',
    img: bannerYangduoduo,
    alt: '羊多多交流群领3.8万(金币)',
    link: '#',
  },
  {
    id: 'vip_bonus',
    img: bannerVipBonus,
    alt: 'VIP 每周一1888 每月三号5888',
    link: '#',
  },
]

const currentIndex = ref(0)
const isTransitioning = ref(false)
const progressKey = ref(0)
let timer: ReturnType<typeof setTimeout> | null = null

function nextBanner() {
  if (isTransitioning.value) return
  isTransitioning.value = true
  currentIndex.value = (currentIndex.value + 1) % banners.length
  progressKey.value++

  setTimeout(() => {
    isTransitioning.value = false
    scheduleNext()
  }, props.transitionDuration)
}

function scheduleNext() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    nextBanner()
  }, props.autoplayDuration)
}

onMounted(() => {
  scheduleNext()
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="casino-promo-banner-container">
    <div class="banner-viewport">
      <!-- Sliding Track -->
      <div
        class="banner-track"
        :style="{
          transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
          transitionDuration: isTransitioning ? `${props.transitionDuration}ms` : '0ms',
        }"
      >
        <div
          v-for="(banner, index) in banners"
          :key="banner.id"
          class="banner-slide"
          :class="{ 'is-active': index === currentIndex }"
        >
          <img :src="banner.img" :alt="banner.alt" class="banner-img" />
        </div>
      </div>

      <!-- Glowing Animated Progress Bar (Matching Video & Screenshot) -->
      <div class="banner-progress-track">
        <div
          :key="progressKey"
          class="banner-progress-bar"
          :style="{
            animationDuration: `${props.autoplayDuration}ms`,
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.casino-promo-banner-container {
  margin: 6px 12px 6px;
  position: relative;
  user-select: none;
}

.banner-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 356 / 56;
  max-height: 58px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  background: #181b24;
}

.banner-track {
  display: flex;
  width: 100%;
  height: 100%;
  will-change: transform;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
}

.banner-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;

  .banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

// ── Glowing Bottom Progress Bar ──
.banner-progress-track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2.5px;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
  z-index: 4;
}

.banner-progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #60a5fa, #c084fc, #f472b6);
  box-shadow: 0 0 6px rgba(192, 132, 252, 0.85);
  animation-name: progressFill;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes progressFill {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}
</style>


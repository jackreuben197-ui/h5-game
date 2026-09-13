<script setup lang="ts">
import { computed } from 'vue'
import { useCachedImages } from '@/utils/imageCache'
import ThemeQuickSwitch from '@/components/ThemeQuickSwitch.vue'

const props = defineProps<{
  images: string[]
}>()

// 首次服务端结果返回前保持空白占位，不展示默认图或持久化旧图。
const displayImages = computed(() => props.images.filter((url) => Boolean(url?.trim())))
const cachedImages = useCachedImages(() => displayImages.value)
const isSwipeEnabled = computed(() => cachedImages.value.length > 1)
</script>

<template>
  <div class="home-banner" :class="{ 'is-loaded': cachedImages.length > 0 }">
    <Transition name="banner-fade" mode="out-in">
      <van-swipe v-if="isSwipeEnabled" key="swipe" class="home-banner__swipe" loop :autoplay="3000">
        <van-swipe-item v-for="(url, index) in cachedImages" :key="index">
          <img class="home-banner__img" :src="url" alt="banner" />
        </van-swipe-item>
        <template #indicator="{ active, total }">
          <div class="home-banner__dots">
            <span
              v-for="i in total"
              :key="i"
              class="home-banner__dot"
              :class="{ 'is-active': i - 1 === active }"
            ></span>
          </div>
        </template>
      </van-swipe>
      <img
        v-else-if="cachedImages.length === 1"
        key="single"
        class="home-banner__img"
        :src="cachedImages[0]"
        alt="banner"
      />
    </Transition>
    <ThemeQuickSwitch class="home-banner__theme-switch" />
  </div>
</template>

<style scoped lang="scss">
// 高度由外层 .home-header 决定（flex 伸缩 + max-height），此处只做铺满。
.home-banner {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 0.8rem;
  background: rgba(0, 0, 0, 0.08);
}

.home-banner__theme-switch {
  position: absolute;
  top: 0.35rem;
  right: 0.3rem;
  z-index: 3;
}

.home-banner__swipe {
  width: 100%;
  height: 100%;
}

.home-banner__swipe :deep(.van-swipe__track),
.home-banner__swipe :deep(.van-swipe-item) {
  height: 100%;
}

.home-banner__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 0.8rem;
}

.home-banner__dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.13rem;
}

.home-banner__dot {
  width: 0.13rem;
  height: 0.13rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  transition: all 0.2s;
}

.home-banner__dot.is-active {
  width: 0.35rem;
  border-radius: 0.07rem;
  background: #00ff8f;
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 0.35s ease-in-out;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
}
</style>

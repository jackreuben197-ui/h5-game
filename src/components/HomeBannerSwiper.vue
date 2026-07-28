<script setup lang="ts">
import { computed } from 'vue'
import homeHeaderFallback from '@/assets/images/home_header_1.png'
import { useCachedImages } from '@/utils/imageCache'
import ThemeQuickSwitch from '@/components/ThemeQuickSwitch.vue'

const props = defineProps<{
  images: string[]
}>()

// 无数据时回落到默认单图；单图不启用轮播/圆点。
const displayImages = computed(() => (props.images.length ? props.images : [homeHeaderFallback]))
const cachedImages = useCachedImages(() => displayImages.value)
const isSwipeEnabled = computed(() => cachedImages.value.length > 1)
</script>

<template>
  <div class="home-banner">
    <van-swipe v-if="isSwipeEnabled" class="home-banner__swipe" loop :autoplay="3000">
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
    <img v-else class="home-banner__img" :src="cachedImages[0]" alt="banner" />
    <ThemeQuickSwitch class="home-banner__theme-switch" />
  </div>
</template>

<style scoped lang="scss">
.home-banner {
  position: relative;
  width: 100%;
}

.home-banner__swipe {
  width: 100%;
}

.home-banner__img {
  width: 100%;
  height: 3.68rem;
  display: block;
  // 图片自身圆角（和外层 .home-header 一致），滑动过程中露出的边缘也是圆角。
  border-radius: 0.8rem;
}

.home-banner__theme-switch {
  position: absolute;
  top: 0.35rem;
  right: 0.3rem;
  z-index: 3;
  transform: scale(2);
  transform-origin: top right;
}

.home-banner__dots {
  position: absolute;
  bottom: 0.16rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.12rem;
}

.home-banner__dot {
  width: 0.16rem;
  height: 0.16rem;
  aspect-ratio: 1/1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.51);

  &.is-active {
    background: #00ff8f;
  }
}
</style>

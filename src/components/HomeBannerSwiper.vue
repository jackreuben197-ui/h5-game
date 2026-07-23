<script setup lang="ts">
import { computed } from 'vue'
import homeHeaderFallback from '@/assets/images/home_header_1.png'
import { useCachedImages } from '@/utils/imageCache'

const props = defineProps<{
  images: string[]
}>()

// 无数据时回落到默认单图；单图不启用轮播/圆点。
const displayImages = computed(() => (props.images.length ? props.images : [homeHeaderFallback]))
const cachedImages = useCachedImages(() => displayImages.value)
const isSwipeEnabled = computed(() => cachedImages.value.length > 1)
</script>

<template>
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
</template>

<style scoped lang="scss">
// 高度由外层 .home-header 决定（flex 伸缩 + max-height），此处只做铺满。
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
</style>

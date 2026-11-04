<script setup lang="ts">
import { computed } from 'vue'
import { useCachedImages } from '@/utils/imageCache'
import ThemeQuickSwitch from '@/components/ThemeQuickSwitch.vue'
import LobbyBannerImage from '@/components/LobbyBannerImage.vue'
import type { LobbyBanner } from '@/utils/lobbyBannerAssociation'
import defaultBanner from '@/assets/images/home_header_1.png'

const props = withDefaults(
  defineProps<{
    banners: LobbyBanner[]
    refresh: (banner: LobbyBanner) => Promise<LobbyBanner | undefined>
    variant?: 'ab' | 'c'
    alt?: string
    fallback?: string
  }>(),
  { variant: 'ab', alt: 'Banner', fallback: defaultBanner },
)

const compact = computed(() => props.variant === 'c')
const imageClass = computed(() => (compact.value ? 'home-banner__img--compact' : 'home-banner__img'))
const cachedImages = useCachedImages(() => props.banners.map((banner) => banner.imageUrl))
const isSwipeEnabled = computed(() => cachedImages.value.length > 1)
const singleImage = computed(() => cachedImages.value[0] || props.fallback)
</script>

<template>
  <div :class="compact ? 'home-banner--compact' : 'home-banner'">
    <van-swipe v-if="isSwipeEnabled" class="home-banner__swipe" loop :autoplay="3000">
      <van-swipe-item
        v-for="(banner, index) in banners"
        :key="banner.id > 0 ? `banner-${banner.id}` : index"
      >
        <LobbyBannerImage
          :class="imageClass"
          :src="cachedImages[index]!"
          :banner="banner"
          :refresh="refresh"
          :alt="alt"
          :fallback="fallback"
        />
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
    <LobbyBannerImage
      v-else
      :class="imageClass"
      :src="singleImage"
      :banner="banners[0]"
      :refresh="refresh"
      :alt="alt"
      :fallback="fallback"
    />
    <ThemeQuickSwitch v-if="!compact" class="home-banner__theme-switch" />
  </div>
</template>

<style scoped lang="scss">
.home-banner,
.home-banner--compact {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.home-banner {
  height: 3.68rem;
  border-radius: 0.8rem;
  background: #f5f5f5;
}

.home-banner--compact {
  aspect-ratio: 372 / 69;
  margin: 0.075rem 0 0.128rem;
  border-radius: 0.282rem;
}

.home-banner__swipe {
  width: 100%;
  height: 100%;
}

.home-banner__img,
.home-banner__img--compact {
  width: 100%;
  height: 100%;
}

.home-banner__img {
  border-radius: 0.8rem;
}

.home-banner__img--compact {
  border-radius: 0.282rem;

  :deep(.lobby-banner-image__art) {
    border: 1px solid #69beff;
  }
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

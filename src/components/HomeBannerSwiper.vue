<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SwipeInstance } from 'vant'
import { useCachedImages } from '@/utils/imageCache'
import ThemeQuickSwitch from '@/components/ThemeQuickSwitch.vue'
import LobbyBannerImage from '@/components/LobbyBannerImage.vue'
import type { LobbyBanner, RefreshLobbyBanner } from '@/utils/lobbyBannerAssociation'

const props = withDefaults(
  defineProps<{
    banners: LobbyBanner[]
    refresh: RefreshLobbyBanner
    alt?: string
    fallback?: string
  }>(),
  { alt: 'Banner', fallback: '' },
)

// 首次服务端结果返回前保持空白占位，不展示默认图或持久化旧图；默认图由调用方决定。
const displayBanners = computed(() => props.banners.filter((banner) => Boolean(banner.imageUrl?.trim())))
const cachedImages = useCachedImages(() => displayBanners.value.map((banner) => banner.imageUrl))
const isSwipeEnabled = computed(() => cachedImages.value.length > 1)
const swipe = ref<SwipeInstance>()
const mouseDrag = ref<{ id: number; x: number; y: number } | null>(null)
const suppressClick = ref(false)

watch(() => props.banners, () => {
  mouseDrag.value = null
})

function startMouseDrag(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || event.button !== 0) return
  const target = event.target as Element
  suppressClick.value = false
  mouseDrag.value = { id: event.pointerId, x: event.clientX, y: event.clientY }
  // 让短按保留原点击目标，拖到 Banner 外也能收到松手事件。
  target.setPointerCapture(event.pointerId)
}

function trackMouseDrag(event: PointerEvent) {
  const start = mouseDrag.value
  if (!start || start.id !== event.pointerId) return
  if (Math.max(Math.abs(event.clientX - start.x), Math.abs(event.clientY - start.y)) >= 8) {
    suppressClick.value = true
  }
}

function endMouseDrag(event: PointerEvent) {
  const start = mouseDrag.value
  if (!start || start.id !== event.pointerId) return
  mouseDrag.value = null
  if (event.type !== 'pointerup') return
  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  if (Math.abs(dx) < 24 || Math.abs(dx) <= Math.abs(dy)) return
  suppressClick.value = true
  if (dx < 0) swipe.value?.next()
  else swipe.value?.prev()
}

function guardBannerClick(event: MouseEvent) {
  if (!suppressClick.value || event.detail === 0) return
  event.preventDefault()
  event.stopPropagation()
}
</script>

<template>
  <div class="home-banner" :class="{ 'is-loaded': cachedImages.length > 0 }">
    <Transition name="banner-fade" mode="out-in">
      <van-swipe
        v-if="isSwipeEnabled"
        key="swipe"
        ref="swipe"
        class="home-banner__swipe"
        loop
        touchable
        :autoplay="mouseDrag ? 0 : 3000"
        @touchstart.capture="suppressClick = false"
        @drag-start="suppressClick = true"
        @pointerdown="startMouseDrag"
        @pointermove="trackMouseDrag"
        @pointerup="endMouseDrag"
        @lostpointercapture="endMouseDrag"
        @click.capture="guardBannerClick"
      >
        <van-swipe-item
          v-for="(banner, index) in displayBanners"
          :key="banner.id > 0 ? `banner-${banner.id}` : index"
        >
          <LobbyBannerImage
            class="home-banner__img"
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
        v-else-if="cachedImages.length === 1"
        key="single"
        class="home-banner__img"
        :src="cachedImages[0]!"
        :banner="displayBanners[0]"
        :refresh="refresh"
        :alt="alt"
        :fallback="fallback"
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
  touch-action: pan-y;
}

.home-banner__swipe :deep(.van-swipe__track),
.home-banner__swipe :deep(.van-swipe-item) {
  height: 100%;
}

.home-banner__img {
  width: 100%;
  height: 100%;
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

<script setup lang="ts">
import { watch } from 'vue'
import LobbyBannerPoster from '@/components/LobbyBannerPoster.vue'
import { useLobbyBannerAction } from '@/composables/useLobbyBannerAction'
import type { LobbyBanner, RefreshLobbyBanner } from '@/utils/lobbyBannerAssociation'

const props = defineProps<{
  banner?: LobbyBanner
  src: string
  alt: string
  fallback?: string
  refresh: RefreshLobbyBanner
}>()

const { busy, posterOpen, posterSrc, currentBanner, actionLabel, closeBanner, setBanner, openBanner } =
  useLobbyBannerAction(() => props.refresh)
setBanner(props.banner)
watch(() => props.banner, setBanner)

function handleImageError(event: Event) {
  const image = event.target as HTMLImageElement
  if (props.fallback && image.getAttribute('src') !== props.fallback) image.src = props.fallback
}
</script>

<template>
  <div>
    <component
      :is="currentBanner?.association ? 'button' : 'div'"
      class="lobby-banner-image__frame"
      :type="currentBanner?.association ? 'button' : undefined"
      :aria-busy="currentBanner?.association ? busy : undefined"
      :aria-label="actionLabel"
      @click="openBanner()"
    >
      <img
        class="lobby-banner-image__art"
        :src="src"
        :alt="alt"
        draggable="false"
        @error="handleImageError"
      />
      <van-icon
        v-if="currentBanner?.association"
        class="lobby-banner-image__arrow"
        name="arrow"
        aria-hidden="true"
      />
    </component>

    <LobbyBannerPoster :src="posterSrc" :open="posterOpen" @close="closeBanner" />
  </div>
</template>

<style scoped lang="scss">
.lobby-banner-image__frame,
.lobby-banner-image__art {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.lobby-banner-image__frame {
  position: relative;
  padding: 0;
  border: 0;
  background: none;
}

button.lobby-banner-image__frame {
  cursor: pointer;
}

.lobby-banner-image__art {
  object-fit: cover;
}

.lobby-banner-image__arrow {
  position: absolute;
  top: 50%;
  right: clamp(8px, 0.32rem, 22px);
  display: grid;
  width: clamp(26px, 0.78rem, 36px);
  aspect-ratio: 1;
  place-items: center;
  transform: translateY(-50%);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.28);
  color: rgba(255, 255, 255, 0.76);
  font-size: clamp(16px, 0.48rem, 24px);
  -webkit-text-stroke: 0.7px currentColor;
  text-shadow: 0 1px 4px #0006;
  pointer-events: none;
}
</style>

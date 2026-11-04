<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLobbyBannerMatch } from '@/composables/useLobbyBannerMatch'
import { t } from '@/i18n'
import type { LobbyBanner } from '@/utils/lobbyBannerAssociation'
import { stageMttDetailForNavigation } from '@/utils/mttDetailHandoff'

const props = defineProps<{
  banner?: LobbyBanner
  src: string
  alt: string
  fallback?: string
  refresh: (banner: LobbyBanner) => Promise<LobbyBanner | undefined>
}>()

const router = useRouter()
const resolveMatch = useLobbyBannerMatch()
const busy = ref(false)
const posterUrl = ref('')
const posterOpen = ref(false)
const actionLabel = computed(() => {
  const association = props.banner?.association
  if (!association) return undefined
  return (association.type === 'mtt' && association.templateName) || t('UIMine_RecordItemsNormal')
})
let revision = 0

function reset() {
  revision += 1
  busy.value = false
  posterOpen.value = false
}
onDeactivated(reset)
onBeforeUnmount(reset)

function handleImageError(event: Event) {
  const image = event.target as HTMLImageElement
  if (props.fallback && image.getAttribute('src') !== props.fallback) image.src = props.fallback
}

async function openBanner() {
  if (!props.banner?.association || busy.value) return
  busy.value = true
  const request = ++revision
  const currentRoute = router.currentRoute.value
  const isCurrent = () => request === revision && router.currentRoute.value === currentRoute
  try {
    const banner = await props.refresh(props.banner)
    if (!isCurrent() || !banner?.association) return
    if (banner.association.type === 'poster') {
      posterUrl.value = banner.association.url
      posterOpen.value = true
      return
    }

    const match = await resolveMatch(banner.clubId, banner.association.templateId)
    if (!match || !isCurrent()) return
    const discardDetail = stageMttDetailForNavigation(match)
    try {
      const failure = await router.push({ name: 'mtt-detail', query: { id: String(match.id) } })
      if (failure) discardDetail()
    } catch (error) {
      discardDetail()
      throw error
    }
  } catch (error) {
    console.warn('[lobby-banner] Unable to open associated content', error)
  } finally {
    if (request === revision) busy.value = false
  }
}
</script>

<template>
  <div>
    <component
      :is="banner?.association ? 'button' : 'div'"
      class="lobby-banner-image__frame"
      :type="banner?.association ? 'button' : undefined"
      :aria-busy="banner?.association ? busy : undefined"
      :aria-label="actionLabel"
      @click="openBanner"
    >
      <img class="lobby-banner-image__art" :src="src" :alt="alt" @error="handleImageError" />
      <van-icon
        v-if="banner?.association?.type === 'mtt'"
        class="lobby-banner-image__arrow"
        name="arrow"
        aria-hidden="true"
      />
    </component>

    <van-popup
      v-if="posterUrl"
      v-model:show="posterOpen"
      teleport="body"
      close-on-popstate
      position="bottom"
      class="lobby-banner-poster"
      :aria-label="t('UISNG_CreateSNGPoster')"
      @click.self="posterOpen = false"
    >
      <img class="lobby-banner-poster__image" :src="posterUrl" :alt="t('UISNG_CreateSNGPoster')" />
      <button
        type="button"
        class="lobby-banner-poster__close"
        :aria-label="t('UIBackDialog_ticketsbtnClose')"
        @click="posterOpen = false"
      >
        <van-icon name="cross" aria-hidden="true" />
      </button>
    </van-popup>
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
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.76);
  font-size: clamp(16px, 0.48rem, 24px);
  text-shadow: 0 1px 4px #0006;
  pointer-events: none;
}

.lobby-banner-poster {
  --poster-close-size: 40px;
  --poster-top: max(12px, var(--app-content-safe-area-top, env(safe-area-inset-top)));
  --poster-right: max(12px, env(safe-area-inset-right));

  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  height: var(--app-viewport-height, 100dvh);
  overflow: hidden;
  padding: calc(var(--poster-top) + var(--poster-close-size) + 8px) var(--poster-right)
    max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  background: transparent;
}

.lobby-banner-poster__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.lobby-banner-poster__close {
  position: absolute;
  top: var(--poster-top);
  right: var(--poster-right);
  display: grid;
  width: var(--poster-close-size);
  height: var(--poster-close-size);
  padding: 0;
  place-items: center;
  border: 1px solid #ffffff4d;
  border-radius: 50%;
  color: #fff;
  background: #ffffff26;
  font-size: 20px;
  cursor: pointer;
}
</style>

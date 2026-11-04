<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLobbyBannerMatch } from '@/composables/useLobbyBannerMatch'
import { t } from '@/i18n'
import type { LobbyBanner } from '@/utils/lobbyBannerAssociation'

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

    const id = await resolveMatch(banner.clubId, banner.association.templateId)
    if (id && isCurrent()) await router.push({ name: 'mtt-detail', query: { id: String(id) } })
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
    </component>

    <van-popup
      v-if="posterUrl"
      v-model:show="posterOpen"
      teleport="body"
      close-on-popstate
      position="bottom"
      class="lobby-banner-poster"
    >
      <div class="lobby-banner-poster__bar">
        <button type="button" @click="posterOpen = false">
          {{ t('UIBackDialog_ticketsbtnClose') }}
        </button>
      </div>
      <div class="lobby-banner-poster__image">
        <img :src="posterUrl" :alt="t('UISNG_CreateSNGPoster')" />
      </div>
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

.lobby-banner-poster {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #151515;
}

.lobby-banner-poster__bar {
  flex: none;
  padding: max(12px, env(safe-area-inset-top)) 12px 12px;
  text-align: right;
}

.lobby-banner-poster__bar button {
  padding: 6px 14px;
  border: 1px solid #fff8;
  border-radius: 16px;
  color: #fff;
  background: #333;
  cursor: pointer;
}

.lobby-banner-poster__image {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-bottom: env(safe-area-inset-bottom);
}

.lobby-banner-poster__image img {
  display: block;
  max-width: none;
  margin-inline: auto;
}
</style>

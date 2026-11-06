<script setup lang="ts">
import { t } from '@/i18n'

defineProps<{ src: string; open: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <van-popup
    v-if="src"
    :show="open"
    :duration="0"
    teleport="body"
    close-on-popstate
    class="lobby-banner-poster"
    :aria-label="t('UISNG_CreateSNGPoster')"
    @update:show="(show: boolean) => { if (!show) emit('close') }"
    @click.self="emit('close')"
  >
    <img class="lobby-banner-poster__image" :src="src" :alt="t('UISNG_CreateSNGPoster')" />
    <button
      type="button"
      class="lobby-banner-poster__close"
      :aria-label="t('UIBackDialog_ticketsbtnClose')"
      @click="emit('close')"
    >
      <van-icon name="cross" aria-hidden="true" />
    </button>
  </van-popup>
</template>

<style lang="scss">
.lobby-banner-poster {
  --poster-close-size: 40px;
  --poster-top: max(12px, var(--app-content-safe-area-top, env(safe-area-inset-top)));
  --poster-right: max(12px, env(safe-area-inset-right));

  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: none;
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

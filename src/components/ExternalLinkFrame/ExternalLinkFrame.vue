<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getLocale, t } from '@/i18n'
import {
  EXTERNAL_LINK_FRAME_OPEN_EVENT,
  type ExternalLinkFrameOpenDetail,
} from '@/utils/externalLinkFrame'

const visible = ref(false)
const loading = ref(false)
const frameUrl = ref('')
const frameKey = ref(0)
let previousBodyOverflow = ''

const hostLabel = computed(() => {
  try {
    return new URL(frameUrl.value).host
  } catch {
    return ''
  }
})

const loadingLabel = computed(() => {
  const locale = getLocale()
  if (locale === 'zh') return '載入中…'
  if (locale === 'en') return 'Loading…'
  if (locale === 'pt') return 'Carregando…'
  return '加载中…'
})

function close(): void {
  visible.value = false
  loading.value = false
  frameUrl.value = ''
}

function onOpen(event: Event): void {
  const detail = (event as CustomEvent<ExternalLinkFrameOpenDetail>).detail
  if (!detail?.url) return

  frameUrl.value = detail.url
  frameKey.value += 1
  loading.value = true
  visible.value = true
}

function onKeydown(event: KeyboardEvent): void {
  if (visible.value && event.key === 'Escape') close()
}

watch(visible, (nextVisible) => {
  if (typeof document === 'undefined') return
  if (nextVisible) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
})

onMounted(() => {
  window.addEventListener(EXTERNAL_LINK_FRAME_OPEN_EVENT, onOpen)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener(EXTERNAL_LINK_FRAME_OPEN_EVENT, onOpen)
  window.removeEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = previousBodyOverflow
  }
})
</script>

<template>
  <Teleport to="body">
    <section
      v-if="visible"
      class="external-link-frame"
      role="dialog"
      aria-modal="true"
      :aria-label="hostLabel"
    >
      <iframe
        :key="frameKey"
        class="external-link-frame__content"
        :src="frameUrl"
        :title="hostLabel"
        allow="clipboard-read; clipboard-write; fullscreen"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
        @load="loading = false"
      ></iframe>

      <button
        type="button"
        class="external-link-frame__close"
        :aria-label="t('UIBackDialog_ticketsbtnClose')"
        @click="close"
      >
        <span aria-hidden="true">×</span>
      </button>

      <div v-if="loading" class="external-link-frame__loading" aria-live="polite">
        <span class="external-link-frame__spinner" aria-hidden="true"></span>
        {{ loadingLabel }}
      </div>
    </section>
  </Teleport>
</template>

<style scoped lang="scss">
.external-link-frame {
  position: fixed;
  inset: 0;
  z-index: 10000;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #fff;
}

.external-link-frame__content {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

.external-link-frame__close {
  position: absolute;
  z-index: 1;
  top: calc(env(safe-area-inset-top) + 0.14rem);
  left: calc(env(safe-area-inset-left) + 0.14rem);
  width: 0.66rem;
  height: 0.66rem;
  border: 0;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(20, 20, 20, 0.72);
  box-shadow: 0 0.04rem 0.18rem rgba(0, 0, 0, 0.22);
  font-size: 0.52rem;
  font-weight: 300;
  line-height: 1;
  -webkit-tap-highlight-color: transparent;
}

.external-link-frame__loading {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  min-height: 0.78rem;
  border-radius: 999px;
  padding: 0 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.16rem;
  color: #fff;
  background: rgba(20, 20, 20, 0.76);
  font-size: 0.28rem;
}

.external-link-frame__spinner {
  width: 0.3rem;
  height: 0.3rem;
  border: 0.04rem solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: external-link-frame-spin 0.8s linear infinite;
}

@keyframes external-link-frame-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

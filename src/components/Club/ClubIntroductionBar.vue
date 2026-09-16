<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useHomeAnnouncement } from '@/composables/useHomeAnnouncement'
import { t } from '@/i18n'

const props = withDefaults(defineProps<{ standalone?: boolean }>(), {
  standalone: false,
})

const noticeScrollRef = ref<HTMLElement | null>(null)
const noticeItemRef = ref<HTMLElement | null>(null)
const shouldScrollNotice = ref(false)
const noticeDistancePx = ref(0)
const noticeDurationSec = ref(0)
const { noticeText, ensureHomeAnnouncementConfig } = useHomeAnnouncement()

const NOTICE_SPEED_PX_PER_SEC = 40
const NOTICE_GAP_PX = 48
let resizeObserver: ResizeObserver | null = null

const noticeTrackStyle = computed<CSSProperties>(() => ({
  '--notice-gap': `${NOTICE_GAP_PX}px`,
  '--notice-distance': `${noticeDistancePx.value}px`,
  '--notice-duration': `${noticeDurationSec.value}s`,
}))

async function updateMarquee(): Promise<void> {
  await nextTick()
  const containerWidth = noticeScrollRef.value?.clientWidth || 0
  const itemWidth = noticeItemRef.value?.scrollWidth || 0

  if (!containerWidth || !itemWidth || itemWidth <= containerWidth) {
    shouldScrollNotice.value = false
    noticeDistancePx.value = 0
    noticeDurationSec.value = 0
    return
  }

  const distance = itemWidth + NOTICE_GAP_PX
  noticeDistancePx.value = distance
  noticeDurationSec.value = Number((distance / NOTICE_SPEED_PX_PER_SEC).toFixed(3))
  shouldScrollNotice.value = true
}

watch(noticeText, () => void updateMarquee())

onMounted(() => {
  void ensureHomeAnnouncementConfig().finally(() => updateMarquee())
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => void updateMarquee())
    if (noticeScrollRef.value) resizeObserver.observe(noticeScrollRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div class="club-introduction" :class="{ 'club-introduction--standalone': props.standalone }">
    <img class="club-introduction__icon" src="@/assets/icons/icon_notice.svg" :alt="t('Serverbulletin')" />
    <div class="club-introduction__marquee">
      <span class="club-introduction__label">{{ $txt('Serverbulletin') }}:</span>
      <div ref="noticeScrollRef" class="club-introduction__scroll">
        <div
          class="club-introduction__track"
          :class="{ 'is-scroll': shouldScrollNotice }"
          :style="noticeTrackStyle"
        >
          <span ref="noticeItemRef" class="club-introduction__item">{{ noticeText }}</span>
          <span v-if="shouldScrollNotice" class="club-introduction__item" aria-hidden="true">
            {{ noticeText }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-introduction {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  height: 0.5rem;
  min-height: 0.5rem;
  padding: 0 0.18rem;
  box-sizing: border-box;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  border-radius: 1rem;
  background: rgba(170, 170, 170, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
}

.club-introduction--standalone {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  margin: 0.24rem 0.38rem 0;
}

.club-introduction__icon {
  width: 0.43rem;
  height: 0.43rem;
  flex-shrink: 0;
  filter: brightness(0) invert(1);
}

.club-introduction__marquee {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.club-introduction__label {
  margin-right: 0.1rem;
  flex-shrink: 0;
  color: #f9f9f9;
  font-size: 0.28rem;
  white-space: nowrap;
}

.club-introduction__scroll {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.club-introduction__track {
  display: inline-flex;
  align-items: center;
  min-width: max-content;
  gap: var(--notice-gap, 48px);
  white-space: nowrap;
  will-change: transform;
}

.club-introduction__track.is-scroll {
  animation: club-introduction-scroll var(--notice-duration, 16s) linear infinite;
}

.club-introduction__item {
  color: #f9f9f9;
  font-size: 0.28rem;
  font-weight: 400;
  line-height: 0.6rem;
  white-space: nowrap;
}

@keyframes club-introduction-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-1 * var(--notice-distance, 0px)));
  }
}
</style>

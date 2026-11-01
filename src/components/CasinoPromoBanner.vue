<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useCachedImages } from '@/utils/imageCache'

const props = withDefaults(
  defineProps<{
    images: string[]
    fallbackImage: string
    loaded: boolean
    autoplayDuration?: number
    transitionDuration?: number
  }>(),
  {
    autoplayDuration: 3500,
    transitionDuration: 500,
  },
)

const imageUrls = computed(() => [
  ...new Set(props.images.map((url) => url.trim()).filter(Boolean)),
])
const cachedImageUrls = useCachedImages(() => imageUrls.value)

const banners = computed(() => {
  const fallback = props.loaded ? [props.fallbackImage] : []
  return (imageUrls.value.length ? imageUrls.value : fallback).map((img, index) => ({
    id: `${index}-${img}`,
    img,
  }))
})

const count = computed(() => banners.value.length)
const loop = computed(() => count.value > 1)
const COPIES = 3

const slides = computed(() => {
  if (!loop.value) return banners.value.map((b, i) => ({ ...b, key: `${b.id}-${i}` }))
  const out: Array<(typeof banners.value)[number] & { key: string }> = []
  for (let c = 0; c < COPIES; c++) {
    banners.value.forEach((b, i) => out.push({ ...b, key: `${b.id}-${c}-${i}` }))
  }
  return out
})

const position = ref(loop.value ? count.value : 0)
const transitionMs = ref(0)
const dragOffset = ref(0)
const isDragging = ref(false)
const isAnimating = ref(false)
const isImageReady = ref(props.loaded)
const progressKey = ref(0)
const viewportRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)

let autoplayTimer: ReturnType<typeof setTimeout> | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null

let pointerId: number | null = null
let startX = 0
let startY = 0
let axisLocked: 'x' | 'y' | null = null
let dragStartOffset = 0
let lastMoveX = 0
let lastMoveT = 0
let velocityX = 0

const trackStyle = computed(() => ({
  transform: `translate3d(calc(${-position.value * 100}% + ${dragOffset.value}px), 0, 0)`,
  transitionDuration: `${transitionMs.value}ms`,
}))

function clearTimers() {
  if (autoplayTimer) {
    clearTimeout(autoplayTimer)
    autoplayTimer = null
  }
  if (settleTimer) {
    clearTimeout(settleTimer)
    settleTimer = null
  }
}

function scheduleNext() {
  if (autoplayTimer) clearTimeout(autoplayTimer)
  if (!loop.value || !isImageReady.value) return
  autoplayTimer = setTimeout(() => goTo(position.value + 1), props.autoplayDuration)
}

function normalize(pos: number) {
  let p = pos
  while (p < count.value) p += count.value
  while (p >= 2 * count.value) p -= count.value
  return p
}

function viewportWidth() {
  return viewportRef.value?.clientWidth || 1
}

function goTo(target: number, durationMs = props.transitionDuration) {
  if (!loop.value) return
  const clamped = Math.max(0, Math.min(COPIES * count.value - 1, target))
  isAnimating.value = true
  transitionMs.value = durationMs
  dragOffset.value = 0
  position.value = clamped
  progressKey.value++

  if (settleTimer) clearTimeout(settleTimer)
  settleTimer = setTimeout(() => {
    transitionMs.value = 0
    position.value = normalize(position.value)
    isAnimating.value = false
    scheduleNext()
  }, durationMs)
}

function currentTrackOffset(): number {
  const el = trackRef.value
  if (!el) return -position.value * viewportWidth() + dragOffset.value
  const transform = getComputedStyle(el).transform
  if (!transform || transform === 'none') return -position.value * viewportWidth() + dragOffset.value
  const matrix = new DOMMatrixReadOnly(transform)
  return Number.isFinite(matrix.m41) ? matrix.m41 : -position.value * viewportWidth()
}

function releasePointer(id: number) {
  const el = viewportRef.value
  if (el && el.hasPointerCapture(id)) {
    el.releasePointerCapture(id)
  }
}

function onPointerDown(e: PointerEvent) {
  if (!loop.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  pointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  lastMoveX = e.clientX
  lastMoveT = performance.now()
  velocityX = 0
  axisLocked = null
  isDragging.value = false
  clearTimers()

  if (isAnimating.value) {
    const offset = currentTrackOffset()
    transitionMs.value = 0
    dragOffset.value = offset + position.value * viewportWidth()
    isAnimating.value = false
  }
  dragStartOffset = dragOffset.value
  viewportRef.value?.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (pointerId !== e.pointerId) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY

  if (!axisLocked) {
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
    axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (axisLocked === 'y') {
      releasePointer(e.pointerId)
      pointerId = null
      resumeAfterPointer()
      return
    }
    isDragging.value = true
    transitionMs.value = 0
  }

  if (axisLocked === 'x') {
    const now = performance.now()
    const dt = now - lastMoveT
    if (dt >= 8) {
      const instant = (e.clientX - lastMoveX) / dt
      velocityX = velocityX * 0.6 + instant * 0.4
      lastMoveX = e.clientX
      lastMoveT = now
    }
    const width = viewportWidth()
    const maxRight = position.value * width
    const maxLeft = -(COPIES * count.value - 1 - position.value) * width
    dragOffset.value = Math.max(maxLeft, Math.min(maxRight, dragStartOffset + dx))
  }
}

function settleFromOffset() {
  const width = viewportWidth()
  const pos = position.value - dragOffset.value / width
  const stale = performance.now() - lastMoveT > 120
  let target = Math.round(pos)
  if (!stale && Math.abs(velocityX) > 0.35) {
    target = velocityX < 0 ? Math.ceil(pos) : Math.floor(pos)
  }
  const remaining = Math.abs(target - pos) * width
  const duration = Math.max(180, Math.round(props.transitionDuration * Math.min(1, remaining / width)))
  goTo(target, duration)
}

function resumeAfterPointer() {
  if (dragOffset.value !== 0) {
    settleFromOffset()
  } else {
    scheduleNext()
  }
}

function finishDrag(e: PointerEvent) {
  if (pointerId !== e.pointerId) return
  pointerId = null
  releasePointer(e.pointerId)

  if (!isDragging.value) {
    resumeAfterPointer()
    return
  }
  isDragging.value = false
  settleFromOffset()
}

function onPointerCancel(e: PointerEvent) {
  if (pointerId !== e.pointerId) return
  pointerId = null
  if (isDragging.value) {
    isDragging.value = false
    velocityX = 0
    settleFromOffset()
  } else {
    resumeAfterPointer()
  }
}

function imageSource(url: string) {
  const index = imageUrls.value.indexOf(url)
  return index < 0 ? url : cachedImageUrls.value[index] || url
}

function onImageLoad(index: number) {
  if (isImageReady.value || index !== position.value) return
  isImageReady.value = true
  progressKey.value++
  scheduleNext()
}

function useFallbackImage(event: Event) {
  const image = event.target as HTMLImageElement
  if (image.getAttribute('src') === props.fallbackImage) return
  image.src = props.fallbackImage
}

watch(banners, () => {
  clearTimers()
  transitionMs.value = 0
  dragOffset.value = 0
  isAnimating.value = false
  position.value = loop.value ? count.value : 0
  progressKey.value++
  scheduleNext()
})

onMounted(() => {
  scheduleNext()
})

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<template>
  <div class="casino-promo-banner-container">
    <div
      ref="viewportRef"
      class="banner-viewport"
      :class="{ 'is-dragging': isDragging, 'is-static': !loop }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="finishDrag"
      @pointercancel="onPointerCancel"
      @lostpointercapture="onPointerCancel"
    >
      <div ref="trackRef" class="banner-track" :class="{ 'is-ready': isImageReady }" :style="trackStyle">
        <div
          v-for="(slide, index) in slides"
          :key="slide.key"
          class="banner-slide"
          :class="{ 'is-active': index === position }"
        >
          <img
            :src="imageSource(slide.img)"
            alt=""
            class="banner-img"
            draggable="false"
            @load="onImageLoad(index)"
            @error="useFallbackImage"
          />
        </div>
      </div>

      <div v-if="loop && isImageReady" class="banner-progress-track">
        <div
          :key="progressKey"
          class="banner-progress-bar"
          :class="{ 'is-paused': isDragging }"
          :style="{
            animationDuration: `${props.autoplayDuration}ms`,
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.casino-promo-banner-container {
  margin: 0.1538rem 0.2308rem 0;
  position: relative;
  user-select: none;
}

.banner-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 372 / 69;
  border-radius: 0.2564rem;
  border: 0.5px solid #00ffbc;
  box-sizing: border-box;
  overflow: hidden;
  touch-action: pan-y;
  cursor: grab;

  &.is-dragging {
    cursor: grabbing;
  }

  &.is-static {
    cursor: default;
  }
}

.banner-track {
  display: flex;
  width: 100%;
  height: 100%;
  will-change: transform;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
}

.banner-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;
  background: #181b24;
  opacity: 0;
  transition: opacity 0.35s ease-in-out;

  .banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center bottom;
    display: block;
    pointer-events: none;
    -webkit-user-drag: none;
  }
}

:root[data-theme='light'] .banner-viewport {
  border-width: 1px;
}

.banner-track.is-ready .banner-slide {
  opacity: 1;
}

// ── Glowing Bottom Progress Bar ──
.banner-progress-track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2.5px;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
  z-index: 4;
}

.banner-progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #60a5fa, #c084fc, #f472b6);
  box-shadow: 0 0 6px rgba(192, 132, 252, 0.85);
  animation-name: progressFill;
  animation-timing-function: linear;
  animation-fill-mode: forwards;

  &.is-paused {
    animation-play-state: paused;
  }
}

@keyframes progressFill {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}
</style>


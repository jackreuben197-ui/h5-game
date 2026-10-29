<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import bannerYangduoduo from '@/assets/images/banner_yangduoduo.png'
import bannerVipBonus from '@/assets/images/banner_vip_bonus.png'
import bannerIphoneDuo from '@/assets/images/casino_banner_iphone_duo.png'

const props = withDefaults(
  defineProps<{
    autoplayDuration?: number
    transitionDuration?: number
  }>(),
  {
    autoplayDuration: 3500,
    transitionDuration: 500,
  },
)

const banners = [
  {
    id: 'iphone_duo',
    img: bannerIphoneDuo,
    alt: 'iPhone Duo 免费赛 总奖池 32,888',
    link: '#',
  },
  {
    id: 'yangduoduo',
    img: bannerYangduoduo,
    alt: '羊多多交流群领3.8万(金币)',
    link: '#',
  },
  {
    id: 'vip_bonus',
    img: bannerVipBonus,
    alt: 'VIP 每周一1888 每月三号5888',
    link: '#',
  },
]

const count = banners.length
const loop = count > 1
const COPIES = 3

const slides = computed(() => {
  if (!loop) return banners.map((b, i) => ({ ...b, key: `${b.id}-${i}` }))
  const out: Array<(typeof banners)[number] & { key: string }> = []
  for (let c = 0; c < COPIES; c++) {
    banners.forEach((b, i) => out.push({ ...b, key: `${b.id}-${c}-${i}` }))
  }
  return out
})

const position = ref(loop ? count : 0)
const transitionMs = ref(0)
const dragOffset = ref(0)
const isDragging = ref(false)
const isAnimating = ref(false)
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
  autoplayTimer = setTimeout(() => goTo(position.value + 1), props.autoplayDuration)
}

function normalize(pos: number) {
  let p = pos
  while (p < count) p += count
  while (p >= 2 * count) p -= count
  return p
}

function viewportWidth() {
  return viewportRef.value?.clientWidth || 1
}

function goTo(target: number, durationMs = props.transitionDuration) {
  if (!loop) return
  const clamped = Math.max(0, Math.min(COPIES * count - 1, target))
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
  if (!loop) return
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
    const maxLeft = -(COPIES * count - 1 - position.value) * width
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
      :class="{ 'is-dragging': isDragging }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="finishDrag"
      @pointercancel="onPointerCancel"
      @lostpointercapture="onPointerCancel"
    >
      <div ref="trackRef" class="banner-track" :style="trackStyle">
        <div
          v-for="(slide, index) in slides"
          :key="slide.key"
          class="banner-slide"
          :class="{ 'is-active': index === position }"
        >
          <img :src="slide.img" :alt="slide.alt" class="banner-img" draggable="false" />
        </div>
      </div>

      <div class="banner-progress-track">
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
  background: #181b24;
  touch-action: pan-y;
  cursor: grab;

  &.is-dragging {
    cursor: grabbing;
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


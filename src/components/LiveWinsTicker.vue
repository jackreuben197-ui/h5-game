<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, shallowRef, watch } from 'vue'
// @ts-ignore
import cowboyBlueSvg from '@/assets/images/minigame-newui/德州牛仔.png'
import headingBg from '@/assets/images/live_wins_heading_bg.svg'
import headingArrow from '@/assets/images/live_wins_heading_arrow.svg'
import { useTextI18n } from '@/i18n/useTextI18n'

export interface LiveWinItem {
  id: string | number
  gameId?: number
  gameTitle: string
  gameIcon?: string
  platformTag?: string
  username: string
  finalAmount: number // Target amount configured
  tag?: string // e.g. "x14.4", "x10.2", "x26.6", or "" / undefined for blank tag
}

const props = withDefaults(
  defineProps<{
    items: LiveWinItem[]
    slideInterval?: number // Pause between slides in ms (slow and steady: 3800ms)
    slideSpeed?: number // Slide transition duration in ms (slow and steady: 950ms)
    countDuration?: number // Count-up animation duration in ms (steady: 1850ms)
    currencySymbol?: string
  }>(),
  {
    slideInterval: 2500,
    slideSpeed: 1500,
    countDuration: 3000,
    currencySymbol: '¥',
  },
)

const emit = defineEmits<{
  'click-card': [card: LiveWinItem]
}>()

// Internal state representation of each card for animation
interface ActiveCardState {
  raw: LiveWinItem
  displayedAmount: string
  isCounting: boolean
  countPhase: number
  countProgress: number
  showTag: boolean
  showTagBounce: boolean
  currentAmountNum: number
  rafId?: number
  timerId?: ReturnType<typeof setTimeout>
}

// Queue of cards
const cardQueue = ref<ActiveCardState[]>([])

// Container & Sliding References
const trackRef = shallowRef<HTMLElement | null>(null)
const containerRef = shallowRef<HTMLElement | null>(null)
const isSliding = ref(false)
const isRevealing = ref(true)
let revealTimer: ReturnType<typeof setTimeout> | null = null
const slideTranslateX = ref(0)
const CARD_GAP = 3.5
const MIN_QUEUE_LENGTH = 6
const cardStepWidth = ref(160 + CARD_GAP)

// Auto-play timer
let slideTimer: ReturnType<typeof setTimeout> | null = null

// Formatting helper: exactly 2 decimal places with comma separation
function formatCurrency(val: number): string {
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Initialize card queue from source items
function initQueue() {
  const source = props.items
  const copies = Math.ceil(MIN_QUEUE_LENGTH / Math.max(1, source.length))
  const items = Array.from({ length: copies }, (_, copy) =>
    source.map((item) => ({ ...item, id: `${item.id}-${copy}` })),
  ).flat()
  cardQueue.value = items.map((item) => ({
    raw: item,
    displayedAmount: formatCurrency(item.finalAmount),
    isCounting: false,
    countPhase: 0,
    countProgress: 0,
    showTag: !!item.tag && item.tag.trim() !== '',
    showTagBounce: false,
    currentAmountNum: item.finalAmount,
  }))
}

// Calculate responsive step width (2 cards visible simultaneously with 6px gap)
function updateCardDimensions() {
  const el = containerRef.value
  if (!el) return
  const style = getComputedStyle(el)
  const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  const availableWidth = el.clientWidth - horizontalPadding
  if (availableWidth <= 0) return
  const nextStep = (availableWidth - CARD_GAP) / 2 + CARD_GAP
  if (Math.abs(nextStep - cardStepWidth.value) < 0.5) return
  cardStepWidth.value = nextStep
  if (!isSliding.value && !isDragging.value) slideTranslateX.value = 0
}

let resizeObserver: ResizeObserver | null = null

function hasTag(tag?: string) {
  return !!tag && tag.trim() !== ''
}

function tagLabel(tag?: string) {
  if (!tag) return ''
  return `X ${tag.trim().replace(/^[xX×]\s*/, '')}`
}

function animateCardEntry(card: ActiveCardState) {
  if (card.rafId) cancelAnimationFrame(card.rafId)
  if (card.timerId) clearTimeout(card.timerId)

  const targetAmount = card.raw.finalAmount
  const startAmount = Math.max(0, targetAmount * 0.26)
  const duration = props.countDuration

  card.isCounting = true
  card.countPhase = 1
  card.countProgress = 0
  card.currentAmountNum = startAmount
  card.displayedAmount = formatCurrency(startAmount)

  if (!hasTag(card.raw.tag)) {
    card.showTag = false
    card.showTagBounce = false
  } else {
    card.showTag = false
    card.showTagBounce = false
    card.timerId = setTimeout(() => {
      card.showTag = true
      card.showTagBounce = true
    }, TAG_POP_DELAY)
  }

  const startTime = performance.now()
  const pulseStep = duration / 3
  let pulsesFired = 0

  const step = (now: number) => {
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / duration)
    const currentVal = startAmount + (targetAmount - startAmount) * progress

    const pulsesDue = Math.min(3, Math.floor((elapsed + PULSE_LEAD) / pulseStep))
    if (pulsesDue > pulsesFired) {
      pulsesFired = pulsesDue
      pulseAmount(card.raw.id)
    }

    card.currentAmountNum = currentVal
    card.displayedAmount = formatCurrency(currentVal)
    card.countPhase = progress < 1 / 3 ? 1 : progress < 2 / 3 ? 2 : 3
    card.countProgress = progress

    if (progress < 1) {
      card.rafId = requestAnimationFrame(step)
    } else {
      card.currentAmountNum = targetAmount
      card.displayedAmount = formatCurrency(targetAmount)
      card.isCounting = false
      card.countPhase = 0
      card.rafId = undefined
    }
  }

  card.rafId = requestAnimationFrame(step)
}

const TAG_POP_DELAY = 2800
const PULSE_LEAD = 120
const PULSE_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.35)', offset: 0.45 },
  { transform: 'scale(1)' },
]

const amountEls = new Map<string | number, HTMLElement>()

function setAmountEl(id: string | number, el: unknown) {
  if (el instanceof HTMLElement) amountEls.set(id, el)
  else amountEls.delete(id)
}

function pulseAmount(id: string | number) {
  const el = amountEls.get(id)
  if (!el || typeof el.animate !== 'function') return
  el.animate(PULSE_KEYFRAMES, { duration: 400, easing: 'ease-in-out' })
}

const transitionMs = ref(0)
const isDragging = ref(false)
const VISIBLE_CARDS = 2
let dragMoved = false
let pointerId: number | null = null
let startX = 0
let startY = 0
let axisLocked: 'x' | 'y' | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null
let dragBase = 0
let lastMoveX = 0
let lastMoveT = 0
let velocityX = 0
let revealed = new Set<number>()

function rotateForward(count: number) {
  for (let i = 0; i < count; i++) {
    const shifted = cardQueue.value.shift()
    if (shifted) cardQueue.value.push(shifted)
  }
}

function rotateBackward(count: number) {
  for (let i = 0; i < count; i++) {
    const last = cardQueue.value.pop()
    if (last) cardQueue.value.unshift(last)
  }
}

function clearSettle() {
  if (settleTimer) {
    clearTimeout(settleTimer)
    settleTimer = null
  }
}

function resetTrack() {
  transitionMs.value = 0
  slideTranslateX.value = 0
  isSliding.value = false
}

function scheduleNextSlide() {
  if (slideTimer) clearTimeout(slideTimer)
  slideTimer = setTimeout(() => {
    triggerSlide()
  }, props.slideInterval)
}

function triggerSlide() {
  if (isSliding.value || pointerId !== null || cardQueue.value.length < 3) return
  isSliding.value = true

  const incomingCard = cardQueue.value[VISIBLE_CARDS]
  if (incomingCard) {
    animateCardEntry(incomingCard)
  }

  transitionMs.value = props.slideSpeed
  slideTranslateX.value = -cardStepWidth.value

  clearSettle()
  settleTimer = setTimeout(() => {
    rotateForward(1)
    resetTrack()
    scheduleNextSlide()
  }, props.slideSpeed)
}

function currentTrackOffset(): number {
  const el = trackRef.value
  if (!el) return slideTranslateX.value
  const transform = getComputedStyle(el).transform
  if (!transform || transform === 'none') return slideTranslateX.value
  const matrix = new DOMMatrixReadOnly(transform)
  return Number.isFinite(matrix.m41) ? matrix.m41 : slideTranslateX.value
}

function visibleRange(): [number, number] {
  const step = cardStepWidth.value
  const first = Math.max(0, Math.floor(-slideTranslateX.value / step))
  const last = Math.min(
    cardQueue.value.length - 1,
    Math.ceil(-slideTranslateX.value / step) + VISIBLE_CARDS - 1,
  )
  return [first, last]
}

function revealVisible(animate: boolean) {
  const [first, last] = visibleRange()
  for (let i = first; i <= last; i++) {
    if (revealed.has(i)) continue
    revealed.add(i)
    if (animate) {
      const card = cardQueue.value[i]
      if (card) animateCardEntry(card)
    }
  }
}

function settleTo(idx: number) {
  const step = cardStepWidth.value
  const maxIdx = cardQueue.value.length - VISIBLE_CARDS
  const finalIdx = Math.max(0, Math.min(maxIdx, idx))
  const target = -finalIdx * step
  const remaining = Math.abs(target - slideTranslateX.value)
  const duration =
    remaining < 1 ? 0 : Math.max(160, Math.round(props.slideSpeed * Math.min(1, remaining / step)))

  for (let i = finalIdx; i < finalIdx + VISIBLE_CARDS; i++) {
    if (revealed.has(i)) continue
    revealed.add(i)
    const card = cardQueue.value[i]
    if (card) animateCardEntry(card)
  }

  isSliding.value = true
  transitionMs.value = duration
  slideTranslateX.value = target

  clearSettle()
  settleTimer = setTimeout(() => {
    rotateForward(finalIdx)
    resetTrack()
    scheduleNextSlide()
  }, duration)
}

function resumeAfterPointer() {
  if (slideTranslateX.value !== 0) {
    settleTo(Math.round(-slideTranslateX.value / cardStepWidth.value))
  } else {
    scheduleNextSlide()
  }
}

function releasePointer(id: number) {
  const el = containerRef.value
  if (el && el.hasPointerCapture(id)) {
    el.releasePointerCapture(id)
  }
}

function onPointerDown(e: PointerEvent) {
  if (cardQueue.value.length < VISIBLE_CARDS + 2) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  pointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  lastMoveX = e.clientX
  lastMoveT = performance.now()
  velocityX = 0
  axisLocked = null
  dragMoved = false
  isDragging.value = false
  if (slideTimer) clearTimeout(slideTimer)

  if (isSliding.value) {
    const offset = currentTrackOffset()
    clearSettle()
    transitionMs.value = 0
    slideTranslateX.value = offset
    isSliding.value = false
  }
  revealed = new Set()
  revealVisible(false)
  containerRef.value?.setPointerCapture(e.pointerId)
}

function beginDrag() {
  isDragging.value = true
  dragMoved = true
  const step = cardStepWidth.value
  const reserve = Math.max(0, Math.floor((cardQueue.value.length - VISIBLE_CARDS) / 2))
  rotateBackward(reserve)
  revealed = new Set([...revealed].map((i) => i + reserve))
  dragBase = slideTranslateX.value - reserve * step
  transitionMs.value = 0
  slideTranslateX.value = dragBase
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
    beginDrag()
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
    const step = cardStepWidth.value
    const minT = -(cardQueue.value.length - VISIBLE_CARDS) * step
    slideTranslateX.value = Math.max(minT, Math.min(0, dragBase + dx))
    revealVisible(true)
  }
}

function finishDrag() {
  const step = cardStepWidth.value
  const pos = -slideTranslateX.value / step
  const stale = performance.now() - lastMoveT > 120
  let idx = Math.round(pos)
  if (!stale && Math.abs(velocityX) > 0.35) {
    idx = velocityX < 0 ? Math.ceil(pos) : Math.floor(pos)
  }
  settleTo(idx)
}

function onPointerUp(e: PointerEvent) {
  if (pointerId !== e.pointerId) return
  pointerId = null
  releasePointer(e.pointerId)

  if (!isDragging.value) {
    resumeAfterPointer()
    return
  }
  isDragging.value = false
  finishDrag()
}

function onPointerCancel(e: PointerEvent) {
  if (pointerId !== e.pointerId) return
  pointerId = null
  if (isDragging.value) {
    isDragging.value = false
    settleTo(Math.round(-slideTranslateX.value / cardStepWidth.value))
  } else {
    resumeAfterPointer()
  }
}

function onCardClick(card: ActiveCardState) {
  if (dragMoved) return
  emit('click-card', card.raw)
}

// Split heading into individual characters for crisp vertical layout
const { t } = useTextI18n()
const headingText = computed(() => t('UIChannelC_LiveWins'))
const headingChars = computed(() => [...headingText.value])
const isStackedHeading = computed(() => /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(headingText.value))

function stopCardAnimations() {
  cardQueue.value.forEach((card) => {
    if (card.rafId) cancelAnimationFrame(card.rafId)
    if (card.timerId) clearTimeout(card.timerId)
  })
}

watch(
  () => JSON.stringify(props.items),
  () => {
    stopCardAnimations()
    initQueue()
  },
)

onMounted(() => {
  initQueue()
  nextTick(() => {
    updateCardDimensions()
    revealTimer = setTimeout(() => {
      isRevealing.value = false
    }, 900)
    if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
      resizeObserver = new ResizeObserver(() => updateCardDimensions())
      resizeObserver.observe(containerRef.value)
    } else {
      window.addEventListener('resize', updateCardDimensions)
    }
    if (cardQueue.value[1]) {
      animateCardEntry(cardQueue.value[1])
    }
    scheduleNextSlide()
  })
})

onBeforeUnmount(() => {
  if (slideTimer) clearTimeout(slideTimer)
  if (settleTimer) clearTimeout(settleTimer)
  if (revealTimer) clearTimeout(revealTimer)
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', updateCardDimensions)
  stopCardAnimations()
})
</script>

<template>
  <div class="live-wins-wrapper">
    <div class="live-wins-box">
      <div class="live-wins-heading">
        <img :src="headingBg" alt="" class="live-wins-heading__bg" draggable="false" />
        <div v-if="isStackedHeading" class="live-wins-heading__text">
          <span v-for="(char, idx) in headingChars" :key="idx" class="live-wins-heading__char">{{ char }}</span>
        </div>
        <div v-else class="live-wins-heading__label">{{ headingText }}</div>
        <img :src="headingArrow" alt="" class="live-wins-heading__arrow" draggable="false" />
      </div>

      <div
        ref="containerRef"
        class="live-wins-viewport"
        :class="{ 'is-dragging': isDragging }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
        @lostpointercapture="onPointerCancel"
      >
        <div
          ref="trackRef"
          class="live-wins-track"
          :class="{ 'is-revealing': isRevealing }"
          :style="{
            transform: `translate3d(${slideTranslateX}px, 0, 0)`,
            transitionDuration: `${transitionMs}ms`,
            gap: `${CARD_GAP}px`,
          }"
        >
          <div
            v-for="(card, index) in cardQueue"
            :key="card.raw.id"
            class="live-win-card"
            :style="{ width: `calc((100% - ${CARD_GAP}px) / 2)`, '--reveal-order': index }"
            @click="onCardClick(card)"
          >
            <div class="live-win-card__body">
              <div class="live-win-card__art">
                <img
                  :src="card.raw.gameIcon || cowboyBlueSvg"
                  :alt="card.raw.gameTitle"
                  draggable="false"
                />
              </div>
              <div class="live-win-card__info">
                <div
                  :ref="(el) => setAmountEl(card.raw.id, el)"
                  v-fit-text="{ maxLines: 1, minScale: 0.7 }"
                  class="live-win-card__amount"
                  :class="card.countPhase ? `is-counting phase-${card.countPhase}` : ''"
                >
                  {{ currencySymbol }} {{ card.displayedAmount }}
                </div>
                <div class="live-win-card__title" :title="card.raw.gameTitle">
                  {{ card.raw.gameTitle }}
                </div>
                <div v-if="card.raw.username" class="live-win-card__user">
                  {{ card.raw.username }}
                </div>
              </div>
            </div>

            <div
              v-if="card.showTag && hasTag(card.raw.tag)"
              class="live-win-card__tag"
              :class="{ 'is-popping': card.showTagBounce }"
            >
              {{ tagLabel(card.raw.tag) }}
            </div>

            <div v-if="card.isCounting" class="live-win-card__progress">
              <div
                class="live-win-card__progress-bar"
                :style="{ width: `${card.countProgress * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.live-wins-wrapper {
  margin: 0.1282rem 0.3077rem 0.1538rem;
  position: relative;
  user-select: none;
  box-sizing: border-box;
}

.live-wins-box {
  display: flex;
  align-items: center;
  gap: 0.0897rem;
  height: 1.641rem;
}

.live-wins-heading {
  position: relative;
  flex-shrink: 0;
  width: 1rem;
  height: 1.641rem;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  &__text {
    position: absolute;
    left: 0.2564rem;
    top: 0.2051rem;
    display: flex;
    flex-direction: column;
    width: 0.3077rem;
  }

  &__label {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0.14rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.5rem;
    font-size: 0.3077rem;
    line-height: 1;
    font-weight: 700;
    color: #000;
    white-space: nowrap;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
  }

  &__char {
    font-size: 0.3077rem;
    line-height: 0.3077rem;
    font-weight: 700;
    color: #000;
    text-align: center;
  }

  &__arrow {
    position: absolute;
    left: 0.7179rem;
    top: 0.7179rem;
    width: 0.1026rem;
    height: 0.1795rem;
    display: block;
    pointer-events: none;
    -webkit-user-drag: none;
  }
}

.live-wins-viewport {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  position: relative;
  touch-action: pan-y;
  cursor: grab;

  &.is-dragging {
    cursor: grabbing;

    .live-win-card,
    .live-win-card:active {
      transform: none;
    }
  }
}

.live-wins-track {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  will-change: transform;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
}

.live-win-card {
  position: relative;
  flex-shrink: 0;
  height: 1.641rem;
  box-sizing: border-box;
  border-radius: 0.1282rem;
  border: 1px solid rgba(235, 235, 235, 0.16);
  background: rgba(255, 255, 255, 0.16);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease;

  .is-revealing > & {
    animation: liveWinCardReveal 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
    animation-delay: calc(var(--reveal-order, 0) * 80ms);
  }

  &:active {
    transform: scale(0.97);
  }

  &__body {
    position: absolute;
    left: 0.1538rem;
    top: 0.1538rem;
    right: 0.1538rem;
    height: 1.3333rem;
    display: flex;
    align-items: center;
    gap: 0.2308rem;
  }

  &__art {
    flex-shrink: 0;
    width: 1.3846rem;
    height: 1.3333rem;
    border-radius: 0.1026rem;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      pointer-events: none;
      -webkit-user-drag: none;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.0769rem;
  }

  &__amount {
    font-family: Arimo, Arial, Helvetica, sans-serif;
    font-size: 0.3846rem;
    line-height: 0.4359rem;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    transform-origin: left center;
    will-change: transform;

    &.is-counting {
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &.phase-1 {
      background-image: linear-gradient(180deg, #a0d911 30.34%, #eaff8f 69.37%);
    }

    &.phase-2 {
      background-image: linear-gradient(180deg, #fadb14 28.04%, #fffb8f 69.37%);
    }

    &.phase-3 {
      background-image: linear-gradient(180deg, #fa8c16 30.34%, #ffd591 69.37%);
    }
  }

  &__title,
  &__user {
    font-size: 0.2051rem;
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.81);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tag {
    position: absolute;
    top: -0.0256rem;
    right: -0.0733rem;
    z-index: 2;
    padding: 0.0492rem 0.2482rem;
    border-radius: 0.1498rem;
    background: #ea366b;
    color: #f3f4f6;
    font-size: 0.2247rem;
    line-height: 0.282rem;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;

    &.is-popping {
      animation: liveWinTagPop 0.5s ease-in-out forwards;
    }
  }

  &__progress {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2.5px;
    background: rgba(255, 255, 255, 0.15);
    overflow: hidden;
  }

  &__progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #60a5fa, #c084fc, #f472b6);
    box-shadow: 0 0 6px rgba(192, 132, 252, 0.85);
  }
}

:root[data-theme='light'] .live-win-card {
  border-color: #ebebeb;
  background: #fff;

  .live-win-card__progress {
    background: rgba(0, 0, 0, 0.06);
  }

  .live-win-card__amount {
    color: #000;
  }

  .live-win-card__title,
  .live-win-card__user {
    color: rgba(0, 0, 0, 0.5);
  }
}

@keyframes liveWinCardReveal {
  0% {
    opacity: 0;
    transform: translate3d(0, 0.2rem, 0);
  }
  100% {
    opacity: 1;
    transform: translateZ(0);
  }
}

@keyframes liveWinTagPop {
  0% {
    opacity: 0;
    transform: translateY(1.0256rem) scale(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-0.2564rem) scale(1.2);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>

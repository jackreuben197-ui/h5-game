<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, shallowRef } from 'vue'
// @ts-ignore
import mahjongImg from '@/assets/images/minigame-newui/麻将胡了.png'
// @ts-ignore
import cowboyBlueSvg from '@/assets/images/minigame-newui/德州牛仔.png'
import kyPokerWide from '@/assets/images/minigame-newui/mustacheman.png'
import legPokerWide from '@/assets/images/minigame-newui/skinnyman.png'
import img1 from '@/assets/images/img1.png'
import gameHarvestImg from '@/assets/images/game_harvest.png'
import gameTigerImg from '@/assets/images/game_tiger.png'
import gameGoldCityImg from '@/assets/images/game_gold_city.png'

export interface LiveWinItem {
  id: string | number
  gameTitle: string
  gameIcon?: string
  platformTag?: string
  username: string
  finalAmount: number // Target amount configured
  tag?: string // e.g. "x14.4", "x10.2", "x26.6", or "" / undefined for blank tag
}

const props = withDefaults(
  defineProps<{
    slideInterval?: number // Pause between slides in ms (slow and steady: 3800ms)
    slideSpeed?: number // Slide transition duration in ms (slow and steady: 950ms)
    countDuration?: number // Count-up animation duration in ms (steady: 1850ms)
    currencySymbol?: string
    headingText?: string
  }>(),
  {
    slideInterval: 3800,
    slideSpeed: 950,
    countDuration: 1850,
    currencySymbol: '¥',
    headingText: '实时爆奖',
  },
)

const emit = defineEmits<{
  'click-card': [card: LiveWinItem]
}>()

// Default sample data matching exactly the reference Figma screenshot & video:
// Card 1: PP电子-奥林匹斯之神 (¥ 30,967.00, tag: x14.4, h***88)
// Card 2: PG电子-赏金大对决 (¥ 30,551.04, tag: x10.2, t***25)
// Card 3: PG电子-大丰收 (¥ 20,000.00, tag: x26.6, s***12)
// Card 4: PG电子-虎虎生财 (¥ 10,840.00, y***87, blank tag test)
// Card 5: PG电子-寻宝黄金城 (¥ 29,100.00, tag: x116.4, q***er)
// Card 6: JDB-星际水果霸Combo (¥ 27,297.67, tag: x26.3, a***11)
const defaultItems: LiveWinItem[] = [
  {
    id: 1,
    gameTitle: 'PP电子-奥林匹斯之神',
    gameIcon: img1,
    platformTag: 'PP',
    username: 'h***88',
    finalAmount: 30967.0,
    tag: 'x14.4',
  },
  {
    id: 2,
    gameTitle: 'PG电子-赏金大对决',
    gameIcon: cowboyBlueSvg,
    platformTag: 'PG',
    username: 't***25',
    finalAmount: 30551.04,
    tag: 'x10.2',
  },
  {
    id: 3,
    gameTitle: 'PG电子-大丰收',
    gameIcon: gameHarvestImg,
    platformTag: 'PG',
    username: 's***12',
    finalAmount: 20000.0,
    tag: 'x26.6',
  },
  {
    id: 4,
    gameTitle: 'PG电子-虎虎生财',
    gameIcon: gameTigerImg,
    platformTag: 'PG',
    username: 'y***87',
    finalAmount: 10840.0,
    tag: '', // Blank tag: tests requirement 3 (no tag displayed & no anim)
  },
  {
    id: 5,
    gameTitle: 'PG电子-寻宝黄金城',
    gameIcon: gameGoldCityImg,
    platformTag: 'PG',
    username: 'q***er',
    finalAmount: 29100.0,
    tag: 'x116.4',
  },
  {
    id: 6,
    gameTitle: 'JDB-星际水果霸Combo',
    gameIcon: img1,
    platformTag: 'JDB',
    username: 'a***11',
    finalAmount: 27297.67,
    tag: 'x26.3',
  },
  {
    id: 7,
    gameTitle: 'CQ9电子-666',
    gameIcon: legPokerWide,
    platformTag: 'CQ9',
    username: 'K***18',
    finalAmount: 13832.51,
    tag: 'x666',
  },
  {
    id: 8,
    gameTitle: 'PG电子-麻将胡了',
    gameIcon: mahjongImg,
    platformTag: 'PG',
    username: 'v***88',
    finalAmount: 48000.0,
    tag: 'x240',
  },
]

// Internal state representation of each card for animation
interface ActiveCardState {
  raw: LiveWinItem
  displayedAmount: string
  isCounting: boolean
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
const slideTranslateX = ref(0)
const cardStepWidth = ref(152) // Responsive width: exactly 2 cards visible with gap

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
  cardQueue.value = defaultItems.map((item) => ({
    raw: item,
    displayedAmount: formatCurrency(item.finalAmount),
    isCounting: false,
    showTag: !!item.tag && item.tag.trim() !== '',
    showTagBounce: false,
    currentAmountNum: item.finalAmount,
  }))
}

// Calculate responsive step width (2 cards visible simultaneously with 6px gap)
function updateCardDimensions() {
  if (!containerRef.value) return
  const availableWidth = containerRef.value.clientWidth
  // Exactly 2 cards per view with 6px gap
  const gap = 6
  const singleCardWidth = Math.max(132, Math.floor((availableWidth - gap) / 2))
  cardStepWidth.value = singleCardWidth + gap
}

/**
 * Requirement 2 & 3: Count-up, bouncing, and coordinated tag animation
 */
function animateCardEntry(card: ActiveCardState, customStartAmount?: number) {
  // Cancel any existing animation on this card
  if (card.rafId) cancelAnimationFrame(card.rafId)
  if (card.timerId) clearTimeout(card.timerId)

  const targetAmount = card.raw.finalAmount
  // Start from ~35% of target amount, closely matching the video
  const startAmount =
    customStartAmount !== undefined ? customStartAmount : Math.max(0, targetAmount * 0.35)
  const duration = props.countDuration

  card.isCounting = true
  card.currentAmountNum = startAmount
  card.displayedAmount = formatCurrency(startAmount)

  const hasValidTag = !!card.raw.tag && card.raw.tag.trim() !== ''
  // Requirement 3: If tag is blank, neither display it nor trigger its animation
  if (!hasValidTag) {
    card.showTag = false
    card.showTagBounce = false
  } else {
    // Hide initially, then pop-in and bounce as amount reaches climax
    card.showTag = false
    card.showTagBounce = false

    // Coordinate tag appearance at ~80% of count-up duration
    const tagTriggerDelay = duration * 0.8
    card.timerId = setTimeout(() => {
      card.showTag = true
      card.showTagBounce = true
    }, tagTriggerDelay)
  }

  const startTime = performance.now()

  const step = (now: number) => {
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / duration)

    // Ease-out cubic curve for natural smooth deceleration
    const easeOutProgress = 1 - Math.pow(1 - progress, 3)
    const currentVal = startAmount + (targetAmount - startAmount) * easeOutProgress

    card.currentAmountNum = currentVal
    card.displayedAmount = formatCurrency(currentVal)

    if (progress < 1) {
      card.rafId = requestAnimationFrame(step)
    } else {
      // END PRECISELY AT CONFIGURED FINAL AMOUNT (cent accuracy)
      card.currentAmountNum = targetAmount
      card.displayedAmount = formatCurrency(targetAmount)
      card.isCounting = false
      card.rafId = undefined
    }
  }

  card.rafId = requestAnimationFrame(step)
}

/**
 * Requirement 1: Slide card right-to-left seamlessly
 * Incoming card starts count-up animation as it glides in from the right!
 */
function triggerSlide() {
  if (isSliding.value || cardQueue.value.length < 3) return
  isSliding.value = true

  // The card at index 2 is entering the view into the right slot!
  // Start its count-up and bounce animation as it slides in!
  const incomingCard = cardQueue.value[2]
  if (incomingCard) {
    animateCardEntry(incomingCard)
  }

  // Translate track by 1 card step to the left
  slideTranslateX.value = -cardStepWidth.value

  setTimeout(() => {
    // Seamless queue shift: move first card to the tail
    const shifted = cardQueue.value.shift()
    if (shifted) {
      cardQueue.value.push(shifted)
    }

    // Reset translation with transition disabled (instant, zero flicker)
    slideTranslateX.value = 0
    isSliding.value = false

    // Schedule next auto slide
    scheduleNextSlide()
  }, props.slideSpeed)
}

function scheduleNextSlide() {
  if (slideTimer) clearTimeout(slideTimer)

  slideTimer = setTimeout(() => {
    triggerSlide()
  }, props.slideInterval)
}

// Split heading into individual characters for crisp vertical layout
const headingChars = computed(() => {
  return props.headingText.split('')
})

onMounted(() => {
  initQueue()
  nextTick(() => {
    updateCardDimensions()
    window.addEventListener('resize', updateCardDimensions)
    // Start initial animations on 2nd card counting up to 30,551.04
    if (cardQueue.value[1]) {
      animateCardEntry(cardQueue.value[1], 12000.0)
    }
    scheduleNextSlide()
  })
})

onBeforeUnmount(() => {
  if (slideTimer) clearTimeout(slideTimer)
  window.removeEventListener('resize', updateCardDimensions)
  cardQueue.value.forEach((card) => {
    if (card.rafId) cancelAnimationFrame(card.rafId)
    if (card.timerId) clearTimeout(card.timerId)
  })
})
</script>

<template>
  <div class="live-wins-wrapper">
    <!-- Main Ticker Banner -->
    <div class="live-wins-ticker-box">
      <!-- 1. Fixed "Live Wins" Heading (Left Side) -->
      <div class="live-wins-heading-col">
        <div class="heading-vertical-text">
          <span v-for="(char, idx) in headingChars" :key="idx" class="heading-char">
            {{ char }}
          </span>
        </div>
      </div>

      <!-- 2. Sliding Viewport (Right Side) -->
      <div ref="containerRef" class="live-wins-viewport">
        <div
          ref="trackRef"
          class="live-wins-track"
          :class="{ 'is-sliding': isSliding }"
          :style="{
            transform: `translate3d(${slideTranslateX}px, 0, 0)`,
            transitionDuration: isSliding ? `${props.slideSpeed}ms` : '0ms',
          }"
        >
          <div
            v-for="(card, index) in cardQueue"
            :key="card.raw.id"
            class="live-win-card clickable-card"
            :class="{
              'active-first': index === 0,
              'active-second': index === 1,
            }"
            :style="{ width: `${cardStepWidth - 6}px` }"
            @click="emit('click-card', card.raw)"
          >
            <!-- Floating Win Tag Pill (Positioned Absolute at Top Right - Never pushed by big amounts!) -->
            <div
              v-if="card.showTag && card.raw.tag && card.raw.tag.trim() !== ''"
              class="win-tag-pill"
              :class="{ 'bounce-in': card.showTagBounce }"
            >
              <span class="tag-multiplier">{{ card.raw.tag }}</span>
              <!-- Glowing Fire Flame Icon -->
              <span class="tag-flame-icon">
                <svg class="flame-svg" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="fireOuterGrad" x1="11" y1="0" x2="11" y2="26" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stop-color="#FFEA00" />
                      <stop offset="25%" stop-color="#FF6B00" />
                      <stop offset="65%" stop-color="#FF1A1A" />
                      <stop offset="100%" stop-color="#B30000" />
                    </linearGradient>
                    <filter id="fireGlowEffect" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="1.2" flood-color="#FF4500" flood-opacity="0.9" />
                    </filter>
                  </defs>
                  <path
                    d="M11 0.5C10.4 3.2 8.5 5.5 6.5 7.8C4 10.5 2.5 13.5 2.5 17C2.5 21.7 6.3 25.5 11 25.5C15.7 25.5 19.5 21.7 19.5 17C19.5 13 17 9.8 14.5 7.2C14.1 6.8 13.6 6.3 13.2 5.8C13.7 7.9 13.1 10.1 11.9 11.6C11.5 10.4 11.6 8.7 12.1 7.4C12.5 6 12.5 4.1 12 2.5C11.6 1.7 11.3 0.9 11 0.5Z"
                    fill="url(#fireOuterGrad)"
                    filter="url(#fireGlowEffect)"
                  />
                  <text x="11" y="19.5" text-anchor="middle" font-size="8" font-weight="900" fill="#FFFFFF" fill-opacity="0.95" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">倍</text>
                </svg>
              </span>
            </div>

            <!-- Game Avatar -->
            <div class="card-avatar-box">
              <img
                :src="card.raw.gameIcon || cowboyBlueSvg"
                :alt="card.raw.gameTitle"
                class="card-avatar-img"
              />
              <span v-if="card.raw.platformTag" class="card-platform-pill">
                {{ card.raw.platformTag }}
              </span>
            </div>

            <!-- Card Content -->
            <div class="card-detail-col">
              <!-- Top Row: Amount (Full width available now - never squished by tag!) -->
              <div class="amount-row">
                <div
                  class="win-amount-wrap"
                  :class="{
                    'is-counting': card.isCounting,
                    'is-settled': !card.isCounting,
                  }"
                >
                  <span class="currency-symbol">{{ currencySymbol }}</span>
                  <span class="amount-number">{{ card.displayedAmount }}</span>
                </div>
              </div>

              <!-- Middle: Game Title -->
              <div class="game-title-text" :title="card.raw.gameTitle">
                {{ card.raw.gameTitle }}
              </div>

              <!-- Bottom: Username -->
              <div class="username-text">
                {{ card.raw.username }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.live-wins-wrapper {
  margin: 6px 12px 6px;
  position: relative;
  user-select: none;
  box-sizing: border-box;
}

// ── Main Ticker Box ──
.live-wins-ticker-box {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
  background: #191c26;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
}

// ── Fixed Left Heading Column ──
.live-wins-heading-col {
  width: 32px;
  height: 100%;
  flex-shrink: 0;
  background: #14161f;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 5;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.3);

  .heading-vertical-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1.05;

    .heading-char {
      font-size: 10px;
      font-weight: 700;
      color: #9aa0b0;
      letter-spacing: -0.5px;
    }
  }
}

// ── Sliding Viewport (Right Side) ──
.live-wins-viewport {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 0 4px;
}

// ── Track ──
.live-wins-track {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  width: 100%;
  height: 100%;
  padding-bottom: 5px;
  box-sizing: border-box;
  will-change: transform;

  &.is-sliding {
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
  }
}

// ── Individual Card ──
.live-win-card {
  flex-shrink: 0;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.025);
  border-radius: 7px;
  position: relative; // Anchor for absolute floating tag!
  overflow: visible;  // Allows floating pill to extend above top!
  box-sizing: border-box;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;

  &:active {
    transform: scale(0.97);
    background: rgba(255, 255, 255, 0.06);
  }
}

// ── Avatar ──
.card-avatar-box {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  background: #252a37;

  .card-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .card-platform-pill {
    position: absolute;
    top: 1px;
    left: 1px;
    font-size: 8px;
    padding: 0 2px;
    background: rgba(0, 0, 0, 0.65);
    color: #d1d5db;
    border-radius: 3px;
    font-weight: 700;
    line-height: 1.1;
    transform: scale(0.85);
    transform-origin: top left;
  }
}

// ── Detail Column ──
.card-detail-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
}

// ── Amount Row ──
.amount-row {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 15px;
  margin-top: 1px;
  overflow: hidden;
}

// ── Win Amount Styles & Bouncing Effect ──
.win-amount-wrap {
  display: inline-flex;
  align-items: baseline;
  gap: 1.5px;
  font-family:
    'DIN Alternate',
    'DIN Next LT Pro',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-weight: 700;
  white-space: nowrap;
  transform-origin: left center;
  transition:
    color 0.35s ease,
    transform 0.25s ease;

  .currency-symbol {
    font-size: 9.5px;
    line-height: 1;
    font-weight: 800;
  }

  .amount-number {
    font-size: 11.5px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  // Settled State: Warm gold/amber color matching screenshot
  &.is-settled {
    color: #f68b36;
    transform: scale(1);
  }

  // Counting & Bouncing State: Vivid bright yellow with rhythmic scale oscillation
  &.is-counting {
    color: #ffe853;
    text-shadow: 0 0 8px rgba(255, 232, 83, 0.6);
    animation: amountBounceAnim 0.32s ease-in-out infinite alternate;
  }
}

// Rhythmic Count-up bouncing keyframes
@keyframes amountBounceAnim {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.14);
  }
}

// ── Win Tag Pill & Bounce In Effect ──
// Positioned absolute floating on top right of the card, elevated above amount so balance is never blocked
.win-tag-pill {
  position: absolute;
  top: -11px;
  right: 3px;
  z-index: 10;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 13.5px;
  padding: 0 4px;
  background: linear-gradient(135deg, rgba(58, 48, 22, 0.96), rgba(38, 32, 14, 0.96));
  border: 0.8px solid rgba(220, 180, 60, 0.85);
  border-radius: 7px 7px 7px 2.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  transform-origin: center bottom;
  box-sizing: border-box;

  .tag-multiplier {
    font-size: 9px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    letter-spacing: -0.2px;
    font-family: 'DIN Alternate', 'DIN Next LT Pro', -apple-system, sans-serif;
  }

  .tag-flame-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    filter: drop-shadow(0 0 2px rgba(255, 69, 0, 0.85));

    .flame-svg {
      width: 10px;
      height: 12px;
      display: block;
      transform-origin: center bottom;
      animation: flameFlicker 1.8s ease-in-out infinite alternate;
    }
  }

  // Requirement 3: Bouncing amplitude and rebound rhythm (elevated upwards, never dipping into numbers)
  &.bounce-in {
    animation: tagBounceInAnim 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
}

@keyframes flameFlicker {
  0% {
    transform: scale(1) rotate(0deg);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.08) rotate(-1.5deg);
    filter: brightness(1.2);
  }
  100% {
    transform: scale(1.02) rotate(1.5deg);
    filter: brightness(1.05);
  }
}

@keyframes tagBounceInAnim {
  0% {
    opacity: 0;
    transform: scale(0.2) translateY(-4px);
  }
  50% {
    opacity: 1;
    transform: scale(1.22) translateY(-3px);
  }
  70% {
    transform: scale(0.94) translateY(0);
  }
  85% {
    transform: scale(1.06) translateY(-1px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// ── Game Title ──
.game-title-text {
  font-size: 9.5px;
  color: #9299a9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.15;
}

// ── Username ──
.username-text {
  font-size: 8.5px;
  color: #5c6273;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.1;
}
</style>

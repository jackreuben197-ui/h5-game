<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'
import { useGameStore } from '@/stores/game'
import iconHome from '@/assets/icons/tabbar_home.png'
import iconClub from '@/assets/icons/tabbar_club.png'
import iconFriendsTable from '@/assets/icons/tabbar_friends_table.png'
import iconMessage from '@/assets/icons/tabbar_message.png'
import iconMine from '@/assets/icons/tabbar_mine.png'
import { t } from '@/i18n'

interface TabItem {
  key: MainTabKey
  label: string
  // 登录态路径
  path: string
  // 未登录态路径（指向 guest mock 页）
  guestPath: string
  icon: string
}

// 底部 5 个主模块入口与路由路径（登录态走 path，未登录态走 guestPath）。
const tabs: TabItem[] = [
  { key: 'home', label: t('UITabbarHome'), path: '/home', guestPath: '/guest/home', icon: iconHome },
  { key: 'club', label: t('UIClub_Info'), path: '/club', guestPath: '/guest/club', icon: iconClub },
  { key: 'friendsTable', label: t('UIMessage_Default'), path: '/friendsTable', guestPath: '/guest/friendsTable', icon: iconFriendsTable },
  { key: 'message', label: t('UIMine_MsgSystemContent'), path: '/message', guestPath: '/guest/message', icon: iconMessage },
  { key: 'mine', label: t('UIMine_title'), path: '/mine', guestPath: '/guest/mine', icon: iconMine },
]

const router = useRouter()
const tabsStore = useMainTabsStore()
const gameStore = useGameStore()

function resolveTabPath(tab: TabItem): string {
  return gameStore.sessionToken ? tab.path : tab.guestPath
}

// 当前激活项索引：用于驱动顶部凸起在 5 个 tab 间平滑移动。
const activeIndex = computed(() => {
  const index = tabs.findIndex((item) => item.key === tabsStore.activeTab)
  return index >= 0 ? index : 0
})

const svgRef = ref<SVGSVGElement | null>(null)
const fillPath = ref('')
const strokePath = ref('')

const BASE_HEIGHT_REM = 1.75
const BUMP_HEIGHT_REM = 0.25
const TOTAL_HEIGHT_REM = BASE_HEIGHT_REM + BUMP_HEIGHT_REM
const TABBAR_WIDTH_REM = 9
const TABBAR_SIDE_PADDING_REM = 0.72
const TAB_COUNT = tabs.length
const BUMP_WIDTH_IN_TAB = 0.9
const TABBAR_Y_OFFSET_REM = 0.08
const BUMP_SIDE_CTRL_RATIO = 0.24
const BUMP_APEX_CTRL_X_RATIO = 0.22
const ANIM_DURATION = 220

let currentCenter: number | null = null
let animFrom = 0
let animTo = 0
let animStart: number | null = null
let rafId: number | null = null

function easeInOutQuart(t: number): number {
  if (t < 0.5) {
    return 8 * t * t * t * t
  }
  return 1 - Math.pow(-2 * t + 2, 4) / 2
}

function getSvgSize(): { width: number; height: number } {
  const rect = svgRef.value?.getBoundingClientRect()
  return {
    width: rect?.width || 360,
    height: rect?.height || 84,
  }
}

function indexToCenter(index: number): number {
  const { width } = getSvgSize()
  const inset = width * (TABBAR_SIDE_PADDING_REM / TABBAR_WIDTH_REM)
  const availableWidth = Math.max(width - inset * 2, 1)
  const tabWidth = availableWidth / TAB_COUNT
  return inset + tabWidth * index + tabWidth / 2
}

// 参考 tabbar-bump.html：构建“底板 + 顶部弧形凸起”的路径。
function buildTabbarPath(bumpCenterX: number): string {
  const { width, height } = getSvgSize()
  const bumpHeight = height * (BUMP_HEIGHT_REM / TOTAL_HEIGHT_REM)
  const yOffset = height * (TABBAR_Y_OFFSET_REM / TOTAL_HEIGHT_REM)
  const apexY = yOffset
  const topY = bumpHeight + yOffset
  const bodyHeight = height - topY
  const cornerRadius = bodyHeight / 2
  const inset = width * (TABBAR_SIDE_PADDING_REM / TABBAR_WIDTH_REM)
  const availableWidth = Math.max(width - inset * 2, 1)
  const bumpWidth = (availableWidth / TAB_COUNT) * BUMP_WIDTH_IN_TAB
  // 凸起中心约束按“tab 有效宽度”计算，避免首尾被圆角挤压导致偏移。
  const minCenter = inset + bumpWidth / 2
  const maxCenter = width - inset - bumpWidth / 2
  const clampedCenter = Math.min(Math.max(bumpCenterX, minCenter), maxCenter)
  const bumpLeft = clampedCenter - bumpWidth / 2
  const bumpRight = clampedCenter + bumpWidth / 2
  const sideControlOffset = bumpWidth * BUMP_SIDE_CTRL_RATIO
  const apexControlOffsetX = bumpWidth * BUMP_APEX_CTRL_X_RATIO

  const safeLeft = Math.max(cornerRadius, bumpLeft)
  const safeRight = Math.min(width - cornerRadius, bumpRight)

  let d = `M ${cornerRadius} ${topY}`
  d += ` L ${safeLeft} ${topY}`
  d += ` C ${bumpLeft + sideControlOffset} ${topY}, ${clampedCenter - apexControlOffsetX} ${apexY}, ${clampedCenter} ${apexY}`
  d += ` C ${clampedCenter + apexControlOffsetX} ${apexY}, ${bumpRight - sideControlOffset} ${topY}, ${safeRight} ${topY}`
  d += ` L ${width - cornerRadius} ${topY}`
  d += ` A ${cornerRadius} ${cornerRadius} 0 0 1 ${width} ${topY + cornerRadius}`
  d += ` L ${width} ${height - cornerRadius}`
  d += ` A ${cornerRadius} ${cornerRadius} 0 0 1 ${width - cornerRadius} ${height}`
  d += ` L ${cornerRadius} ${height}`
  // 左侧同样使用精确圆弧，保证两端圆度一致。
  d += ` A ${cornerRadius} ${cornerRadius} 0 0 1 0 ${height - cornerRadius}`
  d += ` L 0 ${topY + cornerRadius}`
  d += ` A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} ${topY}`
  d += ' Z'
  return d
}

function renderPath(bumpCenterX: number): void {
  const path = buildTabbarPath(bumpCenterX)
  fillPath.value = path
  strokePath.value = path
  currentCenter = bumpCenterX
}

function stopAnimation(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  animStart = null
}

function animatePathFrame(now: number): void {
  if (animStart === null) return
  const progress = Math.min((now - animStart) / ANIM_DURATION, 1)
  const easedProgress = easeInOutQuart(progress)
  const center = animFrom + (animTo - animFrom) * easedProgress

  renderPath(center)

  if (progress < 1) {
    rafId = requestAnimationFrame(animatePathFrame)
    return
  }

  stopAnimation()
}

function startPathAnimation(targetIndex: number): void {
  const targetCenter = indexToCenter(targetIndex)
  const fromCenter = currentCenter ?? targetCenter

  if (Math.abs(targetCenter - fromCenter) < 0.5) {
    renderPath(targetCenter)
    return
  }

  animFrom = fromCenter
  animTo = targetCenter
  animStart = performance.now()
  stopAnimation()
  animStart = performance.now()
  rafId = requestAnimationFrame(animatePathFrame)
}

function refreshPathByCurrentTab(): void {
  renderPath(indexToCenter(activeIndex.value))
}

function onTabClick(tab: TabItem): void {
  tabsStore.setActiveTab(tab.key)
  void router.push(resolveTabPath(tab))
}

function handleWindowResize(): void {
  stopAnimation()
  refreshPathByCurrentTab()
}

watch(activeIndex, (newIndex) => {
  if (!svgRef.value) return
  startPathAnimation(newIndex)
})

onMounted(async () => {
  await nextTick()
  refreshPathByCurrentTab()
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  stopAnimation()
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
  <nav
    class="bottom-tab"
    aria-label="底部切换栏"
  >
    <svg
      ref="svgRef"
      class="tabbar-svg"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="tabbar-fill-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            class="tabbar-fill-stop-start"
          />
          <stop
            offset="74.34%"
            class="tabbar-fill-stop-end"
          />
          <stop
            offset="100%"
            class="tabbar-fill-stop-end"
          />
        </linearGradient>
      </defs>
      <path
        :d="fillPath"
        class="tabbar-fill"
      />
      <path
        :d="strokePath"
        class="tabbar-stroke"
      />
    </svg>

    <div class="tabs-row">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab-button"
        :class="{ 'is-active': tabsStore.activeTab === tab.key }"
        @click="onTabClick(tab)"
      >
        <span
          class="tab-icon"
          aria-hidden="true"
        >
          <img
            class="tab-icon-image"
            :src="tab.icon"
            :alt="tab.label"
          />
        </span>
        <span class="tab-label">
          {{ tab.label }}
        </span>
      </button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.bottom-tab {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 0.58rem);
  transform: translateX(-50%);
  z-index: 24;
  width: 9rem;
  height: 2.05rem;
  overflow: visible;
}

.tabbar-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  z-index: 0;
}

.tabbar-fill {
  fill: url('#tabbar-fill-gradient');
  filter: drop-shadow(0 -0.04rem 0.12rem rgba(249, 249, 249, 0.18))
    drop-shadow(0 0.1rem 0.2rem rgba(0, 26, 40, 0.24));
}

.tabbar-stroke {
  fill: none;
  stroke: var(--stroke-nav, rgba(249, 249, 249, 0.4));
  stroke-width: 0.451px;
}

.tabbar-fill-stop-start {
  stop-color: var(--bg-new-nav-start, rgba(7, 17, 95, 0.4));
}

.tabbar-fill-stop-end {
  stop-color: var(--bg-new-nav-end, rgba(18, 18, 18, 0.12));
}

.tabs-row {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1.75rem;
  padding: 0 0.72rem;
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  z-index: 1;
}

.tab-button {
  position: relative;
  flex: 1;
  height: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  color: rgba(250, 252, 255, 0.84);
  padding: 0.0rem 0.06rem 0.08rem;
  border-radius: 0.44rem;
  -webkit-tap-highlight-color: transparent;
}

.tab-button.is-active {
  color: #fff;
}

.tab-icon {
  width: 1rem; /* 固定最终尺寸 */
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  transform-origin: center calc(100% + 0.25rem);
  transform: scale(0.6); /* 0.5 / 0.8 = 0.625 */
  transition: transform 0.22s ease;
}

.tab-button.is-active .tab-icon {
  transform: scale(1);
}

.tab-icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tab-label {
  width: 100%;
  height: 0.62rem;
  margin-top: 0.12rem;
  display: grid;
  place-items: center;
  text-align: center;
  font-size: 0.27rem;
  line-height: 1.15;
  font-weight: 400;
  white-space: normal;
  word-break: break-word;
  overflow: hidden;
  text-wrap: balance;
}
</style>

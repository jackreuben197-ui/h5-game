<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMainTabsStore, type MainTabKey } from '@/stores/mainTabs'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import { useRoomListStore } from '@/stores/roomList'
import { useMttListStore } from '@/stores/mttList'
import { useCasinoStore } from '@/stores/casino'
import { useAppConfigStore } from '@/stores/appConfig'
import { t } from '@/i18n'
import { useChannelMenuVersion } from '@/composables/useChannelMenuVersion'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'
import { filterVisibleMttRecords } from '@/utils/mttVisibility'

type TabIconKey = 'home' | 'club' | 'wallet' | 'friendsTable' | 'message' | 'mine' | 'mtt' | 'casino'

interface TabItem {
  key: MainTabKey
  label: string
  // 登录态路径
  path: string
  // 未登录态路径（指向 guest mock 页）
  guestPath: string
  icon: TabIconKey
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? Math.floor(num) : 0
}

const router = useRouter()
const route = useRoute()
const tabsStore = useMainTabsStore()
const gameStore = useGameStore()
const loginModalStore = useLoginModalStore()
const { isChannelPackage, channelClub, isVersionB } = useChannelMenuVersion()

const roomListStore = useRoomListStore()
const mttListStore = useMttListStore()
const casinoStore = useCasinoStore()
const appConfigStore = useAppConfigStore()


const hasMttData = computed(() => {
  const clubId = toSafeInt(channelClub.value?.club_id)
  const tribeId = toSafeInt(channelClub.value?.tribe_id)
  const visibleRecords = filterVisibleMttRecords(
    mttListStore.records,
    mttListStore.mttIdMetaMap,
    clubId,
    tribeId,
    appConfigStore.clubDisplayPlatformMtt,
  )
  return visibleRecords.length > 0
})

const hasCasinoData = computed(() => {
  const clubId = toSafeInt(channelClub.value?.club_id)
  return clubId > 0 && casinoStore.gameRecords.length > 0
})

async function loadVersionBTabsData() {
  if (!isChannelPackage.value || !isVersionB.value) return
  const clubId = toSafeInt(channelClub.value?.club_id)
  if (clubId <= 0) return

  if (!roomListStore.records.length) {
    void roomListStore.bootstrapRoomList().catch(console.warn)
  }
  if (!mttListStore.records.length) {
    void mttListStore.bootstrapMttList().catch(console.warn)
  }
  if (!casinoStore.gameRecords.length) {
    void casinoStore.preloadCasinoData(clubId, false).catch(console.warn)
  }
}

watch(
  channelClub,
  (newClub) => {
    if (newClub) {
      void loadVersionBTabsData()
    }
  },
  { immediate: true }
)

watch(
  () => [route.meta.tabKey, route.query.tab],
  ([tabKey, queryTab]) => {
    if (route.name === 'guest-home' && isVersionB.value && queryTab) {
      tabsStore.setActiveTab(queryTab as MainTabKey)
    } else if (typeof tabKey === 'string') {
      tabsStore.setActiveTab(tabKey as MainTabKey)
    }
  },
  { immediate: true },
)

// 官方包保留 5 个入口；渠道包将俱乐部能力合并到首页，仅保留 4 个入口。
const tabs = computed<TabItem[]>(() => {
  const isChannel = isChannelPackage.value
  const rechargeTab: TabItem = {
    key: 'wallet',
    label: t('UIGuildFund_RechargeText'),
    path: '/wallet',
    guestPath: '/guest/friendsTable',
    icon: 'wallet',
  }
  const mineTab: TabItem = {
    key: 'mine',
    label: t('UIMine_title'),
    path: '/mine',
    guestPath: '/guest/mine',
    icon: 'mine',
  }

  if (isChannel && isVersionB.value) {
    const list: TabItem[] = []
    
    // Poker (Home)
    list.push({
      key: 'home',
      label: t('UITabbarHome'),
      path: '/home',
      guestPath: '/guest/home',
      icon: 'home',
    })

    // Tournaments (mtt)
    if (hasMttData.value) {
      list.push({
        key: 'mtt',
        label: t('UITabbarEvents'),
        path: '/mttList',
        guestPath: '/guest/home',
        icon: 'mtt',
      })
    }

    // Casino (casino)
    if (hasCasinoData.value) {
      list.push({
        key: 'casino',
        label: t('UICasino_Title'),
        path: '/casino',
        guestPath: '/guest/home',
        icon: 'casino',
      })
    }

    list.push(rechargeTab)
    list.push(mineTab)
    return list
  }

  const middleTab: TabItem = isChannel
    ? rechargeTab
    : {
        key: 'friendsTable',
        label: t('UIMessage_Default'),
        path: '/friendsTable',
        guestPath: '/guest/friendsTable',
        icon: 'friendsTable',
      }

  const homeTab: TabItem = {
    key: 'home',
    label: t('UITabbarHome'),
    path: '/home',
    guestPath: '/guest/home',
    icon: 'home',
  }
  const clubTab: TabItem = {
    key: 'club',
    label: t('UIClub_Info'),
    path: '/club',
    guestPath: '/guest/club',
    icon: 'club',
  }

  return [
    homeTab,
    ...(!isChannel ? [clubTab] : []),
    middleTab,
    {
      key: 'message',
      label: t('UIMine_MsgSystemContent'),
      path: '/message',
      guestPath: '/guest/message',
      icon: 'message',
    },
    mineTab,
  ]
})



function resolveTabPath(tab: TabItem): string {
  if (gameStore.sessionToken) {
    return tab.path
  }
  if (isVersionB.value) {
    if (tab.key === 'mtt') {
      return '/guest/home?tab=mtt'
    }
    if (tab.key === 'casino') {
      return '/guest/home?tab=casino'
    }
  }
  return tab.guestPath
}

// 当前激活项索引：用于驱动顶部凸起在当前 tab 数量间平滑移动。
const activeIndex = computed(() => {
  const index = tabs.value.findIndex((item) => item.key === tabsStore.activeTab)
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
    width: rect?.width && rect.width > 0 ? rect.width : 360,
    height: rect?.height && rect.height > 0 ? rect.height : 84,
  }
}

function indexToCenter(index: number): number {
  const { width } = getSvgSize()
  const inset = width * (TABBAR_SIDE_PADDING_REM / TABBAR_WIDTH_REM)
  const availableWidth = Math.max(width - inset * 2, 1)
  const tabWidth = availableWidth / Math.max(tabs.value.length, 1)
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
  const bumpWidth = (availableWidth / Math.max(tabs.value.length, 1)) * BUMP_WIDTH_IN_TAB
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

  // Ensure control points are strictly monotonic to prevent self-intersecting Bezier loops that spill over the screen
  const c1x = Math.max(safeLeft, Math.min(clampedCenter, bumpLeft + sideControlOffset))
  const c2x = Math.max(c1x, Math.min(clampedCenter, clampedCenter - apexControlOffsetX))
  const c3x = Math.max(clampedCenter, Math.min(safeRight, clampedCenter + apexControlOffsetX))
  const c4x = Math.max(c3x, Math.min(safeRight, bumpRight - sideControlOffset))

  let d = `M ${cornerRadius} ${topY}`
  d += ` L ${safeLeft} ${topY}`
  d += ` C ${c1x} ${topY}, ${c2x} ${apexY}, ${clampedCenter} ${apexY}`
  d += ` C ${c3x} ${apexY}, ${c4x} ${topY}, ${safeRight} ${topY}`
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
  // 渠道包未登录态点击钱包：原地弹出登录框，登录成功后再跳转到钱包
  if (tab.key === 'wallet' && !gameStore.sessionToken) {
    loginModalStore.open(tab.path)
    return
  }
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

watch(
  tabs,
  () => {
    nextTick(() => {
      if (!svgRef.value) return
      refreshPathByCurrentTab()
    })
  },
  { deep: true }
)

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
  <nav class="bottom-tab" data-app-overlay :aria-label="t('UITabbar_Text')">
    <svg
      ref="svgRef"
      class="tabbar-svg"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tabbar-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" class="tabbar-fill-stop-start" />
          <stop offset="74.34%" class="tabbar-fill-stop-end" />
          <stop offset="100%" class="tabbar-fill-stop-end" />
        </linearGradient>
      </defs>
      <path :d="fillPath" class="tabbar-fill" />
      <path :d="strokePath" class="tabbar-stroke" />
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
        <span class="tab-icon" aria-hidden="true">
          <svg
            v-if="tab.icon === 'home'"
            class="tab-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 29 31"
            fill="none"
          >
            <path
              d="M28.5761 11.3549L26.0533 26.6236C25.883 27.6857 25.3482 28.6533 24.5427 29.3567C23.6849 30.0494 22.6193 30.4264 21.5213 30.4255H7.00376C5.94224 30.4161 4.91768 30.0303 4.10876 29.3355C3.29985 28.6407 2.75792 27.6809 2.57749 26.6236L0.0546733 11.3549C-0.0819515 10.4739 0.0388046 9.5718 0.402128 8.7592C0.765329 7.95078 1.35315 7.26648 2.09408 6.78953L11.8832 0.682044C12.5984 0.236141 13.4222 0 14.2625 0C15.1029 0 15.9266 0.236141 16.6418 0.682044L26.4159 6.78953C27.1818 7.24759 27.7921 7.9301 28.1683 8.74393C28.5551 9.55482 28.697 10.463 28.5761 11.3549Z"
              fill="currentColor"
            />
          </svg>
          <svg
            v-else-if="tab.icon === 'club'"
            class="tab-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 19 17"
            fill="none"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M9.33852 1.04961e-08C9.49223 -2.30732e-05 9.64357 0.0380296 9.77911 0.110782C9.91465 0.183534 10.0302 0.288736 10.1155 0.417054L13.357 5.29705L17.2625 2.94468C17.4146 2.85303 17.5896 2.80676 17.767 2.8113C17.9444 2.81584 18.1168 2.871 18.264 2.97032C18.4113 3.06963 18.5273 3.209 18.5985 3.3721C18.6698 3.53519 18.6932 3.71527 18.6661 3.89125L16.7983 16.0748C16.7644 16.2961 16.6528 16.4978 16.4835 16.6436C16.3143 16.7893 16.0987 16.8695 15.8757 16.8696H2.80137C2.57835 16.8695 2.36273 16.7893 2.1935 16.6436C2.02426 16.4978 1.9126 16.2961 1.8787 16.0748L0.0109439 3.89125C-0.0161397 3.71527 0.00729256 3.53519 0.0784973 3.3721C0.149702 3.209 0.265732 3.06963 0.413004 2.97032C0.560275 2.871 0.732692 2.81584 0.910068 2.8113C1.08744 2.80676 1.26244 2.85303 1.41456 2.94468L5.32004 5.29705L8.56153 0.417054C8.64684 0.288736 8.76239 0.183534 8.89793 0.110782C9.03347 0.0380296 9.18481 -2.30732e-05 9.33852 1.04961e-08ZM8.40464 10.3092C8.40464 10.0606 8.50303 9.82225 8.67817 9.64649C8.85331 9.47073 9.09084 9.37199 9.33852 9.37199C9.5862 9.37199 9.82374 9.47073 9.99887 9.64649C10.174 9.82225 10.2724 10.0606 10.2724 10.3092C10.2724 10.5578 10.174 10.7961 9.99887 10.9719C9.82374 11.1477 9.5862 11.2464 9.33852 11.2464C9.09084 11.2464 8.85331 11.1477 8.67817 10.9719C8.50303 10.7961 8.40464 10.5578 8.40464 10.3092ZM9.33852 7.49759C8.9706 7.49759 8.60629 7.57032 8.26638 7.71161C7.92647 7.85291 7.61762 8.06001 7.35747 8.32109C7.09731 8.58217 6.89094 8.89212 6.75015 9.23324C6.60935 9.57436 6.53689 9.93997 6.53689 10.3092C6.53689 10.6784 6.60935 11.044 6.75015 11.3851C6.89094 11.7263 7.09731 12.0362 7.35747 12.2973C7.61762 12.5584 7.92647 12.7655 8.26638 12.9068C8.60629 13.0481 8.9706 13.1208 9.33852 13.1208C10.0816 13.1208 10.7942 12.8246 11.3196 12.2973C11.845 11.77 12.1402 11.0549 12.1402 10.3092C12.1402 9.56351 11.845 8.84837 11.3196 8.32109C10.7942 7.79382 10.0816 7.49759 9.33852 7.49759Z"
              fill="currentColor"
            />
          </svg>
          <svg
            v-else-if="tab.icon === 'wallet'"
            class="tab-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M10.0866 0.0767382C11.1077 -0.176452 12.2127 0.199438 12.7751 1.16663C12.9195 1.41514 13.0778 1.70495 13.2454 2.03838C12.0695 1.96008 10.325 1.88608 7.93459 1.88608C6.5861 1.88608 5.44352 1.90945 4.49214 1.9445C6.2811 1.19272 8.22759 0.537155 10.0866 0.0767382ZM2.53791 17.1122C3.69017 17.1924 5.45939 17.2723 7.93459 17.2723C10.4098 17.2723 12.179 17.1924 13.3313 17.1122C14.6 17.0237 15.601 16.0538 15.7051 14.7665C15.7252 14.5205 15.7446 14.2464 15.7631 13.9442C15.4036 13.9547 14.9886 13.9613 14.5145 13.9613C13.8666 13.9613 13.3286 13.9488 12.8927 13.9313C11.4843 13.8744 10.3471 12.7888 10.2828 11.3344C10.2674 10.9787 10.2569 10.5576 10.2569 10.0661C10.2569 9.57449 10.2674 9.15342 10.2828 8.79778C10.3471 7.3433 11.4843 6.25809 12.8927 6.20083C13.4331 6.17997 13.9738 6.16997 14.5145 6.17083C14.9886 6.17083 15.4036 6.17746 15.7631 6.18797C15.7446 5.88544 15.7252 5.61148 15.7051 5.36608C15.601 4.07831 14.6 3.1084 13.3313 3.01998C12.179 2.93974 10.4098 2.85988 7.93459 2.85988C5.45939 2.85988 3.69017 2.93974 2.53791 3.01998C1.26915 3.1084 0.268228 4.07831 0.164111 5.36569C0.079733 6.40883 0 7.9529 0 10.0661C0 12.1792 0.079733 13.7237 0.164111 14.7665C0.268228 16.0538 1.26915 17.0237 2.53791 17.1122ZM11.4428 11.2826C11.4796 12.1122 12.1152 12.7304 12.9392 12.7635C13.3591 12.7807 13.8813 12.7927 14.5145 12.7927C15.1477 12.7927 15.6699 12.7807 16.0898 12.7635C16.9142 12.7304 17.5494 12.1122 17.5862 11.2826C17.6009 10.9448 17.6109 10.5409 17.6109 10.0661C17.6109 9.59124 17.6009 9.1873 17.5862 8.84959C17.5494 8.0199 16.9138 7.40173 16.0898 7.36862C15.5649 7.34834 15.0397 7.3386 14.5145 7.3394C13.8813 7.3394 13.3591 7.35148 12.9392 7.36862C12.1148 7.40173 11.4796 8.0199 11.4428 8.84959C11.4281 9.1873 11.4181 9.59085 11.4181 10.0661C11.4181 10.5413 11.4281 10.9448 11.4428 11.2826ZM14.1274 9.09226C14.2814 9.09226 14.4291 9.15382 14.538 9.26339C14.6469 9.37297 14.708 9.52158 14.708 9.67655V10.4556C14.708 10.6106 14.6469 10.7592 14.538 10.8687C14.4291 10.9783 14.2814 11.0399 14.1274 11.0399C13.9735 11.0399 13.8258 10.9783 13.7169 10.8687C13.608 10.7592 13.5469 10.6106 13.5469 10.4556V9.67655C13.5469 9.52158 13.608 9.37297 13.7169 9.26339C13.8258 9.15382 13.9735 9.09226 14.1274 9.09226Z"
              fill="currentColor"
            />
          </svg>
          <svg
            v-else-if="tab.icon === 'friendsTable'"
            class="tab-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 38 35"
            fill="none"
          >
            <path
              d="M19.6307 9.5C20.8904 9.5 22.0986 8.99955 22.9894 8.10876C23.8802 7.21796 24.3807 6.00978 24.3807 4.75C24.3807 3.49022 23.8802 2.28204 22.9894 1.39124C22.0986 0.500445 20.8904 0 19.6307 0C18.3709 0 17.1627 0.500445 16.2719 1.39124C15.3811 2.28204 14.8807 3.49022 14.8807 4.75C14.8807 6.00978 15.3811 7.21796 16.2719 8.10876C17.1627 8.99955 18.3709 9.5 19.6307 9.5ZM10.4873 17.9206C10.4501 17.0729 10.5072 16.2208 10.8262 15.4344C10.9915 15.0268 11.1843 14.6332 11.4023 14.2556C11.6446 13.8357 11.4181 13.2845 10.9335 13.2994C10.2431 13.3206 9.56123 13.4924 8.93724 13.8077C8.00057 14.281 6.71996 16.15 6.71996 16.15C6.71996 16.15 5.09681 18.3845 4.27078 19.7884C3.8467 20.5091 4.27789 20.7835 5.08196 20.5537L9.4889 19.2946C10.1146 19.1158 10.5159 18.5708 10.4873 17.9206ZM28.3273 15.3632C28.6878 16.2053 28.8336 17.1569 28.8313 18.073C28.8298 18.6607 29.2018 19.1078 29.7651 19.2755L34.1045 20.5678C34.8442 20.7881 35.2668 20.54 34.9004 19.8606C34.1247 18.4222 32.4671 15.9999 32.4671 15.9999C32.4671 15.9999 31.2624 14.284 30.3269 13.8104C29.5823 13.4335 28.7551 13.2611 27.9292 13.305C27.6331 13.3207 27.4905 13.6635 27.6353 13.9222C27.8815 14.3623 28.1246 14.8898 28.3273 15.3632ZM31.0307 8.55C31.0307 8.92427 30.957 9.29487 30.8137 9.64065C30.6705 9.98643 30.4606 10.3006 30.1959 10.5653C29.9313 10.8299 29.6171 11.0398 29.2713 11.1831C28.9255 11.3263 28.5549 11.4 28.1807 11.4C27.8064 11.4 27.4358 11.3263 27.09 11.1831C26.7442 11.0398 26.4301 10.8299 26.1654 10.5653C25.9008 10.3006 25.6908 9.98643 25.5476 9.64065C25.4044 9.29487 25.3307 8.92427 25.3307 8.55C25.3307 7.79413 25.6309 7.06922 26.1654 6.53475C26.6999 6.00027 27.4248 5.7 28.1807 5.7C28.9365 5.7 29.6614 6.00027 30.1959 6.53475C30.7304 7.06922 31.0307 7.79413 31.0307 8.55ZM11.0807 11.4C11.8365 11.4 12.5614 11.0997 13.0959 10.5653C13.6304 10.0308 13.9307 9.30587 13.9307 8.55C13.9307 7.79413 13.6304 7.06922 13.0959 6.53475C12.5614 6.00027 11.8365 5.7 11.0807 5.7C10.3248 5.7 9.5999 6.00027 9.06542 6.53475C8.53094 7.06922 8.23067 7.79413 8.23067 8.55C8.23067 9.30587 8.53094 10.0308 9.06542 10.5653C9.5999 11.0997 10.3248 11.4 11.0807 11.4ZM13.9307 19C12.8819 19 12.006 18.1355 12.2663 17.119C12.6856 15.4841 13.637 14.0353 14.9705 13.0006C16.304 11.966 17.9438 11.4045 19.6316 11.4045C21.3194 11.4045 22.9592 11.966 24.2927 13.0006C25.6262 14.0353 26.5776 15.4841 26.997 17.119C27.2554 18.1355 26.3814 19 25.3307 19H13.9307Z"
              fill="currentColor"
            />
            <path
              d="M19 20.9004C29.488 20.9004 38 23.8834 38 27.5504C38 30.9894 30.495 33.8394 20.9 34.1624H17.1C7.505 33.8394 0 30.9894 0 27.5504C0 23.8834 8.512 20.9004 19 20.9004Z"
              fill="currentColor"
            />
            <path
              d="M19 23.0498C23.7061 23.0498 27.9583 23.5797 31.0254 24.4316C32.5606 24.8581 33.7845 25.362 34.6191 25.9102C35.464 26.465 35.8506 27.0242 35.8506 27.5498C35.8506 28.0754 35.464 28.6346 34.6191 29.1895C33.7845 29.7376 32.5606 30.2415 31.0254 30.668C27.9583 31.5199 23.7061 32.0498 19 32.0498C14.2941 32.0498 10.0426 31.5199 6.97559 30.668C5.44041 30.2415 4.21651 29.7376 3.38184 29.1895C2.53696 28.6346 2.15039 28.0754 2.15039 27.5498C2.15039 27.0242 2.53696 26.465 3.38184 25.9102C4.21651 25.362 5.44041 24.8581 6.97559 24.4316C10.0426 23.5797 14.2941 23.0498 19 23.0498Z"
              stroke="currentColor"
              stroke-width="0.5"
            />
          </svg>
          <svg
            v-else-if="tab.icon === 'message'"
            class="tab-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 27 21"
            fill="none"
          >
            <path
              d="M1.02423 9.97185C0.458401 6.71064 2.64272 3.60997 5.90335 3.04424L10.5111 2.24479C13.7724 1.67896 16.873 3.86328 17.4387 7.12391C18.0043 10.3834 15.8201 13.4852 12.5595 14.0509L9.08315 14.6541L9.57758 17.5038C9.57758 17.5038 2.29563 17.2998 1.02423 9.97185Z"
              fill="currentColor"
            />
            <path
              d="M14.2285 14.8052C15.2538 15.4983 16.5082 15.7665 17.7273 15.5533L19.4532 15.2538L19.8487 17.5337C19.8487 17.5337 26.0996 15.2752 25.0824 9.41287C24.8651 8.16043 24.1592 7.04561 23.12 6.31358C22.0808 5.58159 20.7934 5.29231 19.5409 5.50947L18.2454 5.73426C18.4135 6.10123 18.5375 6.4958 18.6098 6.91259C19.1992 10.3092 17.2998 13.5627 14.2285 14.8052Z"
              fill="currentColor"
            />
          </svg>
          <svg
            v-else-if="tab.icon === 'mtt'"
            class="tab-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M5.61134 0.00390543H14.3882C15.4266 0.00390543 16.2729 0.855302 16.2337 1.88635C16.2259 2.09334 16.218 2.30033 16.2063 2.50342H18.1497C19.1724 2.50342 20.0736 3.347 19.9952 4.44835C19.7014 8.49834 17.6247 10.7245 15.3717 11.8883C14.7526 12.2086 14.1218 12.4468 13.5223 12.6225C12.7308 13.7395 11.908 14.3292 11.2536 14.6456V17.5005H13.7613C14.4548 17.5005 15.0151 18.059 15.0151 18.7502C15.0151 19.4415 14.4548 20 13.7613 20H6.23826C5.54473 20 4.98442 19.4415 4.98442 18.7502C4.98442 18.059 5.54473 17.5005 6.23826 17.5005H8.74594V14.6456C8.11902 14.3449 7.33929 13.7864 6.57915 12.7592C5.85819 12.5718 5.07454 12.2867 4.31048 11.8571C2.19071 10.6737 0.278604 8.44366 0.00432649 4.44054C-0.0701203 3.3431 0.827159 2.49951 1.84982 2.49951H3.79327C3.78152 2.29643 3.77368 2.09334 3.76585 1.88244C3.72666 0.847491 4.57301 0 5.61134 0V0.00390543ZM3.93433 4.37805H1.88117C2.1241 7.686 3.6483 9.34193 5.21952 10.2207C4.65529 8.76391 4.18902 6.86194 3.93433 4.37805ZM14.8467 10.0332C16.4336 9.10369 17.8676 7.45167 18.1106 4.37805H16.0613C15.8184 6.75649 15.3795 8.60379 14.8467 10.0332Z" fill="currentColor" />
          </svg>
          <svg
            v-else-if="tab.icon === 'casino'"
            class="tab-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M10 20C8.61667 20 7.31667 19.7373 6.1 19.212C4.88334 18.6867 3.825 17.9743 2.925 17.075C2.025 16.1757 1.31267 15.1173 0.788001 13.9C0.263335 12.6827 0.000667933 11.3827 1.26582e-06 10C-0.000665401 8.61733 0.262001 7.31733 0.788001 6.1C1.314 4.88267 2.02633 3.82433 2.925 2.925C3.82367 2.02567 4.882 1.31333 6.1 0.788C7.318 0.262667 8.618 0 10 0C11.382 0 12.682 0.262667 13.9 0.788C15.118 1.31333 16.1763 2.02567 17.075 2.925C17.9737 3.82433 18.6863 4.88267 19.213 6.1C19.7397 7.31733 20.002 8.61733 20 10C19.998 11.3827 19.7353 12.6827 19.212 13.9C18.6887 15.1173 17.9763 16.1757 17.075 17.075C16.1737 17.9743 15.1153 18.687 13.9 19.213C12.6847 19.739 11.3847 20.0013 10 20ZM9 17.925V16.925C8.41667 16.8417 7.85433 16.6833 7.313 16.45C6.77167 16.2167 6.26733 15.9333 5.8 15.6L5.1 16.325C5.65 16.7583 6.25433 17.1127 6.913 17.388C7.57167 17.6633 8.26733 17.8423 9 17.925ZM11 17.925C11.7333 17.8417 12.4293 17.6627 13.088 17.388C13.7467 17.1133 14.3507 16.759 14.9 16.325L14.2 15.6C13.7333 15.9333 13.2293 16.2167 12.688 16.45C12.1467 16.6833 11.584 16.8417 11 16.925V17.925ZM10 15C11.3833 15 12.5627 14.5123 13.538 13.537C14.5133 12.5617 15.0007 11.3827 15 10C14.9993 8.61733 14.5117 7.43833 13.537 6.463C12.5623 5.48767 11.3833 5 10 5C8.61667 5 7.43767 5.48767 6.463 6.463C5.48834 7.43833 5.00067 8.61733 5 10C4.99933 11.3827 5.487 12.562 6.463 13.538C7.439 14.514 8.618 15.0013 10 15ZM16.325 14.9C16.7583 14.35 17.1127 13.746 17.388 13.088C17.6633 12.43 17.8423 11.734 17.925 11H16.925C16.8417 11.5833 16.6833 12.146 16.45 12.688C16.2167 13.23 15.9333 13.734 15.6 14.2L16.325 14.9ZM3.675 14.9L4.4 14.175C4.06667 13.7083 3.78333 13.2083 3.55 12.675C3.31667 12.1417 3.15833 11.5833 3.075 11H2.075C2.15833 11.7333 2.33733 12.429 2.612 13.087C2.88667 13.745 3.241 14.3493 3.675 14.9ZM10 14L7 10L10 6L13 10L10 14ZM2.075 9H3.075C3.15833 8.41667 3.31667 7.85833 3.55 7.325C3.78333 6.79167 4.06667 6.29167 4.4 5.825L3.675 5.1C3.24167 5.65 2.88767 6.25433 2.613 6.913C2.33833 7.57167 2.159 8.26733 2.075 9ZM16.925 9H17.925C17.8417 8.26667 17.6583 7.571 17.375 6.913C17.0917 6.255 16.7333 5.65067 16.3 5.1L15.6 5.8C15.9333 6.26667 16.2167 6.771 16.45 7.313C16.6833 7.855 16.8417 8.41733 16.925 9ZM5.825 4.4C6.29167 4.06667 6.79167 3.78333 7.325 3.55C7.85833 3.31667 8.41667 3.15833 9 3.075V2.075C8.26667 2.15833 7.571 2.33767 6.913 2.613C6.255 2.88833 5.65067 3.24233 5.1 3.675L5.825 4.4ZM14.2 4.4L14.9 3.7C14.35 3.26667 13.746 2.90833 13.088 2.625C12.43 2.34167 11.734 2.15833 11 2.075V3.075C11.5833 3.15833 12.146 3.31667 12.688 3.55C13.23 3.78333 13.734 4.06667 14.2 4.4Z" fill="currentColor" />
          </svg>
          <svg
            v-else
            class="tab-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 19 19"
            fill="none"
          >
            <path
              d="M9.49157 10.2832C11.3867 10.2832 13.1102 10.8321 14.3781 11.6049C15.0109 11.9925 15.5519 12.4473 15.9427 12.9416C16.3271 13.4289 16.6102 14.011 16.6102 14.6335C16.6102 15.3019 16.2852 15.8287 15.8169 16.2044C15.374 16.5603 14.7894 16.796 14.1685 16.9605C12.9204 17.2904 11.2546 17.4019 9.49157 17.4019C7.72851 17.4019 6.06274 17.2911 4.8146 16.9605C4.19369 16.796 3.60917 16.5603 3.16623 16.2044C2.69719 15.8279 2.37289 15.3019 2.37289 14.6335C2.37289 14.011 2.65606 13.4289 3.04047 12.9416C3.4312 12.4473 3.97143 11.9925 4.605 11.6049C5.87291 10.8321 7.59721 10.2832 9.49157 10.2832Z"
              fill="currentColor"
            />
            <path
              d="M9.49156 1.58203C12.536 1.58203 14.439 4.87798 12.9164 7.51426C12.5693 8.11546 12.0701 8.61469 11.4689 8.9618C10.8677 9.30891 10.1858 9.49165 9.49156 9.49167C6.44714 9.49167 4.54408 6.19572 6.06669 3.55944C6.41379 2.95825 6.91302 2.45901 7.51421 2.1119C8.1154 1.76479 8.79736 1.58205 9.49156 1.58203Z"
              fill="currentColor"
            />
          </svg>
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
  bottom: calc(env(safe-area-inset-bottom) + 0.24rem);
  transform: translateX(-50%);
  z-index: 24;
  width: 9rem;
  height: 2.05rem;
  overflow: visible;
  pointer-events: none;
}

.tabbar-svg {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 2.05rem;
  overflow: visible;
  pointer-events: none;
  z-index: 0;
}

.tabbar-fill {
  fill: var(--tabbar-surface);
}

.tabbar-stroke {
  fill: none;
  stroke: var(--tabbar-border);
  stroke-width: 0.451px;
}

.tabbar-fill-stop-start {
  stop-color: var(--tabbar-surface);
}

.tabbar-fill-stop-end {
  stop-color: var(--tabbar-surface);
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
  pointer-events: auto;
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
  color: var(--tabbar-item);
  padding: 0rem 0.06rem 0.08rem;
  border-radius: 0.44rem;
  transition: color 0.22s ease;
  -webkit-tap-highlight-color: transparent;
}

.tab-button.is-active {
  color: var(--tabbar-item-active);
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
  transform: scale(0.85);
}

.tab-icon-svg {
  width: 100%;
  height: 100%;
  display: block;
  color: inherit;
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

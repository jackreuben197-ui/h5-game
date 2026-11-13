<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  toRef,
  watch,
} from 'vue'
import { t } from '@/i18n'
import { useChannelCFeed } from '@/composables/useChannelCFeed'
import { useChannelCFilters } from '@/composables/useChannelCFilters'
import { useChannelCDataReady } from '@/composables/useChannelCDataReady'
import { useChannelCNavigation } from '@/composables/useChannelCNavigation'
import { useChannelCVersionRouting } from '@/composables/useChannelCVersionRouting'
import { useLobbyBannerImages } from '@/composables/useLobbyBannerImages'
import { useRoomListStore } from '@/stores/roomList'
import { buildChannelCFeed, type ChannelCSection } from '@/features/channelC/model'
import {
  readChannelCListScroll,
  saveChannelCListScroll,
} from '@/features/channelC/listState'
import ChannelCHeader from './ChannelCHeader.vue'
import ChannelCFilters from './ChannelCFilters.vue'
import ChannelCOverlays from './ChannelCOverlays.vue'
import ChannelCWaterfall from './ChannelCWaterfall.vue'

const props = withDefaults(
  defineProps<{
    section?: ChannelCSection
    ready?: boolean
    clubManagement?: boolean
  }>(),
  {
    section: 'home',
    ready: undefined,
    clubManagement: false,
  },
)
const { club, clubId, tribeId, visibleRooms, visibleMatches, tournamentSeries } = useChannelCFeed()
useChannelCVersionRouting()
const ready = useChannelCDataReady(toRef(props, 'ready'))
const { banners, fetchLobbyBannerImages, refreshLobbyBanner } = useLobbyBannerImages()
const roomStore = useRoomListStore()
const root = ref<HTMLElement | null>(null)
const overlays = ref<InstanceType<typeof ChannelCOverlays> | null>(null)
const persistFilters = computed(() => props.section !== 'home')
const {
  pokerFilter,
  blindFilter,
  tournamentFilter,
  mttFilter,
  blinds,
  tournamentTypes,
  filteredRooms,
  filteredMatches,
  resetFilters,
} = useChannelCFilters(visibleRooms, visibleMatches, tournamentSeries, persistFilters)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined

const tournamentName = computed(() => t(visibleMatches.value[0]?.name || 'MTT'))
const cards = computed(() =>
  buildChannelCFeed(
    props.section === 'poker' ? filteredRooms.value : visibleRooms.value,
    props.section === 'mtt' ? filteredMatches.value : visibleMatches.value,
    props.section,
    now.value,
    tournamentSeries.value,
  ),
)
const listLabel = computed(() =>
  t(
    props.section === 'home'
      ? 'UIChannelC_Recommendations'
      : props.section === 'poker'
        ? 'UIChannelC_AllTables'
        : 'UIChannelC_AllMatches',
  ),
)
const { joiningId, joinRoom, openMatch } = useChannelCNavigation(saveScroll)

let lastScrollTop = 0
let scrollElement: HTMLElement | null = null
let scrollRestored = false
let restoreFrame: number | undefined

function container(): HTMLElement | null {
  return root.value?.closest<HTMLElement>('.main-layout-content') ?? null
}
function scrollKey(section: ChannelCSection = props.section) {
  return `channel-c-${section}`
}
function savedScroll(section: ChannelCSection = props.section) {
  return readChannelCListScroll(section) || roomStore.getScrollPosition(scrollKey(section))
}
function handleContainerScroll(event: Event) {
  lastScrollTop = Math.max(0, (event.currentTarget as HTMLElement | null)?.scrollTop || 0)
}
function unbindScrollTracking() {
  scrollElement?.removeEventListener('scroll', handleContainerScroll)
  scrollElement = null
}
function bindScrollTracking() {
  const element = container()
  if (element === scrollElement) return
  unbindScrollTracking()
  scrollElement = element
  if (element) {
    lastScrollTop = Math.max(element.scrollTop, savedScroll())
    element.addEventListener('scroll', handleContainerScroll, { passive: true })
  }
}
function saveScroll(section: ChannelCSection = props.section) {
  const currentTop = Math.max(0, container()?.scrollTop || 0)
  const scrollTop = currentTop > 0 ? currentTop : lastScrollTop
  roomStore.saveScrollPosition(scrollKey(section), scrollTop)
  saveChannelCListScroll(section, scrollTop)
}
function cancelScheduledRestore() {
  if (restoreFrame !== undefined) cancelAnimationFrame(restoreFrame)
  restoreFrame = undefined
}
function scheduleRestore() {
  if (restoreFrame !== undefined || scrollRestored || !ready.value) return
  restoreFrame = requestAnimationFrame(() => {
    restoreFrame = undefined
    const element = container()
    if (!element || !ready.value) return
    const target = savedScroll()
    const position = Math.min(target, Math.max(0, element.scrollHeight - element.clientHeight))
    element.scrollTop = position
    lastScrollTop = position
    // 卡片尚未渲染时保留未恢复状态，等 cards.length 变化后再次尝试。
    scrollRestored = target === 0 || cards.value.length > 0 || position >= target - 1
  })
}
async function restoreScroll() {
  scrollRestored = false
  cancelScheduledRestore()
  await nextTick()
  scheduleRestore()
}
function activate() {
  if (!clock)
    clock = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  bindScrollTracking()
  void restoreScroll()
}
function deactivate() {
  saveScroll()
  cancelScheduledRestore()
  unbindScrollTracking()
  clearInterval(clock)
  clock = undefined
}

onMounted(() => {
  activate()
  if (props.section === 'home') void fetchLobbyBannerImages()
})
onActivated(activate)
onDeactivated(deactivate)
onBeforeUnmount(deactivate)
watch(
  [ready, () => cards.value.length],
  () => {
    if (ready.value && !scrollRestored) void restoreScroll()
  },
  { flush: 'post' },
)
watch(
  () => props.section,
  (_next, previous) => {
    saveScroll(previous)
    resetFilters()
    lastScrollTop = 0
    void restoreScroll()
  },
)
</script>

<template>
  <div
    ref="root"
    class="channel-c-page"
    :class="{ 'channel-c-page--club-management': section === 'home' && clubManagement }"
  >
    <ChannelCHeader
      v-if="section === 'home'"
      :banners="banners"
      :refresh-banner="refreshLobbyBanner"
      :club-name="club?.club_name || ''"
      @action="overlays?.open($event)"
    />
    <ChannelCFilters
      v-else
      v-model:poker="pokerFilter"
      v-model:blind="blindFilter"
      v-model:mtt="mttFilter"
      v-model:tournament="tournamentFilter"
      :section="section"
      :blinds="blinds"
      :tournament-types="tournamentTypes"
    />
    <div v-if="!ready" class="c-empty"><van-loading size="24" />{{ t('UIChannelC_Loading') }}</div>
    <ChannelCWaterfall
      v-else-if="cards.length"
      :cards="cards"
      :label="listLabel"
      :now="now"
      :desktop-icon-url="club?.safari_icon_url"
      :joining-id="joiningId"
      @join="joinRoom"
      @open="openMatch"
    />
    <div v-else class="c-empty">
      <van-icon name="search" size="32" />
      <p>{{ t(section === 'home' ? 'UIChannelC_NoRecommendations' : 'UIChannelC_NoResults') }}</p>
      <button v-if="section !== 'home'" type="button" @click="resetFilters">
        {{ t('UIChannelC_ResetFilters') }}
      </button>
    </div>
    <ChannelCOverlays
      v-if="section === 'home'"
      ref="overlays"
      :club-id="clubId"
      :tribe-id="tribeId"
      :club-name="club?.club_name || ''"
      :announcement="club?.announcement || ''"
      :tournament-name="tournamentName"
    />
  </div>
</template>

<style scoped lang="scss">
.channel-c-page {
  width: 100%;
  max-width: 10rem;
  margin: 0 auto;
  padding: 0 0.256rem 0.25rem;
}
@media (max-width: 599px) {
  .channel-c-page--club-management {
    // 为右下角管理入口留出空间，末张卡片仍可完整滚出。
    padding-bottom: 1.2rem;
  }
}
.c-empty {
  display: flex;
  min-height: 5rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: var(--c-text-muted);
  font-size: 0.34rem;
}
.c-empty button {
  padding: 0.15rem 0.4rem;
  border: 0;
  border-radius: 0.3rem;
  color: #fff;
  background: #69beff;
  font: inherit;
  cursor: pointer;
}
</style>

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
import type { ExtendGameRecord } from '@/api/casino'
import { showGameToast } from '@/components/Toast'
import { t } from '@/i18n'
import { useChannelCFeed } from '@/composables/useChannelCFeed'
import { useChannelCFilters } from '@/composables/useChannelCFilters'
import { useChannelCDataReady } from '@/composables/useChannelCDataReady'
import { useChannelCNavigation } from '@/composables/useChannelCNavigation'
import { useChannelCVersionRouting } from '@/composables/useChannelCVersionRouting'
import { useLobbyBannerImages } from '@/composables/useLobbyBannerImages'
import { useCasinoGameLaunch } from '@/composables/useCasinoGameLaunch'
import { useRoomListStore } from '@/stores/roomList'
import { buildChannelCFeed, type ChannelCSection } from '@/features/channelC/model'
import ChannelCHeader from './ChannelCHeader.vue'
import ChannelCFilters from './ChannelCFilters.vue'
import ChannelCOverlays from './ChannelCOverlays.vue'
import ChannelCWaterfall from './ChannelCWaterfall.vue'
import ChannelCCasinoShortcuts from './ChannelCCasinoShortcuts.vue'
import LiveWinsTicker, { type LiveWinItem } from '@/components/LiveWinsTicker.vue'
import CasinoView from '@/views/home/CasinoView.vue'
import { useLiveWins } from '@/composables/useLiveWins'

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
const { club, clubId, tribeId, visibleRooms, visibleMatches, tournamentSeries, popularGames } =
  useChannelCFeed()
useChannelCVersionRouting()
const ready = useChannelCDataReady(toRef(props, 'ready'))
const { liveWinItems, liveWinInterval, findLiveWinGame } = useLiveWins(clubId)
const { play } = useCasinoGameLaunch()
const { bannerImages, isBannerLoaded, fetchLobbyBannerImages } = useLobbyBannerImages('c')
const roomStore = useRoomListStore()
const root = ref<HTMLElement | null>(null)
const overlays = ref<InstanceType<typeof ChannelCOverlays> | null>(null)
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
} = useChannelCFilters(visibleRooms, visibleMatches, tournamentSeries)
const casinoCategory = ref('hot')
const showCasino = computed(() => props.section === 'home' && casinoCategory.value !== 'hot')
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
    popularGames.value,
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

function playGame(game: ExtendGameRecord) {
  saveScroll()
  play(game, clubId.value || undefined)
}
function playLiveWin(item: LiveWinItem) {
  const game = findLiveWinGame(item)
  if (game) playGame(game)
  else showGameToast(t('UICasino_ClubNotEnabled'))
}

function container() {
  return root.value?.closest<HTMLElement>('.main-layout-content')
}
function scrollKey(section = props.section) {
  return `channel-c-${section}`
}
function saveScroll() {
  const element = container()
  if (element) roomStore.saveScrollPosition(scrollKey(), element.scrollTop)
}
async function restoreScroll() {
  await nextTick()
  const element = container()
  if (element && ready.value) element.scrollTop = roomStore.getScrollPosition(scrollKey())
}
function activate() {
  if (!clock)
    clock = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  void restoreScroll()
}
function deactivate() {
  saveScroll()
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
watch(ready, (value) => {
  if (value) void restoreScroll()
})
watch(
  () => props.section,
  (_next, previous) => {
    const element = container()
    if (element) roomStore.saveScrollPosition(scrollKey(previous), element.scrollTop)
    resetFilters()
    void restoreScroll()
  },
)
</script>

<template>
  <div
    ref="root"
    class="channel-c-page"
    :class="{
      'channel-c-page--club-management': section === 'home' && clubManagement,
      'channel-c-page--mtt': section === 'mtt',
      'channel-c-page--poker': section === 'poker',
    }"
  >
    <ChannelCHeader
      v-if="section === 'home'"
      :banners="bannerImages"
      :banner-loaded="isBannerLoaded"
      :club-name="club?.club_name || ''"
      @action="overlays?.open($event)"
    />
    <LiveWinsTicker
      v-if="section === 'home' && liveWinItems.length"
      class="c-live-wins"
      :items="liveWinItems"
      :slide-interval="liveWinInterval"
      @click-card="playLiveWin"
    />
    <ChannelCCasinoShortcuts
      v-if="section === 'home' && popularGames.length"
      :active="casinoCategory"
      @select="casinoCategory = $event"
    />
    <ChannelCFilters
      v-if="section !== 'home'"
      v-model:poker="pokerFilter"
      v-model:blind="blindFilter"
      v-model:mtt="mttFilter"
      v-model:tournament="tournamentFilter"
      :section="section"
      :blinds="blinds"
      :tournament-types="tournamentTypes"
    />
    <CasinoView v-if="showCasino" :hide-header="true" :club-id="clubId" :category="casinoCategory" />
    <div v-else-if="!ready" class="c-empty">
      <van-loading size="24" />{{ t('UIChannelC_Loading') }}
    </div>
    <ChannelCWaterfall
      v-else-if="cards.length"
      :cards="cards"
      :label="listLabel"
      :now="now"
      :desktop-icon-url="club?.safari_icon_url"
      :joining-id="joiningId"
      @join="joinRoom"
      @open="openMatch"
      @play="playGame"
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
  padding: 0 var(--c-page-gutter, 0.256rem) 0.25rem;
}
.channel-c-page--mtt {
  --c-page-gutter: 0.282rem;
  --c-waterfall-column-gap: 0.205rem;
  --c-mtt-prize-dark: #fff;
}
.channel-c-page--poker .c-filter-row {
  margin-bottom: 0.115rem;
}
@media (max-width: 599px) {
  .channel-c-page--club-management {
    // 为右下角管理入口留出空间，末张卡片仍可完整滚出。
    padding-bottom: 1.2rem;
  }
}
.channel-c-page .c-live-wins {
  margin: 0 0.0513rem 0.128rem;
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
  background: #02cfbb;
  font: inherit;
  cursor: pointer;
}
</style>

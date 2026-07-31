<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postOrgClubGetApi, postOrgClubJoinApi, postOrgClubSearchByIdApi } from '@/api/org'
import imgSearchDark from '@/assets/icons/club_search.svg'
import imgSearchLight from '@/assets/icons/club_search_light.svg'
import imgPokerSpadeDark from '@/assets/icons/club_poker_spade.svg'
import imgPokerSpadeLight from '@/assets/icons/club_poker_spade_light.svg'
import imgPokerHeartDark from '@/assets/icons/club_poker_heart.svg'
import imgPokerHeartLight from '@/assets/icons/club_poker_heart_light.svg'
import imgPokerClubDark from '@/assets/icons/club_poker_club.svg'
import imgPokerClubLight from '@/assets/icons/club_poker_club_light.svg'
import imgPokerDiamondDark from '@/assets/icons/club_poker_diamond.svg'
import imgPokerDiamondLight from '@/assets/icons/club_poker_diamond_light.svg'
import { theme } from '@/utils/theme'
import imgPeopleDark from '@/assets/icons/icon_people2.png'
import imgPeopleLight from '@/assets/icons/icon_people2_light.png'
import imgChipRed from '@/assets/icons/icon_chip_red.png'
import imgChipGreen from '@/assets/icons/icon_chip_green.png'
import imgTableDark from '@/assets/icons/icon_table2.png'
import imgTableLight from '@/assets/icons/icon_table2_light.png'
import imgClubRoleIcon from '@/assets/icons/member_icon.png'
import imgQuickActionCreateShield from '@/assets/images/club_qa_create_club_shield.png'
import imgQuickActionBoardChart from '@/assets/images/club_qa_data_board_chart.png'
import imgQuickActionAlliance from '@/assets/images/club_qa_data_board_alliance.png'
import iconClubCareerDark from '@/assets/icons/ic_club_q.png'
import iconClubCareerLight from '@/assets/icons/ic_club_q_light.png'
import imgClubBannerFigma from '@/assets/images/club_banner_bg.png'
import imgClubLogo from '@/assets/images/club_default_logo.png'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import type { RoomRecord } from '@/api/models/roomcenter'
import { useGameStore } from '@/stores/game'
import { useRoomListStore } from '@/stores/roomList'
import type { ClubInfo } from '@/stores/userInfo'
import { useUserInfoStore } from '@/stores/userInfo'
import { checkIsShowForClubAndTribe, formatUC } from '@/utils/roomVisibility'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import { readClubListCache, writeClubListCache } from '@/utils/userClubListCache'
import { t, getLocale } from '@/i18n'

type QuickActionKind = 'create-club' | 'club-panel' | 'create-union' | 'club-career'

interface QuickActionItem {
  id: number
  title: string
  kind: QuickActionKind
  hidden?: boolean
}

interface ClubCardItem {
  key: string
  source: ClubInfo
  name: string
  clubIdText: string
  roleText: string
  activeCount: number
  chipsCount: number
  tableCount: number
  memberCount: number
  cover: string
}

const isLightTheme = computed(() => theme.value === 'light')
const imgSearch = computed(() => (isLightTheme.value ? imgSearchLight : imgSearchDark))
const imgPokerSpade = computed(() => (isLightTheme.value ? imgPokerSpadeLight : imgPokerSpadeDark))
const imgPokerHeart = computed(() => (isLightTheme.value ? imgPokerHeartLight : imgPokerHeartDark))
const imgPokerClub = computed(() => (isLightTheme.value ? imgPokerClubLight : imgPokerClubDark))
const imgPokerDiamond = computed(() =>
  isLightTheme.value ? imgPokerDiamondLight : imgPokerDiamondDark,
)
const imgPeople = computed(() => (isLightTheme.value ? imgPeopleLight : imgPeopleDark))
const imgTable = computed(() => (isLightTheme.value ? imgTableLight : imgTableDark))
const iconClubCareer = computed(() =>
  isLightTheme.value ? iconClubCareerLight : iconClubCareerDark,
)

const router = useRouter()
const userInfoStore = useUserInfoStore()
const gameStore = useGameStore()
const roomListStore = useRoomListStore()

const searchKeyword = ref('')
const loadingMyClubs = ref(false)
const searchLoading = ref(false)
const searchKeypadOpen = ref(false)
const showJoinModal = ref(false)
const joinLoading = ref(false)
const searchedClub = ref<ClubInfo | null>(null)

const fallbackBanners = [imgClubBannerFigma]
const isChannelPackage = isPrivateDomainMode()

const enterLabel = computed(() => (getLocale() === 'en' ? t('UIClub_Enter') : '进入'))

const quickActions: QuickActionItem[] = [
  { id: 1, title: 'UIClub_CreateClub', kind: 'create-club' },
  { id: 2, title: 'PageMineClubCareer', kind: 'club-career' },
]

const clubList = computed<ClubCardItem[]>(() => {
  const records = roomListStore.records
  return userInfoStore.clubList.map((club, index) => {
    const displayId = normalizeClubId(club.random_id ?? club.club_id)
    const clubId = normalizeClubId(club.club_id)
    const key = `${clubId || displayId || index}`
    const stats = computeClubRoomStats(club, records)

    return {
      key,
      source: club,
      name: toSafeString(club.club_name) || t('UIClub_UnnamedClub'),
      clubIdText: displayId || '--',
      roleText: getMemberRoleText(club.user_level),
      activeCount: toSafeNumber(club.user_gold),
      chipsCount: toSafeNumber(club.user_credit),
      tableCount: stats.tables,
      memberCount: stats.players,
      cover: toSafeString(club.logo) || imgClubLogo,
    }
  })
})

const displayClubList = computed<ClubCardItem[]>(() => {
  if (!isChannelPackage) {
    return clubList.value
  }

  if (userInfoStore.currentClub) {
    const currentClubId = normalizeClubId(userInfoStore.currentClub.club_id)
    const hit = clubList.value.find(
      (item) => normalizeClubId(item.source.club_id) === currentClubId,
    )
    if (hit) {
      return [hit]
    }
  }

  return clubList.value.slice(0, 1)
})

const searchedClubDisplayId = computed(
  () => normalizeClubId(searchedClub.value?.random_id ?? searchedClub.value?.club_id) || '--',
)

const searchedClubName = computed(
  () => toSafeString(searchedClub.value?.club_name) || t('UIClub_Creat_2LvGNmS7'),
)

const searchedClubMembers = computed(() => toSafeNumber(searchedClub.value?.club_members))

const searchedClubLogo = computed(() => {
  const logo = toSafeString(searchedClub.value?.logo)
  return logo
})

function normalizeClubId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function tl(en: string, zh: string): string {
  return getLocale() === 'en' ? en : zh
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function getRoomPlayers(room: RoomRecord): number {
  return Number(room.roomers) || (Array.isArray(room.users) ? room.users.length : 0)
}

// 与首页 pokerTablesText / pokerPlayersText 一致：按俱乐部/联盟过滤共享牌桌列表，
// 只统计扑克玩法（game_type <= 4），保证列表与进入俱乐部后看到的数据一致。
function computeClubRoomStats(
  club: ClubInfo,
  records: RoomRecord[],
): { tables: number; players: number } {
  const clubId = toSafeInt(club.club_id)
  const tribeId = toSafeInt((club as Record<string, unknown>).tribe_id)
  let tables = 0
  let players = 0
  records.forEach((room) => {
    if (!checkIsShowForClubAndTribe(room, clubId, tribeId)) {
      return
    }
    const gameType = Number(room.game_type)
    if (!Number.isFinite(gameType) || gameType > 4) {
      return
    }
    tables += 1
    players += getRoomPlayers(room)
  })
  return { tables, players }
}

function getMemberRoleText(value: unknown): string {
  const role = Number(value)
  if (role === 1) return t('UIClub_UserLevelOwner')
  if (role === 2) return t('UIClub_VicePr')
  if (role === 3) return t('UIGuild_FilterButtonManager')
  if (role === 4) return t('UIClub_AgentItem')
  return t('UIClub_Info_Members')
}

function goToClubDetail(club?: ClubInfo): void {
  if (club) {
    userInfoStore.setCurrentClub(club)
  }
  void router.push('/club/index')
}

function onQuickAction(itemId: number): void {
  if (isChannelPackage) {
    return
  }

  if (itemId === 2) {
    void router.push('/mine/career/club')
    return
  }
  void router.push('/club/create')
}

function openSearchKeypad(): void {
  searchKeypadOpen.value = true
}

function onSearchKeypadClose(): void {
  searchKeypadOpen.value = false
}

function onSearchKeypadSubmit(): void {
  searchKeypadOpen.value = false
}

function onSearchKeypadKeyPress(payload: {
  key: string
  action: 'digit' | 'clear' | 'backspace' | 'decimal'
  value: string
  accepted: boolean
}): void {
  if (!payload.accepted && payload.action === 'digit') {
    return
  }
  searchKeyword.value = payload.value.replace(/\D+/g, '').slice(0, 6)
}

function findClubInMine(target: ClubInfo): ClubInfo | null {
  const targetClubId = normalizeClubId(target.club_id)
  const targetRandomId = normalizeClubId(target.random_id)

  return (
    userInfoStore.clubList.find((club) => {
      const clubId = normalizeClubId(club.club_id)
      const randomId = normalizeClubId(club.random_id)
      if (targetClubId && clubId === targetClubId) {
        return true
      }
      if (targetRandomId && randomId === targetRandomId) {
        return true
      }
      return false
    }) || null
  )
}

async function loadMyClubList(force = false): Promise<void> {
  if (!force && userInfoStore.clubList.length) {
    return
  }

  const userId = gameStore.loginUserId
  // 没有内存数据时优先用用户级 IndexedDB 缓存填充，避免空白等待。
  if (!userInfoStore.clubList.length && userId) {
    const cached = await readClubListCache(userId)
    if (cached.length && !userInfoStore.clubList.length) {
      userInfoStore.setClubList(cached)
    }
  }

  const hasInitialData = userInfoStore.clubList.length > 0
  if (!hasInitialData) {
    loadingMyClubs.value = true
  }

  try {
    const response = await postOrgClubGetApi()
    if (Number(response.code) !== 0) {
      throw new Error(response.message || t('UIClub_FetchClubFail'))
    }

    const list = Array.isArray(response.data) ? response.data : []
    userInfoStore.setClubList(list)
    if (userId) {
      void writeClubListCache(userId, list)
    }
  } catch (error) {
    // 有缓存兜底时静默失败，避免在已有展示之上弹错。
    if (!hasInitialData) {
      const message = error instanceof Error ? error.message : t('UIClub_FetchClubFail')
      showFailToast(message)
    } else {
      console.warn('[club-list] ' + t('UIClub_Fail7') + ':', error)
    }
  } finally {
    loadingMyClubs.value = false
  }
}

async function onSearchClub(): Promise<void> {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    showFailToast(t('tc_xDSyCM') + 'ID')
    return
  }

  if (searchLoading.value) {
    return
  }

  searchLoading.value = true
  try {
    const response = await postOrgClubSearchByIdApi({ club_random_id: Number(keyword) })
    if (Number(response.code) !== 0) {
      showFailToast(t('UIClub_NotFoundClub2'))
      return
    }

    const targetClub = response.data
    if (!targetClub) {
      showFailToast(t('UIClub_NotFoundClub3'))
      return
    }

    const mine = findClubInMine(targetClub)
    if (mine) {
      goToClubDetail(mine)
      return
    }

    searchedClub.value = targetClub
    showJoinModal.value = true
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    showFailToast(message || t('UIClub_NotFoundClub2'))
  } finally {
    searchLoading.value = false
  }
}

function closeJoinModal(): void {
  showJoinModal.value = false
}

async function onJoinClub(): Promise<void> {
  if (!searchedClub.value || joinLoading.value) {
    return
  }

  const clubId = Number(searchedClub.value.club_id)
  if (!Number.isFinite(clubId) || clubId <= 0) {
    showFailToast(t('UIClub_ClubInfoError') + '，' + t('UIClub_NoJoin'))
    return
  }

  joinLoading.value = true
  try {
    const response = await postOrgClubJoinApi({ club_id: clubId })
    if (Number(response.code) !== 0) {
      throw new Error(response.message || t('UIClub_JoinClubFail'))
    }

    showSuccessToast(response.message || t('UIClub_JoinApplyDoneSubmit'))
    showJoinModal.value = false
    setTimeout(() => {
      void loadMyClubList(true)
    }, 3000)
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_JoinClubFail')
    showFailToast(message)
  } finally {
    joinLoading.value = false
  }
}

onMounted(() => {
  void loadMyClubList(true)
  // 与首页/俱乐部详情共用同一份牌桌列表，进入此页时启动共享数据流。
  roomListStore.bootstrapRoomList()
})
</script>

<template>
  <div class="page-shell club-index">
    <section v-if="!isChannelPackage" class="search-row">
      <div class="search-shell" :aria-label="t('UIClub_ClubSearch')">
        <label class="search-trigger" for="club-search-input">
          <img class="search-icon" :src="imgSearch" alt="" />
          <input
            id="club-search-input"
            class="search-input"
            :value="searchKeyword"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="6"
            readonly
            :placeholder="t('UIGuild_SearchBtn') + 'ID'"
            @focus="openSearchKeypad"
            @click="openSearchKeypad"
          />
        </label>
        <button type="button" class="search-btn" :disabled="searchLoading" @click="onSearchClub">
          <span class="search-btn-label">
            {{ searchLoading ? t('UIClub_Search') : t('search') }}
          </span>
        </button>
      </div>
    </section>

    <section v-if="!isChannelPackage" class="quick-actions">
      <button
        v-for="item in quickActions"
        :key="item.id"
        type="button"
        class="quick-item"
        :class="[`quick-item--${item.kind}`, { 'quick-item--hidden': item.hidden }]"
        @click="onQuickAction(item.id)"
      >
        <div class="qa-icon" :class="`qa-icon--${item.kind}`">
          <template v-if="item.kind === 'create-club'">
            <img
              class="qa-img qa-img--cc-small"
              :src="imgQuickActionCreateShield"
              alt=""
              aria-hidden="true"
            />
          </template>
          <template v-else-if="item.kind === 'club-panel'">
            <img
              class="qa-img qa-img--cp-vec"
              :src="imgQuickActionBoardChart"
              alt=""
              aria-hidden="true"
            />
          </template>
          <template v-else-if="item.kind === 'create-union'">
            <img
              class="qa-img qa-img--cu-alliance"
              :src="imgQuickActionAlliance"
              alt=""
              aria-hidden="true"
            />
          </template>
          <template v-else-if="item.kind === 'club-career'">
            <img class="qa-img icon-board-chart" :src="iconClubCareer" alt="" aria-hidden="true" />
          </template>
        </div>
        <span class="action-text" :class="`action-text--${item.kind}`">{{ t(item.title) }}</span>
      </button>
    </section>

    <section class="cards-divider" aria-hidden="true">
      <span class="divider-line"></span>
      <img class="suit-icon" :src="imgPokerSpade" alt="" />
      <img class="suit-icon" :src="imgPokerHeart" alt="" />
      <img class="suit-icon" :src="imgPokerClub" alt="" />
      <img class="suit-icon" :src="imgPokerDiamond" alt="" />
      <span class="divider-line"></span>
    </section>

    <section class="club-list">
      <p v-if="loadingMyClubs" class="club-empty-text">{{ tl('Loading clubs...', '正在加载俱乐部...') }}</p>
      <p v-else-if="!displayClubList.length" class="club-empty-text">{{ tl('No clubs yet — create one!', '暂无俱乐部，先去创建一个吧') }}</p>
      <article
        v-for="club in displayClubList"
        :key="club.key"
        class="club-banner"
        @click="goToClubDetail(club.source)"
      >
        <div class="club-banner-glass">
          <div class="club-banner-blur" aria-hidden="true" />

          <div class="club-main">
            <div class="club-identity">
              <img class="club-cover" :src="club.cover" alt="" />

              <div class="club-meta">
                <h2 class="club-name">{{ club.name }}</h2>
                <p class="club-id">
                  <span class="club-id-tag">ID</span>
                  <span class="club-id-value">{{ club.clubIdText }}</span>
                </p>
                <div class="club-top-metrics" aria-hidden="true">
                  <span class="top-metric-item">
                    <img :src="imgChipRed" alt="" />
                    <span>{{ formatUC(club.activeCount) }}</span>
                  </span>
                  <span class="top-metric-item">
                    <img :src="imgChipGreen" alt="" />
                    <span>{{ formatUC(club.chipsCount) }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="enter-btn-wrapper">
              <button type="button" class="enter-btn" @click.stop="goToClubDetail(club.source)">
                <span class="enter-btn-label">{{ enterLabel }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="club-stats-shell" aria-hidden="true">
          <div class="club-stats-inline">
            <span class="stat-item stat-item--role">
              <img :src="imgClubRoleIcon" alt="" />
              <span>{{ club.roleText }}</span>
            </span>
            <span class="stat-item">
              <img :src="imgTable" alt="" />
              <span>{{ t('UIMatch_TableCount', club.tableCount) }}</span>
            </span>
            <span class="stat-item">
              <img :src="imgPeople" alt="" />
              <span>{{ t('UIMatch_Person', club.memberCount) }}</span>
            </span>
          </div>
        </div>
      </article>
    </section>

    <transition name="dialog-fade">
      <div v-if="showJoinModal" class="join-modal-mask" @click="closeJoinModal">
        <section class="join-modal" @click.stop>
          <div class="join-modal-card">
            <img class="join-modal-logo" :src="searchedClubLogo" :alt="tl('Club avatar', '俱乐部头像')" />
            <h3 class="join-modal-name">{{ searchedClubName }}</h3>
            <p class="join-modal-id-row">
              <span class="join-modal-id-tag">ID</span>
              <span>{{ searchedClubDisplayId }}</span>
            </p>
            <p class="join-modal-member-row">
              <img :src="imgPeople" alt="" aria-hidden="true" />
              <span>{{ t('UIMatch_Person', searchedClubMembers) }}</span>
            </p>
          </div>

          <div class="join-modal-actions">
            <button
              type="button"
              class="join-modal-btn join-modal-btn--cancel"
              @click="closeJoinModal"
            >
              {{ t('Wallet_Cancel') }}
            </button>
            <button
              type="button"
              class="join-modal-btn join-modal-btn--confirm"
              :disabled="joinLoading"
              @click="onJoinClub"
            >
              {{ joinLoading ? tl('Submitting...', '提交中') : tl('Join', '加入') }}
            </button>
          </div>
        </section>
      </div>
    </transition>

    <NumericKeypad
      :open="searchKeypadOpen"
      :min="0"
      :max="999999"
      :max-length="6"
      :initial-value="searchKeyword"
      :show-input-area="true"
      :allow-leading-zero="true"
      :title="tl('Search Club ID', '搜索俱乐部ID')"
      :confirm-text="t('CommitOK')"
      @close="onSearchKeypadClose"
      @submit="onSearchKeypadSubmit"
      @key-press="onSearchKeypadKeyPress"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-index-bg {
  position: relative;
  height: 100dvh;
  background-color: #0f122f;
  background-size: cover;

  @include theme-light-own {
    background-color: #f6f7fb;
    background-image: url('@/assets/images/main_bg_light.webp') !important;

    .bg-shade,
    .bg-shine,
    .halo {
      display: none;
    }

    :deep(.back-trigger),
    :deep(.back-icon) {
      color: #000;
    }

    :deep(.title) {
      color: #000;
      text-shadow: none;
    }

    .action-text,
    .section-title,
    .search-placeholder,
    .search-input,
    .club-name,
    .club-id-value,
    .top-metric-item,
    .stat-item,
    .no-data-text {
      color: #000000;
    }

    .search-input::placeholder {
      color: rgba(0, 0, 0, 0.45);
    }

    .search-shell {
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .club-banner-card {
      background: #ffffff;
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .club-id-tag {
      background: rgba(0, 0, 0, 0.08);
      color: rgba(0, 0, 0, 0.72);
    }

    .club-stats-shell {
      background: rgba(0, 0, 0, 0.04);
    }

    .enter-btn {
      color: #ffffff;
    }
  }
}

.bg-image {
  position: absolute;
  pointer-events: none;
  user-select: none;
}

.bg-image--main {
  width: 7.46rem;
  height: 16.28rem;
  left: -0.05rem;
  top: 0;
  object-fit: cover;
  opacity: 0.6;
}

.bg-shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      120% 64% at 50% -8%,
      rgba(89, 36, 151, 0.44),
      rgba(23, 12, 53, 0.82) 46%,
      rgba(8, 11, 35, 0.95)
    ),
    linear-gradient(180deg, rgba(18, 12, 49, 0.62), rgba(8, 12, 37, 0.98));
}

.bg-shine {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    60% 26% at 12% 10%,
    rgba(239, 107, 226, 0.16),
    rgba(239, 107, 226, 0)
  );
}

.halo {
  position: absolute;
  border-radius: 50%;
  filter: blur(1.1rem);
  opacity: 0.55;
  pointer-events: none;
}

.halo--top {
  width: 2.76rem;
  height: 2.76rem;
  right: -0.88rem;
  top: -0.7rem;
  background: rgba(220, 72, 199, 0.52);
}

.halo--left {
  width: 2.3rem;
  height: 2.3rem;
  left: -0.78rem;
  top: 4.68rem;
  background: rgba(63, 103, 255, 0.44);
}

.club-index {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  // padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top));
}

.search-row {
  padding: 0;
}

.search-shell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 1.055rem;
  padding: 0.127rem 0.203rem 0.127rem 0.447rem;
  background: transparent;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.013rem;
    background: linear-gradient(
      126.09deg,
      rgba(255, 255, 255, 0.89) 21.1%,
      rgba(230, 230, 230, 0.89) 71.4%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    mix-blend-mode: overlay;
    pointer-events: none;
  }
}

.search-trigger {
  position: relative;
  z-index: 1;
  flex: 1;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.218rem;
  justify-content: flex-start;
  background: transparent;
  color: #fff;
}

.search-icon {
  flex: 0 0 auto;
  width: 0.557rem;
  height: 0.546rem;
}

.search-placeholder {
  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  font-size: 0.3rem;
  line-height: 1.4;
  color: #fff;
  opacity: 0.96;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #fff;
  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  font-size: 0.393rem;
  line-height: 1.4;
  white-space: nowrap;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 1);
}

.search-btn {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 2.06rem;
  height: 1.089rem;
  border-radius: 1.689rem;
  border: none;
  padding: 0.209rem 0.648rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.166rem;
  color: #fff;
  background: transparent;

  box-shadow: 0.024rem 0.03rem 0.047rem 0 rgba(0, 0, 0, 0.25);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.012rem; // 0.445px border width
    background: linear-gradient(
      to bottom,
      rgba(242, 242, 242, 0.4),
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.5)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
  }
}

.search-btn:disabled {
  opacity: 0.7;
}

.search-btn-blur {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(0.19rem);
  background: rgba(165, 165, 165, 0.4);
  mix-blend-mode: hard-light;
  pointer-events: none;
  z-index: 0;
}

.search-btn-label {
  position: relative;
  z-index: 1;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.371rem;
  font-weight: 400;
  font-variation-settings: 'wdth' 100;
  line-height: 0.946;
  white-space: nowrap;
  color: #fff;
}

.search-btn-inset {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
  box-shadow:
    inset 0 0 0.059rem 0 #000,
    inset 0.008rem 0.008rem 0.059rem 0 #000,
    inset 0 0 0.119rem 0.042rem rgba(242, 242, 242, 0.9);
}

.quick-actions {
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.633rem;
}

.quick-item {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.118rem;
  cursor: pointer;

  &--create-club,
  &--club-panel,
  &--club-career {
    width: 1.621rem;
  }

  &--create-union {
    width: 1.692rem;
    gap: 0.124rem;
  }

  &--hidden {
    opacity: 0;
    pointer-events: none;
  }
}

.qa-icon {
  position: relative;
  overflow: hidden;
  border-radius: 0.441rem;

  &--create-club {
    width: 1.621rem;
    height: 1.621rem;
  }

  &--club-panel {
    width: 1.621rem;
    height: 1.621rem;
  }

  &--club-career {
    width: 1.621rem;
    height: 1.621rem;
  }

  &--create-union {
    width: 1.692rem;
    height: 1.692rem;
  }
}

.qa-img {
  position: absolute;
  display: block;
  max-width: none;
  pointer-events: none;
}

.qa-img--cc-small {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  object-fit: contain;
}

.qa-img--cp-vec {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  object-fit: contain;
}

.qa-img--cu-alliance {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  object-fit: contain;
}
.icon-board-chart {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  object-fit: contain;
}
.action-text {
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.304rem;
  font-weight: 510;
  font-variation-settings: 'wdth' 100;
  line-height: normal;
  text-align: center;
  color: #fff;
  text-shadow: 0 0.034rem 0.422rem rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  min-width: 100%;

  &--create-union {
    font-size: 0.319rem;
    text-shadow: 0 0.035rem 0.443rem rgba(0, 0, 0, 0.6);
  }
}

.cards-divider {
  display: flex;
  align-items: center;
  gap: 0.177rem;
  mix-blend-mode: plus-lighter;
  opacity: 0.4;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #f9f9f9;
}

.suit-icon {
  flex-shrink: 0;
  width: 0.445rem;
  height: 0.445rem;
  object-fit: contain;
}

.club-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  padding-top: 0.3rem;
}

.club-empty-text {
  margin: 0;
  padding: 0.24rem 0;
  text-align: center;
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 0.92);
}

.club-banner {
  position: relative;
  margin-bottom: 0.3rem;

  &::before {
    content: '';
    position: absolute;
    inset: -0.213rem;
    border-radius: 1.015rem;
    border: 0.213rem solid rgba(60, 24, 13, 0.8);
    background: #241108;
    backdrop-filter: blur(0.446rem);
    pointer-events: none;
    z-index: 0;

    clip-path: polygon(
      0% 0%,
      100% 0%,
      100% 100%,
      calc(50% + 2.845rem) 100%,
      calc(50% + 2.845rem) calc(100% - 0.3rem),
      calc(50% - 2.845rem) calc(100% - 0.3rem),
      calc(50% - 2.845rem) 100%,
      0% 100%
    );
  }
}

.club-banner-glass {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0.802rem;
  overflow: hidden;
  padding: 0.357rem 0.385rem 1.125rem 0.339rem;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.5px;
    background: linear-gradient(
      68deg,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0) 30%,
      rgba(255, 255, 255, 0) 70%,
      rgba(255, 255, 255, 1) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 5;

    clip-path: polygon(
      0% 0%,
      100% 0%,
      100% 100%,
      calc(50% + 2.845rem) 100%,
      calc(50% + 2.845rem) calc(100% - 0.2rem),
      calc(50% - 2.845rem) calc(100% - 0.2rem),
      calc(50% - 2.845rem) 100%,
      0% 100%
    );
  }
}

.club-banner-blur {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(0.446rem);

  pointer-events: none;
}

.club-main {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 0.16rem;
}

.club-identity {
  display: flex;
  align-items: center;
  gap: 0.269rem;
}

.club-cover {
  flex-shrink: 0;
  width: 1.859rem;
  height: 1.846rem;
  border-radius: 0.458rem;
  object-fit: cover;
  border: 0.01rem solid rgba(255, 255, 255, 0.28);
}

.club-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.227rem;
}

.club-name {
  margin: 0;
  font-size: 0.365rem;
  line-height: 0.83;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
}

.club-id {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.067rem;
}

.club-id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.077rem 0.135rem;
  border-radius: 0.116rem;
  font-size: 0.222rem;
  font-weight: 600;
  color: #444;
  background: rgba(255, 255, 255, 0.56);
}

.club-id-value {
  font-size: 0.279rem;
  font-weight: 300;
  color: #fff;
}

.club-top-metrics {
  display: inline-flex;
  align-items: center;
  gap: 0.217rem;
}

.top-metric-item {
  display: inline-flex;
  align-items: center;
  gap: 0.044rem;
  color: #fff;
  font-size: 0.279rem;
  font-weight: 300;
  line-height: 1;
}

.top-metric-item img {
  width: 0.36rem;
  height: 0.4rem;
  object-fit: contain;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 0.05rem;
  font-size: 0.27rem;
  line-height: 0.95;
  color: rgba(251, 251, 251, 0.95);
}

.stat-item img {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
}

.stat-item--role {
  gap: 0.04rem;
}

.stat-item--role img {
  width: 0.437rem;
  height: 0.437rem;
}

.stat-item span {
  letter-spacing: 0.006rem;
  white-space: nowrap;
}

.stat-item--role span {
  letter-spacing: 0;
  line-height: 1;
}

.enter-btn-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.enter-btn {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.209rem 0.648rem;
  gap: 0.166rem;

  height: 0.929rem;
  border-radius: 0.448rem;
  box-sizing: border-box;

  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  font-size: 0.359rem;
  font-style: normal;
  font-weight: 500;
  line-height: 0.9456;
  color: #fff;

  background: transparent;
  border: none;
  box-shadow: 0.024rem 0.03rem 0.047rem rgba(0, 0, 0, 0.25);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(165, 165, 165, 0.4);
    backdrop-filter: blur(0.19rem);
    mix-blend-mode: hard-light;
    box-shadow:
      inset 0 0 0.059rem #000,
      inset 0.008rem 0.008rem 0.059rem #000,
      inset 0 0 0.119rem 0.042rem rgba(242, 242, 242, 0.9);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.012rem;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.4) 0%,
      rgba(255, 255, 255, 0) 50%,
      rgba(255, 255, 255, 0.5) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.enter-btn-label {
  position: relative;
  z-index: 1;
}

.club-stats-shell {
  position: absolute;
  z-index: 4;
  left: 50%;
  transform: translateX(-50%);
  width: 5.69rem;
  height: 0.917rem;
  border-radius: 0.4rem 0.4rem 0 0;
  background: transparent;
  backdrop-filter: blur(0.446rem);
  bottom: -0.213rem;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
      201deg,
      #696969 0%,
      rgba(255, 255, 255, 0) 38%,
      rgba(255, 255, 255, 0) 73%,
      #666666 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.club-stats-inline {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding: 0 0.26rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.43rem;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;
  padding-left: 0.023rem;
  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  font-size: 0.27rem;
  font-weight: 400;
  line-height: normal;
  color: #fbfbfb;
  letter-spacing: 0.0108rem;
  white-space: nowrap;

  img {
    width: 0.367rem;
    height: 0.367rem;
    object-fit: contain;
  }
}

.stat-item--role {
  gap: 0.051rem;
  padding-left: 0;
  color: white;
  letter-spacing: 0;
  line-height: 0.946;

  img {
    width: 0.394rem;
    height: 0.394rem;
    filter: drop-shadow(0.021rem 0.042rem 0.023rem rgba(0, 0, 0, 0.23))
      drop-shadow(0.047rem 0.093rem 0.031rem rgba(0, 0, 0, 0.13))
      drop-shadow(0.083rem 0.165rem 0.037rem rgba(0, 0, 0, 0.04))
      drop-shadow(0.005rem 0.011rem 0.012rem rgba(0, 0, 0, 0.26));
  }
}

.join-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.532rem;
}

.join-modal {
  position: relative;
  width: 9.717rem;
  max-width: calc(100vw - 1.064rem);
  padding: 0.33rem 0.32rem 0.32rem 0.32rem;
  border-radius: 1.209rem;
  border: 0.024rem solid rgba(242, 242, 242, 0.4);
  // background-image: linear-gradient(
  //   110deg,
  //   rgba(142, 142, 142, 0.3) 2.9%,
  //   rgba(103, 103, 103, 0.4) 43.6%,
  //   rgba(73, 73, 73, 0.5) 89.8%
  // );
  background-color: rgba(25, 25, 25, 0.55);
  box-shadow:
    0.086rem 0.107rem 0.172rem rgba(0, 0, 0, 0.25),
    inset 0.03rem 0.03rem 0.06rem rgba(242, 242, 242, 0.2);
  backdrop-filter: blur(9.917px);
  -webkit-backdrop-filter: blur(9.917px);
  display: flex;
  flex-direction: column;
  gap: 0.405rem;
}

.join-modal-card {
  width: 100%;
  height: 5.032rem;
  border-radius: 0.994rem;
  border: 0.018rem solid rgba(242, 242, 242, 0.8);
  background-image: linear-gradient(143deg, rgb(255, 81, 108) 7.5%, rgb(223, 35, 64) 71.9%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.144rem;
  padding: 0.3rem 0.4rem;
  box-sizing: border-box;
}

.join-modal-logo {
  width: 2.305rem;
  height: 2.288rem;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.join-modal-name {
  margin: 0;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.418rem;
  font-weight: bold;
  line-height: 1.2;
  color: #fff;
  text-align: center;
}

.join-modal-id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.065rem;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.298rem;
  font-weight: normal;
  color: #fff;
}

.join-modal-id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.075rem 0.13rem;
  border-radius: 0.112rem;
  background: rgba(255, 255, 255, 0.56);
  color: #444;
  font-family: 'SF Pro Display', 'PingFang SC', sans-serif;
  font-size: 0.215rem;
  font-weight: 600;
  line-height: 1;
}

.join-modal-member-row {
  margin: 0;
  height: 0.802rem;
  padding: 0 0.523rem;
  border-radius: 4.22rem;
  border: 0.01rem solid rgba(242, 242, 242, 0.4);
  background: rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(1.631px);
  -webkit-backdrop-filter: blur(1.631px);
  box-shadow:
    inset 0px 0px 1.799px 0px black,
    inset 0.249px 0.249px 1.799px 0px black,
    inset 0px 0px 3.599px 0px rgba(242, 242, 242, 0.9);
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;
  font-size: 0.347rem;
  font-weight: 600;
  color: #fbfbfb;
}

.join-modal-member-row img {
  width: 0.507rem;
  height: 0.507rem;
  object-fit: contain;
}

.join-modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.532rem;
  width: 100%;
}

.join-modal-btn {
  flex: 1;
  height: 1.285rem;
  border: 0;
  color: #f9f9f9;
  font-family: 'PingFang SC', sans-serif;
  font-size: 0.405rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}

.join-modal-btn:active {
  transform: scale(0.96);
  opacity: 0.9;
}

.join-modal-btn--cancel {
  border-radius: 1.266rem;
  border: 0.01rem solid #f3f3f3;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(31.659px);
  -webkit-backdrop-filter: blur(31.659px);
}

.join-modal-btn--confirm {
  border-radius: 0.825rem;
  border: 0.018rem solid rgba(242, 242, 242, 0.8);
  background-image: linear-gradient(156.255deg, rgb(85, 243, 41) 7.5472%, rgb(62, 173, 6) 71.919%);
  box-shadow:
    2.795rem 1.899rem 0.949rem 0px rgba(15, 110, 2, 0.01),
    1.792rem 1.216rem 0.87rem 0px rgba(33, 87, 3, 0.04),
    1.003rem 0.683rem 0.728rem 0px rgba(17, 91, 2, 0.14),
    0.444rem 0.302rem 0.541rem 0px rgba(31, 101, 5, 0.24),
    0.115rem 0.08rem 0.302rem 0px rgba(40, 91, 4, 0.27);
}

.join-modal-btn:disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* Fade transition for dialog */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
  .join-modal {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  .join-modal {
    transform: scale(0.9);
  }
}

@media (max-width: 340px) {
  .quick-actions {
    gap: 0.32rem;
  }

  .action-icon {
    width: 1.08rem;
    height: 1.08rem;
  }

  .quick-item {
    width: 1.08rem;
  }

  .quick-item--create-union,
  .quick-item--create-union .action-icon {
    width: 1.12rem;
    height: 1.12rem;
  }

  .action-text {
    font-size: 0.22rem;
  }

  .search-btn {
    width: 1.36rem;
    min-width: 1.36rem;
  }

  .club-banner-glass {
    padding-left: 0.18rem;
    padding-right: 0.18rem;
  }

  .club-name {
    font-size: 0.3rem;
  }

  .club-id-value,
  .top-metric-item {
    font-size: 0.2rem;
  }

  .club-cover {
    width: 1.2rem;
    height: 1.2rem;
  }

  .club-meta {
    min-height: 1.2rem;
  }

  .club-stats-shell {
    width: 4.8rem;
    height: 0.8rem;
    left: 1.649rem;
  }

  .club-stats-inline {
    gap: 0.28rem;
    padding: 0 0.18rem;
  }

  .stat-item {
    font-size: 0.22rem;
  }

  .enter-btn {
    min-width: 1.4rem;
    min-height: 0.66rem;
    font-size: 0.28rem;
  }
}
</style>

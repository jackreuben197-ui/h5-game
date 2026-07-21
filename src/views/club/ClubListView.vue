<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postOrgClubGetApi, postOrgClubJoinApi, postOrgClubSearchByIdApi } from '@/api/org'
import imgBalance from '@/assets/icons/icon_credit_chip.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgClubRoleIcon from '@/assets/icons/club_role_icon.png'
import imgClubRoleIconLight from '@/assets/icons/club_role_icon_light.png'
import iconClubCreate from '@/assets/icons/icon_club_shield_green.png'
import iconClubCareer from '@/assets/icons/icon_club_data_yellow.png'
import iconClubCreateL from '@/assets/icons/icon_club_shield_green_light.png'
import iconClubCareerL from '@/assets/icons/icon_club_data_yellow_light.png'
import imgClubBannerFigma from '@/assets/images/club_banner_bg.png'
import imgClubLogo from '@/assets/images/club_default_logo.png'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { GameDialog } from '@/components/Dialog'
import type { RoomRecord } from '@/api/models/roomcenter'
import { useGameStore } from '@/stores/game'
import { useRoomListStore } from '@/stores/roomList'
import type { ClubInfo } from '@/stores/userInfo'
import { useUserInfoStore } from '@/stores/userInfo'
import { checkIsShowForClubAndTribe, formatUC } from '@/utils/roomVisibility'
import { isChannelPackageHost } from '@/utils/channelPackage'
import { readClubListCache, writeClubListCache } from '@/utils/userClubListCache'
import { t } from '@/i18n'

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
  bannerBg: string
}

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
const isChannelPackage = isChannelPackageHost()

const quickActions: QuickActionItem[] = [
  { id: 1, title: t('UIClub_CreateClub'), kind: 'create-club' },
  { id: 2, title: t('PageMineClubCareer'), kind: 'club-career' },
]

const clubList = computed<ClubCardItem[]>(() => {
  const records = roomListStore.records
  return userInfoStore.clubList.map((club, index) => {
    const fallbackBanner = fallbackBanners[index % fallbackBanners.length]
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
      bannerBg: fallbackBanner,
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
          <AppSvgIcon class="search-icon" name="search" />
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
        <span class="action-icon">
          <template v-if="item.kind === 'create-club'">
            <img
              class="icon-create-shield only-dark"
              :src="iconClubCreate"
              width="61"
              height="61"
              alt=""
            />
            <img
              class="icon-create-shield only-light"
              :src="iconClubCreateL"
              width="61"
              height="61"
              alt=""
            />
          </template>
          <template v-else-if="item.kind === 'club-career'">
            <img
              class="icon-board-chart only-dark"
              :src="iconClubCareer"
              width="61"
              height="61"
              alt=""
            />
            <img
              class="icon-board-chart only-light"
              :src="iconClubCareerL"
              width="61"
              height="61"
              alt=""
            />
          </template>
        </span>
        <span class="action-text">{{ item.title }}</span>
      </button>
    </section>

    <section class="cards-divider">
      <span class="divider-line"></span>
      <div class="cards-icons" aria-hidden="true">
        <AppSvgIcon class="suit-icon suit-icon--spade" name="spade" />
        <AppSvgIcon class="suit-icon suit-icon--heart" name="heart" />
        <AppSvgIcon class="suit-icon suit-icon--club" name="club" />
        <AppSvgIcon class="suit-icon suit-icon--diamond" name="diamond" />
      </div>
      <span class="divider-line"></span>
    </section>

    <section class="club-list">
      <p v-if="loadingMyClubs" class="club-empty-text">正在加载俱乐部...</p>
      <p v-else-if="!displayClubList.length" class="club-empty-text">暂无俱乐部，先去创建一个吧</p>
      <article
        v-for="club in displayClubList"
        :key="club.key"
        class="club-banner"
        @click="goToClubDetail(club.source)"
      >
        <img class="club-banner-bg" :src="club.bannerBg" alt="" aria-hidden="true" />
        <!-- <div class="club-banner-overlay" aria-hidden="true" /> -->

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
                  <img :src="imgChips" alt="" />
                  <span>{{ formatUC(club.activeCount) }}</span>
                </span>
                <span class="top-metric-item">
                  <img :src="imgBalance" alt="" />
                  <span>{{ formatUC(club.chipsCount) }}</span>
                </span>
              </div>
            </div>
          </div>

          <button type="button" class="enter-btn" @click.stop="goToClubDetail(club.source)">
            <span class="enter-btn-label">进入</span>
          </button>
        </div>
        <div class="club-stats-shell" aria-hidden="true">
          <div class="club-stats-inline">
            <span class="stat-item stat-item--role">
              <img class="only-dark" :src="imgClubRoleIcon" alt="" />
              <img class="only-light" :src="imgClubRoleIconLight" alt="" />
              <span>{{ club.roleText }}</span>
            </span>
            <span class="stat-item">
              <AppSvgIcon class="stat-svg-icon stat-svg-icon--table" name="table" />
              <span>{{ club.tableCount }}桌</span>
            </span>
            <span class="stat-item">
              <AppSvgIcon class="stat-svg-icon stat-svg-icon--users" name="users" />
              <span>{{ club.memberCount }}人</span>
            </span>
          </div>
        </div>
      </article>
    </section>

    <GameDialog
      v-model:show="showJoinModal"
      dialog-width="8.454rem"
      :show-cancel-button="true"
      :close-on-click-overlay="true"
      cancel-button-text="取消"
      :confirm-button-text="joinLoading ? '提交中' : '加入'"
      :confirm-button-disabled="joinLoading"
      @confirm="onJoinClub"
      @cancel="closeJoinModal"
    >
      <div class="join-modal-card">
        <img class="join-modal-logo" :src="searchedClubLogo" alt="俱乐部头像" />
        <h3 class="join-modal-name">{{ searchedClubName }}</h3>
        <p class="join-modal-id-row">
          <span class="join-modal-id-tag">ID</span>
          <span>{{ searchedClubDisplayId }}</span>
        </p>
        <p class="join-modal-member-row">
          <AppSvgIcon class="join-modal-member-icon" name="users" />
          <span>{{ searchedClubMembers }}人</span>
        </p>
      </div>
    </GameDialog>

    <NumericKeypad
      :open="searchKeypadOpen"
      :min="0"
      :max="999999"
      :max-length="6"
      :initial-value="searchKeyword"
      :show-input-area="true"
      :allow-leading-zero="true"
      title="搜索俱乐部ID"
      confirm-text="确定"
      @close="onSearchKeypadClose"
      @submit="onSearchKeypadSubmit"
      @key-press="onSearchKeypadKeyPress"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-index {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  color: var(--c-text);
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
  min-height: 1.34rem;
  border-radius: 1.055rem;
  padding: 0.127rem 0.203rem 0.127rem 0.447rem;
  background: linear-gradient(
    98deg,
    rgba(133, 73, 115, 0.96) 0%,
    rgba(177, 69, 87, 0.96) 44%,
    rgba(178, 76, 51, 0.96) 72%,
    rgba(141, 59, 84, 0.96) 100%
  );
  box-shadow:
    inset 0 0.01rem 0.045rem rgba(255, 255, 255, 0.31),
    inset 0 -0.04rem 0.08rem rgba(0, 0, 0, 0.25);
  overflow: hidden;

  @include theme-light {
    background: #fff;
    box-shadow: 0 0.04rem 0.14rem rgba(34, 34, 34, 0.08);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.18) 0%,
      rgba(255, 255, 255, 0.03) 38%,
      rgba(0, 0, 0, 0.2) 100%
    );
    pointer-events: none;

    @include theme-light {
      display: none;
    }
  }
}

.search-trigger {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 1.089rem;
  border: 0;
  border-radius: 999px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.218rem;
  justify-content: flex-start;
  background: transparent;
  color: var(--c-text);
}

.search-icon {
  flex: 0 0 auto;
  width: 0.557rem;
  height: 0.546rem;
  color: #f9f9f9;

  @include theme-light {
    color: rgba(0, 0, 0, 0.28);
  }
}

.search-placeholder {
  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  font-size: 0.3rem;
  line-height: 1.4;
  color: var(--c-text);
  opacity: 0.96;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--c-text);
  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  font-size: 0.393rem;
  line-height: 1.4;
}

.search-input::placeholder {
  color: var(--c-text-muted);
}

.search-btn {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  width: 2.12rem;
  min-height: 1.089rem;
  border-radius: 0.54rem;
  border: 0.012rem solid rgba(244, 241, 248, 0.68);
  padding: 0.209rem 0.58rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text);
  background: rgba(165, 165, 165, 0.1);
  box-shadow:
    0.018rem 0.022rem 0.036rem rgba(0, 0, 0, 0.25),
    inset 0 0 0.045rem #000,
    inset 0.006rem 0.006rem 0.045rem #000,
    inset 0 0 0.09rem rgba(242, 242, 242, 0.9);
  overflow: hidden;

  @include theme-light {
    border-color: var(--c-brand);
    background: rgba(var(--c-brand-rgb), 0.05);
    box-shadow: none;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    backdrop-filter: blur(0.143rem);
    mix-blend-mode: hard-light;
    pointer-events: none;
  }
}

.search-btn:disabled {
  opacity: 0.7;
}

.search-btn-label {
  position: relative;
  z-index: 1;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.38rem;
  font-weight: 500;
  line-height: 0.946;
  letter-spacing: 0;
  text-shadow: 0 0.01rem 0.02rem rgba(0, 0, 0, 0.25);

  @include theme-light {
    text-shadow: none;
  }
}

.quick-actions {
  margin-top: 0.03rem;
  padding-left: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.475rem;
}

.quick-item {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.088rem;
  color: var(--c-text);
}

.quick-item--hidden {
  opacity: 0;
  pointer-events: none;
}

.action-icon {
  position: relative;
  width: 1.62rem;
  height: 1.62rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.action-icon img {
  position: absolute;
  max-width: none;
  object-fit: contain;
}

.action-text {
  width: 100%;
  font-size: 0.228rem;
  line-height: 1;
  font-weight: 500;
  color: var(--c-text);
  text-align: center;
  text-shadow: 0 0.025rem 0.317rem rgba(0, 0, 0, 0.6);
  white-space: nowrap;

  @include theme-light {
    text-shadow: none;
  }
}

.cards-divider {
  margin-top: 0.02rem;
  display: flex;
  align-items: center;
  gap: 0.14rem;
}

.divider-line {
  flex: 1;
  height: 0.02rem;
  background: var(--c-divider);
}

.cards-icons {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;

  @include theme-light {
    .suit-icon--spade,
    .suit-icon--club {
      color: #222;
    }

    .suit-icon--heart,
    .suit-icon--diamond {
      color: var(--c-brand);
    }
  }
}

.suit-icon {
  width: 0.32rem;
  height: 0.32rem;
  color: #f9f9f9;
}

.suit-icon--heart {
  color: #ff5f82;
}

.suit-icon--diamond {
  color: #65dcff;
}

.club-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-bottom: 0.44rem;
}

.club-empty-text {
  margin: 0;
  padding: 0.24rem 0;
  text-align: center;
  font-size: 0.28rem;
  color: var(--c-text-muted);
}

.club-banner {
  position: relative;
  min-height: 3.6279rem;
  // border-radius: 0.802rem;
  overflow: hidden;
  isolation: isolate;
  border: 0;
  background: transparent;

  @include theme-light {
    border-radius: 0.95rem;
    background: var(--c-surface);
    box-shadow: 0 0.04rem 0.14rem rgba(34, 34, 34, 0.08);

    &::before {
      content: '';
      position: absolute;
      z-index: 2;
      inset: 0.16rem;
      border: 0.008rem solid var(--c-border);
      border-radius: 0.802rem;
      pointer-events: none;
    }
  }
}

.club-main {
  position: relative;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.16rem;
  padding: 0.4rem 0.38rem 0;
}

.club-banner-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.82;

  @include theme-light {
    display: none;
  }
}

.club-identity {
  display: flex;
  align-items: center;
  gap: 0.18rem;
}

.club-cover {
  width: 1.859rem;
  height: 1.846rem;
  border-radius: 0.458rem;
  object-fit: cover;
  border: 0.01rem solid rgba(255, 255, 255, 0.28);
  box-shadow:
    0 0.08rem 0.22rem rgba(0, 0, 0, 0.25),
    inset 0 0 0.02rem rgba(255, 255, 255, 0.24);

  @include theme-light {
    border-color: var(--c-border);
    box-shadow: 0 0.08rem 0.22rem rgba(34, 34, 34, 0.08);
  }
}

.club-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 1.846rem;
}

.club-name {
  margin: 0;
  font-size: 0.366rem;
  line-height: 1.08;
  font-weight: 500;
  color: var(--c-text);
}

.club-id {
  margin: 0.11rem 0 0;
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.club-id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.493rem;
  height: 0.377rem;
  border-radius: 0.116rem;
  font-size: 0.223rem;
  font-weight: 600;
  color: #444;
  background: rgba(255, 255, 255, 0.56);

  @include theme-light {
    background: #fff;
  }
}

.club-id-value {
  font-size: 0.279rem;
  font-weight: 300;
  color: var(--c-text);
}

.club-top-metrics {
  margin-top: 0.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
}

.top-metric-item {
  display: inline-flex;
  align-items: center;
  gap: 0.04rem;
  color: var(--c-text);
  font-size: 0.279rem;
  font-weight: 300;
  line-height: 1;
}

.top-metric-item img {
  width: 0.427rem;
  height: 0.427rem;
  object-fit: contain;
}

.club-stats-inline {
  position: relative;
  z-index: 3;
  margin: 0;
  width: 100%;
  min-height: 0.837rem;
  padding: 0 0.26rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.68rem;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 0.05rem;
  font-size: 0.27rem;
  line-height: 0.95;
  color: var(--c-text);
}

.stat-item img {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
}

.stat-svg-icon {
  width: 0.4rem;
  height: 0.4rem;
  color: #f9f9f9;
}

.stat-svg-icon--table {
  @include theme-light {
    color: #4caaff;
  }
}

.stat-svg-icon--users {
  @include theme-light {
    color: #000;
  }
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

.enter-btn {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  border: 0.01rem solid rgba(242, 242, 242, 0.4);
  width: 2.019rem;
  height: 0.929rem;
  margin-top: 0.36rem;
  border-radius: 0.448rem;
  font-size: 0.359rem;
  font-weight: 500;
  color: rgba(249, 249, 249, 0.98);
  background: linear-gradient(
      122.04deg,
      rgba(242, 242, 242, 0.4),
      rgba(255, 255, 255, 0) 44.52%,
      rgba(255, 255, 255, 0.5)
    )
    border-box;
  box-shadow:
    0.02rem 0.025rem 0.04rem rgba(0, 0, 0, 0.25),
    inset 0 0 0.05rem #000,
    inset 0.007rem 0.007rem 0.05rem #000,
    inset 0 0 0.1rem rgba(242, 242, 242, 0.9);

  @include theme-light {
    border-color: transparent;
    color: #fff;
    background: var(--c-brand);
    box-shadow: 0 0.04rem 0.14rem rgba(34, 34, 34, 0.08);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    backdrop-filter: blur(0.14rem);
    background: rgba(165, 165, 165, 0.8);
    mix-blend-mode: hard-light;
    pointer-events: none;

    @include theme-light {
      display: none;
    }
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
  bottom: -0.06rem;
  width: 5.661rem;
  height: 0.913rem;
  border-radius: 0.29rem 0.29rem 0.04rem 0.04rem;
  border: 0.01rem solid rgba(236, 236, 247, 0.24);
  background:
    linear-gradient(180deg, rgba(123, 118, 139, 0.36), rgba(83, 79, 99, 0.22)),
    rgba(48, 44, 64, 0.32);
  backdrop-filter: blur(0.18rem);
  box-shadow:
    inset 0 0.02rem 0.06rem rgba(255, 255, 255, 0.31),
    0 0.06rem 0.12rem rgba(0, 0, 0, 0.25);

  @include theme-light {
    border-color: rgba(0, 0, 0, 0.04);
    background:
      linear-gradient(180deg, rgba(246, 250, 254, 0.98), rgba(238, 246, 252, 0.98)), #f3f8fd;
    box-shadow: 0 0.06rem 0.12rem rgba(34, 34, 34, 0.08);
  }
}

.club-stats-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(120% 130% at 50% -22%, rgba(255, 255, 255, 0.31), transparent);
  pointer-events: none;

  @include theme-light {
    display: none;
  }
}

.club-stats-shell::after {
  content: '';
  position: absolute;
  inset: 0.01rem;
  border-radius: inherit;
  border: 0.01rem solid rgba(236, 236, 247, 0.24);
  pointer-events: none;

  @include theme-light {
    border-color: rgba(0, 0, 0, 0.04);
  }
}

.join-modal-card {
  min-height: 5.02rem;
  border-radius: 0.834rem;
  border: 0.026rem solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.5rem 0.42rem;
}

.join-modal-logo {
  width: 1.893rem;
  height: 1.813rem;
  object-fit: cover;
  border-radius: 0.26rem;
}

.join-modal-name {
  margin: 0;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.597rem;
  font-weight: 700;
  line-height: 1.2;
  color: #fff;
  text-align: center;
}

.join-modal-id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.256rem;
  font-weight: 600;
  color: #fff;
}

.join-modal-id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.445rem;
  height: 0.316rem;
  border-radius: 0.075rem;
  background: rgba(255, 255, 255, 0.4);
  font-size: 0.216rem;
}

.join-modal-member-row {
  margin: 0;
  height: 0.88rem;
  padding: 0 0.3rem;
  border-radius: 0.667rem;
  background: rgba(44, 45, 45, 0.31);
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  font-size: 0.427rem;
  color: #fff;
}

.join-modal-member-icon {
  width: 0.453rem;
  height: 0.453rem;
  color: #fff;
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

  .club-banner {
    min-height: 2.7rem;
    border-radius: 0.4rem;
  }

  .club-main {
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
    width: 4rem;
    height: 0.68rem;
  }

  .club-stats-inline {
    padding: 0 0.18rem;
    gap: 0.1rem;
  }

  .stat-item {
    font-size: 0.18rem;
  }

  .enter-btn {
    min-width: 1.4rem;
    min-height: 0.66rem;
    font-size: 0.28rem;
  }
}
</style>

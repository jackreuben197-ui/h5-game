<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postOrgClubGetApi, postOrgClubJoinApi, postOrgClubSearchByIdApi } from '@/api/org'
import imgSearch from '@/assets/icons/club_search.svg'
import imgPokerSpade from '@/assets/icons/club_poker_spade.svg'
import imgPokerHeart from '@/assets/icons/club_poker_heart.svg'
import imgPokerClub from '@/assets/icons/club_poker_club.svg'
import imgPokerDiamond from '@/assets/icons/club_poker_diamond.svg'
import imgTable from '@/assets/icons/icon_table.png'
import imgPeople from '@/assets/icons/icon_people.png'
import imgBalance from '@/assets/icons/icon_credit_chip.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgClubRoleIcon from '@/assets/icons/club_role_icon.png'
import imgQuickActionCreateShield from '@/assets/images/club_qa_create_club_shield.png'
import imgQuickActionBoardChart from '@/assets/images/club_qa_data_board_chart.png'
import iconBoxClubT from '@/assets/icons/icon_box_club_t.png'
import imgClubBannerFigma from '@/assets/images/club_banner_bg.png'
import imgClubLogo from '@/assets/images/club_default_logo.png'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import { useGameStore } from '@/stores/game'
import type { ClubInfo } from '@/stores/userInfo'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'
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
  return userInfoStore.clubList.map((club, index) => {
    const fallbackBanner = fallbackBanners[index % fallbackBanners.length]
    const displayId = normalizeClubId(club.random_id ?? club.club_id)
    const clubId = normalizeClubId(club.club_id)
    const key = `${clubId || displayId || index}`

    return {
      key,
      source: club,
      name: toSafeString(club.club_name) || t('UIClub_UnnamedClub'),
      clubIdText: displayId || '--',
      roleText: getMemberRoleText(club.user_level),
      activeCount: toSafeNumber(club.user_gold),
      chipsCount: toSafeNumber(club.user_credit),
      tableCount: toSafeNumber(club.tables),
      memberCount: toSafeNumber(club.club_members),
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
    void router.push('/mine/club-career')
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
        <span class="action-icon">
          <template v-if="item.kind === 'create-club'">
            <img class="icon-create-shield" :src="imgQuickActionCreateShield" alt="" />
          </template>
          <template v-else-if="item.kind === 'club-panel'">
            <img class="icon-board-chart" :src="imgQuickActionBoardChart" alt="" />
          </template>
          <template v-else-if="item.kind === 'club-career'">
            <img class="icon-board-chart" :src="iconBoxClubT" width="61" height="61" alt="" />
          </template>
        </span>
        <span class="action-text">{{ item.title }}</span>
      </button>
    </section>

    <section class="cards-divider">
      <span class="divider-line"></span>
      <div class="cards-icons" aria-hidden="true">
        <img :src="imgPokerSpade" alt="" />
        <img :src="imgPokerHeart" alt="" />
        <img :src="imgPokerClub" alt="" />
        <img :src="imgPokerDiamond" alt="" />
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
              <img :src="imgClubRoleIcon" alt="" />
              <span>{{ club.roleText }}</span>
            </span>
            <span class="stat-item">
              <img :src="imgTable" alt="" />
              <span>{{ club.tableCount }}桌</span>
            </span>
            <span class="stat-item">
              <img :src="imgPeople" alt="" />
              <span>{{ club.memberCount }}人</span>
            </span>
          </div>
        </div>
      </article>
    </section>

    <div v-if="showJoinModal" class="join-modal-mask" @click="closeJoinModal">
      <section class="join-modal" @click.stop>
        <div class="join-modal-card">
          <img class="join-modal-logo" :src="searchedClubLogo" alt="俱乐部头像" />
          <h3 class="join-modal-name">{{ searchedClubName }}</h3>
          <p class="join-modal-id-row">
            <span class="join-modal-id-tag">ID</span>
            <span>{{ searchedClubDisplayId }}</span>
          </p>
          <p class="join-modal-member-row">
            <img :src="imgPeople" alt="" aria-hidden="true" />
            <span>{{ searchedClubMembers }}人</span>
          </p>
        </div>

        <div class="join-modal-actions">
          <button
            type="button"
            class="join-modal-btn join-modal-btn--cancel"
            @click="closeJoinModal"
          >
            取消
          </button>
          <button
            type="button"
            class="join-modal-btn join-modal-btn--confirm"
            :disabled="joinLoading"
            @click="onJoinClub"
          >
            {{ joinLoading ? '提交中' : '加入' }}
          </button>
        </div>
      </section>
    </div>

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
.club-index-bg {
  position: relative;
  height: 100dvh;
  background-color: #0f122f;
  background-size: cover;
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
    inset 0 0.01rem 0.045rem rgba(255, 255, 255, 0.35),
    inset 0 -0.04rem 0.08rem rgba(70, 13, 34, 0.35);
  overflow: hidden;

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
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.9);
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
  color: #fff;
  background: rgba(165, 165, 165, 0.1);
  box-shadow:
    0.018rem 0.022rem 0.036rem rgba(0, 0, 0, 0.25),
    inset 0 0 0.045rem rgba(0, 0, 0, 1),
    inset 0.006rem 0.006rem 0.045rem rgba(0, 0, 0, 1),
    inset 0 0 0.09rem rgba(242, 242, 242, 0.9);
  overflow: hidden;

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
  text-shadow: 0 0.01rem 0.02rem rgba(86, 64, 101, 0.35);
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
  color: #fff;
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
  color: #fff;
  text-align: center;
  text-shadow: 0 0.025rem 0.317rem rgba(0, 0, 0, 0.6);
  white-space: nowrap;
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
  background: rgba(249, 249, 249, 0.42);
}

.cards-icons {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;
}

.cards-icons img {
  width: 0.32rem;
  height: 0.32rem;
  object-fit: contain;
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
  color: rgba(255, 255, 255, 0.92);
}

.club-banner {
  position: relative;
  min-height: 3.6279rem;
  // border-radius: 0.802rem;
  overflow: hidden;
  isolation: isolate;
  border: 0;
  // background: rgba(84, 73, 106, 0.22);
  // box-shadow:
  //   0 0.16rem 0.32rem rgba(6, 10, 26, 0.34),
  //   inset 0 0 0.03rem rgba(255, 255, 255, 0.24);
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
    0 0.08rem 0.22rem rgba(8, 8, 8, 0.3),
    inset 0 0 0.02rem rgba(255, 255, 255, 0.24);
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
  color: rgba(249, 249, 249, 0.98);
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
}

.club-id-value {
  font-size: 0.279rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.92);
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
  color: rgba(255, 255, 255, 0.95);
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
    inset 0 0 0.05rem rgba(0, 0, 0, 1),
    inset 0.007rem 0.007rem 0.05rem rgba(0, 0, 0, 1),
    inset 0 0 0.1rem rgba(242, 242, 242, 0.9);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    backdrop-filter: blur(0.14rem);
    background: rgba(165, 165, 165, 0.8);
    mix-blend-mode: hard-light;
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
    inset 0 0.02rem 0.06rem rgba(255, 255, 255, 0.12),
    0 0.06rem 0.12rem rgba(11, 10, 18, 0.22);
}

.club-stats-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    120% 130% at 50% -22%,
    rgba(255, 255, 255, 0.22),
    rgba(255, 255, 255, 0)
  );
  pointer-events: none;
}

.club-stats-shell::after {
  content: '';
  position: absolute;
  inset: 0.01rem;
  border-radius: inherit;
  border: 0.01rem solid rgba(255, 255, 255, 0.18);
  pointer-events: none;
}

.join-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.72rem;
}

.join-modal {
  width: 8.454rem;
  max-width: 100%;
  padding: 0.42rem;
  border-radius: 0.97rem;
  border: 0.025rem solid rgba(255, 255, 255, 0.38);
  background:
    linear-gradient(126deg, rgba(142, 142, 142, 0.6) 0%, rgba(72, 72, 72, 0.92) 100%),
    rgba(30, 30, 30, 0.65);
  box-shadow:
    0.09rem 0.11rem 0.18rem rgba(0, 0, 0, 0.25),
    inset 0.05rem 0.1rem 0.4rem rgba(242, 242, 242, 0.25),
    inset 0 0 0.23rem rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(0.4rem);
}

.join-modal-card {
  min-height: 5.02rem;
  border-radius: 0.834rem;
  border: 0.026rem solid rgba(255, 255, 255, 0.16);
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
  background: rgba(255, 255, 255, 0.25);
  font-size: 0.216rem;
}

.join-modal-member-row {
  margin: 0;
  height: 0.88rem;
  padding: 0 0.3rem;
  border-radius: 0.667rem;
  background: rgba(0, 0, 0, 0.31);
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  font-size: 0.427rem;
  color: #f9f9f9;
}

.join-modal-member-row img {
  width: 0.453rem;
  height: 0.453rem;
}

.join-modal-actions {
  margin-top: 0.48rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
}

.join-modal-btn {
  flex: 1;
  min-height: 1.436rem;
  border-radius: 1.055rem;
  border: 0;
  color: #fff;
  font-family: 'Afacad', 'PingFang SC', sans-serif;
  font-size: 0.4rem;
  font-weight: 500;
}

.join-modal-btn--cancel {
  background: rgba(0, 0, 0, 0.3);
}

.join-modal-btn--confirm {
  background: linear-gradient(180deg, #05e7ae 0%, #027a5b 100%);
  border: 0.013rem solid rgba(255, 255, 255, 0.5);
}

.join-modal-btn:disabled {
  opacity: 0.72;
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

    &::before {
      inset: 0.06rem;
      border-radius: 0.33rem;
    }

    &::after {
      inset: 0.08rem;
      border-radius: 0.31rem;
    }
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

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
import imgBalance from '@/assets/icons/icon_balance.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgClubRoleIcon from '@/assets/images/club_role_icon.png'
import imgQuickActionCreateBg from '@/assets/images/club_qa_create_club_bg_shape.svg'
import imgQuickActionCreateShield from '@/assets/images/club_qa_create_club_shield.svg'
import imgQuickActionBoardBg from '@/assets/images/club_qa_data_board_bg_shape.svg'
import imgQuickActionBoardChart from '@/assets/images/club_qa_data_board_chart.svg'
import imgQuickActionUnionSwash from '@/assets/images/club_qa_union_swash.svg'
import imgQuickActionUnionClubSmall from '@/assets/images/club_qa_union_club_small.svg'
import imgQuickActionUnionClubLarge from '@/assets/images/club_qa_union_club_large.svg'
import imgClubBannerFigma from '@/assets/images/club_banner_bg.png'
import imgClubCoverFigma from '@/assets/images/club_cover_avatar.png'
import imgClubCoverB from '@/assets/images/home_comming_soon_1.png'
import imgClubCoverC from '@/assets/images/home_comming_soon_2.png'
import imgBannerBgB from '@/assets/images/game_type_card_bg.png'
import imgBannerBgC from '@/assets/images/game_list_card_table_bg.png'
import type { ClubInfo } from '@/stores/userInfo'
import { useUserInfoStore } from '@/stores/userInfo'

type QuickActionKind = 'create-club' | 'club-panel' | 'create-union'

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

const searchKeyword = ref('')
const loadingMyClubs = ref(false)
const searchLoading = ref(false)
const showJoinModal = ref(false)
const joinLoading = ref(false)
const searchedClub = ref<ClubInfo | null>(null)

const fallbackCovers = [imgClubCoverFigma, imgClubCoverB, imgClubCoverC]
const fallbackBanners = [imgClubBannerFigma, imgBannerBgB, imgBannerBgC]

const quickActions: QuickActionItem[] = [
  { id: 1, title: '创建俱乐部', kind: 'create-club' },
  { id: 2, title: '创建俱乐部', kind: 'club-panel' },
  { id: 3, title: '创建联盟', kind: 'create-union', hidden: true },
]

const clubList = computed<ClubCardItem[]>(() => {
  return userInfoStore.clubList.map((club, index) => {
    const fallbackCover = fallbackCovers[index % fallbackCovers.length]
    const fallbackBanner = fallbackBanners[index % fallbackBanners.length]
    const displayId = normalizeClubId(club.random_id ?? club.club_id)
    const clubId = normalizeClubId(club.club_id)
    const key = `${clubId || displayId || index}`

    return {
      key,
      source: club,
      name: toSafeString(club.club_name) || '未命名俱乐部',
      clubIdText: displayId || '--',
      roleText: getMemberRoleText(club.member_type),
      activeCount: toSafeNumber(club.user_gold),
      chipsCount: toSafeNumber(club.user_credit),
      tableCount: toSafeNumber(club.tables),
      memberCount: toSafeNumber(club.club_members),
      cover: toSafeString(club.logo) || fallbackCover,
      bannerBg: toSafeString(club.banner) || fallbackBanner,
    }
  })
})

const searchedClubDisplayId = computed(() =>
  normalizeClubId(searchedClub.value?.random_id ?? searchedClub.value?.club_id) || '--',
)

const searchedClubName = computed(() => toSafeString(searchedClub.value?.club_name) || '俱乐部名称')

const searchedClubMembers = computed(() => toSafeNumber(searchedClub.value?.club_members))

const searchedClubLogo = computed(() => {
  const logo = toSafeString(searchedClub.value?.logo)
  return logo || imgClubCoverFigma
})

function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

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
  if (role === 2) return '管理员'
  if (role === 3) return '创建者'
  if (role === 4) return '代理'
  return '成员'
}

function goToClubDetail(club?: ClubInfo): void {
  if (club) {
    userInfoStore.setCurrentClub(club)
  }
  void router.push('/club/index')
}

function goToRoomHistory(): void {
  void router.push('/club/room/history')
}

function onQuickAction(itemId: number): void {
  if (itemId === 2) {
    goToRoomHistory()
    return
  }

  void router.push('/club/create')
}

function onSearchInput(value: string): void {
  searchKeyword.value = value.replace(/\D+/g, '')
}

function onSearchInputEvent(event: Event): void {
  const target = event.target as HTMLInputElement | null
  onSearchInput(target?.value || '')
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

  loadingMyClubs.value = true
  try {
    const response = await postOrgClubGetApi()
    if (Number(response.code) !== 0) {
      throw new Error(response.message || '获取俱乐部失败')
    }

    const list = Array.isArray(response.data) ? response.data : []
    userInfoStore.setClubList(list)
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取俱乐部失败'
    showFailToast(message)
  } finally {
    loadingMyClubs.value = false
  }
}

async function onSearchClub(): Promise<void> {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    showFailToast('请输入俱乐部ID')
    return
  }

  if (searchLoading.value) {
    return
  }

  searchLoading.value = true
  try {
    const response = await postOrgClubSearchByIdApi({ club_random_id: Number(keyword) })
    if (Number(response.code) !== 0) {
      throw new Error(response.message || '查询俱乐部失败')
    }

    const targetClub = response.data
    if (!targetClub) {
      showFailToast('未找到俱乐部')
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
    const message = error instanceof Error ? error.message : '查询俱乐部失败'
    showFailToast(message)
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
    showFailToast('俱乐部信息异常，无法加入')
    return
  }

  joinLoading.value = true
  try {
    const response = await postOrgClubJoinApi({ club_id: clubId })
    if (Number(response.code) !== 0) {
      throw new Error(response.message || '加入俱乐部失败')
    }

    showSuccessToast(response.message || '加入申请已提交')
    showJoinModal.value = false
    await loadMyClubList(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加入俱乐部失败'
    showFailToast(message)
  } finally {
    joinLoading.value = false
  }
}

onMounted(() => {
  void loadMyClubList()
})
</script>

<template>
  <div class="page-shell club-index">
    <section class="search-row">
      <div class="search-shell" aria-label="俱乐部搜索">
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
            placeholder="搜索俱乐部ID"
            @input="onSearchInputEvent"
            @keyup.enter="onSearchClub"
          />
        </label>
        <button
          type="button"
          class="search-btn"
          :disabled="searchLoading"
          @click="onSearchClub"
        >
          <span class="search-btn-label">{{ searchLoading ? '搜索中' : '搜索' }}</span>
        </button>
      </div>
    </section>

    <section class="quick-actions">
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
              class="icon-create-bg"
              :src="imgQuickActionCreateBg"
              alt=""
              aria-hidden="true"
            />
            <img class="icon-create-shield" :src="imgQuickActionCreateShield" alt="" />
          </template>
          <template v-else-if="item.kind === 'club-panel'">
            <img
              class="icon-board-bg"
              :src="imgQuickActionBoardBg"
              alt=""
              aria-hidden="true"
            />
            <img class="icon-board-chart" :src="imgQuickActionBoardChart" alt="" />
          </template>
          <template v-else>
            <img
              class="icon-union-swash"
              :src="imgQuickActionUnionSwash"
              alt=""
              aria-hidden="true"
            />
            <img
              class="icon-union-club-small"
              :src="imgQuickActionUnionClubSmall"
              alt=""
              aria-hidden="true"
            />
            <img class="icon-union-club-large" :src="imgQuickActionUnionClubLarge" alt="" />
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
      <p v-else-if="!clubList.length" class="club-empty-text">暂无俱乐部，先去创建一个吧</p>
      <article
        v-for="club in clubList"
        :key="club.key"
        class="club-banner"
        @click="goToClubDetail(club.source)"
      >
        <img
          class="club-banner-bg"
          :src="club.bannerBg"
          alt=""
          aria-hidden="true"
        />
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
                  <img :src="imgBalance" alt="" />
                  <span>{{ formatCount(club.activeCount) }}</span>
                </span>
                <span class="top-metric-item">
                  <img :src="imgChips" alt="" />
                  <span>{{ formatCount(club.chipsCount) }}</span>
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
  </div>
</template>

<style scoped lang="scss">
.club-index-bg {
  position: relative;
  min-height: 100dvh;
  background-color: #0f122f;
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
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.24rem);
}

.search-row {
  padding: 0;
}

.search-shell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 0.99rem;
  border-radius: 0.79rem;
  padding: 0.09rem 0.15rem 0.09rem 0.34rem;
  background: rgba(14, 14, 14, 0.15);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    backdrop-filter: blur(0.004rem);
    mix-blend-mode: overlay;
    pointer-events: none;
  }
}

.search-trigger {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0.8rem;
  border: 0;
  border-radius: 999px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.16rem;
  justify-content: flex-start;
  background: transparent;
  color: #fff;
}

.search-icon {
  flex: 0 0 auto;
  width: 0.34rem;
  height: 0.34rem;
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
  font-size: 0.3rem;
  line-height: 1.4;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.9);
}

.search-btn {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  width: 1.54rem;
  min-height: 0.82rem;
  border-radius: 1.26rem;
  border: 0.009rem solid rgba(242, 242, 242, 0.4);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(165, 165, 165, 0.8);
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
  font-size: 0.28rem;
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: 0;
}

.quick-actions {
  margin-top: 0.03rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.475rem;
}

.quick-item {
  flex: 0 0 auto;
  width: 1.216rem;
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
  width: 1.216rem;
  height: 1.216rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 0.01rem solid rgba(255, 255, 255, 0.78);
  border-radius: 0.331rem;
  background: rgba(255, 255, 255, 0.2);
}

.action-icon img {
  position: absolute;
  max-width: none;
  object-fit: contain;
}

.icon-create-bg {
  width: 1.9rem;
  height: 1.46rem;
  left: -0.7rem;
  top: 0.03rem;
}

.icon-create-shield {
  width: 0.69rem;
  height: 0.69rem;
  left: 0.265rem;
  top: 0.27rem;
}

.icon-board-bg {
  width: 1.26rem;
  height: 1.19rem;
  left: -0.57rem;
  top: 0;
}

.icon-board-chart {
  width: 0.68rem;
  height: 0.68rem;
  left: 0.275rem;
  top: 0.264rem;
}

.quick-item--create-union {
  width: 1.269rem;
}

.quick-item--create-union .action-icon {
  width: 1.269rem;
  height: 1.269rem;
  border: 0.006rem solid rgba(255, 255, 255, 0.44);
  border-radius: 0.331rem;
  background: linear-gradient(160.93deg, rgba(0, 255, 246, 0.71) 10.97%, rgba(0, 189, 214, 0.71) 87.16%);
}

.icon-union-swash {
  width: 2.15rem;
  height: 2.3rem;
  left: -0.43rem;
  top: -0.04rem;
  transform: rotate(15deg);
}

.icon-union-club-small {
  width: 0.61rem;
  height: 0.65rem;
  left: 0.52rem;
  top: 0.29rem;
  transform: rotate(15deg);
}

.icon-union-club-large {
  width: 0.82rem;
  height: 0.88rem;
  left: 0.03rem;
  top: 0.31rem;
  transform: rotate(15deg);
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
  min-height: 2.78rem;
  border-radius: 0.46rem;
  overflow: hidden;
  isolation: isolate;
  border: 0;
  // background: rgba(84, 73, 106, 0.22);
  // box-shadow:
  //   0 0.16rem 0.32rem rgba(6, 10, 26, 0.34),
  //   inset 0 0 0.03rem rgba(255, 255, 255, 0.24);

  &::before {
    content: '';
    position: absolute;
    inset: 0.07rem;
    border-radius: 0.38rem;
    border: 0.07rem solid rgba(238, 236, 249, 0.3);
    box-shadow:
      0 0 0.02rem rgba(255, 255, 255, 0.2),
      inset 0 0 0.03rem rgba(255, 255, 255, 0.12);
    pointer-events: none;
    z-index: 4;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0.09rem;
    border-radius: 0.36rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0));
    pointer-events: none;
    z-index: 2;
  }
}

.club-main {
  position: relative;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.16rem;
  padding: 0.3rem 0.28rem 0;
}

.club-banner-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.82;
}

.club-banner-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(30, 27, 43, 0.08), rgba(17, 17, 25, 0.5)),
    radial-gradient(108% 88% at 12% -18%, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0)),
    radial-gradient(86% 62% at 100% 100%, rgba(116, 155, 255, 0.22), rgba(116, 155, 255, 0));
  backdrop-filter: blur(0.17rem);
}

.club-identity {
  display: flex;
  align-items: center;
  gap: 0.18rem;
}

.club-cover {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 0.24rem;
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
  min-height: 1.4rem;
}

.club-name {
  margin: 0;
  font-size: 0.36rem;
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
  min-width: 0.36rem;
  height: 0.28rem;
  border-radius: 0.1rem;
  font-size: 0.18rem;
  font-weight: 600;
  color: #444;
  background: rgba(255, 255, 255, 0.56);
}

.club-id-value {
  font-size: 0.24rem;
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
  font-size: 0.22rem;
  font-weight: 300;
  line-height: 1;
}

.top-metric-item img {
  width: 0.28rem;
  height: 0.28rem;
  object-fit: contain;
}

.club-stats-inline {
  position: relative;
  z-index: 3;
  margin: 0;
  width: 100%;
  min-height: 0.56rem;
  padding: 0 0.26rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 0.05rem;
  font-size: 0.2rem;
  line-height: 0.95;
  color: rgba(251, 251, 251, 0.95);
}

.stat-item img {
  width: 0.28rem;
  height: 0.28rem;
  object-fit: contain;
}

.stat-item--role {
  gap: 0.04rem;
}

.stat-item--role img {
  width: 0.3rem;
  height: 0.3rem;
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
  min-width: 1.56rem;
  min-height: 0.72rem;
  margin-top: 0.36rem;
  border-radius: 0.34rem;
  font-size: 0.3rem;
  font-weight: 500;
  color: rgba(249, 249, 249, 0.98);
  background: transparent;
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
  width: 4.36rem;
  height: 0.72rem;
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
  background: radial-gradient(120% 130% at 50% -22%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
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

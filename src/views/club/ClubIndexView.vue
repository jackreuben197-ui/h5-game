<script setup lang="ts">
import { useRouter } from 'vue-router'
import imgSearch from '@/assets/icons/club/search.svg'
import imgPokerSpade from '@/assets/icons/club/poker_spade.svg'
import imgPokerHeart from '@/assets/icons/club/poker_heart.svg'
import imgPokerClub from '@/assets/icons/club/poker_club.svg'
import imgPokerDiamond from '@/assets/icons/club/poker_diamond.svg'
import imgTable from '@/assets/icons/icon_table.png'
import imgPeople from '@/assets/icons/icon_people.png'
import imgBalance from '@/assets/icons/icon_balance.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgClubRoleIcon from '@/assets/images/club/figma/club_role_icon.png'
import imgQuickActionCreateBg from '@/assets/images/club/figma/quick-actions/qa_create_club_bg_shape.svg'
import imgQuickActionCreateShield from '@/assets/images/club/figma/quick-actions/qa_create_club_shield.svg'
import imgQuickActionBoardBg from '@/assets/images/club/figma/quick-actions/qa_data_board_bg_shape.svg'
import imgQuickActionBoardChart from '@/assets/images/club/figma/quick-actions/qa_data_board_chart.svg'
import imgQuickActionUnionSwash from '@/assets/images/club/figma/quick-actions/qa_union_swash.svg'
import imgQuickActionUnionClubSmall from '@/assets/images/club/figma/quick-actions/qa_union_club_small.svg'
import imgQuickActionUnionClubLarge from '@/assets/images/club/figma/quick-actions/qa_union_club_large.svg'
import imgClubBannerFigma from '@/assets/images/club/figma/club_banner_bg.png'
import imgClubCoverFigma from '@/assets/images/club/figma/club_cover_avatar.png'
import imgClubCoverB from '@/assets/images/home_comming_soon_1.png'
import imgClubCoverC from '@/assets/images/home_comming_soon_2.png'
import imgBannerBgB from '@/assets/images/game_type_card_bg.png'
import imgBannerBgC from '@/assets/images/game_list_card_table_bg.png'

type QuickActionKind = 'create-club' | 'club-panel' | 'create-union'

interface QuickActionItem {
  id: number
  title: string
  kind: QuickActionKind
  hidden?: boolean
}

interface ClubItem {
  id: number
  name: string
  clubId: string
  role: string
  activeCount: number
  chipsCount: number
  tableCount: number
  memberCount: number
  cover: string
  bannerBg: string
}

const router = useRouter()

const quickActions: QuickActionItem[] = [
  { id: 1, title: '创建俱乐部', kind: 'create-club' },
  { id: 2, title: '创建俱乐部', kind: 'club-panel' },
  { id: 3, title: '创建联盟', kind: 'create-union', hidden: true },
]

const clubList: ClubItem[] = [
  {
    id: 1,
    name: 'Club Poker, ALC',
    clubId: '8677650585',
    role: '管理员',
    activeCount: 1923,
    chipsCount: 19231,
    tableCount: 360,
    memberCount: 145,
    cover: imgClubCoverFigma,
    bannerBg: imgClubBannerFigma,
  },
  {
    id: 2,
    name: 'Holdem Prime',
    clubId: '4201982251',
    role: '发牌员',
    activeCount: 876,
    chipsCount: 9231,
    tableCount: 198,
    memberCount: 89,
    cover: imgClubCoverB,
    bannerBg: imgBannerBgB,
  },
  {
    id: 3,
    name: 'Royal Shark Union',
    clubId: '5900221187',
    role: '管理员',
    activeCount: 2368,
    chipsCount: 45210,
    tableCount: 420,
    memberCount: 176,
    cover: imgClubCoverC,
    bannerBg: imgBannerBgC,
  },
]

function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

function goToClubDetail(): void {
  void router.push('/club/detail')
}

function goToRoomHistory(): void {
  void router.push('/club/room/history')
}

function onQuickAction(itemId: number): void {
  if (itemId === 2) {
    goToRoomHistory()
    return
  }

  goToClubDetail()
}
</script>

<template>
  <div class="page-shell club-index">
    <section class="search-row">
      <div class="search-shell" aria-label="俱乐部搜索">
        <button type="button" class="search-trigger">
          <img class="search-icon" :src="imgSearch" alt="" />
          <span class="search-placeholder">搜索俱乐部</span>
        </button>
        <button type="button" class="search-btn">
          <span class="search-btn-label">搜索</span>
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
            <img class="icon-create-bg" :src="imgQuickActionCreateBg" alt="" aria-hidden="true" />
            <img class="icon-create-shield" :src="imgQuickActionCreateShield" alt="" />
          </template>
          <template v-else-if="item.kind === 'club-panel'">
            <img class="icon-board-bg" :src="imgQuickActionBoardBg" alt="" aria-hidden="true" />
            <img class="icon-board-chart" :src="imgQuickActionBoardChart" alt="" />
          </template>
          <template v-else>
            <img class="icon-union-swash" :src="imgQuickActionUnionSwash" alt="" aria-hidden="true" />
            <img class="icon-union-club-small" :src="imgQuickActionUnionClubSmall" alt="" aria-hidden="true" />
            <img class="icon-union-club-large" :src="imgQuickActionUnionClubLarge" alt="" />
          </template>
        </span>
        <span class="action-text">{{ item.title }}</span>
      </button>
    </section>

    <section class="cards-divider">
      <span class="divider-line" />
      <div class="cards-icons" aria-hidden="true">
        <img :src="imgPokerSpade" alt="" />
        <img :src="imgPokerHeart" alt="" />
        <img :src="imgPokerClub" alt="" />
        <img :src="imgPokerDiamond" alt="" />
      </div>
      <span class="divider-line" />
    </section>

    <section class="club-list">
      <article v-for="club in clubList" :key="club.id" class="club-banner" @click="goToClubDetail">
        <!-- <img class="club-banner-bg" :src="club.bannerBg" alt="" aria-hidden="true" /> -->
        <!-- <div class="club-banner-overlay" aria-hidden="true" /> -->

        <div class="club-main">
          <div class="club-identity">
            <img class="club-cover" :src="club.cover" alt="" />

            <div class="club-meta">
              <h2 class="club-name">{{ club.name }}</h2>
              <p class="club-id">
                <span class="club-id-tag">ID</span>
                <span class="club-id-value">{{ club.clubId }}</span>
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

          <button type="button" class="enter-btn" @click.stop="goToClubDetail">
            <span class="enter-btn-label">进入</span>
          </button>
        </div>
        <div class="club-stats-shell" aria-hidden="true">
          <div class="club-stats-inline">
            <span class="stat-item stat-item--role">
              <img :src="imgClubRoleIcon" alt="" />
              <span>{{ club.role }}</span>
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

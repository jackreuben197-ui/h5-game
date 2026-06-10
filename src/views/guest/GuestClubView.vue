<script setup lang="ts">
import imgSearch from '@/assets/icons/club_search.svg'
import imgPokerSpade from '@/assets/icons/club_poker_spade.svg'
import imgPokerHeart from '@/assets/icons/club_poker_heart.svg'
import imgPokerClub from '@/assets/icons/club_poker_club.svg'
import imgPokerDiamond from '@/assets/icons/club_poker_diamond.svg'
import imgQuickActionCreateShield from '@/assets/images/club_qa_create_club_shield.png'
import imgQuickActionBoardChart from '@/assets/images/club_qa_data_board_chart.png'
import { useLoginModalStore } from '@/stores/loginModal'

const loginModalStore = useLoginModalStore()

interface QuickActionItem {
  id: number
  title: string
  kind: 'create-club' | 'club-panel'
  hidden?: boolean
}

const quickActions: QuickActionItem[] = [
  { id: 1, title: '创建俱乐部', kind: 'create-club' },
  { id: 2, title: '创建俱乐部', kind: 'club-panel', hidden: true },
]

function notifyNotLogin(): void {
  loginModalStore.open()
}
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
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="6"
            readonly
            placeholder="搜索俱乐部ID"
            @focus="notifyNotLogin"
            @click="notifyNotLogin"
          />
        </label>
        <button type="button" class="search-btn" @click="notifyNotLogin">
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
        @click="notifyNotLogin"
      >
        <span class="action-icon">
          <template v-if="item.kind === 'create-club'">
            <img class="icon-create-shield" :src="imgQuickActionCreateShield" alt="" />
          </template>
          <template v-else-if="item.kind === 'club-panel'">
            <img class="icon-board-chart" :src="imgQuickActionBoardChart" alt="" />
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
      <p class="club-empty-text">登录后查看俱乐部</p>
    </section>
  </div>
</template>

<style scoped lang="scss">
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
}

.search-btn-label {
  position: relative;
  z-index: 1;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.38rem;
  font-weight: 500;
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
  padding: 0.6rem 0;
  text-align: center;
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.85);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
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
import imgQuickActionCreateShield from '@/assets/images/club_qa_create_club_shield.png'
import imgQuickActionBoardChart from '@/assets/images/club_qa_data_board_chart.png'
import { useLoginModalStore } from '@/stores/loginModal'
import { getLocale } from '@/i18n'

const loginModalStore = useLoginModalStore()

const isLightTheme = computed(() => theme.value === 'light')
const imgSearch = computed(() => (isLightTheme.value ? imgSearchLight : imgSearchDark))
const imgPokerSpade = computed(() => (isLightTheme.value ? imgPokerSpadeLight : imgPokerSpadeDark))
const imgPokerHeart = computed(() => (isLightTheme.value ? imgPokerHeartLight : imgPokerHeartDark))
const imgPokerClub = computed(() => (isLightTheme.value ? imgPokerClubLight : imgPokerClubDark))
const imgPokerDiamond = computed(() =>
  isLightTheme.value ? imgPokerDiamondLight : imgPokerDiamondDark,
)

const localized = (en: string, cn: string): string => (getLocale() === 'en' ? en : cn)

interface QuickActionItem {
  id: number
  titleEn: string
  titleCn: string
  kind: 'create-club' | 'club-panel'
  hidden?: boolean
}

const quickActions: QuickActionItem[] = [
  { id: 1, titleEn: 'Create Club', titleCn: '创建俱乐部', kind: 'create-club' },
  { id: 2, titleEn: 'Create Club', titleCn: '创建俱乐部', kind: 'club-panel', hidden: true },
]

function notifyNotLogin(): void {
  loginModalStore.open()
}
</script>

<template>
  <div class="page-shell club-index">
    <section class="search-row">
      <div class="search-shell" :aria-label="localized('Club search', '俱乐部搜索')">
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
            :placeholder="localized('Search Club ID', '搜索俱乐部ID')"
            @focus="notifyNotLogin"
            @click="notifyNotLogin"
          />
        </label>
        <button type="button" class="search-btn" @click="notifyNotLogin">
          <div class="search-btn-blur" aria-hidden="true" />
          <span class="search-btn-label">{{ localized('Search', '搜索') }}</span>
          <div class="search-btn-inset" aria-hidden="true" />
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
        </div>
        <span class="action-text" :class="`action-text--${item.kind}`">{{ localized(item.titleEn, item.titleCn) }}</span>
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
      <p class="club-empty-text">{{ localized('Log in to view clubs', '登录后查看俱乐部') }}</p>
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
    padding: 0.012rem;
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
  margin-top: 0.03rem;
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
  color: #fff;
  cursor: pointer;

  &--create-club,
  &--club-panel {
    width: 1.621rem;
  }
}

.quick-item--hidden {
  opacity: 0;
  pointer-events: none;
}

.qa-icon {
  position: relative;
  overflow: hidden;
  border-radius: 0.441rem;

  &--create-club,
  &--club-panel {
    width: 1.621rem;
    height: 1.621rem;
  }
}

.qa-img {
  position: absolute;
  display: block;
  max-width: none;
  pointer-events: none;
}

.qa-img--cc-small,
.qa-img--cp-vec {
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

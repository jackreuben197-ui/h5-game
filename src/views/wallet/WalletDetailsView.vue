<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import bannerBgUrl from '@/assets/images/card_bg3.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import TagPill from '@/components/wallet/TagPill.vue'
import iconChips from '@/assets/icons/icon_chip_red.png'
import icIncome from '@/assets/icons/wallet/ic_income.svg'
import icOutcome from '@/assets/icons/wallet/ic_outcome.svg'
import icTime from '@/assets/icons/wallet/ic_time.svg'
import { postUserGoldChangeLogApi } from '@/api/user'

import type { UserGoldChangeLogRecord } from '@/api/models/user'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'
import { resolveOpCodeText } from '@/utils/transText'
import { t } from '@/i18n'

const userInfoStore = useUserInfoStore()
const router = useRouter()
const userInfo = computed(() => userInfoStore.userInfo?.user)

const logs = ref<UserGoldChangeLogRecord[]>([])

function formatAmount(record: UserGoldChangeLogRecord): string {
  const val = record.gold_change ?? 0
  const abs = Math.abs(val / 100).toLocaleString()
  return val >= 0 ? `+${abs}` : `-${abs}`
}

function formatBalance(val?: number): string {
  if (val === undefined) return '-'
  return (val / 100).toLocaleString()
}

function formatTime(raw?: string): string {
  if (!raw) return '-'
  return raw.replace('T', ' ').slice(11, 16)
}

function getOpLabel(code?: string): string {
  if (!code) return '-'
  const text = resolveOpCodeText(code)
  const label = text && text !== `OpCodeString_${code}` ? text : code
  return label.replace(/\bUC\b/g, '联盟币')
}

function goGiftUc(): void {
  void router.push('/wallet/gift-uc')
}

onMounted(async () => {
  const res = await postUserGoldChangeLogApi({ limit: 20, offset: 0 })
  logs.value = res.data?.list ?? []
})
</script>

<template>
  <div class="details-page" :style="{ backgroundImage: `url(${sharpBgUrl})` }">
    <HeaderBack :title="t('Wallet_Details')" extra-padding />

    <div class="details-content">
      <div class="user-card-wrapper">
        <div class="user-card">
          <div
            class="user-card__banner-bg"
            :style="{ backgroundImage: `url(${bannerBgUrl})` }"
          ></div>
          <div class="user-card-inner">
            <div class="user-info-section">
              <div class="avatar-box">
                <img :src="(userInfo?.avatar as string) || ''" alt="avatar" />
              </div>
              <div class="user-text">
                <span class="user-name">{{ userInfo?.nickname ?? '-' }}</span>
                <div class="user-id-badge">
                  <TagPill label="ID" variant="id" />
                  <span class="id-value">{{ userInfo?.un_id ?? userInfo?.unid ?? '-' }}</span>
                </div>
              </div>
            </div>

            <div class="gift-row">
              <button class="gift-entry" @click="goGiftUc">
                <span class="gift-entry__label">赠送</span>
                <img src="@/assets/icons/img_gift_btn.svg" alt="gift" class="gift-entry__icon" />
              </button>
            </div>

            <div class="balance-section">
              <span class="balance-label">Balance:</span>
              <span class="balance-value">{{ formatUC(userInfo?.gold as number) ?? 0 }}</span>
              <img :src="iconChips" alt="chips" class="chip-icon" />
            </div>
          </div>
        </div>
      </div>

      <div class="transactions-list">
        <div v-for="(item, idx) in logs" :key="idx" class="transaction-card">
          <div class="card__bg-blur" :style="{ backgroundImage: `url(${sharpBgUrl})` }"></div>
          <div class="transaction-card__top">
            <div class="transaction-card__left">
              <div :class="['icon-circle', (item.gold_change ?? 0) >= 0 ? 'in' : 'out']">
                <img
                  v-if="(item.gold_change ?? 0) >= 0"
                  :src="icIncome"
                  alt=""
                  class="icon-circle__img"
                />
                <img
                  v-else
                  :src="icOutcome"
                  alt=""
                  class="icon-circle__img"
                />
              </div>
              <div class="info">
                <div :class="['category-badge', (item.gold_change ?? 0) >= 0 ? 'category-badge--in' : 'category-badge--out']">{{ getOpLabel(item.op_code) }}</div>
                <div class="title-row">
                  <span class="title">{{ item.name ?? '-' }}</span>
                  <div v-if="item.src_random_id" class="id-row">
                    <span class="id-badge">ID</span>
                    <span class="id-number">{{ item.src_random_id }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="amount" :class="(item.gold_change ?? 0) >= 0 ? 'in' : 'out'">
              {{ formatAmount(item) }}
            </div>
          </div>

          <div class="divider"></div>

          <div class="transaction-card__bottom">
            <div class="time">
              <img :src="icTime" alt="" class="time-icon" />
              <span class="time-text">{{ formatTime(item.create_time) }}</span>
            </div>
            <div class="balance">
              <span class="balance-text">{{ formatBalance(item.gold_after) }}</span>
              <img :src="iconChips" alt="chips" class="icon-chip" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.details-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #fff;

  // Фон задаётся инлайном (:style), поэтому светлый перебиваем через !important.
  @include theme-light-own {
    background-image: url('@/assets/images/main_bg_light.webp') !important;
    color: var(--wallet-l-text);

    :deep(.back-trigger),
    :deep(.back-icon) {
      color: var(--wallet-l-text);
    }

    :deep(.title) {
      text-shadow: none;
    }
  }
}

.details-page::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  background: rgba(0, 0, 0, 0.15);

  @include theme-light-own {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

.details-page > * {
  position: relative;
  z-index: 1;
}

.details-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.32rem 0 0.8rem;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 0;
  }
}

.user-card-wrapper {
  position: relative;
  width: 100%;
  margin: 0 auto 0.4rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-card {
  position: relative;
  width: 9.2393rem;
  height: 4.1235rem;
  border-radius: 1.4209rem;
  overflow: hidden;
  padding: 0.4rem 0.8rem;
  display: flex;
  backdrop-filter: blur(16.5px);
  -webkit-backdrop-filter: blur(16.5px);
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.252px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0.25) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 3;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(0, 0, 0, 0.13);
    pointer-events: none;
    z-index: 1;
  }

  @include theme-light-own {
    background: rgba(226, 226, 226, 0.7);
    border: 1.252px solid #fff;
    border-radius: 1.42rem;
    opacity: 0.8;
    backdrop-filter: blur(0.47px);
    -webkit-backdrop-filter: blur(0.47px);
    box-shadow: none;

    &::before {
      display: none;
    }

    &::after {
      background: transparent;
    }
  }
}

.user-card > *:not(.card__bg-blur):not(.user-card__banner-bg) {
  position: relative;
  z-index: 2;
}

.user-card__banner-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  opacity: 0.65;

  @include theme-light-own {
    display: none;
  }
}

.user-card-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.gift-entry {
  width: 3rem;
  height: 0.8273rem;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 0.7229rem;
  padding: 0 0.05rem 0 0.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffffc6;
  cursor: pointer;
  flex-shrink: 0;

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);
    color: var(--wallet-l-text);
  }
}

.gift-entry__icon {
  width: 1.0rem;
  height: 0.85rem;
  object-fit: contain;
  flex-shrink: 0;

  @include theme-light-own {
    filter: invert(1);
  }
}

.gift-entry__label {
  font-family: 'SF Pro', sans-serif;
  font-size: 0.3939rem;
  font-weight: 500;
  line-height: 1;
}

.user-info-section {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.avatar-box {
  width: 74.949px;
  height: 71.05px;
  border-radius: 53.33px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.user-name {
  color: #fff;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }

  font-family: 'SF Pro', sans-serif;
  font-size: 22.394px;
  font-weight: 700;
  line-height: 83%;
}

.user-id-badge {
  display: flex;
  align-items: center;
  gap: 0.06rem;
}

.id-value {
  font-family: var(--wallet-font-num);
  font-weight: 400;
  font-size: 0.23rem;
  color: #fff;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.gift-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0;
}

.balance-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.12rem;
  margin-top: 0.1rem;
}

.balance-label {
  color: #f9f9f9;

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
  }

  font-family: 'SF Pro', sans-serif;
  font-size: 11.33px;
  font-weight: 400;
  line-height: 140%;
}

.balance-value {
  color: #f9f9f9;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }

  font-family: 'SF Pro', sans-serif;
  font-size: 16.33px;
  font-weight: 590;
  line-height: 140%;
}

.chip-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.transactions-list {
  display: flex;
  width: 100%;
  max-width: 9.9937rem;
  padding: 0 0.38rem;
  flex-direction: column;
  align-items: center;
  gap: 0.3125rem;
  margin: 0 auto;
}

.card__bg-blur {
  position: absolute;
  inset: -12px;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  filter: blur(10px);
  pointer-events: none;
  z-index: 0;

  @include theme-light-own {
    display: none;
  }
}

.transaction-card {
  position: relative;
  display: flex;
  padding: 0.3rem 0.6rem;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.01rem;
  align-self: stretch;
  border-radius: 0.9962rem;
  backdrop-filter: blur(16.5px);
  -webkit-backdrop-filter: blur(16.5px);
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(0, 0, 0, 0.28);
    pointer-events: none;
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.0169rem;
    background: linear-gradient(139deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0) 100%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 3;
  }

  @include theme-light-own {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--wallet-l-surface);
    box-shadow: 0 0.08rem 0.2rem rgba(70, 79, 88, 0.1);

    &::after {
      background: transparent;
    }

    &::before {
      background: linear-gradient(139deg, rgba(0, 0, 0, 0.16) 0%, rgba(0, 0, 0, 0.04) 100%);
    }
  }
}

.transaction-card > *:not(.card__bg-blur) {
  position: relative;
  z-index: 2;
}

.transaction-card__top {
  display: flex;
  align-items: center;
  gap: 0.24rem;
  align-self: stretch;
}

.transaction-card__left {
  display: flex;
  align-items: center;
  gap: 0.32rem;
}

.icon-circle {
  width: 0.6759rem;
  height: 0.6759rem;
  border-radius: 0.2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.icon-circle__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.time-icon {
  width: 0.53rem;
  height: 0.53rem;
  object-fit: contain;

  @include theme-light-own {
    filter: brightness(0);
  }
}

.info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 0.08rem;
  flex: 1 0 0;
}

.category-badge {
  display: flex;
  padding: 0 0.24rem;
  justify-content: center;
  align-items: center;
  border-radius: 0.8267rem;
  color: #ffffffaa;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.2997rem;
  font-weight: 500;
  line-height: 140%;
  width: fit-content;

  &--in {
    background: rgba(131, 239, 74, 0.52);
  }

  &--out {
    background: rgba(249, 22, 57, 0.52);
  }

  @include theme-light-own {
    &--in {
      background: rgba(116, 221, 60, 0.18);
      color: #74dd3c;
    }

    &--out {
      background: rgba(249, 22, 57, 0.16);
      color: #f91639;
    }
  }
}

.title-row {
  display: flex;
  flex-direction: column;
}

.title {
  color: #fff;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }

  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.3264rem;
  font-weight: 600;
  line-height: 140%;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 0.1307rem;
}

.id-badge {
  display: flex;
  padding: 0.0747rem 0.1307rem;
  justify-content: center;
  align-items: center;
  border-radius: 0.1123rem;
  background: rgba(255, 255, 255, 0.4);
  color: #fff;
  font-family: 'SF Pro', sans-serif;
  font-size: 0.2155rem;
  font-weight: 590;
  width: fit-content;

  @include theme-light-own {
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
  }
}

.id-number {
  color: #fff;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }

  font-family: 'SF Pro', sans-serif;
  font-size: 0.256rem;
  font-weight: 590;
}

.amount {
  margin-left: auto;
  font-size: 0.48rem;
  font-weight: 600;
  font-family: 'SF Pro', sans-serif;

  &.in {
    color: #87f050;
  }
  &.out {
    color: #ff4b4b;
  }

  // Цвет прихода совпадает с заливкой иконки ic_income.svg.
  @include theme-light-own {
    &.in {
      color: #74dd3c;
    }
    &.out {
      color: #f91639;
    }
  }
}

.divider {
  width: 7.5906rem;
  height: 0.5px;
  border-bottom: 0.5px dashed rgba(255, 255, 255, 0.5);
  align-self: center;
  margin: 0.2rem 0;

  @include theme-light-own {
    border-bottom-color: var(--wallet-l-divider);
  }
}

.transaction-card__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
}

.time {
  display: flex;
  align-items: center;
  gap: 0.16rem;
}

.time-text {
  color: #fff;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }

  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.32rem;
  font-weight: 400;
  line-height: 78%;
  letter-spacing: 0.24px;
}

.balance {
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.balance-text {
  color: #f9f9f9;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }

  font-family: 'SF Pro', sans-serif;
  font-size: 0.3562rem;
  font-weight: 590;
  line-height: 140%;
}

.icon-chip {
  width: 0.8rem;
  height: 0.8rem;
  object-fit: contain;
}
</style>

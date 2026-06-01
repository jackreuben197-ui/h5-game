<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import bannerBgUrl from '@/assets/images/card_bg3.png'
import AppBar from '@/components/wallet/AppBar.vue'
import TagPill from '@/components/wallet/TagPill.vue'
import iconChips from '@/assets/icons/icon_chip_red.png'
import { postUserGoldChangeLogApi } from '@/api/user'

import type { UserGoldChangeLogRecord } from '@/api/models/user'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'

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
    <AppBar title="明细" :show-actions="false" />

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
              <button class="gift-entry" @click="goGiftUc">
                <span class="gift-entry__label">赠送</span>
                <img src="@/assets/icons/wallet/ic_gift.png" alt="gift" class="gift-entry__icon" />
              </button>
              <div class="user-text">
                <span class="user-name">{{ userInfo?.nickname ?? '-' }}</span>
                <div class="user-id-badge">
                  <TagPill label="ID" variant="id" />
                  <span class="id-value">{{ userInfo?.un_id ?? userInfo?.unid ?? '-' }}</span>
                </div>
              </div>
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
                <svg
                  v-if="(item.gold_change ?? 0) >= 0"
                  width="26"
                  height="26"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.38467 12.699L7.75448 14.328L12.6427 19.2163L17.531 14.328L15.902 12.699L13.7948 14.805L13.7948 6.1218L11.4907 6.1218L11.4907 14.805L9.38467 12.699Z"
                    fill="#05E7AE"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M25.3457 4.60831C25.3457 3.38611 24.8602 2.21397 23.996 1.34974C23.1317 0.485518 21.9596 2.96023e-07 20.7374 4.02871e-07L4.60831 1.81292e-06C3.38611 1.91977e-06 2.21397 0.48552 1.34974 1.34974C0.485518 2.21397 2.96023e-07 3.38611 4.02871e-07 4.60831L1.81292e-06 20.7374C1.91977e-06 21.9596 0.48552 23.1317 1.34974 23.996C2.21397 24.8602 3.38611 25.3457 4.60831 25.3457L20.7374 25.3457C21.9596 25.3457 23.1317 24.8602 23.996 23.996C24.8602 23.1317 25.3457 21.9596 25.3457 20.7374L25.3457 4.60831ZM20.7374 2.30415L4.60831 2.30416C3.99721 2.30416 3.41114 2.54692 2.97903 2.97903C2.54691 3.41114 2.30415 3.99721 2.30415 4.60831L2.30416 20.7374C2.30416 21.3485 2.54692 21.9346 2.97903 22.3667C3.41114 22.7988 3.99721 23.0416 4.60831 23.0416L20.7374 23.0415C21.3485 23.0415 21.9346 22.7988 22.3667 22.3667C22.7988 21.9346 23.0416 21.3485 23.0416 20.7374L23.0415 4.60831C23.0415 3.99721 22.7988 3.41114 22.3667 2.97903C21.9346 2.54691 21.3485 2.30415 20.7374 2.30415Z"
                    fill="#05E7AE"
                  />
                </svg>
                <svg
                  v-else
                  width="26"
                  height="26"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style="transform: rotate(180deg)"
                >
                  <path
                    d="M9.38467 12.699L7.75448 14.328L12.6427 19.2163L17.531 14.328L15.902 12.699L13.7948 14.805L13.7948 6.1218L11.4907 6.1218L11.4907 14.805L9.38467 12.699Z"
                    fill="#FF4B4B"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M25.3457 4.60831C25.3457 3.38611 24.8602 2.21397 23.996 1.34974C23.1317 0.485518 21.9596 2.96023e-07 20.7374 4.02871e-07L4.60831 1.81292e-06C3.38611 1.91977e-06 2.21397 0.48552 1.34974 1.34974C0.485518 2.21397 2.96023e-07 3.38611 4.02871e-07 4.60831L1.81292e-06 20.7374C1.91977e-06 21.9596 0.48552 23.1317 1.34974 23.996C2.21397 24.8602 3.38611 25.3457 4.60831 25.3457L20.7374 25.3457C21.9596 25.3457 23.1317 24.8602 23.996 23.996C24.8602 23.1317 25.3457 21.9596 25.3457 20.7374L25.3457 4.60831ZM20.7374 2.30415L4.60831 2.30416C3.99721 2.30416 3.41114 2.54692 2.97903 2.97903C2.54691 3.41114 2.30415 3.99721 2.30415 4.60831L2.30416 20.7374C2.30416 21.3485 2.54692 21.9346 2.97903 22.3667C3.41114 22.7988 3.99721 23.0416 4.60831 23.0416L20.7374 23.0415C21.3485 23.0415 21.9346 22.7988 22.3667 22.3667C22.7988 21.9346 23.0416 21.3485 23.0416 20.7374L23.0415 4.60831C23.0415 3.99721 22.7988 3.41114 22.3667 2.97903C21.9346 2.54691 21.3485 2.30415 20.7374 2.30415Z"
                    fill="#FF4B4B"
                  />
                </svg>
              </div>
              <div class="info">
                <div class="category-badge">{{ item.op_code ?? '-' }}</div>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0ZM10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2ZM10 4C10.2449 4.00003 10.4813 4.08996 10.6644 4.25272C10.8474 4.41547 10.9643 4.63975 10.993 4.883L11 5V9.586L13.707 12.293C13.8863 12.473 13.9905 12.7144 13.9982 12.9684C14.006 13.2223 13.9168 13.4697 13.7488 13.6603C13.5807 13.8508 13.3464 13.9703 13.0935 13.9944C12.8406 14.0185 12.588 13.9454 12.387 13.79L12.293 13.707L9.293 10.707C9.13758 10.5514 9.03776 10.349 9.009 10.131L9 10V5C9 4.73478 9.10536 4.48043 9.29289 4.29289C9.48043 4.10536 9.73478 4 10 4Z"
                  fill="white"
                />
              </svg>
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
  position: fixed;
  right: 0.7024rem;
  top: 2.0594rem;
  width: 4.0976rem;
  height: 0.8273rem;
  z-index: 4;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0.7229rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.gift-entry__icon-wrap {
  position: absolute;
  right: -0.009rem;
  top: -0.012rem;
  width: 0.987rem;
  height: 0.851rem;
  border-radius: 50%;
  background: radial-gradient(110% 110% at 30% 25%, #3cd8ff 0%, #2588ef 64%, #1160d2 100%);
  box-shadow: 0 0 0.02rem rgba(255, 255, 255, 0.85) inset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  float: left;
}

.gift-entry__icon {
  width: 0.48rem;
  height: 0.48rem;
  right: 0.1rem;
  position: absolute;
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
}

.balance-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.16rem;
  margin-top: 0.4rem;
}

.balance-label {
  color: #f9f9f9;
  font-family: 'SF Pro', sans-serif;
  font-size: 11.33px;
  font-weight: 400;
  line-height: 140%;
}

.balance-value {
  color: #f9f9f9;
  font-family: 'SF Pro', sans-serif;
  font-size: 16.33px;
  font-weight: 590;
  line-height: 140%;
}

.chip-icon {
  width: 29px;
  height: 29px;
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
  background: rgba(255, 255, 255, 0.21);
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.2997rem;
  font-weight: 500;
  line-height: 140%;
  width: fit-content;
}

.title-row {
  display: flex;
  flex-direction: column;
}

.title {
  color: #fff;
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
  border-radius: 0.1121rem;
  background: rgba(255, 255, 255, 0.4);
  color: #fff;
  font-family: 'SF Pro', sans-serif;
  font-size: 0.2155rem;
  font-weight: 590;
  width: fit-content;
}

.id-number {
  color: #fff;
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
    color: #05e7ae;
  }
  &.out {
    color: #ff4b4b;
  }
}

.divider {
  width: 7.5906rem;
  height: 0.5px;
  border-bottom: 0.5px dashed rgba(255, 255, 255, 0.5);
  align-self: center;
  margin: 0.2rem 0;
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

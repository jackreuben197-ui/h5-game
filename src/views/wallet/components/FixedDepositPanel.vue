<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showToast } from 'vant'
import bannerBgUrl from '@/assets/images/wallet/banner_bg.png'
import defaultAvatar from '@/assets/images/default_avatar.png'
import iconChips from '@/assets/icons/wallet/ic_coins.png'
import icGift from '@/assets/icons/wallet/ic_gift.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import TagPill from '@/components/wallet/TagPill.vue'
import GlassButton from '@/components/Button/GlassButton.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import { t } from '@/i18n'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'
import { postRechargeGoldApi } from '@/api/order'

const router = useRouter()
const userInfoStore = useUserInfoStore()

const currentClub = computed(() => userInfoStore.currentClub ?? userInfoStore.clubList[0] ?? null)
const clubId = computed(() =>
  currentClub.value?.club_id ? Number(currentClub.value.club_id) : undefined,
)
const clubName = computed(() => String(currentClub.value?.club_name ?? '').trim())
const clubBalance = computed(() => Number(currentClub.value?.user_gold ?? 0))

const userName = computed(() => String(userInfoStore.userInfo?.user?.nickname ?? '-'))
const userId = computed(() => userInfoStore.userInfo?.user?.un_id ?? '-')
const avatarUrl = computed(
  () => String(userInfoStore.userInfo?.user?.avatar ?? '') || defaultAvatar,
)

const depositAmount = ref('')
const showConfirm = ref(false)
const showSuccess = ref(false)
const submitting = ref(false)

const confirmText = computed(() => t('H5Deposit_ConfirmText', clubName.value, depositAmount.value))

function goGiftUc(): void {
  void router.push('/wallet/gift-uc')
}

function goDetails(): void {
  void router.push('/wallet/details')
}

function onNext(): void {
  const value = Number(depositAmount.value)
  if (!depositAmount.value || Number.isNaN(value) || value <= 0) {
    showFailToast(t('H5Deposit_EnterValidAmount'))
    return
  }
  showConfirm.value = true
}

async function onConfirmDeposit(): Promise<void> {
  if (submitting.value) return
  showConfirm.value = false
  submitting.value = true

  try {
    const res = await postRechargeGoldApi(
      {
        amount: Number(depositAmount.value),
        legal_tender: 0,
        gold_type: 1,
        pay_id: 0,
        price_id: 0,
        pay_price: 0,
        pay_address: '',
        pay_address_save: false,
        order_no: '',
        name: '',
      },
      clubId.value,
    )

    if (res.code === 0) {
      showSuccess.value = true
    } else if (res.code === 20066) {
      showToast({
        message: t('H5Deposit_OrderUnderReview'),
        overlay: true,
        duration: 2000,
        className: 'fixed-deposit-review-toast',
        overlayClass: 'fixed-deposit-review-overlay',
      })
    } else {
      showFailToast(res.message || t('H5Deposit_Failed'))
    }
  } catch (e) {
    console.error('Fixed deposit failed', e)
    showFailToast(t('H5Deposit_Failed'))
  } finally {
    submitting.value = false
  }
}

function onSuccessConfirm(): void {
  showSuccess.value = false
  depositAmount.value = ''
}
</script>

<template>
  <div class="deposit-screen">
    <HeaderBack :title="t('UIGuildFund_RechargeText')" extra-padding>
      <template #right>
        <span class="details-btn">
          <GlassButton :label="t('Wallet_Details')" @click="goDetails" />
        </span>
      </template>
    </HeaderBack>

    <div class="deposit-scrollable">
      <div class="deposit-content">
        <div class="user-card-wrapper">
          <div class="user-card">
            <div
              class="user-card__banner-bg"
              :style="{ backgroundImage: `url(${bannerBgUrl})` }"
            ></div>
            <div class="user-card-inner">
              <div class="user-info-section">
                <div class="avatar-box">
                  <img :src="avatarUrl" alt="avatar" />
                </div>
                <button class="gift-entry" @click="goGiftUc">
                  <span class="gift-entry__label">赠送</span>
                  <img :src="icGift" alt="gift" class="gift-entry__icon" />
                </button>
                <div class="user-text">
                  <span class="user-name">{{ userName }}</span>
                  <div class="user-id-badge">
                    <TagPill label="ID" variant="id" />
                    <span class="id-value">{{ userId }}</span>
                  </div>
                </div>
              </div>

              <div class="balance-section">
                <span class="balance-label">Balance:</span>
                <span class="balance-value">{{ formatUC(clubBalance) }}</span>
                <img :src="iconChips" alt="chips" class="chip-icon" />
              </div>
            </div>
          </div>
        </div>

        <div class="deposit-form">
          <label class="deposit-form__label">{{ t('UIClub_FundGive_Recharge') }}</label>
          <div class="deposit-form__input-wrap">
            <input
              v-model="depositAmount"
              type="number"
              inputmode="decimal"
              class="deposit-form__input"
              :placeholder="t('Uimine_ptcz_playgold')"
            />
          </div>
        </div>

        <PrimaryButton
          :text="t('Uimine_ptcz_btn_next')"
          class="deposit-cta"
          :loading="submitting"
          :disabled="submitting"
          @click="onNext"
        />
      </div>
    </div>

    <GameDialog
      v-model:show="showConfirm"
      :message="confirmText"
      :show-cancel-button="true"
      :cancel-button-text="t('adaptation10013')"
      :confirm-button-text="t('adaptation10008')"
      @cancel="showConfirm = false"
      @confirm="onConfirmDeposit"
    />

    <GameDialog
      v-model:show="showSuccess"
      :title="t('adaptation10007')"
      :message="t('UIGuildFund_RtTips005NoTell')"
      :confirm-button-text="t('Wallet_Confirm')"
      @confirm="onSuccessConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.deposit-screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-image: url('@/assets/images/main_bg.webp');

  @include theme-light {
    background-color: var(--c-page);
    background-image: url('@/assets/images/main_bg_light.png');
  }
}

.details-btn {
  display: inline-block;
  width: 1.87rem;
}

/* 明细按钮使用与「赠送」一致的深色玻璃样式 */
.details-btn :deep(.gb) {
  background: rgba(0, 0, 0, 0.5);

  @include theme-light {
    background: rgba(134, 134, 134, 0.16);
    color: var(--c-text);
  }
}

.deposit-scrollable {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.64rem);
}

.deposit-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0 0.455rem;
  margin-top: 0.2rem;
}

/* 与钱包明细页 user-card-wrapper 完全一致的卡片 UI */
.user-card-wrapper {
  position: relative;
  width: 100%;
  margin: 0 auto;
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

  @include theme-light {
    background: #fff;
    box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.12);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(0, 0, 0, 0.28);
    pointer-events: none;
    z-index: 1;

    @include theme-light {
      background: #fff;
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.055rem;
    background: linear-gradient(
      180deg,
      rgba(240, 205, 225, 0.95) 0%,
      rgba(220, 175, 205, 0.4) 50%,
      rgba(240, 205, 225, 0.95) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 3;

    @include theme-light {
      background: linear-gradient(139deg, rgba(0, 0, 0, 0.12) 0%, transparent 100%);
    }
  }
}

.user-card > *:not(.user-card__banner-bg) {
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

  @include theme-light {
    opacity: 0;
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

  @include theme-light {
    background: rgba(134, 134, 134, 0.16);
    color: var(--c-text);
  }
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
  color: var(--c-text);
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
  color: var(--c-text);
}

.balance-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.16rem;
  margin-top: 0.4rem;
}

.balance-label {
  color: var(--c-text);
  font-family: 'SF Pro', sans-serif;
  font-size: 11.33px;
  font-weight: 400;
  line-height: 140%;
}

.balance-value {
  color: var(--c-text);
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

.deposit-form {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  padding: 0 0.1rem;
}

.deposit-form__label {
  font-size: 0.36rem;
  font-weight: 500;
  color: var(--c-text);
}

.deposit-form__input-wrap {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.22);
  border: 0.18px solid rgba(255, 255, 255, 0.45);
  border-radius: 1rem;
  padding: 0.36rem 0.48rem;
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);

  @include theme-light {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.12);
  }
}

.deposit-form__input {
  flex: 1;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--c-text);
  font-size: 0.4rem;
  font-weight: 500;
  font-family: var(--wallet-font-num);

  &::placeholder {
    color: var(--c-text-muted);
  }
}

.deposit-cta {
  width: 100%;
  margin-top: 0.2rem;
}

:global(.fixed-deposit-review-overlay) {
  background: rgba(12, 12, 12, 0.6) !important;
  backdrop-filter: blur(0.9rem);
  -webkit-backdrop-filter: blur(0.9rem);
}

:global(.fixed-deposit-review-toast.van-toast) {
  width: calc(100% - 1.0667rem);
  max-width: 9.0133rem;
  min-height: 2.48rem;
  padding: 0.4rem 0.48rem;
  border: 0.0133rem solid rgba(255, 255, 255, 0.8);
  border-radius: 1.28rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(1.3333rem);
  -webkit-backdrop-filter: blur(1.3333rem);
}

:global(.fixed-deposit-review-toast .van-toast__text) {
  font-size: 0.48rem;
}
</style>

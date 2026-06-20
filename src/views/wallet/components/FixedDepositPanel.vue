<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import bannerBgUrl from '@/assets/images/wallet/banner_bg.png'
import defaultAvatar from '@/assets/images/default_avatar.png'
import iconChips from '@/assets/icons/wallet/ic_coins.png'
import icGift from '@/assets/icons/wallet/ic_gift.png'
import AppBar from '@/components/wallet/AppBar.vue'
import PillButton from '@/components/wallet/PillButton.vue'
import TagPill from '@/components/wallet/TagPill.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import { t } from '@/i18n'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'
import { postRechargeGoldApi } from '@/api/order'

const router = useRouter()
const userInfoStore = useUserInfoStore()

const currentClub = computed(() => userInfoStore.currentClub ?? userInfoStore.clubList[0] ?? null)
const clubId = computed(() => (currentClub.value?.club_id ? Number(currentClub.value.club_id) : undefined))
const clubName = computed(() => String(currentClub.value?.club_name ?? '').trim())
const clubBalance = computed(() => Number(currentClub.value?.user_gold ?? 0))

const userName = computed(() => String(userInfoStore.userInfo?.user?.nickname ?? '-'))
const userId = computed(() => userInfoStore.userInfo?.user?.un_id ?? '-')
const avatarUrl = computed(() => String(userInfoStore.userInfo?.user?.avatar ?? '') || defaultAvatar)

const depositAmount = ref('')
const showConfirm = ref(false)
const showSuccess = ref(false)
const submitting = ref(false)

const confirmText = computed(() =>
  t('H5Deposit_ConfirmText', clubName.value, depositAmount.value),
)

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
      const reviewMsg = t('Wallet_OrderUnderReview')
      showToast(reviewMsg !== 'Wallet_OrderUnderReview' ? reviewMsg : '订单审核中，请稍后再试')
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
  <div class="deposit-screen" :style="{ backgroundImage: `url(${mainBgUrl})` }">
    <AppBar :title="t('UIGuildFund_RechargeText')" :show-actions="false">
      <template #actions>
        <PillButton :label="`${t('Wallet_Details')} >`" @click="goDetails" />
      </template>
    </AppBar>

    <div class="deposit-scrollable">
      <div class="deposit-content">
        <div class="user-card-wrapper">
          <div class="user-card">
            <div class="user-card-inner">
              <div class="user-info-section">
                <div class="avatar-box">
                  <img :src="avatarUrl" alt="avatar" />
                </div>
                <div class="user-text">
                  <span class="user-name">{{ userName }}</span>
                  <div class="user-id-badge">
                    <TagPill label="ID" variant="id" />
                    <span class="id-value">{{ userId }}</span>
                  </div>
                </div>
              </div>

              <div class="gift-row">
                <button class="gift-entry" @click="goGiftUc">
                  <span class="gift-entry__label">赠送</span>
                  <img :src="icGift" alt="gift" class="gift-entry__icon" />
                </button>
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
.deposit-screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.deposit-screen::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  background: rgba(0, 0, 0, 0.15);
}

.deposit-screen > * {
  position: relative;
  z-index: 1;
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

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(0, 0, 0, 0.13);
    pointer-events: none;
    z-index: 1;
  }

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
}

.user-card > * {
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

.gift-row {
  display: flex;
  justify-content: flex-end;
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
  margin-top: 0.2rem;
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
  width: 24px;
  height: 24px;
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
  color: #f9f9f9;
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
}

.deposit-form__input {
  flex: 1;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 0.4rem;
  font-weight: 500;
  font-family: var(--wallet-font-num);

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.deposit-cta {
  width: 100%;
  margin-top: 0.2rem;
}
</style>

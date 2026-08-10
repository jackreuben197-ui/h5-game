<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import { t } from '@/i18n'
import { useUserInfoStore, type ClubInfo } from '@/stores/userInfo'
import { postRechargeGoldApi } from '@/api/order'
import { getUserInfoApi } from '@/api/user'

import { isPrivateDomainMode } from '@/utils/channelPackage'

// ─── i18n helper: returns fallback when key not translated ────────────────────
function tx(key: string, fallback: string): string {
  const val = t(key)
  return val !== key ? val : fallback
}

const props = defineProps<{
  club?: ClubInfo | null
}>()

const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()
const isChannelPackage = isPrivateDomainMode()

const activeClub = computed(() => props.club ?? userInfoStore.currentClub ?? null)

const amount = ref('')
const submitting = ref(false)
const showConfirm = ref(false)
const showSuccess = ref(false)

const clubName = computed(() => activeClub.value?.club_name ?? '')
const clubId = computed(() => {
  const id = activeClub.value?.club_id
  return id != null ? Number(id) : undefined
})

const amountNumber = computed(() => Number(amount.value))
const canSubmit = computed(() => Number.isFinite(amountNumber.value) && amountNumber.value > 0)

const confirmMessage = computed(() =>
  `${tx('Wallet_DepositApplyTo', '确定向')} ${clubName.value} ${tx('Wallet_Club', '俱乐部')} ${tx('Wallet_DepositApplyAmount', '申请充值')}${amount.value}${tx('Wallet_DepositCoinUnit', '联盟币')}？`,
)

function onAmountInput(e: Event): void {
  // integer V amount only
  amount.value = (e.target as HTMLInputElement).value.replace(/[^\d]/g, '')
}

function onNext(): void {
  if (!canSubmit.value) return
  showConfirm.value = true
}

async function refreshBalance(): Promise<void> {
  try {
    await getUserInfoApi()
  } catch (e) {
    console.error('Failed to refresh balance after deposit', e)
  }
}

async function onConfirmRecharge(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await postRechargeGoldApi(
      {
        // V → fen (×100), matching the unit used by the other recharge channels.
        // In fixed-deposit mode the backend computes the price, so pay fields are 0.
        amount: amountNumber.value * 100,
        legal_tender: 0,
        gold_type: 1,
        pay_id: 0,
        price_id: 0,
        pay_price: 0,
        pay_address: '',
        pay_address_save: false,
        order_no: '',
      },
      clubId.value,
    )

    showConfirm.value = false

    if (res.code === 0) {
      showSuccess.value = true
      void refreshBalance()
    } else if (res.code === 20066) {
      showToast(tx('Wallet_OrderUnderReview', '订单审核中，请稍后再试'))
    } else {
      showToast(res.message || tx('Wallet_DepositFailed', '充值申请失败'))
    }
  } catch (e) {
    console.error('Fixed-deposit recharge failed', e)
    showConfirm.value = false
    showToast(tx('Wallet_DepositFailed', '充值申请失败'))
  } finally {
    submitting.value = false
  }
}

function onSuccessConfirm(): void {
  showSuccess.value = false
  amount.value = ''
  void router.push({ path: '/wallet/details', query: route.query })
}
</script>

<template>
  <div class="club-deposit">
    <div class="club-deposit__card">
      <span class="club-deposit__label">{{ tx('Wallet_DepositAmount', '充值金额') }}</span>
      <input
        class="club-deposit__input"
        type="text"
        inputmode="numeric"
        :placeholder="tx('Wallet_DepositAmountPlaceholder', '请输入充值金额')"
        :value="amount"
        @input="onAmountInput"
      />
    </div>

    <div
      class="club-deposit__cta-wrapper"
      :class="{ 'club-deposit__cta-wrapper--channel': isChannelPackage }"
    >
      <PrimaryButton
        :text="tx('Wallet_Next', '下一步')"
        :disabled="!canSubmit"
        glass
        class="club-deposit__cta"
        @click="onNext"
      />
    </div>

    <!-- Confirm dialog -->
    <GameDialog
      v-model:show="showConfirm"
      :message="confirmMessage"
      :show-cancel-button="true"
      :cancel-button-text="tx('Wallet_Cancel', '取消')"
      :confirm-button-text="tx('Wallet_Ok', '好的')"
      :confirm-button-disabled="submitting"
      @confirm="onConfirmRecharge"
      @cancel="showConfirm = false"
    />

    <!-- Success dialog -->
    <GameDialog
      v-model:show="showSuccess"
      :title="tx('Wallet_Tips', '温馨提示')"
      :confirm-button-text="tx('Wallet_Confirm', '确认')"
      @confirm="onSuccessConfirm"
    >
      <div class="club-deposit__success">
        <span class="club-deposit__success-main">
          {{ tx('Wallet_DepositSuccess', '申请充值成功！') }}
        </span>
        <span class="club-deposit__success-sub">
          {{ tx('Wallet_DepositContactService', '你有疑问请联系客服') }}
        </span>
      </div>
    </GameDialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-deposit {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
  padding-bottom: 2.5rem;
}

// Figma node 53:63379 — flat label + rounded soft-light input (no glass wrapper).
.club-deposit__card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.club-deposit__label {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.373rem;
  line-height: 1.2;
  color: #f9f9f9;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.club-deposit__input {
  width: 100%;
  height: 1.28rem;
  border: none;
  outline: none;
  border-radius: 0.8rem;
  padding: 0 0.7rem;
  // Equivalent of the design's rgba(232,232,232,0.63) soft-light overlay on the dark page.
  background: rgba(232, 232, 232, 0.16);
  color: #f9f9f9;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.373rem;

  &::placeholder {
    font-family: var(--wallet-font-cn);
    font-weight: 500;
    color: rgba(249, 249, 249, 0.45);
  }

  @include theme-light-own {
    background: var(--wallet-l-surface);
    border: 0.5px solid var(--wallet-l-border);
    color: var(--wallet-l-text);

    &::placeholder {
      color: var(--wallet-l-text-muted);
    }
  }
}

.club-deposit__cta-wrapper {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 0.6rem);
  left: 0.455rem;
  width: calc(100% - 0.91rem);
  z-index: 10;
}

.club-deposit__cta-wrapper--channel {
  bottom: calc(env(safe-area-inset-bottom) + 2.82rem);
}

// Figma node 53:63382 — full-width glass button with a green label.
.club-deposit__cta {
  width: 100% !important;
  height: 1.47rem !important;
  border-radius: 0.8rem !important;
  padding: 0 !important;

  :deep(.primary-btn__text) {
    color: #78e490 !important;
    font-size: 0.493rem !important;
  }

  @include theme-light-own {
    background: var(--wallet-l-accent) !important;

    :deep(.primary-btn__text) {
      color: var(--wallet-l-on-accent) !important;
    }
  }
}

.club-deposit__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  text-align: center;
}

.club-deposit__success-main {
  font-size: 0.4rem;
  font-weight: 600;
  color: #f9f9f9;

  @include theme-light-own {
    color: #ffffff !important;
  }
}

.club-deposit__success-sub {
  font-size: 0.3rem;
  color: rgba(249, 249, 249, 0.7);

  @include theme-light-own {
    color: rgba(255, 255, 255, 0.85) !important;
  }
}
</style>

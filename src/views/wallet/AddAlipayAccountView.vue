<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { t } from '@/i18n'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import icBack from '@/assets/icons/wallet/ic_arrow_left.svg'
import icDropdown from '@/assets/icons/icon_dropdown.svg'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import { postPaymentInfoCreateApi } from '@/api/pay'
import { postOnlineWithdrawTypeListApi } from '@/api/config'
import { useUserInfoStore } from '@/stores/userInfo'

const router = useRouter()
const userInfoStore = useUserInfoStore()

function tx(key: string, fallback: string): string {
  const val = t(key)
  return val && val !== key ? val : fallback
}

const accountName = ref('')
const receivingAccount = ref('')
const saving = ref(false)

// ─── Alipay Name options (strictly per design doc) ───────────────────────────
const payTypeOptions = [
  { key: 'Wallet_Alipay', name: '支付宝' },
]

const selectedPayTypeName = ref(payTypeOptions[0].name)

const selectedPayTypeDisplay = computed(() => {
  const opt = payTypeOptions.find((o) => o.name === selectedPayTypeName.value)
  return opt?.key ? tx(opt.key, opt.name) : selectedPayTypeName.value
})

const showNameModal = ref(false)
const tempSelectedName = ref('')

function openNameModal() {
  tempSelectedName.value = selectedPayTypeName.value || payTypeOptions[0]?.name || ''
  showNameModal.value = true
}

function closeNameModal() {
  showNameModal.value = false
}

function selectTempName(name: string) {
  tempSelectedName.value = name
}

function confirmNameSelection() {
  if (tempSelectedName.value) {
    selectedPayTypeName.value = tempSelectedName.value
  }
  showNameModal.value = false
}

const canSave = computed(() => {
  return (
    !!accountName.value.trim() &&
    !!selectedPayTypeName.value.trim() &&
    !!receivingAccount.value.trim()
  )
})

async function handleSave() {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    const name = accountName.value.trim()
    const res = await postPaymentInfoCreateApi({
      account_no: receivingAccount.value.trim(),
      real_name: name,
      pix_name: name,
      bank_name: selectedPayTypeName.value.trim(),
      account_type: 3,
    })
    if (res.code === 0) {
      router.replace({ name: 'wallet', query: { tab: '1', channel: 'alipay' } })
    } else {
      showToast((res.message ?? t('error999')) || tx('Wallet_SaveFailed', '保存失败'))
    }
  } catch {
    showToast(t('error999') || tx('Wallet_SaveFailed', '保存失败'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="abc-page" :style="{ backgroundImage: `url(${sharpBgUrl})` }">
    <!-- Blur overlay -->
    <div class="abc-page__blur" />

    <!-- Header -->
    <div class="abc-header">
      <button
        class="abc-header__back"
        type="button"
        @click="router.replace({ name: 'wallet', query: { tab: '1', channel: 'alipay' } })"
      >
        <img :src="icBack" alt="" class="abc-header__back-icon" />
      </button>
      <span class="abc-header__title">{{ tx('Wallet_Alipay', 'Alipay') }}</span>
    </div>

    <!-- Form -->
    <div class="abc-form">
      <!-- Account Name -->
      <div class="abc-field">
        <label class="abc-field__label">
          {{ tx('Wallet_AlipayAccountName', 'Alipay Account Name') }}
          <span class="abc-field__star">*</span>
        </label>
        <div class="abc-field__input-wrap">
          <input
            v-model="accountName"
            type="text"
            class="abc-field__input"
            :placeholder="tx('Wallet_EnterAlipayAccountName', 'Enter Alipay Account Name')"
          />
        </div>
      </div>

      <!-- Alipay Name (Paytype selector) -->
      <div class="abc-field">
        <label class="abc-field__label">
          {{ tx('Wallet_PleaseSelectAlipayName', 'Please select Alipay name') }}
          <span class="abc-field__star">*</span>
        </label>
        <div
          class="abc-field__input-wrap abc-field__input-wrap--dark"
          @click="openNameModal"
        >
          <input
            :value="selectedPayTypeDisplay"
            type="text"
            class="abc-field__input"
            :placeholder="tx('Wallet_PleaseSelectAlipayName', 'Please select Alipay name')"
            readonly
          />
          <img :src="icDropdown" alt="" class="abc-field__arrow" />
        </div>
      </div>

      <!-- Receiving Account -->
      <div class="abc-field">
        <label class="abc-field__label">
          {{ tx('Wallet_ReceivingAccount', 'Receiving Account') }}
          <span class="abc-field__star">*</span>
        </label>
        <div class="abc-field__input-wrap">
          <input
            v-model="receivingAccount"
            type="text"
            class="abc-field__input"
            :placeholder="tx('Wallet_EnterAlipayReceivingAccount', 'Enter Alipay Receiving Account')"
          />
        </div>
      </div>

      <!-- Disclaimer Note -->
      <p class="abc-disclaimer">
        {{
          tx(
            'Wallet_PayMatchNote',
            'Please fill in payment info that matches transfer. Mistakes will lead to loss of funds.',
          )
        }}
      </p>
    </div>

    <!-- Submit Action (Pinned to Bottom) -->
    <div class="abc-footer">
      <button
        type="button"
        class="abc-save-btn"
        :disabled="!canSave || saving"
        @click="handleSave"
      >
        {{ saving ? tx('Wallet_Saving', '保存中…') : tx('Wallet_ConfirmAndSubmit', 'Confirm and Submit') }}
      </button>
    </div>

    <!-- Alipay Name Modal -->
    <div v-if="showNameModal" class="abc-modal-overlay" @click.self="closeNameModal">
      <div class="abc-modal">
        <h3 class="abc-modal__title">{{ tx('Wallet_AlipayName', 'Alipay Name') }}</h3>

        <div class="abc-modal__list">
          <button
            v-for="opt in payTypeOptions"
            :key="opt.name"
            type="button"
            class="abc-modal__item"
            :class="{ 'abc-modal__item--active': tempSelectedName === opt.name }"
            @click="selectTempName(opt.name)"
          >
            <span class="abc-modal__item-name">{{ opt.key ? tx(opt.key, opt.name) : opt.name }}</span>
            <img
              class="abc-modal__check"
              :src="tempSelectedName === opt.name ? icCheckbox : icUncheckbox"
              alt=""
            />
          </button>
        </div>

        <div class="abc-modal__actions">
          <button
            type="button"
            class="abc-modal__btn abc-modal__btn--cancel"
            @click="closeNameModal"
          >
            {{ tx('Wallet_Cancel', 'Cancel') }}
          </button>
          <button
            type="button"
            class="abc-modal__btn abc-modal__btn--confirm"
            @click="confirmNameSelection"
          >
            {{ tx('Wallet_Confirm', 'Confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.abc-page {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;

  @include theme-light-own {
    background-image: url('@/assets/images/main_bg_light.webp') !important;
  }
}

.abc-page__blur {
  position: absolute;
  inset: 0;
  z-index: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(28px);
  background: rgba(71, 70, 70, 0.2);
  mix-blend-mode: luminosity;
  pointer-events: none;

  @include theme-light-own {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    mix-blend-mode: normal;
  }
}

// Header
.abc-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.23rem;
  padding: calc(var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.43rem) 0.34rem
    0.33rem;
}

.abc-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.72rem;
  height: 0.72rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.7;
  }
}

.abc-header__back-icon {
  width: 0.32rem;
  height: 0.32rem;
  filter: brightness(10);

  @include theme-light-own {
    filter: brightness(0);
  }
}

.abc-header__title {
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.61rem;
  font-weight: 500;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 0.075rem 0.166rem rgba(0, 0, 0, 0.25);

  @include theme-light-own {
    color: var(--wallet-l-text);
    text-shadow: none;
  }
}

// Form
.abc-form {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 0.53rem 0.43rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.44rem;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.abc-field {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.abc-field__label {
  padding: 0 0.38rem;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.35rem;
  font-weight: 400;
  color: #fff;
  line-height: 1.8;
  display: flex;
  align-items: baseline;
  gap: 0.06rem;
  flex-wrap: wrap;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.abc-field__star {
  color: #dd0000;
  font-size: 0.35rem;
}

.abc-field__input-wrap {
  display: flex;
  align-items: center;
  height: 1.24rem;
  padding: 0 0.38rem;
  border: 0.008rem solid rgba(255, 255, 255, 0.25);
  border-radius: 0.75rem;
  background: transparent;

  &--dark {
    border: none;
    background: rgba(27, 27, 30, 0.4);
  }

  @include theme-light-own {
    border-color: var(--wallet-l-border);
    background: var(--wallet-l-surface);

    &--dark {
      background: var(--wallet-l-surface-soft);
    }
  }
}

.abc-field__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.35rem;
  color: #fff;
  line-height: 1.4;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  @include theme-light-own {
    color: var(--wallet-l-text);

    &::placeholder {
      color: var(--wallet-l-text-muted);
    }
  }
}

.abc-field__arrow {
  flex-shrink: 0;
  width: 0.46rem;
  height: 0.46rem;
  opacity: 0.6;
}

.abc-disclaimer {
  margin: 0;
  padding: 0 0.38rem;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.25rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
  }
}

// Footer (save button)
.abc-footer {
  position: relative;
  z-index: 1;
  padding: 0.4rem 0.43rem calc(env(safe-area-inset-bottom) + 0.56rem);
  background: transparent;
}

.abc-save-btn {
  width: 100%;
  height: 1.44rem;
  border: 0.013rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.06rem;
  cursor: pointer;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-weight: 500;
  font-size: 0.43rem;
  color: rgba(120, 228, 144, 1);
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.1) 21%, rgba(230, 230, 230, 0.1) 71%);
  box-shadow:
    inset 1px 1px 0px rgba(242, 242, 242, 0.8),
    inset -1px -1px 0px rgba(255, 255, 255, 0.5);
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.34px;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
      rgba(255, 255, 255, 0.5) 100%
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
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }

  @include theme-light-own {
    border-color: rgba(242, 242, 242, 0.8);
    background: var(--wallet-l-accent);
    box-shadow: none;
    color: var(--wallet-l-on-accent);

    &::before {
      display: none;
    }
  }
}

// ── Name picker modal ──────────────────────────────────────────────────────
.abc-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);

  @include theme-light-own {
    background: rgba(12, 12, 12, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

.abc-modal {
  width: 100%;
  max-width: 8rem;
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.05);
  padding: 0.5rem 0.42rem;
  display: flex;
  flex-direction: column;
  gap: 0.36rem;

  @include theme-light-own {
    @include light-panel($fill: rgba(255, 255, 255, 0.08), $radius: 0.8rem);

    background: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;

    > * {
      position: relative;
      z-index: 2;
    }
  }
}

.abc-modal__title {
  margin: 0;
  text-align: center;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.42rem;
  font-weight: 500;
  color: #fff;
}

.abc-modal__list {
  display: flex;
  flex-direction: column;
  max-height: 7rem;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.abc-modal__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.34rem 0.2rem;
  background: transparent;
  border: none;
  border-bottom: 0.008rem solid rgba(255, 255, 255, 0.08);
  cursor: pointer;

  @include theme-light-own {
    border-bottom-color: rgba(255, 255, 255, 0.16);
  }
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.8;
  }
  &--active .abc-modal__item-name {
    color: #fff;
    font-weight: 500;
  }
}

.abc-modal__item-name {
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.36rem;
  color: rgba(255, 255, 255, 0.85);
}

.abc-modal__check {
  flex-shrink: 0;
  width: 0.44rem;
  height: 0.44rem;
  object-fit: contain;
}

.abc-modal__actions {
  display: flex;
  gap: 0.24rem;
}

.abc-modal__btn {
  flex: 1;
  height: 1.1rem;
  border-radius: 1rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  background: rgba(170, 170, 170, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.36rem;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active {
    opacity: 0.85;
  }
}

.abc-modal__btn--cancel {
  color: #fff;

  @include theme-light-own {
    background: rgba(0, 0, 0, 0.3);
    border-color: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

.abc-modal__btn--confirm {
  color: #55f329;

  @include theme-light-own {
    background: var(--wallet-l-accent);
    border-color: rgba(242, 242, 242, 0.8);
    color: var(--wallet-l-on-accent);
  }
}
</style>

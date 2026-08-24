<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { t } from '@/i18n'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import icBack from '@/assets/icons/wallet/ic_arrow_left.svg'
import icDropdown from '@/assets/icons/icon_dropdown.svg'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import { postPaymentInfoCreateApi } from '@/api/pay'

const router = useRouter()

function tx(key: string, fallback: string): string {
  const val = t(key)
  return val !== key ? val : fallback
}

const cardName = ref('')
const cardBank = ref('')
const cardNumber = ref('')
const cardBranch = ref('')
const saving = ref(false)

const canSave = ref(false)
function checkForm() {
  canSave.value = !!(cardName.value.trim() && cardBank.value.trim() && cardNumber.value.trim())
}

// ─── Bank name picker (hardcoded list, no API) ────────────────────────────────
const bankNameOptions = [
  { key: 'Bank_BOC', name: '中国银行' },
  { key: 'Bank_CCB', name: '中国建设银行' },
]
const cardBankDisplay = computed(() => {
  const option = bankNameOptions.find((b) => b.name === cardBank.value)
  return option ? tx(option.key, option.name) : cardBank.value
})

const showBankNameModal = ref(false)
const tempSelectedBank = ref('')

function openBankNameModal() {
  tempSelectedBank.value = cardBank.value
  showBankNameModal.value = true
}
function closeBankNameModal() {
  showBankNameModal.value = false
}
function selectTempBank(bankName: string) {
  tempSelectedBank.value = bankName
}
function confirmBankSelection() {
  if (tempSelectedBank.value) {
    cardBank.value = tempSelectedBank.value
    checkForm()
  }
  showBankNameModal.value = false
}

async function handleSave() {
  if (!cardName.value.trim() || !cardBank.value.trim() || !cardNumber.value.trim()) return
  saving.value = true
  try {
    const res = await postPaymentInfoCreateApi({
      account_no: cardNumber.value.trim(),
      pix_name: cardName.value.trim(),
      bank_name: cardBank.value.trim(),
      bank_branch: cardBranch.value.trim() || undefined,
      account_type: 1,
    })
    if (res.code === 0) {
      router.replace({ name: 'wallet', query: { tab: '1' } })
    } else {
      showToast((res.message ?? t('error999')) || '保存失败')
    }
  } catch {
    showToast(t('error999') || '保存失败')
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
      <button class="abc-header__back" type="button" @click="router.replace({ name: 'wallet', query: { tab: '1' } })">
        <img :src="icBack" alt="" class="abc-header__back-icon" />
      </button>
      <span class="abc-header__title">{{ tx('Wallet_AddCard', '银行卡') }}</span>
    </div>

    <!-- Form -->
    <div class="abc-form">

      <!-- 姓名 -->
      <div class="abc-field">
        <label class="abc-field__label">
          {{ tx('Wallet_CardHolder', '姓名') }}
          <span class="abc-field__required">（{{ tx('Wallet_CardHolderNote', '请填写收款方式对应的真实姓名') }}）</span>
          <span class="abc-field__star">*</span>
        </label>
        <div class="abc-field__input-wrap">
          <input
            v-model="cardName"
            type="text"
            class="abc-field__input"
            :placeholder="tx('Wallet_CardHolderHint', '请输入姓名')"
            @input="checkForm"
          />
        </div>
      </div>

      <!-- 银行名称 (dropdown style) -->
      <div class="abc-field">
        <label class="abc-field__label">
          {{ tx('Wallet_BankName', '请选择银行名称') }}
          <span class="abc-field__star">*</span>
        </label>
        <div class="abc-field__input-wrap abc-field__input-wrap--dark" @click="openBankNameModal">
          <input
            :value="cardBankDisplay"
            type="text"
            class="abc-field__input"
            :placeholder="tx('Wallet_BankNameHint', '请选择银行名称')"
            readonly
          />
          <img :src="icDropdown" alt="" class="abc-field__arrow" />
        </div>
      </div>

      <!-- 银行卡号 -->
      <div class="abc-field">
        <label class="abc-field__label">
          {{ tx('Wallet_CardNumber', '银行卡号') }}
          <span class="abc-field__star">*</span>
        </label>
        <div class="abc-field__input-wrap">
          <input
            v-model="cardNumber"
            type="text"
            inputmode="numeric"
            class="abc-field__input"
            :placeholder="tx('Wallet_CardNumberHint', '请输入银行卡号')"
            @input="checkForm"
          />
        </div>
      </div>

      <!-- 银行支行 -->
      <div class="abc-field">
        <label class="abc-field__label">
          {{ tx('Wallet_CardBranch', '银行支行') }}
          <span class="abc-field__star">*</span>
        </label>
        <div class="abc-field__input-wrap">
          <input
            v-model="cardBranch"
            type="text"
            class="abc-field__input"
            :placeholder="tx('Wallet_CardBranchHint', '请输入银行支行')"
          />
        </div>
      </div>

      <p class="abc-disclaimer">
        {{ tx('Wallet_CardDisclaimer', '请填写与转账/付款一致的支付信息，如信息有误，可能导致交易失败。') }}
      </p>
    </div>

    <!-- Save button (pinned to bottom) -->
    <div class="abc-footer">
      <button
        type="button"
        class="abc-save-btn"
        :disabled="!cardName.trim() || !cardBank.trim() || !cardNumber.trim() || saving"
        @click="handleSave"
      >
        {{ saving ? tx('Wallet_Saving', '保存中…') : tx('Save', '保存') }}
      </button>
    </div>

    <!-- Bank name picker modal -->
    <div v-if="showBankNameModal" class="abc-modal-overlay" @click.self="closeBankNameModal">
      <div class="abc-modal">
        <h3 class="abc-modal__title">{{ tx('Wallet_BankName', '请选择银行名称') }}</h3>

        <div class="abc-modal__list">
          <button
            v-for="bank in bankNameOptions"
            :key="bank.key"
            type="button"
            class="abc-modal__item"
            :class="{ 'abc-modal__item--active': tempSelectedBank === bank.name }"
            @click="selectTempBank(bank.name)"
          >
            <span class="abc-modal__item-name">{{ tx(bank.key, bank.name) }}</span>
            <img
              class="abc-modal__check"
              :src="tempSelectedBank === bank.name ? icCheckbox : icUncheckbox"
              alt=""
            />
          </button>
        </div>

        <div class="abc-modal__actions">
          <button type="button" class="abc-modal__btn abc-modal__btn--cancel" @click="closeBankNameModal">
            {{ tx('Wallet_Cancel', '取消') }}
          </button>
          <button type="button" class="abc-modal__btn abc-modal__btn--confirm" @click="confirmBankSelection">
            {{ tx('Wallet_Ok', '确定') }}
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

  // Фон задаётся инлайном (:style), поэтому светлый перебиваем через !important.
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
  padding: calc(var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.43rem) 0.34rem 0.33rem;
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

  &:active { opacity: 0.7; }
}

.abc-header__back-icon {
  width: 0.32rem;
  height: 0.32rem;
  filter: brightness(10);

  // Иконка залита белым (fill="white"): brightness(0) делает её чёрной.
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
  &::-webkit-scrollbar { display: none; }
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

.abc-field__required {
  font-size: 0.26rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
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
    background: linear-gradient(135deg, rgba(242, 242, 242, 0.8) 0%, rgba(255, 255, 255, 0) 44.5%, rgba(255, 255, 255, 0.5) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
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

// ── Bank name picker modal ──────────────────────────────────────────────────────
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

  // Модалка в светлой теме — то же стекло, что и у остальных модалок кошелька.
  // Свои blur / фон / тень гасим, иначе карточка выходит темнее подложки.
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
  &::-webkit-scrollbar { display: none; }
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

  &:active { opacity: 0.8; }
  &--active .abc-modal__item-name { color: #fff; font-weight: 500; }
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
  &:active { opacity: 0.85; }
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

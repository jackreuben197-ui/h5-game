<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { t } from '@/i18n'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import icBack from '@/assets/icons/wallet/ic_arrow_left.svg'
import { postPaymentInfoCreateApi } from '@/api/pay'

const router = useRouter()

function tx(key: string, fallback: string): string {
  const val = t(key)
  return val !== key ? val : fallback
}

const walletName = ref('')
const walletAddress = ref('')
const saving = ref(false)

async function handleSave() {
  if (!walletAddress.value.trim()) return
  saving.value = true
  try {
    const res = await postPaymentInfoCreateApi({
      account_no: walletAddress.value.trim(),
      real_name: walletName.value.trim(),
      account_type: 6,
    })
    if (res.code === 0) {
      router.replace({ name: 'wallet', query: { tab: '1', channel: 'wallet' } })
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
  <div class="awa-page" :style="{ backgroundImage: `url(${sharpBgUrl})` }">
    <!-- Blur overlay -->
    <div class="awa-page__blur" />

    <!-- Header -->
    <div class="awa-header">
      <button
        class="awa-header__back"
        type="button"
        @click="router.replace({ name: 'wallet', query: { tab: '1', channel: 'wallet' } })"
      >
        <img :src="icBack" alt="" class="awa-header__back-icon" />
      </button>
      <span class="awa-header__title">{{ tx('Wallet_AddWalletAddressTitle', 'Add wallet address') }}</span>
    </div>

    <!-- Form -->
    <div class="awa-form">
      <!-- 姓名 Name -->
      <div class="awa-field">
        <label class="awa-field__label">
          {{ tx('Wallet_CardHolder', 'Name') }}
          <span class="awa-field__required"
            >({{ tx('Wallet_CardHolderNote', 'Please fill in the real name corresponding to the payment method') }})</span
          >
        </label>
        <div class="awa-field__input-wrap">
          <input
            v-model="walletName"
            type="text"
            class="awa-field__input"
            :placeholder="tx('Wallet_EnterNameHint', 'Please enter name')"
          />
        </div>
      </div>

      <!-- 钱包地址 Wallet address -->
      <div class="awa-field">
        <label class="awa-field__label">
          {{ tx('Wallet_WalletAddressLabel', 'wallet address') }}
          <span class="awa-field__star">*</span>
        </label>
        <div class="awa-field__input-wrap awa-field__input-wrap--textarea">
          <textarea
            v-model="walletAddress"
            rows="3"
            class="awa-field__input awa-field__textarea"
            :placeholder="tx('Wallet_EnterWalletAddressHint', 'Please enter wallet address.')"
          />
        </div>
      </div>

      <p class="awa-disclaimer">
        {{
          tx(
            'Wallet_CardDisclaimer',
            '请填写与转账/付款一致的支付信息，如信息有误，可能导致交易失败。',
          )
        }}
      </p>
    </div>

    <!-- Save button (pinned to bottom) -->
    <div class="awa-footer">
      <button
        type="button"
        class="awa-save-btn"
        :disabled="!walletAddress.trim() || saving"
        @click="handleSave"
      >
        {{ saving ? tx('Wallet_Saving', '保存中…') : t('Save') }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.awa-page {
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

.awa-page__blur {
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
.awa-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.23rem;
  padding: calc(var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.43rem) 0.34rem
    0.33rem;
}

.awa-header__back {
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

.awa-header__back-icon {
  width: 0.32rem;
  height: 0.32rem;
  filter: brightness(10);

  @include theme-light-own {
    filter: brightness(0);
  }
}

.awa-header__title {
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.55rem;
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
.awa-form {
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

.awa-field {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.awa-field__label {
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

.awa-field__required {
  font-size: 0.26rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
  }
}

.awa-field__star {
  color: #dd0000;
  font-size: 0.35rem;
}

.awa-field__input-wrap {
  display: flex;
  align-items: center;
  height: 1.24rem;
  padding: 0 0.38rem;
  border: 0.008rem solid rgba(255, 255, 255, 0.25);
  border-radius: 0.75rem;
  background: transparent;

  @include theme-light-own {
    border-color: var(--wallet-l-border);
    background: var(--wallet-l-surface);
  }
}

.awa-field__input-wrap--textarea {
  height: auto;
  min-height: 2.2rem;
  padding: 0.28rem 0.38rem;
  border-radius: 0.45rem;
  align-items: flex-start;
}

.awa-field__input {
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

.awa-field__textarea {
  resize: none;
  width: 100%;
}

.awa-disclaimer {
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
.awa-footer {
  position: relative;
  z-index: 1;
  padding: 0.4rem 0.43rem calc(env(safe-area-inset-bottom) + 0.56rem);
  background: transparent;
}

.awa-save-btn {
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
</style>

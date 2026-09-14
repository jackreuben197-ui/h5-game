<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { t } from '@/i18n'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import icBack from '@/assets/icons/wallet/ic_arrow_left.svg'
import { postPaymentInfoCreateApi } from '@/api/pay'
import { postOssUploadImageApi } from '@/api/oss'

const router = useRouter()

function tx(key: string, fallback: string): string {
  const val = t(key)
  return val && val !== key ? val : fallback
}

const usdtAddress = ref('')
const qrCodeUrl = ref('')
const uploadingQr = ref(false)
const saving = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerQrUpload() {
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) return

  uploadingQr.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await postOssUploadImageApi(
      formData as unknown as Parameters<typeof postOssUploadImageApi>[0],
    )
    if (res?.data) {
      qrCodeUrl.value = (typeof res.data === 'string' ? res.data : (res.data as any)?.url || (res.data as any)?.path) ?? ''
    } else {
      showToast(tx('UIClub_Upload', '上传失败'))
    }
  } catch (e) {
    console.error('QR upload failed', e)
    showToast(tx('UIClub_Upload', '上传失败'))
  } finally {
    uploadingQr.value = false
    if (target) target.value = ''
  }
}

const canSave = computed(() => {
  return !!usdtAddress.value.trim() && !!qrCodeUrl.value.trim()
})

async function handleSave() {
  if (!canSave.value || saving.value || uploadingQr.value) return
  saving.value = true
  try {
    const addr = usdtAddress.value.trim()
    const res = await postPaymentInfoCreateApi({
      account_no: addr,
      bank_branch: qrCodeUrl.value.trim(),
      bank_name: 'USDT',
      real_name: 'USDT',
      pix_name: 'USDT',
      account_type: 4,
    })
    if (res.code === 0) {
      router.replace({ name: 'wallet', query: { tab: '1', channel: 'usdt' } })
    } else {
      showToast((res.message ?? t('error999')) || tx('Wallet_SaveFailed', '保存失败'))
    }
  } catch (e) {
    console.error('handleSave USDT failed', e)
    showToast(t('error999') || tx('Wallet_SaveFailed', '保存失败'))
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.replace({ name: 'wallet', query: { tab: '1', channel: 'usdt' } })
}
</script>

<template>
  <div class="aua-page" :style="{ backgroundImage: `url(${sharpBgUrl})` }">
    <!-- Blur overlay -->
    <div class="aua-page__blur" />

    <!-- Header -->
    <div class="aua-header">
      <button class="aua-header__back" type="button" @click="goBack">
        <img :src="icBack" alt="" class="aua-header__back-icon" />
      </button>
      <span class="aua-header__title">USDT</span>
    </div>

    <!-- Hidden file input for QR upload -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="aua-hidden-file-input"
      @change="handleFileChange"
    />

    <!-- Form Container -->
    <div class="aua-form">
      <!-- Field 1: USDT wallet address -->
      <div class="aua-field">
        <label class="aua-field__label">
          <span>{{ tx('Wallet_UsdtAddressLabel', 'USDT wallet address') }}</span>
          <span class="aua-field__star">*</span>
        </label>
        <div class="aua-field__input-wrap">
          <input
            v-model="usdtAddress"
            type="text"
            class="aua-field__input"
            :placeholder="tx('Wallet_EnterWalletAddress', 'Enter wallet address')"
          />
        </div>
      </div>

      <!-- Field 2: wallet QR -->
      <div class="aua-field">
        <label class="aua-field__label">
          <span>{{ tx('Wallet_WalletQrLabel', 'wallet QR') }}</span>
          <span class="aua-field__star">*</span>
        </label>

        <div class="aua-qr-box" @click="triggerQrUpload">
          <template v-if="qrCodeUrl">
            <img :src="qrCodeUrl" alt="Wallet QR" class="aua-qr-preview" />
            <div class="aua-qr-overlay">
              <span>{{ tx('Wallet_Reupload', 'Re-upload') }}</span>
            </div>
          </template>

          <template v-else>
            <div class="aua-qr-placeholder">
              <div class="aua-qr-icon-wrap">
                <svg width="44" height="40" viewBox="0 0 44 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- Gallery Image Icon -->
                  <rect x="2" y="2" width="40" height="36" rx="8" stroke="white" stroke-width="3" fill="none" />
                  <circle cx="14" cy="14" r="4" fill="white" />
                  <path d="M6 32L16 20L25 30L31 23L38 32H6Z" fill="white" />
                </svg>
                <div class="aua-qr-plus-badge">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 2V12M2 7H12" stroke="white" stroke-width="2.5" stroke-linecap="round" />
                  </svg>
                </div>
              </div>
              <span class="aua-qr-text">
                {{ uploadingQr ? tx('Wallet_Uploading', 'Uploading...') : tx('Wallet_UploadQr', 'Upload QR') }}
              </span>
            </div>
          </template>
        </div>

        <p class="aua-disclaimer">
          {{
            tx(
              'Wallet_UsdtDisclaimer',
              'Please fill in payment info that matches transfer. Mistakes will lead to loss of funds.',
            )
          }}
        </p>
      </div>
    </div>

    <!-- Pinned Footer Submit Button -->
    <div class="aua-footer">
      <button
        type="button"
        class="aua-submit-btn"
        :disabled="!canSave || saving || uploadingQr"
        @click="handleSave"
      >
        {{ saving ? tx('Wallet_Saving', 'Saving...') : tx('Wallet_ConfirmAndSubmit', 'Confirm and Submit') }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.aua-page {
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

.aua-page__blur {
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

.aua-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.23rem;
  padding: calc(var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.43rem) 0.34rem
    0.33rem;
}

.aua-header__back {
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

.aua-header__back-icon {
  width: 0.32rem;
  height: 0.32rem;
  filter: brightness(10);

  @include theme-light-own {
    filter: brightness(0);
  }
}

.aua-header__title {
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.55rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 0.075rem 0.166rem rgba(0, 0, 0, 0.25);

  @include theme-light-own {
    color: var(--wallet-l-text);
    text-shadow: none;
  }
}

.aua-hidden-file-input {
  display: none;
}

.aua-form {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem 0.43rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.aua-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.aua-field__label {
  padding: 0 0.1rem;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.38rem;
  font-weight: 500;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.08rem;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.aua-field__star {
  color: #ff3b30;
  font-size: 0.38rem;
  font-weight: 700;
}

.aua-field__input-wrap {
  display: flex;
  align-items: center;
  height: 1.24rem;
  padding: 0 0.4rem;
  border: 0.008rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  background: rgba(0, 0, 0, 0.2);

  @include theme-light-own {
    border-color: var(--wallet-l-border);
    background: rgba(255, 255, 255, 0.8);
  }

  &:focus-within {
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.aua-field__input {
  flex: 1;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.36rem;
  color: #fff;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);

    @include theme-light-own {
      color: var(--wallet-l-text-muted);
    }
  }
}

/* Red / Coral Upload QR Card Box */
.aua-qr-box {
  position: relative;
  width: 100%;
  height: 3.8rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #ff4d63 0%, #e63952 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 0.1rem 0.3rem rgba(230, 57, 82, 0.3);
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:active {
    transform: scale(0.98);
    opacity: 0.95;
  }
}

.aua-qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.aua-qr-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.aua-qr-plus-badge {
  position: absolute;
  bottom: -0.05rem;
  right: -0.05rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #34c759;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.04rem 0.1rem rgba(0, 0, 0, 0.2);
}

.aua-qr-text {
  font-size: 0.52rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.01rem;
}

.aua-qr-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.aua-qr-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.38rem;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s ease;

  .aua-qr-box:hover &,
  .aua-qr-box:active & {
    opacity: 1;
  }
}

.aua-disclaimer {
  padding: 0 0.1rem;
  font-size: 0.28rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 0.1rem;

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
  }
}

.aua-footer {
  position: relative;
  z-index: 1;
  padding: 0.3rem 0.43rem calc(var(--app-content-safe-area-bottom, env(safe-area-inset-bottom)) + 0.43rem);
}

.aua-submit-btn {
  width: 100%;
  height: 1.25rem;
  border-radius: 0.65rem;
  background: linear-gradient(180deg, #32d74b 0%, #28cd41 100%);
  border: none;
  font-size: 0.44rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.1rem 0.25rem rgba(40, 205, 65, 0.35);
  transition: opacity 0.2s ease, transform 0.15s ease;

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
}
</style>

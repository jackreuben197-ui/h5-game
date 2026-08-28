<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { showToast } from 'vant'
import { t, ucLabel } from '@/i18n'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import PopupCloseButton from './PopupCloseButton.vue'
import type { RechargeGoldData } from '@/api/models/order'

const props = defineProps<{
  orderData: RechargeGoldData
  rate: number
  feeRate?: number
  feeType?: number
  price: string
}>()

const emit = defineEmits<{
  close: []
  cancel: [orderNo: string]
}>()

const timeLeft = ref(900) // 15 minutes default
let timer: number | null = null

const formattedTime = computed(() => {
  const mins = Math.floor(timeLeft.value / 60)
  const secs = timeLeft.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const feeDisplay = computed(() => {
  if (props.feeType !== 2 || !props.feeRate) return '0'
  return `${(props.feeRate * 100).toFixed(2).replace(/\.00$/, '')}%`
})

function startTimer() {
  timer = window.setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      if (timer) clearInterval(timer)
    }
  }, 1000)
}

function fallbackCopy(text: string) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

function onCopy() {
  const address = props.orderData.usdt_address?.address
  if (!address) {
    showToast({ message: '暂无收款账号', duration: 1200, position: 'bottom' })
    return
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(address).catch(() => fallbackCopy(address))
  } else {
    fallbackCopy(address)
  }
  showToast({ message: t('adaptation10106') || '已复制', duration: 800, position: 'bottom' })
}

function onCancel() {
  const orderNo = (props.orderData as any).order_no || props.orderData.order?.order_no
  if (orderNo) {
    emit('cancel', orderNo)
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="overlay"

      @click.self="emit('close')"
    >
      <!-- :style="{ backgroundImage: `url(${sharpBgUrl})` }" -->
      <div class="card" >
        <!-- :style="{ backgroundImage: `url(${sharpBgUrl})` }" -->
        <div class="card__inner">
          <!-- Header -->
          <div class="header">
            <h2 class="header__title">{{ t('UIMineMallUSDTShopPayDialogSurePay') }}</h2>
            <div class="header__info">
              <p>{{ t('UIMine_WalletPlatform_fee_s') }}: {{ feeDisplay }}</p>
              <p>{{ t('UIWallet_Current') }}: 1USDT={{ rate || 1 }}{{ ucLabel() }}</p>
            </div>
            <PopupCloseButton @close="emit('close')" />
          </div>

          <!-- Amount Display -->
          <div class="amount-display">
            <div class="amount-display__bg"></div>
            <span class="amount-display__value">{{ price }}</span>
          </div>

          <!-- Payment Label -->
          <h3 class="payment-label">{{ t('UIMineMallUSDTShopPayDialogPayGoldTip') }}</h3>

          <!-- Payment Section -->
          <div class="payment-section">
            <!-- QR Code -->
            <div class="qr-container">
              <img
                v-if="orderData.usdt_address?.qr_code"
                :src="orderData.usdt_address.qr_code"
                alt="QR Code"
                class="qr-image"
              />
              <div v-else class="qr-placeholder"></div>
            </div>

            <!-- Address Section -->
            <div class="address-card">
              <p class="address-card__title">{{ t('UIMineMallUSDTShopPayDialogCopyAddress') }}</p>
              <div class="address-card__box">
                <p class="address-card__label">{{ t('UIWallet_Text12') }}</p>
                <p class="address-card__value">{{ orderData.usdt_address?.address }}</p>
              </div>
              <button class="copy-btn" @click="onCopy">{{ t('sd_X7o0UdXC') }}</button>
            </div>
          </div>

          <!-- Hint -->
          <p class="hint">{{ t('UIGuild_TipsTitle') }}：{{ t('UIWallet_Copy') }}，{{ t('UIClub_OrCode') }}</p>

          <!-- Actions -->
          <div class="actions">
            <button class="btn btn--cancel" @click="onCancel">{{ t('UIWallet_Cancel') }}</button>
            <div class="btn btn--paying">
              <span>{{ t('UIMineMallUSDTShopDiamondPay') }}</span>
              <span class="timer">{{ formattedTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
   background: rgba(23, 23, 23, 0.70);

  @include theme-light-own {
    background: rgba(12, 12, 12, 0.6);
  }
}

.overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 324px;
  max-width: calc(100vw - 24px);
  padding: 16px 14px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  border: 0.96px solid rgba(242, 242, 242, 0.4);
  border-radius: clamp(24px, 8vw, 32px);
  box-shadow:
    3.4px 4.3px 6.9px rgba(0, 0, 0, 0.25),
    0 0 8.6px #000 inset,
    2.1px 4.25px 17.2px rgba(242, 242, 242, 0.9) inset;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-image: url('@/assets/images/wallet/bg_sharp.webp');

  // Светлая тема: то же стекло, что и у модалки логина (light-panel), без растровой подложки.
  @include theme-light-own {
    @include light-panel;

    background-image: none !important;
  }
}

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    0.0919rem 0.1149rem 0.1838rem 0 rgba(0, 0, 0, 0.25),
    0 0 0.2298rem 0 #000 inset,
    0.0566rem 0.1132rem 0.4596rem 0 rgba(242, 242, 242, 0.90) inset;
  backdrop-filter: blur(7.580729961395264px);
  -webkit-backdrop-filter: blur(7.580729961395264px);
  pointer-events: none;
  z-index: 1;

  @include theme-light-own {
    background: rgba(135, 134, 134, 0.032) !important;
    backdrop-filter: blur(0.58px) !important;
    -webkit-backdrop-filter: blur(0.58px) !important;
  }
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.0255rem;
  background: linear-gradient(180deg, rgba(242, 242, 242, 0.40) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.50) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
}

.card__inner {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
}

.header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header .header__title {
  font-size: clamp(13px, 3.8vw, 15px);
  line-height: 1.25;
  text-align: left;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  margin-right: auto;
}

.header__title {
  color: var(--c-text);
  font-family: 'HONOR Sans CN';
  font-weight: 500;
  letter-spacing: 0.2px;
  font-feature-settings:
    'liga' off,
    'clig' off;
}

.header__info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  max-width: 52%;
  margin-right: 4px;
}

.header__info p {
  margin: 0;
  font-size: 10px;
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: 0.1px;
  white-space: nowrap;
  color: var(--c-text);
  font-family: 'HONOR Sans CN';
  font-feature-settings:
    'liga' off,
    'clig' off;
}

.amount-display {
  position: relative;
  width: calc(100% + 30.798px);
  margin-left: -15.399px;
  margin-right: -15.399px;
  height: 45.58px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.amount-display__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    97deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  );
  border-radius: 0;

  // Полоса с суммой одинаково тёмная в обеих темах (см. макет).
  @include theme-light-own {
    background: linear-gradient(97deg, #1f1f1f 21.11%, #191919 71.43%);
  }
}

.amount-display__value {
  color: var(--c-text);
  text-align: center;
  text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  font-family: 'Keania One', cursive;
  font-size: 29.361px;
  font-weight: 400;
  line-height: 100%;
  font-feature-settings:
    'liga' off,
    'clig' off;
  z-index: 1;
}

.payment-label {
  color: var(--c-text);
  font-family: 'HONOR Sans CN';
  font-size: 16px;
  font-weight: 400;
  margin: 0;
}

.payment-section {
  display: flex;
  width: 100%;
  gap: 12px;
  justify-content: center;
  align-items: center;
}

.qr-container {
  width: 119.02px;
  height: 119.02px;
  background: #fff;
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  width: 100%;
  height: 100%;
}

.address-card {
  width: 127px;
  height: 119px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.29);
  border-radius: 27.928px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

}

.address-card__title {
  color: var(--c-text);
  text-align: right;
  font-family: 'SF Pro';
  font-size: 10.908px;
  font-weight: 590;
  line-height: 132%;
  font-feature-settings:
    'liga' off,
    'clig' off;
  margin: 0;
  width: 100%;
}

.address-card__box {
  width: 100%;
  text-align: left;
}

.address-card__label {
  color: var(--c-text-muted);
  font-family: 'SF Pro';
  font-size: 7px;
  font-weight: 590;
  line-height: 132%;
  font-feature-settings:
    'liga' off,
    'clig' off;
  margin: 0;
}

.address-card__value {
  color: var(--c-text);
  font-family: 'SF Pro';
  font-size: 7px;
  font-weight: 590;
  line-height: 132%;
  font-feature-settings:
    'liga' off,
    'clig' off;
  word-break: break-all;
  margin: 2px 0 0 0;
}

.copy-btn {
  display: flex;
  width: 101px;
  height: 27.736px;
  justify-content: center;
  align-items: center;
  border-radius: 30.131px;
  border: 0.648px solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(128deg, #55f329 7.55%, #3ead06 71.92%);
  box-shadow:
    102.058px 69.335px 34.667px 0 rgba(15, 110, 2, 0.01),
    65.447px 44.387px 31.751px 0 rgba(33, 87, 3, 0.04),
    36.611px 24.948px 26.567px 0 rgba(17, 91, 2, 0.14),
    16.2px 11.016px 19.764px 0 rgba(31, 101, 5, 0.24),
    4.212px 2.916px 11.016px 0 rgba(40, 91, 4, 0.27);
  backdrop-filter: blur(24.299516677856445px);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s;

  @include theme-light-own {
    border-color: rgba(242, 242, 242, 0.8);
    background: var(--wallet-l-accent);
    box-shadow: none;
    color: var(--wallet-l-on-accent);
  }
}

.copy-btn:active {
  transform: scale(0.95);
}

.hint {
  color: var(--c-text);
  text-align: center;
  font-family: 'HONOR Sans CN';
  font-size: 10px;
  font-weight: 400;
  line-height: 78%;
  letter-spacing: 0.2px;
  font-feature-settings:
    'liga' off,
    'clig' off;
  margin: 0;
  padding: 0 10px;
}

.actions {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 12px;
  justify-content: space-between;
  margin-top: 10px;
}

.btn {
  display: flex;
  flex: 1 0 0;
  height: 53.843px;
  padding: 4.751px 0;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-family: 'HONOR Sans CN';
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  border: none;
  outline: none;
}

.btn:active {
  opacity: 0.8;
}

.btn--cancel {
  justify-content: center;
  border-radius: 39.59px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(0.0527px);
  color: #fff;

}

.btn--paying {
  justify-content: center;
  gap: 5px;
  border-radius: 39.59px;
  border: 0.5px solid rgba(242, 242, 242, 0.80);
  color: rgba(120, 228, 144, 1);
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.1) 21.11%, rgba(230, 230, 230, 0.1) 71.43%) !important;

  @include theme-light-own {
    background: var(--wallet-l-accent) !important;
    color: var(--wallet-l-on-accent);
  }
  // backdrop-filter: blur(0.1583614945411682px);
}

.timer {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.9;
}
</style>

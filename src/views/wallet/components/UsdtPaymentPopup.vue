<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import PopupCloseButton from './PopupCloseButton.vue'
import { t, ucLabel } from '@/i18n'

const props = defineProps<{
  goldCount: number
  rate: number
  feeRate: number
  feeType?: number
  discount?: number
}>()

const emit = defineEmits<{
  close: []
  submit: [type: number]
}>()

const walletStore = useWalletStore()

// 0: exact amount, 1: rounded amount
const selectedOption = ref(0)
const isTimedOut = ref(false)
let timer: number | null = null

const exactGoldCount = computed(() => props.goldCount || 0)
const roundedGoldCount = computed(() => Math.floor((props.goldCount || 0) / 100) * 100)

const exactPriceData = computed(() =>
  walletStore.calculateRechargeUsdtPrice(
    exactGoldCount.value,
    props.rate || 0,
    props.feeRate || 0,
    props.feeType || 0,
    props.discount || 0,
  ),
)

const roundedPriceData = computed(() =>
  walletStore.calculateRechargeUsdtPrice(
    roundedGoldCount.value,
    props.rate || 0,
    props.feeRate || 0,
    props.feeType || 0,
    props.discount || 0,
  ),
)

const exactPrice = computed(() => exactPriceData.value.totalUiPrice)
const roundedPrice = computed(() => roundedPriceData.value.totalUiPrice)

function formatGoldCount(goldCount: number): string {
  return (goldCount / 100).toLocaleString(undefined, {
    useGrouping: false,
    minimumFractionDigits: goldCount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

function close(): void {
  emit('close')
}

function submit(): void {
  if (isTimedOut.value) return
  emit('submit', selectedOption.value)
}

onMounted(() => {
  // 3 minutes timeout
  timer = window.setTimeout(
    () => {
      isTimedOut.value = true
    },
    3 * 60 * 1000,
  )
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="!isTimedOut" class="overlay" @click.self="close">
      <!-- :style="{ backgroundImage: `url(${sharpBgUrl})` }" -->
      <div class="card">
        <!-- :style="{ backgroundImage: `url(${sharpBgUrl})` }" -->
        <div class="card__inner">
          <!-- Header -->
          <div class="card__header">
            <h2 class="card__title">{{ t('UIMineMallUSDTShopPayDialogSurePay') }}</h2>
            <div class="card__header-info">
              <span>
                {{ t('UIMine_WalletPlatform_fee_s') }}：{{
                  props.feeRate > 0
                    ? (props.feeRate * 100).toFixed(2).replace(/\.00$/, '') + '%'
                    : '0'
                }}
              </span>
              <span>{{ t('UIWallet_Current') }}：1USDT={{ props.rate || 1 }}{{ ucLabel() }}</span>
            </div>
            <PopupCloseButton @close="close" />
          </div>

          <!-- Divider -->
          <div class="card__divider"></div>

          <!-- Notice -->
          <p class="card__notice">
            {{ t('UIWallet_UsdtPayNotice') }}
          </p>

          <!-- Options -->
          <div class="options-container">
            <!-- Option 0: Exact -->
            <div
              class="option-card"
              :class="{ 'option-card--active': selectedOption === 0 }"
              @click="selectedOption = 0"
            >
              <div class="option-card__amount-row">
                <span class="option-card__amount">{{ formatGoldCount(exactGoldCount) }}</span>
                <img :src="icCoins" alt="" class="option-card__coin" />
              </div>
              <div class="option-card__desc">
                {{ t('UIWallet_Text16') }} {{ walletStore.formatUsdtPrice(exactPrice) }}
              </div>
              <div
                class="option-card__badge"
                :class="{ 'option-card__badge--active': selectedOption === 0 }"
              >
                <img
                  class="badge-icon__check"
                  :src="selectedOption === 0 ? icCheckbox : icUncheckbox"
                  alt=""
                />
                {{ t('UIUCWalletAddress1') }}
              </div>
            </div>

            <!-- Option 1: Rounded -->
            <div
              class="option-card"
              :class="{ 'option-card--active': selectedOption === 1 }"
              @click="selectedOption = 1"
            >
              <div class="option-card__amount-row">
                <span class="option-card__amount">{{ formatGoldCount(roundedGoldCount) }}</span>
                <img :src="icCoins" alt="" class="option-card__coin" />
              </div>
              <div class="option-card__desc">
                {{ t('UIWallet_Text16') }} {{ walletStore.formatUsdtPrice(roundedPrice) }}
              </div>
              <div
                class="option-card__badge"
                :class="{ 'option-card__badge--active': selectedOption === 1 }"
              >
                <img
                  class="badge-icon__check"
                  :src="selectedOption === 1 ? icCheckbox : icUncheckbox"
                  alt=""
                />
                30 {{ t('UIWallet_Text17') }}
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="card__action">
            <PrimaryButton :text="t('UIMineMallUSDTShopDiamondPayTip')" @click="submit" class="pay-cta" />
          </div>
        </div>
      </div>
    </div>

    <!-- Timeout Reminder Modal -->
    <div v-if="isTimedOut" class="timeout-overlay" @click.self="isTimedOut = false">
      <div class="timeout-card" data-node-id="19:46384">
        <div class="timeout-card__header">
          <h2 class="timeout-card__title">{{ t('UICommon_RemindAndNotice') }}</h2>
        </div>
        <div class="timeout-card__body">
          <p class="timeout-card__text timeout-card__text--first">{{ t('UIWallet_Time') }}，</p>
          <p class="timeout-card__text">{{ t('UIWallet_Again') }}</p>
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
  padding: clamp(20px, 7vw, 28px);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background: rgba(23, 23, 23, 0.7);

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
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(12, 12, 12, 0.20);
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
  background-image: url('@/assets/images/wallet/bg_sharp.webp');
  background-size: cover;
  background-position: center;

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
  background: rgba(0, 0, 0, 0.5);
  box-shadow:
    0.0919rem 0.1149rem 0.1838rem 0 rgba(0, 0, 0, 0.25),
    0 0 0.2298rem 0 #000 inset,
    0.0566rem 0.1132rem 0.4596rem 0 rgba(242, 242, 242, 0.9) inset;
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
  background: linear-gradient(
    180deg,
    rgba(242, 242, 242, 0.4) 0%,
    rgba(255, 255, 255, 0) 50%,
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

.card__inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 0.2rem;
}

.card__header .card__title {
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

.card__title {
  color: var(--c-text);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-weight: 500;
  letter-spacing: 0.2px;
}

.card__header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  max-width: 52%;
  margin-right: 4px;
}

.card__header-info span {
  color: var(--c-text);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 10px;
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: 0.1px;
  white-space: nowrap;
}

.card__divider {
  width: 100%;
  height: 1px;
  background-image: linear-gradient(to right, var(--c-divider) 50%, transparent 50%);
  background-size: 10px 1px;
  margin: 12px 0;
}

.card__notice {
  color: var(--c-text);
  text-align: center;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: 0.15px;
  margin: 0 0 14px 0;
  padding: 0 4px;
  word-break: break-word;
}

.options-container {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  width: 100%;
}

.option-card {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  height: 108px;
  padding: 8px 6px 10px;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  border-radius: 20px;
  background: rgba(245, 245, 245, 0.1);
  background-blend-mode: plus-lighter;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.option-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.option-card--active {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  @include theme-light-own {
    border: 1px solid var(--wallet-l-accent);
  }
}

.option-card--active::before {
  opacity: 1;
}

.option-card__amount-row {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 0;
  margin-bottom: 0;
  position: relative;
  z-index: 1;
}

.option-card__amount {
  color: var(--White, #f9f9f9);
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: var(--wallet-font-num, 'SF Pro');
  font-size: 15px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.2;
}

.option-card__coin {
  width: 20px;
  height: 20px;
  aspect-ratio: 1;
}

.option-card__desc {
  color: var(--c-text);
  text-align: center;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: 'SF Pro';
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.2;
  margin-bottom: 0;
  position: relative;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.option-card__badge {
  display: flex;
  width: auto;
  max-width: 100%;
  padding: 4px 6px;
  justify-content: center;
  align-items: center;
  gap: 3px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.12);
  margin-bottom: 0;
  color: var(--c-text);
  text-align: center;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: 'SF Pro';
  font-size: 9.5px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.2;
  position: relative;
  z-index: 1;
  border: 1px solid transparent;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-card__badge--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--c-text);

  @include theme-light-own {
    background: var(--wallet-l-accent);
    color: var(--wallet-l-on-accent);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.badge-icon__check {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.card__action {
  margin-top: 0.1rem;
}

.timeout-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(20px, 7vw, 28px);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background: rgba(23, 23, 23, 0.7);
}

.timeout-card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 345px;
  max-width: 100%;
  padding: 14px 22px;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  border: 1.314px solid rgba(242, 242, 242, 0.4);
  border-radius: 32px;
  background: linear-gradient(
    129.105deg,
    rgba(142, 142, 142, 0.12) 2.9315%,
    rgba(103, 103, 103, 0.16) 43.621%,
    rgba(73, 73, 73, 0.2) 89.787%
  );
  backdrop-filter: blur(7.580729961395264px);
  -webkit-backdrop-filter: blur(7.580729961395264px);
  box-shadow:
    3.447px 4.309px 6.894px 0 rgba(0, 0, 0, 0.25),
    inset 2.123px 4.245px 17.235px 0 rgba(242, 242, 242, 0.9),
    inset 0 0 22.309px 0 #cb6e7d,
    inset 0 0 8.618px 0 #000;
  overflow: hidden;
  animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.timeout-card__header {
  display: flex;
  align-self: stretch;
  height: 45.577px;
  margin: -14px -22px 0;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(170.655deg, rgb(54, 54, 54) 7.8962%, rgb(23, 23, 23) 80.242%);
}

.timeout-card__title {
  margin: 0;
  color: #fff;
  text-align: center;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 23px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.2;
}

.timeout-card__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.timeout-card__text {
  margin: 0;
  color: #fff;
  text-align: center;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.04;
  letter-spacing: 0.32px;
}

.timeout-card__text--first {
  margin-bottom: 4.537px;
}

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// .card__action {
//   position: fixed;
//   bottom: calc(env(safe-area-inset-bottom) + 0.6rem);
//   left: 0.455rem;
//   width: calc(100% - 0.91rem);
//   height: 1.47rem;
//   border-radius: 1.08rem;
//   background: rgba(18, 20, 24, 0.92);
//   backdrop-filter: blur(10px);
//   -webkit-backdrop-filter: blur(10px);
//   z-index: 10;
//   overflow: hidden;
// }

.pay-cta {
  // width: 100% !important;
  // height: 100% !important;
  color: rgba(120, 228, 144, 1);
  background: linear-gradient(
    97deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  ) !important;

  @include theme-light-own {
    background: var(--wallet-l-accent) !important;
    border: 0.5px solid rgba(242, 242, 242, 0.8);
    color: var(--wallet-l-on-accent);

    :deep(.primary-btn__text) {
      color: var(--wallet-l-on-accent);
    }
  }
}
</style>

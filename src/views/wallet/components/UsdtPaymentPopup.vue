<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import PopupCloseButton from './PopupCloseButton.vue'

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
  walletStore.calculateUsdtPrice(
    exactGoldCount.value,
    props.rate || 0,
    props.feeRate || 0,
    props.feeType || 0,
    props.discount || 0,
  ),
)

const roundedPriceData = computed(() =>
  walletStore.calculateUsdtPrice(
    roundedGoldCount.value,
    props.rate || 0,
    props.feeRate || 0,
    props.feeType || 0,
    props.discount || 0,
  ),
)

const exactPrice = computed(() => exactPriceData.value.totalUiPrice)
const roundedPrice = computed(() => roundedPriceData.value.totalUiPrice)

const exactAmountLabel = computed(() =>
  (exactGoldCount.value / 100 + 0.01).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }),
)
const roundedAmountLabel = computed(() =>
  (roundedGoldCount.value / 100).toLocaleString('en-US', {
    maximumFractionDigits: 0,
    useGrouping: false,
  }),
)

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
            <h2 class="card__title">确认付款</h2>
            <div class="card__header-info">
              <span>
                手续费：{{
                  props.feeRate > 0
                    ? (props.feeRate * 100).toFixed(2).replace(/\.00$/, '') + '%'
                    : '0'
                }}
              </span>
              <span>当前参考单价：1联盟币={{ props.rate || 1 }}USDT</span>
            </div>
            <PopupCloseButton @close="close" />
          </div>

          <!-- Divider -->
          <div class="card__divider"></div>

          <!-- Notice -->
          <p class="card__notice">
            为确保交易成功，请在付款时按完整金额<br />（含小数点后4位）支付。
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
                <span class="option-card__amount">{{ exactAmountLabel }}</span>
                <img :src="icCoins" alt="" class="option-card__coin" />
              </div>
              <div class="option-card__desc">
                需支付 {{ walletStore.formatUsdtPrice(exactPrice) }}
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
                秒到账
              </div>
            </div>

            <!-- Option 1: Rounded -->
            <div
              class="option-card"
              :class="{ 'option-card--active': selectedOption === 1 }"
              @click="selectedOption = 1"
            >
              <div class="option-card__amount-row">
                <span class="option-card__amount">{{ roundedAmountLabel }}</span>
                <img :src="icCoins" alt="" class="option-card__coin" />
              </div>
              <div class="option-card__desc">
                需支付 {{ walletStore.formatUsdtPrice(roundedPrice) }}
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
                30分钟到账
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="card__action">
            <PrimaryButton text="支付" @click="submit" class="pay-cta" />
          </div>
        </div>
      </div>
    </div>

    <!-- Timeout Reminder Modal -->
    <div v-if="isTimedOut" class="timeout-overlay" @click.self="isTimedOut = false">
      <div class="timeout-card" data-node-id="19:46384">
        <div class="timeout-card__header">
          <h2 class="timeout-card__title">提醒通知</h2>
        </div>
        <div class="timeout-card__body">
          <p class="timeout-card__text timeout-card__text--first">页面停留时间过长，</p>
          <p class="timeout-card__text">请重新刷新页面后再充值</p>
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
  width: 317.029px;
  padding: 15.7px 15.399px 15.399px 15.399px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 18.116px;
  border: 0.96px solid rgba(242, 242, 242, 0.4);
  border-radius: clamp(28px, 10vw, 36.4px);
  box-shadow:
    3.4px 4.3px 6.9px rgba(0, 0, 0, 0.25),
    0 0 8.6px #000 inset,
    2.1px 4.25px 17.2px rgba(242, 242, 242, 0.9) inset;
  overflow: hidden;
  background-image: url('@/assets/images/wallet/bg_sharp.webp');
  background-size: cover;
  background-position: center;

  @include theme-light {
    --c-text: #fff;
    --c-text-muted: rgba(255, 255, 255, 0.5);
    --c-divider: rgba(255, 255, 255, 0.2);
    background-image: url('@/assets/images/wallet/bg_sharp.webp');
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

  @include theme-light {
    background: rgba(0, 0, 0, 0.7);
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
}

.card__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.2rem;
}

.card__header .card__title {
  margin-right: auto;
  flex-shrink: 0;
  white-space: nowrap;
}

.card__header .card__header-info {
  white-space: nowrap;
}

.card__title {
  color: var(--c-text);
  text-align: center;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 78%; /* 12.48px */
  letter-spacing: 0.32px;
  margin: 0;
}

.card__header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.card__header-info span {
  color: var(--c-text);
  text-align: center;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  line-height: 78%; /* 8.58px */
  letter-spacing: 0.22px;
}

.card__divider {
  width: 100%;
  height: 1px;
  background-image: linear-gradient(to right, var(--c-divider) 50%, transparent 50%);
  background-size: 10px 1px;
  margin: 18.12px 0;
}

.card__notice {
  color: var(--c-text);
  text-align: center;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  // line-height: 78%;
  letter-spacing: 0.32px;
  margin: 0 0 18.12px 0;
}

.options-container {
  display: flex;
  gap: 0.3rem;
  margin-bottom: 18.12px;
}

.option-card {
  display: flex;
  width: 131px;
  height: 111px;
  padding: 10.91px 12px 12.437px 12px;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  border-radius: 27.928px;
  background: rgba(245, 245, 245, 0.1);
  background-blend-mode: plus-lighter;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;

  @include theme-light {
    background: rgba(245, 245, 245, 0.1);
  }
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

  @include theme-light {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.option-card--active::before {
  opacity: 1;
}

.option-card__amount-row {
  display: flex;
  align-items: center;
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
  font-size: 17.317px;
  font-style: normal;
  font-weight: 700;
  line-height: 140%; /* 24.243px */
}

.option-card__coin {
  width: 24px;
  height: 25px;
  aspect-ratio: 24/25;
}

.option-card__desc {
  color: var(--c-text);
  text-align: right;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: 'SF Pro';
  font-size: 10.908px;
  font-style: normal;
  font-weight: 590;
  line-height: 132%; /* 14.398px */
  margin-bottom: 0;
  position: relative;
  z-index: 1;
}

.option-card__badge {
  display: flex;
  width: 101px;
  padding: 6.072px 4.146px;
  justify-content: center;
  align-items: center;
  gap: 1.641px;
  border-radius: 27.601px;
  background: rgba(255, 255, 255, 0.12);
  margin-bottom: 0;
  color: var(--c-text);
  text-align: right;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: 'SF Pro';
  font-size: 10.908px;
  font-style: normal;
  font-weight: 590;
  line-height: 132%; /* 14.398px */
  position: relative;
  z-index: 1;
  border: 1px solid transparent;
  box-sizing: border-box;

  @include theme-light {
    background: rgba(255, 255, 255, 0.12);
  }
}

.option-card__badge--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--c-text);

  @include theme-light {
    background: rgba(255, 255, 255, 0.12);
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
}
</style>

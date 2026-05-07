<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'

const props = defineProps<{
  goldCount: number;
  rate: number;
  feeRate: number;
  feeType?: number;
  discount?: number;
}>();

const emit = defineEmits<{
  close: []
  submit: [type: number]
}>()

const walletStore = useWalletStore()

// 0: exact amount, 1: rounded amount
const selectedOption = ref(0)
const isTimedOut = ref(false)
let timer: number | null = null

const exactGoldCount = computed(() => props.goldCount || 0);
const roundedGoldCount = computed(() => Math.floor((props.goldCount || 0) / 100) * 100);

const exactPriceData = computed(() => walletStore.calculateUsdtPrice(
  exactGoldCount.value,
  props.rate || 0,
  props.feeRate || 0,
  props.feeType || 0,
  props.discount || 0
));

const roundedPriceData = computed(() => walletStore.calculateUsdtPrice(
  roundedGoldCount.value,
  props.rate || 0,
  props.feeRate || 0,
  props.feeType || 0,
  props.discount || 0
));

const exactPrice = computed(() => exactPriceData.value.totalUiPrice);
const roundedPrice = computed(() => roundedPriceData.value.totalUiPrice);

function close(): void {
  emit('close')
}

function submit(): void {
  if (isTimedOut.value) return
  emit('submit', selectedOption.value)
}

function onRefresh() {
  window.location.reload()
}

onMounted(() => {
  // 15 minutes timeout
  timer = window.setTimeout(() => {
    isTimedOut.value = true
  }, 15 * 60 * 1000)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="overlay"
      :style="{ backgroundImage: `url(${sharpBgUrl})` }"
      @click.self="close"
    >
      <div class="card" :style="{ backgroundImage: `url(${sharpBgUrl})` }">
        <div class="card__inner">
          <!-- Header -->
          <div class="card__header">
            <h2 class="card__title">确认付款</h2>
            <div class="card__header-info">
              <span>手续费：{{ props.feeRate > 0 ? (props.feeRate * 100).toFixed(2).replace(/\.00$/, '') + '%' : '0' }}</span>
              <span>当前参考单价：1UC={{ props.rate || 1 }}USDT</span>
            </div>
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
                <span class="option-card__amount">{{ walletStore.formatUsdtPrice(exactPrice) }}</span>
                <img :src="icCoins" alt="" class="option-card__coin" />
              </div>
              <div class="option-card__desc">需支付 {{ walletStore.formatUsdtPrice(exactPrice) }}</div>
              <div class="option-card__badge" :class="{ 'option-card__badge--active': selectedOption === 0 }">
                <span class="badge-icon">
                  <svg class="badge-icon__bg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="width: 15px; height: 15px; aspect-ratio: 1/1;">
                    <ellipse cx="7.50662" cy="7.50662" rx="7.50662" ry="7.50662" fill="#F9F9F9" fill-opacity="0.2"/>
                  </svg>
                  <svg v-if="selectedOption === 0" class="badge-icon__check" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none" style="width: 10.421px; height: 10.421px;">
                    <path d="M5.20996 0.650391C7.72844 0.650391 9.7703 2.69153 9.77051 5.20996C9.77051 7.72857 7.72857 9.77051 5.20996 9.77051C2.69153 9.7703 0.650391 7.72844 0.650391 5.20996C0.650594 2.69165 2.69165 0.650594 5.20996 0.650391Z" stroke="#55FFE2" stroke-width="1.3"/>
                  </svg>
                </span>
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
                <span class="option-card__amount">{{ Math.floor(roundedPrice) }}</span>
                <img :src="icCoins" alt="" class="option-card__coin" />
              </div>
              <div class="option-card__desc">需支付 {{ walletStore.formatUsdtPrice(roundedPrice) }}</div>
              <div class="option-card__badge" :class="{ 'option-card__badge--active': selectedOption === 1 }">
                <span class="badge-icon">
                  <svg class="badge-icon__bg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="width: 15px; height: 15px; aspect-ratio: 1/1;">
                    <ellipse cx="7.50662" cy="7.50662" rx="7.50662" ry="7.50662" fill="#F9F9F9" fill-opacity="0.2"/>
                  </svg>
                  <svg v-if="selectedOption === 1" class="badge-icon__check" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none" style="width: 10.421px; height: 10.421px;">
                    <path d="M5.20996 0.650391C7.72844 0.650391 9.7703 2.69153 9.77051 5.20996C9.77051 7.72857 7.72857 9.77051 5.20996 9.77051C2.69153 9.7703 0.650391 7.72844 0.650391 5.20996C0.650594 2.69165 2.69165 0.650594 5.20996 0.650391Z" stroke="#55FFE2" stroke-width="1.3"/>
                  </svg>
                </span>
                30分钟到账
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="card__action">
            <PrimaryButton text="报名" @click="submit" />
          </div>
        </div>
      </div>
    </div>

    <!-- Timeout Reminder Modal -->
    <div v-if="isTimedOut" class="timeout-overlay" :style="{ backgroundImage: `url(${sharpBgUrl})` }" @click.self="isTimedOut = false">
      <div class="timeout-card" :style="{ backgroundImage: `url(${sharpBgUrl})` }">
        <div class="timeout-card__inner">
          <div class="timeout-header">
            <h2 class="timeout-title">提醒通知</h2>
          </div>
          <div class="timeout-body">
            <p class="timeout-text">页面停留时间过长，</p>
            <p class="timeout-text">请重新刷新页面后再充值</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
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
}

.overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  backdrop-filter: blur(34px);
  -webkit-backdrop-filter: blur(34px);
  background: rgba(12, 12, 12, 0.60);
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
}

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(0, 0, 0, 0.70);
  box-shadow:
    0.0919rem 0.1149rem 0.1838rem 0 rgba(0, 0, 0, 0.25),
    0 0 0.2298rem 0 #000 inset,
    0.0566rem 0.1132rem 0.4596rem 0 rgba(242, 242, 242, 0.90) inset;
  backdrop-filter: blur(7.580729961395264px);
  -webkit-backdrop-filter: blur(7.580729961395264px);
  pointer-events: none;
  z-index: 1;
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
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.card__title {
  color: #fff;
  text-align: center;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: var(--wallet-font-cn, "HONOR Sans CN");
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
  color: #fff;
  text-align: center;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: var(--wallet-font-cn, "HONOR Sans CN");
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  line-height: 78%; /* 8.58px */
  letter-spacing: 0.22px;
}

.card__divider {
  width: 100%;
  height: 1px;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.3) 50%, transparent 50%);
  background-size: 10px 1px;
  margin: 18.12px 0;
}

.card__notice {
  color: #fff;
  text-align: center;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: var(--wallet-font-cn, "HONOR Sans CN");
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
  background: rgba(245, 245, 245, 0.10);
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
  color: var(--White, #F9F9F9);
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: var(--wallet-font-num, "SF Pro");
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
  color: rgba(255, 234, 234, 1);
  text-align: right;
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: "SF Pro";
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
  color: #fff;
  text-align: right;
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: "SF Pro";
  font-size: 10.908px;
  font-style: normal;
  font-weight: 590;
  line-height: 132%; /* 14.398px */
  position: relative;
  z-index: 1;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.option-card__badge--active {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;

}

.badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 15px;
  height: 15px;
}

.badge-icon__bg {
  position: absolute;
  inset: 0;
}

.badge-icon__check {
  position: absolute;
  z-index: 1;
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
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.timeout-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  backdrop-filter: blur(34px);
  -webkit-backdrop-filter: blur(34px);
  background: rgba(12, 12, 12, 0.60);
}

.timeout-card {
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
  animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.timeout-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(0, 0, 0, 0.70);
  box-shadow:
    0.0919rem 0.1149rem 0.1838rem 0 rgba(0, 0, 0, 0.25),
    0 0 0.2298rem 0 #000 inset,
    0.0566rem 0.1132rem 0.4596rem 0 rgba(242, 242, 242, 0.90) inset;
  backdrop-filter: blur(7.580729961395264px);
  -webkit-backdrop-filter: blur(7.580729961395264px);
  pointer-events: none;
  z-index: 1;
}

.timeout-card::before {
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
}

.timeout-card__inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-self: stretch;
}

.timeout-header {
  display: flex;
  align-self: stretch;
  height: 45.58px;
  padding: 17px 5.804px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 45.58px;
  margin: 0 -15.399px 0;
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.10) 21.11%, rgba(230, 230, 230, 0.10) 71.43%);
}

.timeout-title {
  background: linear-gradient(180deg, #fff 0%, #e6e6e6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: var(--wallet-font-cn, "HONOR Sans CN");
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.32px;
}

.timeout-body {
  text-align: center;
  margin-top: 18.12px;
}

.timeout-text {
  color: #fff;
  font-family: var(--wallet-font-cn, "HONOR Sans CN");
  font-size: 15px;
  line-height: 1.5;
  margin: 0;
  letter-spacing: 0.32px;
}

@keyframes modal-pop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>

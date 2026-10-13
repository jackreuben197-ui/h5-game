<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import type { OnlinePayTypeUserAddressItem } from '@/api/models/config'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import { t } from '@/i18n'

const props = defineProps<{
  goldCount: number
  rate: number
  feeRate: number
  feeType?: number
  discount?: number
  uniqueAmountEnabled?: boolean
  originalAmountAvailable?: boolean
  originalGoldCount?: number
  walletAddresses?: OnlinePayTypeUserAddressItem[]
}>()

const emit = defineEmits<{
  close: []
  submit: [type: number, payAddress: string, saveAddress: boolean]
  refresh: []
}>()

const walletStore = useWalletStore()

// 0: exact amount, 1: rounded amount
const selectedOption = ref(0)
const payAddress = ref('')
const saveAddress = ref(false)
const addressError = ref('')
let refreshTimer: number | null = null

const exactGoldCount = computed(() => props.goldCount || 0)
const roundedGoldCount = computed(
  () => props.originalGoldCount ?? Math.floor((props.goldCount || 0) / 100) * 100,
)

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
  const address = payAddress.value.trim()
  if (!address) {
    addressError.value = t('UIDialogTribeRechargeUSDT_InputAddress')
    return
  }
  emit('submit', selectedOption.value, address, saveAddress.value)
}

function scheduleUniqueAmountRefresh(): void {
  if (refreshTimer) window.clearInterval(refreshTimer)
  refreshTimer = null
  if (!props.uniqueAmountEnabled) return
  refreshTimer = window.setInterval(() => emit('refresh'), 3 * 60 * 1000)
}

watch(
  () => props.walletAddresses,
  (addresses) => {
    if (!payAddress.value.trim()) {
      payAddress.value = addresses?.find((item) => item.address?.trim())?.address?.trim() ?? ''
    }
  },
  { immediate: true },
)

watch(
  () => props.originalAmountAvailable,
  (available) => {
    if (available === false && selectedOption.value === 1) selectedOption.value = 0
  },
)

onMounted(scheduleUniqueAmountRefresh)

onUnmounted(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="close">
      <div class="card">
        <div class="card__inner">
          <!-- Header -->
          <div class="card__header">
            <h2 class="card__title">{{ t('UIMineMallUSDTShopPayDialogSurePay') }}</h2>
            <div class="card__header-info">
              <span>
                {{ t('UIMine_WalletPlatform_fee_s') }}：{{
                  props.feeType === 2 && props.feeRate > 0
                    ? (props.feeRate * 100).toFixed(2).replace(/\.00$/, '') + '%'
                    : '0'
                }}
              </span>
              <span>{{ t('UIWallet_Current') }}：1USDT={{ props.rate || 1 }}UC</span>
            </div>
          </div>

          <!-- Divider -->
          <div class="card__divider"></div>

          <!-- Notice -->
          <p class="card__notice">
            {{ t('UIWallet_Success') }}，{{ t('UIWallet_Text13') }}<br />（{{ t('UIWallet_Text14') }}4{{ t('UIWallet_Text15') }}）{{ t('UIMineMallUSDTShopDiamondPayTip') }}。
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
                <span class="badge-icon">
                  <svg
                    class="badge-icon__bg"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style="width: 15px; height: 15px; aspect-ratio: 1/1"
                  >
                    <ellipse
                      cx="7.50662"
                      cy="7.50662"
                      rx="7.50662"
                      ry="7.50662"
                      fill="currentColor"
                      fill-opacity="0.2"
                    />
                  </svg>
                  <svg
                    v-if="selectedOption === 0"
                    class="badge-icon__check"
                    xmlns="http://www.w3.org/2000/svg"
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                    style="width: 10.421px; height: 10.421px"
                  >
                    <path
                      d="M5.20996 0.650391C7.72844 0.650391 9.7703 2.69153 9.77051 5.20996C9.77051 7.72857 7.72857 9.77051 5.20996 9.77051C2.69153 9.7703 0.650391 7.72844 0.650391 5.20996C0.650594 2.69165 2.69165 0.650594 5.20996 0.650391Z"
                      stroke="currentColor"
                      stroke-width="1.3"
                    />
                  </svg>
                </span>
                {{ t('UIUCWalletAddress1') }}
              </div>
            </div>

            <!-- Option 1: Rounded -->
            <div
              v-if="props.uniqueAmountEnabled"
              class="option-card"
              :class="{
                'option-card--active': selectedOption === 1,
                'option-card--disabled': props.originalAmountAvailable === false,
              }"
              @click="props.originalAmountAvailable !== false && (selectedOption = 1)"
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
                <span class="badge-icon">
                  <svg
                    class="badge-icon__bg"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style="width: 15px; height: 15px; aspect-ratio: 1/1"
                  >
                    <ellipse
                      cx="7.50662"
                      cy="7.50662"
                      rx="7.50662"
                      ry="7.50662"
                      fill="currentColor"
                      fill-opacity="0.2"
                    />
                  </svg>
                  <svg
                    v-if="selectedOption === 1"
                    class="badge-icon__check"
                    xmlns="http://www.w3.org/2000/svg"
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                    style="width: 10.421px; height: 10.421px"
                  >
                    <path
                      d="M5.20996 0.650391C7.72844 0.650391 9.7703 2.69153 9.77051 5.20996C9.77051 7.72857 7.72857 9.77051 5.20996 9.77051C2.69153 9.7703 0.650391 7.72844 0.650391 5.20996C0.650594 2.69165 2.69165 0.650594 5.20996 0.650391Z"
                      stroke="currentColor"
                      stroke-width="1.3"
                    />
                  </svg>
                </span>
                30{{ t('UIWallet_Text17') }}
              </div>
            </div>
          </div>

          <div class="payer-address">
            <select
              v-if="(props.walletAddresses?.length ?? 0) > 0"
              v-model="payAddress"
              class="payer-address__select"
              @change="addressError = ''"
            >
              <option
                v-for="item in props.walletAddresses"
                :key="item.id ?? item.address"
                :value="item.address"
              >
                {{ item.address }}
              </option>
            </select>
            <input
              v-model="payAddress"
              class="payer-address__input"
              :placeholder="t('UIDialogTribeRechargeUSDT_InputAddress')"
              autocomplete="off"
              @input="addressError = ''"
            />
            <label class="payer-address__save">
              <input v-model="saveAddress" type="checkbox" />
              <span>{{ t('Save') }}</span>
            </label>
            <p v-if="addressError" class="payer-address__error">{{ addressError }}</p>
          </div>

          <!-- Submit Button -->
          <div class="card__action">
            <PrimaryButton :text="t('UIMineMallUSDTShopDiamondPayTip')" @click="submit" />
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
  padding: clamp(20px, 7vw, 28px);
  background: var(--c-overlay);
}

.overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  backdrop-filter: blur(34px);
  -webkit-backdrop-filter: blur(34px);
  background: var(--c-overlay);
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
    background: linear-gradient(
      148.19deg,
      rgba(78, 78, 78, 0.78) 0%,
      rgba(58, 58, 58, 0.82) 48%,
      rgba(42, 42, 42, 0.86) 100%
    );
  }
}

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(0, 0, 0, 0.7);
  box-shadow:
    0.0919rem 0.1149rem 0.1838rem 0 rgba(0, 0, 0, 0.25),
    0 0 0.2298rem 0 #000 inset,
    0.0566rem 0.1132rem 0.4596rem 0 rgba(242, 242, 242, 0.9) inset;
  backdrop-filter: blur(7.580729961395264px);
  -webkit-backdrop-filter: blur(7.580729961395264px);
  pointer-events: none;
  z-index: 1;

  @include theme-light {
    background: rgba(8, 8, 8, 0.25);
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
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.card__title {
  color: var(--c-text);
  text-align: center;
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
  justify-content: center;
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

.option-card--disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.payer-address {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  margin-top: 0.24rem;
}

.payer-address__select,
.payer-address__input {
  width: 100%;
  min-height: 0.82rem;
  padding: 0 0.24rem;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 0.22rem;
  color: var(--c-text);
  background: rgba(0, 0, 0, 0.22);
  font-size: 0.28rem;
}

.payer-address__save {
  display: flex;
  align-items: center;
  gap: 0.14rem;
  color: var(--c-text-muted);
  font-size: 0.25rem;
}

.payer-address__error {
  margin: 0;
  color: #ff6b6b;
  font-size: 0.24rem;
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
  color: var(--c-text);
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
  color: rgba(249, 249, 249, 0.83);

  @include theme-light {
    color: rgba(249, 249, 249, 0.83);
  }
}

.badge-icon__check {
  position: absolute;
  z-index: 1;
  color: var(--c-brand);
}

.card__action {
  margin-top: 0.1rem;
}
</style>

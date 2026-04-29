<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import ava1 from '@/assets/images/wallet/avatars/ava1.png'
import icCoins from '@/assets/icons/wallet/ic_coins.png'
import icUsdt from '@/assets/icons/wallet/ic_usdt.svg'
import icBtc from '@/assets/icons/wallet/ic_btc.svg'
import icEth from '@/assets/icons/wallet/ic_eth.svg'
import icCard from '@/assets/icons/wallet/ic_card.svg'
import AppBar from '@/components/wallet/AppBar.vue'
import SegmentedToggle from '@/views/wallet/components/SegmentedToggle.vue'
import UserCard from '@/views/wallet/components/UserCard.vue'
import GlassButton from '@/components/Button/GlassButton.vue'
import BellButton from '@/components/Button/BellButton.vue'
import PresetAmountGrid, { type Preset } from '@/views/wallet/components/PresetAmountGrid.vue'
import PaymentMethodStrip, { type PaymentMethod } from '@/views/wallet/components/PaymentMethodStrip.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import NumericKeypad from '@/views/wallet/components/NumericKeypad.vue'
import WithdrawForm from '@/views/wallet/components/WithdrawForm.vue'
import { t } from '@/i18n'

const router = useRouter()

const activeTab = ref(0)
const activePreset = ref(0)
const activeMethod = ref(0)
const keypadOpen = ref(false)
const customAmount = ref('')

function onCustom(): void {
  keypadOpen.value = true
}

function onKeypadSubmit(v: number): void {
  customAmount.value = String(v)
  keypadOpen.value = false
}

const presets: Preset[] = [
  { amount: '100000', chip: '300,000' },
  { amount: '100000', chip: '300,000' },
  { amount: '100000', chip: '300,000' },
  { amount: '100000', chip: '300,000' },
  { amount: '100000', chip: '300,000' },
]

const methods: PaymentMethod[] = [
  { icon: icUsdt, primary: 'USDT', secondary: 'TRC20' },
  { icon: icUsdt, primary: 'USDT', secondary: 'TRC20' },
  { icon: icBtc, primary: 'BTC', secondary: '' },
  { icon: icEth, primary: 'ETH', secondary: '' },
  { icon: icCard, primary: t('Wallet_MethodCard'), secondary: '' },
]

const tabLabels = [t('Wallet_Deposit'), t('Wallet_Withdraw')]
</script>

<template>
  <div
    class="wallet-screen"
    :style="{ backgroundImage: `url(${mainBgUrl})` }"
  >
    <AppBar
      :title="t('Wallet_Title')"
      :show-actions="false"
    />

    <div class="wallet-screen__content">
      <div class="tabs-row">
        <SegmentedToggle
          v-model="activeTab"
          :tabs="tabLabels"
        />
        <BellButton class="tabs-row__bell" />
      </div>

      <UserCard
        class="wallet-banner"
        :avatar="ava1"
        name="Cooper&#10;Korsgaard"
        user-id="8677650585"
      >
        <template #actions>
          <GlassButton
            :label="$txt('Wallet_Records')"
            @click="router.push('/wallet/orders')"
          />
          <GlassButton
            :label="$txt('Wallet_Details')"
            @click="router.push('/wallet/details')"
          />
        </template>
        <template #extra>
          <div class="balance-row">
            <div class="balance-chip">
              <span class="balance-chip__value">19,231</span>
              <img
                :src="icCoins"
                alt=""
                class="balance-chip__icon"
              />
            </div>
            <span class="balance-label">{{ $txt('Wallet_Balance') }}</span>
          </div>
        </template>
      </UserCard>

      <template v-if="activeTab === 0">
        <div class="presets-card">
          <PresetAmountGrid
            :presets="presets"
            :active-index="activePreset"
            @select="activePreset = $event"
            @custom="onCustom"
          />
        </div>

        <PaymentMethodStrip
          :methods="methods"
          :active-index="activeMethod"
          @select="activeMethod = $event"
        />

        <PrimaryButton
          :text="t('Wallet_PayNow', '999')"
          class="pay-cta"
        />
      </template>

      <template v-else>
        <WithdrawForm />
      </template>
    </div>

    <NumericKeypad
      :open="keypadOpen"
      @close="keypadOpen = false"
      @submit="onKeypadSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.wallet-screen {
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.64rem);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.wallet-screen__content {
  display: flex;
  flex-direction: column;
  gap: 0.26rem;
  padding: 0 0.455rem;
  margin-top: 0.2rem;
}

.tabs-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabs-row__bell {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-70%);
}

.wallet-banner {
  margin: 0 22px;
}

.presets-card {
  position: relative;
  padding: 0.7rem 0.48rem 0.55rem;
  background: rgba(0, 0, 0, 0.01);
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  border: 0.18px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  margin-top: -20px;
  z-index: 1;
  margin-bottom: 10px;
}

.presets-card::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  background-image: linear-gradient(
    110.6deg,
    rgba(249, 249, 249, 0.18) 12%,
    rgba(249, 249, 249, 0.24) 33%,
    rgba(147, 147, 147, 0.3) 85%
  );
  mix-blend-mode: hard-light;
  pointer-events: none;
  border-radius: inherit;
  z-index: 0;
}

.presets-card > * {
  position: relative;
  z-index: 1;
}

.balance-row {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.095rem;
  margin-top: 0.21rem;
  margin-bottom: 0.54rem;
  margin-left: 54px;
}

.balance-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.14rem;
  background: rgba(0, 0, 0, 0.22);
  border: 0.4px solid rgba(242, 242, 242, 0.4);
  border-radius: 0.4rem;
  padding: 0.18rem 0.21rem 0.18rem 0.33rem;
  box-shadow: 0.8px 1px 1.6px rgba(0, 0, 0, 0.25);
  height: 0.85rem;
}

.balance-chip__value {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.43rem;
  color: #f9f9f9;
  line-height: 1.4;
}

.balance-chip__icon {
  width: 0.7rem;
  height: 0.7rem;
}

.balance-label {
  font-family: var(--wallet-font-num);
  font-weight: 600;
  font-size: 0.24rem;
  color: #f8f8f8;
}

.pay-cta {
  margin-top: 0.2rem;
}
</style>

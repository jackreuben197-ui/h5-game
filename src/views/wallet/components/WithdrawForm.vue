<script setup lang="ts">
import { ref } from 'vue'
import icRoundedArrowRight from '@/assets/icons/wallet/ic_rounded_arrow_right.svg'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import { t } from '@/i18n'

interface Props {
  availableUc?: string | number
  rate?: string
}

withDefaults(defineProps<Props>(), {
  availableUc: '12345678',
  rate: '',
})

const emit = defineEmits<{
  'open-recipient': []
  submit: [payload: { recipient: string; remark: string; amount: string }]
}>()

const recipient = ref('USDT')
const remark = ref('')
const amount = ref('')
</script>

<template>
  <div class="wf">
    <div class="wf__card">
      <div class="wf__field">
        <div class="wf__label">{{ $txt('Wallet_RecipientLabel') }}</div>
        <div class="wf__row">
          <div class="wf__input wf__input--select">
            <span class="wf__input-text">{{ recipient || 'USDT' }}</span>
          </div>
          <button
            class="wf__pill"
            @click="emit('open-recipient')"
          >
            <span>{{ $txt('Wallet_Records') }}</span>
            <img
              :src="icRoundedArrowRight"
              alt=""
              class="wf__pill-icon"
            />
          </button>
        </div>
      </div>

      <div class="wf__field">
        <div class="wf__label">{{ $txt('Wallet_RemarkLabel') }}</div>
        <div class="wf__input">
          <input
            v-model="remark"
            type="text"
            class="wf__input-native"
            placeholder="**************"
          />
        </div>
      </div>
    </div>

    <div class="wf__card">
      <div class="wf__balance">
        <span class="wf__balance-label">{{ t('Wallet_AvailableUc', String(availableUc)) }}</span>
      </div>
      <div class="wf__input">
        <input
          v-model="amount"
          type="text"
          inputmode="numeric"
          class="wf__input-native wf__input-native--center"
          :placeholder="$txt('Wallet_InputPlaceholder')"
        />
      </div>
      <div class="wf__rate">{{ rate || t('Wallet_Rate') }}</div>
    </div>

    <PrimaryButton
      :text="$txt('Wallet_SubmitWithdraw')"
      @click="emit('submit', { recipient, remark, amount })"
    />
  </div>
</template>

<style scoped lang="scss">
.wf {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  width: 100%;
}

.wf__card {
  position: relative;
  padding: 0.55rem 0.42rem;
  background: rgba(0, 0, 0, 0.01);
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  border: 0.18px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  overflow: hidden;
  z-index: 1;
}

.wf__card::before {
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

.wf__card > * {
  position: relative;
  z-index: 1;
}

.wf__card:first-child {
  margin-top: -20px;
}

.wf__field {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.wf__label {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.285rem;
  color: #f9f9f9;
  padding-left: 0.1rem;
}

.wf__row {
  display: flex;
  gap: 0.13rem;
  align-items: center;
}

.wf__input {
  flex: 1;
  min-width: 0;
  background: rgba(0, 0, 0, 0.26);
  border-radius: 0.6rem;
  padding: 0.36rem 0.28rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.2rem;
}

.wf__input--select {
  cursor: pointer;
}

.wf__input-text {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.4;
}

.wf__input-native {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  color: #fff;
  text-align: center;
}

.wf__input-native::placeholder {
  color: rgba(255, 255, 255, 0.65);
}

.wf__pill {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.19rem 0.19rem 0.19rem 0.33rem;
  background: rgba(255, 255, 255, 0.2);
  border: 0.4px solid rgba(242, 242, 242, 0.4);
  border-radius: 1.37rem;
  box-shadow: 0.8px 1px 1.6px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.wf__pill span {
  font-family: var(--wallet-font-num);
  font-weight: 510;
  font-size: 0.32rem;
  color: #fff;
  line-height: 1.4;
}

.wf__pill-icon {
  width: 0.38rem;
  height: 0.38rem;
}

.wf__balance {
  display: flex;
  justify-content: center;
  padding: 0.26rem 0.4rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.8rem;
}

.wf__balance-label {
  font-family: var(--wallet-font-cn);
  font-weight: 600;
  font-size: 0.415rem;
  color: #fff;
  line-height: 1.4;
}

.wf__input-native--center {
  text-align: center;
}

.wf__rate {
  text-align: center;
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.29rem;
  color: #fff;
  line-height: 1.2;
}
</style>

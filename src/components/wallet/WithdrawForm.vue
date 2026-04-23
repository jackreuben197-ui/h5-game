<script setup lang="ts">
import { ref } from 'vue'
import icRoundedArrowRight from '@/assets/icons/wallet/ic_rounded_arrow_right.svg'
import PrimaryButton from './PrimaryButton.vue'
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
      :label="$txt('Wallet_SubmitWithdraw')"
      @click="emit('submit', { recipient, remark, amount })"
    />
  </div>
</template>

<style scoped lang="scss">
.wf {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 3.2vw, 14px);
  width: 100%;
}

.wf__card {
  position: relative;
  padding: clamp(16px, 5.5vw, 22px) clamp(12px, 4.2vw, 15px);
  background: rgba(0, 0, 0, 0.01);
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  border: 0.18px solid rgba(255, 255, 255, 0.3);
  border-radius: clamp(28px, 10vw, 37.4px);
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 3vw, 11px);
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
  gap: clamp(3px, 1.2vw, 4.5px);
}

.wf__label {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: clamp(9px, 2.85vw, 10.3px);
  color: #f9f9f9;
  padding-left: clamp(2px, 1vw, 4px);
}

.wf__row {
  display: flex;
  gap: clamp(4px, 1.3vw, 5px);
  align-items: center;
}

.wf__input {
  flex: 1;
  min-width: 0;
  background: rgba(0, 0, 0, 0.26);
  border-radius: clamp(16px, 6vw, 22.1px);
  padding: clamp(10px, 3.6vw, 12.8px) clamp(8px, 2.8vw, 10px);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: clamp(38px, 12vw, 45px);
}

.wf__input--select {
  cursor: pointer;
}

.wf__input-text {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: clamp(13px, 4vw, 15px);
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
  font-size: clamp(13px, 4vw, 15px);
  color: #fff;
  text-align: center;
}

.wf__input-native::placeholder {
  color: rgba(255, 255, 255, 0.65);
}

.wf__pill {
  display: flex;
  align-items: center;
  gap: clamp(3px, 1.5vw, 5.6px);
  padding: clamp(5px, 1.9vw, 7.2px) clamp(5px, 1.9vw, 7.2px) clamp(5px, 1.9vw, 7.2px) clamp(9px, 3.3vw, 12.4px);
  background: rgba(255, 255, 255, 0.2);
  border: 0.4px solid rgba(242, 242, 242, 0.4);
  border-radius: clamp(36px, 13.7vw, 51.3px);
  box-shadow: 0.8px 1px 1.6px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.wf__pill span {
  font-family: var(--wallet-font-num);
  font-weight: 510;
  font-size: clamp(10px, 3.2vw, 12px);
  color: #fff;
  line-height: 1.4;
}

.wf__pill-icon {
  width: clamp(12px, 3.8vw, 14px);
  height: clamp(12px, 3.8vw, 14px);
}

.wf__balance {
  display: flex;
  justify-content: center;
  padding: clamp(8px, 2.6vw, 10px) clamp(12px, 4vw, 15px);
  background: rgba(0, 0, 0, 0.2);
  border-radius: clamp(22px, 8vw, 30px);
}

.wf__balance-label {
  font-family: var(--wallet-font-cn);
  font-weight: 600;
  font-size: clamp(13px, 4.15vw, 15.6px);
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
  font-size: clamp(9px, 2.9vw, 10.7px);
  color: #fff;
  line-height: 1.2;
}
</style>

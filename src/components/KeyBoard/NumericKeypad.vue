<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import mainBgUrl from '@/assets/images/main_bg.webp'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import { t } from '@/i18n'

interface Props {
  open?: boolean
  min?: number
  max?: number
  maxLength?: number
  initialValue?: string
  allowLeadingZero?: boolean
  showMask?: boolean
  showInputArea?: boolean
  confirmText?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  min: 1,
  max: 1000000,
  maxLength: undefined,
  initialValue: '',
  allowLeadingZero: false,
  title: '',
  showMask: true,
  showInputArea: false,
  confirmText: t('Wallet_Confirm'),
})

const emit = defineEmits<{
  close: []
  submit: [value: number]
  keyPress: [
    payload: {
      key: string
      action: 'digit' | 'clear' | 'backspace'
      value: string
      accepted: boolean
    },
  ]
}>()

const value = ref('')
const digits: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const getMaxLength = (): number => props.maxLength ?? String(props.max).length

function emitKeyPress(
  key: string,
  action: 'digit' | 'clear' | 'backspace',
  accepted: boolean,
): void {
  emit('keyPress', {
    key,
    action,
    value: value.value,
    accepted,
  })
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      value.value = String(props.initialValue || '')
        .replace(/\D/g, '')
        .slice(0, getMaxLength())
    }
  },
)

function press(k: string): void {
  if (value.value.length >= getMaxLength()) {
    emitKeyPress(k, 'digit', false)
    return
  }
  if (!props.allowLeadingZero && value.value === '' && k === '0') {
    emitKeyPress(k, 'digit', false)
    return
  }
  value.value += k
  emitKeyPress(k, 'digit', true)
}

function clearAll(): void {
  const changed = value.value.length > 0
  value.value = ''
  emitKeyPress('C', 'clear', changed)
}

function backspace(): void {
  const changed = value.value.length > 0
  value.value = value.value.slice(0, -1)
  emitKeyPress('Backspace', 'backspace', changed)
}

function cancel(): void {
  emit('close')
}

function confirm(): void {
  const n = Number(value.value)
  if (!value.value || n < props.min || n > props.max) return
  emit('submit', n)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="keypad">
      <div
        v-if="open"
        :class="['kp', { 'kp--plain': !showMask }]"
        :style="showMask ? { backgroundImage: `url(${mainBgUrl})` } : undefined"
        @click.self="cancel"
        @dblclick.prevent
      >
        <div v-if="showMask" class="kp__dim" @click="cancel"></div>
        <div :class="['kp__sheet', { 'kp__sheet--plain': !showMask }]" @dblclick.prevent>
          <div v-if="showInputArea" class="kp__header">
            <span class="kp__title">{{ title || t('Wallet_CustomAmount') }}</span>
            <div class="kp__input">
              <span v-if="!value" class="kp__placeholder">
                {{ t('Wallet_KeypadPlaceholder', min, max) }}
              </span>
              <span v-else class="kp__value">
                {{ value }}
              </span>
            </div>
          </div>

          <div class="kp__grid">
            <button v-for="n in digits" :key="n" class="kp__key" @click="press(n)">
              {{ n }}
            </button>
            <button class="kp__key kp__key--accent" @click="clearAll">C</button>
            <button class="kp__key" @click="press('0')">0</button>
            <button class="kp__key kp__key--accent" @click="backspace">
              <Icon icon="solar:backspace-bold" class="kp__icon" />
            </button>
          </div>

          <div class="kp__actions">
            <PrimaryButton
              :text="confirmText"
              :shadow="false"
              class="kp__confirm"
              @click="confirm"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.kp {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.kp--plain {
  background-image: none !important;
  background-color: transparent;
}

.kp__dim {
  position: absolute;
  inset: 0;
  background: rgba(12, 12, 12, 0.6);
  cursor: pointer;
}

.kp__sheet,
.kp__sheet--plain {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  padding: 24.096px 19.954px 15.519px 19.954px;
  flex-direction: column;
  align-items: center;
  gap: 16.265px;
  border-radius: 31.672px 31.672px 0 0;
  border: 0.894px solid rgba(242, 242, 242, 0.4);
  border-bottom: none;
  // background: url(@/assets/images/wallet/bg_sharp.webp) lightgray 0% 0% / 40.11695086956024px 40.11695086956024px repeat,
  // linear-gradient(107deg, rgba(142, 142, 142, 0.30) 2.93%, rgba(103, 103, 103, 0.40) 43.62%, rgba(73, 73, 73, 0.50) 89.79%);
  background-blend-mode: overlay, hard-light;
  box-shadow:
    3.222px 4.028px 6.445px 0 rgba(0, 0, 0, 0.25),
    1.134px 1.134px 2.268px 0 rgba(242, 242, 242, 0.2) inset;
  backdrop-filter: blur(9.921565055847168px);
  -webkit-backdrop-filter: blur(9.921565055847168px);
  overflow: hidden;
  touch-action: manipulation;
}

.kp__sheet::before,
.kp__sheet--plain::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.894px;
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
  z-index: 2;
}

.kp__sheet > * {
  position: relative;
  z-index: 1;
}

.kp__header {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  width: 100%;
}

.kp__title {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.355rem;
  color: #f9f9f9;
  line-height: 1.2;
}

.kp__input {
  width: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.59rem;
  padding: 0.34rem 0.26rem;
  text-align: center;
  min-height: 1.28rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kp__placeholder,
.kp__value {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  line-height: 1.4;
}

.kp__placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.kp__value {
  color: #fff;
}

.kp__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.22rem;
  width: 100%;
  touch-action: manipulation;
}

.kp__key {
  position: relative;
  width: 100%;
  height: 50.904px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(233, 233, 233, 0.2) 0%, rgba(165, 165, 165, 0.4) 100%);
  mix-blend-mode: plus-lighter;
  border-radius: 14.157px;
  border: none;
  backdrop-filter: blur(6.02px);
  -webkit-backdrop-filter: blur(6.02px);
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: 0.61rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.kp__key::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.71px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0) 55%,
    rgba(255, 255, 255, 0) 61%,
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

.kp__key:active {
  opacity: 0.7;
  transform: scale(0.96);
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

.kp__key--accent {
  display: flex;
  width: 100%;
  height: 50.904px;
  padding: 7.53px 9.639px;
  justify-content: center;
  align-items: center;
  border-radius: 60.241px;
  background: rgba(245, 45, 45, 0.2);
  mix-blend-mode: plus-lighter;
}

.kp__icon {
  width: 50px;
  height: 32px;
}

.kp__actions {
  display: flex;
  gap: 0.25rem;
  padding: 0 0.2rem;
  margin-top: 0.13rem;
  width: 100%;
  touch-action: manipulation;
}

.kp__cancel {
  flex: 1;
  height: 1.44rem;
  border-radius: 1.05rem;
  background: rgba(0, 0, 0, 0.55);
  border: none;
  color: #fff;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

.kp__confirm {
  display: flex !important;
  height: 55.184px !important;
  justify-content: center !important;
  align-items: center !important;
  flex: 1 0 0 !important;
  border-radius: 40.576px !important;
  background: linear-gradient(
    97deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  ) !important;
  backdrop-filter: blur(0.16230463981628418px) !important;
  box-shadow: none !important;
}

.kp__confirm::before {
  display: none !important;
}

.kp__confirm :deep(.primary-btn__text) {
  color: #78e490 !important;
  text-align: center !important;
  font-feature-settings:
    'liga' off,
    'clig' off !important;
  font-family: 'HONOR Sans CN', sans-serif !important;
  font-size: 15.658px !important;
  font-style: normal !important;
  font-weight: 500 !important;
  line-height: 120% !important;
}

:deep(.kp__confirm),
:deep(.kp__confirm *) {
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

.keypad-enter-active .kp__sheet,
.keypad-leave-active .kp__sheet {
  transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.keypad-enter-active .kp__dim,
.keypad-leave-active .kp__dim {
  transition: opacity 0.2s ease;
}

.keypad-enter-from .kp__dim,
.keypad-leave-to .kp__dim {
  opacity: 0;
}

.keypad-enter-from .kp__sheet,
.keypad-leave-to .kp__sheet {
  transform: translateY(100%);
}
</style>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
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
  showBackground?: boolean
  showInputArea?: boolean
  confirmText?: string
  title?: string
  allowDecimal?: boolean // When true, replace 'C' with '.' and allow decimal input
  showCancel?: boolean
  showActions?: boolean
  allowPageInteraction?: boolean
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
  showBackground: true,
  showInputArea: false,
  confirmText: t('Wallet_Confirm'),
  allowDecimal: false,
  showCancel: true,
  showActions: true,
  allowPageInteraction: false,
})

const emit = defineEmits<{
  close: []
  submit: [value: number]
  keyPress: [
    payload: {
      key: string
      action: 'digit' | 'clear' | 'backspace' | 'decimal'
      value: string
      accepted: boolean
    },
  ]
}>()

const value = ref('')
const digits: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const getMaxLength = (): number => {
  if (props.maxLength) return props.maxLength
  if (props.allowDecimal) return 4 // e.g. "100.0" max 4 digits
  return String(props.max).length
}

function hasDecimal(): boolean {
  return value.value.includes('.')
}

function emitKeyPress(
  key: string,
  action: 'digit' | 'clear' | 'backspace' | 'decimal',
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
      if (props.allowDecimal) {
        // For decimal mode, allow digits and one decimal point
        value.value = String(props.initialValue || '')
          .replace(/[^0-9.]/g, '')
          .split('.')
          .slice(0, 2)
          .join('.')
          .slice(0, getMaxLength())
      } else {
        value.value = String(props.initialValue || '')
          .replace(/\D/g, '')
          .slice(0, getMaxLength())
      }
    }
  },
)

function press(k: string): void {
  if (props.allowDecimal) {
    // Decimal mode
    if (k === '.') {
      if (hasDecimal()) {
        emitKeyPress('.', 'decimal', false)
        return
      }
      if (value.value === '') {
        value.value = '0.'
        emitKeyPress('.', 'decimal', true)
        return
      }
      value.value += '.'
      emitKeyPress('.', 'decimal', true)
      return
    }
    if (value.value.length >= getMaxLength()) {
      emitKeyPress(k, 'digit', false)
      return
    }
    // Limit to 1 decimal place
    if (hasDecimal() && value.value.split('.')[1]?.length >= 1) {
      emitKeyPress(k, 'digit', false)
      return
    }
    value.value += k
    emitKeyPress(k, 'digit', true)
    return
  }

  // Original integer mode
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
  if (!value.value || n < props.min) return
  // Cap at max for decimal mode (percentage)
  const cappedValue = n > props.max ? props.max : n
  emit('submit', cappedValue)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="keypad">
      <div
        v-if="open"
        :class="[
          'kp',
          {
            'kp--plain': !showMask,
            'kp--passthrough': allowPageInteraction,
          },
        ]"
        @click.self="cancel"
        @dblclick.prevent
      >
        <div v-if="showMask" class="kp__dim" @click="cancel"></div>
        <div
          :class="[
            'kp__sheet',
            {
              'kp__sheet--plain': !showMask && showBackground,
              'kp__sheet--glass': !showBackground,
            },
          ]"
          @dblclick.prevent
        >
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
            <button
              v-for="n in digits"
              :key="n"
              type="button"
              class="kp__key"
              @click="press(n)"
              @dblclick.prevent
            >
              {{ n }}
            </button>
            <button
              type="button"
              class="kp__key kp__key--accent"
              @click="props.allowDecimal ? press('.') : clearAll()"
              @dblclick.prevent
            >
              {{ props.allowDecimal ? '.' : 'C' }}
            </button>
            <button
              type="button"
              class="kp__key"
              @click="press('0')"
              @dblclick.prevent
            >
              0
            </button>
            <button
              type="button"
              class="kp__key kp__key--accent"
              @click="backspace"
              @dblclick.prevent
            >
              <Icon icon="solar:backspace-bold" class="kp__icon" />
            </button>
          </div>

          <div v-if="showActions" class="kp__actions">
            <button
              v-if="showCancel"
              type="button"
              class="kp__cancel"
              @click="cancel"
              @dblclick.prevent
            >
              {{ t('Wallet_Cancel') }}
            </button>
            <PrimaryButton :text="confirmText" :shadow="false" class="kp__confirm" @click="confirm" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

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
  // background-image: url('@/assets/images/main_bg.webp');
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.kp--plain {
  background-image: none !important;
  background-color: transparent;

  @include theme-light {
    background-color: transparent;
  }
}

.kp--passthrough {
  pointer-events: none;

  .kp__sheet {
    pointer-events: auto;
  }
}

.kp__dim {
  position: absolute;
  inset: 0;
  background: transparent;
  cursor: pointer;
}

.kp__sheet,
.kp__sheet--plain {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 430px;
  background-color: rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 0.96px solid rgba(242, 244, 244, 0.4);
  border-bottom: none;
  border-top-left-radius: 0.85rem;
  border-top-right-radius: 0.85rem;
  padding: 0.68rem 0.53rem 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  box-shadow:
    3.4px 4.3px 6.9px rgba(0, 0, 0, 0.25),
    0 0 8.6px #000 inset,
    2.1px 4.25px 17.2px rgba(242, 242, 242, 0.9) inset;
  overflow: hidden;
  touch-action: manipulation;

  @include theme-light {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: none;
  }
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
  color: var(--c-text);
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

  @include theme-light {
    background: rgba(134, 134, 134, 0.12);
  }
}

.kp__placeholder,
.kp__value {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  line-height: 1.4;
}

.kp__placeholder {
  color: var(--c-text-muted);
}

.kp__value {
  color: var(--c-text);
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
  color: var(--c-text);
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

  @include theme-light {
    background-color: rgba(0, 0, 0, 0.19);
    background-image: none;
    border: 0.71px solid rgba(255, 255, 255, 0.5);
    color: #fff;
  }
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

  @include theme-light {
    background: rgba(134, 134, 134, 0.16);
    color: var(--c-text);
  }
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

:root[data-theme='light'] {
  .kp__sheet,
  .kp__sheet--plain {
    background-color: rgba(116, 116, 116, 0.25);
    backdrop-filter: blur(9.922px);
    -webkit-backdrop-filter: blur(9.922px);
    border-color: rgba(242, 242, 242, 0.4);
    box-shadow:
      3.222px 4.028px 6.445px rgba(0, 0, 0, 0.25),
      inset 1.134px 1.134px 2.268px rgba(242, 242, 242, 0.2);
  }

  .kp__title,
  .kp__value {
    color: rgba(15, 8, 8, 0.85);
  }

  .kp__placeholder {
    color: rgba(15, 8, 8, 0.4);
  }

  .kp__input {
    background: rgba(0, 0, 0, 0.08);
  }

  .kp__key {
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.2) 0%,
      rgba(0, 0, 0, 0.05) 52%,
      rgba(0, 0, 0, 0.23) 100%
    );
    mix-blend-mode: normal;
    color: #000;
  }

  .kp__key::before {
    background: rgba(255, 255, 255, 0.5);
  }

  .kp__key:active {
    background: rgba(0, 0, 0, 0.19);
  }

  .kp__key--accent,
  .kp__key--accent:active {
    background: rgba(5, 194, 151, 0.43);
    mix-blend-mode: normal;
    color: #fff;
  }

  .kp__cancel {
    display: none;
  }

  .kp__confirm {
    background: #05c297 !important;
    flex: 1 0 100% !important;
  }

  .kp__confirm :deep(.primary-btn__text) {
    color: #fbfbfb !important;
  }
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

// Pad / PC：键盘跟随浏览器宽度横向铺开，最大与桌面内容舞台一致。
// 按键高度独立响应视口高度，避免宽屏下按固定宽高比被纵向放得过大。
@media (min-width: 600px) {
  .kp__sheet {
    width: min(100%, 1440px);
    max-width: 1440px;
    max-height: 100vh;
    max-height: 100dvh;
    padding: clamp(12px, 2.5dvh, 26px) clamp(24px, 3.0556vw, 44px)
      clamp(14px, 2.8dvh, 29px);
    gap: clamp(8px, 1.8dvh, 18px);
    border-top-left-radius: clamp(24px, 2.3611vw, 34px);
    border-top-right-radius: clamp(24px, 2.3611vw, 34px);
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .kp__sheet::-webkit-scrollbar {
    display: none;
  }

  .kp__header {
    gap: clamp(6px, 1dvh, 10px);
  }

  .kp__title {
    font-size: clamp(15px, 1.25vw, 18px);
  }

  .kp__input {
    min-height: clamp(42px, 7dvh, 68px);
    padding: clamp(8px, 1.4dvh, 14px) clamp(14px, 1.8056vw, 26px);
    border-radius: clamp(20px, 2.0833vw, 30px);
  }

  .kp__placeholder,
  .kp__value {
    font-size: clamp(17px, 1.6667vw, 24px);
  }

  .kp__grid {
    width: 100%;
    column-gap: clamp(12px, 1.3889vw, 20px);
    row-gap: clamp(6px, 1.2dvh, 14px);
  }

  .kp__key {
    width: 100%;
    height: clamp(36px, 7.5dvh, 68px);
    aspect-ratio: auto;
    border-radius: clamp(14px, 1.5278vw, 22px);
    font-size: clamp(22px, 2.0833vw, 30px);
  }

  .kp__key--accent {
    border-radius: 999px;
  }

  .kp__icon {
    width: clamp(34px, 3.4722vw, 50px);
    height: clamp(22px, 2.2222vw, 32px);
  }

  .kp__actions {
    gap: clamp(12px, 1.3889vw, 20px);
    padding: 0;
    margin-top: 0;
  }

  .kp__cancel,
  :deep(.kp__confirm) {
    height: clamp(42px, 7dvh, 60px);
  }

  .kp__cancel,
  :deep(.kp__confirm .primary-btn__text) {
    font-size: clamp(16px, 1.3889vw, 20px);
  }

  // 数字密码页会让页面本身保持可交互；此状态仅由设置/验证数字密码复用。
  // 将 Teleport 键盘限制在居中的内容舞台内，并按桌面稿固定九宫格几何尺寸。
  .kp--passthrough {
    inset: auto;
    top: 50%;
    left: 50%;
    width: var(--content-stage-width, min(100%, 1440px));
    height: var(--content-stage-height, min(100dvh, 1024px));
    transform: translate(-50%, -50%);
  }

  .kp--passthrough .kp__sheet {
    width: 100%;
    max-width: none;
    max-height: 100%;
    padding: 25px 21px 26px;
    gap: 8px;
    border-top-left-radius: 34px;
    border-top-right-radius: 34px;
  }

  .kp--passthrough .kp__grid {
    column-gap: 6px;
    row-gap: 8px;
  }

  .kp--passthrough .kp__key {
    height: 53px;
    border-radius: 15px;
    font-size: 24px;
  }

  .kp--passthrough .kp__key--accent {
    border-radius: 63px;
  }

  .kp--passthrough .kp__icon {
    width: 34px;
    height: 22px;
  }
}
</style>

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
            <button type="button" class="kp__key" @click="press('0')" @dblclick.prevent>0</button>
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
            <PrimaryButton :text="confirmText" class="kp__confirm" @click="confirm" />
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
  background: rgba(12, 12, 12, 0.6);
  cursor: pointer;
}

.kp__sheet {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 430px;
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(50px);
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

.kp__sheet--plain {
  box-shadow: none;
}

.kp__sheet::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  backdrop-filter: blur(7.6px);
  -webkit-backdrop-filter: blur(7.6px);
  background: rgba(0, 0, 0, 0.2);
  mix-blend-mode: hard-light;
  z-index: 0;

  @include theme-light {
    background: rgba(255, 255, 255, 0.2);
    mix-blend-mode: hard-light;
  }
}

// showBackground=false 时保留原页面作为键盘背景，不强制铺纯白面板。
.kp__sheet--glass {
  @include theme-light {
    box-shadow: none;
  }
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
  width: calc(100% - 0.64rem);
  align-self: center;
  column-gap: 0.153rem;
  row-gap: 0.205rem;
  touch-action: manipulation;
}

.kp__key {
  position: relative;
  aspect-ratio: 100 / 51;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  background-image: url('@/assets/images/wallet/keyboard_numbers_bg.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  border: none;
  border-radius: 0.38rem;
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: 0.61rem;
  color: var(--c-text);
  cursor: pointer;
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
  background: rgba(var(--c-brand-rgb), 0.24);
  background-image: none;
  border: none;
  border-radius: 1.35rem;

  @include theme-light {
    background: rgba(var(--c-brand-rgb), 0.49);
    border: none;
    color: #fff;
  }
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
  flex: 1;
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
}
</style>

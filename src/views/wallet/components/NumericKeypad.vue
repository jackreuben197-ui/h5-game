<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import keypadBgUrl from '@/assets/images/wallet/keyboard_numbers_bg.svg'
import mainBgUrl from '@/assets/images/main_bg.webp'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import { t } from '@/i18n'

interface Props {
  open?: boolean
  min?: number
  max?: number
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  min: 1,
  max: 1000000,
  title: '',
})

const emit = defineEmits<{
  close: []
  submit: [value: number]
}>()

const value = ref('')
const keyBgStyle = {
  backgroundImage: `url(${keypadBgUrl})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: '100% 100%',
}
const digits: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

watch(
  () => props.open,
  (v) => {
    if (v) value.value = ''
  },
)

function press(k: string): void {
  if (value.value.length >= String(props.max).length) return
  if (value.value === '' && k === '0') return
  value.value += k
}

function clearAll(): void {
  value.value = ''
}

function backspace(): void {
  value.value = value.value.slice(0, -1)
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
  <Transition name="keypad">
    <div
      v-if="open"
      class="kp"
      :style="{ backgroundImage: `url(${mainBgUrl})` }"
      @click.self="cancel"
    >
      <div
        class="kp__dim"
        @click="cancel"
      ></div>
      <div class="kp__sheet">
        <div class="kp__header">
          <span class="kp__title">{{ title || t('Wallet_CustomAmount') }}</span>
          <div class="kp__input">
            <span
              v-if="!value"
              class="kp__placeholder"
            >
              {{ t('Wallet_KeypadPlaceholder', min, max) }}
            </span>
            <span
              v-else
              class="kp__value"
            >
              {{ value }}
            </span>
          </div>
        </div>

        <div class="kp__grid">
          <button
            v-for="n in digits"
            :key="n"
            class="kp__key"
            :style="keyBgStyle"
            @click="press(n)"
          >
            {{ n }}
          </button>
          <button
            class="kp__key kp__key--accent"
            @click="clearAll"
          >
            C
          </button>
          <button
            class="kp__key"
            :style="keyBgStyle"
            @click="press('0')"
          >
            0
          </button>
          <button
            class="kp__key kp__key--accent"
            @click="backspace"
          >
            <Icon
              icon="solar:backspace-bold"
              class="kp__icon"
            />
          </button>
        </div>

        <div class="kp__actions">
          <button
            class="kp__cancel"
            @click="cancel"
          >
            {{ t('Wallet_Cancel') }}
          </button>
          <PrimaryButton
            :text="t('Wallet_Confirm')"
            class="kp__confirm"
            @click="confirm"
          />
        </div>
      </div>
    </div>
  </Transition>
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
  background-color: rgba(0, 0, 0, 0.34);
  border: 0.96px solid rgba(242, 242, 242, 0.4);
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
}

.kp__sheet::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  backdrop-filter: blur(7.6px);
  -webkit-backdrop-filter: blur(7.6px);
  background-image: linear-gradient(
    106.9deg,
    rgba(142, 142, 142, 0.3) 3%,
    rgba(103, 103, 103, 0.4) 44%,
    rgba(73, 73, 73, 0.5) 90%
  );
  mix-blend-mode: hard-light;
  z-index: 0;
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
}

.kp__key {
  position: relative;
  aspect-ratio: 100 / 51;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0.38rem;
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: 0.61rem;
  color: #fff;
  cursor: pointer;
}

.kp__key--accent {
  background: rgba(4, 209, 157, 0.24);
  border: none;
  border-radius: 1.35rem;
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
}

.kp__confirm {
  flex: 1;
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

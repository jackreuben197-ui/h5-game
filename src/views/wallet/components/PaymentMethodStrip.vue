<script setup lang="ts">
import { splitWalletLabel } from '@/utils/walletLabel'

export interface PaymentMethod {
  icon: string
  primary: string
  secondary?: string
}

interface Props {
  methods: PaymentMethod[]
  activeIndex?: number
}

withDefaults(defineProps<Props>(), {
  activeIndex: 0,
})

const emit = defineEmits<{
  select: [index: number]
}>()
</script>

<template>
  <div class="strip">
    <button
      v-for="(m, i) in methods"
      :key="i"
      class="method"
      :class="{ 'method--active': activeIndex === i }"
      @click="emit('select', i)"
    >
      <div class="method__coin">
        <img :src="m.icon" alt="" class="method__coin-img" />
      </div>
      <div class="method__label">
        <div class="method__label-row">
          <span
            v-for="(line, lineIndex) in splitWalletLabel(m.primary)"
            :key="`${line}-${lineIndex}`"
            class="method__label-primary"
          >
            {{ line }}
          </span>
          <!-- <span class="method__label-suffix">{{ $txt('Wallet_PaySuffix') }}</span> -->
        </div>
        <span v-if="m.secondary" class="method__label-secondary">
          {{ m.secondary }}
        </span>
      </div>
      <span v-if="activeIndex === i" class="method__check" aria-hidden="true">
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path d="M1 3L3 5L7 1" />
        </svg>
      </span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 0.12rem;
  row-gap: 0.12rem;
  width: 100%;
}

.method {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  min-height: 1.4rem;
  padding: 0.08rem 0.05rem 0.07rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid transparent;
  border-radius: 0.22rem;
  box-sizing: border-box;
  gap: 0.05rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  @include theme-light-own {
    background: var(--wallet-l-surface-soft);
  }
}

.method__coin {
  width: 0.54rem;
  height: 0.54rem;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 0.54rem;
}

.method__coin-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.method__label {
  width: 100%;
  min-width: 0;
  padding: 0;
  background: transparent;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-sizing: border-box;
  position: relative;
  height: 0.64rem;
  flex: 0 0 0.64rem;
  overflow: hidden;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.method__label::before {
  display: none;
}

.method--active {
  border: 1px solid #fa2b4b;
  background: rgba(250, 43, 75, 0.1);

  @include theme-light-own {
    background: rgba(250, 43, 75, 0.1);
  }
}

.method--active .method__label {
  color: #ffffff;
  font-weight: 600;

  @include theme-light-own {
    color: var(--wallet-l-text);
  }
}

.method__label-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.02rem;
  line-height: 0.9;
  white-space: nowrap;
  width: 100%;
}

.method__label-primary {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.28rem;
  text-align: center;
  line-height: 1.1;
  flex: 0 0 auto;
}

.method__label-suffix {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.225rem;
}

.method__label-secondary {
  font-family: var(--wallet-font-num);
  font-weight: 500;
  font-size: 0.23rem;
  line-height: 1.4;
}

.method__check {
  position: absolute;
  right: -1px;
  bottom: -1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.28rem;
  height: 0.28rem;
  border-top-left-radius: 0.16rem;
  border-bottom-right-radius: 0.18rem;
  background: #fa2b4b;
  z-index: 3;

  svg {
    width: 0.16rem;
    height: 0.12rem;
    stroke: #ffffff;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}
</style>

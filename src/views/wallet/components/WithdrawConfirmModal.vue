<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import PopupCloseButton from './PopupCloseButton.vue'

const props = defineProps<{
  show: boolean
  originalAmount: number
  calculatedAmount: number
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const serviceFeePercentage = computed(() => {
  if (!props.originalAmount) return '0'
  return (100 - (props.calculatedAmount / props.originalAmount) * 100).toFixed(2)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="wcm-fade">
      <div v-if="show" class="wcm-overlay" @click.self="emit('close')">
        <div class="wcm-card">
          <div class="wcm-card__inner">
            <!-- Header -->
            <div class="wcm-header">
              <h2 class="wcm-title">{{ $txt('Wallet_ConfirmWithdraw') || '确认提款' }}</h2>
              <span class="wcm-fee-tag">
                {{ $txt('Wallet_ServiceFee') || '手续费' }}
                {{ serviceFeePercentage }}%
              </span>
              <PopupCloseButton @close="emit('close')" />
            </div>

            <!-- Divider -->
            <div class="wcm-divider"></div>

            <!-- Amount block -->
            <div class="wcm-amount-block">
              <div class="wcm-amount-row">
                <span class="wcm-amount-label">{{ $txt('Wallet_WithdrawAmount') || '提款金额' }}</span>
                <span class="wcm-amount-value wcm-amount-value--original">{{ originalAmount.toLocaleString() }}</span>
              </div>
              <div class="wcm-amount-row">
                <span class="wcm-amount-label">{{ $txt('Wallet_ActualArrival') || '实际到账' }}</span>
                <span class="wcm-amount-value wcm-amount-value--final">{{ calculatedAmount.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="wcm-actions">
              <button class="wcm-btn wcm-btn--cancel" @click="emit('close')">
                {{ $txt('Wallet_Cancel') || '取消' }}
              </button>
              <button class="wcm-btn wcm-btn--confirm" @click="emit('confirm')">
                {{ $txt('Wallet_Confirm') || '确认' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.wcm-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(20px, 7vw, 28px);
  background: rgba(23, 23, 23, 0.70);

  @include theme-light-own {
    background: rgba(12, 12, 12, 0.6);
  }
}

.wcm-card {
  position: relative;
  z-index: 1;
  width: min(8.48rem, 317px);
  padding: 0.42rem 0.41rem;
  border: 0.026rem solid rgba(242, 242, 242, 0.4);
  border-radius: 0.97rem;
  box-shadow:
    3.4px 4.3px 6.9px rgba(0, 0, 0, 0.25),
    0 0 8.6px #000 inset,
    2.1px 4.25px 17.2px rgba(242, 242, 242, 0.9) inset;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    backdrop-filter: blur(7.58px);
    -webkit-backdrop-filter: blur(7.58px);
    pointer-events: none;
    z-index: 0;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.026rem;
    background: linear-gradient(180deg, rgba(242, 242, 242, 0.40) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.50) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  // Светлая тема: то же стекло, что и у модалки логина (light-panel).
  @include theme-light-own {
    @include light-panel($radius: 0.97rem);
  }
}

.wcm-card__inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.48rem;
}

.wcm-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wcm-header .wcm-title {
  margin-right: auto;
  flex-shrink: 0;
  white-space: nowrap;
}

.wcm-header .wcm-fee-tag {
  white-space: nowrap;
}

.wcm-title {
  margin: 0;
  background: linear-gradient(180deg, #fff 0%, #e6e6e6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.43rem;
  font-weight: 600;
  line-height: 78%;

  @include theme-light-own {
    background: none;
    -webkit-text-fill-color: #fff;
    color: #fff;
  }
}

.wcm-fee-tag {
  color: rgba(255, 255, 255, 0.7);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.3rem;
  font-weight: 400;
}

.wcm-divider {
  width: 100%;
  height: 1px;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.3) 50%, transparent 50%);
  background-size: 10px 1px;
}

.wcm-amount-block {
  display: flex;
  flex-direction: column;
  gap: 0.26rem;
  padding: 0.32rem 0.2rem;
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.08) 21%, rgba(230, 230, 230, 0.08) 71%);
  border-radius: 0.5rem;

  // Плашка с суммой одинаково тёмная в обеих темах (см. макет).
  @include theme-light-own {
    background: linear-gradient(97deg, #1f1f1f 21%, #191919 71%);
  }
}

.wcm-amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wcm-amount-label {
  color: rgba(255, 255, 255, 0.65);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.32rem;
  font-weight: 400;
}

.wcm-amount-value {
  font-family: 'Keania One', var(--wallet-font-num);
  font-size: 0.46rem;
  font-weight: 400;

  &--original {
    color: #fff;
  }

  &--final {
    color: var(--primary, #05c297);
    text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    font-size: 0.56rem;
  }
}

.wcm-actions {
  display: flex;
  gap: 0.32rem;
}

.wcm-btn {
  flex: 1;
  height: 1.44rem;
  border-radius: 1.06rem;
  font-size: 0.4rem;
  font-weight: 500;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  cursor: pointer;
  border: none;
  color: #fff;
  transition: opacity 0.15s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.92;
    transform: scale(0.985);
  }

  &--cancel {
    background: rgba(0, 0, 0, 0.30);
    backdrop-filter: blur(0.05px);
  }

  &--confirm {
    position: relative;
    color: rgba(120, 228, 144, 1);
    background: linear-gradient(97deg, rgba(255, 255, 255, 0.1) 21%, rgba(230, 230, 230, 0.1) 71%);
    box-shadow:
      inset 1px 1px 0px rgba(242, 242, 242, 0.8),
      inset -1px -1px 0px rgba(255, 255, 255, 0.5);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1.34px;
      background: linear-gradient(135deg, rgba(242, 242, 242, 0.8) 0%, rgba(255, 255, 255, 0) 44.5%, rgba(255, 255, 255, 0.5) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    @include theme-light-own {
      background: var(--wallet-l-accent);
      box-shadow: none;
      color: var(--wallet-l-on-accent);

      &::before {
        display: none;
      }
    }
  }
}

.wcm-fade-enter-active,
.wcm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.wcm-fade-enter-from,
.wcm-fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import PopupCloseButton from './PopupCloseButton.vue'
import dayjs from 'dayjs'
import type { ClubFundOrderListOrderInfo } from '@/api/models/order'
import { t } from '@/i18n'

const props = defineProps<{
  order: ClubFundOrderListOrderInfo
}>()

const emit = defineEmits<{
  close: []
  cancel: []
  continue: [order: ClubFundOrderListOrderInfo]
}>()

const formattedDate = computed(() => {
  if (!props.order.create_time) return ''
  return dayjs(props.order.create_time).format('YYYY-MM-DD HH:mm:ss')
})

// Display amount: prioritize pay_price, then gold_num/100
const displayAmount = computed(() => {
  if (props.order.pay_price != null) return props.order.pay_price
  return (props.order.gold_num ?? 0) / 100
})

function onCancel(): void {
  emit('cancel')
}

function onContinue(): void {
  emit('continue', props.order)
}
</script>

<template>
  <Teleport to="body">
    <div
      class="overlay"
      :style="{ backgroundImage: `url(${sharpBgUrl})` }"
      @click.self="onCancel"
    >
      <div class="card" :style="{ backgroundImage: `url(${sharpBgUrl})` }">
        <PopupCloseButton absolute @close="onCancel" />
        <div class="card__inner">
          <!-- Header -->
          <div class="card__header">
            <h2 class="card__title">{{ t('UIRechargeUC_NoCompleteTitle') }}</h2>
          </div>

          <!-- Notice -->
          <p class="card__notice">{{ t('UIRechargeUC_NoCompleteContent') }}<br />{{ t('UIWallet_ConfirmOf') }}?</p>

          <!-- Order Info Card -->
          <div class="order-info-card">
            <div class="info-row">
              <span class="label">{{ t('uititleOreder001') }}</span>
              <span class="value order-no-badge">{{ order.order_no }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('Uimine_ptcz_paygold') }}</span>
              <span class="value amount-text">{{ displayAmount }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('TimeItem') }}</span>
              <span class="value">{{ formattedDate }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="card__actions">
            <button class="btn btn--cancel" @click="onCancel">{{ t('adaptation10013') }}</button>
            <button class="btn btn--continue" @click="onContinue">{{ t('UIWallet_Text11') }}</button>
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
  padding: 20px;
  background: var(--c-overlay);

  @include theme-light-own {
    background: rgba(12, 12, 12, 0.6);
    background-image: none !important;
  }
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
  border-radius: 36.4px;
  box-shadow:
    3.4px 4.3px 6.9px rgba(0, 0, 0, 0.25),
    0 0 8.6px #000 inset,
    2.1px 4.25px 17.2px rgba(242, 242, 242, 0.9) inset;
  overflow: hidden;
  background-image: url('@/assets/images/wallet/bg_sharp.webp');
  background-size: cover;
  background-position: center;

  // Светлая тема: то же стекло, что и у модалки логина (light-panel), без растровой подложки.
  @include theme-light-own {
    @include light-panel;

    background-image: none !important;
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
  backdrop-filter: blur(7.58px);
  -webkit-backdrop-filter: blur(7.58px);
  pointer-events: none;
  z-index: 1;

  @include theme-light-own {
    background: rgba(135, 134, 134, 0.032) !important;
    backdrop-filter: blur(0.58px) !important;
    -webkit-backdrop-filter: blur(0.58px) !important;
  }
}

.card__inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.card__header {
  margin-bottom: 22px;
  text-align: center;
}

.card__title {
  color: var(--c-text);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 19px;
  font-weight: 500;
  letter-spacing: 0.32px;
  margin: 0;
}

.card__notice {
  color: var(--c-text);
  text-align: center;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.order-info-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 22px;

}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: var(--c-text);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 14px;
}

.value {
  color: var(--c-text);
  font-family: var(--wallet-font-num, 'SF Pro');
  font-size: 14px;
  font-weight: 600;
}

.order-no-badge {
  display: flex;
  padding: 2px 6px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: 25px;
  background: rgba(44, 45, 45, 0.31);
  background-blend-mode: color-burn;
  font-size: 13px;

}

.amount-text {
  font-size: 16px;
}

.card__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.btn {
  display: flex;
  height: 53.843px;
  padding: 4.751px 0;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1 0 0;
  border-radius: 39.59px;
  border: none;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:active {
  opacity: 0.8;
}

.btn--cancel {
  justify-content: center;
  border-radius: 39.59px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(0.0527px);
  color: #fff;

}

.btn--continue {
  position: relative;
  background: linear-gradient(128deg, #05c297 0%, #06C98E 100%);
  backdrop-filter: blur(0.1584px);
  color: #fff;

  @include theme-light-own {
    background: var(--wallet-l-accent);
    color: var(--wallet-l-on-accent);
  }
}

.btn--continue::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.5px;
  background: linear-gradient(
    180deg,
    rgba(242, 242, 242, 0.8) 0%,
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
</style>

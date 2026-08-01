<script setup lang="ts">
import { computed } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import PopupCloseButton from './PopupCloseButton.vue'
import { t } from '@/i18n'

const props = defineProps<{
  goldCount: number
  rate: number
  feeRate: number
  feeType?: number
  discount?: number
}>()

const emit = defineEmits<{
  close: []
  submit: [payPrice: number]
}>()

const walletStore = useWalletStore()

const feeDisplay = computed(() => {
  if ((props.discount ?? 0) > 0) {
    return '-' + ((props.discount ?? 0) * 100).toFixed(2).replace(/\.00$/, '') + '%'
  }
  return props.feeRate > 0 ? (props.feeRate * 100).toFixed(2).replace(/\.00$/, '') + '%' : '0'
})

const payPrice = computed(() =>
  walletStore.calculateCustomerServicePrice(
    props.goldCount,
    props.rate || 1,
    props.feeRate || 0,
    props.discount || 0,
  ),
)
</script>

<template>
  <Teleport to="body">
    <div
      class="overlay"

      @click.self="emit('close')"
    >
      <!-- :style="{ backgroundImage: `url(${sharpBgUrl})` }" -->
      <div class="card" >
        <!-- :style="{ backgroundImage: `url(${sharpBgUrl})` }" -->
        <div class="card__inner">
          <!-- Header -->
          <div class="card__header">
            <h2 class="card__title">{{ t('UIMineMallUSDTShopPayDialogSurePay') }}</h2>
            <div class="card__header-info">
              <span>{{ t('UIMine_WalletPlatform_fee_s') }}：{{ feeDisplay }}</span>
              <span>{{ t('UIWallet_Current') }}：1{{ t('UC') }}={{ props.rate || 1 }}USDT</span>
            </div>
            <PopupCloseButton @close="emit('close')" />
          </div>

          <!-- Divider -->
          <div class="card__divider"></div>

          <!-- Amount -->
          <div class="amount-row">
            <span class="amount-value">
              {{
                payPrice.toLocaleString(undefined, {
                  useGrouping: false,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }}
            </span>
          </div>

          <!-- Label -->
          <p class="confirm-label">{{ t('UIMineMallUSDTShopPayDialogSurePay') }}</p>

          <!-- Actions -->
          <div class="actions">
            <button class="btn-cancel" @click="emit('close')">{{ t('adaptation10013') }}</button>
            <button class="btn-pay" @click="emit('submit', payPrice)">{{ t('UIMineMallUSDTShopDiamondPayTip') }}</button>
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
  padding: clamp(20px, 7vw, 28px);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
   background: rgba(23, 23, 23, 0.70);

  @include theme-light-own {
    background: rgba(12, 12, 12, 0.6);
  }
}

.overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  // backdrop-filter: blur(34px);
  // -webkit-backdrop-filter: blur(34px);
  // background: rgba(12, 12, 12, 0.60);
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
  border-radius: clamp(28px, 10vw, 36.4px);
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
  background: rgba(0, 0, 0, 0.5);
  box-shadow:
    0.0919rem 0.1149rem 0.1838rem 0 rgba(0, 0, 0, 0.25),
    0 0 0.2298rem 0 #000 inset,
    0.0566rem 0.1132rem 0.4596rem 0 rgba(242, 242, 242, 0.9) inset;
  backdrop-filter: blur(7.580729961395264px);
  -webkit-backdrop-filter: blur(7.580729961395264px);
  pointer-events: none;
  z-index: 1;

}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.0255rem;
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
}

.card__inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: 18.116px;
}

.card__header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card__header .card__title {
  margin-right: auto;
  flex-shrink: 0;
  white-space: nowrap;
}

.card__header .card__header-info {
  white-space: nowrap;
}

.card__title {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(230, 230, 230, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 16px;
  font-weight: 600;
  line-height: 78%;
  letter-spacing: 0.32px;
  margin: 0;
}

.card__header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.card__header-info span {
  color: var(--c-text);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 11px;
  font-weight: 400;
  line-height: 78%;
  letter-spacing: 0.22px;
}

.card__divider {
  width: 100%;
  height: 1px;
  background-image: linear-gradient(to right, var(--c-divider) 50%, transparent 50%);
  background-size: 10px 1px;
  margin: 0;
}

.amount-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-self: stretch;
  height: 45.58px;
  padding: 17px 5.804px;
  gap: 11.608px;
  margin: 0 -15.399px 0;
  background: linear-gradient(
    97deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  );

  // Полоса с суммой одинаково тёмная в обеих темах (см. макет).
  @include theme-light-own {
    background: linear-gradient(97deg, #1f1f1f 21.11%, #191919 71.43%);
  }
}

.amount-value {
  color: var(--primary, var(--c-brand));
  text-align: center;
  font-feature-settings:
    'liga' off,
    'clig' off;
  text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  font-family: 'Keania One';
  font-size: 29.361px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
}

.confirm-label {
  display: flex;
  width: 286.232px;
  height: 27px;
  flex-direction: column;
  justify-content: center;
  color: var(--c-text);
  text-align: center;
  font-feature-settings:
    'liga' off,
    'clig' off;
  font-family: 'HONOR Sans CN';
  font-size: 19.324px;
  font-style: normal;
  font-weight: 500;
  line-height: 140%;
  margin: 0;
}

.actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  align-self: stretch;
}

.btn-cancel,
.btn-pay {
  flex: 1;
  height: 53.843px;
  border-radius: 39.59px;
  font-size: 0.5rem;
  font-weight: 500;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  cursor: pointer;
  border: none;
  color: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4.751px 0;
  transition:
    opacity 0.15s,
    transform 0.15s;

  &:active {
    opacity: 0.92;
    transform: scale(0.985);
  }
}

.btn-cancel {
  justify-content: center;
  background: var(--secondary-button-fill, rgba(0, 0, 0, 0.3));
  backdrop-filter: blur(0.05274080112576485px);
  border: none;

}

.btn-pay {
    color: rgba(120, 228, 144, 1);
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.1) 21.11%, rgba(230, 230, 230, 0.1) 71.43%) !important;
  box-shadow:
    inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5);

  @include theme-light-own {
    background: var(--wallet-l-accent) !important;
    box-shadow: none;
    color: var(--wallet-l-on-accent);

    &::before {
      display: none;
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.34px;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
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
}
</style>

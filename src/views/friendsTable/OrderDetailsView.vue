<script setup lang="ts">
import { computed } from 'vue'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import { t } from '@/i18n'

const props = defineProps<{ orderId: string }>()
const emit = defineEmits<{ close: [] }>()

interface Row {
  label: string
  value: string
}

const rows = computed<Row[]>(() => [
  { label: t('Wallet_OrderId'), value: props.orderId || '87sdf55dfsd' },
  { label: t('Wallet_OrderAmount'), value: '100.01' },
  { label: t('Wallet_OrderFee'), value: '0' },
  { label: t('Wallet_OrderPayAmount'), value: '13.8014' },
  { label: t('Wallet_OrderPayAddr'), value: '56677' },
  { label: t('Wallet_OrderRecvName'), value: '唯一金额' },
  { label: t('Wallet_OrderRecvAddr'), value: '5sd6654ddfdf' },
  { label: t('Wallet_OrderTime'), value: '2025-11-12 15:14:09' },
  { label: t('Wallet_OrderStatus'), value: t('Wallet_StatusPending') },
])

function close(): void {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
  <div
    class="overlay"
    :style="{ backgroundImage: `url(${sharpBgUrl})` }"
    @click.self="close"
  >
    <div class="card" :style="{ backgroundImage: `url(${sharpBgUrl})` }">
      <!-- <div class="card__bg" ></div> -->
      <h2 class="card__title">{{ t('Wallet_OrderTitle') }}</h2>
      <div class="card__rows">
        <div
          v-for="r in rows"
          :key="r.label"
          class="card__row"
        >
          <span class="card__key">{{ r.label }}</span>
          <span class="card__val">{{ r.value }}</span>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<style scoped lang="scss">
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
}

.overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  backdrop-filter: blur(34px);
  -webkit-backdrop-filter: blur(34px);
  // background: rgba(0, 0, 0, 0.15);
  background: rgba(12, 12, 12, 0.60);
}

.card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: clamp(280px, 84.5vw, 317px);
  padding: clamp(14px, 4.6vw, 17px);
  border: 0.96px solid rgba(242, 242, 242, 0.4);
  border-radius: clamp(28px, 10vw, 36.4px);
  box-shadow:
    3.4px 4.3px 6.9px rgba(0, 0, 0, 0.25),
    0 0 8.6px #000 inset,
    2.1px 4.25px 17.2px rgba(242, 242, 242, 0.9) inset;
  display: flex;
  flex-direction: column;
  gap: clamp(14px, 5vw, 18px);
  overflow: hidden;
}

// .card__bg {
//   position: absolute;
//   inset: -12px;
//   background-size: cover;
//   background-position: center;
//   background-attachment: fixed;
//   filter: blur(10px);
//   pointer-events: none;
//   z-index: 0;
// }

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(0, 0, 0, 0.28);
  background: rgba(0, 0, 0, 0.70);
   box-shadow:
    0.0919rem 0.1149rem 0.1838rem 0 rgba(0, 0, 0, 0.25),
    0 0 0.2298rem 0 #000 inset,
    0.0566rem 0.1132rem 0.4596rem 0 rgba(242, 242, 242, 0.90) inset;
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
    background: linear-gradient(180deg, rgba(242, 242, 242, 0.40) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.50) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;

}
.card__title,
.card__rows {
  position: relative;
  z-index: 2;
}

.card__title {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: clamp(16px, 5.15vw, 19.3px);
  color: #fff;
  text-align: center;
  line-height: 1.4;
  margin: 0;
}

.card__rows {
  display: flex;
  flex-direction: column;
  gap: clamp(11px, 4vw, 15px);
}

.card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card__key,
.card__val {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: clamp(13px, 4vw, 15px);
  line-height: 0.78;
  color: #fff;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
</style>

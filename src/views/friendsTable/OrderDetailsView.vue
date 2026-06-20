<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import type { ClubPlayerOrderRecordOrderInfo } from '@/api/models/order'

const props = defineProps<{ order: ClubPlayerOrderRecordOrderInfo }>()
const emit = defineEmits<{ close: [] }>()

interface Row {
  label: string
  value: string
}

function statusLabel(status?: number): string {
  const map: Record<number, string> = {
    1: t('Wallet_StatusPending'),
    2: t('Wallet_StatusApproved'),
    3: t('Wallet_StatusRejected'),
    4: t('Wallet_StatusCancelled'),
  }
  return map[status ?? 0] ?? '-'
}

function formatTime(raw?: string): string {
  if (!raw) return '-'
  return raw.replace('T', ' ').slice(0, 19)
}

const rows = computed<Row[]>(() => [
  { label: t('Wallet_OrderId'),     value: props.order.order_no ?? '-' },
  { label: t('Wallet_OrderAmount'), value: String(props.order.gold_num ?? '-') },
  { label: t('Wallet_OrderPayAmount'), value: String(props.order.amount ?? '-') },
  { label: t('Wallet_OrderTime'),   value: formatTime(props.order.create_time) },
  { label: t('Wallet_OrderStatus'), value: statusLabel(props.order.status) },
])

function close(): void {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="overlay"
      @click.self="close"
    >
      <div class="card">
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
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background: rgba(12, 12, 12, 0.15);
}

.card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: clamp(280px, 84.5vw, 317px);
  padding: clamp(14px, 4.6vw, 17px);
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  border-radius: clamp(28px, 10vw, 36.4px);
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
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
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { t } from '@/i18n'
import type { ClubPlayerOrderRecordOrderInfo } from '@/api/models/order'
import { postOrderClubOrderDetailApi } from '@/api/order'
import { generateQrCodeUrl } from '@/utils/qrcode'
import { formatDateTime } from '@/utils/time'

const props = defineProps<{ order: ClubPlayerOrderRecordOrderInfo; withdraw?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const detail = ref<Record<string, any>>({ ...props.order })
const qrCodeUrl = ref('')
const showFullQr = ref(false)

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
  return formatDateTime(raw, 'YYYY-MM-DD HH:mm:ss')
}

function orderValue(...keys: string[]): string {
  for (const key of keys) {
    const value = detail.value[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value)
    }
  }
  return '-'
}

function isImageSource(value: string): boolean {
  return /^data:image\//i.test(value) || /\.(png|jpe?g|gif|svg|webp|bmp)(\?|$)/i.test(value)
}

const isPending = computed(() => Number(detail.value.status) === 1)

async function loadDetail() {
  if (props.order.order_no) {
    try {
      const res = await postOrderClubOrderDetailApi(
        { order_no: props.order.order_no },
        { suppressBusinessToast: true },
      )
      if (res.code === 0 && res.data?.order_detail) {
        detail.value = { ...props.order, ...res.data.order_detail }
      }
    } catch (e) {
      console.error('Failed to load order detail', e)
    }
  }

  if (!isPending.value) {
    qrCodeUrl.value = ''
    return
  }

  const direct = String(detail.value.qrcode ?? detail.value.qr_code ?? detail.value.pay_type_qr_code ?? '')
  if (direct && isImageSource(direct)) {
    qrCodeUrl.value = direct
  } else {
    const link = direct || detail.value.payment_url || detail.value.pay_url || detail.value.pay_type_address || detail.value.pay_address || ''
    if (link) {
      try {
        qrCodeUrl.value = await generateQrCodeUrl(link, { size: 400, margin: 2 })
      } catch {
        qrCodeUrl.value = ''
      }
    }
  }
}

onMounted(loadDetail)

const payPriceVal = computed(() => {
  return detail.value.pay_price ?? detail.value.amount ?? '-'
})

const rows = computed<Row[]>(() => [
  { label: t('Wallet_OrderId'), value: detail.value.order_no ?? '-' },
  {
    label: t(props.withdraw ? 'Wallet_OrderAmountWithdraw' : 'Wallet_OrderAmount'),
    value: detail.value.gold_num != null ? String(detail.value.gold_num / 100) : '-',
  },
  { label: t('UIMine_WalletPlatform_fee_s'), value: orderValue('fee', 'fee_amount', 'service_fee', 'pay_price_fee') },
  {
    label: t(props.withdraw ? 'UITribeRechargeUSDTRecord_WithdrawGold' : 'Wallet_OrderPayAmount'),
    value: String(payPriceVal.value),
  },
  { label: t('UICommon_PayAddress'), value: orderValue('pay_address', 'pay_type_address', 'from_address') },
  { label: t('UITribeRechargeUSDTShopPayeetNameTip'), value: orderValue('name', 'payee_name', 'receive_name') },
  { label: t('UICommon_ReceiveAddress'), value: orderValue('receive_address', 'to_address', 'dest_address') },
  { label: t(props.withdraw ? 'Wallet_OrderTimeWithdraw' : 'Wallet_OrderTime'), value: formatTime(detail.value.create_time) },
  { label: t('Wallet_OrderStatus'), value: statusLabel(detail.value.status) },
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
        <h2 class="card__title">{{ t('Wallet_OrderTitle') }}</h2>

        <div v-if="isPending && qrCodeUrl" class="card__qr" @click="showFullQr = true">
          <img :src="qrCodeUrl" alt="Order QR Code" class="card__qr-img" />
          <span class="card__qr-tip">{{ t('UIWallet_QrPayTip') || 'Click to view QR code' }}</span>
        </div>

        <div class="card__rows">
          <div v-for="r in rows" :key="r.label" class="card__row">
            <span class="card__key">{{ r.label }}</span>
            <span class="card__val">{{ r.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Zoomed QR Overlay -->
    <div v-if="showFullQr && qrCodeUrl" class="qr-zoom-overlay" @click="showFullQr = false">
      <div class="qr-zoom-card">
        <img :src="qrCodeUrl" alt="QR Code Full" class="qr-zoom-img" />
        <p class="qr-zoom-tip">{{ t('UIWallet_QrPayTip') }}</p>
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
  background: var(--c-overlay);
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
.card__title,
.card__qr,
.card__rows {
  position: relative;
  z-index: 2;
}

.card__qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.card__qr-img {
  width: 90px;
  height: 90px;
  border-radius: 8px;
  background: #fff;
  padding: 4px;
  object-fit: contain;
}

.card__qr-tip {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.qr-zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-zoom-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-zoom-img {
  width: 220px;
  height: 220px;
  background: #fff;
  border-radius: 12px;
  padding: 8px;
  object-fit: contain;
}

.qr-zoom-tip {
  color: #fff;
  font-size: 12px;
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
  flex-wrap: wrap;
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

.card__val {
  margin-left: auto;
  text-align: right;
}
</style>

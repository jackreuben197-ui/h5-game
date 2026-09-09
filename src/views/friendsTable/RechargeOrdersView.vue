<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import TogglePillGroup from '@/components/wallet/TogglePillGroup.vue'
import RecordItem from '@/components/wallet/RecordItem.vue'
import OrderDetailsView from './OrderDetailsView.vue'
import OnlinePaymentPopup from '@/views/wallet/components/OnlinePaymentPopup.vue'
import UsdtPaymentDetailsPopup from '@/views/wallet/components/UsdtPaymentDetailsPopup.vue'
import { t } from '@/i18n'
import {
  postClubFundOrderListApi,
  postClubPlayerOrderRecordApi,
  postOrderUserClubOrderCancelApi,
  postOrderClubOrderDetailApi,
} from '@/api/order'
import type { ClubFundOrderListOrderInfo, ClubPlayerOrderRecordOrderInfo } from '@/api/models/order'
import type { PropGoldPriceListPayType } from '@/api/models/prop'
import { useWalletStore } from '@/stores/wallet'
import { useAppConfigStore } from '@/stores/appConfig'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import { generateQrCodeUrl } from '@/utils/qrcode'
import { toTimestampMs } from '@/utils/time'
import { openCsOrderChat } from '@/components/GlobalCsOrderFloat/channel'

type PendingPaymentKind = 'online' | 'usdt'

interface PendingPayment {
  kind: PendingPaymentKind
  order: ClubFundOrderListOrderInfo
  payType?: PropGoldPriceListPayType
  qrCode: string
  timeLeft?: number
}

const PAYMENT_WINDOW_SECONDS = 900

const walletStore = useWalletStore()
const appConfigStore = useAppConfigStore()

const activeTab = ref(0)
const selectedOrder = ref<ClubPlayerOrderRecordOrderInfo | null>(null)
const orders = ref<ClubPlayerOrderRecordOrderInfo[]>([])
const ordersFromClubList = ref(false)
const loading = ref(false)
const pendingPayment = ref<PendingPayment | null>(null)

const tabs = [t('Wallet_OrdersDeposit'), t('Wallet_OrdersWithdraw')]

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
  return raw.replace('T', ' ').slice(0, 16)
}

// 联盟币金额（gold_num）后端单位为分，展示需 /100；支付金额（pay_price/amount）已是展示单位
function goldAmount(o: ClubPlayerOrderRecordOrderInfo): number {
  return (o.gold_num ?? 0) / 100
}

function payAmount(o: ClubPlayerOrderRecordOrderInfo): number {
  const r = o as { pay_price?: number; amount?: number }
  return r.pay_price ?? r.amount ?? 0
}

function mapClubFundOrderToRecord(
  row: ClubFundOrderListOrderInfo,
  order_type: number,
): ClubPlayerOrderRecordOrderInfo {
  const amount = typeof row.amount === 'number' ? row.amount : (row.pay_price ?? row.dest_amount)
  return {
    ...row,
    order_type,
    amount,
  }
}

async function loadOrders(): Promise<void> {
  loading.value = true
  selectedOrder.value = null
  pendingPayment.value = null
  try {
    if (!walletStore.goldPriceData) {
      await walletStore.loadPriceList().catch(() => {})
    }
    const order_type = activeTab.value === 0 ? 1 : 2
    const limit = 20
    const offset = 0
    const tribeDirect = walletStore.goldPriceData?.from_tribe === true
    if (tribeDirect || isPrivateDomainMode()) {
      const clubRes = await postClubFundOrderListApi({
        my_order: true,
        order_type,
        limit,
        offset,
      })
      if (clubRes.code === 0) {
        const list = clubRes.data?.list ?? []
        orders.value = list.map((row) => mapClubFundOrderToRecord(row, order_type))
        ordersFromClubList.value = true
        return
      }
    }

    const userRes = await postClubPlayerOrderRecordApi({
      order_type,
      limit,
      offset,
    })
    orders.value = userRes.data?.list ?? []
    ordersFromClubList.value = false
  } finally {
    loading.value = false
  }
}

function isPendingDeposit(order: ClubPlayerOrderRecordOrderInfo): boolean {
  return activeTab.value === 0 && Number(order.status) === 1
}

async function resolvePendingOrder(
  order: ClubPlayerOrderRecordOrderInfo,
): Promise<ClubFundOrderListOrderInfo | null> {
  if (ordersFromClubList.value) return order as ClubFundOrderListOrderInfo
  try {
    const res = await postClubFundOrderListApi({
      my_order: true,
      order_type: 1,
      order_no: order.order_no,
      status: 1,
      limit: 20,
      offset: 0,
    })
    if (res.code !== 0) return null
    return res.data?.list?.find((row) => row.order_no === order.order_no) ?? null
  } catch {
    return null
  }
}

function matchPayType(order: ClubFundOrderListOrderInfo): PropGoldPriceListPayType | undefined {
  const payTypes = walletStore.goldPriceData?.pay_types ?? []
  const payId = Number(order.pay_id)
  return (
    payTypes.find((pt) => pt.id != null && pt.id === payId) ??
    payTypes.find((pt) => !!pt.name && pt.name === order.pay_type_name)
  )
}

function pendingPaymentKind(
  order: ClubFundOrderListOrderInfo,
  payType?: PropGoldPriceListPayType,
): PendingPaymentKind | 'cs' {
  const type = payType?.type ?? Number(order.pay_api_type ?? order.api_type ?? order.type)
  const name = String(order.pay_type_name ?? '').toLowerCase()
  if (String(order.pay_type ?? '').toUpperCase() === 'USDT') return 'usdt'
  if (
    type === 3 ||
    name.includes('撮合') ||
    name.includes('客服') ||
    name.includes('cs') ||
    name.includes('service')
  ) {
    return 'cs'
  }
  return type === 1 ? 'usdt' : 'online'
}

function isImageSource(value: string): boolean {
  return /^data:image\//i.test(value) || /\.(png|jpe?g|gif|svg|webp|bmp)(\?|$)/i.test(value)
}

function orderPaymentUrl(order: ClubFundOrderListOrderInfo): string {
  return String(order.payment_url ?? order.pay_url ?? order.payUrl ?? order.qrCode ?? '')
}

async function withPaymentInfo(order: ClubFundOrderListOrderInfo): Promise<ClubFundOrderListOrderInfo> {
  if (!order.order_no) return order
  try {
    const res = await postOrderClubOrderDetailApi(
      { order_no: order.order_no },
      { suppressBusinessToast: true },
    )
    const detail = res.code === 0 ? res.data?.order_detail : undefined
    if (!detail) return order

    const paymentUrl = String(detail.payment_url ?? detail.pay_url ?? order.payment_url ?? '')
    const payAddress = String(detail.pay_type_address ?? detail.pay_address ?? order.pay_type_address ?? order.pay_address ?? '')
    const qrCode = String(detail.qr_code ?? detail.qrcode ?? order.qr_code ?? order.qrcode ?? '')

    return {
      ...order,
      ...detail,
      payment_url: paymentUrl || order.payment_url,
      pay_type_address: payAddress || order.pay_type_address,
      qr_code: qrCode || order.qr_code,
    }
  } catch (e) {
    console.error('Failed to load order payment detail', e)
    return order
  }
}

async function resolveQrCode(order: ClubFundOrderListOrderInfo): Promise<string> {
  const direct = String(order.qrcode ?? order.qr_code ?? order.pay_type_qr_code ?? '')
  if (direct && isImageSource(direct)) return direct
  const link = direct || orderPaymentUrl(order) || order.pay_type_address || ''
  if (!link) return ''
  try {
    return await generateQrCodeUrl(link, { size: 720, margin: 2 })
  } catch {
    return ''
  }
}

function orderCreatedAtMs(raw?: string): number {
  const text = raw?.trim() ?? ''
  if (!text) return 0
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) return toTimestampMs(text)
  const tzHours = Number(appConfigStore.globalConfig?.platform_role_time_zone) || 0
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)) - tzHours * 3600_000
}

function paymentTimeLeft(order: ClubFundOrderListOrderInfo): number | undefined {
  const createdAt = orderCreatedAtMs(order.create_time)
  if (!createdAt) return undefined
  const elapsed = Math.floor((Date.now() - createdAt) / 1000)
  return Math.min(PAYMENT_WINDOW_SECONDS, Math.max(0, PAYMENT_WINDOW_SECONDS - elapsed))
}

async function onRecordClick(order: ClubPlayerOrderRecordOrderInfo): Promise<void> {
  if (!isPendingDeposit(order)) {
    selectedOrder.value = order
    return
  }
  const resolved = await resolvePendingOrder(order)
  if (!resolved) {
    selectedOrder.value = order
    return
  }
  const pending = await withPaymentInfo(resolved)
  const payType = matchPayType(pending)
  const kind = pendingPaymentKind(pending, payType)
  if (kind === 'cs') {
    openCsOrderChat()
    return
  }
  pendingPayment.value = {
    kind,
    order: pending,
    payType,
    qrCode: await resolveQrCode(pending),
    timeLeft: paymentTimeLeft(pending),
  }
}

const pendingPayPrice = computed<number | undefined>(() => {
  const order = pendingPayment.value?.order
  return Number(order?.pay_price ?? order?.amount) || undefined
})

const pendingRate = computed(() => {
  const p = pendingPayment.value
  return p?.payType?.rate ?? (Number(p?.order.exchange_rate) || 1)
})

const pendingFeeRate = computed(() => {
  const p = pendingPayment.value
  return Number(p?.order.fee_rate ?? p?.payType?.fee_rate) || 0
})

const pendingFeeType = computed(() => {
  const p = pendingPayment.value
  return Number(p?.order.fee_type ?? p?.payType?.fee_type) || 0
})

const pendingUsdtPrice = computed(() => {
  const p = pendingPayment.value
  if (pendingPayPrice.value != null || !p) return pendingPayPrice.value ?? 0
  return walletStore.calculateRechargeUsdtPrice(
    Number(p.order.gold_num) || 0,
    pendingRate.value,
    pendingFeeRate.value,
    pendingFeeType.value,
    p.payType?.discount ?? 0,
  ).totalUiPrice
})

const pendingUsdtOrderData = computed(() => {
  const p = pendingPayment.value
  if (!p) return null
  return {
    order_no: p.order.order_no,
    usdt_address: { address: p.order.pay_type_address ?? '', qr_code: p.qrCode },
  }
})

function closePendingPayment(): void {
  pendingPayment.value = null
  void loadOrders()
}

async function cancelPendingOrder(orderNo: string): Promise<void> {
  try {
    const res = await postOrderUserClubOrderCancelApi({ order_no: orderNo })
    if (res.code === 0) closePendingPayment()
  } catch (e) {
    console.error('Cancel order failed', e)
  }
}

watch(activeTab, loadOrders)
onMounted(loadOrders)
</script>

<template>
  <div class="wallet-orders-screen app-scroll-standalone">
    <HeaderBack :title="t('Wallet_OrdersTitle')" extra-padding>
      <template #right>
        <TogglePillGroup v-model="activeTab" :tabs="tabs" />
      </template>
    </HeaderBack>

    <div v-if="!loading && orders.length === 0" class="wallet-orders-empty t-body">
      <AppSvgIcon name="empty-data" class="empty-icon" />
      {{ $txt('Wallet_OrdersEmpty') }}
    </div>
    <div v-else class="list">
      <RecordItem
        v-for="(order, idx) in orders"
        :key="order.order_no ?? String(idx)"
        :type="activeTab === 0 ? t('Wallet_OrderAmountDeposit') : t('Wallet_OrderAmountWithdraw')"
        :amount="goldAmount(order)"
        :pay-amount="payAmount(order)"
        :time="formatTime(order.create_time)"
        :status="statusLabel(order.status)"
        @click="onRecordClick(order)"
      />
    </div>

    <OrderDetailsView v-if="selectedOrder" :order="selectedOrder" @close="selectedOrder = null" />

    <OnlinePaymentPopup
      v-if="pendingPayment?.kind === 'online'"
      :gold-count="Number(pendingPayment.order.gold_num) || 0"
      :rate="pendingRate"
      :fee-rate="pendingFeeRate"
      :fee-type="pendingFeeType"
      :discount="pendingPayment.payType?.discount ?? 0"
      :pay-id="pendingPayment.payType?.id ?? 0"
      :price-id="0"
      :initial-step="2"
      :initial-order-no="pendingPayment.order.order_no ?? ''"
      :initial-qr-code="pendingPayment.qrCode"
      :initial-pay-address="pendingPayment.order.pay_type_address ?? ''"
      :initial-payment-url="orderPaymentUrl(pendingPayment.order)"
      :pay-price="pendingPayPrice"
      :initial-time-left="pendingPayment.timeLeft"
      @close="closePendingPayment"
    />

    <UsdtPaymentDetailsPopup
      v-else-if="pendingPayment?.kind === 'usdt' && pendingUsdtOrderData"
      :order-data="pendingUsdtOrderData"
      :rate="pendingRate"
      :fee-rate="pendingFeeRate"
      :fee-type="pendingFeeType"
      :price="walletStore.formatUsdtPrice(pendingUsdtPrice)"
      :initial-time-left="pendingPayment.timeLeft"
      @close="closePendingPayment"
      @cancel="cancelPendingOrder"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.wallet-orders-screen {
  position: relative;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: var(--c-page);
  background-image: url('@/assets/images/wallet/bg_sharp.webp');

  @include theme-light-own {
    background-image: url('@/assets/images/main_bg_light.webp');

    // Шапка страницы (HeaderBack) на светлом фоне — тёмным.
    :deep(.back-trigger),
    :deep(.back-icon) {
      color: var(--wallet-l-text);
    }

    :deep(.title) {
      text-shadow: none;
    }
  }
}

.wallet-orders-screen::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  backdrop-filter: blur(34px);
  -webkit-backdrop-filter: blur(34px);
  background: rgba(0, 0, 0, 0.15);

  @include theme-light-own {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

.wallet-orders-screen > * {
  position: relative;
  z-index: 1;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.2667rem;
  padding: 0.2667rem 0.4533rem calc(env(safe-area-inset-bottom) + 0.7467rem);
}

.wallet-orders-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0 0.5067rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.65);

  @include theme-light-own {
    color: var(--wallet-l-text-muted);
  }
  .empty-icon {
    width: 1.248rem;
    height: 1.56rem;
    object-fit: contain;

    @include theme-light-own {
      color: var(--wallet-l-accent);
    }
  }
}
</style>

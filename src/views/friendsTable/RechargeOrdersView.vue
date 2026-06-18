<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import TogglePillGroup from '@/components/wallet/TogglePillGroup.vue'
import RecordItem from '@/components/wallet/RecordItem.vue'
import OrderDetailsView from './OrderDetailsView.vue'
import { t } from '@/i18n'
import icNoData from '@/assets/icons/ic_no_data.svg'
import { postClubFundOrderListApi, postClubPlayerOrderRecordApi } from '@/api/order'
import type { ClubFundOrderListOrderInfo, ClubPlayerOrderRecordOrderInfo } from '@/api/models/order'
import { useWalletStore } from '@/stores/wallet'

const walletStore = useWalletStore()

const activeTab = ref(0)
const selectedOrder = ref<ClubPlayerOrderRecordOrderInfo | null>(null)
const orders = ref<ClubPlayerOrderRecordOrderInfo[]>([])
const loading = ref(false)

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

function mapClubFundOrderToRecord(
  row: ClubFundOrderListOrderInfo,
  order_type: number,
): ClubPlayerOrderRecordOrderInfo {
  const amount = typeof row.amount === 'number' ? row.amount : row.pay_price ?? row.dest_amount
  return {
    ...row,
    order_type,
    amount,
  }
}

async function loadOrders(): Promise<void> {
  loading.value = true
  selectedOrder.value = null
  try {
    if (!walletStore.goldPriceData) {
      await walletStore.loadPriceList().catch(() => {})
    }
    const order_type = activeTab.value === 0 ? 1 : 2
    const limit = 20
    const offset = 0
    const tribeDirect = walletStore.goldPriceData?.from_tribe === true
    if (tribeDirect) {
      const clubRes = await postClubFundOrderListApi({
        my_order: true,
        order_type,
        limit,
        offset,
      })
      if (clubRes.code === 0) {
        const list = clubRes.data?.list ?? []
        orders.value = list.map((row) => mapClubFundOrderToRecord(row, order_type))
        return
      }
    }

    const userRes = await postClubPlayerOrderRecordApi({
      order_type,
      limit,
      offset,
    })
    orders.value = userRes.data?.list ?? []
  } finally {
    loading.value = false
  }
}

watch(activeTab, loadOrders)
onMounted(loadOrders)
</script>

<template>
  <div
    class="wallet-orders-screen app-scroll-standalone"
    :style="{ backgroundImage: `url(${sharpBgUrl})` }"
  >
    <HeaderBack :title="t('Wallet_OrdersTitle')" extra-padding>
      <template #right>
        <TogglePillGroup v-model="activeTab" :tabs="tabs" />
      </template>
    </HeaderBack>

    <div v-if="!loading && orders.length === 0" class="wallet-orders-empty t-body">
      <img :src="icNoData" alt="" class="wallet-orders-empty__icon" />
      {{ $txt('Wallet_OrdersEmpty') }}
    </div>
    <div v-else class="list">
      <RecordItem
        v-for="(order, idx) in orders"
        :key="order.order_no ?? String(idx)"
        :type="activeTab === 0 ? t('Wallet_OrderAmountDeposit') : t('Wallet_OrderAmountWithdraw')"
        :amount="order.gold_num ?? 0"
        :pay-amount="order.amount ?? 0"
        :time="formatTime(order.create_time)"
        :status="statusLabel(order.status)"
        @click="selectedOrder = order"
      />
    </div>

    <OrderDetailsView v-if="selectedOrder" :order="selectedOrder" @close="selectedOrder = null" />
  </div>
</template>

<style scoped lang="scss">
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

  &__icon {
    width: 1.2533rem;
    height: 1.5733rem;
  }
}
</style>

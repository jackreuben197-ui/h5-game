<script setup lang="ts">
import { computed, ref } from 'vue'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import AppBar from '@/components/wallet/AppBar.vue'
import TogglePillGroup from '@/components/wallet/TogglePillGroup.vue'
import RecordItem from '@/components/wallet/RecordItem.vue'
import OrderDetailsView from './OrderDetailsView.vue'
import { t } from '@/i18n'

const activeTab = ref(0)
const selectedOrderId = ref<string | null>(null)

interface Record {
  id: string
  type: string
  amount: number
  payAmount: number
  time: string
  status: string
}

const records = computed<Record[]>(() => {
  const typeKey = activeTab.value === 0 ? 'Wallet_OrderAmountDeposit' : 'Wallet_OrderAmountWithdraw'
  return Array.from({ length: 5 }, (_, i) => ({
    id: `rec-${i + 1}`,
    type: t(typeKey),
    amount: 500,
    payAmount: 500,
    time: '25/12/11 11:07',
    status: t('Wallet_StatusCancelled'),
  }))
})

function open(id: string): void {
  selectedOrderId.value = id
}

const tabs = [t('Wallet_OrdersDeposit'), t('Wallet_OrdersWithdraw')]
</script>

<template>
  <div
    class="wallet-orders-screen"
    :style="{ backgroundImage: `url(${sharpBgUrl})` }"
  >
    <AppBar
      :title="t('Wallet_OrdersTitle')"
      :show-actions="false"
    >
      <template #actions>
        <TogglePillGroup
          v-model="activeTab"
          :tabs="tabs"
        />
      </template>
    </AppBar>

    <div class="list">
      <RecordItem
        v-for="r in records"
        :key="r.id"
        v-bind="r"
        @click="open(r.id)"
      />
    </div>

    <OrderDetailsView
      v-if="selectedOrderId"
      :order-id="selectedOrderId"
      @close="selectedOrderId = null"
    />
  </div>
</template>

<style scoped lang="scss">
.wallet-orders-screen {
  position: relative;
  height: 100vh;
  height: 100dvh;
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
  gap: clamp(8px, 2.7vw, 10px);
  padding: clamp(6px, 2vw, 10px) clamp(14px, 4.55vw, 17px) calc(env(safe-area-inset-bottom) + clamp(20px, 6.4vw, 28px));
}

</style>

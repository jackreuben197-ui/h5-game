<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import AppBar from '@/components/wallet/AppBar.vue'
import TogglePillGroup from '@/components/wallet/TogglePillGroup.vue'
import RecordItem from '@/components/wallet/RecordItem.vue'
import { t } from '@/i18n'

const router = useRouter()
const activeTab = ref(0)

interface Record {
  id: string
  type: string
  amount: number
  payAmount: number
  time: string
  status: string
}

const records: Record[] = Array.from({ length: 5 }, (_, i) => ({
  id: `rec-${i + 1}`,
  type: t('Wallet_OrderAmount'),
  amount: 500,
  payAmount: 500,
  time: '25/12/11 11:07',
  status: t('Wallet_StatusCancelled'),
}))

function open(id: string): void {
  void router.push(`/recharge/order/${id}`)
}

const tabs = [t('Wallet_OrdersDeposit'), t('Wallet_OrdersWithdraw')]
</script>

<template>
  <div
    class="wallet-orders-screen"
    :style="{ backgroundImage: `url(${mainBgUrl})` }"
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
  </div>
</template>

<style scoped lang="scss">
.wallet-orders-screen {
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

.list {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 2.7vw, 10px);
  padding: clamp(6px, 2vw, 10px) clamp(14px, 4.55vw, 17px) calc(env(safe-area-inset-bottom) + clamp(20px, 6.4vw, 28px));
}
</style>

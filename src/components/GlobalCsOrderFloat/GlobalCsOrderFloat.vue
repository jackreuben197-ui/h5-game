<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { postChatSupportChannelListApi } from '@/api/chat'
import { useUserInfoStore } from '@/stores/userInfo'
import { useWalletStore } from '@/stores/wallet'
import BellButton from '@/components/Button/BellButton.vue'
import CustomerServiceChatPopup from '@/views/wallet/components/CustomerServiceChatPopup.vue'
import type { ClubFundOrderListOrderInfo } from '@/api/models/order'

const userInfoStore = useUserInfoStore()
const walletStore = useWalletStore()

const hasSeen = ref(false)
const csChatOpen = ref(false)
const csChatProps = ref({ tribeId: 0, supportUserId: 0, orderData: null as any })

const isLoggedIn = computed(() => !!userInfoStore.userInfo?.user?.p_u_id)

const activeCsOrder = computed<ClubFundOrderListOrderInfo | null>(
  () => walletStore.pendingCsRechargeOrder ?? walletStore.pendingCsWithdrawOrder,
)

const shouldShowFloat = computed(
  () => isLoggedIn.value && !!activeCsOrder.value && !csChatOpen.value,
)

watch(activeCsOrder, (next, prev) => {
  if (next && !prev) hasSeen.value = false
})

async function openChat() {
  hasSeen.value = true
  const order = activeCsOrder.value
  if (!order) return

  const qrCode =
    (order as any).qrcode || (order as any).qr_code || (order as any).pay_type_qr_code || ''

  const orderData = {
    order_no: order.order_no,
    gold_num: order.gold_num,
    pay_price: order.pay_price,
    order: {
      order_no: order.order_no,
      amount: order.pay_price,
      gold_num: order.gold_num,
    },
    usdt_address: {
      address: order.pay_type_address || '',
      qr_code: qrCode,
      name: (order as any).pay_type_name || '客服撮合',
    },
  }

  try {
    const res = await postChatSupportChannelListApi({ im_service_types: [4], limit: 1, offset: 0 })
    if (res.code === 0 && res.data?.list?.length) {
      const channel = res.data.list[0]
      csChatProps.value = {
        tribeId: channel.tribe_id || 0,
        supportUserId: channel.support_user_id || 0,
        orderData,
      }
      csChatOpen.value = true
    }
  } catch (e) {
    console.error('[GlobalCsOrderFloat] open chat failed', e)
  }
}

let refreshTimer: number | null = null

function scheduleRefresh() {
  refreshTimer = window.setInterval(() => {
    if (isLoggedIn.value) void walletStore.refreshPendingCsOrder()
  }, 15_000)
}

onMounted(() => {
  if (isLoggedIn.value) void walletStore.refreshPendingCsOrder()
  scheduleRefresh()
})

onBeforeUnmount(() => {
  if (refreshTimer !== null) clearInterval(refreshTimer)
})

watch(isLoggedIn, (val) => {
  if (val) void walletStore.refreshPendingCsOrder()
  else walletStore.clearCsOrders()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="shouldShowFloat" class="cs-order-float">
      <BellButton
        :count="1"
        :show-badge="!hasSeen"
        @click="openChat"
      />
    </div>
    <CustomerServiceChatPopup
      v-if="csChatOpen"
      :tribe-id="csChatProps.tribeId"
      :support-user-id="csChatProps.supportUserId"
      :order-data="csChatProps.orderData"
      @close="csChatOpen = false"
    />
  </Teleport>
</template>

<style scoped lang="scss">
.cs-order-float {
  position: fixed;
  right: 0.3rem;
  top: 52%;
  z-index: 9999;
}
</style>

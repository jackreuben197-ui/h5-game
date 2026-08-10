<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { postChatSupportChannelListApi } from '@/api/chat'
import { useUserInfoStore } from '@/stores/userInfo'
import { useWalletStore } from '@/stores/wallet'
import BellButton from '@/components/Button/BellButton.vue'
import CustomerServiceChatPopup from '@/views/wallet/components/CustomerServiceChatPopup.vue'
import { subscribeCsOrderChat } from './channel'
import type { ClubFundOrderListOrderInfo } from '@/api/models/order'

const userInfoStore = useUserInfoStore()
const walletStore = useWalletStore()

const hasSeen = ref(false)
const csChatOpen = ref(false)
const csChatProps = ref<{ tribeId: number; supportUserId: number; clubId: number | undefined }>({
  tribeId: 0,
  supportUserId: 0,
  clubId: undefined,
})

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
  if (!walletStore.csChatOrders.length) return

  try {
    const res = await postChatSupportChannelListApi({ im_service_types: [4], limit: 1, offset: 0 })
    if (res.code === 0 && res.data?.list?.length) {
      const channel = res.data.list[0]
      csChatProps.value = {
        tribeId: channel.tribe_id || 0,
        supportUserId: channel.support_user_id || 0,
        clubId: channel.club_id,
      }
    } else {
      csChatProps.value = {
        tribeId: 0,
        supportUserId: 0,
        clubId: undefined,
      }
    }
  } catch (e) {
    console.error('[GlobalCsOrderFloat] open chat failed', e)
    csChatProps.value = {
      tribeId: 0,
      supportUserId: 0,
      clubId: undefined,
    }
  } finally {
    csChatOpen.value = true
  }
}

let refreshTimer: number | null = null
let stopOpenListener: (() => void) | null = null

// 外部（创建订单后）触发：刷新待处理订单后打开同一个浮动聊天，展示全部订单。
async function openFromExternal() {
  if (isLoggedIn.value) await walletStore.refreshPendingCsOrder()
  await openChat()
}

function scheduleRefresh() {
  refreshTimer = window.setInterval(() => {
    if (isLoggedIn.value) void walletStore.refreshPendingCsOrder()
  }, 15_000)
}

onMounted(() => {
  if (isLoggedIn.value) void walletStore.refreshPendingCsOrder()
  scheduleRefresh()
  stopOpenListener = subscribeCsOrderChat(() => {
    void openFromExternal()
  })
})

onBeforeUnmount(() => {
  if (refreshTimer !== null) clearInterval(refreshTimer)
  stopOpenListener?.()
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
        :count="walletStore.pendingCsOrderCount"
        :show-badge="!hasSeen"
        @click="openChat"
      />
    </div>
    <CustomerServiceChatPopup
      v-if="csChatOpen"
      :tribe-id="csChatProps.tribeId"
      :support-user-id="csChatProps.supportUserId"
      :club-id="csChatProps.clubId"
      :orders="walletStore.csChatOrders"
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

  :deep(.bell-wrapper) {
    position: relative;
  }
}
</style>

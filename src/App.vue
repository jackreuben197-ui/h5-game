<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { H5_LOGIN_CONTEXT } from '@bridge-protocol'
import GlobalCsOrderFloat from '@/components/GlobalCsOrderFloat/GlobalCsOrderFloat.vue'
import TelegramClubJoinModal from '@/components/Dialog/TelegramClubJoinModal.vue'
import GameLaunchFallbackModal from '@/components/Dialog/GameLaunchFallbackModal.vue'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import ExternalLinkFrame from '@/components/ExternalLinkFrame/ExternalLinkFrame.vue'
import LoginModal from '@/views/login/LoginModal.vue'

const gameStore = useGameStore()
const loginModalStore = useLoginModalStore()
const hasSession = computed(() => gameStore.isRealUser)
const isCocosTableAuthOverlay = computed(
  () => loginModalStore.context === H5_LOGIN_CONTEXT.TABLE_SITDOWN,
)

// 访客页不需要消息审核与客服完整业务包；登录态出现后再加载并挂载。
const GlobalMessageTodoNotice = defineAsyncComponent(
  () => import('@/components/GlobalMessageTodoNotice/GlobalMessageTodoNotice.vue'),
)
const GlobalCustomerServiceChat = defineAsyncComponent(
  () => import('@/components/GlobalCustomerServiceChat/GlobalCustomerServiceChat.vue'),
)
</script>

<template>
  <div
    class="h5-route-host"
    :class="{ 'h5-route-host--table-auth': isCocosTableAuthOverlay }"
  >
    <RouterView />
  </div>
  <LoginModal />
  <GlobalBridgeDialogHost />
  <GlobalBridgePanelHost />
  <TelegramClubJoinModal />
  <GameLaunchFallbackModal />
  <ExternalLinkFrame />
  <Teleport v-if="hasSession" to="body">
    <GlobalMessageTodoNotice />
  </Teleport>
  <Teleport v-if="hasSession" to="body">
    <GlobalCustomerServiceChat />
  </Teleport>
  <GlobalCsOrderFloat />
</template>

<style>
/* 包裹层只做分组，不参与尺寸计算：保持页面根节点的百分比高度与 Telegram guard 生效。 */
.h5-route-host {
  height: 100%;
}

/* 牌桌内登录只显示弹窗；H5 大厅保持挂载但不绘制，底下继续显示 Cocos 牌桌。 */
#app[data-cocos-table-auth-overlay='1'] {
  background-color: transparent !important;
  background-image: none !important;
}

.h5-route-host--table-auth {
  visibility: hidden;
  pointer-events: none;
}
</style>

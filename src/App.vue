<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { H5_LOGIN_CONTEXT } from '@bridge-protocol'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import ExternalLinkFrame from '@/components/ExternalLinkFrame/ExternalLinkFrame.vue'
import LoginModal from '@/views/login/LoginModal.vue'

const gameStore = useGameStore()
const loginModalStore = useLoginModalStore()
const hasRealUserSession = computed(() => gameStore.isRealUser)
const hasChatSession = computed(() => Boolean(gameStore.sessionToken.trim()))
const isCocosTableAuthOverlay = computed(
  () => loginModalStore.context === H5_LOGIN_CONTEXT.TABLE_SITDOWN,
)

// 消息审核仍仅对真实用户挂载；客服聊天支持持有体验 token 的游客。
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
  <ExternalLinkFrame />
  <Teleport v-if="hasRealUserSession" to="body">
    <GlobalMessageTodoNotice />
  </Teleport>
  <Teleport v-if="hasChatSession" to="body">
    <GlobalCustomerServiceChat />
  </Teleport>
</template>

<style>
/* 牌桌内登录只显示弹窗；H5 大厅保持挂载但不绘制，底下继续显示 Cocos 牌桌。 */
#app[data-cocos-table-auth-overlay='1'] {
  background-color: transparent !important;
  background-image: none !important;
}

.h5-route-host--table-auth {
  visibility: hidden;
  pointer-events: none;
}

/* 渠道包独立页面：三星浏览器可能把 100dvh 算短；只补足背景，不缩短正常页面。 */
html[data-channel-package='1']:not([data-main-layout='primary'])
  #app > .h5-route-host > * {
  min-height: max(100dvh, var(--app-full-height, var(--app-viewport-height, 100dvh)));
}
</style>

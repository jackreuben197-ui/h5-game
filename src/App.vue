<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import GlobalCsOrderFloat from '@/components/GlobalCsOrderFloat/GlobalCsOrderFloat.vue'
import TelegramClubJoinModal from '@/components/Dialog/TelegramClubJoinModal.vue'
import GameLaunchFallbackModal from '@/components/Dialog/GameLaunchFallbackModal.vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
const hasSession = computed(() => Boolean(gameStore.sessionToken.trim()))

// 访客页不需要消息审核与客服完整业务包；登录态出现后再加载并挂载。
const GlobalMessageTodoNotice = defineAsyncComponent(
  () => import('@/components/GlobalMessageTodoNotice/GlobalMessageTodoNotice.vue'),
)
const GlobalCustomerServiceChat = defineAsyncComponent(
  () => import('@/components/GlobalCustomerServiceChat/GlobalCustomerServiceChat.vue'),
)
</script>

<template>
  <RouterView />
  <GlobalBridgeDialogHost />
  <GlobalBridgePanelHost />
  <TelegramClubJoinModal />
  <GameLaunchFallbackModal />
  <Teleport v-if="hasSession" to="body">
    <GlobalMessageTodoNotice />
  </Teleport>
  <Teleport v-if="hasSession" to="body">
    <GlobalCustomerServiceChat />
  </Teleport>
  <GlobalCsOrderFloat />
</template>


<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useGameStore } from '@/stores/game'
import ExternalLinkFrame from '@/components/ExternalLinkFrame/ExternalLinkFrame.vue'

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
  <ExternalLinkFrame />
  <Teleport v-if="hasSession" to="body">
    <GlobalMessageTodoNotice />
  </Teleport>
  <Teleport v-if="hasSession" to="body">
    <GlobalCustomerServiceChat />
  </Teleport>
</template>

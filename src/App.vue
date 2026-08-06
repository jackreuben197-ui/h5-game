<script setup lang="ts">
import GlobalCsOrderFloat from '@/components/GlobalCsOrderFloat/GlobalCsOrderFloat.vue'
import TelegramClubJoinModal from '@/components/Dialog/TelegramClubJoinModal.vue'
import GameLaunchFallbackModal from '@/components/Dialog/GameLaunchFallbackModal.vue'
</script>

<template>
  <RouterView />
  <GlobalBridgeDialogHost />
  <GlobalBridgePanelHost />
  <TelegramClubJoinModal />
  <GameLaunchFallbackModal />
  <Teleport to="body">
    <GlobalMessageTodoNotice />
  </Teleport>
  <Teleport to="body">
    <GlobalCustomerServiceChat />
  </Teleport>
  <GlobalCsOrderFloat />
</template>


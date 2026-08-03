<script setup lang="ts">
import GlobalCsOrderFloat from '@/components/GlobalCsOrderFloat/GlobalCsOrderFloat.vue'
import TelegramClubJoinModal from '@/components/Dialog/TelegramClubJoinModal.vue'
</script>

<template>
  <RouterView />
  <GlobalBridgeDialogHost />
  <GlobalBridgePanelHost />
  <TelegramClubJoinModal />
  <Teleport to="body">
    <GlobalMessageTodoNotice />
  </Teleport>
  <Teleport to="body">
    <GlobalCustomerServiceChat />
  </Teleport>
  <GlobalCsOrderFloat />
</template>


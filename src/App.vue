<script setup lang="ts">
import GlobalCsOrderFloat from '@/components/GlobalCsOrderFloat/GlobalCsOrderFloat.vue'
</script>

<template>
  <RouterView />
  <GlobalBridgeDialogHost />
  <GlobalBridgePanelHost />
  <Teleport to="body">
    <GlobalMessageTodoNotice />
  </Teleport>
  <Teleport to="body">
    <GlobalCustomerServiceChat />
  </Teleport>
  <GlobalCsOrderFloat />
</template>

<script setup lang="ts">
import GlobalCsOrderFloat from '@/components/GlobalCsOrderFloat/GlobalCsOrderFloat.vue'
</script>

<template>
  <RouterView />
  <GlobalBridgeDialogHost />
  <GlobalBridgePanelHost />
  <GlobalMessageTodoNotice />
  <GlobalCustomerServiceChat />
  <GlobalCsOrderFloat />
</template>

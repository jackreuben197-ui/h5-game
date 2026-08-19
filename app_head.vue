<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import GlobalCsOrderFloat from '@/components/GlobalCsOrderFloat/GlobalCsOrderFloat.vue'
import TelegramClubJoinModal from '@/components/Dialog/TelegramClubJoinModal.vue'
import GameLaunchFallbackModal from '@/components/Dialog/GameLaunchFallbackModal.vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
const hasSession = computed(() => Boolean(gameStore.sessionToken.trim()))

// Φ«┐σ«óΘí╡Σ╕ìΘ£ÇΦªüµ╢êµü»σ«íµá╕Σ╕Äσ«óµ£ìσ«îµò┤Σ╕Üσèíσîà∩╝¢τÖ╗σ╜òµÇüσç║τÄ░σÉÄσåìσèáΦ╜╜σ╣╢µîéΦ╜╜πÇé
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


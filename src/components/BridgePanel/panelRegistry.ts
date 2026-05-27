import { defineAsyncComponent, type Component } from 'vue'

export const bridgePanelRegistry: Record<string, Component> = {
  gameRule: defineAsyncComponent(() => import('./panels/BridgeGameRulePanel.vue')),
  safetyGuard: defineAsyncComponent(() => import('./panels/BridgeSafetyGuardPanel.vue')),
  jackpotRecord: defineAsyncComponent(() => import('./panels/BridgeJackpotRecordPanel.vue')),
  jackpotAward: defineAsyncComponent(() => import('./panels/BridgeJackpotAwardPanel.vue')),
  mttSettlement: defineAsyncComponent(() => import('./panels/BridgeMttSettlementPanel.vue')),
  mttRecord: defineAsyncComponent(() => import('./panels/BridgeMttRecordPanel.vue')),
}

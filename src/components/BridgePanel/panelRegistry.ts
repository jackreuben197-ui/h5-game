import { defineAsyncComponent, type Component } from 'vue'

export const bridgePanelRegistry: Record<string, Component> = {
  richTabsDemo: defineAsyncComponent(() => import('./panels/BridgeRichTabsDemoPanel.vue')),
}

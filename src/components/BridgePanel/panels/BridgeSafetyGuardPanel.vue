<script setup lang="ts">
import { computed } from 'vue'
import SafetyGuardPanelContent from '@/components/Dialog/SafetyGuardPanelContent.vue'

const props = defineProps<{
  panelProps?: Record<string, unknown>
  emitPanelEvent: (event: string, payload?: unknown) => void
  closePanel: (reason?: string, payload?: unknown) => void
}>()

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw)
}

const resolvedPanelProps = computed(() => (isRecord(props.panelProps) ? props.panelProps : {}))
</script>

<template>
  <SafetyGuardPanelContent
    :tribe-id="Number(resolvedPanelProps.tribeId) || 0"
    :tribe-i-d="Number(resolvedPanelProps.tribeID) || 0"
    @tab-change="props.emitPanelEvent('tabChange', $event)"
  />
</template>

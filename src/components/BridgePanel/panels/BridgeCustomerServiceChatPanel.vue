<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  openGlobalCustomerServiceChat,
  type OpenGlobalCustomerServiceChatPayload,
} from '@/components/GlobalCustomerServiceChat/channel'

const props = defineProps<{
  panelProps?: Record<string, unknown>
  emitPanelEvent: (event: string, payload?: unknown) => void
  closePanel: (reason?: string, payload?: unknown) => void
}>()

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw)
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.floor(num)
}

const resolvedPanelProps = computed<Record<string, unknown>>(() =>
  isRecord(props.panelProps) ? props.panelProps : {},
)

const chatPayload = computed<OpenGlobalCustomerServiceChatPayload>(() => {
  const p = resolvedPanelProps.value
  return {
    imServiceType: toSafeInt(p.imServiceType ?? p.im_service_type) || 1,
    clubId: toSafeInt(p.clubId ?? p.club_id),
    tribeId: toSafeInt(p.tribeId ?? p.tribe_id ?? p.tribeID),
    supportUserId: toSafeInt(p.supportUserId ?? p.support_user_id),
  }
})

onMounted(() => {
  const payload = chatPayload.value
  openGlobalCustomerServiceChat(payload)
  props.emitPanelEvent('open', payload)
  props.closePanel('close', {
    from: 'customerServiceChat',
  })
})
</script>

<template>
  <div class="bridge-customer-service-chat-panel">正在打开客服会话...</div>
</template>

<style scoped lang="scss">
.bridge-customer-service-chat-panel {
  min-height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.28rem;
}
</style>

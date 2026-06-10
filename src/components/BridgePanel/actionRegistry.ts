import type { CocosPanelPayload } from '@bridge-protocol'
import {
  openGlobalCustomerServiceChat,
  type OpenGlobalCustomerServiceChatPayload,
} from '@/components/GlobalCustomerServiceChat/channel'

export type BridgeActionHandler = (payload: CocosPanelPayload) => void

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.floor(num)
}

function normalizeSupportChatPayload(
  props: Record<string, unknown> | undefined,
): OpenGlobalCustomerServiceChatPayload {
  const p = props ?? {}
  return {
    imServiceType: toSafeInt(p.imServiceType),
    clubId: toSafeInt(p.clubId),
    tribeId: toSafeInt(p.tribeId),
    supportUserId: toSafeInt(p.supportUserId),
  }
}

export const bridgeActionRegistry: Record<string, BridgeActionHandler> = {
  supportChat: (payload) => {
    openGlobalCustomerServiceChat(normalizeSupportChatPayload(payload.props))
  },
}

export function runBridgeAction(payload: CocosPanelPayload): boolean {
  const handler = bridgeActionRegistry[payload.panelType]
  if (!handler) {
    return false
  }
  handler(payload)
  return true
}

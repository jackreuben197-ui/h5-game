export interface OpenGlobalCustomerServiceChatPayload {
  imServiceType?: number
  clubId?: number
  tribeId?: number
  supportUserId?: number
}

type GlobalCustomerServiceChatListener = (
  payload: OpenGlobalCustomerServiceChatPayload,
) => void

const listeners = new Set<GlobalCustomerServiceChatListener>()

export function openGlobalCustomerServiceChat(
  payload: OpenGlobalCustomerServiceChatPayload = {},
): void {
  listeners.forEach((listener) => {
    listener(payload)
  })
}

export function subscribeGlobalCustomerServiceChat(
  listener: GlobalCustomerServiceChatListener,
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

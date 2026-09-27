import { showToast } from 'vant'
import { resolveGameToastMessage } from './resolveMessage'

export { default as GameToast } from './GameToast.vue'
export { resolveGameToastMessage } from './resolveMessage'

export function showGameToast(message: string, duration = 1500): void {
  const resolvedMessage = resolveGameToastMessage(message)
  if (!resolvedMessage) return
  showToast({ message: resolvedMessage, className: 'game-toast-msg', duration })
}

export function showGameToastOnTable(type: string, message: string, duration = 2000): void {
  const resolvedMessage = resolveGameToastMessage(message)
  if (!resolvedMessage) return
  showToast({ message: resolvedMessage, className: 'game-toast-msg table-toast-msg', duration })
}

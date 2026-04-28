import { showToast } from 'vant'

export { default as GameToast } from './GameToast.vue'

export function showGameToast(message: string, duration = 2000): void {
  showToast({ message, className: 'game-toast-msg', duration })
}

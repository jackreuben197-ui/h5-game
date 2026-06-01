import { showToast } from 'vant'

export { default as GameToast } from './GameToast.vue'

export function showGameToast(message: string, duration = 1500): void {
  showToast({ message, className: 'game-toast-msg', duration })
}
export function showGameToastOnTable(type:string, message:string, duration = 2000){
  showToast({ message, className: 'game-toast-msg table-toast-msg', duration })
}

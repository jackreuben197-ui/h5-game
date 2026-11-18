import { ref } from 'vue'

export const isClubSplashActiveState = ref(false)
const splashDismissWaiters: Array<() => void> = []

export function setClubSplashActive(active: boolean): void {
  isClubSplashActiveState.value = active
  if (!active) {
    while (splashDismissWaiters.length > 0) {
      splashDismissWaiters.shift()?.()
    }
  }
}

export function isClubSplashActive(): boolean {
  return isClubSplashActiveState.value
}

export function waitForClubSplashDismiss(): Promise<void> {
  if (!isClubSplashActiveState.value) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    splashDismissWaiters.push(resolve)
  })
}

import type { LoginModalMode } from '@/stores/loginModal'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import { pinia } from '@/stores/pinia'

export type PendingRealUserAction = () => unknown | Promise<unknown>

interface RequireRealUserOptions {
  redirect?: string
  mode?: LoginModalMode
}

let pendingAction: PendingRealUserAction | null = null

/**
 * 所有读取/修改真实账号数据的入口统一经过这里。
 * 游客账号也持有 token，因此不能使用“是否有 token”代替真实身份判断。
 */
export function requireRealUser(
  action?: PendingRealUserAction,
  options?: RequireRealUserOptions,
): boolean {
  const gameStore = useGameStore(pinia)
  if (gameStore.isRealUser) {
    return true
  }

  pendingAction = action || null
  useLoginModalStore(pinia).open(options)
  return false
}

export function takePendingRealUserAction(): PendingRealUserAction | null {
  const action = pendingAction
  pendingAction = null
  return action
}

export function clearPendingRealUserAction(): void {
  pendingAction = null
}

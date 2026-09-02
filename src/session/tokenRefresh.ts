// H5 桥接模式下的 token 续期循环。
// 对齐老 Cocos 直连模式的 TokenRefreshComponent：每 5s 检查一次，
// 距离过期 < 7200s（2h）时调 /user/refresh 续期；失败则清理旧会话并恢复游客态。
import { postUserRefreshApi } from '@/api/user'
import StorageKey from '@/constants/storageKey'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/stores/pinia'
import { closeWsProxy } from '@/bridge/ws'
import { localStore } from '@/utils/localStore'
import { createLogger } from '@/utils/logger'

const log = createLogger('[tokenRefresh]')

const POLL_INTERVAL_MS = 5_000
const REFRESH_THRESHOLD_SECONDS = 7_200

let timer: number | null = null
let refreshing = false

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

function readExpireAt(): number {
  const raw = localStore.getItem<number | string>(StorageKey.TOKEN_EXPIREAT, 0)
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function clearLoginAndRestoreExperience(reason: string): void {
  log.warn('token invalid, clear login', { reason })
  // 主动关 WS，避免 wsProxy 继续用旧 token 重连。
  closeWsProxy({ code: 1000, reason: 'token refresh failed' })
  useGameStore(pinia).clearLogin()
  localStore.removeItem(StorageKey.TOKEN_EXPIREAT)
  void import('@/session/experienceSession')
    .then(({ ensureExperienceSessionReady }) => ensureExperienceSessionReady())
    .catch((error) => log.warn('restore experience session failed', error))
}

async function refreshNow(): Promise<void> {
  refreshing = true
  try {
    const res = await postUserRefreshApi()
    if (res.code !== 0) {
      throw new Error(res.message || `refresh code=${res.code}`)
    }
    const token = String(res.data?.token || '').trim()
    const expireAt = Number(res.data?.expire_at || 0)
    if (!token) {
      throw new Error('refresh response missing token')
    }
    // 顺序很关键：先写 TOKEN_EXPIREAT，再 setSessionToken。
    // setSessionToken 内部会同步给 Cocos，需要在那一刻读到最新的 expireAt。
    if (Number.isFinite(expireAt) && expireAt > 0) {
      localStore.setItem(StorageKey.TOKEN_EXPIREAT, expireAt)
    }
    const gameStore = useGameStore(pinia)
    gameStore.setSessionToken(token)
    log.info('token refreshed', { expireAt })
  } catch (error) {
    log.warn('token refresh failed', error)
    clearLoginAndRestoreExperience('refresh-failed')
  } finally {
    refreshing = false
  }
}

function tick(): void {
  if (refreshing) {
    return
  }
  const gameStore = useGameStore(pinia)
  // 体验账号是短生命周期租用账号，不调用真实用户 token 续期接口。
  if (!gameStore.sessionToken.trim() || gameStore.isGuestAccount) {
    return
  }
  const expireAt = readExpireAt()
  if (expireAt <= 0) {
    // 没有 expireAt（老用户登录态）：不知道何时过期，跳过续期；正常使用走到 401 自然弹登录。
    return
  }
  const remaining = expireAt - nowSeconds()
  if (remaining <= 0) {
    clearLoginAndRestoreExperience('expired')
    return
  }
  if (remaining < REFRESH_THRESHOLD_SECONDS) {
    void refreshNow()
  }
}

export function startTokenRefreshLoop(): void {
  if (timer !== null) {
    return
  }
  log.info('start token refresh loop', {
    intervalMs: POLL_INTERVAL_MS,
    thresholdSec: REFRESH_THRESHOLD_SECONDS,
  })
  timer = window.setInterval(tick, POLL_INTERVAL_MS)
  // 立即触发一次，避免冷启动时第一个 5s 窗口内 token 就已到刷新点却被跳过。
  tick()
}

export function stopTokenRefreshLoop(): void {
  if (timer === null) {
    return
  }
  window.clearInterval(timer)
  timer = null
  log.info('stop token refresh loop')
}

// 启动时调用：本地 token 已过期就清理旧会话并恢复游客态，避免首次进入主动弹登录窗。
// 返回值：true 表示 token 看起来有效，调用方可以启动 refresh loop。
export function checkLocalTokenAtBootstrap(): boolean {
  const gameStore = useGameStore(pinia)
  if (!gameStore.sessionToken.trim()) {
    return false
  }
  const expireAt = readExpireAt()
  if (expireAt > 0 && expireAt <= nowSeconds()) {
    clearLoginAndRestoreExperience('bootstrap-expired')
    return false
  }
  return true
}

import {
  getUserInfoApi,
  postUserExperienceLoginApi,
  postUserLogoutApi,
} from '@/api/user'
import { isExperienceUserInfo } from '@/session/experienceIdentity'
import LoginSession from '@/session/loginSession'
import { syncPostAuthData } from '@/session/postAuthSync'
import StorageKey from '@/constants/storageKey'
import { getLocale } from '@/i18n'
import { pinia } from '@/stores/pinia'
import { useGameStore } from '@/stores/game'
import { useMttListStore } from '@/stores/mttList'
import { useRoomListStore } from '@/stores/roomList'
import { useUserInfoStore } from '@/stores/userInfo'
import { localStore } from '@/utils/localStore'
import { isTelegramMiniAppEnv } from '@/utils/environment'
import { isChannelPackageHost, resolveInviteCode } from '@/utils/channelPackage'
import type { ExperienceLoginRequest, UserInfoData } from '@/api/models/user'

let ensurePromise: Promise<boolean> | null = null
let experienceLoginRevision = 0
let realAuthenticationDepth = 0
let logoutPromise: Promise<void> | null = null
let logoutPromiseToken = ''
let exitReleaseToken = ''

function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function resolveExperienceDeviceId(): string {
  const cached = String(localStore.getItem<string>(StorageKey.EXPERIENCE_DEVICE_ID, '') || '').trim()
  if (cached) {
    return cached
  }
  const deviceId = createDeviceId()
  localStore.setItem(StorageKey.EXPERIENCE_DEVICE_ID, deviceId)
  return deviceId
}

function buildExperienceLoginPayload(): ExperienceLoginRequest {
  const inviteCode = resolveInviteCode()
  return {
    platform: 5,
    device_id: resolveExperienceDeviceId(),
    user_device_no: String(navigator.platform || 'Web').slice(0, 128),
    client_language: getLocale(),
    system_language: String(navigator.language || getLocale()),
    system_version: String(navigator.userAgent || 'Web').slice(0, 512),
    ...(inviteCode ? { invite_code: inviteCode } : {}),
    // 不传 gps_latitude / gps_longitude，避免请求浏览器定位权限。
  }
}

function hydrateSessionUser(userInfo: UserInfoData, account: string): void {
  const gameStore = useGameStore(pinia)
  const user = userInfo.user as Record<string, unknown>
  const userId = String(user.p_u_id ?? user.pUid ?? user.userid ?? user.un_id ?? '')
  const nickname = String(user.nickname ?? account)
  gameStore.setLoginUser({ account, nickname, userId })
}

async function bootstrapResolvedSessionLists(): Promise<void> {
  await Promise.allSettled([
    useRoomListStore(pinia).bootstrapRoomList(),
    useMttListStore(pinia).bootstrapMttList(),
  ])
}

async function ensureChannelClubContext(): Promise<void> {
  if (!isChannelPackageHost()) {
    return
  }

  // 渠道俱乐部是游客列表、首页标题、公告和 h5_menu 的共同 scope。
  // 必须先固定它，再用 user/info 判定身份；否则体验身份会先清空真实用户资料，
  // 页面会短暂退回平台 scope，并抢跑一轮错误的房间/赛事请求。
  await useUserInfoStore(pinia).ensureChannelDefaultClub()
}

async function releaseSupersededExperienceToken(token: string): Promise<void> {
  if (!token) return
  try {
    await postUserLogoutApi(token)
  } catch (error) {
    console.warn('[experience-session] release superseded experience token failed:', error)
  }
}

async function runEnsureExperienceSession(revision: number): Promise<boolean> {
  const gameStore = useGameStore(pinia)

  await ensureChannelClubContext()

  // 渠道俱乐部请求可能等待较久，token 必须在等待后重新读取，不能使用旧快照。
  const existingToken = gameStore.sessionToken.trim()

  if (existingToken) {
    try {
      const userInfo = await getUserInfoApi()
      if (gameStore.sessionToken.trim() !== existingToken) {
        return false
      }
      hydrateSessionUser(userInfo, gameStore.loginAccount || 'experience')
      if (isExperienceUserInfo(userInfo)) {
        gameStore.markIdentitySynced(existingToken)
        await bootstrapResolvedSessionLists()
      } else {
        await syncPostAuthData()
        // 渠道版底部导航需要根据真实列表决定动态入口。身份未确认前不能由
        // Tab 组件抢跑；确认是真实账号后在会话层统一预热。
        if (isChannelPackageHost()) {
          await bootstrapResolvedSessionLists()
        }
      }
      return true
    } catch (error) {
      // 网络抖动时保留已有 token，绝不能因为 user/info 临时失败就再申请体验账号。
      if (gameStore.sessionToken.trim()) {
        console.warn('[experience-session] validate existing token failed; keep it:', error)
        return false
      }
      // 只有 90010 已由 HTTP 层同步清掉 token 时，才允许继续领取新体验账号。
    }
  }

  // Telegram Mini App 优先走既有真实账号自动登录，避免先占用体验账号。
  if (isTelegramMiniAppEnv()) {
    return false
  }
  if (revision !== experienceLoginRevision) {
    return false
  }

  const tokenBeforeExperienceLogin = gameStore.sessionToken.trim()
  const login = await postUserExperienceLoginApi(buildExperienceLoginPayload())
  const token = String(login.token || '').trim()
  if (
    revision !== experienceLoginRevision ||
    gameStore.sessionToken.trim() !== tokenBeforeExperienceLogin
  ) {
    // 登录/注册已在并发流程中接管会话。刚领取的体验账号必须立即登出释放，
    // 但绝不能写入本地或覆盖新的真实 token。
    await releaseSupersededExperienceToken(token)
    return false
  }
  const expireAt = Number(login.expire_at || 0)
  if (Number.isFinite(expireAt) && expireAt > 0) {
    localStore.setItem(StorageKey.TOKEN_EXPIREAT, expireAt)
  }

  // 先标记身份、再写 token，避免 token 生效瞬间被全局组件当成真实账号。
  gameStore.setGuestAccount(true)
  gameStore.setSessionToken(token)
  gameStore.setLoginUser({ account: 'experience', nickname: 'Guest', userId: '' })

  try {
    const userInfo = await getUserInfoApi()
    if (gameStore.sessionToken.trim() !== token) {
      return false
    }
    hydrateSessionUser(userInfo, 'experience')
    gameStore.markIdentitySynced(token)
  } catch (error) {
    if (gameStore.sessionToken.trim() !== token) {
      return false
    }
    // token 已成功领取时不能因 user/info 短暂失败而再次领取，只保留游客态等待重试。
    console.warn('[experience-session] sync experience user info failed:', error)
  }

  if (gameStore.sessionToken.trim() !== token) {
    return false
  }
  await bootstrapResolvedSessionLists()
  return true
}

/** 真实登录/注册开始时调用，使所有尚未完成的游客初始化结果立即失效。 */
export function invalidateExperienceSessionInitialization(): void {
  experienceLoginRevision += 1
  ensurePromise = null
}

/** 真实登录事务期间暂停领取体验账号；返回函数用于结束暂停。 */
export function suspendExperienceSessionInitialization(): () => void {
  realAuthenticationDepth += 1
  invalidateExperienceSessionInitialization()
  let resumed = false
  return () => {
    if (resumed) return
    resumed = true
    realAuthenticationDepth = Math.max(0, realAuthenticationDepth - 1)
  }
}

/**
 * 启动或体验 token 失效后的统一入口。并发调用只会发起一次体验登录请求。
 */
export function ensureExperienceSession(): Promise<boolean> {
  if (realAuthenticationDepth > 0) {
    return Promise.resolve(false)
  }
  const gameStore = useGameStore(pinia)
  const currentToken = gameStore.sessionToken.trim()
  // 身份确认结果与 token 绑定；同一会话内切换路由只复用结果，不再重复请求 user/info。
  if (currentToken && !gameStore.shouldSyncIdentity(currentToken)) {
    return Promise.resolve(true)
  }
  if (!ensurePromise) {
    const revision = experienceLoginRevision
    let currentPromise: Promise<boolean>
    currentPromise = runEnsureExperienceSession(revision).finally(() => {
      // 旧任务完成时不能清掉换号后新建的 ensure Promise。
      if (ensurePromise === currentPromise) {
        ensurePromise = null
      }
    })
    ensurePromise = currentPromise
  }
  return ensurePromise
}

/**
 * 需要立即使用 token 的用户操作入口。首次校验若正好遇到旧 token 被清理，等待一次新的游客会话。
 */
export async function ensureExperienceSessionReady(): Promise<boolean> {
  const firstReady = await ensureExperienceSession()
  if (firstReady && useGameStore(pinia).sessionToken.trim()) {
    return true
  }
  const secondReady = await ensureExperienceSession()
  return secondReady && Boolean(useGameStore(pinia).sessionToken.trim())
}

interface LogoutCurrentSessionOptions {
  restoreExperience?: boolean
}

/**
 * 真实账号与体验账号共用 /user/logout。只有服务端确认退出后才清理本地状态。
 */
export async function logoutCurrentSession(
  options: LogoutCurrentSessionOptions = {},
): Promise<void> {
  invalidateExperienceSessionInitialization()
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken.trim()
  if (!token) {
    gameStore.clearLogin()
    if (options.restoreExperience) {
      await ensureExperienceSession()
    }
    return
  }

  if (logoutPromise && logoutPromiseToken === token) {
    await logoutPromise
    if (options.restoreExperience) {
      await ensureExperienceSession()
    }
    return
  }

  logoutPromiseToken = token
  logoutPromise = (async () => {
    const response = await postUserLogoutApi(token)
    if (response.code !== 0 && response.code !== 90010) {
      throw new Error(response.message || `退出登录失败: ${response.code}`)
    }
    // 请求期间若已切换到其他 token，绝不能误清新登录态。
    if (useGameStore(pinia).sessionToken.trim() === token) {
      LoginSession.ClearWS()
      useGameStore(pinia).clearLogin()
    }
  })().finally(() => {
    if (logoutPromiseToken === token) {
      logoutPromise = null
      logoutPromiseToken = ''
    }
  })

  await logoutPromise
  if (options.restoreExperience) {
    await ensureExperienceSession()
  }
}

function resolveLogoutUrl(): string {
  const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
  return `${baseUrl}/user/logout`
}

/**
 * 页面关闭无法等待 Axios；keepalive 是浏览器可提供的最可靠退出方式。
 * 故意保留本地 token：刷新后的新页面会先拿旧 token 查 user/info，避免退出请求尚未
 * 到达服务端时就再次申请体验账号。旧 token 失效后由 90010 流程领取新账号。
 */
export function releaseExperienceSessionOnPageExit(): void {
  const gameStore = useGameStore(pinia)
  const token = gameStore.isGuestAccount ? gameStore.sessionToken.trim() : ''
  if (!token || exitReleaseToken === token || typeof fetch !== 'function') {
    return
  }
  exitReleaseToken = token
  void fetch(resolveLogoutUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Md5at: token,
    },
    body: '{}',
    credentials: 'include',
    keepalive: true,
  }).catch((error) => {
    console.warn('[experience-session] page-exit logout failed:', error)
  })
}

export function setupExperienceSessionLifecycle(): () => void {
  exitReleaseToken = ''
  const onPageHide = (): void => releaseExperienceSessionOnPageExit()
  const onPageShow = (): void => {
    exitReleaseToken = ''
    if (useGameStore(pinia).isGuestAccount) {
      void ensureExperienceSession()
    }
  }
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('pageshow', onPageShow)
  return () => {
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('pageshow', onPageShow)
  }
}

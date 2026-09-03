import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { closeToast, showFailToast, showLoadingToast } from 'vant'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { pinia } from '@/stores/pinia'
import router from '@/router'
import { showGameToast } from '@/components/Toast'
import { resolveApiErrorText, translateBusinessCode } from '@/utils/apiError'
import LoginSession from '@/session/loginSession'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import { resolveInviteCode, resolveTraceHash, resolveAgentInviteCode } from '@/utils/channelPackage'
import { isTelegramMiniAppEnv } from '@/utils/environment'

const http = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? '/api' : 'https://preview.trackyourchoice.com/api'),
  timeout: 60000,
})

export interface HttpRequestOptionsExt extends AxiosRequestConfig {
  suppressBusinessToast?: boolean
  suppressBusinessCodes?: number[]
  suppressAuthRedirect?: boolean
  allowGuestAccount?: boolean
  authToken?: string | false
  xClub?: string | number | false
}

export interface HttpRequestConfigExt extends InternalAxiosRequestConfig {
  suppressBusinessToast?: boolean
  suppressBusinessCodes?: number[]
  suppressAuthRedirect?: boolean
  allowGuestAccount?: boolean
  authToken?: string | false
  xClub?: string | number | false
  sessionTokenSnapshot?: string
}

const REAL_USER_REQUIRED_ERROR = 'H5_REAL_USER_REQUIRED'

let authRedirecting = false
const PRE_LOGIN_PATHS = [
  '/user/login',
  '/user/login2',
  '/user/experience/login',
  '/user/login_third_party',
  '/user/register',
  '/user/quick/register',
  '/user/sendcode',
  '/user/send_email_code',
  '/user/check_phone',
  '/user/check_email',
  '/user/modify/password',
  '/misc/article/info',
  '/misc/h5/display',
  '/config/register/area',
  '/config/before/login/config',
  '/org/club/default',
  '/roomcenter/guest/all/rooms',
  '/roomcenter/guest/all/room/ids',
  '/roomcenter/guest/contrast/rooms',
  '/roomcenter/guest/rooms/list',
  '/roomcenter/guest/all/mtt/sng/ids',
  '/roomcenter/guest/mtt/sng/rooms/list',
  '/config/before/login/config',
]

const GUEST_PREVIEW_PATHS = [
  // 娱乐场 / 小游戏目录游客可预览，进入具体游戏时才要求真实账号。
  '/extend/extend/game/record/list/popular/home',
  '/extend/extend/game/record/list/popular',
  '/extend/extend/game/record/list/popular/main/home',
  '/extend/extend/game/record/list/popular/main',
  '/extend/extend/game/record/list/home',
  '/extend/extend/game/record/list',
  '/gc/cowboy/room/list',
  '/roomcenter/mtt/list',
  '/roomcenter/user/all/rooms',
  '/roomcenter/user/all/room/ids',
  '/roomcenter/user/contrast/rooms',
  '/roomcenter/user/rooms/list',
  '/roomcenter/user/all/mtt/sng/ids',
  '/roomcenter/user/mtt/sng/rooms/list',
]

function isGuestPreviewRequest(url: string): boolean {
  if (GUEST_PREVIEW_PATHS.some((path) => url.includes(path))) {
    return true
  }
  // 比赛详情、公开排名、牌桌和奖励信息允许预览；myrank/user_wallet/buyin 等不在此白名单。
  return /^\/roomcenter\/mtt\/[^/]+\/(?:detail|ranks|hranks|rooms|real_prize)$/.test(url)
}

const TELEGRAM_LOGIN_LOADING_MESSAGE = '正在通过 Telegram 自动登录...'
let telegramAutoLoginPromise: Promise<boolean> | null = null
let telegramLoadingVisible = false

function shouldAttachXClub(url: string): boolean {
  if (/^\/?(?:(?:org|cmsext)\/club|cmsext\/room|order\/club)\//.test(url)) {
    return true
  }
  if (/^\/?config\/online_withdraw/.test(url)) {
    return true
  }
  if (/^\/?prop\/(?:gold|tribe_gold)\/price\/list/.test(url)) {
    return true
  }
  return /^\/?order\/user\/(?:withdraw|recharge_no|recharge|club_order\/cancel)\b/.test(url)
}

function readClubIdFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return ''
  }

  const record = payload as Record<string, unknown>
  const keys = ['club_id', 'clubId']
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function resolveXClub(config: HttpRequestConfigExt): string {
  if (config.xClub === false) {
    return ''
  }

  if (config.xClub !== undefined && config.xClub !== null && String(config.xClub).trim() !== '') {
    return String(config.xClub).trim()
  }

  const fromData = readClubIdFromPayload(config.data)
  if (fromData) {
    return fromData
  }

  const fromParams = readClubIdFromPayload(config.params)
  if (fromParams) {
    return fromParams
  }

  const userInfoStore = useUserInfoStore(pinia)
  return String(userInfoStore.currentClubId || '').trim()
}

// 统一处理登录失效：清理旧会话并静默恢复游客态。
async function forceToLogin(expectedToken = ''): Promise<void> {
  const currentStore = useGameStore(pinia)
  if (expectedToken && currentStore.sessionToken.trim() !== expectedToken) {
    return
  }
  if (currentStore.isGuestAccount) {
    currentStore.clearLogin()
    LoginSession.ClearWS()
    void import('@/session/experienceSession')
      .then(({ ensureExperienceSessionReady }) => ensureExperienceSessionReady())
      .catch((error) => console.warn('[http] restore experience session failed:', error))
    return
  }

  const autoLoginSucceeded = await ensureTelegramAutoLogin()
  if (autoLoginSucceeded) {
    return
  }

  if (authRedirecting) {
    return
  }
  authRedirecting = true

  const gameStore = useGameStore(pinia)
  if (expectedToken && gameStore.sessionToken.trim() !== expectedToken) {
    authRedirecting = false
    return
  }
  gameStore.clearLogin()
  LoginSession.ClearWS()
  try {
    const { ensureExperienceSessionReady } = await import('@/session/experienceSession')
    await ensureExperienceSessionReady()
  } catch (error) {
    console.warn('[http] restore experience session failed:', error)
  } finally {
    authRedirecting = false
  }
}

http.interceptors.request.use(async (config) => {
  const extConfig = config as HttpRequestConfigExt
  const gameStore = useGameStore(pinia)
  const configuredToken = extConfig.authToken
  let token =
    configuredToken === false
      ? ''
      : typeof configuredToken === 'string'
        ? configuredToken.trim()
        : gameStore.sessionToken
  const requestUrl = config.url || ''
  const normalizedUrl = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`
  // 登录前接口不要求 token。
  const isPreLoginRequest = PRE_LOGIN_PATHS.some((path) => normalizedUrl.includes(path))
  resolveContentType(config)

  // 体验账号也持有有效 token。除公开接口和显式允许的身份接口外，所有真实账号
  // 数据请求都在 H5 发出前拦截，避免依赖服务端业务错误来判断游客身份。
  if (
    gameStore.isGuestAccount &&
    !isPreLoginRequest &&
    !isGuestPreviewRequest(normalizedUrl) &&
    !extConfig.allowGuestAccount
  ) {
    const error = new Error('该功能需要注册或登录') as Error & { code?: string }
    error.code = REAL_USER_REQUIRED_ERROR
    return Promise.reject(error)
  }

  // Telegram Mini App 场景优先自动登录，登录期间串行等待并阻断后续业务请求。
  if (!token && !isPreLoginRequest && isTelegramMiniAppEnv()) {
    const autoLoginSucceeded = await ensureTelegramAutoLogin()
    if (autoLoginSucceeded) {
      token = useGameStore(pinia).sessionToken
    }
  }

  // 没有 token 且不是登录接口时，静默拒绝即可：guest 页上的全局组件不应被动唤起登录弹窗。
  // 真正的服务端 401（带 token 被服务端拒绝）由 response 拦截器在调用 forceToLogin。
  if (!token && !isPreLoginRequest && !isGuestPreviewRequest(normalizedUrl)) {
    console.warn(`请求 ${requestUrl} 时没有登录，且不属于登录前接口，已被静默拒绝`)
    return Promise.reject(new Error('未登录或登录已过期'))
  }

  // 响应拦截器用它判断返回值是否仍属于当前会话，避免旧 token 的 90010
  // 或用户资料响应在换号后清掉/覆盖新登录态。
  extConfig.sessionTokenSnapshot = token

  // 登录前接口默认不携带当前会话 token；体验账号和真实账号共用 /user/logout。
  if (token && (!isPreLoginRequest || typeof configuredToken === 'string')) {
    // 与服务端约定：使用 Md5at 请求头传 token。
    config.headers.Md5at = token
  }

  // 对齐 Unity：俱乐部相关接口需要携带 X-Club。
  const clubRouteUrl = normalizedUrl.startsWith('/') ? normalizedUrl.slice(1) : normalizedUrl
  if (shouldAttachXClub(clubRouteUrl)) {
    const xClub = resolveXClub(extConfig)
    if (xClub) {
      config.headers['X-Club'] = xClub
    }
  }

  return config
})

http.interceptors.response.use(
  (response) => {
    const businessCode = (response.data as { code?: number } | undefined)?.code
    const requestConfig = response.config as HttpRequestConfigExt
    const suppressCodes = Array.isArray(requestConfig.suppressBusinessCodes)
      ? requestConfig.suppressBusinessCodes
      : []
    const suppressToast =
      requestConfig.suppressBusinessToast === true ||
      (businessCode !== undefined && suppressCodes.includes(Number(businessCode)))

    // 服务端返回 90010：清理失效 token 并静默恢复游客态。
    if (businessCode === 90010 && !requestConfig.suppressAuthRedirect) {
      void forceToLogin(requestConfig.sessionTokenSnapshot)
      return Promise.reject(new Error('登录已失效，请重新登录'))
    }
    // 业务码非 0：弹出多语言错误提示。
    if (businessCode !== undefined && businessCode !== 0 && !suppressToast) {
      showGameToast(translateBusinessCode(Number(businessCode), response.data?.message))
    }
    return response
  },
  (error: AxiosError<{ message?: string; code?: number }>) => {
    if ((error as AxiosError & { code?: string }).code === REAL_USER_REQUIRED_ERROR) {
      return Promise.reject(error)
    }
    const businessCode = error.response?.data?.code
    const requestConfig = error.config as HttpRequestConfigExt | undefined
    if (businessCode === 90010 && !requestConfig?.suppressAuthRedirect) {
      void forceToLogin(requestConfig?.sessionTokenSnapshot)
      return Promise.reject(error)
    }

    const backendMessage = error.response?.data?.message
    if (backendMessage && /user have apply/i.test(backendMessage)) {
      showFailToast('已提交加入申请，等待审核')
      return Promise.reject(error)
    }
    showFailToast(resolveApiErrorText(error))
    return Promise.reject(error)
  },
)

// Auto-set Content-Type for non-FormData payloads; let browser handle FormData boundary.
function resolveContentType(config: InternalAxiosRequestConfig): void {
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
}

function getTelegramInitData(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  const fromGlobal = String(window.__H5_TG_INIT_DATA__ || '').trim()
  if (fromGlobal) {
    return fromGlobal
  }

  const fromWebApp = String(window.Telegram?.WebApp?.initData || '').trim()
  if (fromWebApp) {
    window.__H5_TG_INIT_DATA__ = fromWebApp
    return fromWebApp
  }

  return ''
}

function showTelegramLoginLoading(): void {
  if (telegramLoadingVisible) {
    return
  }
  telegramLoadingVisible = true
  showLoadingToast({
    message: TELEGRAM_LOGIN_LOADING_MESSAGE,
    forbidClick: true,
    duration: 0,
    loadingType: 'spinner',
  })
}

function hideTelegramLoginLoading(): void {
  if (!telegramLoadingVisible) {
    return
  }
  telegramLoadingVisible = false
  closeToast()
}

export async function ensureTelegramAutoLogin(): Promise<boolean> {
  if (!isTelegramMiniAppEnv()) {
    return false
  }

  if (!telegramAutoLoginPromise) {
    telegramAutoLoginPromise = doTelegramAutoLogin().finally(() => {
      telegramAutoLoginPromise = null
    })
  }

  return telegramAutoLoginPromise
}

async function doTelegramAutoLogin(): Promise<boolean> {
  const initData = getTelegramInitData()
  if (!initData) {
    return false
  }

  // resolveInviteCode() now also reads the Telegram start_param, so the club to
  // auto-enroll into (spec 2.2) flows into the login payload exactly like a web channel
  // invite code — the backend enrolls on invite_code at login_third_party.
  const inviteCode = resolveAgentInviteCode() || resolveInviteCode()
  const traceHash = resolveTraceHash()

  showTelegramLoginLoading()

  try {
    const { postUserThirdPartyApi, getUserInfoApi, getUserClubApi } = await import('@/api/user')
    const loginRes = await postUserThirdPartyApi(
      {
        source: 'telegram',
        app_source: 3,
        platform: 5,
        telegram_init_data: initData,
        invite_code: inviteCode || undefined,
        trace_hash: traceHash || undefined,
      },
      {
        suppressBusinessToast: true,
      },
    )

    if (loginRes.code !== 0) {
      throw new Error(loginRes.message || `error: ${loginRes.code}`)
    }

    const token = String(loginRes.data?.token || '').trim()
    if (!token) {
      throw new Error('telegram auto login token missing')
    }

    // 先写 TOKEN_EXPIREAT，setSessionToken 会顺带把 expireAt 同步给 Cocos。
    const expireAt = Number((loginRes.data as Record<string, unknown> | undefined)?.expire_at || 0)
    if (Number.isFinite(expireAt) && expireAt > 0) {
      localStore.setItem(StorageKey.TOKEN_EXPIREAT, expireAt)
    }
    const gameStore = useGameStore(pinia)
    gameStore.setGuestAccount(false)
    gameStore.setSessionToken(token)
    gameStore.setLoginUser({
      account: 'telegram',
      nickname: 'Telegram',
      userId: '',
    })

    try {
      await LoginSession.SyncWS()
      const userInfo = await getUserInfoApi()
      void getUserClubApi().catch((error) => {
        console.warn('[telegram-auto-login] sync club failed:', error)
      })

      const user = userInfo.user as Record<string, unknown>
      const userId = String(user.p_u_id ?? user.pUid ?? user.userid ?? user.un_id ?? '')
      const nickname = String(user.nickname ?? 'Telegram')
      gameStore.setLoginUser({
        account: gameStore.loginAccount || nickname,
        nickname,
        userId,
      })
      gameStore.markIdentitySynced(token)
    } catch (error) {
      LoginSession.ClearWS()
      gameStore.clearLogin()
      throw error
    }

    const { hasPendingTelegramDeepLink, runTelegramDeepLinkAfterLogin } = await import(
      '@/session/telegramDeepLink'
    )

    if (!hasPendingTelegramDeepLink() && router.currentRoute.value.name === 'login') {
      await router.replace({ name: 'lobby' })
    }

    // 登录成功后分发 Telegram 深链动作（进桌 / 战绩详情），无意图时为空操作。
    runTelegramDeepLinkAfterLogin()

    return true
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[telegram-auto-login] failed:', msg, error)
    return false
  } finally {
    hideTelegramLoginLoading()
  }
}

export default http

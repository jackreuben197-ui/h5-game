import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { closeToast, showFailToast, showLoadingToast } from 'vant'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { pinia } from '@/stores/pinia'
import router from '@/router'
import { showGameToast } from '@/components/Toast'
import { t } from '@/i18n'
import LoginSession from '@/session/loginSession'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
})

export interface HttpRequestConfigExt extends InternalAxiosRequestConfig {
  suppressBusinessToast?: boolean
  suppressBusinessCodes?: number[]
  xClub?: string | number | false
}

let authRedirecting = false
const PRE_LOGIN_PATHS = [
  '/user/login',
  '/user/login2',
  '/user/login_third_party',
  '/user/register',
  '/user/sendcode',
  '/user/send_email_code',
  '/user/check_phone',
  '/user/check_email',
  '/user/modify/password',
  '/misc/article/info',
  '/config/register/area',
]

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

// 统一处理登录失效：清理登录态并强制跳转到登录页。
async function forceToLogin(): Promise<void> {
  const autoLoginSucceeded = await ensureTelegramAutoLogin()
  if (autoLoginSucceeded) {
    return
  }

  if (authRedirecting) {
    return
  }

  authRedirecting = true

  const gameStore = useGameStore(pinia)
  gameStore.clearLogin()
  LoginSession.ClearWS()

  const currentRoute = router.currentRoute.value
  if (currentRoute.name !== 'login' && currentRoute.name !== 'login1') {
    // 登录失效后统一回登录页，不携带 redirect 参数。
    await router.replace({ name: 'login' })
  }

  authRedirecting = false
}

http.interceptors.request.use(async (config) => {
  const extConfig = config as HttpRequestConfigExt
  const gameStore = useGameStore(pinia)
  let token = gameStore.sessionToken
  const requestUrl = config.url || ''
  const normalizedUrl = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`
  // 登录前接口不要求 token。
  const isPreLoginRequest = PRE_LOGIN_PATHS.some((path) => normalizedUrl.includes(path))
  resolveContentType(config)

  // Telegram Mini App 场景优先自动登录，登录期间串行等待并阻断后续业务请求。
  if (!token && !isPreLoginRequest && isTelegramMiniAppEnv()) {
    const autoLoginSucceeded = await ensureTelegramAutoLogin()
    if (autoLoginSucceeded) {
      token = useGameStore(pinia).sessionToken
    }
  }

  // 没有 token 且不是登录接口时，直接判定未登录并跳转。
  if (!token && !isPreLoginRequest) {
    void forceToLogin()
    return Promise.reject(new Error('未登录或登录已过期'))
  }

  if (token) {
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

    // 服务端返回 90010：token 失效，强制回登录页。
    if (businessCode === 90010) {
      void forceToLogin()
      return Promise.reject(new Error('登录已失效，请重新登录'))
    }
    // 业务码非 0：弹出多语言错误提示。
    if (businessCode !== undefined && businessCode !== 0 && !suppressToast) {
      const msg = t(`ServerErrorCode_${businessCode}`) || `error: ${businessCode}`
      showGameToast(msg)
    }
    return response
  },
  (error: AxiosError<{ message?: string; code?: number }>) => {
    const businessCode = error.response?.data?.code
    if (businessCode === 90010) {
      void forceToLogin()
      return Promise.reject(error)
    }

    const backendMessage = error.response?.data?.message
    showFailToast(backendMessage || error.message || '请求失败，请稍后再试')
    return Promise.reject(error)
  },
)

// Auto-set Content-Type for non-FormData payloads; let browser handle FormData boundary.
function resolveContentType(config: InternalAxiosRequestConfig): void {
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
}

function isTelegramMiniAppEnv(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  if (window.__H5_TG_MINI_APP__) {
    return true
  }
  return Boolean(window.Telegram?.WebApp)
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

async function ensureTelegramAutoLogin(): Promise<boolean> {
  if (!isTelegramMiniAppEnv()) {
    return false
  }

  const gameStore = useGameStore(pinia)
  if (String(gameStore.sessionToken || '').trim()) {
    return true
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

  showTelegramLoginLoading()

  try {
    const { postUserThirdPartyApi, getUserInfoApi, getUserClubApi } = await import('@/api/user')
    const loginRes = await postUserThirdPartyApi(
      {
        source: 'telegram',
        app_source: 3,
        platform: 5,
        telegram_init_data: initData,
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

    const gameStore = useGameStore(pinia)
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
    } catch (error) {
      LoginSession.ClearWS()
      gameStore.clearLogin()
      throw error
    }

    const currentRoute = router.currentRoute.value
    if (currentRoute.name === 'login' || currentRoute.name === 'login1') {
      await router.replace({ name: 'lobby' })
    }

    return true
  } catch (error) {
    console.warn('[telegram-auto-login] failed:', error)
    return false
  } finally {
    hideTelegramLoginLoading()
  }
}

export default http

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { showFailToast } from 'vant'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { pinia } from '@/stores/pinia'
import router from '@/router'
import { showGameToast } from '@/components/Toast'
import { t } from '@/i18n'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

interface HttpRequestConfigExt extends InternalAxiosRequestConfig {
  suppressBusinessToast?: boolean
  suppressBusinessCodes?: number[]
  xClub?: string | number | false
}

let authRedirecting = false
const PRE_LOGIN_PATHS = [
  '/user/login',
  '/user/login2',
  '/user/register',
  '/user/sendcode',
  '/user/send_email_code',
  '/user/check_phone',
  '/user/check_email',
  '/user/modify/password',
]

function shouldAttachXClub(url: string): boolean {
  return /^\/?(?:org|cmsext)\/club\//.test(url)
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
  if (authRedirecting) {
    return
  }

  authRedirecting = true

  const gameStore = useGameStore(pinia)
  gameStore.clearLogin()

  const currentRoute = router.currentRoute.value
  if (currentRoute.name !== 'login' && currentRoute.name !== 'login1') {
    // 登录失效后统一回登录页，不携带 redirect 参数。
    await router.replace({ name: 'login1' })
  }

  authRedirecting = false
}

http.interceptors.request.use((config) => {
  const extConfig = config as HttpRequestConfigExt
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken
  const requestUrl = config.url || ''
  const normalizedUrl = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`
  // 登录前接口不要求 token。
  const isPreLoginRequest = PRE_LOGIN_PATHS.some((path) => normalizedUrl.includes(path))
  config.headers['Content-Type'] = 'application/json'

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

export default http

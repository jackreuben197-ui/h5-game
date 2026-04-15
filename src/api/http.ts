import axios, { type AxiosError } from 'axios'
import { showFailToast } from 'vant'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/stores/pinia'
import router from '@/router'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

let authRedirecting = false

// 统一处理登录失效：清理登录态并强制跳转到登录页。
async function forceToLogin(): Promise<void> {
  if (authRedirecting) {
    return
  }

  authRedirecting = true

  const gameStore = useGameStore(pinia)
  gameStore.clearLogin()

  const currentRoute = router.currentRoute.value
  if (currentRoute.name !== 'login') {
    const redirect = currentRoute.fullPath || '/'
    await router.replace({
      name: 'login',
      query: { redirect },
    })
  }

  authRedirecting = false
}

http.interceptors.request.use((config) => {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken
  const requestUrl = config.url || ''
  // 登录接口本身不要求 token。
  const isLoginRequest = requestUrl.includes('/user/login')
  config.headers['Content-Type'] = 'application/json'

  // 没有 token 且不是登录接口时，直接判定未登录并跳转。
  if (!token && !isLoginRequest) {
    void forceToLogin()
    return Promise.reject(new Error('未登录或登录已过期'))
  }

  if (token) {
    // 与服务端约定：使用 Md5at 请求头传 token。
    config.headers.Md5at = token
  }

  return config
})

http.interceptors.response.use(
  (response) => {
    const businessCode = (response.data as { code?: number } | undefined)?.code
    // 服务端返回 90010：token 失效，强制回登录页。
    if (businessCode === 90010) {
      void forceToLogin()
      return Promise.reject(new Error('登录已失效，请重新登录'))
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

import axios, { type AxiosError } from 'axios'
import { showFailToast } from 'vant'

const STORE_KEY = 'h5-game-store'

function readPersistedToken(): string {
  if (typeof localStorage === 'undefined') {
    return ''
  }

  const raw = localStorage.getItem(STORE_KEY)
  if (!raw) {
    return ''
  }

  try {
    const parsed = JSON.parse(raw) as { sessionToken?: string }
    return parsed.sessionToken ?? ''
  } catch {
    return ''
  }
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const token = readPersistedToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const backendMessage = error.response?.data?.message
    showFailToast(backendMessage || error.message || '请求失败，请稍后再试')
    return Promise.reject(error)
  },
)

export default http

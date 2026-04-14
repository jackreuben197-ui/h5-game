import axios, { type AxiosError } from 'axios'
import { showFailToast } from 'vant'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/stores/pinia'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken
  config.headers['Content-Type'] = 'application/json'

  if (token) {
    config.headers.Md5at = token
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

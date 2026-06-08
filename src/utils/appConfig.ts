/**
 * 运行时配置加载器（对齐 h5-download-web 的 config.json 方案）。
 *
 * 设计目标：
 *  - 构建后 dist/config.json 可直接修改即可切换 API 域名，无需重新打包。
 *  - 保持与旧 h5 项目相同的结构（baseApi / apiDomains / imageApi 等）。
 *  - 开发环境固定走 Vite 代理（/api），避免本地跨域问题。
 */
import http from '@/api/http'

// 下载信息默认参数（对齐 h5-download-web）。
export interface AppConfigDownloadParams {
  lang: string
  linkType: number
  linkTypeMahjong?: number
  linkTypeMtt?: number
  env?: number
  type?: number
}

// 下载信息接口配置（对齐 h5-download-web）。
export interface AppConfigDownloadInfo {
  endpoint: string
  testEndpoint: string
  traceHashendpoint?: string
  defaultParams: AppConfigDownloadParams
}

export interface AppConfig {
  /** 基础请求地址（含 /api），生产环境优先使用 */
  baseApi: string
  /** 可配置的 API 域名列表，便于切换 / 容灾 */
  apiDomains: string[]
  /** 新接口前缀 */
  baseApiNew: string
  /** 图片地址 */
  imageApi: string
  /** 旧接口地址 */
  oldBaseApi: string
  /** 上传地址 */
  uploadApi: string
  /** Web 部署地址 */
  webHost: string
  /** ipa 下载地址 */
  ipaUrl: string
  /** 下载信息接口配置 */
  downloadInfo: AppConfigDownloadInfo
  /** 是否测试环境 */
  isTest: boolean
}

// 运行时配置对象：init 后由 config.json 合并覆盖，全局可读。
export const appConfig: AppConfig = {
  baseApi: '',
  apiDomains: [],
  baseApiNew: '/api',
  imageApi: '',
  oldBaseApi: '',
  uploadApi: '',
  webHost: '',
  ipaUrl: '',
  downloadInfo: {
    endpoint: '',
    testEndpoint: '',
    traceHashendpoint: '',
    defaultParams: {
      lang: '',
      linkType: 0,
      linkTypeMahjong: 0,
      linkTypeMtt: 0,
      env: 0,
    },
  },
  isTest: false,
}

// 拼接 config.json 地址：支持 ?env=staging 加载 config.staging.json；
// 兼容 base: './' 的子路径部署，避免写死根路径。
function resolveConfigUrl(): string {
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const env = new URLSearchParams(search).get('env')
  const file = env === 'staging' ? 'config.staging.json' : 'config.json'
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${file}`.replace(/([^:])\/{2,}/g, '$1/')
}

/**
 * 解析最终生效的 API 基础地址。
 * 开发环境固定返回 /api（走 Vite 代理）；生产环境优先使用 config.json 的 baseApi。
 */
export function resolveApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || '/api'
  }
  return (
    appConfig.baseApi ||
    appConfig.apiDomains[0] ||
    import.meta.env.VITE_API_BASE_URL ||
    '/api'
  )
}

// 拉取 config.json 并合并进 appConfig，最后用其覆盖 axios 的基础地址。
export async function initAppConfig(): Promise<AppConfig> {
  if (typeof window === 'undefined') {
    return appConfig
  }
  try {
    const res = await fetch(`${resolveConfigUrl()}?_=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Failed to load config.json: ${res.status}`)
    }
    const data = (await res.json()) as Partial<AppConfig>
    Object.assign(appConfig, data)
  } catch (error) {
    console.warn('[appConfig] load config.json failed, using fallback:', error)
  } finally {
    // 用运行时配置覆盖 axios 基础地址（开发环境保持 /api 走代理）。
    http.defaults.baseURL = resolveApiBaseUrl()
  }
  return appConfig
}

// 模块加载即开始拉取，入口处 await 此 Promise 以保证挂载前配置就绪。
export const configReady: Promise<AppConfig> = initAppConfig()

export default appConfig

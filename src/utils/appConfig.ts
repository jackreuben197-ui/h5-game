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
  /** 生产环境基础请求地址（含 /api）：isTest 为 false 时使用 */
  baseApi: string
  /** API 域名列表：测试环境（isTest 为 true）取首项 apiDomains[0]，同时用于切换 / 容灾 */
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

// 测试环境所有 apiDomains 都不可达时的最终兜底地址。
const TEST_API_FALLBACK = 'https://preview.trackyourchoice.com/api'

// initAppConfig 解析后写入的当前生效基础地址（测试环境会先做可达性探测）。
let resolvedApiBase = ''

// 规范成「含 /api」的基础地址：去掉结尾斜杠，未带 /api 时补上。
function normalizeApiBase(raw: string): string {
  const value = (raw || '').trim().replace(/\/+$/, '')
  if (!value) {
    return ''
  }
  return /\/api$/i.test(value) ? value : `${value}/api`
}

// 探测某个基础地址是否可达：no-cors 只判断「服务器是否有响应」，network/DNS/超时失败视为不可用。
async function probeApiBase(base: string, timeoutMs = 2500): Promise<boolean> {
  if (typeof fetch === 'undefined') {
    return false
  }
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  try {
    await fetch(base, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: controller?.signal })
    return true
  } catch {
    return false
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

// 测试环境：按 apiDomains 顺序探测，取第一个可达的；都不可达时回落到 preview。
async function resolveTestApiBase(): Promise<string> {
  const candidates = appConfig.apiDomains.map(normalizeApiBase).filter(Boolean)
  if (!candidates.length) {
    return TEST_API_FALLBACK
  }
  const results = await Promise.all(candidates.map((candidate) => probeApiBase(candidate)))
  const firstReachable = candidates.find((_, index) => results[index])
  return firstReachable || TEST_API_FALLBACK
}

/**
 * 解析最终生效的 API 基础地址。
 * 开发环境固定返回 /api（走 Vite 代理）。
 * 生产/测试环境返回 initAppConfig 解析好的 resolvedApiBase（测试环境为探测后的可用地址）。
 */
export function resolveApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || '/api'
  }
  return (
    resolvedApiBase ||
    appConfig.baseApi ||
    appConfig.apiDomains[0] ||
    import.meta.env.VITE_API_BASE_URL ||
    '/api'
  )
}

// 当前生效的「绝对」基础地址（不含 DEV 的 /api 代理分支），供推导渠道主域名等使用。
export function getActiveApiBase(): string {
  return (
    resolvedApiBase ||
    (appConfig.isTest ? appConfig.apiDomains[0] : appConfig.baseApi) ||
    appConfig.baseApi ||
    appConfig.apiDomains[0] ||
    ''
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
  }

  // 解析最终基础地址：测试环境探测 apiDomains（取第一个可达，最终兜底 preview），生产环境用 baseApi。
  resolvedApiBase = appConfig.isTest
    ? await resolveTestApiBase()
    : appConfig.baseApi || appConfig.apiDomains[0] || ''

  // 用运行时配置覆盖 axios 基础地址（开发环境保持 /api 走代理）。
  http.defaults.baseURL = resolveApiBaseUrl()
  return appConfig
}

// 模块加载即开始拉取，入口处 await 此 Promise 以保证挂载前配置就绪。
export const configReady: Promise<AppConfig> = initAppConfig()

export default appConfig

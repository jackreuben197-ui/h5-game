import { defineStore } from 'pinia'
import type { PrivateUcFeeType } from '@bridge-protocol'
import { postBeforeLoginConfigApi, postGlobalConfigApi } from '@/api/config'
import type {
  DiamondConfigData,
  DiamondConfigItem,
  DiamondConfigMap,
  DiamondSetting,
  GlobalConfigData,
  MttRecordFeeConfig,
} from '@/api/models/config'
import StorageKey from '@/constants/storageKey'
import {
  PUBLIC_STORE_APP_CONFIG,
  PUBLIC_STORE_DIAMOND_CONFIG,
  readPublicCache,
  readPublicCacheEntries,
  replacePublicCacheEntries,
} from '@/utils/indexedDB'
import { localStore } from '@/utils/localStore'
import {
  CHANNEL_PACKAGE_UC_CHARGE_ENABLED,
  configurePlatformDomains,
  getPrivateUcChargeConfigs,
  isChannelPackageHost,
  type NormalizedPrivateUcConfig,
  type PrivateUcChargeConfigItemExt,
} from '@/utils/channelPackage'

interface AppConfigState {
  globalConfig: GlobalConfigData | null
  diamondConfig: DiamondConfigMap | null
  privateUcChargeConfig: PrivateUcChargeConfigItemExt[]
  privateUcMttRecordFeeConfig: MttRecordFeeConfig | null
}

let guestGlobalConfigPromise: Promise<void> | null = null
let globalConfigRefreshPromise: Promise<boolean> | null = null
let globalConfigRefreshSessionKey = ''
let globalConfigLoadedSessionKey = ''

// 兼容 global_config_resp 挂在 data 顶层或 data.data 内层两种返回结构（同 useLobbyBannerImages）。
function extractGuestGlobalConfig(
  data: Record<string, unknown> | null | undefined,
): GlobalConfigData | null {
  if (!data) return null
  const inner = data.data as Record<string, unknown> | null | undefined
  const resp = (data.global_config_resp ?? inner?.global_config_resp) as {
    global_config?: unknown
  } | null
  const config = resp?.global_config ?? inner?.global_config
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    return config as GlobalConfigData
  }
  return null
}

function toNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function normalizeSettings(raw: unknown): DiamondSetting[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = item as Record<string, unknown>
    return {
      sb: Math.floor(toNum(row.sb)),
      blind_type: Math.floor(toNum(row.blind_type)),
      price: toNum(row.price),
      discount_price: toNum(row.discount_price),
      discount: row.discount === undefined ? 1 : toNum(row.discount),
      record_floor: row.record_floor === undefined ? undefined : toNum(row.record_floor),
      record_ratio: row.record_ratio === undefined ? undefined : toNum(row.record_ratio),
      decimal_type: row.decimal_type === undefined ? undefined : Math.floor(toNum(row.decimal_type)),
    }
  })
}

function buildDiamondConfigMap(raw: DiamondConfigData): DiamondConfigMap {
  const items = Array.isArray(raw?.data) ? raw.data : []
  const map: DiamondConfigMap = {}
  for (const row of items) {
    const configType = Math.floor(toNum(row.config_type))
    const typeExt = Math.floor(toNum(row.type_ext))
    if (!configType || !typeExt) continue
    if (!map[configType]) map[configType] = {}
    map[configType][typeExt] = {
      config_type: configType,
      status: Math.floor(toNum(row.status)),
      type_ext: typeExt,
      start_time: Math.floor(toNum(row.start_time)),
      end_time: Math.floor(toNum(row.end_time)),
      setting: normalizeSettings(row.setting),
    } satisfies DiamondConfigItem
  }
  return map
}

export const useAppConfigStore = defineStore('h5-appConfig-store', {
  state: (): AppConfigState => ({
    globalConfig: null,
    diamondConfig: null,
    privateUcChargeConfig: getPrivateUcChargeConfigs(),
    privateUcMttRecordFeeConfig: null,
  }),
  getters: {
    // 对齐 Unity GameCache._clubDisplayPlatformMtt：赛事列表是否展示平台创建的 MTT/SNG。
    clubDisplayPlatformMtt(state): boolean {
      return Number(state.globalConfig?.club_display_platform_mtt) === 1
    },
    getMttRecordFeeConfig(state): (goldType: number) => MttRecordFeeConfig | null {
      return (goldType: number) => {
        const d = state.globalConfig
        if (!d) return null
        const rawJson =
          goldType === 4 ? d.record_fee_mtt_diamond :
            goldType === 3 ? d.record_fee_mtt_scoreboard :
              goldType === 2 ? d.record_fee_mtt_gc :
                d.record_fee_mtt_uc
        if (!rawJson) return null
        try { return JSON.parse(rawJson) as MttRecordFeeConfig } catch { return null }
      }
    },
    getPrivateUcChargePrice(state): (feeType: PrivateUcFeeType) => number {
      return (feeType: PrivateUcFeeType) => {
        if (!CHANNEL_PACKAGE_UC_CHARGE_ENABLED) return 0
        const price = state.privateUcChargeConfig.find((item) => item.feeType === feeType)?.price
        return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : 0
      }
    },
    getPrivateUcChargeConfig(state): (feeType: PrivateUcFeeType) => PrivateUcChargeConfigItemExt | null {
      return (feeType: PrivateUcFeeType) =>
        state.privateUcChargeConfig.find((item) => item.feeType === feeType) ?? null
    },
  },
  actions: {
    setGlobalConfig(config: GlobalConfigData): void {
      this.globalConfig = config
      configurePlatformDomains(config)
      void persistGlobalConfig(config, StorageKey.APP_CONFIG_CACHE)
        .catch((error) => {
          console.warn('[appConfig] persist app_config cache failed:', error)
        })
    },
    // 游客（无 token）场景经免鉴权聚合接口补拉全局配置；登录用户走 postAuthSync 的 /config/global/config。
    // 对齐 pokerqueen HotUpdateConfigCache：请求体为 { global_config_req: { last_update_time } }。
    async ensureGuestGlobalConfig(forceRefresh = false): Promise<void> {
      if (this.globalConfig && !forceRefresh) {
        return
      }
      if (!guestGlobalConfigPromise) {
        const configBeforeRequest = this.globalConfig
        guestGlobalConfigPromise = postBeforeLoginConfigApi({
          global_config_req: { last_update_time: 0 },
        })
          .then((response) => {
            if (Number(response.code) !== 0 || !response.data) {
              return
            }
            const config = extractGuestGlobalConfig(response.data)
            // 普通补拉只填空；首屏后台刷新允许替换本地缓存，但不能覆盖期间
            // 由真实登录 postAuthSync 写入的另一份新配置。
            if (
              config &&
              (!this.globalConfig || (forceRefresh && this.globalConfig === configBeforeRequest))
            ) {
              this.setGlobalConfig(config)
            }
          })
          .catch((error) => {
            console.warn('[appConfig] fetch guest global config failed:', error)
          })
          .finally(() => {
            guestGlobalConfigPromise = null
          })
      }
      await guestGlobalConfigPromise
    },
    // 登录态下每个 token 会话至少确认一次服务端最新配置；并发调用共享同一请求。
    async ensureFreshGlobalConfig(sessionKey: string): Promise<boolean> {
      const normalizedSessionKey = sessionKey.trim()
      if (!normalizedSessionKey) return false
      if (globalConfigLoadedSessionKey === normalizedSessionKey && this.globalConfig) return true

      if (globalConfigRefreshPromise) {
        await globalConfigRefreshPromise
        if (globalConfigLoadedSessionKey === normalizedSessionKey && this.globalConfig) return true
        return this.ensureFreshGlobalConfig(normalizedSessionKey)
      }

      globalConfigRefreshSessionKey = normalizedSessionKey
      const currentTask = postGlobalConfigApi({})
        .then((response) => {
          if (globalConfigRefreshSessionKey !== normalizedSessionKey) return false
          if (Number(response.code) !== 0 || !response.data) return false
          this.setGlobalConfig(response.data)
          globalConfigLoadedSessionKey = normalizedSessionKey
          return true
        })
        .finally(() => {
          if (globalConfigRefreshPromise !== currentTask) return
          globalConfigRefreshPromise = null
          globalConfigRefreshSessionKey = ''
        })

      globalConfigRefreshPromise = currentTask
      return currentTask
    },
    setDiamondConfig(raw: DiamondConfigData): void {
      const map = buildDiamondConfigMap(raw)
      this.diamondConfig = map
      void persistDiamondConfig(map, StorageKey.DIAMOND_CONFIG_CACHE)
        .catch((error) => {
          console.warn('[appConfig] persist diamond_config cache failed:', error)
        })
    },
    setPrivateUcChargeConfig(items: PrivateUcChargeConfigItemExt[]): void {
      this.privateUcChargeConfig = CHANNEL_PACKAGE_UC_CHARGE_ENABLED
        ? items.map((item) => ({ ...item, price: Number(item.price) || 0 }))
        : getPrivateUcChargeConfigs()
    },
    setPrivateUcConfig(config: NormalizedPrivateUcConfig): void {
      this.setPrivateUcChargeConfig(config.chargeItems)
      this.diamondConfig = CHANNEL_PACKAGE_UC_CHARGE_ENABLED ? config.diamondConfig : {}
      this.privateUcMttRecordFeeConfig = CHANNEL_PACKAGE_UC_CHARGE_ENABLED
        ? config.mttRecordFeeConfig
        : null
    },
    async restorePublicConfigCache(): Promise<void> {
      // 必须先恢复全局域名配置，才能准确判断当前是否为渠道包。
      const globalConfig = await restoreGlobalConfig(StorageKey.APP_CONFIG_CACHE)

      // 网络刷新与缓存恢复可能并行；缓存只能填空，不能覆盖刚返回的新配置。
      if (globalConfig && !this.globalConfig) {
        this.globalConfig = globalConfig
        configurePlatformDomains(globalConfig)
      }

      // 私域版本改用独立 UC 收费配置，不能再恢复旧的钻石收费缓存。
      if (isChannelPackageHost()) {
        this.diamondConfig = null
        this.privateUcMttRecordFeeConfig = null
        return
      }

      const diamondConfig = await restoreDiamondConfig(StorageKey.DIAMOND_CONFIG_CACHE)
      if (diamondConfig && !this.diamondConfig) {
        this.diamondConfig = diamondConfig
      }
    },
  },
})

async function persistGlobalConfig(
  value: GlobalConfigData,
  legacyKey: string,
): Promise<void> {
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key, itemValue]) => key && itemValue !== undefined)
    .map(([key, itemValue]) => ({
      key,
      value: itemValue,
    }))
  await replacePublicCacheEntries(PUBLIC_STORE_APP_CONFIG, entries)
  localStore.removeItem(legacyKey)
}

async function persistDiamondConfig(
  value: DiamondConfigMap,
  legacyKey: string,
): Promise<void> {
  const entries = Object.entries(value)
    .map(([configType, configValue]) => ({
      key: Number(configType),
      value: configValue,
    }))
    .filter((entry) => Number.isFinite(entry.key) && entry.key > 0)
  await replacePublicCacheEntries(PUBLIC_STORE_DIAMOND_CONFIG, entries)
  localStore.removeItem(legacyKey)
}

async function restoreGlobalConfig(
  legacyKey: string,
): Promise<GlobalConfigData | null> {
  const entries = await readPublicCacheEntries<unknown>(PUBLIC_STORE_APP_CONFIG)
  const keyedEntries = entries.filter((entry) => entry.key !== 'cache')
  if (keyedEntries.length > 0) {
    return keyedEntries.reduce<GlobalConfigData>((config, entry) => {
      config[String(entry.key)] = entry.value
      return config
    }, {})
  }

  const legacyIndexedDBCache = await readPublicCache<GlobalConfigData>(PUBLIC_STORE_APP_CONFIG)
  if (legacyIndexedDBCache) {
    await persistGlobalConfig(legacyIndexedDBCache, legacyKey)
    return legacyIndexedDBCache
  }

  const legacyCache = localStore.getItem<GlobalConfigData | null>(legacyKey, null)
  if (legacyCache) {
    await persistGlobalConfig(legacyCache, legacyKey)
    return legacyCache
  }

  return null
}

async function restoreDiamondConfig(
  legacyKey: string,
): Promise<DiamondConfigMap | null> {
  const entries = await readPublicCacheEntries<Record<number, DiamondConfigItem>>(
    PUBLIC_STORE_DIAMOND_CONFIG,
  )
  const keyedEntries = entries.filter((entry) => entry.key !== 'cache')
  if (keyedEntries.length > 0) {
    return keyedEntries.reduce<DiamondConfigMap>((config, entry) => {
      const configType = Number(entry.key)
      if (Number.isFinite(configType) && configType > 0) {
        config[configType] = entry.value
      }
      return config
    }, {})
  }

  const legacyIndexedDBCache = await readPublicCache<DiamondConfigMap>(PUBLIC_STORE_DIAMOND_CONFIG)
  if (legacyIndexedDBCache) {
    await persistDiamondConfig(legacyIndexedDBCache, legacyKey)
    return legacyIndexedDBCache
  }

  const legacyCache = localStore.getItem<DiamondConfigMap | null>(legacyKey, null)
  if (legacyCache) {
    await persistDiamondConfig(legacyCache, legacyKey)
    return legacyCache
  }

  return null
}

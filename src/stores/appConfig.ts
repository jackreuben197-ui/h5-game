import { defineStore } from 'pinia'
import { postBeforeLoginConfigApi } from '@/api/config'
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

interface AppConfigState {
  globalConfig: GlobalConfigData | null
  diamondConfig: DiamondConfigMap | null
}

let guestGlobalConfigPromise: Promise<void> | null = null

// 兼容 global_config_resp 挂在 data 顶层或 data.data 内层两种返回结构。
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
      price: toNum(row.price),
      discount_price: toNum(row.discount_price),
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
  },
  actions: {
    setGlobalConfig(config: GlobalConfigData): void {
      this.globalConfig = config
      void persistGlobalConfig(config, StorageKey.APP_CONFIG_CACHE)
        .catch((error) => {
          console.warn('[appConfig] persist app_config cache failed:', error)
        })
    },
    // 游客（无 token）场景经免鉴权聚合接口补拉全局配置；登录用户走 postAuthSync 的 /config/global/config。
    // 对齐 pokerqueen HotUpdateConfigCache：请求体为 { global_config_req: { last_update_time } }。
    async ensureGuestGlobalConfig(): Promise<void> {
      if (this.globalConfig) {
        return
      }
      if (!guestGlobalConfigPromise) {
        guestGlobalConfigPromise = postBeforeLoginConfigApi({
          global_config_req: { last_update_time: 0 },
        })
          .then((response) => {
            if (Number(response.code) !== 0 || !response.data) {
              return
            }
            const config = extractGuestGlobalConfig(response.data)
            // 登录竞态兜底：期间 postAuthSync 已写入时不覆盖。
            if (config && !this.globalConfig) {
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
    setDiamondConfig(raw: DiamondConfigData): void {
      const map = buildDiamondConfigMap(raw)
      this.diamondConfig = map
      void persistDiamondConfig(map, StorageKey.DIAMOND_CONFIG_CACHE)
        .catch((error) => {
          console.warn('[appConfig] persist diamond_config cache failed:', error)
        })
    },
    async restorePublicConfigCache(): Promise<void> {
      const [globalConfig, diamondConfig] = await Promise.all([
        restoreGlobalConfig(StorageKey.APP_CONFIG_CACHE),
        restoreDiamondConfig(StorageKey.DIAMOND_CONFIG_CACHE),
      ])

      if (globalConfig) {
        this.globalConfig = globalConfig
      }
      if (diamondConfig) {
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

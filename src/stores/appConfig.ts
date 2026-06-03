import { defineStore } from 'pinia'
import type {
  DiamondConfigData,
  DiamondConfigItem,
  DiamondConfigMap,
  DiamondSetting,
  GlobalConfigData,
  MttRecordFeeConfig,
} from '@/api/models/config'
import StorageKey from '@/constants/storageKey'
import { dzpkPersistStorage } from '@/utils/localStore'

interface AppConfigState {
  globalConfig: GlobalConfigData | null
  diamondConfig: DiamondConfigMap | null
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
    },
    setDiamondConfig(raw: DiamondConfigData): void {
      this.diamondConfig = buildDiamondConfigMap(raw)
    },
  },
  persist: [
    {
      key: StorageKey.APP_CONFIG_CACHE,
      storage: dzpkPersistStorage,
      pick: ['globalConfig'],
      serializer: {
        serialize: (state) =>
          JSON.stringify((state as Partial<AppConfigState>).globalConfig ?? null),
        deserialize: (str) => ({ globalConfig: JSON.parse(str) as GlobalConfigData | null }),
      },
    },
    {
      key: StorageKey.DIAMOND_CONFIG_CACHE,
      storage: dzpkPersistStorage,
      pick: ['diamondConfig'],
      serializer: {
        serialize: (state) =>
          JSON.stringify((state as Partial<AppConfigState>).diamondConfig ?? null),
        deserialize: (str) => ({ diamondConfig: JSON.parse(str) as DiamondConfigMap | null }),
      },
    },
  ],
})

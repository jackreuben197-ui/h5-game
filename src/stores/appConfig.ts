import { defineStore } from 'pinia'
import type { GlobalConfigData, MttRecordFeeConfig } from '@/api/models/config'
import StorageKey from '@/constants/storageKey'
import { dzpkPersistStorage } from '@/utils/localStore'

interface AppConfigState {
  globalConfig: GlobalConfigData | null
}

export const useAppConfigStore = defineStore('h5-appConfig-store', {
  state: (): AppConfigState => ({
    globalConfig: null,
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
  },
  persist: {
    key: StorageKey.APP_CONFIG_CACHE,
    storage: dzpkPersistStorage,
    pick: ['globalConfig'],
  },
})

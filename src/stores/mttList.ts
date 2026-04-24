import { defineStore } from 'pinia'
import { getAllMttSngIdsApi, getMttListApi } from '@/api/mtt'
import type {
  MttIdInfoRecord,
  MttListRecord,
  MttSeriesInfoRecord,
  SngIdInfoRecord,
} from '@/api/models/mtt'
import StorageKey from '@/constants/storageKey'
import { useGameStore } from '@/stores/game'
import { localStore } from '@/utils/localStore'

interface MttListCachePayload {
  version: number
  updatedAt: number
  token?: string
  records: MttListRecord[]
  mttIdList: MttIdInfoRecord[]
  sngIdList: SngIdInfoRecord[]
  seriesList: MttSeriesInfoRecord[]
}

interface MttListState {
  records: MttListRecord[]
  mttIdList: MttIdInfoRecord[]
  sngIdList: SngIdInfoRecord[]
  seriesList: MttSeriesInfoRecord[]
}

const MTT_LIST_CACHE_VERSION = 2

// 同一 token 会话内只拉一次：mtt/list + all/mtt/sng/ids。
let mttListLoadedToken = ''
let mttListLoadingToken = ''
let mttListLoadingPromise: Promise<void> | null = null

export const useMttListStore = defineStore('h5-mtt-list-store', {
  state: (): MttListState => ({
    records: [],
    mttIdList: [],
    sngIdList: [],
    seriesList: [],
  }),
  getters: {
    // 快速索引：match_id -> 可见性元数据（origin/relate）。
    mttIdMetaMap(state): Record<number, MttIdInfoRecord> {
      const map: Record<number, MttIdInfoRecord> = {}
      state.mttIdList.forEach((item) => {
        const matchId = Number(item.match_id || 0)
        if (matchId > 0) {
          map[matchId] = item
        }
      })
      return map
    },
    // 快速索引：series_id -> 系列信息（name/create_time/type）。
    mttSeriesMap(state): Record<number, MttSeriesInfoRecord> {
      const map: Record<number, MttSeriesInfoRecord> = {}
      state.seriesList.forEach((series) => {
        const seriesId = Number(series.id || 0)
        if (seriesId > 0) {
          map[seriesId] = series
        }
      })
      return map
    },
  },
  actions: {
    // 对外统一入口：恢复缓存 + 会话内静默拉取一次。
    bootstrapMttList(): void {
      const gameStore = useGameStore()
      const sessionToken = gameStore.sessionToken.trim()
      if (!sessionToken) {
        this.clearMttList()
        return
      }

      this.restoreMttListCacheForCurrentToken()
      void this.fetchMttListOncePerSession({ silent: true })
    },

    // 退出登录或账号切换时清空。
    clearMttList(): void {
      this.records = []
      this.mttIdList = []
      this.sngIdList = []
      this.seriesList = []
      mttListLoadedToken = ''
      mttListLoadingToken = ''
      mttListLoadingPromise = null
      localStore.removeItem(StorageKey.MTT_LIST_CACHE)
    },

    // 仅在当前 token 会话内请求一次全量列表。
    async fetchMttListOncePerSession(options: { silent?: boolean } = {}): Promise<void> {
      const gameStore = useGameStore()
      const sessionToken = gameStore.sessionToken.trim()
      if (!sessionToken) {
        return
      }

      if (mttListLoadedToken === sessionToken) {
        return
      }

      if (mttListLoadingToken === sessionToken && mttListLoadingPromise) {
        await mttListLoadingPromise
        return
      }

      mttListLoadingToken = sessionToken
      // 对齐 Unity：列表详情和可见性/系列索引都在启动阶段一次拉齐。
      mttListLoadingPromise = Promise.all([
        this.fetchMttList(options),
        this.fetchAllMttSngIds(options),
      ])
        .then(() => {
          mttListLoadedToken = sessionToken
        })
        .finally(() => {
          mttListLoadingPromise = null
          mttListLoadingToken = ''
        })

      await mttListLoadingPromise
    },

    // 全量拉取：按分页聚合 records，默认状态只取 CREATED/RUNNING（0/1）。
    async fetchMttList(options: { silent?: boolean } = {}): Promise<void> {
      const limit = 100
      let offset = 0
      let page = 0
      const maxPages = 10
      const nextRecords: MttListRecord[] = []

      try {
        while (page < maxPages) {
          const response = await getMttListApi({
            limit,
            offset,
            status: [0, 1],
            order: ['start_asc'],
          })

          const records =
            Number(response.code) === 0 && Array.isArray(response.data?.records)
              ? response.data.records
              : []

          if (records.length) {
            nextRecords.push(...records)
          }

          const total = Number(response.data?.total || 0)
          const loadedCount = offset + records.length
          if (!records.length || loadedCount >= total || records.length < limit) {
            break
          }

          offset += limit
          page += 1
        }

        this.records = nextRecords
        this.persistMttListCache()
      } catch (error) {
        // 静默刷新失败时保留旧缓存，避免页面闪空。
        if (!options.silent) {
          console.warn('[mttList] fetch list failed:', error)
        }
      }
    },

    // 可见赛事 ID + 系列信息：用于列表按“赛事系列”分组，并按 club/tribe 做可见性过滤。
    async fetchAllMttSngIds(options: { silent?: boolean } = {}): Promise<void> {
      try {
        const response = await getAllMttSngIdsApi()
        const data = Number(response.code) === 0 ? response.data : null

        this.mttIdList = Array.isArray(data?.mtt_id_list) ? data.mtt_id_list : []
        this.sngIdList = Array.isArray(data?.sng_id_list) ? data.sng_id_list : []
        this.seriesList = Array.isArray(data?.mtt_series_list) ? data.mtt_series_list : []
        this.persistMttListCache()
      } catch (error) {
        // 静默刷新失败时保留旧缓存，避免页面闪空。
        if (!options.silent) {
          console.warn('[mttList] fetch all mtt/sng ids failed:', error)
        }
      }
    },

    // 本地缓存写入：供首页与 MTT 列表页秒开共享。
    persistMttListCache(): void {
      const gameStore = useGameStore()
      const sessionToken = gameStore.sessionToken.trim()
      const payload: MttListCachePayload = {
        version: MTT_LIST_CACHE_VERSION,
        updatedAt: Date.now(),
        token: sessionToken,
        records: this.records,
        mttIdList: this.mttIdList,
        sngIdList: this.sngIdList,
        seriesList: this.seriesList,
      }
      localStore.setItem(StorageKey.MTT_LIST_CACHE, payload)
    },

    // 当前 token 对应缓存恢复；token 不同则忽略，避免串号。
    restoreMttListCacheForCurrentToken(): void {
      const gameStore = useGameStore()
      const sessionToken = gameStore.sessionToken.trim()
      if (!sessionToken) {
        this.records = []
        return
      }

      const cached = localStore.getItem<MttListCachePayload | null>(StorageKey.MTT_LIST_CACHE, null)
      if (!cached || typeof cached !== 'object') {
        return
      }
      if (!Array.isArray(cached.records) || (cached.token && cached.token !== sessionToken)) {
        return
      }

      this.records = cached.records
      // 兼容旧缓存（v1 只有 records）。
      if (cached.version === 1) {
        this.mttIdList = []
        this.sngIdList = []
        this.seriesList = []
        return
      }

      if (cached.version !== MTT_LIST_CACHE_VERSION) {
        return
      }

      this.mttIdList = Array.isArray(cached.mttIdList) ? cached.mttIdList : []
      this.sngIdList = Array.isArray(cached.sngIdList) ? cached.sngIdList : []
      this.seriesList = Array.isArray(cached.seriesList) ? cached.seriesList : []
    },
  },
})

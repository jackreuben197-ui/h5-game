import { defineStore } from 'pinia'
import { getAllMttSngIdsApi, getGuestAllMttSngIdsApi, postRoomCenterUserMatchListApi, postRoomCenterGuestMatchListApi } from '@/api/roomcenter'
import { Code, subscribeH5WsCodes } from '@/bridge/ws'
import {
  decodeMttSeriesNotifyFromRawPacket,
  decodeUserMttChangeNotifyFromRawPacket,
  decodeUserSngChangeNotifyFromRawPacket,
  GAME_ROOM_DATA_CHANGE_TYPE,
  MTT_MATCH_STATUS,
  type WsMttSeriesNotifyPayload,
  type WsRoomTribeClubRelate,
  type WsUserMttRecord,
  type WsUserSngRecord,
} from '@/bridge/ws/mttNotify'
import type {
  MttIdInfoRecord,
  MttListRecord,
  MttSeriesInfoRecord,
  SngIdInfoRecord,
} from '@/api/models/roomcenter'
import StorageKey from '@/constants/storageKey'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { isChannelPackageHost } from '@/utils/channelPackage'
import { localStore } from '@/utils/localStore'
import { createLogger } from '@/utils/logger'

const log = createLogger('[mttList]')

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
const CHANNEL_GUEST_UID = '0'
const CHANNEL_GUEST_SESSION_KEY = `user_${CHANNEL_GUEST_UID}`

// 同一 token 会话内只拉一次：mtt/list + all/mtt/sng/ids。
let mttListLoadedToken = ''
let mttListLoadingPromise: Promise<void> | null = null
let stopMttNotifyListeners: (() => void) | null = null
let mttRepairSyncPromise: Promise<void> | null = null
let pendingRepairNeedList = false
let pendingRepairNeedIds = false

function resolveMttSessionKey(): string {
  const gameStore = useGameStore()
  // 体验账号有独立 uid，但仍必须使用游客赛事接口和渠道俱乐部范围。
  if (isChannelPackageHost() && gameStore.isGuestAccount) {
    return CHANNEL_GUEST_SESSION_KEY
  }
  const uid = String(gameStore.loginUserId || '').trim()
  if (uid) {
    return `user_${uid}`
  }

  const sessionToken = gameStore.sessionToken.trim()
  if (sessionToken) {
    return `token_${sessionToken}`
  }

  if (isChannelPackageHost()) {
    return CHANNEL_GUEST_SESSION_KEY
  }

  return ''
}

function isOfficialGuestMode(): boolean {
  const gameStore = useGameStore()
  return !gameStore.sessionToken.trim() && !isChannelPackageHost()
}

function isChannelGuestSession(sessionKey: string): boolean {
  return sessionKey === CHANNEL_GUEST_SESSION_KEY
}

async function resolveGuestClubRid(): Promise<number> {
  if (!isChannelPackageHost()) {
    return 0
  }

  const userInfoStore = useUserInfoStore()
  const cachedRid = toSafeInt(userInfoStore.channelDefaultClub?.random_id)
  if (cachedRid > 0) {
    return cachedRid
  }

  const club = await userInfoStore.ensureChannelDefaultClub()
  return toSafeInt(club?.random_id)
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function chunkIds(ids: number[], size: number): number[][] {
  if (size <= 0) {
    return [ids]
  }
  if (!ids.length) {
    return []
  }

  const chunks: number[][] = []
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size))
  }
  return chunks
}

// 仅 CREATED / RUNNING 视为可见赛事；其他状态按 Unity 逻辑移除。
function isVisibleMttStatus(status: number): boolean {
  return status === MTT_MATCH_STATUS.CREATED || status === MTT_MATCH_STATUS.RUNNING
}

function mapRelateTribeClubList(relateList: WsRoomTribeClubRelate[]): Array<Record<string, unknown>> {
  return relateList.map((item) => ({
    tribe_id: toSafeInt(item.tribe_id),
    club_ids: Array.isArray(item.club_ids) ? item.club_ids.map((id) => toSafeInt(id)) : [],
  }))
}

function toMttListRecordFromWsRecord(record: WsUserMttRecord): MttListRecord {
  return {
    match_id: toSafeInt(record.match_id),
    name: record.name || '',
    game_type: toSafeInt(record.game_type),
    poker_type: toSafeInt(record.poker_type),
    series_id: toSafeInt(record.series_id),
    pinned_time: toSafeInt(record.pinned_time),
    status: toSafeInt(record.status),
    participants: toSafeInt(record.participants),
    start_time: toSafeInt(record.start_time),
    apply_start_time: toSafeInt(record.apply_start_time),
    upblind_interval: toSafeInt(record.upblind_interval),
    max_delay_apply_bl: toSafeInt(record.max_delay_apply_bl),
    apply_fee_pool: toSafeInt(record.apply_fee_pool),
    prize_base_pool: toSafeInt(record.prize_base_pool),
    prize_pool: toSafeInt(record.prize_base_pool),
    prize_type: toSafeInt(record.prize_type),
    rebuy_times: toSafeInt(record.rebuy_times),
    addon_begin_bl: toSafeInt(record.addon_begin_bl),
    addon_end_bl: toSafeInt(record.addon_end_bl),
    anti_cheat_type: toSafeInt(record.anti_cheat_type),
    mtt_banner_url: record.mtt_banner_url || '',
    game_icon: record.game_icon || '',
    limit_participants: toSafeInt(record.limit_participants),
    origin_type: toSafeInt(record.origin_type),
    relate_club_ids: Array.isArray(record.relate_club_ids)
      ? record.relate_club_ids.map((id) => toSafeInt(id))
      : [],
    relate_tribe_club_list: mapRelateTribeClubList(record.relate_tribe_club_list || []),
  }
}

function toMttIdMetaFromWsRecord(record: WsUserMttRecord): MttIdInfoRecord {
  return {
    match_id: toSafeInt(record.match_id),
    origin_type: toSafeInt(record.origin_type),
    relate_club_ids: Array.isArray(record.relate_club_ids)
      ? record.relate_club_ids.map((id) => toSafeInt(id))
      : [],
    relate_tribe_club_list: mapRelateTribeClubList(record.relate_tribe_club_list || []),
  }
}

function toSngIdMetaFromWsRecord(record: WsUserSngRecord): SngIdInfoRecord {
  return {
    sng_id: toSafeInt(record.sng_id),
    origin_type: toSafeInt(record.origin_type),
    relate_club_ids: Array.isArray(record.relate_club_ids)
      ? record.relate_club_ids.map((id) => toSafeInt(id))
      : [],
    relate_tribe_club_list: mapRelateTribeClubList(record.relate_tribe_club_list || []),
  }
}

function upsertMttIdMeta(
  list: MttIdInfoRecord[],
  nextMeta: MttIdInfoRecord,
): MttIdInfoRecord[] {
  const matchId = toSafeInt(nextMeta.match_id)
  if (!matchId) {
    return list
  }
  const nextList = list.slice()
  const index = nextList.findIndex((item) => toSafeInt(item.match_id) === matchId)
  if (index >= 0) {
    nextList[index] = {
      ...nextList[index],
      ...nextMeta,
    }
  } else {
    nextList.push(nextMeta)
  }
  return nextList
}

function upsertSngIdMeta(
  list: SngIdInfoRecord[],
  nextMeta: SngIdInfoRecord,
): SngIdInfoRecord[] {
  const sngId = toSafeInt(nextMeta.sng_id)
  if (!sngId) {
    return list
  }
  const nextList = list.slice()
  const index = nextList.findIndex((item) => toSafeInt(item.sng_id) === sngId)
  if (index >= 0) {
    nextList[index] = {
      ...nextList[index],
      ...nextMeta,
    }
  } else {
    nextList.push(nextMeta)
  }
  return nextList
}

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
    async bootstrapMttList(): Promise<void> {
      if (isOfficialGuestMode()) {
        this.clearMttList()
        return
      }

      const sessionKey = resolveMttSessionKey()
      if (!sessionKey) {
        this.clearMttList()
        return
      }

      this.restoreMttListCacheForCurrentToken()
      this.ensureMttNotifyListeners()
      await this.fetchMttListOncePerSession({ silent: true })
    },

    // 退出登录或账号切换时清空。
    clearMttList(): void {
      this.records = []
      this.mttIdList = []
      this.sngIdList = []
      this.seriesList = []
      mttListLoadedToken = ''
      mttListLoadingPromise = null
      localStore.removeItem(StorageKey.MTT_LIST_CACHE)
    },

    // 仅在当前 token 会话内请求一次全量列表。
    async fetchMttListOncePerSession(options: { silent?: boolean } = {}): Promise<void> {
      const sessionKey = resolveMttSessionKey()
      if (!sessionKey) {
        return
      }

      if (mttListLoadedToken === sessionKey) {
        return
      }

      // user/info 尚未返回时可能先以临时 token scope 启动。列表状态是全局单份，
      // 不允许不同身份的请求并发写入；先等旧任务退出，再按最新身份重试。
      if (mttListLoadingPromise) {
        await mttListLoadingPromise
        const latestSessionKey = resolveMttSessionKey()
        if (mttListLoadedToken === latestSessionKey) return
        if (latestSessionKey) {
          await this.fetchMttListOncePerSession(options)
        }
        return
      }

      // 对齐 Unity：列表详情和可见性/系列索引都在启动阶段一次拉齐。
      // 整个序列包在同一个 promise 里，避免并发 bootstrap（首页 + 列表页）重复拉取。
      const currentTask = (async () => {
        const idsLoaded = await this.fetchAllMttSngIds(options, sessionKey)
        if (resolveMttSessionKey() !== sessionKey) return
        // ids 拉取失败时跳过列表请求，保留缓存数据展示，避免把旧列表覆盖成空。
        const listLoaded = idsLoaded ? await this.fetchMttList(options, sessionKey) : false
        // 任一请求失败都不落「本会话已加载」标记，下次进入页面可重试；
        // 否则首启时机不巧（token/网络未就绪）会把空列表锁死到大退。
        if (idsLoaded && listLoaded && resolveMttSessionKey() === sessionKey) {
          mttListLoadedToken = sessionKey
        }
      })()

      mttListLoadingPromise = currentTask
      try {
        await currentTask
      } finally {
        if (mttListLoadingPromise === currentTask) {
          mttListLoadingPromise = null
        }
      }
    },

    // 全量拉取：按分页聚合 records，默认状态只取 CREATED/RUNNING（0/1）。
    // 返回是否拉取成功；失败时保留旧数据，由调用方决定是否重试。
    async fetchMttList(
      options: { silent?: boolean } = {},
      expectedSessionKey?: string,
    ): Promise<boolean> {
      const sessionKey = expectedSessionKey || resolveMttSessionKey()
      if (!sessionKey) {
        return false
      }

      const channelGuest = isChannelGuestSession(sessionKey)
      const guestClubRid = channelGuest ? await resolveGuestClubRid() : 0
      if (resolveMttSessionKey() !== sessionKey) return false
      if (channelGuest && guestClubRid <= 0) {
        this.records = []
        this.persistMttListCache()
        return false
      }

      const mttIds = this.mttIdList
        .map((item) => toSafeInt(item.match_id))
        .filter((id) => id > 0)
      const sngIds = this.sngIdList
        .map((item) => toSafeInt(item.sng_id))
        .filter((id) => id > 0)

      const mttChunks = chunkIds(mttIds, 100)
      const sngChunks = chunkIds(sngIds, 100)
      const requestCount = Math.max(mttChunks.length, sngChunks.length)
      const nextRecords: MttListRecord[] = []

      if (!requestCount) {
        this.records = []
        this.persistMttListCache()
        return true
      }

      try {
        for (let i = 0; i < requestCount; i += 1) {
          const requestMttIds = mttChunks[i] || []
          const requestSngIds = sngChunks[i] || []
          if (!requestMttIds.length && !requestSngIds.length) {
            continue
          }

          const response = channelGuest
            ? await postRoomCenterGuestMatchListApi({
              mtt_ids: requestMttIds,
              sng_ids: requestSngIds,
              room_type: 0,
              club_rid: guestClubRid,
            })
            : await postRoomCenterUserMatchListApi({
              mtt_ids: requestMttIds,
              sng_ids: requestSngIds,
              room_type: 0,
            })

          if (resolveMttSessionKey() !== sessionKey) return false

          // 任一分页返回异常码都视为失败，不落地部分数据，保留旧列表等下次重试。
          if (Number(response.code) !== 0) {
            log.warn('fetch list failed, code:', response.code)
            return false
          }

          const records = Array.isArray(response.data?.mtt_list) ? response.data.mtt_list : []
          if (records.length) {
            nextRecords.push(...records)
          }
        }

        if (resolveMttSessionKey() !== sessionKey) return false
        this.records = nextRecords
        this.persistMttListCache()
        return true
      } catch (error) {
        // 静默刷新失败时保留旧缓存，避免页面闪空。
        if (!options.silent) {
          log.warn('fetch list failed:', error)
        }
        return false
      }
    },

    // 可见赛事 ID + 系列信息：用于列表按“赛事系列”分组，并按 club/tribe 做可见性过滤。
    // 返回是否拉取成功；失败时保留旧索引，由调用方决定是否重试。
    async fetchAllMttSngIds(
      options: { silent?: boolean } = {},
      expectedSessionKey?: string,
    ): Promise<boolean> {
      try {
        const sessionKey = expectedSessionKey || resolveMttSessionKey()
        if (!sessionKey) {
          return false
        }

        const channelGuest = isChannelGuestSession(sessionKey)
        const guestClubRid = channelGuest ? await resolveGuestClubRid() : 0
        if (resolveMttSessionKey() !== sessionKey) return false
        if (channelGuest && guestClubRid <= 0) {
          this.mttIdList = []
          this.sngIdList = []
          this.seriesList = []
          this.persistMttListCache()
          return false
        }

        const response = channelGuest
          ? await getGuestAllMttSngIdsApi({ club_rid: guestClubRid })
          : await getAllMttSngIdsApi()
        if (resolveMttSessionKey() !== sessionKey) return false
        // 异常码不再把索引覆盖成空（否则会连带清空列表并被会话标记锁死），保留旧数据等重试。
        if (Number(response.code) !== 0) {
          log.warn('fetch all mtt/sng ids failed, code:', response.code)
          return false
        }
        const data = response.data

        this.mttIdList = Array.isArray(data?.mtt_id_list) ? data.mtt_id_list : []
        this.sngIdList = Array.isArray(data?.sng_id_list) ? data.sng_id_list : []
        this.seriesList = Array.isArray(data?.mtt_series_list) ? data.mtt_series_list : []
        this.persistMttListCache()
        return true
      } catch (error) {
        // 静默刷新失败时保留旧缓存，避免页面闪空。
        if (!options.silent) {
          log.warn('fetch all mtt/sng ids failed:', error)
        }
        return false
      }
    },

    // 增量通知命中不到本地缓存时，合并为一次静默补同步，避免消息风暴下重复全量请求。
    scheduleRepairSync(options: { needList?: boolean; needIds?: boolean } = {}): void {
      pendingRepairNeedList = pendingRepairNeedList || options.needList === true
      pendingRepairNeedIds = pendingRepairNeedIds || options.needIds === true

      if (mttRepairSyncPromise) {
        return
      }

      const runRepair = async (): Promise<void> => {
        const needList = pendingRepairNeedList
        const needIds = pendingRepairNeedIds
        pendingRepairNeedList = false
        pendingRepairNeedIds = false

        try {
          if (needIds) {
            await this.fetchAllMttSngIds({ silent: true })
          }

          if (needList) {
            await this.fetchMttList({ silent: true })
          }
        } finally {
          mttRepairSyncPromise = null
          if (pendingRepairNeedList || pendingRepairNeedIds) {
            this.scheduleRepairSync()
          }
        }
      }

      mttRepairSyncPromise = runRepair()
    },

    // 统一处理 MTT 相关 WS 增量通知（151/152/153）。
    applyMttNotifyByCode(code: number, rawBuffer: ArrayBufferLike): void {
      if (code === Code.MSG_S_USER_MTT_CHANGE_NOTIFY) {
        this.applyUserMttChangeNotify(rawBuffer)
        return
      }
      if (code === Code.MSG_S_USER_SNG_CHANGE_NOTIFY) {
        this.applyUserSngChangeNotify(rawBuffer)
        return
      }
      if (code === Code.MSG_S_MTT_SERIES_NOTIFY) {
        this.applyMttSeriesNotify(rawBuffer)
      }
    },

    // 对齐 Unity UserMttChangeNotify：新增/更新/不可见移除。
    applyUserMttChangeNotify(rawBuffer: ArrayBufferLike): void {
      const payload = decodeUserMttChangeNotifyFromRawPacket(rawBuffer)
      if (!payload) {
        return
      }

      const sendTimestamp = toSafeInt(payload.sendTimestamp)
      const changeType = toSafeInt(payload.changeType)

      if (changeType === GAME_ROOM_DATA_CHANGE_TYPE.ADD) {
        if (!payload.mtt) {
          return
        }
        const nextRecord = toMttListRecordFromWsRecord(payload.mtt)
        const matchId = toSafeInt(nextRecord.match_id)
        if (!matchId) {
          return
        }

        const currentList = this.records.slice()
        const index = currentList.findIndex((item) => toSafeInt(item.match_id) === matchId)
        const nextWithUpdateTime = {
          ...nextRecord,
          __wsUpdateTime: sendTimestamp,
        }
        if (index >= 0) {
          currentList[index] = {
            ...currentList[index],
            ...nextWithUpdateTime,
          }
        } else {
          currentList.push(nextWithUpdateTime)
        }

        this.records = currentList
        this.mttIdList = upsertMttIdMeta(this.mttIdList, toMttIdMetaFromWsRecord(payload.mtt))
        this.persistMttListCache()
        return
      }

      if (changeType !== GAME_ROOM_DATA_CHANGE_TYPE.UPDATE) {
        return
      }

      const mttChange = payload.mttChange
      if (!mttChange) {
        return
      }

      const matchId = toSafeInt(mttChange.match_id)
      if (!matchId) {
        return
      }

      const currentList = this.records.slice()
      const index = currentList.findIndex((item) => toSafeInt(item.match_id) === matchId)
      const status = toSafeInt(mttChange.status)
      const visible = isVisibleMttStatus(status)

      if (!visible) {
        if (index >= 0) {
          currentList.splice(index, 1)
          this.records = currentList
        }
        this.mttIdList = this.mttIdList.filter((item) => toSafeInt(item.match_id) !== matchId)
        this.persistMttListCache()
        return
      }

      if (index < 0) {
        // H5 暂无与 Unity RequestMttOne 完全对等的轻量接口，先合并为一次补同步，避免重复全量请求。
        this.scheduleRepairSync({ needList: true, needIds: true })
        return
      }

      const currentItem = currentList[index] as MttListRecord & { __wsUpdateTime?: number }
      const currentUpdateTime = toSafeInt(currentItem.__wsUpdateTime)
      if (sendTimestamp > 0 && currentUpdateTime > sendTimestamp) {
        return
      }

      currentList[index] = {
        ...currentItem,
        status,
        participants: toSafeInt(mttChange.participants),
        series_id: toSafeInt(mttChange.series_id),
        pinned_time: toSafeInt(mttChange.pinned_time),
        __wsUpdateTime: sendTimestamp,
      }
      this.records = currentList
      this.persistMttListCache()
    },

    // 对齐 Unity UserSngChangeNotify：当前 H5 不渲染 SNG 列表，但保持本地索引同步。
    applyUserSngChangeNotify(rawBuffer: ArrayBufferLike): void {
      const payload = decodeUserSngChangeNotifyFromRawPacket(rawBuffer)
      if (!payload) {
        return
      }

      const sendTimestamp = toSafeInt(payload.sendTimestamp)
      const changeType = toSafeInt(payload.changeType)

      if (changeType === GAME_ROOM_DATA_CHANGE_TYPE.ADD) {
        if (!payload.sng) {
          return
        }
        const nextMeta = {
          ...toSngIdMetaFromWsRecord(payload.sng),
          __wsUpdateTime: sendTimestamp,
          status: toSafeInt(payload.sng.status),
          series_id: toSafeInt(payload.sng.series_id),
          pinned_time: toSafeInt(payload.sng.pinned_time),
        } as SngIdInfoRecord
        this.sngIdList = upsertSngIdMeta(this.sngIdList, nextMeta)
        this.persistMttListCache()
        return
      }

      if (changeType !== GAME_ROOM_DATA_CHANGE_TYPE.UPDATE) {
        return
      }

      const sngChange = payload.sngChange
      if (!sngChange) {
        return
      }

      const sngId = toSafeInt(sngChange.sng_id)
      if (!sngId) {
        return
      }

      const status = toSafeInt(sngChange.status)
      const visible = isVisibleMttStatus(status)
      const currentList = this.sngIdList.slice()
      const index = currentList.findIndex((item) => toSafeInt(item.sng_id) === sngId)

      if (!visible) {
        if (index >= 0) {
          currentList.splice(index, 1)
          this.sngIdList = currentList
          this.persistMttListCache()
        }
        return
      }

      if (index < 0) {
        // SNG 元信息缺失时仅补一次 ids 索引，同一波通知共用一次请求。
        this.scheduleRepairSync({ needIds: true })
        return
      }

      const currentItem = currentList[index] as SngIdInfoRecord & { __wsUpdateTime?: number }
      const currentUpdateTime = toSafeInt(currentItem.__wsUpdateTime)
      if (sendTimestamp > 0 && currentUpdateTime > sendTimestamp) {
        return
      }

      currentList[index] = {
        ...currentItem,
        status,
        series_id: toSafeInt(sngChange.series_id),
        pinned_time: toSafeInt(sngChange.pinned_time),
        __wsUpdateTime: sendTimestamp,
      } as SngIdInfoRecord
      this.sngIdList = currentList
      this.persistMttListCache()
    },

    // 对齐 Unity MttSeriesNotify：按 id upsert 系列信息。
    applyMttSeriesNotify(rawBuffer: ArrayBufferLike): void {
      const payload = decodeMttSeriesNotifyFromRawPacket(rawBuffer)
      if (!payload) {
        return
      }
      this.upsertMttSeries(payload)
    },

    upsertMttSeries(payload: WsMttSeriesNotifyPayload): void {
      const seriesId = toSafeInt(payload.id)
      if (!seriesId) {
        return
      }

      const nextList = this.seriesList.slice()
      const index = nextList.findIndex((item) => toSafeInt(item.id) === seriesId)
      const nextSeries: MttSeriesInfoRecord = {
        id: seriesId,
        name: payload.name || '',
        type: toSafeInt(payload.type),
        tribe_id: toSafeInt(payload.tribe_id),
        create_time: toSafeInt(payload.create_time),
      }
      if (index >= 0) {
        nextList[index] = {
          ...nextList[index],
          ...nextSeries,
        }
      } else {
        nextList.push(nextSeries)
      }

      this.seriesList = nextList
      this.persistMttListCache()
    },

    // 本地缓存写入：供首页与 MTT 列表页秒开共享。
    persistMttListCache(): void {
      const sessionKey = resolveMttSessionKey()
      if (!sessionKey) {
        return
      }

      const payload: MttListCachePayload = {
        version: MTT_LIST_CACHE_VERSION,
        updatedAt: Date.now(),
        token: sessionKey,
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
      const sessionKey = resolveMttSessionKey()
      if (!sessionKey) {
        this.records = []
        this.mttIdList = []
        this.sngIdList = []
        this.seriesList = []
        return
      }

      const cached = localStore.getItem<MttListCachePayload | null>(StorageKey.MTT_LIST_CACHE, null)
      if (!cached || typeof cached !== 'object') {
        return
      }

      const legacyToken = gameStore.sessionToken.trim()
      const tokenMatched =
        !cached.token ||
        cached.token === sessionKey ||
        (sessionKey.startsWith('token_') && cached.token === legacyToken)

      if (!Array.isArray(cached.records) || !tokenMatched) {
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

    // 全局只绑定一次 MTT 增量监听，保证主页与列表页共享同一数据源。
    ensureMttNotifyListeners(): void {
      if (stopMttNotifyListeners) {
        return
      }

      stopMttNotifyListeners = subscribeH5WsCodes(
        [
          Code.MSG_S_USER_MTT_CHANGE_NOTIFY,
          Code.MSG_S_USER_SNG_CHANGE_NOTIFY,
          Code.MSG_S_MTT_SERIES_NOTIFY,
        ],
        (message) => {
          this.applyMttNotifyByCode(message.code, message.rawBuffer)
        },
      )
    },
  },
})

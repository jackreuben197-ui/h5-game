import { defineStore } from 'pinia'
import type { RoomRecord } from '@/api/models/roomcenter'
import { getRoomIdsApi, getRoomsDetailApi } from '@/api/roomcenter'
import { Code, subscribeH5WsCode } from '@/bridge/ws'
import {
  decodeRoomChangeNotifyFromRawPacket,
  ROOM_CHANGE_TYPE,
  type WsRoomChangeNotifyPayload,
} from '@/bridge/ws/roomChangeNotify'
import StorageKey from '@/constants/storageKey'
import { useGameStore } from '@/stores/game'
import { localStore } from '@/utils/localStore'
import { createLogger } from '@/utils/logger'

const log = createLogger('[roomList]')

interface RoomListCachePayload {
  version: number
  updatedAt: number
  token?: string
  records: RoomRecord[]
}

interface RoomListState {
  records: RoomRecord[]
}

const ROOM_LIST_CACHE_VERSION = 1

const ROOM_STATUS = {
  CREATED_NOT_START: 1,
  STARTING: 2,
  FORCE_CLOSE: 3,
  ABOUT_TO_CLOSE: 4,
} as const

// 同一 token 会话内只拉一次全量牌桌，后续依赖 WS 增量更新。
let roomListLoadedToken = ''
let roomListLoadingToken = ''
let roomListLoadingPromise: Promise<void> | null = null
const roomDetailLoadingRidSet = new Set<string>()

// WS 监听全局只注册一次，避免重复消费同一条 ROOM_CHANGE_NOTIFY。
let stopRoomChangeNotifyListener: (() => void) | null = null

export const useRoomListStore = defineStore('h5-room-list-store', {
  state: (): RoomListState => ({
    records: [],
  }),
  actions: {
    // 对外统一入口：恢复缓存 + 确保 WS 监听 + 首次静默拉取。
    bootstrapRoomList(): void {
      const gameStore = useGameStore()
      const sessionToken = gameStore.sessionToken.trim()
      if (!sessionToken) {
        this.records = []
        return
      }

      this.restoreRoomListCacheForCurrentToken()
      this.ensureRoomChangeNotifyListener()
      void this.fetchRoomsOncePerSession({ silent: true })
    },

    // 退出登录时清空房间数据，避免不同账号之间串数据。
    clearRoomList(): void {
      this.records = []
      roomListLoadedToken = ''
      roomListLoadingToken = ''
      roomListLoadingPromise = null
      localStore.removeItem(StorageKey.ROOM_LIST_CACHE)
    },

    // 仅在当前 token 会话内请求一次全量牌桌。
    async fetchRoomsOncePerSession(options: { silent?: boolean } = {}): Promise<void> {
      const gameStore = useGameStore()
      const sessionToken = gameStore.sessionToken.trim()
      if (!sessionToken) {
        return
      }

      if (roomListLoadedToken === sessionToken) {
        return
      }

      if (roomListLoadingToken === sessionToken && roomListLoadingPromise) {
        await roomListLoadingPromise
        return
      }

      roomListLoadingToken = sessionToken
      roomListLoadingPromise = this.fetchRooms(options)
        .then(() => {
          roomListLoadedToken = sessionToken
        })
        .finally(() => {
          roomListLoadingPromise = null
          roomListLoadingToken = ''
        })

      await roomListLoadingPromise
    },

    // 全量拉取流程：先 ids，再批量详情。
    async fetchRooms(options: { silent?: boolean } = {}): Promise<void> {
      try {
        const idRes = await getRoomIdsApi({})
        const idRecords =
          Number(idRes.code) === 0 && Array.isArray(idRes.data?.records) ? idRes.data.records : []

        const roomIds = idRecords
          .map((item) => Number(item?.rid))
          .filter((id) => Number.isFinite(id) && id > 0)

        if (!roomIds.length) {
          this.records = []
          this.persistRoomListCache()
          return
        }

        const detailRes = await getRoomsDetailApi({
          room_ids: roomIds,
          room_type: 0,
        })

        const records =
          Number(detailRes.code) === 0 && Array.isArray(detailRes.data?.records)
            ? detailRes.data.records
            : []
        this.records = Array.isArray(records) ? records : []
        this.persistRoomListCache()
      } catch (error) {
        // 静默刷新失败时保留旧缓存，避免页面闪空。
        if (!options.silent) {
          log.warn('fetch rooms failed:', error)
        }
      }
    },

    // 把 ROOM_CHANGE_NOTIFY 套到统一 store，所有页面共享增量结果。
    applyRoomChangeNotifyMessage(rawBuffer: ArrayBufferLike): void {
      const payload = decodeRoomChangeNotifyFromRawPacket(rawBuffer)
      if (!payload) {
        return
      }

      if (payload.changeType === ROOM_CHANGE_TYPE.ADD) {
        this.applyRoomAddChange(payload)
        return
      }

      if (payload.changeType === ROOM_CHANGE_TYPE.UPDATE) {
        this.applyRoomUpdateChange(payload)
        return
      }

      log.debug('ignore unknown room change type', payload.changeType)
    },

    // 新增房间：已存在则覆盖合并，不存在则追加。
    applyRoomAddChange(payload: WsRoomChangeNotifyPayload): void {
      const room = payload.room
      if (!room) {
        return
      }
      this.upsertRoomRecord(room, Number(payload.sendTimestamp || 0))
    },

    // 更新房间：对齐 Cocos 逻辑，离开可见状态时直接移除。
    applyRoomUpdateChange(payload: WsRoomChangeNotifyPayload): void {
      const roomChange = payload.roomChange
      if (!roomChange) {
        return
      }

      const roomRid = String(roomChange.rid || '')
      if (!roomRid) {
        return
      }

      const status = Number(roomChange.status || 0)
      const isVisibleRoom =
        status === ROOM_STATUS.CREATED_NOT_START ||
        status === ROOM_STATUS.STARTING ||
        status === ROOM_STATUS.FORCE_CLOSE ||
        status === ROOM_STATUS.ABOUT_TO_CLOSE
      const nextTimestamp = Number(payload.sendTimestamp || 0)

      const currentList = this.records.slice()
      const index = currentList.findIndex((item) => String(item.rid) === roomRid)

      if (!isVisibleRoom) {
        if (index < 0) {
          return
        }
        currentList.splice(index, 1)
        this.records = currentList
        this.persistRoomListCache()
        return
      }

      if (index < 0) {
        // 对齐 Unity：更新包命中不到本地房间时，仅补这一个房间详情，不触发整表刷新。
        log.warn('room update missing local room, request one detail', roomChange.rid)
        void this.fetchRoomDetailByRid(Number(roomChange.rid || 0), nextTimestamp)
        return
      }

      const currentRoom = currentList[index] as RoomRecord & { __wsUpdateTime?: number }
      const currentTimestamp = Number(currentRoom.__wsUpdateTime || 0)
      if (nextTimestamp > 0 && currentTimestamp > nextTimestamp) {
        return
      }

      const users = Array.isArray(roomChange.users)
        ? roomChange.users.map((item) => ({
          id: item.id,
          un: item.un,
          name: item.name,
          avatar: item.avatar,
          seat: item.seat,
        }))
        : []

      currentList[index] = {
        ...currentRoom,
        status,
        empty_seat: Number(roomChange.empty_seat || 0),
        hand_num: Number(roomChange.hand_num || 0),
        users,
        roomers: users.length,
        relate_club_ids: roomChange.relate_club_ids || [],
        relate_tribe_club_list: roomChange.relate_tribe_club_list || [],
        __wsUpdateTime: nextTimestamp,
      }

      this.records = currentList
      this.persistRoomListCache()
    },

    // 对齐 Unity RequestTableOne：仅回源单个 rid 的详情，避免 140 高频时全量刷新。
    async fetchRoomDetailByRid(rid: number, updateTimestamp = 0): Promise<void> {
      const roomId = Number(rid)
      if (!Number.isFinite(roomId) || roomId <= 0) {
        return
      }

      const roomRid = String(Math.floor(roomId))
      if (roomDetailLoadingRidSet.has(roomRid)) {
        return
      }

      roomDetailLoadingRidSet.add(roomRid)
      try {
        const detailRes = await getRoomsDetailApi({
          room_ids: [Math.floor(roomId)],
          room_type: 0,
        })

        const records =
          Number(detailRes.code) === 0 && Array.isArray(detailRes.data?.records)
            ? detailRes.data.records
            : []
        const room = records[0]
        if (!room) {
          return
        }

        this.upsertRoomRecord(room, updateTimestamp)
      } catch (error) {
        log.warn('fetch one room detail failed', { rid: roomId, error })
      } finally {
        roomDetailLoadingRidSet.delete(roomRid)
      }
    },

    // 统一房间合并入口：新增房间、补单房间详情都走这里，避免列表更新逻辑分叉。
    upsertRoomRecord(room: RoomRecord, updateTimestamp = 0): void {
      const roomRid = String(room.rid ?? '')
      if (!roomRid) {
        return
      }

      const nextRoom: RoomRecord & { __wsUpdateTime?: number } = {
        ...room,
        __wsUpdateTime: updateTimestamp > 0 ? updateTimestamp : undefined,
      }

      const currentList = this.records.slice()
      const index = currentList.findIndex((item) => String(item.rid) === roomRid)
      if (index >= 0) {
        const currentRoom = currentList[index] as RoomRecord & { __wsUpdateTime?: number }
        currentList[index] = {
          ...currentRoom,
          ...nextRoom,
          __wsUpdateTime: Math.max(
            Number(currentRoom.__wsUpdateTime || 0),
            Number(nextRoom.__wsUpdateTime || 0),
          ) || undefined,
        }
      } else {
        currentList.push(nextRoom)
      }

      this.records = currentList
      this.persistRoomListCache()
    },

    // 统一缓存写入，供首页和列表页秒开共享。
    persistRoomListCache(): void {
      const gameStore = useGameStore()
      const sessionToken = gameStore.sessionToken.trim()
      const payload: RoomListCachePayload = {
        version: ROOM_LIST_CACHE_VERSION,
        updatedAt: Date.now(),
        token: sessionToken,
        records: this.records,
      }
      localStore.setItem(StorageKey.ROOM_LIST_CACHE, payload)
    },

    // 启动时按 token 恢复缓存，避免跨账号串缓存。
    restoreRoomListCacheForCurrentToken(): void {
      const cached = localStore.getItem<RoomListCachePayload | null>(StorageKey.ROOM_LIST_CACHE, null)
      if (!cached || typeof cached !== 'object') {
        return
      }

      if (cached.version !== ROOM_LIST_CACHE_VERSION || !Array.isArray(cached.records)) {
        return
      }

      const gameStore = useGameStore()
      const sessionToken = gameStore.sessionToken.trim()
      const cachedToken = typeof cached.token === 'string' ? cached.token.trim() : ''
      if (sessionToken && cachedToken && cachedToken !== sessionToken) {
        // 本地缓存属于其他账号时，直接清空当前内存列表防串数据。
        this.records = []
        return
      }

      this.records = cached.records
    },

    // 全局只绑定一次 ROOM_CHANGE_NOTIFY 监听，保证数据源唯一。
    ensureRoomChangeNotifyListener(): void {
      if (stopRoomChangeNotifyListener) {
        return
      }

      stopRoomChangeNotifyListener = subscribeH5WsCode(Code.MSG_S_ROOM_CHANGE_NOTIFY, (message) => {
        this.applyRoomChangeNotifyMessage(message.rawBuffer)
      })
    },
  },
})

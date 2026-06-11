import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import type { RoomRecord, RoomcenterUserContrastRoomInfo } from '@/api/models/roomcenter'
import {
  getRoomIdsApi,
  getRoomsDetailApi,
  postRoomcenterUserContrastRoomsApi,
} from '@/api/roomcenter'
import { Code, subscribeH5WsCode } from '@/bridge/ws'
import {
  decodeRoomChangeNotifyFromRawPacket,
  ROOM_CHANGE_TYPE,
  type WsRoomChangeNotifyPayload,
} from '@/bridge/ws/roomChangeNotify'
import { useGameStore } from '@/stores/game'
import {
  bulkUpsertRooms,
  loadRoomsByRids,
  readScopeMeta,
  ROOM_LIST_DATA_VERSION,
  SCOPE_GUEST,
  scopeForUser,
  writeScopeMeta,
  type RoomListScope,
} from '@/utils/roomListCache'
import { createLogger } from '@/utils/logger'

const log = createLogger('[roomList]')

// 对齐 Unity GameRoomRequestPresenterBase._requestMasCount = 80。
const DETAIL_BATCH_SIZE = 80

// 与 Unity 的「活跃可见状态」对齐：CREATED_NOT_START / STARTING / FORCE_CLOSE / ABOUT_TO_CLOSE。
const ROOM_STATUS = {
  CREATED_NOT_START: 1,
  STARTING: 2,
  FORCE_CLOSE: 3,
  ABOUT_TO_CLOSE: 4,
} as const

interface RoomListState {
  records: RoomRecord[]
}

// 当前已激活的 scope（'guest' / 'user_${uid}'）。scope 切换时重置内存与同步状态。
let activeScope: RoomListScope = ''
let bootstrappedScope: RoomListScope = ''
let bootstrappingPromise: Promise<void> | null = null
// 当前 scope 的 ws 最后时间戳，热启动 contrast/rooms 的 last_time 参数。
let lastNotifyTs = 0

const roomDetailLoadingRidSet = new Set<string>()

let stopRoomChangeNotifyListener: (() => void) | null = null

// IndexedDB 写入防抖：WS 高频 patch 时只在静默期落盘。
// 200ms 兼顾「连续多条 WS 合并写一次」和「DevTools 能尽快观察到变化」。
const PERSIST_DEBOUNCE_MS = 200
let pendingPersistTimer: ReturnType<typeof setTimeout> | null = null
let pendingPersistScope: RoomListScope | null = null
// 持有「触发时取最新 records」的 getter，避免闭包旧数组引用覆盖 hot sync 写入的结果。
let pendingPersistGetter: (() => RoomRecord[]) | null = null

// 旧版 ROOM_LIST_CACHE 一次性清理。
let legacyLocalStorageCleaned = false
const LEGACY_ROOM_LIST_CACHE_KEY = 'dzpk_h5_ROOM_LIST_CACHE'

function cleanupLegacyLocalStorageOnce(): void {
  if (legacyLocalStorageCleaned) return
  legacyLocalStorageCleaned = true
  try {
    window.localStorage.removeItem(LEGACY_ROOM_LIST_CACHE_KEY)
  } catch {
    // localStorage 不可用时忽略。
  }
}

// uid 已就绪 → user scope；否则 guest scope（含「已登录但 userId 还没回来」的过渡态）。
// userId 就绪后 game.ts 的 setLoginUser 会主动再触发一次 bootstrap，自然切换到 user scope。
function resolveScope(): RoomListScope {
  const gameStore = useGameStore()
  const uid = String(gameStore.loginUserId || '').trim()
  if (uid) return scopeForUser(uid)
  return SCOPE_GUEST
}

function safeRid(record: RoomRecord): string {
  return String(record.rid ?? '')
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr]
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

// Pinia state 是 reactive Proxy，IndexedDB structured clone 不接受 Proxy（DataCloneError），
// 先 toRaw 解包顶层 + JSON 深拷贝清除嵌套 reactive。开销可接受（RoomRecord 通常几 KB）。
function toPlainRecord(record: RoomRecord): RoomRecord {
  return JSON.parse(JSON.stringify(toRaw(record))) as RoomRecord
}

function recordsToEntries(records: RoomRecord[]): Array<[string, RoomRecord]> {
  const entries: Array<[string, RoomRecord]> = []
  records.forEach((r) => {
    const rid = safeRid(r)
    if (rid) entries.push([rid, toPlainRecord(r)])
  })
  return entries
}

// 落盘：rooms 全局共享表（按 rid upsert）+ 当前 scope 的可见性（rids 列表 + 时间戳）。
async function flushPersist(scope: RoomListScope, records: RoomRecord[]): Promise<void> {
  const entries = recordsToEntries(records)
  log.debug('flushPersist scope:', scope, 'entries:', entries.length, 'lastNotifyTs:', lastNotifyTs)
  if (entries.length) {
    await bulkUpsertRooms(entries)
  }
  await writeScopeMeta(scope, {
    version: ROOM_LIST_DATA_VERSION,
    rids: entries.map(([rid]) => rid),
    lastNotifyTs,
    lastFullFetchAt: Date.now(),
  })
}

function schedulePersist(scope: RoomListScope, getRecords: () => RoomRecord[]): void {
  pendingPersistScope = scope
  pendingPersistGetter = getRecords
  if (pendingPersistTimer) {
    clearTimeout(pendingPersistTimer)
  }
  pendingPersistTimer = setTimeout(() => {
    pendingPersistTimer = null
    const targetScope = pendingPersistScope
    const getter = pendingPersistGetter
    pendingPersistScope = null
    pendingPersistGetter = null
    if (!targetScope || !getter) return
    if (targetScope !== activeScope) return
    // 触发时再取一遍 store.records，避免 setTimeout 期间被覆盖。
    void flushPersist(targetScope, getter())
  }, PERSIST_DEBOUNCE_MS)
}

export const useRoomListStore = defineStore('h5-room-list-store', {
  state: (): RoomListState => ({
    records: [],
  }),
  actions: {
    bootstrapRoomList(): void {
      cleanupLegacyLocalStorageOnce()
      const scope = resolveScope()
      this.ensureRoomChangeNotifyListener()
      log.debug('bootstrap scope:', scope, 'active:', activeScope, 'bootstrapped:', bootstrappedScope)

      if (scope !== activeScope) {
        // scope 切换：清掉内存与同步状态，让新 scope 重新从 IndexedDB 恢复。
        activeScope = scope
        bootstrappedScope = ''
        bootstrappingPromise = null
        lastNotifyTs = 0
        this.records = []
      }
      if (bootstrappedScope === scope) return
      if (bootstrappingPromise) return

      bootstrappingPromise = this.runInitialSync(scope)
        .then(() => {
          if (scope === activeScope) {
            bootstrappedScope = scope
          }
        })
        .catch((error) => {
          log.warn('initial sync failed:', error)
        })
        .finally(() => {
          bootstrappingPromise = null
          // 兜底：如果 sync 期间 setLoginUser 又切了 scope（guest → user），
          // 本次 sync 已经按旧 scope 做完早退、不会再写入；这里主动重启一次同步。
          if (activeScope && activeScope !== bootstrappedScope) {
            this.bootstrapRoomList()
          }
        })
    },

    async runInitialSync(scope: RoomListScope): Promise<void> {
      const meta = await readScopeMeta(scope)
      if (scope !== activeScope) return

      const hasLocalCache =
        meta && meta.version === ROOM_LIST_DATA_VERSION && Array.isArray(meta.rids) && meta.rids.length > 0

      if (hasLocalCache) {
        lastNotifyTs = Number(meta!.lastNotifyTs || 0)
        const cached = await loadRoomsByRids<RoomRecord>(meta!.rids)
        if (scope !== activeScope) return
        if (cached.length) {
          // 先把缓存灌入内存，让 UI 秒开。
          this.records = cached
        }
        await this.hotSync(scope, meta!.rids)
        return
      }
      await this.coldSync(scope)
    },

    // 冷启动：getRoomIdsApi → 分批 80 拉详情 → rooms 共享表 + scope.rids 整表替换。
    async coldSync(scope: RoomListScope): Promise<void> {
      const idRes = await getRoomIdsApi({})
      if (scope !== activeScope) return

      const idRecords =
        Number(idRes.code) === 0 && Array.isArray(idRes.data?.records) ? idRes.data.records : []
      const roomIds = idRecords
        .map((item) => Number(item?.rid))
        .filter((id) => Number.isFinite(id) && id > 0)

      if (!roomIds.length) {
        this.records = []
        await writeScopeMeta(scope, {
          version: ROOM_LIST_DATA_VERSION,
          rids: [],
          lastNotifyTs,
          lastFullFetchAt: Date.now(),
        })
        return
      }

      const batches = chunkArray(roomIds, DETAIL_BATCH_SIZE)
      const collected: RoomRecord[] = []
      for (const batch of batches) {
        if (scope !== activeScope) return
        try {
          const detailRes = await getRoomsDetailApi({ room_ids: batch, room_type: 0 })
          const records =
            Number(detailRes.code) === 0 && Array.isArray(detailRes.data?.records)
              ? detailRes.data.records
              : []
          if (Array.isArray(records)) collected.push(...records)
        } catch (error) {
          log.warn('cold sync batch failed:', error)
        }
      }

      if (scope !== activeScope) return
      this.records = collected
      await flushPersist(scope, collected)
    },

    // 热启动：并行拉「当前可见 rid 集合」+「本地已知房间的变化」。
    async hotSync(scope: RoomListScope, localRids: string[]): Promise<void> {
      const numericLocalRids = localRids
        .map((rid) => Number(rid))
        .filter((id) => Number.isFinite(id) && id > 0)

      let idRes: Awaited<ReturnType<typeof getRoomIdsApi>> | null = null
      let contrastRes: Awaited<ReturnType<typeof postRoomcenterUserContrastRoomsApi>> | null = null
      try {
        const result = await Promise.all([
          getRoomIdsApi({}),
          postRoomcenterUserContrastRoomsApi({
            room_ids: numericLocalRids,
            last_time: lastNotifyTs,
          }),
        ])
        idRes = result[0]
        contrastRes = result[1]
      } catch (error) {
        log.warn('hot sync request failed:', error)
        return
      }
      if (scope !== activeScope) return

      const visibleRids = new Set<string>()
      if (idRes && Number(idRes.code) === 0 && Array.isArray(idRes.data?.records)) {
        idRes.data.records.forEach((item) => {
          const rid = String(item?.rid ?? '').trim()
          if (rid) visibleRids.add(rid)
        })
      }

      const newRecordsCount = Array.isArray(contrastRes?.data?.records)
        ? contrastRes!.data.records!.length
        : 0
      const contrastsCount = Array.isArray(contrastRes?.data?.contrast_rooms)
        ? contrastRes!.data.contrast_rooms!.length
        : 0
      log.debug(
        'hotSync diff:',
        'localRids=', localRids.length,
        'visibleRids=', visibleRids.size,
        'newFromContrast=', newRecordsCount,
        'patchedFromContrast=', contrastsCount,
        'last_time=', lastNotifyTs,
      )

      // 本地有但服务端不再可见 → 仅从当前 scope 的可见列表移除，
      // rooms 共享表保留（其他用户/包可能仍然能看到）。
      const removedSet = new Set(localRids.filter((rid) => !visibleRids.has(rid)))
      if (removedSet.size) {
        this.records = this.records.filter((r) => !removedSet.has(safeRid(r)))
      }

      if (contrastRes && Number(contrastRes.code) === 0 && contrastRes.data) {
        // 新房间：完整 RoomRecord，写共享表 + 内存。
        const newRecords = Array.isArray(contrastRes.data.records) ? contrastRes.data.records : []
        newRecords.forEach((r) => this.upsertRoomRecordInternal(r, 0))

        // 变化字段：按 rid 局部 patch 内存。共享表只在 flushPersist 整体写。
        const contrasts = Array.isArray(contrastRes.data.contrast_rooms)
          ? contrastRes.data.contrast_rooms
          : []
        contrasts.forEach((c) => this.applyContrastPatch(c))
      }

      // 兜底：服务端可见但本地不知道（contrast 也没回）的 rid 单独补详情。
      const knownRids = new Set(this.records.map(safeRid))
      const missingNumericRids: number[] = []
      visibleRids.forEach((rid) => {
        if (!knownRids.has(rid)) {
          const num = Number(rid)
          if (Number.isFinite(num) && num > 0) missingNumericRids.push(num)
        }
      })
      if (missingNumericRids.length) {
        const batches = chunkArray(missingNumericRids, DETAIL_BATCH_SIZE)
        for (const batch of batches) {
          if (scope !== activeScope) return
          try {
            const res = await getRoomsDetailApi({ room_ids: batch, room_type: 0 })
            const list =
              Number(res.code) === 0 && Array.isArray(res.data?.records) ? res.data.records : []
            list.forEach((r) => this.upsertRoomRecordInternal(r, 0))
          } catch (error) {
            log.warn('fill missing detail failed:', error)
          }
        }
      }

      if (scope !== activeScope) return
      await flushPersist(scope, this.records)
    },

    applyContrastPatch(payload: RoomcenterUserContrastRoomInfo): void {
      const rid = String(payload.rid ?? '').trim()
      if (!rid) return
      const status = Number(payload.status ?? 0)
      const isVisible =
        status === ROOM_STATUS.CREATED_NOT_START ||
        status === ROOM_STATUS.STARTING ||
        status === ROOM_STATUS.FORCE_CLOSE ||
        status === ROOM_STATUS.ABOUT_TO_CLOSE

      const list = this.records.slice()
      const index = list.findIndex((item) => safeRid(item) === rid)
      if (!isVisible) {
        if (index < 0) return
        list.splice(index, 1)
        this.records = list
        return
      }
      if (index < 0) return

      const current = list[index] as RoomRecord & { __wsUpdateTime?: number }
      const users = Array.isArray(payload.users) ? payload.users : current.users
      list[index] = {
        ...current,
        status,
        empty_seat: Number(payload.empty_seat ?? current.empty_seat ?? 0),
        hand_num: Number(payload.hand_num ?? current.hand_num ?? 0),
        users,
        roomers: Array.isArray(users) ? users.length : current.roomers,
        relate_club_ids: payload.relate_club_ids ?? current.relate_club_ids ?? [],
        relate_tribe_club_list:
          payload.relate_tribe_club_list ?? current.relate_tribe_club_list ?? [],
      }
      this.records = list
    },

    // 退出登录或切号时调用：仅清内存与同步状态。
    // 注意：不删 scope.meta（rids + lastNotifyTs）也不删 rooms 表 —— 让下次同账号登录
    // 直接走 hotSync (contrast/rooms 带 last_time)，避免重复分批拉 rooms/list。
    // rooms 表是全局共享的，多用户/包都受益；如需手动清缓存可去 DevTools 删 db。
    clearRoomList(): void {
      this.records = []
      bootstrappedScope = ''
      bootstrappingPromise = null
      lastNotifyTs = 0
      activeScope = ''
      if (pendingPersistTimer) {
        clearTimeout(pendingPersistTimer)
        pendingPersistTimer = null
        pendingPersistScope = null
        pendingPersistGetter = null
      }
    },

    applyRoomChangeNotifyMessage(rawBuffer: ArrayBufferLike): void {
      const payload = decodeRoomChangeNotifyFromRawPacket(rawBuffer)
      if (!payload) return

      // 记录最新 WS 时间戳，用于下次冷启动后的增量同步参数 last_time。
      if (payload.sendTimestamp > lastNotifyTs) {
        lastNotifyTs = payload.sendTimestamp
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

    applyRoomAddChange(payload: WsRoomChangeNotifyPayload): void {
      const room = payload.room
      if (!room) return
      log.debug('ws ADD rid:', room.rid, 'ts:', payload.sendTimestamp)
      this.upsertRoomRecord(room, Number(payload.sendTimestamp || 0))
    },

    applyRoomUpdateChange(payload: WsRoomChangeNotifyPayload): void {
      const roomChange = payload.roomChange
      if (!roomChange) return

      const roomRid = String(roomChange.rid || '')
      if (!roomRid) return

      const status = Number(roomChange.status || 0)
      const isVisibleRoom =
        status === ROOM_STATUS.CREATED_NOT_START ||
        status === ROOM_STATUS.STARTING ||
        status === ROOM_STATUS.FORCE_CLOSE ||
        status === ROOM_STATUS.ABOUT_TO_CLOSE
      const nextTimestamp = Number(payload.sendTimestamp || 0)

      const currentList = this.records.slice()
      const index = currentList.findIndex((item) => safeRid(item) === roomRid)

      if (!isVisibleRoom) {
        if (index < 0) return
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

    async fetchRoomDetailByRid(rid: number, updateTimestamp = 0): Promise<void> {
      const roomId = Number(rid)
      if (!Number.isFinite(roomId) || roomId <= 0) return

      const roomRid = String(Math.floor(roomId))
      if (roomDetailLoadingRidSet.has(roomRid)) return

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
        if (!room) return
        this.upsertRoomRecord(room, updateTimestamp)
      } catch (error) {
        log.warn('fetch one room detail failed', { rid: roomId, error })
      } finally {
        roomDetailLoadingRidSet.delete(roomRid)
      }
    },

    upsertRoomRecord(room: RoomRecord, updateTimestamp = 0): void {
      this.upsertRoomRecordInternal(room, updateTimestamp)
      this.persistRoomListCache()
    },

    // 不触发持久化的内部版本，供批量调用方在循环结束后统一 flush。
    upsertRoomRecordInternal(room: RoomRecord, updateTimestamp = 0): void {
      const roomRid = safeRid(room)
      if (!roomRid) return

      const nextRoom: RoomRecord & { __wsUpdateTime?: number } = {
        ...room,
        __wsUpdateTime: updateTimestamp > 0 ? updateTimestamp : undefined,
      }

      const currentList = this.records.slice()
      const index = currentList.findIndex((item) => safeRid(item) === roomRid)
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
    },

    persistRoomListCache(): void {
      const scope = resolveScope()
      schedulePersist(scope, () => this.records)
    },

    ensureRoomChangeNotifyListener(): void {
      if (stopRoomChangeNotifyListener) return
      stopRoomChangeNotifyListener = subscribeH5WsCode(Code.MSG_S_ROOM_CHANGE_NOTIFY, (message) => {
        this.applyRoomChangeNotifyMessage(message.rawBuffer)
      })
    },
  },
})

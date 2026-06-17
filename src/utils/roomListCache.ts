import { createLogger } from '@/utils/logger'

// 牌桌列表 IndexedDB 缓存。
//
// 设计目标：rid 维度的房间详情在多个用户/包之间共享，不重复存。
//   - 同一 club 的房间，用户A、用户B、渠道包、官方包看到的都是同一份 record，
//     按 rid 唯一存放。
//   - 谁能看到哪些 rid 是「可见性」维度的事，按 scope（user_${uid} / guest）隔离记录。
//
// 表结构（单一 db room_list_shared）：
//   - rooms：rid(string) → RoomRecord & { __wsUpdateTime }（全局共享）
//   - scopes：scope_key(string) → ScopeMeta { rids, lastNotifyTs, lastFullFetchAt, version }
//
// 升级数据结构时把 DB_VERSION + 1；旧用户下次 open 触发 onupgradeneeded 补建 store。

const log = createLogger('[room-list-cache]')

const DB_NAME = 'room_list_shared'
const DB_VERSION = 1
const STORE_ROOMS = 'rooms'
const STORE_SCOPES = 'scopes'

export const ROOM_LIST_DATA_VERSION = 4

// scope_key 形如 'guest' 或 'user_${uid}'。
export type RoomListScope = string

export interface ScopeMeta {
  version: number
  rids: string[]
  lastNotifyTs: number
  lastFullFetchAt: number
}

export const SCOPE_GUEST: RoomListScope = 'guest'
export function scopeForUser(uid: string): RoomListScope {
  return `user_${uid}`
}

let _dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise
  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_ROOMS)) {
        db.createObjectStore(STORE_ROOMS)
      }
      if (!db.objectStoreNames.contains(STORE_SCOPES)) {
        db.createObjectStore(STORE_SCOPES)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }).catch((err) => {
    _dbPromise = null
    throw err
  })
  return _dbPromise
}

async function withRead<T>(fn: (db: IDBDatabase) => Promise<T>, fallback: T): Promise<T> {
  try {
    const db = await openDB()
    return await fn(db)
  } catch (error) {
    log.warn('read failed:', error)
    return fallback
  }
}

async function withWrite(fn: (db: IDBDatabase) => Promise<void>): Promise<void> {
  try {
    const db = await openDB()
    await fn(db)
  } catch (error) {
    log.warn('write failed:', error)
  }
}

// 按 rid 列表批量读 rooms。命中的房间按原顺序返回；找不到的忽略。
export function loadRoomsByRids<T>(rids: string[]): Promise<T[]> {
  if (!rids.length) return Promise.resolve([])
  return withRead<T[]>(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(STORE_ROOMS, 'readonly')
        const store = tx.objectStore(STORE_ROOMS)
        const out: T[] = []
        let remaining = rids.length
        rids.forEach((rid) => {
          const req = store.get(rid)
          req.onsuccess = () => {
            if (req.result !== undefined) out.push(req.result as T)
            remaining -= 1
            if (remaining === 0) resolve(out)
          }
          req.onerror = () => {
            remaining -= 1
            if (remaining === 0) resolve(out)
          }
        })
        tx.onerror = () => reject(tx.error)
      }),
    [],
  )
}

// 写 rooms 表，rid 已存在则覆盖。不影响 scopes。
export function bulkUpsertRooms<T>(entries: Array<[string, T]>): Promise<void> {
  if (!entries.length) return Promise.resolve()
  return withWrite((db) =>
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_ROOMS, 'readwrite')
      const store = tx.objectStore(STORE_ROOMS)
      entries.forEach(([rid, record]) => store.put(record, rid))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }),
  )
}

// 全局删除某些 rid 的 rooms 记录。仅在确认房间真的关闭（WS UPDATE 状态非活跃）时调用。
// scope 的 rids 列表移除应另外用 writeScopeMeta 完成。
export function removeRoomsGlobal(rids: string[]): Promise<void> {
  if (!rids.length) return Promise.resolve()
  return withWrite((db) =>
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_ROOMS, 'readwrite')
      const store = tx.objectStore(STORE_ROOMS)
      rids.forEach((rid) => store.delete(rid))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }),
  )
}

export function readScopeMeta(scope: RoomListScope): Promise<ScopeMeta | null> {
  return withRead<ScopeMeta | null>(
    (db) =>
      new Promise<ScopeMeta | null>((resolve, reject) => {
        const req = db.transaction(STORE_SCOPES, 'readonly').objectStore(STORE_SCOPES).get(scope)
        req.onsuccess = () => resolve((req.result as ScopeMeta | undefined) ?? null)
        req.onerror = () => reject(req.error)
      }),
    null,
  )
}

export function writeScopeMeta(scope: RoomListScope, meta: ScopeMeta): Promise<void> {
  return withWrite((db) =>
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SCOPES, 'readwrite')
      tx.objectStore(STORE_SCOPES).put(meta, scope)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }),
  )
}

// 登出 / 切号时调用。仅清当前 scope 的可见性记录，不动 rooms 共享表。
export function deleteScope(scope: RoomListScope): Promise<void> {
  return withWrite((db) =>
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SCOPES, 'readwrite')
      tx.objectStore(STORE_SCOPES).delete(scope)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }),
  )
}

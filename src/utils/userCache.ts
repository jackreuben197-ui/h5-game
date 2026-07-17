import { type UserCacheStoreName, openUserIndexedDB } from '@/utils/indexedDB'
import { createLogger } from '@/utils/logger'

const log = createLogger('[user-cache]')

export type UserCacheKey = IDBValidKey

// Vue 的 reactive Proxy 过不了 IndexedDB 的结构化克隆（DataCloneError，
// put 内部只 warn 不抛，会静默写失败）。往 put 传 ref/reactive 里的数据前
// 先用它深拷成 plain 对象；仅适用于 JSON 安全的数据（本项目缓存均满足）。
export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export interface UserCache {
  get<T>(store: UserCacheStoreName, key: UserCacheKey): Promise<T | null>
  getAll<T>(store: UserCacheStoreName, range?: IDBKeyRange): Promise<T[]>
  put<T>(store: UserCacheStoreName, key: UserCacheKey, value: T): Promise<void>
  /**
   * 范围替换：先按 range 删（或整表 clear），再批量 put。
   * - 用户级数据（如 club_list）：不传 range，整表替换。
   * - 俱乐部级数据（key 形如 [clubId, subId]）：传
   *   IDBKeyRange.bound([clubId], [clubId, []])，只替换该 club 的分片。
   */
  bulkReplace<T>(
    store: UserCacheStoreName,
    entries: Array<[UserCacheKey, T]>,
    range?: IDBKeyRange,
  ): Promise<void>
  delete(store: UserCacheStoreName, keyOrRange: UserCacheKey | IDBKeyRange): Promise<void>
  clear(store: UserCacheStoreName): Promise<void>
}

function normalizeUserId(userId: unknown): string {
  return userId === undefined || userId === null ? '' : String(userId).trim()
}

// 同一用户的 db 连接复用，避免每次 op 都走 indexedDB.open。
// 打开失败时把 promise 从缓存里剔除，允许后续重试。
const _dbCache = new Map<string, Promise<IDBDatabase>>()

function getDB(userId: string): Promise<IDBDatabase> {
  let promise = _dbCache.get(userId)
  if (!promise) {
    promise = openUserIndexedDB(userId).catch((error) => {
      _dbCache.delete(userId)
      throw error
    })
    _dbCache.set(userId, promise)
  }
  return promise
}

export function userCache(userId: string | number): UserCache {
  const id = normalizeUserId(userId)

  async function read<T>(handler: (db: IDBDatabase) => Promise<T>, fallback: T): Promise<T> {
    if (!id) return fallback
    try {
      const db = await getDB(id)
      return await handler(db)
    } catch (error) {
      log.warn('userCache read failed:', error)
      return fallback
    }
  }

  async function write(handler: (db: IDBDatabase) => Promise<void>): Promise<void> {
    if (!id) return
    try {
      const db = await getDB(id)
      await handler(db)
    } catch (error) {
      log.warn('userCache write failed:', error)
    }
  }

  const api: UserCache = {
    get<T>(store: UserCacheStoreName, key: UserCacheKey): Promise<T | null> {
      return read<T | null>(
        (db) =>
          new Promise<T | null>((resolve, reject) => {
            const req = db.transaction(store, 'readonly').objectStore(store).get(key)
            req.onsuccess = () => resolve((req.result as T | undefined) ?? null)
            req.onerror = () => reject(req.error)
          }),
        null,
      )
    },

    getAll<T>(store: UserCacheStoreName, range?: IDBKeyRange): Promise<T[]> {
      return read<T[]>(
        (db) =>
          new Promise<T[]>((resolve, reject) => {
            const req = db.transaction(store, 'readonly').objectStore(store).getAll(range)
            req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as T[]) : [])
            req.onerror = () => reject(req.error)
          }),
        [],
      )
    },

    put<T>(store: UserCacheStoreName, key: UserCacheKey, value: T): Promise<void> {
      return write(
        (db) =>
          new Promise<void>((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite')
            tx.objectStore(store).put(value, key)
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
          }),
      )
    },

    bulkReplace<T>(
      store: UserCacheStoreName,
      entries: Array<[UserCacheKey, T]>,
      range?: IDBKeyRange,
    ): Promise<void> {
      return write(
        (db) =>
          new Promise<void>((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite')
            const objStore = tx.objectStore(store)
            if (range) {
              objStore.delete(range)
            } else {
              objStore.clear()
            }
            entries.forEach(([key, value]) => {
              objStore.put(value, key)
            })
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
          }),
      )
    },

    delete(store: UserCacheStoreName, keyOrRange: UserCacheKey | IDBKeyRange): Promise<void> {
      return write(
        (db) =>
          new Promise<void>((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite')
            tx.objectStore(store).delete(keyOrRange)
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
          }),
      )
    },

    clear(store: UserCacheStoreName): Promise<void> {
      return write(
        (db) =>
          new Promise<void>((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite')
            tx.objectStore(store).clear()
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
          }),
      )
    },
  }
  return api
}

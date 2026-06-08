const PUBLIC_CACHE_DB_NAME = 'public_cache'
const PUBLIC_CACHE_DB_VERSION = 2
const PUBLIC_CACHE_RECORD_KEY = 'cache'

export const PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE = 'multi_language_template'
export const PUBLIC_STORE_APP_CONFIG = 'app_config'
export const PUBLIC_STORE_DIAMOND_CONFIG = 'diamond_config'

export type PublicCacheStoreName =
  | typeof PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE
  | typeof PUBLIC_STORE_APP_CONFIG
  | typeof PUBLIC_STORE_DIAMOND_CONFIG

const PUBLIC_CACHE_STORES: PublicCacheStoreName[] = [
  PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE,
  PUBLIC_STORE_APP_CONFIG,
  PUBLIC_STORE_DIAMOND_CONFIG,
]

export function openPublicIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PUBLIC_CACHE_DB_NAME, PUBLIC_CACHE_DB_VERSION)
    req.onupgradeneeded = () => {
      PUBLIC_CACHE_STORES.forEach((storeName) => {
        if (!req.result.objectStoreNames.contains(storeName)) {
          req.result.createObjectStore(storeName)
        }
      })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function readPublicCache<T>(
  storeName: PublicCacheStoreName,
  key = PUBLIC_CACHE_RECORD_KEY,
): Promise<T | null> {
  const db = await openPublicIndexedDB()
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(storeName, 'readonly')
      .objectStore(storeName)
      .get(key)
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function writePublicCache<T>(
  storeName: PublicCacheStoreName,
  value: T,
  key = PUBLIC_CACHE_RECORD_KEY,
): Promise<void> {
  const db = await openPublicIndexedDB()
  await new Promise<void>((resolve, reject) => {
    const req = db
      .transaction(storeName, 'readwrite')
      .objectStore(storeName)
      .put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function readPublicCacheEntries<T>(
  storeName: PublicCacheStoreName,
): Promise<Array<{ key: IDBValidKey; value: T }>> {
  const db = await openPublicIndexedDB()
  return new Promise((resolve, reject) => {
    const entries: Array<{ key: IDBValidKey; value: T }> = []
    const req = db
      .transaction(storeName, 'readonly')
      .objectStore(storeName)
      .openCursor()

    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) {
        resolve(entries)
        return
      }
      entries.push({
        key: cursor.key,
        value: cursor.value as T,
      })
      cursor.continue()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function replacePublicCacheEntries<T>(
  storeName: PublicCacheStoreName,
  entries: Array<{ key: IDBValidKey; value: T }>,
): Promise<void> {
  const db = await openPublicIndexedDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.clear()
    entries.forEach((entry) => {
      store.put(entry.value, entry.key)
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

const USER_CACHE_DB_PREFIX = 'h5_cache_user_'
const USER_CACHE_DB_VERSION = 1

export const USER_STORE_CLUB_LIST = 'club_list'

const USER_CACHE_STORES = [USER_STORE_CLUB_LIST] as const

export function openUserIndexedDB(userId: string | number): Promise<IDBDatabase> {
  const id = userId === undefined || userId === null ? '' : String(userId).trim()
  if (!id) {
    return Promise.reject(new Error('openUserIndexedDB: empty userId'))
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(`${USER_CACHE_DB_PREFIX}${id}`, USER_CACHE_DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      USER_CACHE_STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store)
        }
      })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

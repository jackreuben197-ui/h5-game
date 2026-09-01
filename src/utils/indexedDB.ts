const PUBLIC_CACHE_DB_NAME = 'public_cache'
const PUBLIC_CACHE_DB_VERSION = 3
const PUBLIC_CACHE_RECORD_KEY = 'cache'

export const PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE = 'multi_language_template'
export const PUBLIC_STORE_APP_CONFIG = 'app_config'
export const PUBLIC_STORE_DIAMOND_CONFIG = 'diamond_config'
export const PUBLIC_STORE_BANNER_LOBBY = 'banner_lobby'

export type PublicCacheStoreName =
  | typeof PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE
  | typeof PUBLIC_STORE_APP_CONFIG
  | typeof PUBLIC_STORE_DIAMOND_CONFIG
  | typeof PUBLIC_STORE_BANNER_LOBBY

const PUBLIC_CACHE_STORES: PublicCacheStoreName[] = [
  PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE,
  PUBLIC_STORE_APP_CONFIG,
  PUBLIC_STORE_DIAMOND_CONFIG,
  PUBLIC_STORE_BANNER_LOBBY,
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

// === 用户级缓存 ==============================================================
// 每个用户独立一个 db：user_cache_${userId}（h5 与 cocos 共用同一个库，
// 由 bridge 把 cocos 的 put/get 转交给本进程，避免双端各开一份 db）。
// 新增 store：① 加常量 ② 加进 UserCacheStoreName union 与 USER_CACHE_STORES
// ③ 把 USER_CACHE_DB_VERSION + 1（旧用户下次 open 会触发 onupgradeneeded 补建 store）。
const USER_CACHE_DB_PREFIX = 'user_cache_'
const USER_CACHE_DB_VERSION = 9

export const USER_STORE_CLUB_LIST = 'club_list'
// 生涯单一 store：战绩(record)与数据(data)合用一个 object store，
// key 形如 `${sourceId}_${type}_${filter}_${variant}` —— sourceId: -1=朋友桌 / 0=全部俱乐部 / n=俱乐部 id；
// type: record | data；filter: today|week|month 或 allin|personal|deck|opponent；variant: nlh|plo|6+|cowboy|mahjong|mtt 等。
// 牌谱与战绩详情仍走单 key：hand-${roomId} / detail-${roomId}（同 room_id 全局唯一，不需 source 区分）。
export const USER_STORE_CAREER = 'career'
export const USER_STORE_BILL_DATA = 'bill_data'
// 牌谱页（我的-牌谱）专用：与 cocos 的 game_replays（牌局录像）区分开。
// key 形如 `${gameKey}_${modeKey}`，gameKey ∈ {texas, sixplus, omaha}，modeKey ∈ {recent, collected}。
// 服务端牌谱写入后不再变更，所以二次请求只会增加，不会减少 / 修改，缓存可以放心和服务端结果做并集。
export const USER_STORE_H5_REPLAY = 'h5_replay'
// 俱乐部管理（基金管理 / 牌局记录 / 牌局详情）共用 store，key 首段区分业务：
//   `${clubId}_fund_summary` / `${clubId}_fund_members` / `${clubId}_fund_records_${range}_${type}`
//   `${clubId}_roomhistory_summary_v2_${currency}_${dateRange}_${timezone}` /
//   `${clubId}_roomhistory_list_v2_${currency}_${dateRange}_${timezone}`
//   `${clubId}_roomdetail_${roomId}_${matchId}`
// 列表类 value 连同 offset/hasMore 一起存，触底加载后回写累计结果（更新而非覆盖）。
export const USER_STORE_CLUB_MANAGE = 'club_manage'
// 消息中心（系统消息 / 带入申请 / UC 充值申请）共用 store，key 按接口的真实作用域拼，
// 拼接规则集中在 utils/messageCenterCache.ts：
//   `system_${msgType}` / `other_${msgType}` —— /msg/message/list 不带 X-Club，按 msg_type 分桶即可；
//   `credit_apply` —— /roomcenter/user/apply/list 不带俱乐部参数，用户维度全局一份；
//   `${clubId}_uc_apply` —— /order/club/member_order/list 请求会自动带 X-Club，按当前俱乐部分桶。
// value 连同 offset/total/hasMore 一起存，触底加载后回写累计结果（更新而非覆盖）。
// 审核（同意/拒绝）不止发生在消息页：GlobalMessageTodoNotice 悬浮窗和 MSG_S_TODO_LIST
// WS 推送也会让 credit/uc 数据过期，这两处也需要经 messageCenterCache 的失效函数同步。
export const USER_STORE_MESSAGE = 'message'

// cocos 通过 bridge 写入的 store；与 h5 自己的 store 同库不同名，
// h5 对 bridge 收到的 store 必须做白名单校验，未列入这里的请求一律忽略。
export const CC_STORE_TABLE_USER_BASE_INFO = 'table_user_base_info'
export const CC_STORE_TABLE_USER_DATA_INFO = 'table_user_data_info'
export const CC_STORE_GAME_REPLAYS = 'game_replays'

export type CcCacheStoreName =
  | typeof CC_STORE_TABLE_USER_BASE_INFO
  | typeof CC_STORE_TABLE_USER_DATA_INFO
  | typeof CC_STORE_GAME_REPLAYS

export const CC_CACHE_STORES: CcCacheStoreName[] = [
  CC_STORE_TABLE_USER_BASE_INFO,
  CC_STORE_TABLE_USER_DATA_INFO,
  CC_STORE_GAME_REPLAYS,
]

export type UserCacheStoreName =
  | typeof USER_STORE_CLUB_LIST
  | typeof USER_STORE_CAREER
  | typeof USER_STORE_BILL_DATA
  | typeof USER_STORE_H5_REPLAY
  | typeof USER_STORE_CLUB_MANAGE
  | typeof USER_STORE_MESSAGE
  | CcCacheStoreName

const USER_CACHE_STORES: UserCacheStoreName[] = [
  USER_STORE_CLUB_LIST,
  USER_STORE_CAREER,
  USER_STORE_BILL_DATA,
  USER_STORE_H5_REPLAY,
  USER_STORE_CLUB_MANAGE,
  USER_STORE_MESSAGE,
  ...CC_CACHE_STORES,
]

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

export async function readUserCache<T>(
  userId: string | number,
  storeName: UserCacheStoreName,
  key: string,
): Promise<T | null> {
  const db = await openUserIndexedDB(userId)
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).get(key)
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function writeUserCache<T>(
  userId: string | number,
  storeName: UserCacheStoreName,
  value: T,
  key: string,
): Promise<void> {
  const db = await openUserIndexedDB(userId)
  await new Promise<void>((resolve, reject) => {
    const req = db.transaction(storeName, 'readwrite').objectStore(storeName).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

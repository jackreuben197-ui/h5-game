// Cocos 端通过 bridge 把所有 indexedDB / localStorage 操作转交给 H5 执行，
// 让两端共用 user_cache_${userId} 这一份 IndexedDB，并把 cocos 命名空间下的
// localStorage 与 H5 自己的 dzpk_h5_* 隔离开（实际写入用 dzpk_cc_ 前缀）。
//
// 协议（详见 bridge/protocol/cocosToH5.ts、h5ToCocos.ts）：
//   CC -> H5  ccStorageOp        请求一次读 / 写
//   H5 -> CC  ccStorageResult    按 requestId 回包
//   H5 -> CC  ccStorageSnapshot  握手完成后把 cc 前缀下的 localStorage 全量回灌
//
// 安全约束：
//   - indexedDB store 必须命中白名单（CC_CACHE_STORES），未命中直接 ok=false 返回，
//     避免 cocos 误填表名把 h5 自己的 club_list 等表覆盖。
//   - localStorage 始终带 dzpk_cc_ 前缀写入，cocos 无法借此读 / 写 H5 自己的键。

import {
  onBridgeHandshakeDone,
  sendBridgeMessage,
  subscribeCocosMessages,
} from '../core/cocosBridgeChannel'
import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  type CcIndexedDBOpPayload,
  type CcLocalStorageOpPayload,
  type CcStorageOpPayload,
  type CcStorageResultPayload,
  type CcStorageSnapshotPayload,
} from '../protocol'
import { useUserInfoStore } from '@/stores/userInfo'
import {
  CC_CACHE_STORES,
  type CcCacheStoreName,
  openUserIndexedDB,
} from '@/utils/indexedDB'
import { createLogger } from '@/utils/logger'

const log = createLogger('[bridge][cc-storage]')

const CC_LOCAL_PREFIX = 'dzpk_cc_'
const ALLOWED_CC_STORES = new Set<string>(CC_CACHE_STORES)

let installed = false
let teardown: (() => void) | null = null

export function installCcStorageProxy(): () => void {
  if (installed) {
    return () => undefined
  }
  installed = true

  const unsubscribe = subscribeCocosMessages(
    (message) => {
      if (message.action !== BRIDGE_ACTION.CC_STORAGE_OP) {
        return
      }
      void handleCcStorageOp(message.payload as CcStorageOpPayload | null | undefined)
    },
    { msgtype: BRIDGE_MSG_TYPE.H5 },
  )

  const offHandshake = onBridgeHandshakeDone(() => {
    pushLocalStorageSnapshot()
  })

  teardown = () => {
    unsubscribe()
    offHandshake()
    installed = false
    teardown = null
  }
  return teardown
}

export function uninstallCcStorageProxy(): void {
  teardown?.()
}

async function handleCcStorageOp(payload: CcStorageOpPayload | null | undefined): Promise<void> {
  if (!payload || typeof payload !== 'object') {
    return
  }

  if (payload.storage === 'indexeddb') {
    await handleIndexedDBOp(payload)
    return
  }
  if (payload.storage === 'localstorage') {
    handleLocalStorageOp(payload)
    return
  }
  log.warn('unknown storage type:', payload)
}

// ─── indexedDB ──────────────────────────────────────────────────────────────

async function handleIndexedDBOp(payload: CcIndexedDBOpPayload): Promise<void> {
  const { requestId, store, op } = payload
  if (!requestId) {
    log.warn('indexeddb op missing requestId, dropped:', payload)
    return
  }

  if (!ALLOWED_CC_STORES.has(store)) {
    log.warn('indexeddb store not allowed, dropped:', store)
    reply({ requestId, ok: false, error: 'store_not_allowed' })
    return
  }

  const userId = resolveUserId()
  if (!userId) {
    reply({ requestId, ok: false, error: 'no_user' })
    return
  }

  try {
    const db = await openUserIndexedDB(userId)
    const value = await runIndexedDBOp(db, store as CcCacheStoreName, op, payload.key, payload.value)
    reply({ requestId, ok: true, value })
  } catch (error) {
    log.warn('indexeddb op failed:', error)
    reply({ requestId, ok: false, error: errorMessage(error) })
  }
}

function runIndexedDBOp(
  db: IDBDatabase,
  store: CcCacheStoreName,
  op: CcIndexedDBOpPayload['op'],
  key: IDBValidKey | undefined,
  value: unknown,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const mode: IDBTransactionMode = op === 'get' || op === 'getAll' ? 'readonly' : 'readwrite'
    const tx = db.transaction(store, mode)
    const objectStore = tx.objectStore(store)
    let result: unknown = null

    try {
      switch (op) {
        case 'get': {
          if (key === undefined) {
            reject(new Error('missing_key'))
            return
          }
          const req = objectStore.get(key)
          req.onsuccess = () => {
            result = (req.result as unknown) ?? null
          }
          req.onerror = () => reject(req.error)
          break
        }
        case 'getAll': {
          const req = objectStore.getAll()
          req.onsuccess = () => {
            result = Array.isArray(req.result) ? req.result : []
          }
          req.onerror = () => reject(req.error)
          break
        }
        case 'put': {
          if (key === undefined) {
            reject(new Error('missing_key'))
            return
          }
          objectStore.put(value, key)
          break
        }
        case 'delete': {
          if (key === undefined) {
            reject(new Error('missing_key'))
            return
          }
          objectStore.delete(key)
          break
        }
        case 'clear': {
          objectStore.clear()
          break
        }
        default:
          reject(new Error(`unknown_op:${String(op)}`))
          return
      }
    } catch (error) {
      reject(error)
      return
    }

    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

// ─── localStorage ────────────────────────────────────────────────────────────

function handleLocalStorageOp(payload: CcLocalStorageOpPayload): void {
  // 写类 op（set/remove/clear）大多是 fire-and-forget，requestId 可能不带；
  // 只有需要回包时才走 reply()，否则静默处理。
  const requestId = payload.requestId
  const ack = (ok: boolean, value?: unknown, error?: string): void => {
    if (!requestId) return
    reply({ requestId, ok, value, error })
  }

  try {
    switch (payload.op) {
      case 'get': {
        if (!payload.key) {
          ack(false, undefined, 'missing_key')
          return
        }
        const value = window.localStorage.getItem(CC_LOCAL_PREFIX + payload.key)
        ack(true, value)
        return
      }
      case 'set': {
        if (!payload.key) {
          ack(false, undefined, 'missing_key')
          return
        }
        window.localStorage.setItem(CC_LOCAL_PREFIX + payload.key, payload.value ?? '')
        ack(true)
        return
      }
      case 'remove': {
        if (!payload.key) {
          ack(false, undefined, 'missing_key')
          return
        }
        window.localStorage.removeItem(CC_LOCAL_PREFIX + payload.key)
        ack(true)
        return
      }
      case 'clear': {
        clearCcLocalStorage()
        ack(true)
        return
      }
      default:
        ack(false, undefined, `unknown_op:${String(payload.op)}`)
    }
  } catch (error) {
    log.warn('localStorage op failed:', error)
    ack(false, undefined, errorMessage(error))
  }
}

function clearCcLocalStorage(): void {
  const removeKeys: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k && k.startsWith(CC_LOCAL_PREFIX)) {
      removeKeys.push(k)
    }
  }
  removeKeys.forEach((k) => window.localStorage.removeItem(k))
}

function pushLocalStorageSnapshot(): void {
  const entries: Record<string, string> = {}
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (!k || !k.startsWith(CC_LOCAL_PREFIX)) continue
    const v = window.localStorage.getItem(k)
    if (v === null) continue
    entries[k.slice(CC_LOCAL_PREFIX.length)] = v
  }
  const payload: CcStorageSnapshotPayload = { entries }
  sendBridgeMessage(BRIDGE_ACTION.CC_STORAGE_SNAPSHOT, payload, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
}

// ─── 工具 ────────────────────────────────────────────────────────────────────

function reply(payload: CcStorageResultPayload): void {
  if (!payload.requestId) return
  sendBridgeMessage(BRIDGE_ACTION.CC_STORAGE_RESULT, payload, {
    msgtype: BRIDGE_MSG_TYPE.H5,
  })
}

// 与 userCache 一样：cocos 落盘到 user_cache_${userId}，
// 用 H5 自己的登录态 userId 作 db 名，保证两端落同一个库。
function resolveUserId(): string {
  try {
    const store = useUserInfoStore()
    const info = store.userInfo as { user?: Record<string, unknown> } | null
    const user = info?.user ?? {}
    const raw =
      user['p_u_id'] ??
      (user as Record<string, unknown>)['pUid'] ??
      user['userid'] ??
      user['id'] ??
      (user as Record<string, unknown>)['wUid'] ??
      (user as Record<string, unknown>)['unid']
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : ''
  } catch {
    return ''
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

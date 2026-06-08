import type { ClubInfo } from '@/stores/userInfo'
import { USER_STORE_CLUB_LIST, openUserIndexedDB } from '@/utils/indexedDB'
import { createLogger } from '@/utils/logger'

const log = createLogger('[user-cache]')

function normalizeUserId(userId: unknown): string {
  return userId === undefined || userId === null ? '' : String(userId).trim()
}

function normalizeClubId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

export async function readClubListCache(userId: string | number): Promise<ClubInfo[]> {
  const id = normalizeUserId(userId)
  if (!id) return []
  try {
    const db = await openUserIndexedDB(id)
    return await new Promise<ClubInfo[]>((resolve, reject) => {
      const req = db
        .transaction(USER_STORE_CLUB_LIST, 'readonly')
        .objectStore(USER_STORE_CLUB_LIST)
        .getAll()
      req.onsuccess = () => {
        const list = Array.isArray(req.result) ? (req.result as ClubInfo[]) : []
        resolve(list.filter((club) => club && normalizeClubId(club.club_id) !== ''))
      }
      req.onerror = () => reject(req.error)
    })
  } catch (error) {
    log.warn('readClubListCache failed:', error)
    return []
  }
}

export async function writeClubListCache(
  userId: string | number,
  list: ClubInfo[],
): Promise<void> {
  const id = normalizeUserId(userId)
  if (!id) return
  try {
    const db = await openUserIndexedDB(id)
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(USER_STORE_CLUB_LIST, 'readwrite')
      const store = tx.objectStore(USER_STORE_CLUB_LIST)
      store.clear()
      if (Array.isArray(list)) {
        list.forEach((club) => {
          const clubId = normalizeClubId(club?.club_id)
          if (clubId) {
            store.put(club, clubId)
          }
        })
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } catch (error) {
    log.warn('writeClubListCache failed:', error)
  }
}

export async function clearClubListCache(userId: string | number): Promise<void> {
  const id = normalizeUserId(userId)
  if (!id) return
  try {
    const db = await openUserIndexedDB(id)
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(USER_STORE_CLUB_LIST, 'readwrite')
      tx.objectStore(USER_STORE_CLUB_LIST).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } catch (error) {
    log.warn('clearClubListCache failed:', error)
  }
}

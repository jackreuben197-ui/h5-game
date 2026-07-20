import { USER_STORE_MESSAGE } from '@/utils/indexedDB'
import { userCache } from '@/utils/userCache'

// 消息中心缓存 key 规则见 utils/indexedDB.ts 里 USER_STORE_MESSAGE 的注释。
// 集中放在这里是因为审核（同意/拒绝）不止发生在 MessageDetailView：
// GlobalMessageTodoNotice 悬浮窗和 MSG_S_TODO_LIST WS 推送也会让 credit/uc 数据过期，
// 两边都需要用同一套 key 才能互相使旧缓存失效。

export function msgListCacheKey(target: 'system' | 'other', msgType: number): string {
  return `${target}_${msgType}`
}

export const CREDIT_CACHE_KEY = 'credit_apply'

export function ucCacheKey(clubId: string | number | undefined | null): string {
  const id = clubId === undefined || clubId === null ? '' : String(clubId).trim()
  return `${id || '0'}_uc_apply`
}

export interface CachedMessageList<T> {
  items: T[]
  offset: number
  total: number
  hasMore: boolean
}

// 带入申请与 UC 充值申请可能在消息页之外被审核（悬浮窗 / WS 推送），
// 那些入口拿不到消息页里已映射好的展示数据，只能整条失效，交给下次打开时重新拉取。
export async function invalidateCreditCache(userId: string | number): Promise<void> {
  await userCache(userId).delete(USER_STORE_MESSAGE, CREDIT_CACHE_KEY)
}

export async function invalidateUcCache(
  userId: string | number,
  clubId: string | number | undefined | null,
): Promise<void> {
  await userCache(userId).delete(USER_STORE_MESSAGE, ucCacheKey(clubId))
}

// 缓存渲染 + 接口刷新 常见 race condition 工具。
//
// 场景：tab1 触发请求 → 用户切到 tab2（命中缓存即时渲染）→ tab1 接口返回，
// 旧响应写入 reactive state，把 tab2 显示的内容覆盖错乱。
//
// 设计思路（不做 debounce 延迟，避免叠加在接口耗时上）：
//   1) begin()/isCurrent() —— race guard：响应回来时如果 key 已切走就丢弃，
//      不写 reactive state。这是核心防错。
//   2) refresh(fn) —— 同 key 合并：
//      - 同 key 已经在飞行 → 复用同一个 promise（用户连续切回不会重发）；
//      - 同 key 上次成功在 freshTtl 内 → 直接跳过（数据足够新，省一次请求）；
//      - 否则立即触发 fn，不延迟。
//   3) invalidate(key?) —— 主动让某 key 过期，下次 refresh 必然重发（写操作后用）。
//
// 用法：
//   const refresher = createKeyedRefresh(
//     () => `${tab.value}_${period.value}`,
//     { freshTtl: 30_000 },
//   )
//
//   async function fetchTab(silent = false) {
//     const guard = refresher.begin()
//     const data = await api(...)
//     if (!guard.isCurrent()) return   // 已切走 → 丢弃响应
//     applyResult(data)
//   }
//
//   if (cached) {
//     applyCache(cached)
//     void refresher.refresh(() => fetchTab(true))   // 立即；30s 内同 key 跳过
//   } else {
//     await fetchTab()
//   }
//
//   onBeforeUnmount(() => refresher.clear())
//
// 一个 refresher 内部维护一张 key→{lastFreshAt, inflight} 表，所以同一个
// refresher 可以承载多种 key（比如 "deck_NLH" 与 "deck_PLO"）；只要 getKey 能
// 区分它们，TTL/inflight 都会按 key 独立计算。但不同维度的数据流（比如 deck mode
// 与 opponent period）建议用各自的 refresher，便于 getKey 写得清晰。

export interface RefreshGuard {
  /** 当前 key 是否仍是 begin 时记录的；false 表示已被切走，不要写 state */
  isCurrent: () => boolean
}

export interface KeyedRefresh {
  begin: () => RefreshGuard
  /**
   * 立即触发一次刷新（不延迟）。
   * - 同 key 已经在飞行 → 复用 promise，不重发；
   * - 上次成功 < freshTtl ms → 跳过，直接 resolve；
   * - 否则调用 fn，成功后记 lastFreshAt。
   * 没传 freshTtl 时只走 inflight 去重，永远不会因为 TTL 跳过。
   */
  refresh: (fn: () => Promise<void>) => Promise<void>
  /** 让某 key（默认当前 key）立刻过期，下次 refresh 必发请求 */
  invalidate: (key?: string) => void
  /** 清理状态：丢弃 freshness 记录与 inflight 引用（onBeforeUnmount 用） */
  clear: () => void
}

export interface KeyedRefreshOptions {
  /** 数据保鲜期：上次成功 < ttl ms 内的同 key 请求会被跳过。0 / undefined = 不跳过 */
  freshTtl?: number
}

export function createKeyedRefresh(
  getKey: () => string,
  options: KeyedRefreshOptions = {},
): KeyedRefresh {
  const freshTtl = options.freshTtl ?? 0
  const lastFreshAt = new Map<string, number>()
  const inflight = new Map<string, Promise<void>>()

  return {
    begin(): RefreshGuard {
      const key = getKey()
      return { isCurrent: () => key === getKey() }
    },
    refresh(fn): Promise<void> {
      const key = getKey()

      if (freshTtl > 0) {
        const at = lastFreshAt.get(key) ?? 0
        if (Date.now() - at < freshTtl) return Promise.resolve()
      }

      const existing = inflight.get(key)
      if (existing) return existing

      const p = (async () => {
        try {
          await fn()
          lastFreshAt.set(key, Date.now())
        } finally {
          inflight.delete(key)
        }
      })()
      inflight.set(key, p)
      return p
    },
    invalidate(key): void {
      lastFreshAt.delete(key ?? getKey())
    },
    clear(): void {
      lastFreshAt.clear()
      inflight.clear()
    },
  }
}

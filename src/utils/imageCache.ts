import {
  computed,
  reactive,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
} from 'vue'

// 远程图片 URL → blob URL 的进程内缓存。
// 命中后渲染走本地 blob，不会再触发 HTTP 请求。
const blobUrlCache = reactive<Record<string, string>>({})
const inFlight = new Map<string, Promise<void>>()
const failed = new Set<string>()

function shouldPreload(url: string): boolean {
  if (!url) return false
  if (url.startsWith('blob:') || url.startsWith('data:')) return false
  // 本地静态资源（Vite 构建产物）走浏览器自身缓存，无需 blob 化。
  if (!/^https?:\/\//i.test(url)) return false
  return true
}

async function preload(url: string): Promise<void> {
  if (blobUrlCache[url] || failed.has(url)) return
  const existing = inFlight.get(url)
  if (existing) return existing

  const task = (async () => {
    try {
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
      if (!res.ok) {
        throw new Error(`http ${res.status}`)
      }
      const blob = await res.blob()
      blobUrlCache[url] = URL.createObjectURL(blob)
    } catch {
      // CORS / 网络失败时记下，后续直接用原始 URL，不再重试。
      failed.add(url)
    } finally {
      inFlight.delete(url)
    }
  })()
  inFlight.set(url, task)
  return task
}

/**
 * 把一个远程图片 URL 包装成「首次加载后永久驻留」的引用。
 * - 首次访问：触发 fetch，渲染原始 URL；下载完成后切到 blob URL。
 * - 后续访问：直接返回 blob URL，零网络请求。
 * - 本地资源 / data: / blob:：原样透传。
 */
export function useCachedImage(source: MaybeRefOrGetter<string>): ComputedRef<string> {
  watch(
    () => toValue(source),
    (url) => {
      const trimmed = (url || '').trim()
      if (shouldPreload(trimmed)) {
        void preload(trimmed)
      }
    },
    { immediate: true },
  )

  return computed(() => {
    const url = (toValue(source) || '').trim()
    if (!url) return ''
    return blobUrlCache[url] || url
  })
}

export const EXTERNAL_LINK_FRAME_OPEN_EVENT = 'h5:external-link-frame-open'

export interface ExternalLinkFrameOpenDetail {
  url: string
}

let iframeModeEnabled = false

/** 公告富文本外链是否由 iframe 接管；默认关闭，保留浏览器原生跳转。 */
export function setExternalLinkIframeMode(enabled: boolean): boolean {
  iframeModeEnabled = enabled === true
  return iframeModeEnabled
}

export function isExternalLinkIframeModeEnabled(): boolean {
  return iframeModeEnabled
}

function normalizeHttpUrl(rawUrl: string): string {
  if (typeof window === 'undefined') return ''

  try {
    const url = new URL(rawUrl, window.location.href)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

/**
 * 部分第三方站点的普通详情页禁止被 iframe 加载，但会提供官方嵌入页。
 * Telegram 公共频道帖子使用 Post Widget 地址，避免 t.me 普通页面因防嵌入策略显示空白。
 */
function resolveEmbeddableUrl(rawUrl: string): string {
  const url = new URL(rawUrl)
  const hostname = url.hostname.toLowerCase()

  if (hostname === 't.me' || hostname === 'telegram.me' || hostname === 'telegram.dog') {
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const postId = pathSegments[1] || ''
    if (pathSegments.length === 2 && /^\d+$/.test(postId)) {
      url.searchParams.set('embed', '1')
      url.searchParams.set('mode', 'tme')
    }
  }

  return url.href
}

/**
 * 在当前 H5 页面上方打开第三方网页，避免主屏幕 Web App 立即切到 Safari。
 * 返回 false 表示 URL 不是可嵌入的 HTTP(S) 地址。
 */
export function openExternalLinkFrame(rawUrl: string): boolean {
  const url = normalizeHttpUrl(rawUrl)
  if (!url || typeof window === 'undefined') return false

  const frameUrl = resolveEmbeddableUrl(url)

  window.dispatchEvent(
    new CustomEvent<ExternalLinkFrameOpenDetail>(EXTERNAL_LINK_FRAME_OPEN_EVENT, {
      detail: { url: frameUrl },
    }),
  )
  return true
}

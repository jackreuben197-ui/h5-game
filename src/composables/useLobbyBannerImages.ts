import { ref, type Ref } from 'vue'
import { postBeforeLoginConfigApi } from '@/api/config'
import type { MiscBannerListBannerInfo } from '@/api/models/misc'
import { getLocale, toServerLang } from '@/i18n'
import {
  readLobbyBannerListCache,
  writeLobbyBannerListCache,
} from '@/utils/lobbyBannerCache'

// /config/before/login/config 聚合项：8 = banner 列表。
const NO_AUTH_API_BANNER_LIST = 8
// banner_type=1 大厅 Banner；status=1 启用。
const LOBBY_BANNER_TYPE = 1
const BANNER_STATUS_ENABLED = 1

// 兼容 banner_list_resp 挂在 data 顶层或 data.data 内层两种返回结构。
function extractBannerRecords(
  data: Record<string, unknown> | null | undefined,
): MiscBannerListBannerInfo[] {
  if (!data) return []
  const inner = data.data as Record<string, unknown> | null | undefined
  const resp = (data.banner_list_resp ?? inner?.banner_list_resp) as {
    list?: unknown
  } | null
  return resp && Array.isArray(resp.list) ? (resp.list as MiscBannerListBannerInfo[]) : []
}

// 过滤出当前语言、启用中的大厅 banner 图片。
function filterLobbyBannerUrls(records: MiscBannerListBannerInfo[], lang: string): string[] {
  return records
    .filter(
      (item) =>
        item?.lang === lang &&
        Number(item?.status) === BANNER_STATUS_ENABLED &&
        Number(item?.banner_type) === LOBBY_BANNER_TYPE,
    )
    .map((item) => (typeof item.image_url === 'string' ? item.image_url.trim() : ''))
    .filter((url) => !!url)
}

/**
 * 首页/游客首页共用的顶部轮播图数据源：
 * 先读 public_cache 即刻渲染，再静默请求最新数据并回写缓存。
 */
export function useLobbyBannerImages(): {
  bannerImages: Ref<string[]>
  fetchLobbyBannerImages: () => Promise<void>
} {
  const bannerImages = ref<string[]>([])

  async function fetchLobbyBannerImages(): Promise<void> {
    const lang = toServerLang(getLocale())

    const cached = await readLobbyBannerListCache(lang)
    if (cached?.length) {
      bannerImages.value = cached
    }

    const response = await postBeforeLoginConfigApi({
      no_auth_api_list: [NO_AUTH_API_BANNER_LIST],
    })
    if (Number(response.code) !== 0 || !response.data) {
      return
    }

    const urls = filterLobbyBannerUrls(extractBannerRecords(response.data), lang)
    bannerImages.value = urls
    void writeLobbyBannerListCache(lang, urls)
  }

  return { bannerImages, fetchLobbyBannerImages }
}

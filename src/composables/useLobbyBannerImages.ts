import { ref, type Ref } from 'vue'
import { postBeforeLoginConfigApi } from '@/api/config'
import { postMiscBannerListApi } from '@/api/misc'
import type { MiscBannerListBannerInfo } from '@/api/models/misc'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { getLocale, toServerLang } from '@/i18n'
import { isTelegramMiniAppEnv } from '@/utils/environment'
import { readLobbyBannerListCache, writeLobbyBannerListCache } from '@/utils/lobbyBannerCache'

// /config/before/login/config 聚合项：8 = banner 列表。
const NO_AUTH_API_BANNER_LIST = 8
// banner_type=1 大厅 Banner；status=1 启用。
const LOBBY_BANNER_TYPE = 1
const BANNER_STATUS_ENABLED = 1
// /misc/banner/list display_scene：1 = h5，2 = telegram。
const DISPLAY_SCENE_H5 = 1
const DISPLAY_SCENE_TELEGRAM = 2

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

// 过滤出当前语言、当前场景、启用中的大厅 banner 图片。
// display_scene 由客户端过滤（登录前聚合接口不感知场景）；字段缺省的旧数据视为全场景可见。
// 服务端会把默认俱乐部配置的也写进列表：优先展示 club_id>0 的，一条都没有才展示平台的。
function filterLobbyBannerUrls(
  records: MiscBannerListBannerInfo[],
  lang: string,
  displayScene: number,
): string[] {
  const visible = records.filter(
    (item) =>
      item?.lang === lang &&
      Number(item?.status) === BANNER_STATUS_ENABLED &&
      Number(item?.banner_type) === LOBBY_BANNER_TYPE &&
      (item?.display_scene === undefined || Number(item.display_scene) === displayScene),
  )
  const clubOwned = visible.filter((item) => Number(item?.club_id) > 0)
  return (clubOwned.length ? clubOwned : visible)
    .map((item) => (typeof item.image_url === 'string' ? item.image_url.trim() : ''))
    .filter((url) => !!url)
}

// 登录后走 /misc/banner/list（带 display_scene 区分 h5 / telegram + club_id），
// 服务端按俱乐部配置返回：俱乐部配置了返回俱乐部的，否则返回平台的。
// 请求失败或列表为空时返回 []，由调用方回落到登录前聚合接口。
async function fetchSceneBannerUrls(
  lang: string,
  displayScene: number,
  clubId: number,
): Promise<string[]> {
  try {
    const response = await postMiscBannerListApi({
      lang,
      type: LOBBY_BANNER_TYPE,
      display_scene: displayScene,
      ...(clubId > 0 ? { club_id: clubId } : {}),
      limit: 50,
      offset: 0,
    })
    if (Number(response.code) !== 0 || !response.data) {
      return []
    }

    // 兼容 list 挂在 data 顶层或 data.data 内层两种返回结构。
    const data = response.data as Record<string, unknown>
    const inner = data.data as Record<string, unknown> | null | undefined
    const rawList = Array.isArray(data.list) ? data.list : inner?.list
    const records = Array.isArray(rawList) ? (rawList as MiscBannerListBannerInfo[]) : []

    // lang / type / display_scene / club_id 已由服务端过滤；status 字段缺省时视为启用。
    return records
      .filter((item) => item?.status === undefined || Number(item.status) === BANNER_STATUS_ENABLED)
      .map((item) => (typeof item?.image_url === 'string' ? item.image_url.trim() : ''))
      .filter((url) => !!url)
  } catch (error) {
    return []
  }
}

/**
 * 首页/游客首页共用的顶部轮播图数据源：
 * 先读 public_cache 即刻渲染，再静默请求最新数据并回写缓存。
 * 登录后优先请求 /misc/banner/list（按 h5/telegram 场景 + 俱乐部配置），
 * 没有数据时回落到登录前的 /config/before/login/config 聚合接口。
 */
export function useLobbyBannerImages(): {
  bannerImages: Ref<string[]>
  fetchLobbyBannerImages: () => Promise<void>
} {
  const bannerImages = ref<string[]>([])

  async function fetchLobbyBannerImages(): Promise<void> {
    const lang = toServerLang(getLocale())
    const loggedIn = !!useGameStore().sessionToken.trim()
    const displayScene = isTelegramMiniAppEnv() ? DISPLAY_SCENE_TELEGRAM : DISPLAY_SCENE_H5

    // 和首页展示口径一致：优先当前选中俱乐部，取不到时回退到列表第一个。
    const userInfoStore = useUserInfoStore()
    const currentClub = userInfoStore.currentClub || userInfoStore.clubList[0] || null
    const clubId = Math.floor(Number(currentClub?.club_id)) || 0
    // 缓存按场景分桶（登录态额外按俱乐部分桶），避免 h5/telegram、游客/登录态互相覆盖。
    const cacheKey = loggedIn
      ? `${lang}_scene_${displayScene}_club_${clubId}`
      : `${lang}_scene_${displayScene}`

    const cached = await readLobbyBannerListCache(cacheKey)
    if (cached?.length) {
      bannerImages.value = cached
    }

    if (loggedIn) {
      const sceneUrls = await fetchSceneBannerUrls(lang, displayScene, clubId)

      if (sceneUrls.length) {
        bannerImages.value = sceneUrls
        void writeLobbyBannerListCache(cacheKey, sceneUrls)
        return
      }
    }

    const response = await postBeforeLoginConfigApi({
      no_auth_api_list: [NO_AUTH_API_BANNER_LIST],
    })
    if (Number(response.code) !== 0 || !response.data) {
      return
    }

    const urls = filterLobbyBannerUrls(extractBannerRecords(response.data), lang, displayScene)
    bannerImages.value = urls
    void writeLobbyBannerListCache(cacheKey, urls)
  }

  return { bannerImages, fetchLobbyBannerImages }
}

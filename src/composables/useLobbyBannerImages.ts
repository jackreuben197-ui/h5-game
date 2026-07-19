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
// display_scene 由客户端过滤（登录前聚合接口不感知场景）；
// 字段缺省、null 或 0 的旧 CMS 数据视为全场景可见。
// 游客页优先展示默认俱乐部配置；登录页回退 CMS 时仅展示平台配置。
function filterLobbyBannerUrls(
  records: MiscBannerListBannerInfo[],
  lang: string,
  displayScene: number,
  preferDefaultClub: boolean,
): string[] {
  const visible = records.filter(
    (item) =>
      item?.lang === lang &&
      Number(item?.status) === BANNER_STATUS_ENABLED &&
      Number(item?.banner_type) === LOBBY_BANNER_TYPE &&
      (item?.display_scene == null ||
        Number(item.display_scene) <= 0 ||
        Number(item.display_scene) === displayScene),
  )
  const clubOwned = visible.filter((item) => Number(item?.club_id) > 0)
  const platformOwned = visible.filter((item) => item?.club_id == null || Number(item.club_id) <= 0)
  const selected = preferDefaultClub && clubOwned.length ? clubOwned : platformOwned
  return selected
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
  } catch {
    return []
  }
}

// CMS banner 每次进入首页都静默刷新；缓存只用于首屏，不替代网络请求。
async function fetchCmsBannerUrls(
  lang: string,
  displayScene: number,
  preferDefaultClub: boolean,
): Promise<string[] | null> {
  try {
    const response = await postBeforeLoginConfigApi({
      no_auth_api_list: [NO_AUTH_API_BANNER_LIST],
      banner_list_req: { last_update_time: 0 },
    })
    if (Number(response.code) !== 0 || !response.data) {
      return null
    }
    const records = extractBannerRecords(response.data)
    const urls = filterLobbyBannerUrls(records, lang, displayScene, preferDefaultClub)
    return urls
  } catch {
    return null
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
    // 游客 CMS 缓存可能包含默认俱乐部 banner；登录页的平台回退必须独立分桶。
    const cmsCacheKey = loggedIn
      ? `${lang}_scene_${displayScene}_platform`
      : `${lang}_scene_${displayScene}`

    const [cached, cmsCached] = await Promise.all([
      readLobbyBannerListCache(cacheKey),
      cacheKey === cmsCacheKey ? Promise.resolve(null) : readLobbyBannerListCache(cmsCacheKey),
    ])
    if (cached?.length) {
      bannerImages.value = cached
    } else if (cmsCached?.length) {
      bannerImages.value = cmsCached
    }

    // 读取缓存后立即发起 CMS 请求。登录 banner 查询与 CMS 刷新并行，
    // 避免任何缓存命中或登录接口分支阻止 before-login 请求。
    const cmsUrlsPromise = fetchCmsBannerUrls(lang, displayScene, !loggedIn)

    if (loggedIn) {
      const sceneUrls = await fetchSceneBannerUrls(lang, displayScene, clubId)

      if (sceneUrls.length) {
        bannerImages.value = sceneUrls
        void writeLobbyBannerListCache(cacheKey, sceneUrls)

        // 登录 banner 优先展示；CMS 结果仅静默刷新公共缓存。
        void cmsUrlsPromise.then((cmsUrls) => {
          if (cmsUrls) {
            void writeLobbyBannerListCache(cmsCacheKey, cmsUrls)
          }
        })
        return
      }

      // 俱乐部/场景 banner 为空时，立即切回登录前缓存的 CMS banner，
      // 避免继续展示该俱乐部上一次缓存的专属 banner。
      if (cmsCached?.length) {
        bannerImages.value = cmsCached
      }
    }

    const cmsUrls = await cmsUrlsPromise
    if (!cmsUrls) {
      return
    }

    bannerImages.value = cmsUrls
    void writeLobbyBannerListCache(cmsCacheKey, cmsUrls)
  }

  return { bannerImages, fetchLobbyBannerImages }
}

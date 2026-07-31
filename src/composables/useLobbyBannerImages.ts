import { ref, type Ref } from 'vue'
import { postBeforeLoginConfigApi } from '@/api/config'
import { postMiscBannerListApi } from '@/api/misc'
import type { MiscBannerListBannerInfo } from '@/api/models/misc'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { getLocale, toServerLang } from '@/i18n'
import { isTelegramMiniAppEnv } from '@/utils/environment'
import { isChannelPackageHost } from '@/utils/channelPackage'
import { readLobbyBannerListCache, writeLobbyBannerListCache } from '@/utils/lobbyBannerCache'

// /config/before/login/config 聚合项：8 = banner 列表。
const NO_AUTH_API_BANNER_LIST = 8
// banner_type=1 大厅 Banner；status=1 启用。
const LOBBY_BANNER_TYPE = 1
const BANNER_STATUS_ENABLED = 1
// /misc/banner/list display_scene：1 = h5，2 = telegram。
const DISPLAY_SCENE_H5 = 1
const DISPLAY_SCENE_TELEGRAM = 2
// 官方包未登录 banner 一键切换：
// - 'platform'：只显示 CMS club_id=0 的平台 banner
// - 'default-club'：优先显示 CMS club_id>0 的默认俱乐部 banner，没有时回退平台 banner
const OFFICIAL_GUEST_BANNER_MODE: 'platform' | 'default-club' = 'platform'

type CmsBannerScope =
  | { type: 'platform' }
  | { type: 'default-club' }
  | { type: 'channel-club'; clubId: number }

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
// 官方包只展示平台配置；渠道包游客精确匹配渠道俱乐部，未配置时回退平台配置。
function filterLobbyBannerUrls(
  records: MiscBannerListBannerInfo[],
  lang: string,
  displayScene: number,
  scope: CmsBannerScope,
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
  const platformOwned = visible.filter((item) => Number(item?.club_id) === 0)
  let selected = platformOwned
  if (scope.type === 'default-club') {
    selected = clubOwned.length ? clubOwned : platformOwned
  } else if (scope.type === 'channel-club') {
    const channelOwned = clubOwned.filter((item) => Number(item.club_id) === scope.clubId)
    // 渠道俱乐部未配置 banner 时回退平台配置，不能误用其他俱乐部的配置。
    selected = channelOwned.length ? channelOwned : platformOwned
  }
  return selected
    .map((item) => (typeof item.image_url === 'string' ? item.image_url.trim() : ''))
    .filter((url) => !!url)
}

// 登录后走 /misc/banner/list（带 display_scene 区分 h5 / telegram + club_id），
// 这里只接受目标俱乐部自己的配置；接口返回的平台数据不在这里采用，
// 统一由调用方回落到 before-login CMS 的 club_id=0 配置。
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

    // lang / type / display_scene 已由服务端过滤；客户端再次校验 club_id，
    // 避免服务端用平台 banner 兜底后被误认为俱乐部配置。
    return records
      .filter(
        (item) =>
          (item?.status === undefined || Number(item.status) === BANNER_STATUS_ENABLED) &&
          Number(item?.club_id) === clubId,
      )
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
  scope: CmsBannerScope,
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
    const urls = filterLobbyBannerUrls(records, lang, displayScene, scope)
    return urls
  } catch {
    return null
  }
}

/**
 * 首页/游客首页共用的顶部轮播图数据源：
 * 先读 public_cache 即刻渲染，再静默请求最新数据并回写缓存。
 * 渠道链接登录后优先请求 /misc/banner/list（按 h5/telegram 场景 + 渠道俱乐部配置），
 * 平台链接始终读取平台 banner；渠道俱乐部没有数据时也回落到平台 banner。
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

    const userInfoStore = useUserInfoStore()
    const isChannelPackage = isChannelPackageHost()
    let channelClubId = 0
    if (isChannelPackage) {
      const channelClub = await userInfoStore.ensureChannelDefaultClub()
      channelClubId = Math.floor(Number(channelClub?.club_id)) || 0
    }
    const hasChannelClub = isChannelPackage && channelClubId > 0
    // 只有渠道包游客直接从 before-login CMS 中选渠道俱乐部 banner；
    // 其他场景的 CMS 都是主数据源失败后的平台 club_id=0 回退。
    const cmsScope: CmsBannerScope = !loggedIn && hasChannelClub
      ? { type: 'channel-club', clubId: channelClubId }
      : !loggedIn && !isChannelPackage && OFFICIAL_GUEST_BANNER_MODE === 'default-club'
        ? { type: 'default-club' }
        : { type: 'platform' }
    const platformCacheKey = `${lang}_scene_${displayScene}_platform`
    // 只有渠道链接按渠道俱乐部分桶；平台链接不再按登录账号当前俱乐部分桶。
    const cacheKey = hasChannelClub
      ? `${lang}_scene_${displayScene}_channel_club_${channelClubId}`
      : !loggedIn && !isChannelPackage && OFFICIAL_GUEST_BANNER_MODE === 'default-club'
        ? `${lang}_scene_${displayScene}_default-club`
        : platformCacheKey
    // 渠道登录 banner 与平台 CMS 回退独立分桶。
    const cmsCacheKey = loggedIn && hasChannelClub ? platformCacheKey : cacheKey

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
    const cmsUrlsPromise = fetchCmsBannerUrls(lang, displayScene, cmsScope)

    // 只有渠道链接才请求俱乐部 banner。平台链接即使账号是俱乐部创始人，也只展示平台 banner。
    const shouldFetchClubBanner = loggedIn && hasChannelClub
    if (shouldFetchClubBanner) {
      const sceneUrls = await fetchSceneBannerUrls(lang, displayScene, channelClubId)

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

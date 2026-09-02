import { ref, type Ref } from 'vue'
import { postBeforeLoginConfigApi } from '@/api/config'
import { postMiscBannerListApi } from '@/api/misc'
import type { MiscBannerListBannerInfo } from '@/api/models/misc'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { FALLBACK_SERVER_LANG, getLocale, toServerLang } from '@/i18n'
import { isTelegramMiniAppEnv } from '@/utils/environment'
import { isPrivateDomainMode } from '@/utils/channelPackage'
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

// 路由切换会销毁并重新创建首页组件。IndexedDB 虽然有缓存，但读取仍是异步的，
// 会让 HomeBannerSwiper 在首帧短暂回退到 home_header_1。这里保留当前 SPA
// 生命周期内已经解析过的 Banner，使首页重新挂载时可以同步拿到正确图片。
const runtimeBannerImages = new Map<string, string[]>()

function createRuntimeBannerKey(
  lang: string,
  displayScene: number,
  isChannelPackage: boolean,
  channelClubId: number,
): string {
  const hostname = typeof window === 'undefined' ? '' : window.location.hostname.toLowerCase()
  const scope = isChannelPackage ? `channel_${channelClubId || 'pending'}` : 'platform'
  return `${hostname}_${lang}_scene_${displayScene}_${scope}`
}

function normalizeBannerUrls(urls: string[]): string[] {
  return urls
    .map((url) => (typeof url === 'string' ? url.trim() : ''))
    .filter((url) => !!url)
}

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
  const isEnabledLobbyBanner = (item: MiscBannerListBannerInfo) =>
    item?.lang === lang &&
    Number(item?.status) === BANNER_STATUS_ENABLED &&
    Number(item?.banner_type) === LOBBY_BANNER_TYPE

  const matchesScene = (item: MiscBannerListBannerInfo, scene: number) =>
    item?.display_scene == null ||
    Number(item.display_scene) <= 0 ||
    Number(item.display_scene) === scene

  if (scope.type === 'channel-club') {
    // 1. 优先查当前场景（如 Telegram 场景 2）下该渠道俱乐部的 banner
    const channelClubScene = records.filter(
      (item) =>
        isEnabledLobbyBanner(item) &&
        Number(item.club_id) === scope.clubId &&
        matchesScene(item, displayScene),
    )
    if (channelClubScene.length) {
      return channelClubScene
        .map((item) => (typeof item.image_url === 'string' ? item.image_url.trim() : ''))
        .filter((url) => !!url)
    }

    // 2. 若 Telegram 场景下该渠道俱乐部未单独配置，则回退到该渠道俱乐部的 H5 场景 banner（如 CMS 中配置的 H5 日落图）
    if (displayScene !== DISPLAY_SCENE_H5) {
      const channelClubH5 = records.filter(
        (item) =>
          isEnabledLobbyBanner(item) &&
          Number(item.club_id) === scope.clubId &&
          matchesScene(item, DISPLAY_SCENE_H5),
      )
      if (channelClubH5.length) {
        return channelClubH5
          .map((item) => (typeof item.image_url === 'string' ? item.image_url.trim() : ''))
          .filter((url) => !!url)
      }
    }
  }

  let visible = records.filter(
    (item) => isEnabledLobbyBanner(item) && matchesScene(item, displayScene),
  )
  if (!visible.length && displayScene !== DISPLAY_SCENE_H5) {
    visible = records.filter(
      (item) => isEnabledLobbyBanner(item) && matchesScene(item, DISPLAY_SCENE_H5),
    )
  }
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
    if (Number(response.code) === 0 && response.data) {
      const data = response.data as Record<string, unknown>
      const inner = data.data as Record<string, unknown> | null | undefined
      const rawList = Array.isArray(data.list) ? data.list : inner?.list
      const records = Array.isArray(rawList) ? (rawList as MiscBannerListBannerInfo[]) : []

      const urls = records
        .filter(
          (item) =>
            (item?.status === undefined || Number(item.status) === BANNER_STATUS_ENABLED) &&
            Number(item?.club_id) === clubId,
        )
        .map((item) => (typeof item?.image_url === 'string' ? item.image_url.trim() : ''))
        .filter((url) => !!url)

      if (urls.length) return urls
    }

    // Fallback to H5 display scene if Telegram scene returned no banners for the club
    if (displayScene !== DISPLAY_SCENE_H5) {
      return fetchSceneBannerUrls(lang, DISPLAY_SCENE_H5, clubId)
    }

    return []
  } catch {
    return []
  }
}

// 公开聚合 banner 在官方包、渠道未登录或渠道登录兜底时请求；缓存只用于首屏。
async function fetchCmsBannerUrls(
  lang: string,
  displayScene: number,
  scope: CmsBannerScope,
): Promise<string[] | null> {
  try {
    const response = await postBeforeLoginConfigApi({
      no_auth_api_list: [NO_AUTH_API_BANNER_LIST],
      banner_list_req: {
        last_update_time: 0,
        ...(scope.type === 'channel-club' ? { club_id: scope.clubId } : {}),
      },
    })
    if (Number(response.code) !== 0 || !response.data) {
      return null
    }
    const records = extractBannerRecords(response.data)
    const urls = filterLobbyBannerUrls(records, lang, displayScene, scope)
    if (urls.length || lang === FALLBACK_SERVER_LANG) {
      return urls
    }
    // CMS 还没有该语言的轮播图时用英文兜底，避免整条轮播为空。
    return filterLobbyBannerUrls(records, FALLBACK_SERVER_LANG, displayScene, scope)
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
  const initialLang = toServerLang(getLocale())
  const initialDisplayScene = isTelegramMiniAppEnv()
    ? DISPLAY_SCENE_TELEGRAM
    : DISPLAY_SCENE_H5
  const initialUserInfoStore = useUserInfoStore()
  const initialIsChannelPackage = isPrivateDomainMode()
  const initialChannelClubId = initialIsChannelPackage
    ? Math.floor(
        Number(
          initialUserInfoStore.channelDefaultClub?.club_id ??
            initialUserInfoStore.currentClub?.club_id,
        ),
      ) || 0
    : 0
  const initialRuntimeKey = createRuntimeBannerKey(
    initialLang,
    initialDisplayScene,
    initialIsChannelPackage,
    initialChannelClubId,
  )
  const bannerImages = ref<string[]>([...(runtimeBannerImages.get(initialRuntimeKey) || [])])

  function commitBannerImages(runtimeKey: string, urls: string[]): void {
    const normalized = normalizeBannerUrls(urls)
    bannerImages.value = normalized
    runtimeBannerImages.set(runtimeKey, [...normalized])
  }

  async function fetchLobbyBannerImages(): Promise<void> {
    const lang = toServerLang(getLocale())
    const hasRealUser = useGameStore().isRealUser
    const displayScene = isTelegramMiniAppEnv() ? DISPLAY_SCENE_TELEGRAM : DISPLAY_SCENE_H5

    const userInfoStore = useUserInfoStore()
    const isChannelPackage = isPrivateDomainMode()
    let channelClubId = 0
    if (isChannelPackage) {
      const channelClub = await userInfoStore.ensureChannelDefaultClub()
      channelClubId = Math.floor(Number(channelClub?.club_id)) || 0
    }
    const hasChannelClub = isChannelPackage && channelClubId > 0
    const runtimeKey = createRuntimeBannerKey(
      lang,
      displayScene,
      isChannelPackage,
      channelClubId,
    )

    // 初始化时渠道俱乐部尚未恢复完成的极少数场景，在这里命中最终分桶后立即补上；
    // 正常的底部导航往返会在 setup 阶段就同步命中，不产生默认图闪现。
    if (!bannerImages.value.length) {
      const runtimeCached = runtimeBannerImages.get(runtimeKey)
      if (runtimeCached?.length) {
        bannerImages.value = [...runtimeCached]
      }
    }
    // 渠道包调用 before-login CMS 时传渠道 club_id；官方包不传，只取平台配置。
    const cmsScope: CmsBannerScope = hasChannelClub
      ? { type: 'channel-club', clubId: channelClubId }
      : !hasRealUser && !isChannelPackage && OFFICIAL_GUEST_BANNER_MODE === 'default-club'
        ? { type: 'default-club' }
        : { type: 'platform' }
    const platformCacheKey = `${lang}_scene_${displayScene}_platform`
    // 只有渠道链接按渠道俱乐部分桶；平台链接不再按登录账号当前俱乐部分桶。
    const cacheKey = hasChannelClub
      ? `${lang}_scene_${displayScene}_channel_club_${channelClubId}`
      : !hasRealUser && !isChannelPackage && OFFICIAL_GUEST_BANNER_MODE === 'default-club'
        ? `${lang}_scene_${displayScene}_default-club`
        : platformCacheKey
    const cached = await readLobbyBannerListCache(cacheKey)
    if (cached?.length) {
      commitBannerImages(runtimeKey, cached)
    }

    // 只有渠道链接才请求俱乐部 banner。平台链接即使账号是俱乐部创始人，也只展示平台 banner。
    const shouldFetchClubBanner = hasRealUser && hasChannelClub
    if (shouldFetchClubBanner) {
      const sceneUrls = await fetchSceneBannerUrls(lang, displayScene, channelClubId)

      if (sceneUrls.length) {
        commitBannerImages(runtimeKey, sceneUrls)
        void writeLobbyBannerListCache(cacheKey, sceneUrls)
        return
      }
    }

    // 渠道未登录或登录接口无俱乐部 banner 时，传渠道 club_id 请求公开聚合接口；
    // 返回后精确匹配该俱乐部，没有才回退平台 banner。
    const cmsUrls = await fetchCmsBannerUrls(lang, displayScene, cmsScope)
    if (!cmsUrls) {
      return
    }

    commitBannerImages(runtimeKey, cmsUrls)
    void writeLobbyBannerListCache(cacheKey, cmsUrls)
  }

  return { bannerImages, fetchLobbyBannerImages }
}


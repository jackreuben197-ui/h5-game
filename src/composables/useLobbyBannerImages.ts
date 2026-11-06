import { ref, watch, type Ref } from 'vue'
import { postBeforeLoginConfigApi } from '@/api/config'
import { postMiscBannerListApi } from '@/api/misc'
import type { MiscBannerListBannerInfo } from '@/api/models/misc'
import { resolveChannelMenu } from '../features/channelC/menu.ts'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { FALLBACK_SERVER_LANG, getLocale, toServerLang } from '@/i18n'
import { isTelegramMiniAppEnv } from '@/utils/environment'
import { isPrivateDomainMode } from '@/utils/channelPackage'
import { parseLobbyBannerAssociation, type LobbyBanner, type RefreshLobbyBanner } from '../utils/lobbyBannerAssociation.ts'

// /config/before/login/config 聚合项：8 = banner 列表。
const NO_AUTH_API_BANNER_LIST = 8
// banner_type=1 大厅 Banner；status=1 启用。
const LOBBY_BANNER_TYPE = 1
const BANNER_STATUS_ENABLED = 1
// 展示场景只区分 H5 和 Telegram，A/B/C 通过图片字段区分。
const DISPLAY_SCENE_H5 = 1
const DISPLAY_SCENE_TELEGRAM = 2
// Banner 按服务端语言码独立读取，简体中文与繁体中文分别使用 zh_CN / zh_TW。
function getLobbyBannerLang(): string {
  return toServerLang(getLocale())
}
// 官方包未登录 banner 一键切换：
// - 'platform'：只显示 CMS club_id=0 的平台 banner
// - 'default-club'：优先显示 CMS club_id>0 的默认俱乐部 banner，没有时回退平台 banner
const OFFICIAL_GUEST_BANNER_MODE: 'platform' | 'default-club' = 'platform'

type CmsBannerScope =
  | { type: 'platform' }
  | { type: 'default-club' }
  | { type: 'channel-club'; clubId: number }

// 只缓存当前 SPA 已由服务端确认过的 Banner。浏览器刷新后 Map 会清空，
// 不读取持久化旧图；无图时的默认图由各版本视图处理。
const runtimeBanners = new Map<string, LobbyBanner[]>()
const pendingBanners = new Map<string, Promise<LobbyBanner[] | null>>()
type LobbyBannerVariant = 'ab' | 'c'

function getDisplayScene(): 1 | 2 {
  return isTelegramMiniAppEnv() ? DISPLAY_SCENE_TELEGRAM : DISPLAY_SCENE_H5
}

function bannerImageUrl(item: MiscBannerListBannerInfo, variant: LobbyBannerVariant): string {
  if (variant === 'c' && typeof item.image_url_c === 'string') {
    const compactUrl = item.image_url_c.trim()
    if (compactUrl) return compactUrl
  }
  return typeof item.image_url === 'string' ? item.image_url.trim() : ''
}

function createRuntimeBannerKey(
  lang: string,
  displayScene: 1 | 2,
  isChannelPackage: boolean,
  channelClubId: number,
  hasRealUser: boolean,
  variant: LobbyBannerVariant,
): string {
  const hostname = typeof window === 'undefined' ? '' : window.location.hostname.toLowerCase()
  const scope = isChannelPackage
    ? `channel_${channelClubId || 'pending'}_${hasRealUser ? 'member' : 'guest'}`
    : 'platform'
  return `${hostname}_${lang}_scene_${displayScene}_${scope}_${variant}`
}

function toLobbyBanners(records: MiscBannerListBannerInfo[], variant: LobbyBannerVariant) {
  return records.flatMap((item): LobbyBanner[] => {
    const imageUrl = bannerImageUrl(item, variant)
    if (!imageUrl) return []
    const id = Number(item.id ?? item.banner_id) || 0
    const clubId = Number(item.club_id) || 0
    const association =
      id > 0 && clubId > 0 && Number(item.resource_type ?? 1) === 1
        ? parseLobbyBannerAssociation(item)
        : undefined
    return [{ id, clubId, imageUrl, association }]
  })
}

// 兼容 banner_list_resp 挂在 data 顶层或 data.data 内层两种返回结构。
function extractBannerRecords(
  data: Record<string, unknown> | null | undefined,
): MiscBannerListBannerInfo[] {
  if (!data) return []
  const inner = data.data as Record<string, unknown> | null | undefined
  const resp = (data.banner_list_resp ?? inner?.banner_list_resp) as { list?: unknown } | null
  return Array.isArray(resp?.list) ? (resp.list as MiscBannerListBannerInfo[]) : []
}

function matchesBannerScene(item: MiscBannerListBannerInfo, displayScene: 1 | 2): boolean {
  return (
    item.display_scene == null ||
    Number(item.display_scene) <= 0 ||
    Number(item.display_scene) === displayScene
  )
}

// 过滤出当前语言、当前场景、启用中的大厅 banner。
// display_scene 由客户端过滤（登录前聚合接口不感知场景）；
// 字段缺省、null 或 0 的旧 CMS 数据视为全场景可见。
// 官方包只展示平台配置；渠道包游客精确匹配渠道俱乐部，未配置时回退平台配置。
// Telegram 场景未单独配置时回退该范围的 H5 场景 banner（如 CMS 中只配置了 H5 图）。
function filterLobbyBanners(
  records: MiscBannerListBannerInfo[],
  lang: string,
  displayScene: 1 | 2,
  scope: CmsBannerScope,
  variant: LobbyBannerVariant,
): LobbyBanner[] {
  const isEnabledLobbyBanner = (item: MiscBannerListBannerInfo) =>
    !!item &&
    Number(item.status) === BANNER_STATUS_ENABLED &&
    Number(item.banner_type) === LOBBY_BANNER_TYPE &&
    Boolean(bannerImageUrl(item, variant))
  const isClubOwned = (item: MiscBannerListBannerInfo) => {
    const clubId = Number(item.club_id)
    if (scope.type === 'channel-club') return clubId === scope.clubId
    return scope.type === 'default-club' && clubId > 0
  }
  const byLang = (items: MiscBannerListBannerInfo[]) => {
    const preferred = items.filter((item) => item.lang === lang)
    return preferred.length || lang !== 'zh_CN'
      ? preferred
      : items.filter((item) => item.lang === 'zh_TW')
  }
  const pick = (scene: 1 | 2, owned: boolean) =>
    byLang(
      records.filter(
        (item) =>
          isEnabledLobbyBanner(item) &&
          matchesBannerScene(item, scene) &&
          (owned ? isClubOwned(item) : Number(item.club_id) === 0),
      ),
    )

  const scenes: Array<1 | 2> =
    displayScene === DISPLAY_SCENE_H5 ? [DISPLAY_SCENE_H5] : [displayScene, DISPLAY_SCENE_H5]
  let selected: MiscBannerListBannerInfo[] = []
  if (scope.type !== 'platform') {
    for (const scene of scenes) {
      selected = pick(scene, true)
      if (selected.length) break
    }
  }
  if (!selected.length) {
    // 渠道俱乐部未配置 banner 时回退平台配置，不能误用其他俱乐部的配置。
    for (const scene of scenes) {
      selected = pick(scene, false)
      if (selected.length) break
    }
  }
  return toLobbyBanners(selected, variant)
}

// 登录后走 /misc/banner/list（带 display_scene 区分 h5 / telegram + club_id），
// 这里只接受目标俱乐部自己的配置；接口返回的平台数据不在这里采用，
// 统一由调用方回落到 before-login CMS 的 club_id=0 配置。
async function fetchSceneBanners(
  lang: string,
  displayScene: 1 | 2,
  clubId: number,
  variant: LobbyBannerVariant,
): Promise<LobbyBanner[]> {
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

      // lang / type / display_scene 已由服务端过滤；客户端再次校验 club_id，
      // 避免服务端用平台 banner 兜底后被误认为俱乐部配置。
      const visible = records.filter(
        (item) =>
          item &&
          (item.status == null || Number(item.status) === BANNER_STATUS_ENABLED) &&
          matchesBannerScene(item, displayScene) &&
          Number(item.club_id) === clubId,
      )
      const banners = toLobbyBanners(visible, variant)
      if (banners.length) return banners
    }

    // Telegram 场景没有俱乐部 banner 时回退该俱乐部的 H5 场景配置。
    if (displayScene !== DISPLAY_SCENE_H5) {
      return fetchSceneBanners(lang, DISPLAY_SCENE_H5, clubId, variant)
    }

    return []
  } catch {
    return []
  }
}

// 公开聚合 banner 在官方包、渠道未登录或渠道登录兜底时请求。
async function fetchCmsBanners(
  lang: string,
  displayScene: 1 | 2,
  scope: CmsBannerScope,
  variant: LobbyBannerVariant,
): Promise<LobbyBanner[] | null> {
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
    const banners = filterLobbyBanners(records, lang, displayScene, scope, variant)
    if (banners.length || lang === FALLBACK_SERVER_LANG) {
      return banners
    }
    // CMS 还没有该语言的轮播图时用英文兜底，避免整条轮播为空。
    return filterLobbyBanners(records, FALLBACK_SERVER_LANG, displayScene, scope, variant)
  } catch {
    return null
  }
}

/**
 * 首页/游客首页共用的顶部轮播图数据源：
 * 冷启动只接受本次服务端请求结果，不读取持久化旧图；同一 SPA 内复用已确认结果。
 * 渠道链接登录后优先请求 /misc/banner/list（按 h5/telegram 场景 + 渠道俱乐部配置），
 * 平台链接始终读取平台 banner；渠道俱乐部没有数据时也回落到平台 banner。
 * 图片版本默认跟随渠道公开的 h5_menu，调用方可显式指定。
 */
export function useLobbyBannerImages(forcedVariant?: LobbyBannerVariant): {
  banners: Ref<LobbyBanner[]>
  isBannerLoaded: Ref<boolean>
  fetchLobbyBannerImages: () => Promise<void>
  refreshLobbyBanner: RefreshLobbyBanner
} {
  const gameStore = useGameStore()
  const userInfoStore = useUserInfoStore()
  const initialIsChannelPackage = isPrivateDomainMode()
  const initialClub = initialIsChannelPackage
    ? (userInfoStore.channelDefaultClub ?? userInfoStore.currentClub)
    : null
  const resolveVariant = (club: typeof initialClub): LobbyBannerVariant =>
    forcedVariant ?? (resolveChannelMenu(club) === 3 ? 'c' : 'ab')
  const initialRuntimeKey = createRuntimeBannerKey(
    getLobbyBannerLang(),
    getDisplayScene(),
    initialIsChannelPackage,
    Math.floor(Number(initialClub?.club_id)) || 0,
    gameStore.isRealUser,
    resolveVariant(initialClub),
  )
  const isBannerLoaded = ref<boolean>(runtimeBanners.has(initialRuntimeKey))
  const banners = ref<LobbyBanner[]>([...(runtimeBanners.get(initialRuntimeKey) || [])])
  let revision = 0
  let started = false

  watch(
    () => gameStore.isRealUser,
    () => {
      if (started && isPrivateDomainMode()) void loadBanners('reload')
    },
  )

  async function loadBanners(mode: 'reuse' | 'reload' | 'action'): Promise<LobbyBanner[] | null> {
    const request = mode === 'action' ? revision : ++revision
    const lang = getLobbyBannerLang()
    const hasRealUser = gameStore.isRealUser
    const displayScene = getDisplayScene()

    const isChannelPackage = isPrivateDomainMode()
    const channelClub = isChannelPackage ? await userInfoStore.ensureChannelDefaultClub() : null
    const channelClubId = Math.floor(Number(channelClub?.club_id)) || 0
    const hasChannelClub = channelClubId > 0
    // /org/club/default 在游客态可用，图片版本跟随渠道公开的 h5_menu。
    const variant = resolveVariant(channelClub)
    const runtimeKey = createRuntimeBannerKey(
      lang,
      displayScene,
      isChannelPackage,
      channelClubId,
      hasRealUser,
      variant,
    )

    const isCurrent = () =>
      (mode === 'action' || request === revision) &&
      lang === getLobbyBannerLang() &&
      (!isChannelPackage || gameStore.isRealUser === hasRealUser)
    if (!isCurrent()) return null

    // 页面切换可复用同一来源的缓存，身份切换需要重新取对应来源。
    let pending = pendingBanners.get(runtimeKey)
    const runtimeCached = runtimeBanners.get(runtimeKey)
    if (mode === 'reuse' && !pending && runtimeCached) {
      banners.value = [...runtimeCached]
      isBannerLoaded.value = true
      return runtimeCached
    }
    if (!pending) {
      // 渠道包调用 before-login CMS 时传渠道 club_id；官方包不传，只取平台配置。
      const cmsScope: CmsBannerScope = hasChannelClub
        ? { type: 'channel-club', clubId: channelClubId }
        : !hasRealUser && !isChannelPackage && OFFICIAL_GUEST_BANNER_MODE === 'default-club'
          ? { type: 'default-club' }
          : { type: 'platform' }
      pending = (async () => {
        // 只有渠道链接才请求俱乐部 banner。平台链接即使账号是俱乐部创始人，也只展示平台 banner。
        const sceneBanners =
          hasRealUser && hasChannelClub
            ? await fetchSceneBanners(lang, displayScene, channelClubId, variant)
            : []
        // 渠道未登录或登录接口无俱乐部 banner 时，传渠道 club_id 请求公开聚合接口；
        // 返回后精确匹配该俱乐部，没有才回退平台 banner。
        const loaded = sceneBanners.length
          ? sceneBanners
          : await fetchCmsBanners(lang, displayScene, cmsScope, variant)
        if (loaded) runtimeBanners.set(runtimeKey, loaded)
        return loaded
      })().finally(() => pendingBanners.delete(runtimeKey))
      pendingBanners.set(runtimeKey, pending)
    }

    const nextBanners = await pending
    if (!isCurrent()) return null
    if (!nextBanners) {
      // 服务端确认失败也视为已加载，让各版本视图展示内置默认图。
      if (mode !== 'action') isBannerLoaded.value = true
      return null
    }
    // 点击时保持当前轮播，避免读取关联期间正在点击的幻灯片被卸载。
    if (mode !== 'action') {
      banners.value = nextBanners
      isBannerLoaded.value = true
    }
    return nextBanners
  }

  async function fetchLobbyBannerImages(): Promise<void> {
    started = true
    await loadBanners('reuse')
  }

  const refreshLobbyBanner: RefreshLobbyBanner = async (banner) => {
    const fresh = await loadBanners('action')
    if (!fresh) return undefined
    return fresh.find((item) => item.id === banner.id && item.clubId === banner.clubId) ?? null
  }

  return { banners, isBannerLoaded, fetchLobbyBannerImages, refreshLobbyBanner }
}

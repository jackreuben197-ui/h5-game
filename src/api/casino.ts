/**
 * Casino / Mini-Games API
 *
 * Endpoints used by CasinoView for the Wheel (popular games) and Mahjong tabs.
 * Context scopes:
 *  - Global Mode (isFromHome / isFromBottomNav = true): no X-Club header
 *  - Club Mode (clubId in route query): X-Club: <club_id> header
 *
 * All endpoints are POST. Token is handled globally by http.ts interceptor.
 *
 * Note: The `shouldAttachXClub` rule in http.ts does NOT cover /extend/extend/...
 * routes, so we pass X-Club explicitly in each club-mode call via Axios config.
 */

import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type { AxiosRequestConfig } from 'axios'

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface ExtendGameRecord {
  id?: number
  game_id?: number
  game_name?: string
  game_api_type?: string
  game_code?: string
  game_type?: number | string
  game_icon?: string
  game_url_p?: string
  is_popular?: number
  is_popular_p?: number
  order_sort?: number
  sub_game_type?: string
  game_room_id?: number
  room_id?: number
  amount?: number
  parent_id?: number
  desc?: string
  status?: number
  [key: string]: unknown
}

export interface ExtendGameListResponse {
  total?: number
  list?: ExtendGameRecord[]
  records?: ExtendGameRecord[]
  [key: string]: unknown
}

export interface ExtendGameClubListRecord {
  amount: number
  club_id: number
  club_name: string
  currency_type: number
  icon: string
  gold?: number
  logo?: string
  [key: string]: unknown
}

export interface JoinGameResponse {
  url?: string
  game_url?: string
  [key: string]: unknown
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Detect mobile / tablet vs desktop. Returns 1 for mobile, 2 for desktop. */
export function getDeviceType(): number {
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 1 : 2
}

/** Build Axios config that injects X-Club header for club-mode requests. */
function withClub(clubId?: number): AxiosRequestConfig | undefined {
  if (!clubId) return undefined
  return {
    headers: { 'X-Club': String(clubId) },
  }
}

// ─── Section 2A — fetchPopularGames ──────────────────────────────────────────

/**
 * Global Mode: /api/extend/extend/game/record/list/popular/home
 */
export async function getPopularGamesHome(params: {
  device_type?: number
  search?: string
}): Promise<ApiResponse<ExtendGameListResponse>> {
  const response = await http.post<ApiResponse<ExtendGameListResponse>>(
    '/extend/extend/game/record/list/popular/home',
    {
      device_type: params.device_type ?? getDeviceType(),
      search: params.search ?? '',
    },
  )
  return response.data
}

/**
 * Club Mode: /api/extend/extend/game/record/list/popular
 */
export async function getPopularGamesClub(
  params: { device_type?: number; search?: string },
  clubId: number,
): Promise<ApiResponse<ExtendGameListResponse>> {
  const response = await http.post<ApiResponse<ExtendGameListResponse>>(
    '/extend/extend/game/record/list/popular',
    {
      device_type: params.device_type ?? getDeviceType(),
      search: params.search ?? '',
    },
    withClub(clubId),
  )
  return response.data
}

// ─── Section 2B — fetchPopularBannerGames ────────────────────────────────────

/**
 * Global Mode: /api/extend/extend/game/record/list/popular/main/home
 */
export async function getPopularBannerGamesHome(params: {
  device_type?: number
  game_type?: string
  search?: string
}): Promise<ApiResponse<ExtendGameListResponse>> {
  const response = await http.post<ApiResponse<ExtendGameListResponse>>(
    '/extend/extend/game/record/list/popular/main/home',
    {
      device_type: params.device_type ?? getDeviceType(),
      game_type: params.game_type ?? '',
      search: params.search ?? '',
    },
  )
  return response.data
}

/**
 * Club Mode: /api/extend/extend/game/record/list/popular/main
 */
export async function getPopularBannerGamesClub(
  params: { device_type?: number; game_type?: string; search?: string },
  clubId: number,
): Promise<ApiResponse<ExtendGameListResponse>> {
  const response = await http.post<ApiResponse<ExtendGameListResponse>>(
    '/extend/extend/game/record/list/popular/main',
    {
      device_type: params.device_type ?? getDeviceType(),
      game_type: params.game_type ?? '',
      search: params.search ?? '',
    },
    withClub(clubId),
  )
  return response.data
}

// ─── Section 4 — fetchGamesByCategory ────────────────────────────────────────

export type CategoryKey =
  | 'zhenren'
  | 'dianzi'
  | 'tiyu'
  | 'buyu'
  | 'dianjing'
  | 'board'
  | 'lottery'
  | 'minigame'

/** Maps category key → game_api_type array (from API spec) */
export const CATEGORY_API_TYPES: Record<CategoryKey, string[]> = {
  zhenren:  ['real_name', 'real_evo', 'real_obo', 'real_pa', 'panda_fblive', 'fb_live', 'panda_asg'],
  dianzi:   ['real_elect', 'panda_pgs', 'slots_pgsoft', 'zf_pgsoft', 'slots_fc', 'slots_cq9', 'slots_fg', 'slots_pa'],
  tiyu:     ['panda_fbs', 'fb_sports'],
  buyu:     ['real_fish', 'sea_jdb', 'panda_jdb', 'slots_jdb'],
  dianjing: ['real_sports'],
  board:    ['go_poker'],
  lottery:  ['hn_marbles'],
  minigame: ['ky_poker', 'leg_poker', 't1_game'],
}

/**
 * Global Mode: /api/extend/extend/game/record/list/home
 */
export async function getGamesByCategoryHome(params: {
  game_api_type: string[]
  device_type?: number
  search?: string
  limit?: number
  offset?: number
  id?: number
}): Promise<ApiResponse<ExtendGameListResponse>> {
  const response = await http.post<ApiResponse<ExtendGameListResponse>>(
    '/extend/extend/game/record/list/home',
    {
      limit: params.limit ?? 300,
      offset: params.offset ?? 0,
      device_type: params.device_type ?? 4,
      game_api_type: params.game_api_type,
      search: params.search ?? '',
      id: params.id ?? 10,
    },
  )
  return response.data
}

/**
 * Club Mode: /api/extend/extend/game/record/list
 */
export async function getGamesByCategoryClub(
  params: {
    game_api_type: string[]
    device_type?: number
    search?: string
    limit?: number
    offset?: number
    id?: number
  },
  clubId: number,
): Promise<ApiResponse<ExtendGameListResponse>> {
  const response = await http.post<ApiResponse<ExtendGameListResponse>>(
    '/extend/extend/game/record/list',
    {
      limit: params.limit ?? 300,
      offset: params.offset ?? 0,
      device_type: params.device_type ?? 4,
      game_api_type: params.game_api_type,
      search: params.search ?? '',
      id: params.id ?? 10,
    },
    withClub(clubId),
  )
  return response.data
}

// ─── Section 5B — Club Wallet (Global Mode Only) ─────────────────────────────

/**
 * /api/extend/extend/game/club/list
 */
export async function getGameClubList(params?: {
  device_type?: number
  search?: string
}): Promise<ApiResponse<{ list: ExtendGameClubListRecord[] }>> {
  const response = await http.post<ApiResponse<{ list: ExtendGameClubListRecord[] }>>(
    '/extend/extend/game/club/list',
    {
      device_type: params?.device_type ?? getDeviceType(),
      search: params?.search ?? '',
    },
  )
  return response.data
}

// ─── Section 5C — Join Game ───────────────────────────────────────────────────

export interface JoinGameParams {
  game_api_type: string
  game_room_id: number
  game_type: string
  amount?: number
  device_type?: number
  currency_type?: number
}

/**
 * /api/extend/extend/enter/join/game
 * Returns a URL to open for game play.
 */
export async function joinCasinoGame(
  params: JoinGameParams,
  clubId?: number,
): Promise<ApiResponse<JoinGameResponse>> {
  const response = await http.post<ApiResponse<JoinGameResponse>>(
    '/extend/extend/enter/join/game',
    {
      game_api_type: params.game_api_type,
      game_room_id: params.game_room_id || 0,
      game_type: String(params.game_type || ''),
      amount: params.amount ?? 0,
      device_type: params.device_type ?? getDeviceType(),
      currency_type: params.currency_type ?? 1, // 1 = Alliance Currency
    },
    withClub(clubId),
  )
  return response.data
}

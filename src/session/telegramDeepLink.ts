import router from '@/router'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { useRoomListStore } from '@/stores/roomList'
import { enterTable, isBridgeHandshakeDone, onBridgeHandshakeDone } from '@/bridge/core'
import { setH5Visible } from '@/bridge/channels/uiChannel'
import { postOrgClubJoinApi, postOrgClubSearchByIdApi } from '@/api/org'
import { getUserClubApi } from '@/api/user'
import type { EnterTablePayload } from '@bridge-protocol'
import type { RoomRecord } from '@/api/models/roomcenter'
import { pinia } from '@/stores/pinia'
import { showFailToast } from 'vant'
import { createLogger } from '@/utils/logger'
import { readTelegramStartParam } from '@/utils/telegramStartParam'

const log = createLogger('[tg-deeplink]')

// Telegram Mini App deep-link actions (start_param format: `<action>_<roomId>[_<clubRandomId>]`):
//   login_<roomId>_<clubRandomId> → after login, auto-join the club then enter that room's table.
//   home_<roomId>_<clubRandomId>  → after login, auto-join the club then open the record detail.
// The trailing <clubRandomId> is the designated club's random id (backend-provided); it is
// optional so legacy `login_<roomId>` / `home_<roomId>` links still work (club derived from room).
type DeepLinkAction = 'login' | 'home'

interface DeepLinkIntent {
  action: DeepLinkAction
  roomId: string
  clubRandomId: string
}

// The deep link must run only once. ensureTelegramAutoLogin is called from several
// places, so this guard prevents re-entering the table / re-navigating.
let dispatched = false
// Max time to wait for the Cocos handshake before entering a table.
const BRIDGE_READY_TIMEOUT_MS = 15000

function toSafeInt(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? Math.floor(num) : 0
}

// Read the raw start_param from the Telegram environment. The concrete reading logic
// lives in the dependency-free util so channelPackage.resolveInviteCode() can reuse it.
function readRawStartParam(): string {
  return readTelegramStartParam()
}

// Parse start_param into { action, roomId, clubRandomId }. Format:
// `<action>_<roomId>[_<clubRandomId>]` — roomId and clubRandomId are digits only. The
// clubRandomId is the designated club to auto-join; absent for legacy links.
function parseStartParam(raw: string): DeepLinkIntent | null {
  const parts = raw.split('_')
  const action = parts[0]
  if (action !== 'login' && action !== 'home') {
    return null
  }

  const roomId = (parts[1] || '').trim()
  if (!roomId || !/^\d+$/.test(roomId)) {
    return null
  }

  const clubRandomIdRaw = (parts[2] || '').trim()
  const clubRandomId = /^\d+$/.test(clubRandomIdRaw) ? clubRandomIdRaw : ''

  return { action, roomId, clubRandomId }
}

// Whether a Telegram deep link is still pending, so the login flow can skip its default
// landing navigation and let the deep link take over the destination route.
export function hasPendingTelegramDeepLink(): boolean {
  return !dispatched && parseStartParam(readRawStartParam()) !== null
}

// Dispatch the Telegram deep-link action after a successful login. Runs at most once,
// and only when a session token already exists.
export function runTelegramDeepLinkAfterLogin(): void {
  if (dispatched) {
    return
  }

  const intent = parseStartParam(readRawStartParam())
  if (!intent) {
    return
  }

  const gameStore = useGameStore(pinia)
  if (!gameStore.sessionToken.trim()) {
    // Not logged in yet: ensureTelegramAutoLogin will re-invoke this on success.
    return
  }

  dispatched = true
  log.info('dispatch telegram deep link:', intent)

  void dispatchIntent(intent).catch((error) => {
    log.warn('dispatch telegram deep link failed:', error)
  })
}

async function dispatchIntent(intent: DeepLinkIntent): Promise<void> {
  if (intent.action === 'home') {
    await ensureDeepLinkClubMembership(intent)
    await openRoomRecordDetail(intent.roomId)
    return
  }
  await enterRoomTableByRoomId(intent)
}

// Per the backend contract, clicking a Telegram game link only forwards to the H5 page and
// does not hit the backend — so the H5 page must enroll the user itself. The designated club
// is the random id carried in the start_param (login_<roomId>_<clubRandomId>); legacy links
// without it fall back to the room's own club (relate_club_ids).
async function ensureDeepLinkClubMembership(
  intent: DeepLinkIntent,
  room?: RoomRecord,
): Promise<void> {
  const clubRandomId = toSafeInt(intent.clubRandomId)
  if (clubRandomId) {
    await ensureClubMembershipByRandomId(clubRandomId)
    return
  }

  // Legacy link without a club id: derive the club from the room.
  const resolvedRoom = room ?? (await resolveRoomForIntent(intent.roomId))
  const relateClubIds = Array.isArray(resolvedRoom?.relate_club_ids)
    ? resolvedRoom?.relate_club_ids ?? []
    : []
  await ensureClubMembership(toSafeInt(relateClubIds[0]))
}

async function resolveRoomForIntent(roomId: string): Promise<RoomRecord | undefined> {
  const roomListStore = useRoomListStore(pinia)
  return resolveRoomRecord(roomListStore, roomId)
}

// Resolve a club random id to its internal club_id, then ensure membership. Used for
// the backend's login_<roomId>_<clubRandomId> / home_<roomId>_<clubRandomId> links.
async function ensureClubMembershipByRandomId(clubRandomId: number): Promise<void> {
  if (!clubRandomId) {
    return
  }

  const userInfoStore = useUserInfoStore(pinia)
  const existing = userInfoStore.clubList.find(
    (club) => toSafeInt(club.random_id) === clubRandomId,
  )
  if (existing) {
    userInfoStore.setCurrentClubById(toSafeInt(existing.club_id))
    return
  }

  let clubId = 0
  try {
    const res = await postOrgClubSearchByIdApi(
      { club_random_id: clubRandomId },
      { suppressBusinessToast: true },
    )
    clubId = toSafeInt((res.data as Record<string, unknown> | undefined)?.club_id)
  } catch (error) {
    log.warn('resolve club by random id failed:', clubRandomId, error)
  }

  await ensureClubMembership(clubId)
}

// If the user is not already a member of the club, programmatically trigger "join this club"
// (the same /org/club/user/join/apply call the Join button makes). Clubs configured with
// auto-audit (joinWithoutApproval) enroll immediately; others file a pending application.
// Runs silently (no toast) since it happens automatically during deep-link handling.
async function ensureClubMembership(clubId: number): Promise<void> {
  if (!clubId) {
    return
  }

  const userInfoStore = useUserInfoStore(pinia)
  const alreadyMember = userInfoStore.clubList.some(
    (club) => toSafeInt(club.club_id) === clubId,
  )
  if (alreadyMember) {
    userInfoStore.setCurrentClubById(clubId)
    return
  }

  try {
    log.info('auto-join club for telegram deep link, clubId:', clubId)
    await postOrgClubJoinApi({ club_id: clubId }, { suppressBusinessToast: true })
    // Refresh membership so an auto-audit club shows up immediately, then select it.
    await getUserClubApi()
    userInfoStore.setCurrentClubById(clubId)
  } catch (error) {
    log.warn('auto-join club failed:', error)
  }
}

// home_<roomId>: open that room's record/result detail page.
async function openRoomRecordDetail(roomId: string): Promise<void> {
  await router
    .replace({
      name: 'mine-career-record-detail',
      params: { source: 'club' },
      query: { room_id: roomId, id: roomId },
    })
    .catch((error) => {
      log.warn('navigate to record detail failed:', error)
    })
}

// login_<roomId>_<clubRandomId>: enter that room's table directly, with no intermediate
// page shown, after auto-joining the designated club.
async function enterRoomTableByRoomId(intent: DeepLinkIntent): Promise<void> {
  const roomId = intent.roomId
  const gameStore = useGameStore(pinia)
  const userInfoStore = useUserInfoStore(pinia)
  const roomListStore = useRoomListStore(pinia)

  // Hide the H5 layer so neither the home nor the room list (扑克专区) page is ever shown.
  // This is the same visibility toggle Cocos itself uses when a table opens, so it does
  // not affect the game canvas or the bridge — it only keeps the H5 UI out of sight while
  // we resolve the room and hand off to Cocos.
  setH5Visible(false)

  // Keep the H5 route on game-list (the proven working entry path) but hidden, so exiting
  // the table lands the player on a sensible page.
  await router.replace({ name: 'game-list' }).catch(() => {
    /* already on target route or cancelled by a guard — ignore */
  })

  const room = await resolveRoomRecord(roomListStore, roomId)
  if (!room) {
    log.warn('room not found for deep link, roomId:', roomId)
    setH5Visible(true)
    showFailToast('房间不存在或已关闭')
    return
  }

  // Enroll the user into the designated club before entering (auto-join if not a member):
  // the start_param's club random id, or the room's own club for legacy links.
  const roomRelateClubIds = Array.isArray(room.relate_club_ids) ? room.relate_club_ids : []
  await ensureDeepLinkClubMembership(intent, room)

  let wsPort = Number(gameStore.websocketPort) || 0
  if (!wsPort) {
    try {
      wsPort = await LoginSession.EnsureWS()
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取 websocket 端口失败'
      setH5Visible(true)
      showFailToast(message)
      return
    }
  }

  const clubId =
    toSafeInt(userInfoStore.currentClub?.club_id) || toSafeInt(roomRelateClubIds[0])
  const clubRandomId = toSafeInt(userInfoStore.currentClub?.random_id)

  const payload: EnterTablePayload = {
    userName: gameStore.loginNickname || gameStore.loginAccount || 'guest',
    userId: gameStore.loginUserId || gameStore.loginAccount || '',
    token: gameStore.sessionToken,
    websocketPort: wsPort,
    // Reuse the standard club-room entry source so Cocos handles it identically to a
    // manual tap (no game-side change needed for the Telegram deep link).
    from: 'h5-club-table',
    clubId,
    clubRandomId,
    roomId: String(room.rid ?? roomId),
    roomName: String(room.name ?? ''),
    roomInfo: room,
  }

  // The Cocos scene may still be loading; wait for the handshake before entering so
  // the enter-table request isn't dropped.
  await whenBridgeReady()
  const entered = enterTable(payload)
  gameStore.setLastEnterTable(payload)

  // If Cocos never received the enter (no game runtime, e.g. a plain browser), bring the
  // H5 UI back so the user isn't stuck on a hidden/blank screen. In the real game shell
  // this returns a message and Cocos takes over the screen, so H5 stays hidden.
  if (!entered) {
    setH5Visible(true)
  }
}

// Get the room record from the room-list store: return the cached one if present,
// otherwise fetch the detail once by rid.
async function resolveRoomRecord(
  roomListStore: ReturnType<typeof useRoomListStore>,
  roomId: string,
): Promise<RoomRecord | undefined> {
  try {
    await roomListStore.bootstrapRoomList()
  } catch (error) {
    log.warn('bootstrap room list failed:', error)
  }

  let room = findRoomByRid(roomListStore.records, roomId)
  if (room) {
    return room
  }

  await roomListStore.fetchRoomDetailByRid(Number(roomId))
  room = findRoomByRid(roomListStore.records, roomId)
  return room
}

function findRoomByRid(records: RoomRecord[], roomId: string): RoomRecord | undefined {
  return records.find((record) => String(record.rid ?? '') === roomId)
}

// Wait for the Cocos handshake to complete; after the timeout still attempt to enter
// (enterTable itself surfaces a "scene not ready" prompt when applicable).
function whenBridgeReady(timeoutMs = BRIDGE_READY_TIMEOUT_MS): Promise<void> {
  if (isBridgeHandshakeDone()) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = (): void => {
      if (settled) {
        return
      }
      settled = true
      off()
      clearTimeout(timer)
      resolve()
    }

    const off = onBridgeHandshakeDone(finish)
    const timer = setTimeout(finish, timeoutMs)
  })
}

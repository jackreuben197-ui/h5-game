import router from '@/router'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { useRoomListStore } from '@/stores/roomList'
import { enterTable, isBridgeHandshakeDone, onBridgeHandshakeDone } from '@/bridge/core'
import { setH5Visible } from '@/bridge/channels/uiChannel'
import type { EnterTablePayload } from '@bridge-protocol'
import type { RoomRecord } from '@/api/models/roomcenter'
import { pinia } from '@/stores/pinia'
import { showFailToast } from 'vant'
import { createLogger } from '@/utils/logger'

const log = createLogger('[tg-deeplink]')

// Telegram Mini App deep-link actions (start_param format: `<action>_<roomId>`):
//   login_<roomId> → after login, open the room list and auto-enter that room's table.
//   home_<roomId>  → after login, open that room's record/result detail page.
type DeepLinkAction = 'login' | 'home'

interface DeepLinkIntent {
  action: DeepLinkAction
  roomId: string
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

// Read the raw start_param from the Telegram environment, in priority order:
//   1) Telegram SDK's parsed initDataUnsafe.start_param (most reliable in real Telegram).
//   2) URL query param: real Telegram carries tgWebAppStartParam; `startapp` is convenient
//      for hand-crafted links / local testing.
//   3) Fallback: parse start_param out of the raw initData (tgWebAppData) string.
function readRawStartParam(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const unsafe = window.Telegram?.WebApp?.initDataUnsafe?.start_param
  if (typeof unsafe === 'string' && unsafe.trim()) {
    return unsafe.trim()
  }

  const fromUrl = readUrlQueryParam('tgWebAppStartParam') || readUrlQueryParam('startapp')
  if (fromUrl) {
    return fromUrl
  }

  const initData = String(window.__H5_TG_INIT_DATA__ || window.Telegram?.WebApp?.initData || '').trim()
  if (initData) {
    try {
      const fromInitData = new URLSearchParams(initData).get('start_param')
      if (fromInitData && fromInitData.trim()) {
        return fromInitData.trim()
      }
    } catch (error) {
      log.warn('parse start_param from initData failed:', error)
    }
  }

  return ''
}

// Read a query param from both location.search and the hash. With a hash router the
// param may live before the `#` (search), after a `?` in the hash, or directly after
// the `#` (Telegram appends `#tgWebAppData=...&tgWebAppStartParam=...` with no `?`).
function readUrlQueryParam(name: string): string {
  try {
    const fromSearch = new URLSearchParams(window.location.search || '').get(name)
    if (fromSearch && fromSearch.trim()) {
      return fromSearch.trim()
    }

    const hash = window.location.hash || ''
    const queryIndex = hash.indexOf('?')
    if (queryIndex >= 0) {
      const fromHash = new URLSearchParams(hash.slice(queryIndex + 1)).get(name)
      if (fromHash && fromHash.trim()) {
        return fromHash.trim()
      }
    }

    // Real Telegram appends tgWebAppStartParam straight after the `#` (no `?`),
    // e.g. #tgWebAppData=...&tgWebAppStartParam=login_123 — strip the leading `#`//`#/`
    // and parse the whole fragment as a query string.
    const hashRaw = hash.replace(/^#\/?/, '')
    const fromHashDirect = new URLSearchParams(hashRaw).get(name)
    if (fromHashDirect && fromHashDirect.trim()) {
      return fromHashDirect.trim()
    }
  } catch (error) {
    log.warn('read url query param failed:', name, error)
  }
  return ''
}

// Parse start_param into { action, roomId }. Format: `<action>_<roomId>` (roomId digits only).
function parseStartParam(raw: string): DeepLinkIntent | null {
  const separatorIndex = raw.indexOf('_')
  if (separatorIndex <= 0) {
    return null
  }

  const action = raw.slice(0, separatorIndex)
  const roomId = raw.slice(separatorIndex + 1).trim()
  if (!roomId || !/^\d+$/.test(roomId)) {
    return null
  }

  if (action === 'login' || action === 'home') {
    return { action, roomId }
  }
  return null
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
    await openRoomRecordDetail(intent.roomId)
    return
  }
  await enterRoomTableByRoomId(intent.roomId)
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

// login_<roomId>: enter that room's table directly, with no intermediate page shown.
async function enterRoomTableByRoomId(roomId: string): Promise<void> {
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

  const relateClubIds = Array.isArray(room.relate_club_ids) ? room.relate_club_ids : []
  const clubId =
    toSafeInt(userInfoStore.currentClub?.club_id) || toSafeInt(relateClubIds[0])
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

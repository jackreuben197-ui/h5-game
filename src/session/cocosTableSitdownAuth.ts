import {
  BRIDGE_ACTION,
  BRIDGE_MSG_TYPE,
  TABLE_SITDOWN_AUTH_CANCEL_REASON,
  TABLE_SITDOWN_AUTH_STATE,
  type EnterTablePayload,
} from '@bridge-protocol'
import { enterTable, sendBridgeMessage } from '@/bridge/core'
import { pauseCocosWsWrites, resumeCocosWsWrites } from '@/bridge/ws'
import StorageKey from '@/constants/storageKey'
import { t } from '@/i18n'
import LoginSession from '@/session/loginSession'
import { syncPostAuthData } from '@/session/postAuthSync'
import { pinia } from '@/stores/pinia'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { localStore } from '@/utils/localStore'

export interface CompleteCocosTableSitdownAuthOptions {
  realToken: string
  account: string
  expireAt?: number
}

export interface CompleteCocosTableSitdownAuthResult {
  destination: 'table' | 'official-home'
}

function resolveRequiredChannelClubId(roomInfo: unknown): number {
  const userInfoStore = useUserInfoStore(pinia)
  const channelClubId = Number(userInfoStore.channelDefaultClub?.club_id || 0)
  if (Number.isFinite(channelClubId) && channelClubId > 0) {
    return Math.floor(channelClubId)
  }
  const roomClubId = Number((roomInfo as Record<string, unknown> | null)?.club_id || 0)
  return Number.isFinite(roomClubId) && roomClubId > 0 ? Math.floor(roomClubId) : 0
}

function hasJoinedClub(clubId: number): boolean {
  if (clubId <= 0) return true
  return useUserInfoStore(pinia).clubList.some((club) => Number(club.club_id) === clubId)
}

/**
 * 牌桌游客入座登录事务：
 * 登录接口已返回真实 token 后，释放游客会话、重建真实账号初始化数据，
 * 最后携带原牌桌快照通知已重置的 Cocos 重新进桌。新房间快照到达后续接 Sitdown。
 */
export async function completeCocosTableSitdownAuth(
  options: CompleteCocosTableSitdownAuthOptions,
): Promise<CompleteCocosTableSitdownAuthResult> {
  const gameStore = useGameStore(pinia)
  const previousTable = gameStore.lastEnterTable
  const realToken = options.realToken.trim()
  const requiredChannelClubId = resolveRequiredChannelClubId(previousTable?.roomInfo)

  if (!previousTable?.roomId || !previousTable.roomInfo) {
    throw new Error(t('UIClub_Enter'))
  }
  if (!realToken) {
    throw new Error(t('UIClub_Done'))
  }

  pauseCocosWsWrites()
  try {
    sendBridgeMessage(
      BRIDGE_ACTION.TABLE_SITDOWN_AUTH,
      {
        state: TABLE_SITDOWN_AUTH_STATE.SWITCHING,
        roomId: previousTable.roomId,
      },
      { msgtype: BRIDGE_MSG_TYPE.H5 },
    )

    LoginSession.ClearWS()
    gameStore.clearLogin()

    const expireAt = Number(options.expireAt || 0)
    if (Number.isFinite(expireAt) && expireAt > 0) {
      localStore.setItem(StorageKey.TOKEN_EXPIREAT, expireAt)
    }

    gameStore.setGuestAccount(false)
    gameStore.setSessionToken(realToken)
    gameStore.setLoginUser({
      account: options.account,
      nickname: options.account,
      userId: '',
    })

    const syncResult = await syncPostAuthData()

    const websocketPort = LoginSession.WSPort
    const userId = gameStore.loginUserId.trim()
    const nickname = gameStore.loginNickname.trim() || options.account
    if (
      !syncResult.websocketSynced ||
      !syncResult.userInfoSynced ||
      !syncResult.userClubSynced ||
      !userId ||
      websocketPort <= 0 ||
      gameStore.isGuestAccount
    ) {
      throw new Error(t('UIClub_Text71'))
    }

    if (!hasJoinedClub(requiredChannelClubId)) {
      sendBridgeMessage(
        BRIDGE_ACTION.TABLE_SITDOWN_AUTH,
        {
          state: TABLE_SITDOWN_AUTH_STATE.CANCELLED,
          reason: TABLE_SITDOWN_AUTH_CANCEL_REASON.USER_NOT_IN_CHANNEL_CLUB,
          clubId: requiredChannelClubId,
        },
        { msgtype: BRIDGE_MSG_TYPE.H5 },
      )
      return { destination: 'official-home' }
    }

    const payload: EnterTablePayload = {
      ...previousTable,
      userName: nickname,
      userId,
      token: realToken,
      websocketPort,
    }

    resumeCocosWsWrites()
    const message = enterTable(payload)
    if (!message) {
      throw new Error(t('UIClub_Enter'))
    }
    gameStore.setLastEnterTable(payload)

    return { destination: 'table' }
  } finally {
    resumeCocosWsWrites()
  }
}

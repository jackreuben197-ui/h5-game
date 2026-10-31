import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import type { EnterTablePayload } from '@bridge-protocol'
import type { MttListRecord, RoomRecord } from '@/api/models/roomcenter'
import { enterTable } from '@/bridge/core'
import { t } from '@/i18n'
import { ensureExperienceSessionReady } from '@/session/experienceSession'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'

export function useChannelCNavigation(beforeNavigate = () => {}) {
  const router = useRouter()
  const game = useGameStore()
  const user = useUserInfoStore()
  const joiningId = ref<string | null>(null)

  async function joinRoom(room: RoomRecord) {
    if (joiningId.value) return
    joiningId.value = String(room.rid)
    try {
      if (!(await ensureExperienceSessionReady())) {
        throw new Error(t('UIChannelC_SessionNotReady'))
      }
      const websocketPort = await LoginSession.EnsureWS()
      const club = user.channelDefaultClub
      const payload: EnterTablePayload = {
        userName: game.loginNickname || game.loginAccount || 'guest',
        userId: game.loginUserId || game.loginAccount || '',
        token: game.sessionToken,
        websocketPort,
        from: 'h5-club-table',
        clubId: Number(club?.club_id) || 0,
        clubRandomId: Number(club?.random_id) || 0,
        roomId: String(room.rid),
        roomName: String(room.name || ''),
        roomInfo: room,
      }
      beforeNavigate()
      enterTable(payload)
      game.setLastEnterTable(payload)
    } catch (error) {
      showFailToast(error instanceof Error ? error.message : t('UIChannelC_EnterFailed'))
    } finally {
      joiningId.value = null
    }
  }

  function openMatch(match: MttListRecord) {
    beforeNavigate()
    void router.push({ name: 'mtt-detail', query: { id: String(match.match_id) } })
  }

  return { joiningId, joinRoom, openMatch }
}

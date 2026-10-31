import { computed } from 'vue'
import { useRoomListStore } from '@/stores/roomList'
import { useMttListStore } from '@/stores/mttList'
import { useUserInfoStore } from '@/stores/userInfo'
import { useAppConfigStore } from '@/stores/appConfig'
import { usePlatformDiamondVisibility } from '@/composables/usePlatformDiamondVisibility'
import { checkIsShowForClubAndTribe } from '@/utils/roomVisibility'
import { filterVisibleMttRecords } from '@/utils/mttVisibility'

export function useChannelCFeed() {
  const rooms = useRoomListStore()
  const mtts = useMttListStore()
  const user = useUserInfoStore()
  const app = useAppConfigStore()
  const diamond = usePlatformDiamondVisibility()
  const club = computed(() => user.channelDefaultClub)
  const clubId = computed(() => Number(club.value?.club_id) || 0)
  const tribeId = computed(
    () => Number((club.value as Record<string, unknown> | null)?.tribe_id) || 0,
  )
  const visibleRooms = computed(() => {
    if (!clubId.value) return []
    return rooms.records.filter(
      (room) =>
        Number(room.game_type) < 5 &&
        checkIsShowForClubAndTribe(room, clubId.value, tribeId.value, true, diamond.value),
    )
  })
  const visibleMatches = computed(() => {
    if (!clubId.value) return []
    return filterVisibleMttRecords(
      mtts.records,
      mtts.mttIdMetaMap,
      clubId.value,
      tribeId.value,
      app.clubDisplayPlatformMtt,
      diamond.value,
    )
  })
  const tournamentSeries = computed(() => mtts.seriesList)
  return { club, clubId, tribeId, visibleRooms, visibleMatches, tournamentSeries }
}

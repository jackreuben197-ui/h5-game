import { computed, ref, watch, type Ref } from 'vue'
import type { MttListRecord, MttSeriesInfoRecord, RoomRecord } from '@/api/models/roomcenter'
import type { MttFilter, PokerFilter } from '@/features/channelC/model'
import {
  getRoomBlindOptions,
  getTournamentTypeOptions,
  matchesPokerFilters,
  matchesTournamentFilters,
} from '@/features/channelC/filters'

export function useChannelCFilters(
  rooms: Ref<RoomRecord[]>,
  matches: Ref<MttListRecord[]>,
  series: Ref<MttSeriesInfoRecord[]>,
) {
  // 空数组表示全部；同组多选取并集，不同筛选组之间取交集。
  const pokerFilter = ref<PokerFilter[]>([])
  const blindFilter = ref<number[]>([])
  const tournamentFilter = ref<number[]>([])
  const mttFilter = ref<MttFilter[]>([])
  const blinds = computed(() => getRoomBlindOptions(rooms.value))
  const tournamentTypes = computed(() => getTournamentTypeOptions(series.value))
  const filteredRooms = computed(() =>
    rooms.value.filter((room) => matchesPokerFilters(room, pokerFilter.value, blindFilter.value)),
  )
  const filteredMatches = computed(() =>
    matches.value.filter((match) =>
      matchesTournamentFilters(match, tournamentFilter.value, mttFilter.value),
    ),
  )

  // 仅后台移除盲注/配置时清理失效选项；切换玩法不重置盲注。
  watch(blinds, (values) => {
    blindFilter.value = blindFilter.value.filter((value) => values.includes(value))
  })
  watch(tournamentTypes, (options) => {
    tournamentFilter.value = tournamentFilter.value.filter((value) =>
      options.some((option) => option.value === value),
    )
  })

  function resetFilters() {
    pokerFilter.value = []
    blindFilter.value = []
    tournamentFilter.value = []
    mttFilter.value = []
  }

  return {
    pokerFilter,
    blindFilter,
    tournamentFilter,
    mttFilter,
    blinds,
    tournamentTypes,
    filteredRooms,
    filteredMatches,
    resetFilters,
  }
}

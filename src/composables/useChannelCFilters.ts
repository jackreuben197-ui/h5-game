import { computed, ref, unref, watch, type Ref } from 'vue'
import type { MttListRecord, MttSeriesInfoRecord, RoomRecord } from '@/api/models/roomcenter'
import type { MttFilter, PokerFilter } from '@/features/channelC/model'
import {
  getRoomBlindOptions,
  getTournamentTypeOptions,
  matchesPokerFilters,
  matchesTournamentFilters,
} from '@/features/channelC/filters'
import {
  readChannelCListFilters,
  saveChannelCListFilters,
  type ChannelCListFilters,
} from '@/features/channelC/listState'

export function useChannelCFilters(
  rooms: Ref<RoomRecord[]>,
  matches: Ref<MttListRecord[]>,
  series: Ref<MttSeriesInfoRecord[]>,
  persist: boolean | Ref<boolean> = false,
) {
  const shouldPersist = computed(() => unref(persist))
  const initialFilters: ChannelCListFilters | null = shouldPersist.value
    ? readChannelCListFilters()
    : null

  // 空数组表示全部；同组多选取并集，不同筛选组之间取交集。
  const pokerFilter = ref<PokerFilter[]>(initialFilters?.poker ?? [])
  const blindFilter = ref<number[]>(initialFilters?.blind ?? [])
  const tournamentFilter = ref<number[]>(initialFilters?.tournament ?? [])
  const mttFilter = ref<MttFilter[]>(initialFilters?.mtt ?? [])

  function applyFilterState(state: ChannelCListFilters): void {
    pokerFilter.value = [...state.poker]
    blindFilter.value = [...state.blind]
    tournamentFilter.value = [...state.tournament]
    mttFilter.value = [...state.mtt]
  }

  watch(shouldPersist, (enabled) => {
    if (enabled) applyFilterState(readChannelCListFilters())
  })

  // 同步落盘，保证用户筛选后立刻进入详情也不会丢失当前条件。
  watch(
    [pokerFilter, blindFilter, tournamentFilter, mttFilter],
    () => {
      if (!shouldPersist.value) return
      saveChannelCListFilters({
        poker: [...pokerFilter.value],
        blind: [...blindFilter.value],
        tournament: [...tournamentFilter.value],
        mtt: [...mttFilter.value],
      })
    },
    { flush: 'sync' },
  )

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

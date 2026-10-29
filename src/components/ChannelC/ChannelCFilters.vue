<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import type { MttFilter, PokerFilter } from '@/features/channelC/model'
import {
  formatRoomBlind,
  toggleFilterValue,
  type ChannelCFilterOption,
} from '@/features/channelC/filters'
import ChannelCMultiSelect from './ChannelCMultiSelect.vue'

const props = defineProps<{
  section: 'poker' | 'mtt'
  blinds: number[]
  tournamentTypes: ChannelCFilterOption<number>[]
}>()
const poker = defineModel<PokerFilter[]>('poker', { required: true })
const blind = defineModel<number[]>('blind', { required: true })
const tournament = defineModel<number[]>('tournament', { required: true })
const mtt = defineModel<MttFilter[]>('mtt', { required: true })
const pokerOptions = computed<ChannelCFilterOption<PokerFilter>[]>(() => [
  { value: 'nlh', label: t('adaptation10022') },
  { value: 'plo', label: t('adaptation10009') },
  { value: 'short', label: t('PokerType_2') },
])
const tournamentOptions = computed(() =>
  props.tournamentTypes.map((option) => ({ ...option, label: t(option.label) })),
)
const mttOptions = [
  { value: 'free', label: 'MTT_List_Freegame' },
  { value: 'paid', label: 'UIChannelC_PaidMatches' },
  { value: 'hunter', label: 'MTT_List_Huntergame' },
  { value: 'snowball', label: 'UIChannelC_SnowballMatches' },
] as const
</script>

<template>
  <div class="c-filter-row">
    <template v-if="section === 'poker'">
      <ChannelCMultiSelect
        v-model="poker"
        :all-label="t('UIChannelC_AllTables')"
        :options="pokerOptions"
      />
      <div class="c-filter-options" role="group" :aria-label="t('adaptation20006')">
        <button
          v-for="value in blinds"
          :key="value"
          type="button"
          class="c-filter"
          :class="{ selected: blind.includes(value) }"
          :aria-pressed="blind.includes(value)"
          @click="blind = toggleFilterValue(blind, value)"
        >
          {{ formatRoomBlind(value) }}
        </button>
      </div>
    </template>
    <template v-else>
      <ChannelCMultiSelect
        v-model="tournament"
        :all-label="t('UIChannelC_AllMatches')"
        :options="tournamentOptions"
      />
      <div class="c-filter-options" role="group" :aria-label="t('UIChannelC_AllMatches')">
        <button
          v-for="option in mttOptions"
          :key="option.value"
          type="button"
          class="c-filter"
          :class="{ selected: mtt.includes(option.value) }"
          :aria-pressed="mtt.includes(option.value)"
          @click="mtt = toggleFilterValue(mtt, option.value)"
        >
          {{ t(option.label) }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.c-filter-row {
  display: flex;
  align-items: center;
  gap: 0.128rem;
  min-width: 0;
  padding: 0.25rem 0;
}
.c-filter-options {
  display: flex;
  flex: 1;
  gap: 0.128rem;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
.c-filter {
  flex: 1 0 calc((100% - 0.512rem) / 5);
  min-width: max-content;
  box-sizing: border-box;
  padding: 0.227rem 0.15rem;
  border: 0;
  border-radius: 0.44rem;
  background: #ffffff30;
  color: #fff;
  font: inherit;
  font-size: 0.29rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  @include theme-light {
    &:not(.selected) {
      background: #fff;
      color: #17191e;
    }
  }
}
.c-filter.selected {
  background: #69beff;
  color: #fff;
}
</style>

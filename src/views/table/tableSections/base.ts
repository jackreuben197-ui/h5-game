import { t } from '@/i18n'
import type { TableFormFieldConfig } from '../template'
import {
  PLO_CARD_OPTIONS,
  SEAT_COUNT_NLH_OPTIONS,
  OP_DURATION_OPTIONS,
  GAME_RHYTHM_OPTIONS,
} from './constants'

export const baseSection: TableFormFieldConfig[] = [
  {
    type: 'select',
    get label() { return t('UICreateTable_HandsCardCount') },
    modelValue: 'plo_game_type',
    defaultValue: 4,
    options: PLO_CARD_OPTIONS,
    visibleWhen: [{ field: 'game_play_type', equals: 2 }],
  },
  {
    type: 'select',
    get label() { return t('UICreateTable_MaxSeatCount') },
    modelValue: 'seat_count',
    defaultValue: 2,
    options: SEAT_COUNT_NLH_OPTIONS,
  },
  {
    type: 'select',
    get label() { return t('UICreateTable_AutoSeatCount') },
    modelValue: 'autostart_min_players',
    defaultValue: 2,
    options: SEAT_COUNT_NLH_OPTIONS,
  },
  {
    type: 'select',
    get label() { return t('UIClub_RoomCreat_vCP1YSI0') },
    modelValue: 'op_duration',
    defaultValue: 15,
    options: OP_DURATION_OPTIONS,
  },
  {
    type: 'select',
    get label() { return t('UICreateRoomOptions4') },
    modelValue: 'game_rhythm',
    defaultValue: 0,
    options: GAME_RHYTHM_OPTIONS,
  },
  {
    type: 'switch',
    get label() { return t('UIGuildVIPEmptyTableCloseTip') },
    modelValue: 'auto_close',
    defaultValue: false,
  },
  {
    type: 'switch',
    label: 'Straddle',
    modelValue: 'straddle',
    defaultValue: false,
  },
  {
    type: 'switch',
    get label() { return t('UIAnteRandomJump1') },
    modelValue: 'random_ante',
    get tip() { return t('UIAnteRandomJump6') },
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
    visibleWhen: [
      { field: 'bombpot', notEquals: 1 },
      { field: 'game_play_type', equals: [1, 2] },
      { field: 'origin_type', notEquals: 4 },
    ],
  },
  {
    type: 'input',
    get label() { return t('UIAnteRandomJump2') },
    modelValue: 'min_ante',
    defaultValue: '',
    get placeholder() { return t('UIMine_PleaseEnter') },
    numberOnly: true,
    decimalDigits: 1,
    visibleWhen: [
      { field: 'random_ante', equals: 1 },
      { field: 'game_play_type', notEquals: 3 },
    ],
  },
  {
    type: 'input',
    get label() { return t('UIAnteRandomJump3') },
    modelValue: 'max_ante',
    defaultValue: '',
    get placeholder() { return t('UIMine_PleaseEnter') },
    numberOnly: true,
    decimalDigits: 1,
    visibleWhen: [
      { field: 'random_ante', equals: 1 },
      { field: 'game_play_type', notEquals: 3 },
    ],
  },
  {
    type: 'input',
    get label() { return t('UIAnteRandomJump5') },
    modelValue: 'ante_interval',
    defaultValue: '',
    get placeholder() { return t('UIMine_PleaseEnter') },
    numberOnly: true,
    decimalDigits: 1,
    visibleWhen: [
      { field: 'random_ante', equals: 1 },
      { field: 'game_play_type', notEquals: 3 },
    ],
  },
  {
    type: 'select',
    label: 'Ante',
    modelValue: 'ante',
    defaultValue: 0,
    options: [], // 由 createPokerTable.vue 中 anteOptions computed 动态注入
    visibleWhen: [
      { field: 'bombpot', notEquals: 1 },
      { field: 'random_ante', notEquals: 1 },
      { field: 'game_play_type', equals: [1, 2] },
    ],
  },
]

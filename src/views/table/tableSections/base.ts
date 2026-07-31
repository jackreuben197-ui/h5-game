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
    label: t('UICreateTable_HandsCardCount'),
    modelValue: 'plo_game_type',
    defaultValue: 4,
    options: PLO_CARD_OPTIONS,
    visibleWhen: [{ field: 'game_play_type', equals: 2 }],
  },
  {
    type: 'select',
    label: t('UICreateTable_MaxSeatCount'),
    modelValue: 'seat_count',
    defaultValue: 2,
    options: SEAT_COUNT_NLH_OPTIONS,
  },
  {
    type: 'select',
    label: t('UICreateTable_AutoSeatCount'),
    modelValue: 'autostart_min_players',
    defaultValue: 2,
    options: SEAT_COUNT_NLH_OPTIONS,
  },
  {
    type: 'select',
    label: t('UIClub_RoomCreat_vCP1YSI0'),
    modelValue: 'op_duration',
    defaultValue: 15,
    options: OP_DURATION_OPTIONS,
  },
  {
    type: 'select',
    label: t('UICreateRoomOptions4'),
    modelValue: 'game_rhythm',
    defaultValue: 0,
    options: GAME_RHYTHM_OPTIONS,
  },
  {
    type: 'switch',
    label: t('UIGuildVIPEmptyTableCloseTip'),
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
    label: t('UIAnteRandomJump1'),
    modelValue: 'random_ante',
    tip: t('UIAnteRandomJump6'),
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
    label: t('UIAnteRandomJump2'),
    modelValue: 'min_ante',
    defaultValue: '',
    placeholder: t('UIMine_PleaseEnter'),
    numberOnly: true,
    decimalDigits: 1,
    visibleWhen: [
      { field: 'random_ante', equals: 1 },
      { field: 'game_play_type', notEquals: 3 },
    ],
  },
  {
    type: 'input',
    label: t('UIAnteRandomJump3'),
    modelValue: 'max_ante',
    defaultValue: '',
    placeholder: t('UIMine_PleaseEnter'),
    numberOnly: true,
    decimalDigits: 1,
    visibleWhen: [
      { field: 'random_ante', equals: 1 },
      { field: 'game_play_type', notEquals: 3 },
    ],
  },
  {
    type: 'input',
    label: t('UIAnteRandomJump5'),
    modelValue: 'ante_interval',
    defaultValue: '',
    placeholder: t('UIMine_PleaseEnter'),
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

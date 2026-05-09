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
    label: '手牌数',
    modelValue: 'plo_game_type',
    defaultValue: 4,
    options: PLO_CARD_OPTIONS,
    visibleWhen: [{ field: 'game_play_type', equals: 2 }],
  },
  {
    type: 'select',
    label: '最大人数',
    modelValue: 'seat_count',
    defaultValue: 2,
    options: SEAT_COUNT_NLH_OPTIONS,
  },
  {
    type: 'select',
    label: '人满开局',
    modelValue: 'autostart_min_players',
    defaultValue: 2,
    options: SEAT_COUNT_NLH_OPTIONS,
  },
  {
    type: 'select',
    label: '思考时间',
    modelValue: 'op_duration',
    defaultValue: 15,
    options: OP_DURATION_OPTIONS,
  },
  {
    type: 'select',
    label: '游戏节奏',
    modelValue: 'game_rhythm',
    defaultValue: 0,
    options: GAME_RHYTHM_OPTIONS,
  },
  {
    type: 'switch',
    label: '空桌自动关闭',
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
    ],
  },
  {
    type: 'input',
    label: t('UIAnteRandomJump2'),
    modelValue: 'min_ante',
    defaultValue: '',
    placeholder: '请输入',
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
    placeholder: '请输入',
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
    placeholder: '请输入',
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

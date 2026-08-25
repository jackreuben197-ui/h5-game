import { t } from '@/i18n'
import type { TableFormFieldConfig } from '../template'
import { PLO_CARD_OPTIONS, OP_DURATION_OPTIONS, GAME_RHYTHM_OPTIONS } from './constants'

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
    type: 'stepper',
    get label() { return t('UIAnteRandomJump2') },
    modelValue: 'min_ante',
    defaultValue: '',
    get placeholder() { return t('UIMine_PleaseEnter') },
    numberOnly: true,
    decimalDigits: 1,
  },
]

import { t } from '@/i18n'
import type { TableFormFieldConfig } from '../template'
import { PLO_CARD_OPTIONS, OP_DURATION_OPTIONS, GAME_RHYTHM_OPTIONS } from './constants'

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
    type: 'stepper',
    label: t('UIAnteRandomJump2'),
    modelValue: 'min_ante',
    defaultValue: '',
    placeholder: t('UIMine_PleaseEnter'),
    numberOnly: true,
    decimalDigits: 1,
  },
]

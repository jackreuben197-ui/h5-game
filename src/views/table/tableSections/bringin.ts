import { t } from '@/i18n'
import type { TableFormFieldConfig } from '../template'
import {
  ALLOWED_MIN_CHIPS_OPTIONS,
  BRING_IN_LIMIT_OPTIONS,
  BRING_CHIPLEADER_OPTIONS,
  BRING_OUT_OPTIONS,
} from './constants'

export const bringinSection: TableFormFieldConfig[] = [
  {
    // min_player_chip_rate: 允许最低筹码（BB倍数），0=不限
    type: 'select',
    label: '允许最低筹码',
    modelValue: 'min_player_chip_rate',
    tip: t('UICreateTable_chipinMinChipTips'),
    defaultValue: 0,
    options: ALLOWED_MIN_CHIPS_OPTIONS,
  },
  {
    // max_bringin_total_rate: 计分牌买入上限（BB倍数），0=无限制
    type: 'select',
    label: '计分牌买入上限',
    modelValue: 'max_bringin_total_rate',
    tip: t('UICreateTable_chipinMaxChipTips'),
    defaultValue: 0,
    options: BRING_IN_LIMIT_OPTIONS,
  },
  {
    // bringin_equal_leader: 追平Chipleader百分比（0–100%）
    type: 'select',
    label: '追平Chipleader',
    modelValue: 'bringin_equal_leader',
    tip: t('UICreateTable_chipinLeaderTips'),
    defaultValue: 0,
    options: BRING_CHIPLEADER_OPTIONS,
  },
  {
    // bettype_aof_on: AOF开关，0=关闭 1=开启
    type: 'switch',
    label: 'AOF',
    modelValue: 'bettype_aof_on',
    tip: t('UICreateTableAOFTip'),
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
  },
  {
    // retain_type: 补撤计分牌方式，0=关闭 1=自动 2=手动
    type: 'select',
    label: '补撤计分牌',
    modelValue: 'retain_type',
    defaultValue: 0,
    options: BRING_OUT_OPTIONS,
  },
  {
    // retain_min_rate: 补撤最小保留筹码倍数（BB），自动+手动均展示
    type: 'input',
    label: '最小保留筹码(BB)',
    modelValue: 'retain_min_rate',
    defaultValue: 0,
    numberOnly: true,
    max: 99999,
    visibleWhen: [{ field: 'retain_type', notEquals: 0 }],
  },
  {
    // retain_max_rate: 补撤最大筹码倍数（BB），仅自动模式展示
    type: 'input',
    label: '最大保留筹码(BB)',
    modelValue: 'retain_max_rate',
    defaultValue: 0,
    numberOnly: true,
    max: 99999,
    visibleWhen: [{ field: 'retain_type', equals: 1 }],
  },
]

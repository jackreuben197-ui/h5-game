import { t } from '@/i18n'
import type { TableFormFieldConfig } from '../template'
import {
  TEXAS_SERVER_FEE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  CAP_BIGBLIND_OPTIONS,
} from './constants'

const SETTLEMENT_TYPE_OPTIONS = [
  { get text() { return t('UITable_Round') }, value: 0 },
  { get text() { return t('UITable_Text8') }, value: 1 },
]

export const activitySection: TableFormFieldConfig[] = [
  {
    // settlement_type: 0=局抽 1=把抽
    type: 'select',
    get label() { return t('UITable_Text9') },
    modelValue: 'settlement_type',
    defaultValue: 0,
    options: SETTLEMENT_TYPE_OPTIONS,
  },
  {
    // fee_permillage: 服务费千分比，0–500 对应 0–5%，步长 0.5%
    type: 'select',
    get label() { return t('UIMine_WalletPlatform_fee_f') },
    modelValue: 'fee_permillage',
    defaultValue: 0,
    options: TEXAS_SERVER_FEE_OPTIONS,
  },

  // ── 把抽专属 ─────────────────────────────────────────────────

  {
    // settle_profit_type: 收费方式，0=按比例 1=固定
    type: 'select',
    get label() { return t('UICreateTalble_winType') },
    modelValue: 'settle_profit_type',
    defaultValue: 0,
    options: PAYMENT_METHOD_OPTIONS,
    visibleWhen: [{ field: 'settlement_type', equals: 1 }],
  },

  // ── 按比例子字段 ──────────────────────────────────────────────

  {
    // preflop_free: 翻前结束免服务费，1=开启 2=关闭
    type: 'switch',
    get label() { return t('UICreateTable_preFlopEndFree') },
    get tip() { return t('UICreateTable_preFlopEndFreeTips') },
    modelValue: 'preflop_free',
    defaultValue: 2,
    activeValue: 1,
    inactiveValue: 2,
    visibleWhen: [
      { field: 'settlement_type', equals: 1 },
      { field: 'settle_profit_type', equals: 0 },
    ],
  },
  {
    // few_player_half_off: ≤3人时服务费5折，1=开启 2=关闭
    type: 'switch',
    get label() { return t('UICreateTable_threeFree') },
    get tip() { return t('UICreateTable_threeFreeTips') },
    modelValue: 'few_player_half_off',
    defaultValue: 2,
    activeValue: 1,
    inactiveValue: 2,
    visibleWhen: [
      { field: 'settlement_type', equals: 1 },
      { field: 'settle_profit_type', equals: 0 },
    ],
  },
  {
    // free_pots_value: 底池低于此值免服务费（整数）；0=不限
    type: 'input',
    get label() { return t('UICreateTable_poolDownFree') + '(BB)' },
    get tip() { return t('UICreateTable_poolDownFreeTips') },
    modelValue: 'free_pots_value',
    defaultValue: '',
    numberOnly: true,
    visibleWhen: [
      { field: 'settlement_type', equals: 1 },
      { field: 'settle_profit_type', equals: 0 },
    ],
  },
  // {
  //   // server_capping: 封顶方式，0=BB封顶 1=按人数封顶
  //   type: 'select',
  //   label: '封顶方式',
  //   modelValue: 'server_capping',
  //   defaultValue: 0,
  //   options: SERVER_CAPPING_OPTIONS,
  //   visibleWhen: [
  //     { field: 'settlement_type', equals: 1 },
  //     { field: 'settle_profit_type', equals: 0 },
  //   ],
  // },
  {
    // cap_bigblind: 封顶大盲倍数（面值 0–10）；提交时 ×10 → max_per_hand
    type: 'select',
    get label() { return t('UICreateRoom_ServiceMaxWinRate') + "(BB)" },
    modelValue: 'cap_bigblind',
    defaultValue: 0,
    options: CAP_BIGBLIND_OPTIONS,
    visibleWhen: [
      { field: 'settlement_type', equals: 1 },
      { field: 'settle_profit_type', equals: 0 },
      { field: 'server_capping', equals: 0 },
    ],
  },

  // ── 固定收费子字段 ────────────────────────────────────────────

  {
    // win_divide_value: 赢家阈值；提交时 ×100
    type: 'input',
    get label() { return t('UICreateTable_WinSplit') },
    modelValue: 'win_divide_value',
    defaultValue: '',
    numberOnly: true,
    visibleWhen: [
      { field: 'settlement_type', equals: 1 },
      { field: 'settle_profit_type', equals: 1 },
    ],
  },
  {
    // below_divide_ratio: <阈值时收取的比例服务费；提交时 ×10 → ‰
    type: 'input',
    get label() { return t('UICreateTable_lessThanWin') },
    modelValue: 'below_divide_ratio',
    defaultValue: '',
    numberOnly: true,
    visibleWhen: [
      { field: 'settlement_type', equals: 1 },
      { field: 'settle_profit_type', equals: 1 },
    ],
  },
  {
    // above_divide_fee: ≥阈值时收取的固定服务费；提交时 ×100
    type: 'input',
    get label() { return t('UICreateTable_moreThanWin') },
    modelValue: 'above_divide_fee',
    defaultValue: '',
    numberOnly: true,
    visibleWhen: [
      { field: 'settlement_type', equals: 1 },
      { field: 'settle_profit_type', equals: 1 },
    ],
  },
]

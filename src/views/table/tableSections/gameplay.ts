import { t } from '@/i18n'
import type { TableFormFieldConfig } from '../template'
import {
  BLIND_OPTIONS,
  SQUID_ROUNDS_OPTIONS,
  SQUID_OPEN_NUM_OPTIONS,
  CRIT_ROUNDS_OPTIONS,
  MUSHROOM_MODE_OPTIONS,
} from './constants'

// insurance: 0=关，1=低水位，2=EV，3=经典新版
const INSURANCE_OPTIONS = [
  { get text() { return t('UIBackDialog_ticketsbtnClose') }, value: 0 },
  { get text() { return t('UICreateTable_LowWaterIns') }, value: 1 },
  { get text() { return "EV" + t('adaptation10179') }, value: 2 },
  { get text() { return t('UICreateClassicInsurancesNew') }, value: 3 },
]

const SQUID_MODE_OPTIONS = [
  { get text() { return t('UICreateSquidClassicMode') }, value: 0 },
  { get text() { return t('UIClub_RoomCreat_EWzFul7w') }, value: 1 },
]
export const gamePlayInsuranceSection: TableFormFieldConfig[] = [
  {
    type: 'select',
    get label() { return t('adaptation10179') },
    get tip() { return t('UICreateTable_InsTips') },
    modelValue: 'insurance',
    defaultValue: 0,
    options: INSURANCE_OPTIONS,
  },
]

export const gamePlayMushroomModeSection: TableFormFieldConfig[] = [
  {
    type: 'switch',
    get label() { return t('UITableSetting_mushRoom') },
    get tip() { return t('UIMushModeDepositRule') },
    modelValue: 'mushroom',
    icon: 'table_icon_mushroom',
    activeValue: 1,
    inactiveValue: 0,
    defaultValue: false,
  },
  {
    type: 'select',
    get label() { return t('UIMushMoneyMode') },
    modelValue: 'mushroom_mode',
    defaultValue: 0,
    options: MUSHROOM_MODE_OPTIONS,
    visibleWhen: [{ field: 'mushroom', equals: 1 }],
  },
  {
    type: 'select',
    get label() { return t('UIMushMoneyRule') },
    modelValue: 'mushroom_base',
    defaultValue: 1,
    options: BLIND_OPTIONS,
    visibleWhen: [{ field: 'mushroom', equals: 1 }],
  },
]
export const gamePlaySquidGameSection: TableFormFieldConfig[] = [
  {
    type: 'switch',
    get label() { return t('UICreateRoomOptions11') },
    get tip() { return t('UISquidDetail') },
    modelValue: 'squid',
    icon: 'table_icon_squid',
    activeValue: 1,
    inactiveValue: 0,
    defaultValue: false,
  },
  {
    type: 'select',
    get label() { return t('UITable_Text14') },
    modelValue: 'squid_mode',
    defaultValue: 0,
    options: SQUID_MODE_OPTIONS,
    visibleWhen: [{ field: 'squid', equals: 1 }],
  },
  {
    type: 'select',
    get label() { return t('UIGameTableSquidShow') },
    modelValue: 'squid_base',
    defaultValue: 1,
    options: BLIND_OPTIONS,
    visibleWhen: [{ field: 'squid', equals: 1 }],
  },
  {
    type: 'select',
    get label() { return t('UICreateSquidNumber') },
    modelValue: 'squid_extra_count',
    defaultValue: 3,
    options: Array.from({ length: 18 }, (_, i) => ({
      get text() { return t('UITable_TablePlayer') + "+" + String(i + 1) },
      value: i + 1,
    })),
    visibleWhen: [
      { field: 'squid', equals: 1 },
      { field: 'squid_mode', equals: 1 },
    ],
  },
  {
    type: 'switch',
    get label() { return t('UISquidDouble') },
    get tip() { return t('UISquidGetDoubleTips') },
    modelValue: 'squid_double_mode',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
    visibleWhen: [
      { field: 'squid', equals: 1 },
      { field: 'squid_mode', equals: 1 },
    ],
  },
  {
    // playing_player_count_limit: 达到该人数后才开始鱿鱼计算
    type: 'select',
    get label() { return t('UISquidOpenPeopleNumber') },
    modelValue: 'playing_player_count_limit',
    defaultValue: 2,
    options: SQUID_OPEN_NUM_OPTIONS,
    visibleWhen: [{ field: 'squid', equals: 1 }],
  },
  {
    // rounds: 鱿鱼触发轮次，0=无限制
    type: 'select',
    get label() { return t('UISquidGameRounds') },
    modelValue: 'rounds',
    defaultValue: 0,
    options: SQUID_ROUNDS_OPTIONS,
    visibleWhen: [{ field: 'squid', equals: 1 }],
  },
  {
    // squid_most_get: 独揽鱿鱼奖励
    type: 'switch',
    get label() { return t('UISquidAll') },
    get tip() { return t('UISquidAllTips') },
    modelValue: 'squid_most_get',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
    visibleWhen: [{ field: 'squid', equals: 1 }],
  },
  {
    // squid_bet_get: 无动作获胜不得鱿鱼
    type: 'switch',
    get label() { return t('UISquidNothing') },
    get tip() { return t('UISquidNothingTips') },
    modelValue: 'squid_bet_get',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
    visibleWhen: [{ field: 'squid', equals: 1 }],
  },
  {
    // squid_head: 第一个获鱿鱼奖励翻倍
    type: 'switch',
    get label() { return t('UISquidHeadDouble') },
    get tip() { return t('UISquidHeadDoubleTips') },
    modelValue: 'squid_head',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
    visibleWhen: [{ field: 'squid', equals: 1 }],
  },
  {
    // squid_tail: 最后一个获鱿鱼奖励翻倍
    type: 'switch',
    get label() { return t('UISquidTailDouble') },
    get tip() { return t('UISquidTailDoubleTips') },
    modelValue: 'squid_tail',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
    visibleWhen: [{ field: 'squid', equals: 1 }],
  },
  {
    // squid_force_show_card: 获鱿鱼标识后强制亮牌
    type: 'switch',
    get label() { return t('UICreateTable_SquidShowCard') },
    get tip() { return t('UICreateTable_SquidShowCardTips') },
    modelValue: 'squid_force_show_card',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
    visibleWhen: [{ field: 'squid', equals: 1 }],
  },
]

export const gamePlayCallTimeSection: TableFormFieldConfig[] = [
  {
    type: 'switch',
    label: 'CallTime',
    get tip() { return t('UICreateRoomCallTimeTip') },
    modelValue: 'call_time',
    activeValue: 1,
    inactiveValue: 2,
    defaultValue: 2,
  },
  {
    type: 'input',
    get label() { return t('UICreateRoomCallTimeLabel1') + '(BB)' },
    modelValue: 'call_time_winline',
    defaultValue: '1',
    get placeholder() { return t('UICallTimeInputTips1') },
    numberOnly: true,
    visibleWhen: [{ field: 'call_time', equals: 1 }],
  },
  {
    type: 'input',
    get label() { return t('UICreateRoomCallTimeLabel2') },
    modelValue: 'call_time_count',
    defaultValue: '0',
    get placeholder() { return t('UICallTimeInputTips2') },
    numberOnly: true,
    visibleWhen: [{ field: 'call_time', equals: 1 }],
  },
]

export const gamePlayCriticalHitSection: TableFormFieldConfig[] = [
  {
    type: 'switch',
    get label() { return t('UIHitGamePlayTips1') },
    get tip() { return t('UIHitGamePlayTips6') },
    modelValue: 'critical_hit',
    icon: 'table_icon_critical',
    activeValue: 1,
    inactiveValue: 0,
    defaultValue: false,
  },
  {
    type: 'select',
    get label() { return t('UICreateTable_GameRound') },
    modelValue: 'rounds',
    defaultValue: 1,
    options: CRIT_ROUNDS_OPTIONS,
    visibleWhen: [{ field: 'critical_hit', equals: 1 }],
  },
  {
    type: 'input',
    get label() { return t('UIHitGamePlayTips4') + "(BB)" },
    modelValue: 'critical_ante',
    defaultValue: '',
    get placeholder() { return t('UIMine_PleaseEnter') },
    numberOnly: true,
    visibleWhen: [{ field: 'critical_hit', equals: 1 }],
  },
]

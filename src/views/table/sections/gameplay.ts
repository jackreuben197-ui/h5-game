import type { FormSection } from '../template'
import {
  BLIND_OPTIONS,
  SQUID_ROUNDS_OPTIONS,
  SQUID_OPEN_NUM_OPTIONS,
  SQUID_DEPOSIT_OPTIONS,
  CRIT_ROUNDS_OPTIONS,
  MUSHROOM_MODE_OPTIONS,
} from './constants'

// insurance values: 0=关 1=经典 2=低水位 3=EV 4=经典新版
const INSURANCE_OPTIONS = [
  { text: '关', value: 0 },
  { text: '经典保险', value: 1 },
  { text: '低水位保险', value: 2 },
  { text: 'EV保险', value: 3 },
  { text: '经典新版', value: 4 },
]

const SQUID_MODE_OPTIONS = [
  { text: '单鱿鱼', value: 0 },
  { text: '多鱿鱼', value: 1 },
]

export const gameplaySection: FormSection = {
  key: 'gameplay',
  label: '玩法',
  fields: [
    // ── 保险 ──────────────────────────────────────────────
    {
      type: 'select',
      label: '保险',
      tip: '经典保险：跟注者可向其他玩家购买赔率；EV保险：按期望值自动结算',
      modelValue: 'insurance',
      defaultValue: 0,
      options: INSURANCE_OPTIONS,
    },

    // ── 鱿鱼游戏 ──────────────────────────────────────────
    {
      type: 'switch',
      label: '鱿鱼游戏',
      tip: '开启后，筹码降至一定比例的玩家将被淘汰，最终胜者获得额外奖励',
      modelValue: 'squid_game',
      defaultValue: false,
    },
    {
      type: 'select',
      label: '鱿鱼模式',
      tip: '单鱿鱼：每局只有一个鱿鱼；多鱿鱼：可积累多个鱿鱼',
      modelValue: 'squid_mode',
      defaultValue: 0,
      options: SQUID_MODE_OPTIONS,
      visibleWhen: [{ field: 'squid_game', equals: true }],
    },
    {
      type: 'select',
      label: '游戏轮次',
      tip: '0为无限制，达到轮次后未淘汰玩家平分鱿鱼奖励',
      modelValue: 'squid_rounds',
      defaultValue: 3,
      options: SQUID_ROUNDS_OPTIONS,
      visibleWhen: [{ field: 'squid_game', equals: true }],
    },
    {
      type: 'select',
      label: '开启人数',
      tip: '达到该人数后才开始计算鱿鱼淘汰',
      modelValue: 'squid_open_num',
      defaultValue: 2,
      options: SQUID_OPEN_NUM_OPTIONS,
      visibleWhen: [{ field: 'squid_game', equals: true }],
    },
    {
      type: 'select',
      label: '鱿鱼获取上限',
      tip: '单个玩家最多可持有的鱿鱼数量',
      modelValue: 'squid_limit',
      defaultValue: 3,
      options: Array.from({ length: 10 }, (_, i) => ({ text: String(i + 1), value: i + 1 })),
      visibleWhen: [
        { field: 'squid_game', equals: true },
        { field: 'squid_mode', equals: 1 },
      ],
    },
    {
      type: 'select',
      label: '鱿鱼押金比例',
      tip: '触发鱿鱼时，玩家需缴纳的押金占筹码的比例',
      modelValue: 'squid_deposit_percent',
      defaultValue: 100,
      options: SQUID_DEPOSIT_OPTIONS,
      visibleWhen: [
        { field: 'squid_game', equals: true },
        { field: 'squid_mode', equals: 1 },
      ],
    },

    // ── 暴击玩法 ──────────────────────────────────────────
    {
      type: 'switch',
      label: '暴击玩法',
      tip: '开启后，特定手牌将触发暴击，赢家获得额外倍数奖励',
      modelValue: 'critical_hit',
      defaultValue: false,
    },
    {
      type: 'select',
      label: '暴击轮次',
      tip: '每隔多少手触发一次暴击',
      modelValue: 'critical_hit_rounds',
      defaultValue: 1,
      options: CRIT_ROUNDS_OPTIONS,
      visibleWhen: [{ field: 'critical_hit', equals: true }],
    },
    {
      type: 'input',
      label: '暴击金额(BB)',
      tip: '暴击时额外奖励的金额，以大盲为单位',
      modelValue: 'critical_hit_bb',
      defaultValue: '',
      placeholder: '请输入',
      visibleWhen: [{ field: 'critical_hit', equals: true }],
    },

    // ── 蘑菇桌 ────────────────────────────────────────────
    {
      type: 'switch',
      label: '蘑菇桌',
      tip: '开启后，玩家需缴纳带入押金，筹码不足时可追加至Chipleader水平',
      modelValue: 'mushroom_mode',
      defaultValue: false,
    },
    {
      type: 'select',
      label: '押金模式',
      tip: '追平Chipleader：押金随桌上最多筹码浮动；固定带入金额：按底注固定计算',
      modelValue: 'mushroom_deposit_mode',
      defaultValue: 0,
      options: MUSHROOM_MODE_OPTIONS,
      visibleWhen: [{ field: 'mushroom_mode', equals: true }],
    },
    {
      type: 'select',
      label: '蘑菇底注',
      tip: '计算押金的基准底注，与当前大小盲无关',
      modelValue: 'mushroom_chips',
      defaultValue: 1,
      options: BLIND_OPTIONS,
      visibleWhen: [{ field: 'mushroom_mode', equals: true }],
    },

    // ── Jackpot ───────────────────────────────────────────
    {
      type: 'switch',
      label: 'Jackpot',
      tip: '开启后，每手牌将抽取少量筹码计入Jackpot奖池，特殊牌型可触发大奖',
      modelValue: 'jackpot',
      defaultValue: false,
    },
    {
      type: 'select',
      label: 'Jackpot模板',
      tip: '选择与当前盲注匹配的Jackpot奖池方案',
      modelValue: 'jackpot_template',
      defaultValue: 0,
      options: [{ text: '默认模板', value: 0 }],
      visibleWhen: [{ field: 'jackpot', equals: true }],
    },
  ],
}

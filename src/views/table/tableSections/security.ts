import { t } from '@/i18n'
import type { TableFormFieldConfig } from '../template'

// anti_cheat_type: 1=关(NONE) 2=语音(AUDIO) 3=视频(VIDEO) 4=人脸识别(FACE_VERIFY)
const ANTI_CHEAT_OPTIONS = [
  { text: '常规桌', value: 1, icon: 'icon_table' },
  { text: '语音桌', value: 2, icon: 'icon_audio' },
  { text: '视频桌', value: 3, icon: 'icon_video' },
  // { text: '人脸识别', value: 4 },
]

// anti_cheat_video_type:
// 1=全时长(FULL_TIME) 2=随机(RANDOM) 3=麦序(SEQUENCE)
// 5=特效模式(EFFECT) 6=真人模式(REAL)，5/6 的子配置由平台统一提供
const VIDEO_MODE_OPTIONS = [
  { text: t('UICreateRoomOptions14'), value: 1 },
  { text: t('UICreateRoomOptions15'), value: 2 },
  { text: t('UICreateRoomOptions16'), value: 3 },
  { text: t('videoRealMode'), value: 6 },
  { text: t('videoEffectMode'), value: 5 },
]

// video_verify_type: 1=视频+麦克风 2=仅开启视频
const VIDEO_VERIFY_OPTIONS = [
  { text: t('VertifyVideoMicrophone'), value: 1 },
  { text: t('VertifyVideo'), value: 2 },
]

// anti_cheat_order_mic_type: 1=可关闭 2=不可关闭
const MIC_CLOSE_OPTIONS = [
  { text: t('UIGuildRoomCreatmode_AudioModeMictipsClose'), value: 1 },
  { text: t('UIGuildRoomCreatmode_AudioModeMictipsnoClose'), value: 2 },
]

export const securitySection: TableFormFieldConfig[] = [
  {
    // anti_cheat_type: 防作弊类型
    type: 'tab',
    label: '防作弊',
    modelValue: 'anti_cheat_type',
    defaultValue: 1,
    options: ANTI_CHEAT_OPTIONS,
  },

  // ── 视频桌专属 ───────────────────────────────────────────────

  {
    // anti_cheat_video_type: 全时长/随机/麦序
    type: 'select',
    label: '视频模式',
    modelValue: 'anti_cheat_video_type',
    defaultValue: 1,
    options: VIDEO_MODE_OPTIONS,
    visibleWhen: [{ field: 'anti_cheat_type', equals: 3 }],
  },

  // ── 麦序模式子字段 ────────────────────────────────────────────

  {
    // anti_cheat_order_type: 麦序模式下的音频模式，1=麦序音频 2=全程音频
    type: 'switch',
    label: t('UIGuildRoomCreatmode_AudioMode'),
    tip: t('UIGuildRoomCreatmode_AudioModeTips'),
    modelValue: 'anti_cheat_order_type',
    defaultValue: 1,
    activeValue: 2,
    inactiveValue: 1,
    visibleWhen: [
      { field: 'anti_cheat_type', equals: 3 },
      { field: 'anti_cheat_video_type', equals: 3 },
    ],
  },
  {
    // anti_cheat_order_mic_type: 全程音频时麦克风是否可关闭，1=可关闭 2=不可关闭
    type: 'select',
    label: t('UIGuildRoomCreatmode_AudioModeMic'),
    modelValue: 'anti_cheat_order_mic_type',
    defaultValue: 1,
    options: MIC_CLOSE_OPTIONS,
    visibleWhen: [
      { field: 'anti_cheat_type', equals: 3 },
      { field: 'anti_cheat_video_type', equals: 3 },
      { field: 'anti_cheat_order_type', equals: 2 },
    ],
  },

  // ── 所有视频模式通用 ──────────────────────────────────────────

  {
    // video_verify_type: 验证模式，1=视频+麦克风 2=仅开启视频
    // 真人模式和特效模式使用平台配置，不展示自定义子选项
    type: 'select',
    label: '验证模式',
    modelValue: 'video_verify_type',
    defaultValue: 1,
    options: VIDEO_VERIFY_OPTIONS,
    visibleWhen: [
      { field: 'anti_cheat_type', equals: 3 },
      { field: 'anti_cheat_video_type', notEquals: [5, 6] },
    ],
  },
  {
    // video_effect_type: 视频特效桌，1=开启 2=关闭
    type: 'switch',
    label: '视频特效',
    modelValue: 'video_effect_type',
    defaultValue: 2,
    activeValue: 1,
    inactiveValue: 2,
    visibleWhen: [
      { field: 'anti_cheat_type', equals: 3 },
      { field: 'anti_cheat_video_type', notEquals: [5, 6] },
    ],
  },
  {
    // power_saving: 节能模式，1=开启 2=关闭
    type: 'switch',
    label: '节能模式',
    tip: t('UICreateTable_PowerSavingTips'),
    modelValue: 'power_saving',
    defaultValue: 2,
    activeValue: 1,
    inactiveValue: 2,
    visibleWhen: [
      { field: 'anti_cheat_type', equals: 3 },
      { field: 'anti_cheat_video_type', notEquals: [5, 6] },
    ],
  },
]

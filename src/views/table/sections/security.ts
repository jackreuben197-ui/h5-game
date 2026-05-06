import type { TableFormFieldConfig } from '../template'

// anti_cheat_type: 0/1=关，2=音频桌，3=视频桌
const ANTI_CHEAT_OPTIONS = [
  { text: '关', value: 0 },
  { text: '音频桌', value: 2 },
  { text: '视频桌', value: 3 },
]

// anti_cheat_video_type: 0=全时长，1=全程，2=摊牌时
const ANTI_CHEAT_VIDEO_OPTIONS = [
  { text: '全时长', value: 0 },
  { text: '全程', value: 1 },
  { text: '摊牌时', value: 2 },
]

export const securitySection: TableFormFieldConfig[] = [
  {
    type: 'select',
    label: '防作弊',
    tip: '音频/视频桌要求玩家全程开启麦克风或摄像头，以减少合谋作弊风险',
    modelValue: 'anti_cheat_type',
    defaultValue: 0,
    options: ANTI_CHEAT_OPTIONS,
  },
  {
    type: 'select',
    label: '视频模式',
    tip: '全时长：全局开启；全程：从入座到离桌；摊牌时：仅摊牌阶段',
    modelValue: 'anti_cheat_video_type',
    defaultValue: 0,
    options: ANTI_CHEAT_VIDEO_OPTIONS,
    visibleWhen: [{ field: 'anti_cheat_type', equals: 3 }],
  },
  {
    type: 'switch',
    label: '区块链加密',
    tip: '开启后，牌局数据将使用区块链技术进行加密和验证，不可篡改',
    modelValue: 'encrypt_cards',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
  },
]

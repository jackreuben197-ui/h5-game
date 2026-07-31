import { t } from '@/i18n'
import type { TableFormFieldConfig } from '../template'
import {
  MIN_VPIP_OPTIONS,
  TOTAL_HAND_OPTIONS,
  CHAT_TYPE_OPTIONS,
  GAME_DELAY_TIMES_OPTIONS,
  SAFE_ROOM_OPTIONS,
} from './constants'

export const limitsSection: TableFormFieldConfig[] = [
  {
    type: 'select',
    label: t('pool_limit'),
    tip: t('UICreateTable_poolRules'),
    modelValue: 'limit_hc_pool_rate',
    defaultValue: 0,
    options: MIN_VPIP_OPTIONS,
  },
  {
    type: 'select',
    label: t('UICreateRoomOptions13'),
    tip: t('UITable_PlayerTableHandsNo'),
    modelValue: 'limit_hc_total_hands',
    defaultValue: 0,
    options: TOTAL_HAND_OPTIONS,
  },
  {
    type: 'select',
    label: t('UITableSetting_chat'),
    modelValue: 'chat_type',
    defaultValue: 0,
    options: CHAT_TYPE_OPTIONS,
  },
  {
    type: 'switch',
    label: t('UICreateLimitSeeHand'),
    tip: t('UICreateLimitSeeHandTips'),
    modelValue: 'limit_watch_hand',
    activeValue: 1,
    inactiveValue: 0,
    defaultValue: 0,
  },
  {
    type: 'input',
    label: t('UICreateLimitSeeHand') + "(" + t('UIMine_RecordItemsNormal_3RCUa3w8') + ")",
    modelValue: 'limit_hand_num',
    defaultValue: false,
    numberOnly: true,
    visibleWhen: [{ field: 'limit_watch_hand', equals: 1 }],
  },
  {
    type: 'switch',
    label: t('UICreateRoom_ControlBringIn'),
    tip: t('UICreateTable_BringIn_Tips'),
    modelValue: 'limit_bring_in',
    activeValue: 1,
    inactiveValue: 0,
    defaultValue: 0,
  },
  {
    type: 'select',
    label: t('UICreateTable_DelayTime'),
    tip: t('UICreateTable_DelayTimeTips'),
    modelValue: 'game_delay_times',
    options: GAME_DELAY_TIMES_OPTIONS,
    defaultValue: 2,
  },
  {
    type: 'switch',
    label: "IP" + t('adaptation20008'),
    tip: t('UITable_Text15') + "，" + t('UITable_Text16') + "IP" + t('UITable_AllowNamePlayerTable'),
    modelValue: 'limit_ip',
    defaultValue: false,
  },
  {
    type: 'switch',
    label: "GPS" + t('adaptation20008'),
    tip: t('UITable_Text15') + "，" + t('UITable_OfPlayerTable'),
    modelValue: 'limit_gps',
    defaultValue: false,
  },
  {
    type: 'switch',
    label: t('UIPersonal_Title'),
    tip: t('UIPersonal_TitleTips'),
    modelValue: 'personal_type',
    activeValue: 1,
    inactiveValue: 2,
    defaultValue: 2,
    visibleWhen: [{ field: 'origin_type', equals: 4 }],
  },
  {
    // force_show_card: 每手结束时所有手牌自动亮出，1=开启 0=关闭
    type: 'switch',
    label: t('UICreateTable_FouceShowCard'),
    tip: t('UICreateTable_ForcedShowFand'),
    modelValue: 'force_show_card',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
  },
  {
    // random_seat: 空位≥2时随机安排座位，1=开启 0=关闭
    type: 'switch',
    label: t('UICreateTable_randSeat'),
    tip: t('UICreateTable_randSeatTips'),
    modelValue: 'random_seat',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
  },
  {
    // only_ios: 私人房（仅iOS设备），1=开启 0=关闭
    type: 'switch',
    label: t('UICreateTable_iosTitle'),
    tip: t('UICreateTable_iosTitleTips'),
    modelValue: 'only_ios',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
    visibleWhen: [{ field: 'origin_type', notEquals: 4 }],
  },
  {
    // delay_view_card: 发牌后未轮到操作时手牌不可见
    type: 'switch',
    label: t('UIClub_CreateRoom27'),
    tip: t('UICreateTableDelayReadTip'),
    modelValue: 'delay_view_card',
    defaultValue: false,
  },
  {
    // encrypt_cards: 区块链加密洗切牌，1=开启 0=关闭
    type: 'switch',
    label: t('UIBlockchain'),
    tip: t('UIBlockchainTips1'),
    modelValue: 'encrypt_cards',
    defaultValue: 0,
    activeValue: 1,
    inactiveValue: 0,
  },
  // {
  // safe_view_public_cards: 安全屋公共牌可见性；提交时 +1 → 服务端 1/2
  //隐藏该配置
  //   type: 'select',
  //   label: 'Safe',
  //   modelValue: 'safe_view_public_cards',
  //   defaultValue: 2,
  //   options: SAFE_ROOM_OPTIONS,
  // },
  {
    // all_in_mute: allin思考期间屏蔽其他玩家聊天，1=开启 2=关闭
    type: 'switch',
    label: t('UIAllinBanChat'),
    tip: t('UIAllinBanChatTips'),
    modelValue: 'all_in_mute',
    defaultValue: 2,
    activeValue: 1,
    inactiveValue: 2,
  },
]

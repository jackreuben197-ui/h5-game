// 多语言模板项：用于把房间名 key 映射为不同语种文案。
export interface MultiLanguageTemplateRecord {
  template_id: string
  cn_name?: string
  us_name?: string
  br_name?: string
  ar_name?: string
  [key: string]: unknown
}

// /config/global/config 请求参数。
export interface GlobalConfigRequest {
  [key: string]: unknown
}

// /config/diamond/config 请求参数。
export interface DiamondConfigRequest {
  [key: string]: unknown
}

// /config/global/config 响应 data。
export interface GlobalConfigData {
  // 运营模式 1 直营模式 2 公会联盟模式。
  operating_model?: number
  // 直营模式下充豆开关 1 开 2 关。
  recharge_gold?: number
  // 直营模式下支桌号充值方式。
  user_special_recharge?: number
  // 直营模式下普通用户充值方式。
  user_ordinary_recharge?: number
  // 普通房模式开关。
  normal_room_model?: number
  // 苹果支付开关 1 开 2 关。
  apple_pay_switch?: number
  // 修改名字花费。
  user_modify_name_cost?: number
  // MTT 功能开关 1 开 2 关。
  mtt_switch?: number
  // 返水开关屏蔽 1 开 2 关。
  normal_return_profit_switch?: number
  // Android MTT 开关。
  android_mtt_switch?: number
  // Android 支付开关。
  android_pay_switch?: number
  // iOS MTT 开关。
  apple_mtt_switch?: number
  support_email?: string
  scoreboard_club_price?: string
  scoreboard_friend_price?: string
  user_modify_name_price?: string
  // MTT 记录费配置（JSON 字符串，需解析为 MttRecordFeeConfig）
  record_fee_mtt_uc?: string
  record_fee_mtt_gc?: string
  record_fee_mtt_diamond?: string
  record_fee_mtt_scoreboard?: string
  create_club_price?: string
  [key: string]: unknown
}

// /config/diamond/config 响应 data。
export interface DiamondConfigData {
  [key: string]: unknown
}

// MTT 记录费配置（对齐 Unity UIMttBuyInComponent.RecordFeeData）。
export interface MttRecordFeeConfig {
  // 1 开启，2 关闭
  status: number
  // 保底收取钻石数
  floor_price: number
  // 收取比例（记录费 = 带入积分 * ratio）
  ratio: number
  // 小数取整类型：1 floor，2 ceil，3 round
  decimal_type: number
  // 折扣（< 1 表示有折扣，>= 1 表示无折扣）
  discount: number
  start_time: number
  end_time: number
}

// /config/base/config/combine 请求参数。
export interface BaseConfigCombineRequest {
  data_types?: number[]
  config_types?: string[]
  last_update_time?: number
  [key: string]: unknown
}

// /config/base/config/combine 响应 data。
export interface BaseConfigCombineData {
  // 实际配置内容在 data 字段内（对应 ConfigBaseConfigCombine.ResponseData）。
  data?: {
    user_subscriptions?: unknown[]
    user_whitelist_info?: unknown
    [key: string]: unknown
  }
  [key: string]: unknown
}

// /config/before/login/config 请求单项。
export interface BeforeLoginConfigRequestItem {
  last_update_time?: number
}

// /config/before/login/config 请求参数。
export interface BeforeLoginConfigRequest {
  no_auth_api_list?: number[]
  global_config_req?: BeforeLoginConfigRequestItem
  small_blind_ante_req?: BeforeLoginConfigRequestItem
  get_diamond_configs_req?: BeforeLoginConfigRequestItem
  multi_language_req?: BeforeLoginConfigRequestItem
  user_subscription_config_req?: BeforeLoginConfigRequestItem
  popup_list_req?: BeforeLoginConfigRequestItem
  banner_list_req?: BeforeLoginConfigRequestItem
  club_subscription_config_list_req?: BeforeLoginConfigRequestItem
  room_template_list_req?: BeforeLoginConfigRequestItem
  maintenance_info_req?: BeforeLoginConfigRequestItem
  chat_shop_prop_price_req?: BeforeLoginConfigRequestItem
  geme_prop_list_req?: BeforeLoginConfigRequestItem
  club_level_benefit_req?: BeforeLoginConfigRequestItem
  [key: string]: unknown
}

// /config/before/login/config 响应 data。
export interface BeforeLoginConfigData {
  // before login 聚合返回，结构由服务端按请求项组合。
  data?: Record<string, unknown>
  [key: string]: unknown
}

// /config/maintenance 响应 data。
export interface MaintenanceData {
  on?: boolean
  start_time?: number
  end_time?: number
  start_time_str?: string
  end_time_str?: string
  msg?: string
  [key: string]: unknown
}

// /config/maintenance_tf 响应 data。
export interface MaintenanceTfData {
  on?: boolean
  start_time?: number
  end_time?: number
  start_time_str?: string
  end_time_str?: string
  version?: string
  msg?: string
  [key: string]: unknown
}

// /config/register/area 单项结构。
export interface RegisterAreaRecord {
  // 国家区号（cocos Data 未声明 code 字段，兼容保留）。
  code?: string
  area?: string
  country?: string
  [key: string]: unknown
}

// /config/register/area 响应 data（ConfigRegisterArea.ResponseData）。
export interface RegisterAreaData {
  // cocos 中字段名是 data，内层为区域列表。
  data?: RegisterAreaRecord[]
  [key: string]: unknown
}

// /config/user/whitelist/info 请求参数。
export interface UserWhitelistInfoRequest {
  [key: string]: unknown
}

// /config/user/whitelist/info 白名单能力项（ConfigUserWhitelistInfo.UserWhiteListInfo）。
export interface UserWhitelistInfoFlags {
  cowboy?: number
  mahjong?: number
  mahjong_blood_river?: number
  mahjong_push_down?: number
  fantasy?: number
  room_jackpot?: number
  guandan?: number
  room_bringin_input?: number
  room_bringin_equal?: number
  room_min_chip?: number
  room_bringin_limit?: number
  room_random_seat?: number
  room_force_show_card?: number
  room_look_hand_card?: number
  room_check_pool_rate?: number
  room_only_ios?: number
  room_calltime?: number
  room_encrypt_cards?: number
  room_critical_hit?: number
  room_random_ante?: number
  room_limit_hand?: number
  sng?: number
  random_enter_unlimit?: number
  [key: string]: unknown
}

// /config/user/whitelist/info data 内层。
export interface UserWhitelistInfoInnerData {
  user_whitelist_info?: UserWhitelistInfoFlags
  [key: string]: unknown
}

// /config/user/whitelist/info 响应 data。
export interface UserWhitelistInfoData {
  data?: UserWhitelistInfoInnerData
  [key: string]: unknown
}

// /config/online_withdraw_type_list 单项。
export interface OnlineWithdrawTypeItem {
  id?: number
  name?: string
  image?: string
  type?: number // 1-数字钱包 2-API 3-手动
  rate?: number
  fee_rate?: number
  fee_type?: number // 0-无 1-俱乐部出 2-玩家出
  /** 通道说明（模板）；玩家保存的地址见 user_description */
  description?: string
  /** 玩家已保存的提现地址（服务端返回） */
  user_description?: string
  /** 个别环境字段名拼写 */
  user_decription?: string
  [key: string]: unknown
}

// /config/online_withdraw_type_list 响应 data。
export interface OnlineWithdrawTypeListData {
  list?: OnlineWithdrawTypeItem[]
  [key: string]: unknown
}

export interface OnlineWithdrawDescriptionRequest {
  withdraw_type_id?: number
  description?: string
  club_id?: number
  [key: string]: unknown
}

export interface OnlineWithdrawDescriptionData {
  id?: number
  name?: string
  [key: string]: unknown
}

// /roomcenter/groups 请求参数。
export interface RoomcenterGroupsRequest {
  [key: string]: unknown
}

// /roomcenter/groups 第三层分组（RoomCenterGroups.DataGroupTwo）。
export interface RoomcenterGroupsLevelTwo {
  // 游戏类型，0 德州，1 奥马哈四张，2 奥马哈五张，3 奥马哈六张。
  game_type?: number
  // 牌类型，0 长牌，1 短牌。
  poker_type?: number
  // 下注限制，0 不限制，1 底池限注，2 AOF。
  limit_bet_type?: number
  // 房间数量。
  count?: number
  // 人数。
  player_count?: number
  [key: string]: unknown
}

// /roomcenter/groups 第二层分组（RoomCenterGroups.DataGroupOne）。
export interface RoomcenterGroupsLevelOne {
  // 游戏类型。
  game_type?: number
  // 房间数量。
  count?: number
  // 牌类型，0 长牌，1 短牌。
  poker_type?: number
  // 人数。
  player_count?: number
  // 第三层分组。
  sub_group?: RoomcenterGroupsLevelTwo[]
  [key: string]: unknown
}

// /roomcenter/groups 响应记录（RoomCenterGroups.ResponseData）。
export interface RoomcenterGroupsRecord {
  // 游戏类型。
  game_type?: number
  // 房间数量。
  count?: number
  // 人数。
  player_count?: number
  // 第二层分组。
  sub_group?: RoomcenterGroupsLevelOne[]
  [key: string]: unknown
}

// /roomcenter/room_blinds 请求参数。
export interface RoomcenterRoomBlindsRequest {
  // 游戏类型。
  game_type: number
  // 牌类型。
  poker_type: number
  [key: string]: unknown
}

// /roomcenter/room_blinds 单项。
export interface RoomcenterRoomBlindRecord {
  // 小盲。
  sb?: number
  // 该条件房间数。
  cnt?: number
  [key: string]: unknown
}

// /roomcenter/room_blinds 响应 data。
export interface RoomcenterRoomBlindsData {
  records?: RoomcenterRoomBlindRecord[]
  [key: string]: unknown
}

// /roomcenter/rooms 请求参数。
export interface RoomcenterRoomsRequest {
  // 条目数。
  limit?: number
  // 开始下标（offset=0, limit=10 => 0-9）。
  offset?: number
  types?: number[]
  // 小盲范围。
  sb_min?: number
  sb_max?: number
  // 前注范围。
  ant_min?: number
  ant_max?: number
  // 房间 id 列表。
  room_ids?: number[]
  // 游戏类型。
  game_type?: number[]
  // 牌类型。
  poker_type?: number[]
  // 下注类型。
  limit_bet_type?: number[]
  // 排序（id_asc/id_desc/start_asc/...）。
  order?: string[]
  [key: string]: unknown
}

// /roomcenter/rooms 单项。
export interface RoomcenterRoomsRecord {
  // 房间 id。
  rid?: number
  // 房间名称。
  name?: string
  // 房间类型。
  room_type?: number
  // 游戏类型。
  game_type?: number
  // 牌类型。
  poker_type?: number
  // 底池限注类型。
  limit_bet_type?: number
  // 房间状态（0 未创建、1 未开始、2 进行中、3 强制关闭、4 即将关闭、5 关闭）。
  status?: number
  // 前注。
  ante?: number
  // 小盲。
  sb?: number
  // 操作时间。
  op_duration?: number
  // 无用户等待时间。
  no_user_wait_duration?: number
  // 留座离桌时间。
  keep_seat_duration?: number
  // 总带入。
  total_bring_in?: number
  // 总带出。
  total_bring_out?: number
  // 总记分牌。
  total_chip?: number
  // 最小带入倍率。
  min_rate?: number
  // 最大带入倍率。
  max_rate?: number
  // 最小人数。
  min_players?: number
  // 最小人数自动开桌。
  autostart_min_players?: number
  // 强制盲注开关。
  straddle_on?: number
  // 强制盲注最大人数。
  straddle_max?: number
  // 保险开关。
  insurance_on?: number
  // 保险操作时间。
  insurance_op_duration?: number
  // 延迟看牌开关。
  delay_view_card_on?: number
  // 补盲开关。
  post_on?: number
  // 是否开启盖牌。
  muck_on?: number
  // IP 限制开关。
  limit_ip_on?: number
  // GPS 限制开关。
  limit_gps_on?: number
  // GPS 距离。
  limit_gps_distance?: number
  // 操作延迟次数。
  limit_delay_times?: number
  // 自动过牌次数。
  limit_auto_check_times?: number
  // 自动弃牌次数。
  limit_auto_fold_times?: number
  // 房间座位数量。
  seat_count?: number
  // 剩余空座位。
  empty_seat?: number
  // 房间内人数。
  roomers?: number
  // 允许进入时间。
  enter_time?: string
  // 游戏时长。
  play_duration?: number
  // 藏钱类型。
  retain_type?: number
  // 藏钱最小倍率。
  retain_min_rate?: number
  schedule_start_time?: string
  // 开始时间。
  start_time?: string
  // 结束时间。
  end_time?: string
  // 手数。
  hand_num?: number
  // 联盟 id。
  tribe_id?: number
  // 结束原因。
  end_reason?: string
  // 限制总手数胜率等级。
  hc_total_hand_lv?: number
  // 限制总手数。
  hc_total_hand?: number
  // 限制入池率等级。
  hc_pool_rate_lv?: number
  // 限制入池数。
  hc_pool_rate?: number
  // 查询 IP 用 service id。
  service_id?: string
  create_time?: string
  update_time?: string
  // 声纹验证开关。
  voiceprint_verify_on?: number
  // 声纹次数限制。
  voiceprint_verify_limit_times?: number
  // 声纹倒计时。
  voiceprint_verify_duration?: number
  // 声纹间隔时间。
  voiceprint_verify_interval_duration?: number
  // 参与状态，0 未参与，1 参与中。
  participation_status?: number
  [key: string]: unknown
}

// /roomcenter/rooms 响应 data。
export interface RoomcenterRoomsData {
  total?: number
  limit?: number
  offset?: number
  records?: RoomcenterRoomsRecord[]
  [key: string]: unknown
}

// /roomcenter/friend/room/apply/list 请求参数。
export interface RoomcenterFriendRoomApplyListRequest {
  // 房间 id。
  room_id?: number
  // 条目数。
  limit?: number
  // 起始偏移。
  offset?: number
  [key: string]: unknown
}

// /roomcenter/friend/room/apply/list 单条申请记录（cocos 未声明完整字段，先保留兼容）。
export interface RoomcenterFriendRoomApplyRecord {
  [key: string]: unknown
}

// /roomcenter/friend/room/apply/list 响应 data（cocos 未声明完整字段）。
export interface RoomcenterFriendRoomApplyListData {
  records?: RoomcenterFriendRoomApplyRecord[]
  total?: number
  limit?: number
  offset?: number
  [key: string]: unknown
}

// /roomcenter/friend/room/apply/audit 请求参数。
export interface RoomcenterFriendRoomApplyAuditRequest {
  // 房间 id。
  room_id?: number
  // 申请 id。
  apply_id?: number
  // 审核动作。
  action?: number
  [key: string]: unknown
}

// /roomcenter/friend/room/apply/audit 响应 data（cocos 未声明完整字段）。
export interface RoomcenterFriendRoomApplyAuditData {
  [key: string]: unknown
}

// /roomcenter/friend/rooms 请求参数（cocos 未声明）。
export interface RoomcenterFriendRoomsRequest {
  [key: string]: unknown
}

// /roomcenter/friend/rooms 单项（cocos 未声明完整字段）。
export interface RoomcenterFriendRoomRecord {
  rid?: number
  name?: string
  room_type?: number
  game_type?: number
  poker_type?: number
  limit_bet_type?: number
  status?: number
  ante?: number
  sb?: number
  bb?: number
  seat_count?: number
  empty_seat?: number
  roomers?: number
  play_duration?: number
  play_hands_limit?: number
  hand_num?: number
  invitation_code?: string
  private_room?: number
  room_password?: string
  anti_cheat_type?: number
  anti_cheat_video_type?: number
  bombpot?: number
  personal_type?: number
  seated_messaging?: number
  mushroom_mode?: number
  squid_on?: number
  random_ante?: string
  call_time?: number
  critical_hit?: number
  blind_name?: string
  blind_level_name?: string
  blind_level?: string | number
  blindtable_type_name?: string
  users?: Array<Record<string, unknown>>
  [key: string]: unknown
}

// /roomcenter/friend/rooms 响应 data（cocos 未声明完整字段）。
export interface RoomcenterFriendRoomsData {
  records?: RoomcenterFriendRoomRecord[]
  [key: string]: unknown
}

// /roomcenter/invitation/room 请求参数。
export interface RoomcenterInvitationRoomRequest {
  // 7 位邀请码。
  code: string
  [key: string]: unknown
}

// /roomcenter/invitation/room 普通房间数据（对应 Unity HttpRoomInvitationProtocol.Data）。
export interface RoomcenterInvitationRoomRecord {
  rid?: number
  room_type?: number
  play_duration?: number
  start_time?: string
  invitation_code?: string
  private_room?: number
  room_password?: string
  anti_cheat_type?: number
  anti_cheat_video_type?: number
  bombpot?: number
  name?: string
  [key: string]: unknown
}

// /roomcenter/invitation/room 响应 data。
export interface RoomcenterInvitationRoomData {
  // 普通房间。
  data?: RoomcenterInvitationRoomRecord | null
  // SNG 邀请数据（结构暂未在 H5 使用）。
  sng_data?: Record<string, unknown> | null
  // MTT 邀请数据（结构暂未在 H5 使用）。
  mtt_data?: Record<string, unknown> | null
  [key: string]: unknown
}

// /roomcenter/room/info 请求参数。
export interface RoomcenterRoomInfoRequest {
  room_id?: number
  [key: string]: unknown
}

// /roomcenter/room/info 房间信息（cocos 未声明完整字段）。
export interface RoomcenterRoomInfoRoom {
  [key: string]: unknown
}

// /roomcenter/room/info 用户信息（cocos 未声明完整字段）。
export interface RoomcenterRoomInfoUser {
  [key: string]: unknown
}

// /roomcenter/room/info 响应 data。
export interface RoomcenterRoomInfoData {
  room?: RoomcenterRoomInfoRoom
  users?: RoomcenterRoomInfoUser[]
  [key: string]: unknown
}

// /roomcenter/mtt/list 请求参数。
export interface RoomcenterMttListRequest {
  // 页码偏移。
  limit?: number
  // 页大小偏移。
  offset?: number
  // 名字过滤。
  name?: string
  // 是否只看我报名。
  mine?: boolean
  // 类型过滤。
  types?: number[]
  // 猎人模式过滤。
  hunter?: boolean
  // 联盟 id。
  tribe_id?: number
  // 开始时间范围。
  start_time_s?: number
  start_time_e?: number
  // 进入时间范围。
  enter_time_s?: number
  enter_time_e?: number
  // 游戏类型过滤。
  game_type?: number[]
  // 牌类型过滤。
  poker_type?: number[]
  // 下注类型过滤。
  limit_bet_type?: number[]
  // 排序。
  order?: string[]
  // 买入金额区间（不含服务费/人头费）。
  buyin_min?: number
  buyin_max?: number
  // 状态（0 已创建、1 进行中、2 已关闭）。
  status?: number[]
  [key: string]: unknown
}

// /roomcenter/mtt/list 单项（来源注释字段，按可选兼容）。
export interface RoomcenterMttListRecord {
  match_id?: number
  name?: string
  type?: number
  game_type?: number
  poker_type?: number
  limit_bet_type?: number
  rank_type?: number
  enter_time?: string
  start_time?: string
  end_time?: string
  hunter_on?: number
  hunter_bonus?: number
  partial_on?: number
  straddle_on?: number
  rooms?: number
  participants?: number
  award_num?: number
  status?: number
  seat_count?: number
  apply_fee_pool?: number
  apply_fee_service?: number
  apply_fee_hunter?: number
  prize_type?: number
  prize_base_pool?: number
  tribe_id?: number
  create_time?: string
  update_time?: string
  bought?: number
  alive?: number
  is_buy_in?: boolean
  prop_buy_type?: number
  [key: string]: unknown
}

// /roomcenter/mtt/list 响应 data。
export interface RoomcenterMttListData {
  limit?: number
  offset?: number
  total?: number
  records?: RoomcenterMttListRecord[]
  [key: string]: unknown
}

// /roomcenter/rooms_and_mtt/list 请求参数。
export interface RoomcenterRoomsAndMttListRequest {
  room_ids?: number[]
  match_ids?: number[]
  [key: string]: unknown
}

// /roomcenter/rooms_and_mtt/list records 单项。
export interface RoomcenterRoomsAndMttListRecord {
  room_id?: number
  match_id?: number
  room_type?: number
  name?: string
  multi_lang_names_obj?: unknown
  bombpot?: number
  sb?: number
  ante?: number
  apply_fee_pool?: number
  apply_fee_service?: number
  apply_fee_hunter?: number
  [key: string]: unknown
}

// /roomcenter/rooms_and_mtt/list data 内层。
export interface RoomcenterRoomsAndMttListInnerData {
  records?: RoomcenterRoomsAndMttListRecord[]
  [key: string]: unknown
}

// /roomcenter/rooms_and_mtt/list 响应 data（RoomCenterRoomsAndMttList.ResponseData）。
export interface RoomcenterRoomsAndMttListData {
  data?: RoomcenterRoomsAndMttListInnerData
  [key: string]: unknown
}

// /roomcenter/random_enter 请求参数。
export interface RoomcenterRandomEnterRequest {
  antes?: number[]
  small_blinds?: number[]
  ex_club_id?: number
  insurance_on?: number[]
  game_type?: number
  poker_type?: number[]
  limit_bet_type?: number[]
  anti_cheat_type?: number[]
  limit?: number
  detail?: boolean
  seated_messaging?: number[]
  personal_type?: number[]
  mushroom_mode?: number[]
  squid_on?: number[]
  random_seat?: number[]
  force_show_card?: number[]
  only_ios?: number[]
  limit_ip_on?: number[]
  limit_gps_on?: number[]
  jackpot?: number[]
  tribe_id?: number
  [key: string]: unknown
}

// /roomcenter/random_enter records 单项。
export interface RoomcenterRandomEnterRecord {
  room_id?: number
  room_type?: number
  anti_cheat_type?: number
  anti_cheat_video_type?: number
  bombpot?: number
  [key: string]: unknown
}

// /roomcenter/random_enter data 内层。
export interface RoomcenterRandomEnterInnerData {
  records?: RoomcenterRandomEnterRecord[]
  [key: string]: unknown
}

// /roomcenter/random_enter 响应 data。
export interface RoomcenterRandomEnterData {
  data?: RoomcenterRandomEnterInnerData
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/detail 请求参数。
export interface RoomcenterMttDetailRequest {
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/detail 奖励道具。
export interface RoomcenterMttPrizeGoods {
  na?: string
  n?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/detail 奖励项。
export interface RoomcenterMttPrize {
  min?: number
  max?: number
  award?: number
  goods?: RoomcenterMttPrizeGoods[]
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/detail 实际奖池。
export interface RoomcenterMttRealPrize {
  award?: number
  award_num?: number
  participants?: number
  prizes?: RoomcenterMttPrize[]
  award_type?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/detail 当前盲注与奖池信息（RoomCenterMttIdDetail.More）。
export interface RoomcenterMttMore {
  nu?: number
  bl?: number
  nbl?: number
  nsb?: number
  sb?: number
  ante?: number
  nante?: number
  prize_pool?: number
  min_chip?: number
  avg_chip?: number
  max_chip?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/detail 玩家筹码状态（RoomCenterMttDetailS.PlayerState + RoomCenterMttIdDetail.State）。
export interface RoomcenterMttPlayerState {
  left_rebuy_times?: number
  chip?: number
  store?: number
  init_score?: number
  partial_enable?: boolean
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/detail 盲注级别加时配置项。
export interface RoomcenterMttBlindLevelDelay {
  level?: number
  delay_times?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/detail mtt 字段（对应 cocos RoomCenterMttDetailS.MttDetails，并补充 RoomCenterMttIdDetail.Mtt 字段）。
export interface RoomcenterMttDetails {
  match_id?: number
  name?: string
  type?: number
  game_type?: number
  poker_type?: number
  limit_bet_type?: number
  rank_type?: number
  enter_time?: string
  start_time?: string
  end_time?: string
  hunter_on?: number
  hunter_bonus?: number
  partial_on?: number
  parital_return_bl?: number
  straddle_on?: number
  straddle_max?: number
  rooms?: number
  max_room_id?: number
  delay_view_card_on?: number
  limit_min?: number
  limit_delay_times?: number
  limit_auto_check_times?: number
  limit_auto_fold_times?: number
  participants?: number
  award_num?: number
  money_sync?: number
  status?: number
  seat_count?: number
  final_seat_count?: number
  no_user_wait_duration?: number
  initial_score?: number
  blindtable_type?: number
  upblind_interval?: number
  apply_start_time?: string
  op_duration?: number
  max_delay_apply_bl?: number
  rebuy_times?: number
  max_rebuy_bl?: number
  limit_total_buy_times?: number
  total_buy_times?: number
  total_rebuy_times?: number
  addon_begin_bl?: number
  addon_end_bl?: number
  addon_score?: number
  total_addon_times?: number
  apply_fee_pool?: number
  apply_fee_service?: number
  apply_fee_hunter?: number
  prize_type?: number
  tribe_id?: number
  create_time?: string
  update_time?: string
  game_icon?: string
  prop_buy_type?: number
  voiceprint_verify_on?: number
  voiceprint_verify_duration?: number
  buy_prop_id?: number
  addonplus_m1_on?: number
  addonplus_m1_max_times?: number
  addonplus_m1_limit?: number
  total_addonplus_m1_times?: number
  addonplus_m2_on?: number
  addonplus_m2_max_times?: number
  addonplus_m2_max_bl?: number
  total_addonplus_m2_times?: number
  buy_ratio?: number
  pre_buyin_bonus?: number
  tablecloth_tag?: string
  limit_tag?: string
  buyin_free_times?: number
  rebuy_free_times?: number
  multi_ratio_free_times?: number
  addon_free_times?: number
  buyin_free_incl_svr?: number
  rebuy_free_incl_svr?: number
  multi_ratio_free_incl_svr?: number
  addon_free_incl_svr?: number
  rebuy_ticket_limit_times?: number
  addon_ticket_limit_times?: number
  share_mtt?: number
  template_id?: number
  popup_message?: string
  anti_cheat_order_type?: number
  anti_cheat_order_mic_type?: number
  video_verify_type?: number
  anti_cheat_timelimit?: number
  force_video_timing_award?: number
  force_video_timing_finals?: number
  force_video_close?: number
  force_video_close_time?: number
  force_video_start_time?: string
  force_close_time?: number
  break_interval?: number
  break_duration?: number
  blind_level_delay_time_table?: RoomcenterMttBlindLevelDelay[]
  club_id?: number
  // RoomCenterMttIdDetail 额外字段。
  total_buyin_times?: number
  prize_base_pool?: number
  gold_type?: number
  anti_cheat_type?: number
  anti_cheat_video_type?: number
  joker?: number
  joker_count?: number
  mj_total_hands?: number
  mj_blind_up_hands?: number
  prizes?: RoomcenterMttPrize[]
  is_admin?: boolean
  is_top?: number
  invitation_code?: string
  origin_type?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/detail 响应 data。
export interface RoomcenterMttDetailData {
  // 存活人数。
  alive?: number
  // 最高记分牌。
  top?: number
  // 进入总人数（来自 RoomCenterMttIdDetail）。
  enter_total?: number
  // 当前玩家状态码。
  state_code?: number
  // 比赛细节信息（对应 cocos RoomCenterMttDetailS.MttDetails）。
  mtt?: RoomcenterMttDetails
  // 玩家筹码状态信息。
  state?: RoomcenterMttPlayerState
  // 盲注等级与奖池信息。
  more?: RoomcenterMttMore
  // 实际奖池信息。
  real_prize?: RoomcenterMttRealPrize
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/myrank 响应 data。
export interface RoomcenterMttMyRankData {
  my_rank?: number
  max_chip?: number
  avg_chip?: number
  min_chip?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/ranks 请求参数。
export interface RoomcenterMttRanksRequest {
  limit?: number
  offset?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/ranks 玩家项。
export interface RoomcenterMttRankPlayer {
  rank?: number
  chip?: number
  alive?: boolean
  rid?: number
  urid?: number
  rebuy?: number
  addon?: boolean
  name?: string
  hn?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/ranks 响应 data。
export interface RoomcenterMttRanksData {
  limit?: number
  offset?: number
  alive?: number
  total?: number
  sb?: number
  records?: RoomcenterMttRankPlayer[]
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/hranks 请求参数。
export interface RoomcenterMttHunterRanksRequest {
  limit?: number
  offset?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/hranks 玩家项。
export interface RoomcenterMttHunterRankPlayer {
  rank?: number
  h?: number
  award?: number
  rid?: number
  name?: string
  urid?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/hranks 响应 data。
export interface RoomcenterMttHunterRanksData {
  limit?: number
  offset?: number
  total?: number
  sb?: number
  records?: RoomcenterMttHunterRankPlayer[]
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/real_prize 请求参数。
export interface RoomcenterMttRealPrizeRequest {
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/myaward 响应 data。
export interface RoomcenterMttMyawardData {
  uid?: number
  rank?: number
  award_gold?: number
  hunter_award?: number
  hunter_rank?: number
  hunter_kill?: number
  is_final?: boolean
  awarded?: boolean
  username?: string
  avatar?: string
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/rooms 请求参数。
export interface RoomcenterMttRoomsRequest {
  limit?: number
  offset?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/rooms 玩家项。
export interface RoomcenterMttRoomPlayer {
  chip?: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/rooms 牌桌项。
export interface RoomcenterMttRoomRecord {
  rid?: number
  roomers?: RoomcenterMttRoomPlayer[]
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/rooms 响应 data。
export interface RoomcenterMttRoomsData {
  records?: RoomcenterMttRoomRecord[]
  [key: string]: unknown
}

// /roomcenter/user/all/rooms 请求参数。
export interface RoomcenterUserAllRoomsRequest {
  [key: string]: unknown
}

// /roomcenter/guest/all/rooms 请求参数。
export interface RoomcenterGuestAllRoomsRequest {
  club_rid?: number
  [key: string]: unknown
}

// /roomcenter/user/all/rooms 响应 data。
export interface RoomcenterUserAllRoomsData {
  // cocos 当前未给出详细结构定义。
  records?: Array<Record<string, unknown>>
  [key: string]: unknown
}

// ===== 由 models/room.ts 合并而来 =====

// /roomcenter/guest/all/rooms 请求参数。
export interface RoomcenterGuestRoomIdsRequest {
  club_rid?: number
  [key: string]: unknown
}

// 牌桌 ID 列表项。
export interface RoomIdRecord {
  rid: number | string
}

// 牌桌 ID 列表响应 data。
export interface RoomIdsData {
  records: RoomIdRecord[]
}

// 牌桌用户信息。
export interface RoomUser {
  seat?: number | string
  avatar?: string
  name?: string
  [key: string]: unknown
}

// 牌桌详情结构（字段来自旧版 roomList 页面）。
export interface RoomRecord {
  rid: number | string
  name?: string
  game_type: number
  poker_type: number
  /**
   * 限注类型：2 表示 AOF（与 Unity _limitBetType 判定一致）。
   */
  limit_bet_type?: number
  sb: number
  /**
   * 蘑菇模式：>0 显示 mushroom 标识。
   */
  mushroom_mode?: number
  /**
   * 鱿鱼模式：=1 显示 squid 标识。
   */
  squid_on?: number
  /**
   * 暴击模式：=1 显示 critical 标识。
   */
  critical_hit?: number
  roomers?: number
  seat_count?: number
  users?: RoomUser[]
  start_time?: string
  play_duration?: number
  min_rate?: number
  [key: string]: unknown
}

// 牌桌详情响应 data。
export interface RoomDetailData {
  records: RoomRecord[]
}

// /roomcenter/user/rooms/list 批量查询牌桌详情请求体。
export interface RoomDetailRequest {
  room_ids: number[]
  room_type: number
}

// /roomcenter/guest/rooms/list 批量查询牌桌详情请求体。
export interface GuestRoomDetailRequest {
  room_ids: number[]
  room_type: number
  club_rid?: number
}

// /roomcenter/user/contrast/rooms 请求参数（对齐 Unity HttpRoomCenterContrastRoomsProtocol）。
// room_ids 命中的房间只返回变化字段；其余可见房间作为「新房间」完整返回。
export interface RoomcenterUserContrastRoomsRequest {
  room_ids?: number[]
  last_time?: number
  [key: string]: unknown
}

// /roomcenter/guest/contrast/rooms 请求参数（返回同 RoomcenterUserContrastRoomsRequest）。
export interface RoomcenterGuestContrastRoomsRequest {
  room_ids?: number[]
  last_time?: number
  club_rid?: number
  [key: string]: unknown
}

// /roomcenter/user/contrast/rooms 单条变化字段（精简结构）。
export interface RoomcenterUserContrastRoomInfo {
  rid: number | string
  status?: number
  hand_num?: number
  empty_seat?: number
  users?: RoomUser[]
  relate_club_ids?: Array<number | string>
  relate_tribe_club_list?: Array<Record<string, unknown>>
  [key: string]: unknown
}

// /roomcenter/user/contrast/rooms 响应 data。
export interface RoomcenterUserContrastRoomsData {
  // 不在 room_ids 里且当前可见的新房间：返回完整 RoomRecord。
  records?: RoomRecord[]
  // 在 room_ids 里、自 last_time 后有变化的房间：只返回变化字段。
  contrast_rooms?: RoomcenterUserContrastRoomInfo[]
  [key: string]: unknown
}

// ===== 由 models/mtt.ts 合并而来 =====

// MTT 列表请求参数。
export interface MttListRequest {
  limit: number
  offset: number
  status?: number[]
  order?: string[]
  [key: string]: unknown
}

// MTT 列表项（字段保持宽松，便于首页统计与列表页共用）。
export interface MttListRecord {
  match_id?: number
  name?: string
  game_type?: number
  poker_type?: number
  series_id?: number
  pinned_time?: number
  status?: number
  bought?: number
  mtt_buy?: number
  rooms?: number
  participants?: number
  seat_count?: number
  // HTTP 通常是 RFC3339 字符串；WS 增量通知可能是秒级时间戳（number）。
  start_time?: string | number | null
  apply_start_time?: string | number | null
  upblind_interval?: number
  max_delay_apply_bl?: number
  apply_fee_pool?: number
  prize_base_pool?: number
  prize_pool?: number
  prize_type?: number
  rebuy_times?: number
  addon_begin_bl?: number
  addon_end_bl?: number
  anti_cheat_type?: number
  mtt_banner_url?: string
  game_icon?: string
  limit_participants?: number
  origin_type?: number
  relate_club_ids?: Array<number | string> | null
  relate_tribe_club_list?: Array<Record<string, unknown>> | null
  [key: string]: unknown
}

// MTT 列表响应 data。
export interface MttListData {
  limit?: number
  offset?: number
  total?: number
  records: MttListRecord[]
}

// 联盟关联结构：用于可见性判断（是否属于当前 club/tribe）。
export interface MttRelateTribeClubInfo {
  tribe_id?: number | string
  club_ids?: Array<number | string>
  [key: string]: unknown
}

// /roomcenter/user/all/mtt/sng/ids 的 mtt 列表项。
export interface MttIdInfoRecord {
  match_id?: number
  origin_type?: number
  relate_club_ids?: Array<number | string> | null
  relate_tribe_club_list?: MttRelateTribeClubInfo[] | null
  [key: string]: unknown
}

// /roomcenter/user/all/mtt/sng/ids 的 sng 列表项（当前仅透传缓存，先不参与页面渲染）。
export interface SngIdInfoRecord {
  sng_id?: number
  origin_type?: number
  relate_club_ids?: Array<number | string> | null
  relate_tribe_club_list?: MttRelateTribeClubInfo[] | null
  [key: string]: unknown
}

// 系列信息：对齐 Unity 的 GameMatchSeriesInfo 核心字段。
export interface MttSeriesInfoRecord {
  id?: number
  name?: string
  create_time?: number
  tribe_id?: number
  type?: number
  [key: string]: unknown
}

// /roomcenter/user/all/mtt/sng/ids 请求体。
export interface AllMttSngIdsRequest {
  room_ids?: number[]
  [key: string]: unknown
}
// /roomcenter/guest/all/mtt/sng/ids 请求体。
export interface GuestAllMttSngIdsRequest {
  room_ids?: number[]
  club_rid?: number // 俱乐部随机ID
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/buyin 请求体。
export interface MttBuyInRequest {
  ticket?: boolean
  ratio?: number
  use_free?: boolean
  club_id?: number
}

// /roomcenter/mtt/{id}/rebuy 请求体。
export interface MttRebuyRequest {
  ticket?: boolean
  ratio?: number
  use_free?: boolean
  club_id?: number
}

// MttPlayerStatus 枚举（与 Unity MttPlayerStatus.cs 对齐）。
export const MttPlayerStatus = {
  WAITING_APPLY: 0,
  CAN_APPLY_NOT_START: 1,
  CAN_APPLY_DELAY: 2,
  APPLIED_NOT_START: 3,
  CAN_JOIN: 4,
  CANNOT_APPLY_STARTED: 5,
  LOSE_CAN_REBUY: 6,
  LOSE: 7,
  JOIN_COMPLETE: 8,
  NOT_JOIN_COMPLETE: 9,
  CANNOT_JOIN_OVERTIME: 10,
} as const

// /roomcenter/user/all/mtt/sng/ids 响应 data。
export interface AllMttSngIdsData {
  mtt_id_list?: MttIdInfoRecord[]
  sng_id_list?: SngIdInfoRecord[]
  mtt_series_list?: MttSeriesInfoRecord[]
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/user_wallet 钱包项（对齐 Unity HttpRoomBringOutProtocol.Wallet）。
export interface MttWallet {
  club_id: number
  tribe_id?: number
  gold: number
  gold_type: number
  club_name: string
  club_random_id?: number
  club_logo?: string
  // 道具替代买入类型：0 不支持，1 仅道具，2 道具或货币
  prop_buy_type: number
  buy_prop_id: number
  [key: string]: unknown
}

// /roomcenter/mtt/{id}/user_wallet 免费次数限制。
export interface MttWalletFreeLimit {
  buyin: number
  rebuy: number
  addon: number
  multi: number
}

// /roomcenter/mtt/{id}/user_wallet 响应 data。
export interface MttUserWalletData {
  wallet: MttWallet[]
  free?: MttWalletFreeLimit
  [key: string]: unknown
}

// /api/roomcenter/club/room/apply/list (ClubRoomSitApplyRecords)

export interface ClubRoomSitApplyRecordsRequest {
  apply_type: number // 申请类型 0-所有；1=朋友桌；2=俱乐部桌
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  [key: string]: unknown
}

export interface ClubRoomSitApplyRecordsResponseData extends ClubRoomSitApplyRecordsData {
  [key: string]: unknown
}

export interface ClubRoomSitApplyRecordsData {
  limit?: number // 最大条数
  offset?: number // 开始下标
  total?: number // 总条数
  data?: ClubRoomSitApplyRecordsRecord[]

  [key: string]: unknown
}

export interface ClubRoomSitApplyRecordsRecord {
  id?: number // 记录id
  room_id?: number // 房间id
  club_id?: number // 俱乐部id
  room_name?: string // 房间名称
  game_type?: number // 游戏类型
  poker_type?: number // 牌类型(poker_type)
  user_random_id?: number // 用户随机id
  user_name?: string // 用户名
  avatar?: string // 玩家头像
  bring_in?: number // 带入冻结，1 开启，2 关闭
  status?: number // 状态 1 待审批，2通过，3拒绝，4取消 5自动拒绝 6带入失败回退
  create_time?: string // 创建时间
  sender_name?: string // 发送者名称
  sender_icon?: string // 发送者图标
  op_user_random_id?: number // 审核用户随机ID
  op_user_name?: string // 审核用户名称
  op_user_avatar?: string // 审核用户头像
  squid_base?: number // 鱿鱼基数，大于0，显示，等于0关闭
  mushroom_base?: number // 蘑菇基数 大于0 显示 等于0 关闭
  sng_id?: number // sng_id>0 就是一个sng申请

  [key: string]: unknown
}

// /api/roomcenter/club/room/apply/delay/audit (ClubDelayAudit)

export interface ClubDelayAuditRequest {
  [key: string]: unknown
}

export interface ClubDelayAuditResponseData extends ClubDelayAuditData {
  [key: string]: unknown
}

export interface ClubDelayAuditData {
  [key: string]: unknown
}

// /api/roomcenter/club/room/apply/delay/all/list (ClubDelayList)

export interface ClubDelayListRequest {
  [key: string]: unknown
}

export interface ClubDelayListResponseData extends ClubDelayListData {
  [key: string]: unknown
}

export interface ClubDelayListData {
  limit?: number // 最大条数
  offset?: number // 开始下标
  total?: number // 总条数
  unaudited?: number
  data?: CommonSendDelayApplyDelayApplyData[]
  delay_room_audit_switch?: number // 延长房间无需审批开关： 1 开 2 关

  [key: string]: unknown
}

export interface CommonSendDelayApplyDelayApplyData {
  id?: number // 记录id
  room_id?: number // 房间id
  club_id?: number // 俱乐部id
  room_name?: string // 房间名称
  game_type?: number // 房间类型
  poker_type?: number // 牌类型(poker_type)
  hands?: number // 游戏手数
  user_random_id?: number // 用户随机id
  user_name?: string // 用户名
  avatar?: string // 玩家头像
  status?: number // 0-all，1-待审批，2-通过，3-拒绝，4-取消
  create_time?: string // 创建时间
  sender_name?: string // 发送者名称
  sender_icon?: string // 发送者图标
  op_user_random_id?: number // 审核用户随机ID
  op_user_name?: string // 审核用户名称
  op_user_avatar?: string // 审核人头像
  users?: CommonSendDelayApplyDelayInfo[]
  squid_base?: number // 鱿鱼基数，大于0，显示，等于0关闭
  mushroom_base?: number // 蘑菇基数 大于0 显示 等于0 关闭

  [key: string]: unknown
}

export interface CommonSendDelayApplyDelayInfo {
  user_name?: string // 用户名称

  [key: string]: unknown
}

// /api/roomcenter/user/apply/list (UserRoomSitApplyRecords)

export interface UserRoomSitApplyRecordsRequest {
  [key: string]: unknown
}

export interface UserRoomSitApplyRecordsResponseData extends UserRoomSitApplyRecordsData {
  [key: string]: unknown
}

export interface UserRoomSitApplyRecordsData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总条数
  unaudited?: number // 未审核的申请数量
  data?: UserRoomSitApplyRecordsRecord[] // 申请列表

  [key: string]: unknown
}

export interface UserRoomSitApplyRecordsRecord {
  id?: number // 记录id
  room_id?: number // 房间id
  room_name?: string // 房间名称
  poker_type?: number // 0-德州 1-OMAHA4 2-OMAHA5 3-OMAHA6 4.fantasy 5.牛仔 6-麻將
  user_random_id?: number // 用户随机id
  user_name?: string // 用户名
  avatar?: string // 玩家头像
  bring_in?: number // 带入冻结，1 开启，2 关闭
  status?: number // 0-all，1-待审批，2-通过，3-拒绝，4-取消
  create_time?: string // 创建时间
  sender_name?: string // 发送者名称
  sender_icon?: string // 发送者图标
  op_user_random_id?: number // 审核用户随机ID
  op_user_name?: string // 审核用户名称
  op_user_avatar?: string // 审核用户头像
  club_id?: number // 俱乐部id
  game_type?: number // 游戏类型
  squid_base?: number // 鱿鱼基数，大于0，显示，等于0关闭
  mushroom_base?: number // 蘑菇基数 大于0 显示 等于0 关闭
  sng_id?: number // sng_id>0 就是一个sng申请

  [key: string]: unknown
}

// /api/roomcenter/club/room/apply/audit (RoomClubApplyAudit)

export interface RoomClubApplyAuditRequest {
    apply_id?: number; // 申请 ID
    audit_op?: number; // 审批状态：2 通过，3 拒绝

  [key: string]: unknown
}

export interface RoomClubApplyAuditResponseData extends RoomClubApplyAuditData {
  [key: string]: unknown
}

export interface RoomClubApplyAuditData {
  [key: string]: unknown
}

// /api/roomcenter/user/mtt/sng/rooms/list (RoomCenterUserMatchList)
export interface RoomCenterUserMatchListRequest {
  mtt_ids?: number[]; // mtt ID 列表
  sng_ids?: number[]; // sng ID 列表
  room_type?: number; // 0.所有信息 1.变化信息
  [key: string]: unknown
}
// /api/roomcenter/guest/mtt/sng/rooms/list (RoomCenterGuestMatchList)
export interface RoomCenterGuestMatchListRequest {
  mtt_ids?: number[]; // mtt ID 列表
  sng_ids?: number[]; // sng ID 列表
  room_type?: number; // 0.所有信息 1.变化信息
  club_rid?: number // 俱乐部随机ID
  [key: string]: unknown
}

export interface RoomCenterUserMatchListResponseData extends RoomCenterUserMatchListData {
  [key: string]: unknown
}

export interface RoomCenterUserMatchListData {
    mtt_change_list?: RoomCenterUserMatchListContrastMttInfo[]; // mtt 变化数据
    sng_change_list?: RoomCenterUserMatchListContrastSngInfo[]; // sng 变化数据
    mtt_list?: RoomCenterUserMatchListMttInfo[]; // mtt 详情数据
    sng_list?: RoomCenterUserMatchListSngInfo[]; // sng 详情数据

  [key: string]: unknown
}

export interface RoomCenterUserMatchListSngInfo {
    anti_cheat_type?: number; // 防作弊类型
    anti_cheat_video_type?: number; // 视频模式
    apply_fee_pool?: number; // 报名费 进池
    apply_fee_service?: number; // 报名费 服务费
    bombpot?: number; // 1:开启bombpot 0: 未开启
    buy_status?: number; // 用户参与状态：0-不可参加；1-可以报名参加；2-已报名可退赛；3-比赛中；4-申请中
    game_type?: number; // 游戏类型
    limit_bet_type?: number; // 下注类型
    limit_participants?: number; // 限制多少人开始
    name?: string; // 比赛名称
    origin_type?: number; // 创建来源
    poker_type?: number; // 牌类型
    sng_id?: number; // 显示ID
    currency?: string; // 货币代码
    blindtable_type?: number; // 盲注表类型
    club_id?: number; // 俱乐部ID
    game_icon?: string; // 游戏图标URL
    gold_type?: number; // 币种类型（0-未知 1-联盟币 2-USDT 3-记分牌 4-钻石）
    initial_score?: number; // 初始分数
    invitation_code?: string; // 邀请码
    is_admin?: boolean; // 是否为管理员
    prize_type?: number; // 奖励类型
    prizes?: MTTRealPrizePrize[]; // 奖励列表
    relate_club_ids?: number[]; // 关联俱乐部ID列表
    relate_tribe_club_list?: RoomClubListTribeClubInfo[]; // 关联联盟-俱乐部列表
    status?: number; // 当前状态 (0 创建，1 运行，2 结束，3 取消)
    tribe_id?: number; // 联盟ID
    type?: number; // 赛事类型
    upblind_interval?: number; // 升盲间隔（秒/分钟，按业务定义）

  [key: string]: unknown
}

export interface RoomCenterUserMatchListMttInfo {
    origin_type?: number; // 房间来源类型 1 平台 2 联盟 3 俱乐部 4 个人
    relate_club_ids?: number[]; // 俱乐部桌关联列表
    relate_tribe_club_list?: RoomClubListTribeClubInfo[]; // 联盟桌关联map
    match_id?: number; // 比赛id
    start_time?: string; // 开始时间
    status?: number; // 游戏状态
    name?: string; // 比赛名称
    game_type?: number; // 游戏类型
    poker_type?: number; // 牌类型
    hunter_on?: number; // 是否猎人赛
    participants?: number; // 参赛人次
    alive?: number; // 存活人数 优化
    upblind_interval?: number; // 升盲时间 优化
    apply_start_time?: string; // 报名时间
    max_delay_apply_bl?: number; // 关闭延迟报名，升盲等级
    rebuy_times?: number; // 重构次数
    total_rebuy_times?: number; // 总重购次数
    addon_begin_bl?: number; // 增购开始盲注等级
    addon_end_bl?: number; // 增购结束盲注等级
    apply_fee_pool?: number; // 报名费
    apply_fee_service?: number; // 服务费
    apply_fee_hunter?: number; // 猎人赛人头费
    prize_type?: number; // 奖励类型
    prize_base_pool?: number; // 奖励数量
    prop_buy_type?: number;
    buyin_free_times?: number; // 报名限免次数
    rebuy_free_times?: number; // 重购限免次数
    multi_ratio_free_times?: number; // 多倍率买入限免次数
    addon_free_times?: number; // 增购限免次数（包含addon addonp1 addonp2）
    buyin_free_incl_svr?: number; // 报名限免是否包含服务费，0不包含，1包含
    rebuy_free_incl_svr?: number; // 重购限免是否包含服务费，0不包含，1包含
    multi_ratio_free_incl_svr?: number; // 多倍率买入限免是否包含服务费，0不包含，1包含
    addon_free_incl_svr?: number; // 增购限免是否包含服务费，0不包含，1包含
    gold_type?: number; // 币种类型 0 未知 1 联盟币 2 USDT 3记分牌 4钻石
    anti_cheat_type?: number; // 防作弊类型 0 未知 1 无 2 实时语音 3 实时视频 4 人脸验证
    anti_cheat_timelimit?: number; // 强制开启语音/视频 秒数
    anti_cheat_video_type?: number; // 实时视频模式 0 未知 1 全时长 2 随机验证 3 麦序
    video_verify_type?: number; // 视频验证方式
    anti_cheat_order_type?: number; // 麦序模式验证方式：1麦序音频，2全程音频
    anti_cheat_order_mic_type?: number; // 麦序模式-麦克风验证方式： 1可关闭麦克，2不可关闭麦克
    bought?: number; // 0: 无法报名 , 1: 报名中 , 2: 参与中
    mtt_buy?: number; // 是否已报名
    mtt_banner_url?: string; // MTT比赛banner
    force_close_time?: number; // 限时赛时间
    game_icon?: string; // 游戏图标
    initial_score?: number; // 初始分数
    is_admin?: boolean; // 是否为管理员
    is_top?: number; // 是否置顶
    joker?: number; // 百搭牌（joker）配置
    joker_count?: number; // 百搭牌数量
    limit_min?: number; // 最低限制值
    mj_blind_up_hands?: number; // 麻将盲注升级手数
    mj_total_hands?: number; // 麻将总手数
    prizes?: MTTRealPrizePrize[]; // 奖励列表
    state_code?: number; // 状态码
    total_buyin_times?: number; // 总买入次数
    type?: number; // 赛事类型
    stage_name?: string; // 阶段赛名称
    stage_father_id?: number; // 阶段赛终赛 ID
    stage_blind_level?: number; // 阶段赛结束盲注级别
    stage_remain_rate?: number; // 阶段赛结束剩余比例 (5 表示 5%)
    stage_final_score_type?: number; // 阶段赛晋级筹码类型 (1 表示最高筹码；2 表示累加筹码)

  [key: string]: unknown
}

export interface RoomCenterUserMatchListContrastMttInfo {
    match_id?: number; // 比赛id
    bought?: number; // 0: 无法报名 , 1: 报名中 , 2: 参与中
    mtt_buy?: number; // 是否已报名
    status?: number; // 游戏状态
    participants?: number; // 参赛人次
    state_code?: number; // 当前玩家的状态，参考 MTTPlayerStatus 定义

  [key: string]: unknown
}

export interface RoomCenterUserMatchListContrastSngInfo {
    sng_id?: number; // 比赛id
    buy_status?: number; // 用户参与状态：0-不可参加；1-可以报名参加；2-已报名可退赛；3-比赛中；4-申请中
    status?: number; // 游戏状态

  [key: string]: unknown
}

export interface MTTRealPrizePrize {
    min?: number; // 最小名次
    max?: number; // 最大名次
    award?: number; // 奖励
    goods?: unknown[]; // 奖励物品

  [key: string]: unknown
}

export interface RoomClubListTribeClubInfo {
    tribe_id?: number; // 联盟Id
    club_ids?: number[]; // 俱乐部

  [key: string]: unknown
}

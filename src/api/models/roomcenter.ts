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
  [key: string]: unknown
}

// /roomcenter/friend/rooms 响应 data（cocos 未声明完整字段）。
export interface RoomcenterFriendRoomsData {
  records?: RoomcenterFriendRoomRecord[]
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

// /roomcenter/user/all/rooms 响应 data。
export interface RoomcenterUserAllRoomsData {
  // cocos 当前未给出详细结构定义。
  records?: Array<Record<string, unknown>>
  [key: string]: unknown
}

// ===== 由 models/room.ts 合并而来 =====

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

// 批量查询牌桌详情请求体。
export interface RoomDetailRequest {
  room_ids: number[]
  room_type: number
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
export const enum MttPlayerStatus {
  WAITING_APPLY = 0,
  CAN_APPLY_NOT_START = 1,
  CAN_APPLY_DELAY = 2,
  APPLIED_NOT_START = 3,
  CAN_JOIN = 4,
  CANNOT_APPLY_STARTED = 5,
  LOSE_CAN_REBUY = 6,
  LOSE = 7,
  JOIN_COMPLETE = 8,
  NOT_JOIN_COMPLETE = 9,
  CANNOT_JOIN_OVERTIME = 10,
}

// /roomcenter/user/all/mtt/sng/ids 响应 data。
export interface AllMttSngIdsData {
  mtt_id_list?: MttIdInfoRecord[]
  sng_id_list?: SngIdInfoRecord[]
  mtt_series_list?: MttSeriesInfoRecord[]
  [key: string]: unknown
}

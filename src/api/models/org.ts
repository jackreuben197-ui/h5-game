// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/org

// /api/org/club/{id} (OrgClubId)
export interface OrgClubIdRequest {
  [key: string]: unknown
}

export interface OrgClubIdResponseData extends OrgClubIdData {
  [key: string]: unknown
}

export interface OrgClubIdData {
  club_name?: string // 俱乐部名称
  logo?: string // 俱乐部头像
  random_id?: number // 俱乐部随机id
  upper_limit?: number // 俱乐部限制人数
  club_members?: number // 俱乐部成员人数
  area_id?: string // 俱乐部所在地区
  club_type?: number // 俱乐部类型
  member_type?: number // 成员类别，1 俱乐部管理员，2 俱乐部代理用户，3 普通用户
  create_time?: string // 创建时间
  is_official?: number // 是否是平台俱乐部
  club_status?: number // 俱乐部状态

  [key: string]: unknown
}

// /api/org/club/{id}/join (OrgClubIdJoin)
export interface OrgClubIdJoinRequest {
  [key: string]: unknown
}

export interface OrgClubIdJoinResponseData extends OrgClubIdJoinData {
  [key: string]: unknown
}

export interface OrgClubIdJoinData {
  [key: string]: unknown
}

// /api/org/club/admin/add_admin (OrgClubAddAdmin)
export interface OrgClubAddAdminRequest {
  //     user_id: number,  //
  //
  [key: string]: unknown
}

export interface OrgClubAddAdminResponseData {
  [key: string]: unknown
}

// /api/org/club/admin/create_room_switch (OrgClubCreateRoomChange)
export interface OrgClubCreateRoomChangeRequest {
  //     user_id: number,  //
  //     create_room: number //
  //
  [key: string]: unknown
}

export interface OrgClubCreateRoomChangeResponseData {
  [key: string]: unknown
}

// /api/org/club/admin/del_admin (OrgClubDelAdmin)
export interface OrgClubDelAdminRequest {
  //     user_id: number,  //
  //
  [key: string]: unknown
}

export interface OrgClubDelAdminResponseData {
  [key: string]: unknown
}

// /api/org/club/admin/delele/user (DeleleUser)
export interface DeleleUserRequest {
  //     user_id: number;
  //
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface DeleleUserResponseData extends DeleleUserData {
  [key: string]: unknown
}

// /api/org/club/admin/has (OrgClubIsManger)
export interface OrgClubIsMangerRequest {
  //     club_id: null;
  //
  [key: string]: unknown
}

export interface OrgClubIsMangerResponseData extends OrgClubIsMangerData {
  [key: string]: unknown
}

// /api/org/club/admin/list (OrgMangerList)
export interface OrgMangerListRequest {
  [key: string]: unknown
}

export interface OrgMangerListResponseData {
  [key: string]: unknown
}

// /api/org/club/admin/lock/user (LockUser)
export interface LockUserRequest {
  //     user_id: number;
  //
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface LockUserResponseData extends LockUserData {
  [key: string]: unknown
}

// /api/org/club/admin/permission_switch (OrgClubAdminPermissionSwitch)
export interface OrgClubAdminPermissionSwitchRequest {
  club_id?: number // 俱乐部id
  user_id?: number // 成员id
  create_room?: number // 开桌权限 1有 2没有
  club_manage?: number // 俱乐部管理权限 1有 2没有
  member_manage?: number // 成员管理权限 1有 2没有
  fund_manage?: number // 基金管理权限 1有 2没有
  get_data?: number // 查看数据权限 1有 2没有

  [key: string]: unknown
}

export interface OrgClubAdminPermissionSwitchResponseData extends OrgClubAdminPermissionSwitchData {
  [key: string]: unknown
}

export interface OrgClubAdminPermissionSwitchInfo {
  create_room?: number // 开桌权限 1有 2没有
  club_manage?: number // 俱乐部管理权限 1有 2没有
  member_manage?: number // 成员管理权限 1有 2没有
  fund_manage?: number // 基金管理权限 1有 2没有
  get_data?: number // 查看数据权限 1有 2没有

  [key: string]: unknown
}

export interface OrgClubAdminPermissionSwitchData {
  info?: OrgClubAdminPermissionSwitchInfo // 数据

  [key: string]: unknown
}

// /api/org/club/admin/unlock/user (UnlockUser)
export interface UnlockUserRequest {
  //     user_id: number;
  //
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface UnlockUserResponseData extends UnlockUserData {
  [key: string]: unknown
}

// /api/org/club/agent/credit/balance (OrgClubAgentCreditBalaNce)
export interface OrgClubAgentCreditBalaNceRequest {
  user_id?: number // 成员id
  gold_type?: number // 1-联盟币;2-USDT;3-俱乐部币
  amount?: number // 额度
  is_reset?: boolean // 是否重置

  [key: string]: unknown
}

export interface OrgClubAgentCreditBalaNceResponseData extends OrgClubAgentCreditBalaNceData {
  [key: string]: unknown
}

export interface OrgClubAgentCreditBalaNceData {
  [key: string]: unknown
}

// /api/org/club/agent/credit/limit (OrgClubAgentCreditLimit)
export interface OrgClubAgentCreditLimitRequest {
  user_id?: number // 成员id
  gold_type?: number // 1-联盟币;2-USDT;3-俱乐部币
  amount?: number // 额度
  is_reset?: boolean // 是否重置

  [key: string]: unknown
}

export interface OrgClubAgentCreditLimitResponseData extends OrgClubAgentCreditLimitData {
  [key: string]: unknown
}

export interface OrgClubAgentCreditLimitData {
  [key: string]: unknown
}

// /api/org/club/agent/invitation (OrgClubAgentInviTation)
export interface OrgClubAgentInviTationRequest {
  user_id?: number // 用户id
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface OrgClubAgentInviTationResponseData extends OrgClubAgentInviTationData {
  [key: string]: unknown
}

export interface OrgClubAgentInviTationData {
  invitation_link?: string // 代理邀请链接
  invitation_code?: string // 代理邀请码
  [key: string]: unknown
}

// /api/org/club/agent/list (ClubAgentList)
export interface ClubAgentListRequest {
  [key: string]: unknown
}

export interface ClubAgentListResponseData {
  [key: string]: unknown
}

// /api/org/club/agent/ratio/info (OrgClubAgentRatioInfo)
export interface OrgClubAgentRatioInfoRequest {
  user_id?: number // 代理用户ID

  [key: string]: unknown
}

export interface OrgClubAgentRatioInfoResponseData extends OrgClubAgentRatioInfoData {
  [key: string]: unknown
}

export interface OrgClubAgentRatioInfoData {
  info?: OrgClubAgentRatioInfoInfo

  [key: string]: unknown
}

export interface OrgClubAgentRatioInfoInfo {
  agent_service_ratio?: number // 代理占公会抽水分成的比例150;150/1000=15%=0.15
  agent_insur_ratio?: number // 代理占公会保险分成的比例
  agent_cowboy_ratio?: number // 代理占公会牛仔分成的比例
  agent_mtt_ratio?: number // 代理占公会mtt服务费分成的比例
  agent_jackpot_ratio?: number // jackpot分成比例

  [key: string]: unknown
}

// /api/org/club/agent/ratio/update (OrgClubAgentRatioUpdate)
export interface OrgClubAgentRatioUpdateRequest {
  user_id?: number // 代理用户ID
  agent_service_ratio?: number // 服务费占俱乐部服务费分成比例150；150/1000 = 15% =0.15
  agent_insur_ratio?: number // 保险分成
  agent_cowboy_ratio?: number // 牛仔分成
  agent_mtt_ratio?: number // MTT服务费分成
  agent_jackpot_ratio?: number // ackpot分成比例

  [key: string]: unknown
}

export interface OrgClubAgentRatioUpdateResponseData {
  [key: string]: unknown
}

// /api/org/club/agent/user_list (ClubAgentUserList)
export interface ClubAgentUserListRequest {
  club_random_id?: number // 俱乐部随机id
  club_id?: number // 俱乐部id
  user_id?: number // 代理id
  search?: string // 搜索内容id或名称
  sort_type?: number // 1-输赢数;2-手数;3-服务费;4-最后登陆时间;
  order_type?: number // 1-顺序;2-倒叙;
  limit?: number // 最大条数
  offset?: number // 开始下标
  simple?: boolean // 是否简化返回数据，true-简化，false-完整
  return_diamonds?: boolean // 是否返回钻石余额

  [key: string]: unknown
}

export interface ClubAgentUserListResponseData extends ClubAgentUserListData {
  [key: string]: unknown
}

// /api/org/club/agent/user_list_cover (ClubAgentUserListCover)
export interface ClubAgentUserListCoverRequest {
  club_id?: number // 俱乐部id
  agent_id?: number // 代理id
  user_ids?: number[] // 成员id列表

  [key: string]: unknown
}

export interface ClubAgentUserListCoverResponseData extends ClubAgentUserListCoverData {
  [key: string]: unknown
}

// /api/org/club/clone/apply (OrgClubCloneApply)
export interface OrgClubCloneApplyRequest {
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface OrgClubCloneApplyResponseData extends OrgClubCloneApplyData {
  [key: string]: unknown
}

export interface OrgClubCloneApplyData {
  [key: string]: unknown
}

// /api/org/club/club_user/wallet (ClubUserWallet)
export interface ClubUserWalletRequest {
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface ClubUserWalletResponseData extends ClubUserWalletData {
  [key: string]: unknown
}

// /api/org/club/club_wallet/stats (OrgClubClubWalletStats)
export interface OrgClubClubWalletStatsRequest {
  gold_type?: number // 1-联盟币;2-USDT
  start_time?: number // 开始时间，单位秒
  end_time?: number // 结束时间，单位秒

  [key: string]: unknown
}

export interface OrgClubClubWalletStatsResponseData extends OrgClubClubWalletStatsData {
  [key: string]: unknown
}

export interface OrgClubClubWalletStatsData {
  gold_before?: number
  gold_after?: number
  to_user?: number
  recover_user?: number
  to_club?: number
  recover_club?: number
  room_profit?: number
  mtt_profit?: number
  insurance?: number
  sng_profit?: number
  jackpot_profit?: number
  mini_game_profit?: number

  [key: string]: unknown
}

// /api/org/club/create (OrgClubCreate)
export interface OrgClubCreateRequest {
  area_id?: string
  club_name: string
  desc: string
  logo: string
  more_contact?: string // 俱乐部联系方式

  [key: string]: unknown
}

export interface OrgClubCreateResponseData extends OrgClubCreateData {
  [key: string]: unknown
}

// /api/org/club/create/is_first (OrgClubCreateIsFirst)
export interface OrgClubCreateIsFirstRequest {
  [key: string]: unknown
}

export interface OrgClubCreateIsFirstResponseData extends OrgClubCreateIsFirstData {
  [key: string]: unknown
}

export interface OrgClubCreateIsFirstData {
  is_first?: number // 是否首次申请：0 不是； 1 是

  [key: string]: unknown
}

// /api/org/club/credit/balance (OrgClubCreditBalaNce)
export interface OrgClubCreditBalaNceRequest {
  user_id?: number // 用户id
  gold_type?: number // 1-联盟币;2-USDT;3-俱乐部币
  amount?: number // 金额
  is_reset?: boolean // 是否重置

  [key: string]: unknown
}

export interface OrgClubCreditBalaNceResponseData extends OrgClubCreditBalaNceData {
  [key: string]: unknown
}

export interface OrgClubCreditBalaNceData {
  [key: string]: unknown
}

// /api/org/club/credit/limit (OrgClubCreditLimit)
export interface OrgClubCreditLimitRequest {
  user_id?: number // 用户id
  gold_type?: number // 1-联盟币;2-USDT;3-俱乐部币
  amount?: number // 额度
  is_reset?: boolean // 是否重置

  [key: string]: unknown
}

export interface OrgClubCreditLimitResponseData extends OrgClubCreditLimitData {
  [key: string]: unknown
}

export interface OrgClubCreditLimitData {
  [key: string]: unknown
}

// /api/org/club/credit/log (OrgClubCreditLog)
export interface OrgClubCreditLogRequest {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  gold_type?: number // 货币类型 1-联盟币;2-USDT,3-俱乐部币;
  op_codes?: string[] // 操作类型;
  start_time?: number // 开始时间，时间戳;
  end_time?: number // 结束时间，时间戳;
  sort_type?: number // 1时间 2数量
  order_type?: number // 1正序 2倒序

  [key: string]: unknown
}

export interface OrgClubCreditLogResponseData extends OrgClubCreditLogData {
  [key: string]: unknown
}

export interface OrgClubCreditLogData {
  limit?: number // 数据数量
  total?: number // 总数
  offset?: number // 当前偏移值
  data?: OrgClubCreditLogCreditData[] // 授信信息
  credit_info?: OrgClubCreditLogCreditInfo // 信息

  [key: string]: unknown
}

export interface OrgClubCreditLogCreditInfo {
  club_credit_limit_total?: number
  club_credit_limit_increase_total?: number
  club_credit_limit_decrease_total?: number
  club_credit_total?: number
  club_credit_increase_total?: number
  club_credit_decrease_total?: number

  [key: string]: unknown
}

export interface OrgClubCreditLogCreditData {
  credit_change?: number
  credit_after?: number
  create_time?: string
  op_code?: string
  credit_limit?: number
  user_random_id?: number
  user_name?: string

  [key: string]: unknown
}

// /api/org/club/delay_room_audit_switch/update (OrgClubDelayRoomAuditSwitchUpdate)
export interface OrgClubDelayRoomAuditSwitchUpdateRequest {
  delay_room_audit_switch?: number // 延长房间无需审批开关： 1 开 2 关

  [key: string]: unknown
}

export interface OrgClubDelayRoomAuditSwitchUpdateResponseData extends OrgClubDelayRoomAuditSwitchUpdateData {
  [key: string]: unknown
}

export interface OrgClubDelayRoomAuditSwitchUpdateData {
  [key: string]: unknown
}

// /api/org/club/disband (OrgClubDisband)
export interface OrgClubDisbandRequest {
  [key: string]: unknown
}

export interface OrgClubDisbandResponseData extends OrgClubDisbandData {
  [key: string]: unknown
}

export interface OrgClubDisbandData {
  [key: string]: unknown
}

// /api/org/club/fund/detail (OrgClubGold)
export interface OrgClubGoldRequest {
  //     club_random_id: number
  //
  [key: string]: unknown
}

export interface OrgClubGoldResponseData extends OrgClubGoldData {
  [key: string]: unknown
}

// /api/org/club/fund/gold_change/log (ClubFundChangeLog)
export interface ClubFundChangeLogRequest {
  //     club_random_id: number
  //
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  gold_type?: number // 1-联盟币;2-USDT;
  op_codes?: string[] // 操作类型;
  start_time?: number // 开始时间，时间戳;
  end_time?: number // 结束时间，时间戳;
  sort_type?: number // 1-创建时间;2-成员数;3-等级
  order_type?: number // 1-顺序;2-倒序

  [key: string]: unknown
}

export interface ClubFundChangeLogResponseData extends ClubFundChangeLogData {
  [key: string]: unknown
}

// /api/org/club/info (OrgClubSearchById)
export interface OrgClubSearchByIdRequest {
  club_random_id: number // 俱乐部随机id
}

export interface OrgClubSearchByIdResponseData {
  club_id?: number
  club_name?: string
  logo?: string
  random_id?: number
  upper_limit?: number
  club_members?: number
  area_id?: string
  create_time?: string
  desc?: string
  more_contact?: string
  level?: number
  tables?: number
  club_creator_random_id?: number
  club_creator_avatar?: string
  club_creator_nickname?: string
  tribe_name?: string
  search_switch?: number
  auto_audit_switch?: number
  show_contact_switch?: number
  show_notice_switch?: number
  user_level?: number
  tribe_id?: number
  tribe_random_id?: number
  tribe_logo?: string
  contact_info?: OrgClubSearchByIdContactInfo
  user_gold?: number
  user_ustd?: number
  friend_total?: number
  digital_wallet_switch?: number
  digital_wallet_erc?: string
  digital_wallet_trc?: string
  grant_switch?: number
  pretty_id?: number
  first_update_name?: number
  last_update_name_time?: string
  welcomes?: string
  welcomes_switch?: number
  max_user_service_ratio?: number
  max_user_mtt_ratio?: number
  member_detail_type?: number
  currency_exchange?: number
  currency?: string
  master_type?: number
  banner?: string
  fantasy_room_switch?: number
  uc_deposit_advance?: number
  banner_audit?: number
  club_subscription_id?: number
  club_subscription?: OrgClubSearchByIdClubVipInfo
  member_type?: number
  user_credit?: number
  club_gold_credit_limit?: number
  user_club_forbidden?: boolean
  room_permissions?: unknown
  new_labels?: unknown
  club_user_wallet_switch?: number
  prologue?: string
  prologue_switch?: number
  agent_uc_switch?: number
  support_im_rid?: string
  support_user_id?: number
  deposit_switch?: number
  security_deposit?: number
  freeze_status?: number

  [key: string]: unknown
}

// /api/org/club/invitation (OrgClubInviTation)
export interface OrgClubInviTationRequest {
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface OrgClubInviTationResponseData extends OrgClubInviTationData {
  [key: string]: unknown
}

export interface OrgClubInviTationData {
  invitation_link?: string // 邀请链接
  invitation_code?: string // 邀请码
  [key: string]: unknown
}

// /api/org/club/jackpot/recharge (OrgClubJackpotRecharge)
export interface OrgClubJackpotRechargeRequest {
  jackpot_id?: number // jackpot id
  amount?: number // 注入金额

  [key: string]: unknown
}

export interface OrgClubJackpotRechargeResponseData extends OrgClubJackpotRechargeData {
  [key: string]: unknown
}

export interface OrgClubJackpotRechargeData {
  [key: string]: unknown
}

// /api/org/club/jackpot/template/create (OrgClubJackpotTemplateCreate)
export interface OrgClubJackpotTemplateCreateRequest {
  name?: string // 模版名称
  gold?: number // 金额
  nlh_switch?: number // NLH开关
  nlh_setting?: OrgClubJackpotTemplateCreateJackpotSetting // NLH配置
  plo_switch?: number // PLO开关
  plo_setting?: OrgClubJackpotTemplateCreateJackpotSetting // PLO配置
  six_plus_switch?: number // 6+开关
  six_plus_setting?: OrgClubJackpotTemplateCreateJackpotSetting // 6+配置
  bombpot_switch?: number // BombPot开关
  bombpot_setting?: OrgClubJackpotTemplateCreateJackpotSetting // BombPot配置
  aof_switch?: number // AOF开关
  aof_setting?: OrgClubJackpotTemplateCreateJackpotSetting // AOF配置

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateCreateResponseData extends OrgClubJackpotTemplateCreateData {
  [key: string]: unknown
}

export interface OrgClubJackpotTemplateCreateJackpotSetting {
  game_play_ratio?: number // 玩法奖池比例，千分位
  blind_setting?: OrgClubJackpotTemplateCreateBlindsSetting[] // 小盲信息
  royal_flush_switch?: number // 皇家同花顺奖金比例开关
  royal_flush_ratio?: number // 皇家同花顺奖金比例,千分位
  straight_flush_switch?: number // 同花顺奖金比例开关
  straight_flush_ratio?: number // 同花顺奖金比例,千分位
  four_ofa_kind_switch?: number // 四条奖金比例开关
  four_ofa_kind_ratio?: number // 四条奖金比例,千分位

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateCreateBlindsSetting {
  sb?: number // 小盲
  status?: number // 开关
  blind_type?: number // 盲注分类 1 微 2 小 3 中 4 大
  prize_ratio?: number // 奖池比例，千分位
  contribute_pot_switch?: number // 底池低于X BB不触发贡献，开关：1开，2关
  contribute_pot_limit?: number // 底池低于X BB不触发贡献
  award_bet_switch?: number // 投注高于X BB触发奖励，开关：1开，2关
  award_bet_limit?: number // 投注高于X BB触发奖励
  award_other_switch?: number // 奖励或奖者后，奖励其他人，开关：1开，2关
  award_other_ratio?: number // 奖励或奖者后，奖励其他人，千分位
  award_round_type?: number // 比牌或者Flop牌
  contribute_type?: number // 贡献类型：1按固定值；2按比例；3底池奖金
  contribute_fixed_limit?: number // 盈利达到X BB
  contribute_fixed_rate?: number // 盈利达到X BB，贡献值
  contribute_ratio?: number // 贡献盈利比例，千分位
  contribute_pot_ratio?: number // 底池抽取比例，千分位
  mars_earth_ratio?: number // 火星撞地球底池比例，千分位

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateCreateData {
  [key: string]: unknown
}

// /api/org/club/jackpot/template/del (OrgClubJackpotTemplateDel)
export interface OrgClubJackpotTemplateDelRequest {
  jackpot_id?: number // jackpot id

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateDelResponseData extends OrgClubJackpotTemplateDelData {
  [key: string]: unknown
}

export interface OrgClubJackpotTemplateDelData {
  [key: string]: unknown
}

// /api/org/club/jackpot/template/list (OrgClubJackpotTemplateList)
export interface OrgClubJackpotTemplateListRequest {
  nlh_switch?: number // NLH开关
  plo_switch?: number // PLO开关
  six_plus_switch?: number // 6+开关
  bombpot_switch?: number // BombPot开关
  aof_switch?: number // AOF开关
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  ids?: number[] // Jackpot Ids

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateListResponseData extends OrgClubJackpotTemplateListData {
  [key: string]: unknown
}

export interface OrgClubJackpotTemplateListData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  items?: unknown[]

  [key: string]: unknown
}

// /api/org/club/jackpot/template/update (OrgClubJackpotTemplateUpdate)
export interface OrgClubJackpotTemplateUpdateRequest {
  name?: string // 模版名称
  jackpot_id?: number // jackpot ID
  nlh_switch?: number // NLH开关
  nlh_setting?: unknown // NLH配置
  plo_switch?: number // PLO开关
  plo_setting?: unknown // PLO配置
  six_plus_switch?: number // 6+开关
  six_plus_setting?: unknown // 6+配置
  bombpot_switch?: number // BombPot开关
  bombpot_setting?: unknown // BombPot配置
  aof_switch?: number // AOF开关
  aof_setting?: unknown // AOF配置

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateUpdateResponseData extends OrgClubJackpotTemplateUpdateData {
  [key: string]: unknown
}

export interface OrgClubJackpotTemplateUpdateData {
  [key: string]: unknown
}

// /api/org/club/jackpot/withdraw (OrgClubJackpotWithdraw)
export interface OrgClubJackpotWithdrawRequest {
  jackpot_id?: number // jackpot id
  amount?: number // 提取金额

  [key: string]: unknown
}

export interface OrgClubJackpotWithdrawResponseData extends OrgClubJackpotWithdrawData {
  [key: string]: unknown
}

export interface OrgClubJackpotWithdrawData {
  [key: string]: unknown
}

// /api/org/club/join/list (OrgClubGetJoinlList)
export interface OrgClubGetJoinlListRequest {
  club_id?: number // 俱乐部id
  limit?: number // 数据数量
  offset?: number // 当前偏移值

  [key: string]: unknown
}

export interface OrgClubGetJoinlListResponseData extends OrgClubGetJoinlListData {
  offset?: number
  [key: string]: unknown
}

// /api/org/club/level_benefit (OrgClubLevelBenefit)
export interface OrgClubLevelBenefitRequest {
  [key: string]: unknown
}

export interface OrgClubLevelBenefitResponseData extends OrgClubLevelBenefitData {
  [key: string]: unknown
}

// /api/org/club/level_cost (OrgClubLevelCost)
export interface OrgClubLevelCostRequest {
  [key: string]: unknown
}

export interface OrgClubLevelCostResponseData {
  [key: string]: unknown
}

// /api/org/club/level_info (OrgClubLevelInfo)
export interface OrgClubLevelInfoRequest {
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface OrgClubLevelInfoResponseData extends OrgClubLevelInfoData {
  [key: string]: unknown
}

// /api/org/club/level_up (OrgClubUpLevel)
export interface OrgClubUpLevelRequest {
  club_id?: number // 俱乐部id
  level?: number // 俱乐部等级

  [key: string]: unknown
}

export interface OrgClubUpLevelResponseData extends OrgClubUpLevelData {
  [key: string]: unknown
}

// /api/org/club/list (OrgClubList)
export interface OrgClubListRequest {
  club_random_ids?: string // 俱乐部随机id "927776,969776" 英文逗号隔开

  [key: string]: unknown
}

export interface OrgClubListResponseData extends OrgClubListData {
  [key: string]: unknown
}

export interface OrgClubListData {
  [key: string]: unknown
}

export interface OrgClubListClubData {
  club_name?: string // 俱乐部名称
  logo?: string // 俱乐部图标

  [key: string]: unknown
}

// /api/org/club/master/slave_club/list (OrgClubMasterSlaveClubList)
export interface OrgClubMasterSlaveClubListRequest {
  search?: string // 搜索内容id或名称
  sort_type?: number // 1-输赢数;2-手数;3-服务费;4-最后登陆时间; 5-钱包金币 6 保险
  order_type?: number // 1-顺序;2-倒叙;
  limit?: number // 最大条数
  offset?: number // 开始下标
  filter_type?: number // 1联盟币 2 usdt 3 记分牌
  club_id?: number

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubListResponseData extends OrgClubMasterSlaveClubListData {
  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubListData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总条数
  total_info?: OrgClubMasterSlaveClubListTotalInfo
  data?: OrgClubMasterSlaveClubListRecord[]

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubListRecord {
  club_id?: number // 俱乐部ID
  club_name?: string // 俱乐部名称
  logo?: string // 俱乐部图标
  random_id?: number // 俱乐部随机ID
  club_members?: number // 俱乐部人数
  master_service_ratio?: number // 主俱乐部占俱乐部抽水分成的比例150; 150/1000=15%=0.15
  master_insur_ratio?: number // 主俱乐部占俱乐部保险分成的比例150
  master_mtt_ratio?: number // 主俱乐部占俱乐部mtt服务费分成的比例150
  master_jackpot_ratio?: number // 主俱乐部占俱乐部jackpot服务费分成的
  remark_name?: string // 备注名称
  profit_total?: number // 抽水
  club_gold?: number // 基金
  user_gold?: number // 成员余额
  remark_desc?: string // 备注描述
  slave_create_time?: string // 绑定时间
  club_subscription_id?: number // 俱乐部会员id

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubListTotalInfo {
  member_total?: number // 总成员数
  profit_total?: number // 服务费分成
  total_gold?: number // UC总额

  [key: string]: unknown
}

// /api/org/club/master/slave_club/ratio (OrgClubMasterSlaveClubRatio)
export interface OrgClubMasterSlaveClubRatioRequest {
  slave_club_id?: number // 从俱乐部id
  master_service_ratio?: number // 主俱乐部占公会抽水分成的比例150; 150/1000=15%=0.15
  master_insur_ratio?: number // 保险
  master_mtt_ratio?: number // MTT
  master_jackpot_ratio?: number // jackpot

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubRatioResponseData {
  [key: string]: unknown
}

// /api/org/club/master/slave_club/remark (OrgClubMasterSlaveClubRemark)
export interface OrgClubMasterSlaveClubRemarkRequest {
  slave_club_id?: number // 从俱乐部id
  remark_name?: string // 备注名称
  remark_desc?: string // 俱乐部描述

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubRemarkResponseData {
  [key: string]: unknown
}

// /api/org/club/member/list (OrgMemberList)
export interface OrgMemberListRequest {
  //     club_id: null;
  //
  club_random_id?: number // 俱乐部随机id
  search?: string // 搜索内容id或名称
  user_type?: number // 0-所有;1-普通;3-管理员;4-代理
  sort_type?: number // 1-输赢数;2-手数;3-服务费;4-最后登陆时间;5-钱包金币;6-保险；7-返水比例;8-按照 创始人、老板号、管理、代理、普通成员排序;
  order_type?: number // 1-顺序;2-倒叙;
  limit?: number // /最大条数
  offset?: number // 开始下标
  gold_type?: number // 0-未知，1-联盟币 2-USDT
  filter_type?: number // 1联盟币 2 usdt 3 记分牌
  agent_id?: number // 代理id
  simple?: boolean // 是否简版
  hide_slave?: boolean // 是否隐藏从属俱乐部成员

  [key: string]: unknown
}

export interface OrgMemberListResponseData extends OrgMemberListData {
  [key: string]: unknown
}

// /api/org/club/member/ordinary_list (OrgClubMember)
export interface OrgClubMemberRequest {
  //     club_random_id: number,  //
  //
  [key: string]: unknown
}

export interface OrgClubMemberResponseData {
  [key: string]: unknown
}

// /api/org/club/member/rake_back (OrgClubMemberRakeBack)
export interface OrgClubMemberRakeBackRequest {
  gold_type?: number // 1-UC;2-GC;
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  sort_type?: number // 1-输赢数;2-手数;3-服务费;4-最后登陆时间; 5-钱包金币 6 保险
  order_type?: number // 1-顺序;2-倒叙;
  start_time?: number // 开始时间戳
  end_time?: number // 结束时间戳

  [key: string]: unknown
}

export interface OrgClubMemberRakeBackResponseData extends OrgClubMemberRakeBackData {
  [key: string]: unknown
}

export interface OrgClubMemberRakeBackData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总条数
  data?: OrgClubMemberRakeBackWallet[]
  total_info?: OrgClubMemberRakeBackTotalInfo

  [key: string]: unknown
}

export interface OrgClubMemberRakeBackTotalInfo {
  rake_back_all?: number // 全部
  rake_back_payed?: number // 已发放
  rake_back_unpay?: number // 未发放

  [key: string]: unknown
}

export interface OrgClubMemberRakeBackWallet {
  random_num?: number // 成员random id
  nick_name?: string // 名称
  remark_name?: string // 备注名称
  total_room_game_results?: number // 输赢数
  total_service_profit?: number // 服务费
  freeze_status?: number // 0 正常；1 平台冻结；2 联盟拉黑；3 俱乐部冻结
  user_service_ratio?: number // 普通返水比例
  user_mtt_ratio?: number // MTT返水比例
  rb?: number // 返水金额
  club_name?: string // 俱乐部名称
  club_remark_name?: string // 俱乐部备注名称
  club_remark_color?: string // 俱乐部备注颜色
  rb_type?: number // 返水类型
  rb_interval_type?: number // 返水类型
  rb_interval_no?: number // 返水间隔
  unpay_rb?: number // 未发放返水
  payed_rb?: number // 已发放返水

  [key: string]: unknown
}

// /api/org/club/modify/club_desc (OrgClubModifyClubDesc)
export interface OrgClubModifyClubDescRequest {
  club_id?: number // 俱乐部id
  desc?: string // 描述

  [key: string]: unknown
}

export interface OrgClubModifyClubDescResponseData extends OrgClubModifyClubDescData {
  [key: string]: unknown
}

export interface OrgClubModifyClubDescData {
  [key: string]: unknown
}

// /api/org/club/modify/club_info (OrgChangeClubData)
export interface OrgChangeClubDataRequest {
  club_id?: number // 俱乐部id
  club_name?: string // 俱乐部名称
  desc?: string // 简介
  logo?: string // 头像
  more_contact?: string // 联系方式
  search_switch?: number // 允许他人搜索到俱乐部(search_switch):1-开;2-关
  auto_audit_switch?: number // 入会无需审批(auto_audit_switch):1-开;2-关
  show_contact_switch?: number // 向玩家展示俱乐部联系方式(show_contact_switch):1-开;2-关
  show_notice_switch?: number // 弹窗通知(show_notice_switch):1-开;2-关
  digital_wallet_switch?: number // 数字钱包开关1-开;2-关
  area_id?: string // 地区
  welcomes_switch?: number // 欢迎语开关
  welcomes?: string // 欢迎语
  banner?: string // banner
  prologue?: string // 开场白
  prologue_switch?: number // 开场白 1开 2关

  [key: string]: unknown
}

export interface OrgChangeClubDataResponseData extends OrgChangeClubDataData {
  [key: string]: unknown
}

// /api/org/club/modify/digital_wallet_address (ModifyDigitalWalletAddress)
export interface ModifyDigitalWalletAddressRequest {
  club_id?: number // 俱乐部id
  digital_wallet_erc?: string
  digital_wallet_trc?: string

  [key: string]: unknown
}

export interface ModifyDigitalWalletAddressResponseData extends ModifyDigitalWalletAddressData {
  [key: string]: unknown
}

// /api/org/club/my_create_clubs (OrgClubMyCreateClubs)
export interface OrgClubMyCreateClubsRequest {
  club_random_id?: number // 俱乐部随机id

  [key: string]: unknown
}

export interface OrgClubMyCreateClubsResponseData extends OrgClubMyCreateClubsData {
  [key: string]: unknown
}

export interface OrgClubMyCreateClubsData {
  list?: OrgClubMyCreateClubsInfo[]

  [key: string]: unknown
}

export interface OrgClubMyCreateClubsInfo {
  club_logo?: string // 俱乐部图标
  club_id?: number // 俱乐部id
  random_id?: number // 俱乐部random id
  club_name?: string // 俱乐部名称
  pretty_id?: number // 靓号 >1则是靓号 =0不是靓号

  [key: string]: unknown
}

// /api/org/club/role_change (OrgClubUserRoleChange)
export interface OrgClubUserRoleChangeRequest {
  club_id?: number // 俱乐部id
  user_id?: number // 成员id
  user_level?: number // 用户等级

  [key: string]: unknown
}

export interface OrgClubUserRoleChangeResponseData extends OrgClubUserRoleChangeData {
  [key: string]: unknown
}

// /api/org/club/search_info (OrgClubSearchInfo)
export interface OrgClubSearchInfoRequest {
  club_random_id?: number // 俱乐部随机id

  [key: string]: unknown
}

export interface OrgClubSearchInfoResponseData extends OrgClubSearchInfoData {
  [key: string]: unknown
}

export interface OrgClubSearchInfoData {
  club_id?: number // 俱乐部id
  club_name?: string // 俱乐部名称
  logo?: string // 俱乐部头像
  random_id?: number // 俱乐部随机id
  club_members?: number // 俱乐部成员人数
  user_status?: number // 请求用户状态 1 未申请 2 已申请 3 已加入
  pretty_id?: number // 靓号 >0则是靓号 =0不是靓号
  club_subscription_id?: number // 会员id

  [key: string]: unknown
}

// /api/org/club/set/time_zone (OrgClubSetTimeZone)
export interface OrgClubSetTimeZoneRequest {
  time_zone?: number // 时区

  [key: string]: unknown
}

export interface OrgClubSetTimeZoneResponseData {
  [key: string]: unknown
}

// /api/org/club/set/user/uc_advance (OrgClubSetUserUcadvaNce)
export interface OrgClubSetUserUcadvaNceRequest {
  user_id?: number // 用户id
  status?: number // UC垫付 1 开启； 2 关闭

  [key: string]: unknown
}

export interface OrgClubSetUserUcadvaNceResponseData extends OrgClubSetUserUcadvaNceData {
  [key: string]: unknown
}

export interface OrgClubSetUserUcadvaNceData {
  [key: string]: unknown
}

// /api/org/club/subscription/buy (OrgClubSubscrIptionBuy)
export interface OrgClubSubscrIptionBuyRequest {
  subscription_id?: number // 会员id
  price_type?: number // 价格类型 0-永久会员;1-月会员;2-季度会员;3-半年会员;4-年度会员

  [key: string]: unknown
}

export interface OrgClubSubscrIptionBuyResponseData extends OrgClubSubscrIptionBuyData {
  [key: string]: unknown
}

export interface OrgClubSubscrIptionBuyData {
  [key: string]: unknown
}

// /api/org/club/subscription/list (OrgClubSubscrIptionList)
export interface OrgClubSubscrIptionListRequest {
  subscription_id?: number // 会员id
  subscription_status?: number // 会员上下架 0-全部 1-上架 2-下架
  equity_comparison?: number // 权益比较

  [key: string]: unknown
}

export interface OrgClubSubscrIptionListResponseData extends OrgClubSubscrIptionListData {
  [key: string]: unknown
}

export interface OrgClubSubscrIptionListData {
  list?: OrgClubSubscrIptionListVIPEquityData[]

  [key: string]: unknown
}

export interface OrgClubSubscrIptionListVIPEquityData {
  id?: number // 会员id
  name?: string // 会员名称
  logo?: string // 会员图标
  price_configs?: OrgClubSubscrIptionListPriceConfigs[] // 价格配置
  subscription_type?: number // 会员类型 0 正常类型；1 基础会员
  status?: number // 会员状态 1上架 2.下架
  equity_comparison?: number // 权益对比 1.开启 2.关闭
  top_club_level?: number // 最高可购买俱乐部等级
  max_slave_club_num?: number // 名下从俱乐部数量
  max_club_agent_num?: number // 名下可发展代理数量
  max_share_table_num?: number // 共享牌桌可使用数量
  max_table_template_num?: number // 牌桌模版可使用数量
  create_max_table_num?: number // 可同时创建牌桌数量
  im_service_permission?: number // 持IM沟通客服权限
  timing_download_permission?: number // 持IM沟通客服权限
  manager_patrol_table_permission?: number // 管理员寻桌权限
  welcome_message_permission?: number // 欢迎语权限
  pop_window_permission?: number // 弹窗权限
  photo_announce_permission?: number // 图片公告权限
  join_club_auto_audit_permission?: number // 入会免审核权限
  free_anti_cheating_audio?: number // 防作弊语音免费时间
  free_anti_cheating_video?: number // 防作弊视频免费时间
  free_anti_cheating_face?: number // 防作弊人脸免费次数
  free_up_table_num?: number // 免费上桌玩家和观众次数
  game_limit_ip_permission?: number // 游戏限制IP权限
  game_limit_gps_permission?: number // 游戏限制GPS权限
  game_limit_safe_permission?: number // 游戏限制Safe权限
  self_game_permission?: number // 私人游戏权限
  aof_permission?: number // AOF权限
  auto_shut_table_permission?: number // 空桌自动关闭权限
  straddle_permission?: number // straddle强抓权限
  second_public_card_permission?: number // 二套牌权限
  insurance_permission?: number // 保险权限

  [key: string]: unknown
}

export interface OrgClubSubscrIptionListPriceConfigs {
  price_type?: number // 0.永久 1.30天（月） 2.90天（季） 3.180天（半年） 4.365天（年）
  raw_price?: number // 原始价格
  pay_price?: number // 实付价格

  [key: string]: unknown
}

// /api/org/club/user_club (OrgClubGet)
export interface OrgClubGetRequest {
  //
  sort_type?: number // 排序类型：1-创建时间；2-成员数；3-等级; 4-创建分
  order_type?: number // 排序方式：1-顺序；2-倒序
  club_ids?: number[] // 指定俱乐部 用于合并接口

  [key: string]: unknown
}

export type OrgClubGetResponseData = OrgClubData[]

// /api/org/club/user/add_agent (ClubAgentAdd)
export interface ClubAgentAddRequest {
  club_id?: number // 俱乐部id
  user_id?: number // 用户id
  agent_id?: number // 代理id

  [key: string]: unknown
}

export interface ClubAgentAddResponseData extends ClubAgentAddData {
  [key: string]: unknown
}

// /api/org/club/user/admin/has (GuildAdminHas)
export interface GuildAdminHasRequest {
  club_id?: number // 申请ID

  [key: string]: unknown
}

export type GuildAdminHasResponseData = boolean

// /api/org/club/user/del_agent (ClubAgentDel)
export interface ClubAgentDelRequest {
  club_id?: number // 俱乐部id
  user_id?: number // 成员id
  agent_id?: number // 代理id

  [key: string]: unknown
}

export interface ClubAgentDelResponseData extends ClubAgentDelData {
  [key: string]: unknown
}

// /api/org/club/user/info (OrgClubUserInfo)
export interface OrgClubUserInfoRequest {
  club_id?: number // 俱乐部id
  user_id?: number
  user_random_id?: number // 玩家随机Id
  slave_club_id?: number // 从俱乐部id

  [key: string]: unknown
}

export interface OrgClubUserInfoResponseData extends OrgClubUserInfoData {
  [key: string]: unknown
}

// /api/org/club/user/join/apply (OrgClubJoin)
export interface OrgClubJoinRequest {
  club_id: number // 俱乐部ID
}

export interface OrgClubJoinResponseData extends OrgClubJoinData {
  [key: string]: unknown
}

// /api/org/club/user/join/audit (OrgClubApproValJoin)
export interface OrgClubApproValJoinRequest {
  //     "apply_id": ''
  //     "audit_op": ''
  //
  apply_id?: number // 申请id
  audit_op?: number // 2同意 3不同意

  [key: string]: unknown
}

export interface OrgClubApproValJoinResponseData extends OrgClubApproValJoinData {
  [key: string]: unknown
}

// /api/org/club/user/join/cancel (OrgClubCancleJoinClub)
export interface OrgClubCancleJoinClubRequest {
  //     apply_id: null;
  //
  [key: string]: unknown
}

export interface OrgClubCancleJoinClubResponseData extends OrgClubCancleJoinClubData {
  [key: string]: unknown
}

// /api/org/club/user/join/list (OrgClubPlayerApplyList)
export interface OrgClubPlayerApplyListRequest {
  limit?: number // 数据数量
  offset?: number // 当前偏移值

  [key: string]: unknown
}

export interface OrgClubPlayerApplyListResponseData extends OrgClubPlayerApplyListData {
  [key: string]: unknown
}

// /api/org/club/user/join/list (ClubJoinList)
export interface ClubJoinListRequest {
  //     "limit": number,
  //     "offset": number
  //
  limit?: number // 数据数量
  offset?: number // 当前偏移值

  [key: string]: unknown
}

export interface ClubJoinListResponseData extends ClubJoinListData {
  [key: string]: unknown
}

// /api/org/club/user/page/active (OrgClubUserPageActive)
export interface OrgClubUserPageActiveRequest {
  [key: string]: unknown
}

export interface OrgClubUserPageActiveResponseData {
  [key: string]: unknown
}

// /api/org/club/user/quit (OrgClubQuit)
export interface OrgClubQuitRequest {
  //     club_id: null;
  //
  [key: string]: unknown
}

export interface OrgClubQuitResponseData extends OrgClubQuitData {
  [key: string]: unknown
}

// /api/org/club/user/quit/log (ClubQuitList)
export interface ClubQuitListRequest {
  //     "limit": number,
  //     "offset": number
  //
  [key: string]: unknown
}

export interface ClubQuitListResponseData {
  [key: string]: unknown
}

// /api/org/club/user/update (OrgClubUserRemaRks)
export interface OrgClubUserRemaRksRequest {
  club_id?: number // 俱乐部id
  user_id?: number // 成员id
  remark_name?: string // 备注名称
  remark_desc?: string // 备注描述
  tag_id?: number // 标签id
  tag_custom?: string // 自定义标签

  [key: string]: unknown
}

export interface OrgClubUserRemaRksResponseData {
  [key: string]: unknown
}

// /api/org/club/user/wallet/relation/grant (OrgClubUserWalletRelationGrant)
export interface OrgClubUserWalletRelationGrantRequest {
  user_ids?: number[] // 赠送用户id列表
  amount?: number // 金额
  gold_type?: number // 币种1.UC 2.GC

  [key: string]: unknown
}

export interface OrgClubUserWalletRelationGrantResponseData {
  [key: string]: unknown
}

export interface OrgClubUserWalletRelationGrantData {
  [key: string]: unknown
}

// /api/org/club/user/wallet/relation/list (OrgClubUserWalletRelationList)
export interface OrgClubUserWalletRelationListRequest {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  club_id?: number // 俱乐部ID

  [key: string]: unknown
}

export interface OrgClubUserWalletRelationListResponseData extends OrgClubUserWalletRelationListData {
  [key: string]: unknown
}

export interface OrgClubUserWalletRelationListData {
  data?: OrgClubUserWalletRelationListUserData[]

  [key: string]: unknown
}

export interface OrgClubUserWalletRelationListUserData {
  nickname: string // 用户昵称
  user_id: number // 用户ID
  random_id: number // 用户随机ID
  avatar: string // 用户头像
}

// /api/org/jackpot/template/info (OrgJackpotTemplateInfo)
export interface OrgJackpotTemplateInfoRequest {
  jackpot_id?: number // jackpot id

  [key: string]: unknown
}

export interface OrgJackpotTemplateInfoResponseData extends OrgJackpotTemplateInfoData {
  [key: string]: unknown
}

export interface OrgJackpotTemplateInfoCombineData {
  total?: number // 数量
  items?: unknown[] // 模版数据

  [key: string]: unknown
}

export interface OrgJackpotTemplateInfoData {
  item?: unknown

  [key: string]: unknown
}

// /api/org/tribe/apply_list (OrgTribeApplyList)
export interface OrgTribeApplyListRequest {
  limit?: number // 数据数量
  offset?: number // 当前偏移值

  [key: string]: unknown
}

export interface OrgTribeApplyListResponseData extends OrgTribeApplyListData {
  [key: string]: unknown
}

export interface OrgTribeApplyListData {
  offset?: number // 当前偏移值
  total?: number // 总条目数
  list?: OrgTribeApplyListClubInfo[] // 俱乐部信息列表

  [key: string]: unknown
}

export interface OrgTribeApplyListClubInfo {
  id?: number // 申请id
  club_name?: string // 俱乐部名称
  club_random_id?: number // 俱乐部id
  tribe_name?: string // 联盟名称
  club_logo?: string // 联盟图标
  tribe_random_id?: number // 联盟id
  club_subscription_id?: number // 俱乐部会员id

  [key: string]: unknown
}

// /api/org/tribe/apply_upgrade (OrgTribeApplyUpgrAde)
export interface OrgTribeApplyUpgrAdeRequest {
  tribe_phone_area?: string // 区号
  tribe_phone?: string // 号码

  [key: string]: unknown
}

export interface OrgTribeApplyUpgrAdeResponseData extends OrgTribeApplyUpgrAdeData {
  [key: string]: unknown
}

export interface OrgTribeApplyUpgrAdeData {
  [key: string]: unknown
}

// /api/org/tribe/audit/apply (OrgTribeAuditApply)
export interface OrgTribeAuditApplyRequest {
  id?: number // 申请ID
  audit_op?: number // 审核操作（1-通过; 2-拒绝）
  description?: string // 备注

  [key: string]: unknown
}

export interface OrgTribeAuditApplyResponseData extends OrgTribeAuditApplyData {
  [key: string]: unknown
}

export interface OrgTribeAuditApplyData {
  [key: string]: unknown
}

// /api/org/tribe/black/user/list (OrgTribeBlackUserList)
export interface OrgTribeBlackUserListRequest {
  offset?: number // 开始下标
  limit?: number // 条目数
  tribe_id?: number // 联盟ID
  club_id?: number // 俱乐部ID

  [key: string]: unknown
}

export interface OrgTribeBlackUserListResponseData extends OrgTribeBlackUserListData {
  [key: string]: unknown
}

export interface OrgTribeBlackUserListData {
  offset?: number // 开始下标
  total?: number // 总数
  data?: OrgTribeBlackUserListInfo[] // 数据列表

  [key: string]: unknown
}

export interface OrgTribeBlackUserListInfo {
  id?: number // id
  create_time?: string // 创建时间，必需
  public_reason?: string // 拉黑原因，必需
  user_random_id?: number // 玩家 random id，必需
  user_name?: string // 玩家名，必需
  user_avatar?: string // 玩家头像

  [key: string]: unknown
}

// /api/org/tribe/check_upgrade (OrgTribeCheckUpgrAde)
export interface OrgTribeCheckUpgrAdeRequest {
  [key: string]: unknown
}

export interface OrgTribeCheckUpgrAdeResponseData extends OrgTribeCheckUpgrAdeData {
  [key: string]: unknown
}

export interface OrgTribeCheckUpgrAdeData {
  config?: OrgTribeCheckUpgrAdeConfig // 配置信息
  check_club_count?: number // 俱乐部数量是否满足（0-不满足; 1-满足）
  check_member_count?: number // 成员数量是否满足（0-不满足; 1-满足）
  check_room_count?: number // 开桌数量是否满足（0-不满足; 1-满足）
  tribe_phone_area?: string // 升级提交的电话区号
  tribe_phone?: string // 升级提交的电话号码
  tribe_phone_create_time?: string // 升级提交的时间

  [key: string]: unknown
}

export interface OrgTribeCheckUpgrAdeConfig {
  upgrade_switch?: number // 升级条件开关（1-开启; 2-关闭）
  club_count?: number // 俱乐部数量
  member_count?: number // 成员数量
  day_count?: number // 统计天数
  room_count?: number // 每日开桌数量
  hand_count?: number // 每日一桌最大手数

  [key: string]: unknown
}

// /api/org/tribe/club/fund/gold_change/log (OrgTribeClubFundGoldChangeLog)
export interface OrgTribeClubFundGoldChangeLogRequest {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  club_id?: number // 俱乐部ID
  gold_type?: number // 金币类型（1-联盟币; 2-USDT; 3-记分牌）
  op_codes?: string[] // 操作类型列表
  start_time?: number // 开始时间戳
  end_time?: number // 结束时间戳
  sort_type?: number // 排序类型
  order_type?: number // 排序顺序

  [key: string]: unknown
}

export interface OrgTribeClubFundGoldChangeLogResponseData extends OrgTribeClubFundGoldChangeLogData {
  [key: string]: unknown
}

export interface OrgTribeClubFundGoldChangeLogData {
  offset?: number
  list?: OrgTribeClubFundGoldChangeLogRecord[]
  total_info?: OrgTribeClubFundGoldChangeLogTotalInfo // 金额统计

  [key: string]: unknown
}

export interface OrgTribeClubFundGoldChangeLogTotalInfo {
  grant_amount?: number // 发放总额
  recover_amount?: number // 回收总额
  profit_amount?: number // 分润总额
  change_amount?: number // 变动总额

  [key: string]: unknown
}

export interface OrgTribeClubFundGoldChangeLogRecord {
  gold_change?: number // 金币变化量
  gold_after?: number // 变化后金币余额
  create_time?: string // 创建时间
  op_code?: string // 操作代码
  name?: string // 名称
  user_random_num?: number // 用户随机编号
  user_nick_name?: string // 用户昵称
  src_room_id?: number // 来源房间ID
  src_match_id?: number // 来源比赛ID
  admin_nick_name?: string // 管理员昵称
  multi_lang_names_obj?: unknown // 多语言名称对象

  [key: string]: unknown
}

// /api/org/tribe/club/join/apply (OrgJoinTrip)
export interface OrgJoinTripRequest {
  club_id?: number // 俱乐部ID
  tribe_random_id?: number // 联盟ID（随机ID）
  contact?: string // 联系方式

  [key: string]: unknown
}

export interface OrgJoinTripResponseData extends OrgJoinTripData {
  [key: string]: unknown
}

// /api/org/tribe/club/join/apply_list (OrgClubApplyTribeList)
export interface OrgClubApplyTribeListRequest {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  club_id?: number // 俱乐部ID

  [key: string]: unknown
}

export interface OrgClubApplyTribeListResponseData extends OrgClubApplyTribeListData {
  [key: string]: unknown
}

// /api/org/tribe/club/join/cancel_apply (OrgClubCancleJoinTribe)
export interface OrgClubCancleJoinTribeRequest {
  apply_id?: number // 取消申请ID

  [key: string]: unknown
}

export interface OrgClubCancleJoinTribeResponseData extends OrgClubCancleJoinTribeData {
  [key: string]: unknown
}

// /api/org/tribe/club/kickout (OrgTribeClubKickOut)
export interface OrgTribeClubKickOutRequest {
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface OrgTribeClubKickOutResponseData extends OrgTribeClubKickOutData {
  [key: string]: unknown
}

export interface OrgTribeClubKickOutData {
  [key: string]: unknown
}

// /api/org/tribe/club/list (OrgTribeClubList)
export interface OrgTribeClubListRequest {
  search?: string // 搜索内容名称
  sort_type?: number // 排序类型：1-成员数;2-俱乐部基金;3-成员余额;4-服务费
  order_type?: number // 排序方式：1-顺序;2-倒叙
  limit?: number // 最大条数
  offset?: number // 开始下标
  filter_type?: number // 筛选类型：1 联盟币 2 USDT 3 记分牌 4 钻石

  [key: string]: unknown
}

export interface OrgTribeClubListResponseData extends OrgTribeClubListData {
  [key: string]: unknown
}

export interface OrgTribeClubListData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总条数
  total_info?: OrgTribeClubListTotalInfo
  data?: OrgTribeClubListRecord[]

  [key: string]: unknown
}

export interface OrgTribeClubListRecord {
  club_id?: number // 俱乐部ID
  club_name?: string // 俱乐部名称
  logo?: string // 俱乐部图标
  random_id?: number // 俱乐部随机ID
  club_members?: number // 俱乐部人数
  club_status?: number // 俱乐部状态 1-正常 2-冻结
  room_game_ratio?: number // 服务费分润比例 0-1000; 150/1000=15%=0.15
  room_insur_ratio?: number // 保险分成比例
  room_mtt_ratio?: number // MTT服务费分成比例
  jackpot_ratio?: number // 奖池分成比例
  profit_total?: number // 抽水
  club_gold?: number // 俱乐部钱包金币
  user_gold?: number // 成员余额
  tribe_create_time?: string // 联盟创建时间
  club_subscription_id?: number // 俱乐部会员id

  [key: string]: unknown
}

export interface OrgTribeClubListTotalInfo {
  member_total?: number // 总成员数
  profit_total?: number // 服务费分成
  total_gold?: number // UC总额

  [key: string]: unknown
}

// /api/org/tribe/club/list/all (OrgTribeClubListAll)
export interface OrgTribeClubListAllRequest {
  [key: string]: unknown
}

export interface OrgTribeClubListAllResponseData extends OrgTribeClubListAllData {
  [key: string]: unknown
}

export interface OrgTribeClubListAllData {
  data?: OrgTribeClubListAllRecord[] // 俱乐部记录列表

  [key: string]: unknown
}

export interface OrgTribeClubListAllRecord {
  club_id?: number // 俱乐部ID
  club_name?: string // 俱乐部名称

  [key: string]: unknown
}

// /api/org/tribe/club/lock (OrgTribeClubLock)
export interface OrgTribeClubLockRequest {
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface OrgTribeClubLockResponseData extends OrgTribeClubLockData {
  [key: string]: unknown
}

export interface OrgTribeClubLockData {
  [key: string]: unknown
}

// /api/org/tribe/club/remark (OrgTribeClubRemark)
export interface OrgTribeClubRemarkRequest {
  club_id?: number // 俱乐部ID
  remark_name?: string // 备注名称
  remark_desc?: string // 备注描述

  [key: string]: unknown
}

export interface OrgTribeClubRemarkResponseData {
  [key: string]: unknown
}

// /api/org/tribe/club/remark/list (OrgTribeClubRemarkList)
export interface OrgTribeClubRemarkListRequest {
  [key: string]: unknown
}

export interface OrgTribeClubRemarkListResponseData extends OrgTribeClubRemarkListData {
  [key: string]: unknown
}

export interface OrgTribeClubRemarkListData {
  list?: OrgTribeClubRemarkListInfo[]

  [key: string]: unknown
}

export interface OrgTribeClubRemarkListInfo {
  club_id?: number // 俱乐部ID
  remark_name?: string // 备注名称
  remark_desc?: string // 备注描述

  [key: string]: unknown
}

// /api/org/tribe/club/unlock (OrgTribeClubUnlock)
export interface OrgTribeClubUnlockRequest {
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface OrgTribeClubUnlockResponseData extends OrgTribeClubUnlockData {
  [key: string]: unknown
}

export interface OrgTribeClubUnlockData {
  [key: string]: unknown
}

// /api/org/tribe/create (OrgTribeCreate)
export interface OrgTribeCreateRequest {
  tribe_name?: string // 联盟名称
  logo?: string // 联盟头像
  currency?: string // 联盟货币代码

  [key: string]: unknown
}

export interface OrgTribeCreateResponseData extends OrgTribeCreateData {
  [key: string]: unknown
}

export interface OrgTribeCreateData {
  [key: string]: unknown
}

// /api/org/tribe/create/is_first (OrgTribeCreateIsFirst)
export interface OrgTribeCreateIsFirstRequest {
  [key: string]: unknown
}

export interface OrgTribeCreateIsFirstResponseData extends OrgTribeCreateIsFirstData {
  [key: string]: unknown
}

export interface OrgTribeCreateIsFirstData {
  is_first?: number // 是否首次申请：0 不是；1 是

  [key: string]: unknown
}

// /api/org/tribe/fund/gold_change/log (OrgTribeFundGoldChangeLog)
export interface OrgTribeFundGoldChangeLogRequest {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  gold_type?: number // 金币类型（1-联盟币; 2-USDT）
  op_codes?: string[] // 操作类型列表
  start_time?: number // 开始时间戳
  end_time?: number // 结束时间戳
  sort_type?: number // 排序类型
  order_type?: number // 排序顺序

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogResponseData extends OrgTribeFundGoldChangeLogData {
  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总条目数
  list?: OrgTribeFundGoldChangeLogRecord[] // 交易记录列表
  total_info?: OrgTribeFundGoldChangeLogTotalInfo // 统计信息
  diamond_info?: OrgTribeFundGoldChangeLogDiamondinfo // 钻石信息
  ratio_info?: OrgTribeFundGoldChangeLogRatioInfo // 比例信息
  random_id?: number // 随机ID

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogDiamondinfo {
  consume_amount?: number // 花费
  trans_to_tribe_amount?: number // 个人钱包转入联盟
  trans_to_user_amount?: number // 盟转入个人钱包

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogTotalInfo {
  grant_amount?: number // 发放总额
  recover_amount?: number // 回收总额
  profit_amount?: number // 分润总额

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogRatioInfo {
  service_ratio?: number // 服务费分润比例(局抽/把抽)
  insur_ratio?: number // 保险分润比例

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogRecord {
  gold_change?: number // 金额变化
  gold_after?: number // 剩余金额
  create_time?: string // 创建时间
  op_code?: string // 操作类型
  name?: string // 名称
  club_name?: string // 俱乐部名称
  club_random_num?: number // 俱乐部随机编号
  user_random_num?: number // 用户随机编号
  user_nick_name?: string // 用户昵称
  src_room_id?: number // 来源房间ID
  src_match_id?: number // 来源房间ID

  [key: string]: unknown
}

// /api/org/tribe/info (OrgTribeSearchById)
export interface OrgTribeSearchByIdRequest {
  tribe_random_id?: number // 联盟随机id

  [key: string]: unknown
}

export interface OrgTribeSearchByIdResponseData extends OrgTribeSearchByIdData {
  [key: string]: unknown
}

// /api/org/tribe/info_by_club (OrgTribeInfoByClub)
export interface OrgTribeInfoByClubRequest {
  tribe_random_id?: number // 联盟随机ID
  club_id?: number // 俱乐部ID

  [key: string]: unknown
}

export interface OrgTribeInfoByClubResponseData extends OrgTribeInfoByClubData {
  [key: string]: unknown
}

export interface OrgTribeInfoByClubData {
  tribe_base?: OrgTribeInfoByClubInfo // 联盟基本信息
  club_relation?: number // 俱乐部关系状态（1-未申请; 2-已申请; 3-已加入）

  [key: string]: unknown
}

export interface OrgTribeInfoByClubInfo {
  name?: string // 联盟名称
  random_id?: number // 联盟随机ID
  logo?: string // 联盟头像

  [key: string]: unknown
}

// /api/org/tribe/list (OrgTribeList)
export interface OrgTribeListRequest {
  tribe_random_id?: number // 联盟随机ID
  sort_type?: number // 排序类型（1-创建时间; 2-成员数; 3-等级）
  order_type?: number // 排序顺序（1-顺序; 2-倒序）

  [key: string]: unknown
}

export interface OrgTribeListResponseData extends OrgTribeListData {
  [key: string]: unknown
}

export interface OrgTribeListData {
  list?: OrgTribeListCommunityData[]

  [key: string]: unknown
}

export interface OrgTribeListCommunityData {
  id?: number // 对战社区ID
  random_id?: number // 随机ID
  name?: string // 对战社区名称
  logo?: string // 对战社区头像
  pretty_id?: number // 靓号（大于0表示靓号; 等于0表示非靓号）
  members?: number // 对战社区内玩家数量
  room_count?: number // 对战社区内桌子数量

  [key: string]: unknown
}

// /api/org/tribe/room_permissions (OrgTribeRoomPermissionS)
export interface OrgTribeRoomPermissionSRequest {
  club_id?: number // 俱乐部ID
  tribe_id?: number // 联盟ID

  [key: string]: unknown
}

export interface OrgTribeRoomPermissionSResponseData extends OrgTribeRoomPermissionSData {
  [key: string]: unknown
}

export interface OrgTribeRoomPermissionSData {
  room_permissions?: unknown

  [key: string]: unknown
}

// /api/org/tribe/set/time_zone (OrgTribeSetTimeZone)
export interface OrgTribeSetTimeZoneRequest {
  time_zone?: number // 时区

  [key: string]: unknown
}

export interface OrgTribeSetTimeZoneResponseData {
  [key: string]: unknown
}

// /api/org/tribe/setting/club_profit_ratio (OrgTribeSettIngClubProfitRatio)
export interface OrgTribeSettIngClubProfitRatioRequest {
  club_id?: number // 俱乐部ID
  room_game_ratio?: number // 服务费分润比例 (房间)
  room_insur_ratio?: number // 保险分润比例
  room_mtt_ratio?: number // MTT服务费分润比例

  [key: string]: unknown
}

export interface OrgTribeSettIngClubProfitRatioResponseData {
  [key: string]: unknown
}

// /api/org/tribe/wallet (OrgTribeWallet)
export interface OrgTribeWalletRequest {
  [key: string]: unknown
}

export interface OrgTribeWalletResponseData extends OrgTribeWalletData {
  [key: string]: unknown
}

export interface OrgTribeWalletData {
  gold?: number // UC 金额
  gold_lock?: number // UC 锁定金额
  forbidden?: boolean // 是否冻结
  usdt?: number // USDT 金额
  usdt_lock?: number // USDT 锁定金额
  diamonds?: number // 钻石金额
  diamonds_lock?: number // 钻石锁定金额
  random_id?: number // 联盟随机ID

  [key: string]: unknown
}

// /api/org/user/admin/favorite (OrgUserAdminFavorIte)
export interface OrgUserAdminFavorIteRequest {
  club_id?: number // 俱乐部ID
  tribe_id?: number // 联盟ID
  favorite?: number // 收藏操作（1-添加收藏; 2-取消收藏）

  [key: string]: unknown
}

export interface OrgUserAdminFavorIteResponseData extends OrgUserAdminFavorIteData {
  [key: string]: unknown
}

export interface OrgUserAdminFavorIteData {
  [key: string]: unknown
}

// /api/org/user/check/org (OrgUserCheckOrg)
export interface OrgUserCheckOrgRequest {
  club_id?: number // 绝了不Id
  tribe_id?: number // 联盟Id

  [key: string]: unknown
}

export interface OrgUserCheckOrgResponseData extends OrgUserCheckOrgData {
  [key: string]: unknown
}

export interface OrgUserCheckOrgData {
  is_in_club?: boolean // 是否加入了俱乐部
  is_in_tribe?: boolean // 是否加入了联盟

  [key: string]: unknown
}

// /api/org/user/club/admin/list (OrgUserClubAdminList)
export interface OrgUserClubAdminListRequest {
  [key: string]: unknown
}

export interface OrgUserClubAdminListResponseData extends OrgUserClubAdminListData {
  [key: string]: unknown
}

export interface OrgUserClubAdminListData {
  clubs?: OrgUserClubAdminListClubData[] // 俱乐部列表

  [key: string]: unknown
}

export interface OrgUserClubAdminListClubData {
  id?: number // 俱乐部id
  club_name?: string // 俱乐部名称
  logo?: string // 俱乐部头像
  random_id?: number // 俱乐部随机id
  club_members?: number // 俱乐部成员人数
  tribe_id?: number // 联盟id
  tribe_random_id?: number // 联盟随机id
  user_level?: number // 请求用户等级 0=普通 1=会长 2=副会长 3=管理员 4=代理
  favorite?: number // 收藏状态，1=已收藏，2=未收藏

  [key: string]: unknown
}

// /api/org/user/new_label/read (OrgUserNewLabelRead)
export interface OrgUserNewLabelReadRequest {
  tribe_id?: number // 联盟id

  [key: string]: unknown
}

export interface OrgUserNewLabelReadResponseData {
  [key: string]: unknown
}

// /api/org/user/new_label/read/num (OrgUserNewLabelReadNum)
export interface OrgUserNewLabelReadNumRequest {
  tribe_id?: number // 联盟id

  [key: string]: unknown
}

export interface OrgUserNewLabelReadNumResponseData extends OrgUserNewLabelReadNumData {
  [key: string]: unknown
}

export interface OrgUserNewLabelReadNumData {
  user_new_label_num?: unknown // 新功能次数

  [key: string]: unknown
}

// /api/org/user/self_profit/bill_notify/confim (OrgUserSelfProfitBillNotifyConfim)
export interface OrgUserSelfProfitBillNotifyConfimRequest {
  bill_ids?: number[] // 返水账单ID

  [key: string]: unknown
}

export interface OrgUserSelfProfitBillNotifyConfimResponseData {
  [key: string]: unknown
}

// /api/org/user/self_profit/bill_unnotify (OrgUserSelfProfitBillUnnotIfy)
export interface OrgUserSelfProfitBillUnnotIfyRequest {
  [key: string]: unknown
}

export interface OrgUserSelfProfitBillUnnotIfyResponseData extends OrgUserSelfProfitBillUnnotIfyData {
  [key: string]: unknown
}

export interface OrgUserSelfProfitBillUnnotIfyData {
  data?: OrgUserSelfProfitBillUnnotIfyBillData[]

  [key: string]: unknown
}

export interface OrgUserSelfProfitBillUnnotIfyBillData {
  amount?: number // 金额
  bill_id?: number // 返水账单ID

  [key: string]: unknown
}

// /api/org/user/self_profit/unpay_records (OrgUserSelfProfitUnpayRecords)
export interface OrgUserSelfProfitUnpayRecordsRequest {
  [key: string]: unknown
}

export interface OrgUserSelfProfitUnpayRecordsResponseData extends OrgUserSelfProfitUnpayRecordsData {
  [key: string]: unknown
}

export interface OrgUserSelfProfitUnpayRecordsData {
  data?: OrgUserSelfProfitUnpayRecordsRecord[]
  amount_total_uc?: number // UC总计
  latest_pay_time?: number // 最近支付时间戳

  [key: string]: unknown
}

export interface OrgUserSelfProfitUnpayRecordsRecord {
  amount?: number // 金额
  pay_time?: number // 下次支付时间戳
  club_name?: string // 俱乐部名称
  club_rid?: number // 俱乐部RID
  club_logo?: string // 俱乐部图标

  [key: string]: unknown
}

// /api/org/user/tribe/admin/list (OrgUserTribeAdminList)
export interface OrgUserTribeAdminListRequest {
  [key: string]: unknown
}

export interface OrgUserTribeAdminListResponseData extends OrgUserTribeAdminListData {
  [key: string]: unknown
}

export interface OrgUserTribeAdminListData {
  tribes?: OrgUserTribeAdminListCommunityData[] // 联盟列表

  [key: string]: unknown
}

export interface OrgUserTribeAdminListCommunityData {
  id?: number // 联盟ID
  random_id?: number // 联盟随机ID
  name?: string // 俱乐部名称
  club_count?: number // 俱乐部数量
  logo?: string // 头像
  favorite?: number // 收藏状态 1.收藏 2.未收藏

  [key: string]: unknown
}

export interface OrgClubIsMangerData {
  info?: OrgClubIsMangerInfo

  [key: string]: unknown
}

export interface OrgClubIsMangerDataCombine {
  admins?: OrgClubIsMangerInfo[]

  [key: string]: unknown
}

export interface OrgClubIsMangerInfo {
  club_id?: number // 俱乐部Id
  create_room?: number // 开桌权限 1有 2没有
  club_manage?: number // 俱乐部管理权限 1有 2没有
  member_manage?: number // 成员管理权限 1有 2没有
  fund_manage?: number // 基金管理权限 1有 2没有
  get_data?: number // 查看数据权限 1有 2没有

  [key: string]: unknown
}

export interface ClubAgentUserListData {
  limit?: number // 最大条数
  total?: number // 总条数
  offset?: number // 开始下标
  total_info?: ClubAgentUserListTotalInfo
  data?: ClubAgentUserListRecord[]

  [key: string]: unknown
}

export interface ClubAgentUserListRecord {
  user_id?: number // 用户id
  random_num?: number // 随机号码
  nick_name?: string // 玩家昵称
  avatar?: string // 玩家头像
  follow_user_count?: number // 下线数量
  remark_name?: string // 备注名称
  user_level?: number // 用户等级
  gold?: number // 金币
  user_service_ratio?: number // 玩家普通桌返水比例
  user_mtt_ratio?: number // 玩家MTT返水比例
  rb_type?: number // 返水方式
  rb_interval_type?: number // 间隔类型
  rb_interval_no?: number // 间隔数量
  rb_cyclic_type?: number // 周期类型 1 周；2 月
  rb_cyclic_day?: number // 周期第几天
  club_gold_credit?: number // 俱乐部币信用余额
  club_gold_credit_limit?: number // 俱乐部币信用额度限
  diamonds?: number // 钻石
  freeze_status?: number // 0 正常；1 平台冻结；2 联盟拉黑；3 俱乐部冻结

  [key: string]: unknown
}

export interface ClubAgentUserListTotalInfo {
  total_gold?: number // 总金额

  [key: string]: unknown
}

export interface ClubUserWalletData {
  golds?: number // 俱乐部的基金金币
  gold_lock?: number // 俱乐部的冻结基金金币
  usdt?: number // USDT余额
  usdt_lock?: number // 冻结的USDT余额
  forbidden?: boolean // 基金是否被冻结
  gold_to_usdt_rate?: number // 联盟币转 usdt 汇率
  usdt_to_gold_rate?: number // usdt转 联盟币汇率
  club_gold_credit?: number // 俱乐部币信用余额
  club_gold_credit_limit?: number // 俱乐部币信用额度限

  [key: string]: unknown
}

export interface OrgClubCreateData {
  ClubSwitchStatus?: number // 自动审核俱乐部开关 1打开2关闭

  [key: string]: unknown
}

export interface OrgClubGoldData {
  org_id?: number // 俱乐部id
  gold?: number // 俱乐部的基金金币
  gold_lock?: number // 俱乐部的冻结基金金币
  usdt?: number // 美金
  usdt_lock?: number // 冻结美金
  forbidden?: boolean // 基金是否被冻结
  gold_to_usdt_rate?: number // 联盟币转 usdt 汇率
  usdt_to_gold_rate?: number // usdt转 联盟币汇率
  diamond?: number // 创始人的钻石数量
  members_gold?: number // 成员总UC余额
  club_credit_limit_total?: number // 总额度
  club_credit_total?: number // 额度余额
  members_table_gold?: number // 总在桌UC余额

  [key: string]: unknown
}

export interface ClubFundChangeLogData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总数
  list?: ClubFundChangeLogRecord[]
  total_info?: ClubFundChangeLogTotalInfo
  ratio_info?: ClubFundChangeLogRatioInfo

  [key: string]: unknown
}

export interface ClubFundChangeLogTotalInfo {
  grant_amount?: number // 发放总额
  recover_amount?: number // 回收总额
  profit_amount?: number // 分润总额
  change_amount?: number // 变动总额

  [key: string]: unknown
}

export interface ClubFundChangeLogRatioInfo {
  service_ratio?: number // 房间分润比例
  insur_ratio?: number // 保险分润比例
  cowboy_ratio?: number // 牛仔分润比例
  prop_ratio?: number // 道具分润比例
  mtt_ratio?: number // mtt分润比例

  [key: string]: unknown
}

export interface ClubFundChangeLogRecord {
  gold_change?: number // 资金变动
  gold_after?: number // 资金变动后
  create_time?: string // 创建时间
  user_random_num?: number // 玩家id
  user_nick_name?: string // 玩家名称
  admin_random_num?: number // 管理员ID
  admin_nick_name?: string // 管理员昵称
  src_nick_name?: string // 来源用户昵称
  src_random_id?: number // 来源用户id
  src_room_id?: number // 房间id
  src_match_id?: number // 比赛id
  name?: string // 牌局名称
  multi_lang_names_obj?: unknown // 牌局名称多语言显示
  op_code?: string // 操作类型 详情见 枚举OpCodeString
  src_type?: number // 来源 0-普通非游戏，1-来源德州玩法房间，2-来源MTT，3-来源牛仔
  gold_type?: number // 1 联盟，2 USDT
  op_nick_name?: string // 发送目的用户名称
  op_random_id?: number // 发送目的用户id

  [key: string]: unknown
}

export interface OrgClubData {
  club_id?: number
  club_name?: string
  logo?: string
  random_id?: number
  upper_limit?: number
  club_members?: number
  area_id?: string
  create_time?: string
  desc?: string
  more_contact?: string
  level?: number
  tables?: number
  club_creator_random_id?: number
  club_creator_avatar?: string
  club_creator_nickname?: string
  tribe_name?: string
  search_switch?: number
  auto_audit_switch?: number
  show_contact_switch?: number
  show_notice_switch?: number
  user_level?: number
  tribe_id?: number
  tribe_random_id?: number
  tribe_logo?: string
  contact_info?: OrgClubSearchByIdContactInfo
  user_gold?: number
  user_ustd?: number
  friend_total?: number
  digital_wallet_switch?: number
  digital_wallet_erc?: string
  digital_wallet_trc?: string
  grant_switch?: number
  pretty_id?: number
  first_update_name?: number
  last_update_name_time?: string
  welcomes?: string
  welcomes_switch?: number
  max_user_service_ratio?: number
  max_user_mtt_ratio?: number
  member_detail_type?: number
  currency_exchange?: number
  currency?: string
  master_type?: number
  banner?: string
  fantasy_room_switch?: number
  uc_deposit_advance?: number
  banner_audit?: number
  club_subscription_id?: number
  club_subscription?: OrgClubSearchByIdClubVipInfo
  member_type?: number
  user_credit?: number
  club_gold_credit_limit?: number
  user_club_forbidden?: boolean
  room_permissions?: unknown
  new_labels?: unknown
  club_user_wallet_switch?: number
  prologue?: string
  prologue_switch?: number
  agent_uc_switch?: number
  support_im_rid?: string
  support_user_id?: number
  deposit_switch?: number
  security_deposit?: number
  freeze_status?: number
  invitation_code?: string

  [key: string]: unknown
}

export interface OrgClubSearchByIdClubVipInfo {
  club_subscription_id?: number // 会员id
  club_subscription_name?: string // 会员名称
  club_subscription_logo?: string // logo
  max_share_table_num?: number // 共享牌桌可使用数量
  pop_window_permission?: number // 弹窗权限
  join_club_auto_audit_permission?: number // 入会免审核权限
  digital_wallet_permission?: number // 数字钱包权限
  free_anti_cheating_audio?: number // 防作弊语音免费时间
  free_anti_cheating_video?: number // 防作弊视频免费时间
  free_anti_cheating_face?: number // 防作弊人脸免费次数
  free_up_table_num?: number // 免费上桌玩家和观众次数
  game_limit_ip_permission?: number // 游戏限制IP权限
  game_limit_gps_permission?: number // 游戏限制GPS权限
  game_limit_safe_permission?: number // 游戏限制Safe权限
  self_game_permission?: number // 私人游戏权限
  aof_permission?: number // AOF权限
  auto_shut_table_permission?: number // 空桌自动关闭权限
  straddle_permission?: number // straddle强抓权限
  second_public_card_permission?: number // 二套牌权限
  insurance_permission?: number // 保险权限
  current_share_table_num?: number // 当前共享牌桌可使用数量
  used_free_anti_cheating_audio?: number // 已使用防作弊语音免费时间
  used_free_anti_cheating_video?: number // 已使用防作弊视频免费时间
  used_ree_anti_cheating_face?: number // 已使用防作弊人脸免费次数
  used_free_up_table_num?: number // 已使用免费上桌玩家和观众次数
  last_club_subscription_id?: number // 最近一次开通俱乐部付费会员id
  last_club_subscription_name?: string // 最近一次开通俱乐部付费会员名称
  club_subscription_price_type?: number // 价格类型 0.永久免费 1.30天（月） 2.90天（季） 3.180天（半年） 4.365天（年）
  club_subscription_end_time?: number // 俱乐部会员结束时间
  last_club_subscription_status?: number // 俱乐部会员状态
  free_change_club_name?: number // 免费修改俱乐部昵称次数
  used_free_change_club_name?: number // 已使用免费修改俱乐部昵称次数
  room_check_pool_rate?: number // 入池率权限 1.开启 2.关闭
  room_limit_hand?: number // 限制玩家观战权限 1.开启 2.关闭
  room_force_show_card?: number // 强制亮牌权限 1.开启 2.关闭
  room_random_seat?: number // 随机入座权限 1.开启 2.关闭
  room_only_ios?: number // 仅IOS设备权限 1.开启 2.关闭
  room_delay_view_card?: number // 延迟看牌 1.开启 2.关闭
  room_total_hand_limit?: number // 总手数限制 1.开启 2.关闭

  [key: string]: unknown
}

export interface OrgClubSearchByIdContactInfo {
  telegram?: string // 飞机

  [key: string]: unknown
}

export interface OrgClubGetJoinlListData {
  offset?: number // 当前偏移值
  data?: OrgClubGetJoinlListRecord[]

  [key: string]: unknown
}

export interface OrgClubGetJoinlListRecord {
  id?: number // 申请id
  club_id?: number // 俱乐部id
  club_name?: string // 俱乐部名字
  logo?: string // 俱乐部logo
  nickname?: string // 申请人名称
  avatar?: string // logo图片
  user_random_id?: number // 用户id
  create_time?: string // 创建时间

  [key: string]: unknown
}

export interface OrgClubLevelBenefitData {
  data?: OrgClubLevelBenefitRecord[]

  [key: string]: unknown
}

export interface OrgClubLevelBenefitRecord {
  club_level?: number // 俱乐部等级
  user_num?: number // 组员数量
  level_count?: number // 需要钻石
  level_duration?: number // 持续天数
  limit_type?: number // 有效期类型 1-永久 2-限制日期

  [key: string]: unknown
}

export interface OrgClubLevelInfoData {
  data?: OrgClubLevelInfoRecord

  [key: string]: unknown
}

export interface OrgClubLevelInfoRecord {
  level?: number // 等级
  up_level_time?: string // 升级等级时间
  limit_type?: number // 有效期类型 1-永久 2-限制日期

  [key: string]: unknown
}

export interface OrgMemberListData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总条数
  total_info?: OrgMemberListTotalInfo
  agent_list?: OrgMemberListAgencyInfo[]
  data?: OrgMemberListRecord[]

  [key: string]: unknown
}

export interface OrgMemberListAgencyInfo {
  user_id?: number // 用户id
  nick_name?: string // 用户昵称
  remark_name?: string // 用户备注名

  [key: string]: unknown
}

export interface OrgMemberListRecord {
  user_id?: number // 用户id
  random_num?: number // 随机号码
  nick_name?: string // 玩家昵称
  avatar?: string // 玩家头像
  club_member_type?: number // //1 （创建者/老板号） 2 代理人 3 普通用户
  freeze_status?: number // 0 正常；1 平台冻结；2 联盟拉黑；3 俱乐部冻结
  agent_nick_name?: string // 代理名称
  agent_random_id?: number // 代理id
  follow_user_count?: number // 下线人数
  remark_name?: string // 备注名称
  user_level?: number // 用户等级 0 普通 1会长 2副会长 3管理员 4 代理
  gold?: number // 金币 UC
  usdt?: number // 金币 GC
  last_login_time_str?: string // 上次登录时间
  user_service_ratio?: number // 玩家普通桌返水比例
  user_mtt_ratio?: number // 玩家MTT返水比例
  club_name?: string // 俱乐部名称
  club_remark_name?: string // 俱乐部备注名称
  club_remark_color?: string // 俱乐部颜色
  club_id?: number // 俱乐部id
  rb_type?: number // 返水方式
  rb_interval_type?: number // 返水类型
  rb_interval_no?: number // 返水间隔
  rb_cyclic_type?: number // 周期类型 1 周；2 月
  rb_cyclic_day?: number // 周期第几天
  is_boss?: number // 是否是老板号(0 否 1 是)
  club_gold_credit?: number // 俱乐部币信用余额
  club_gold_credit_limit?: number // 俱乐部币信用额度限
  diamonds?: number // 钻石余额
  user_grade_level?: number // 0、无；1、快进快出用户；2、流失用户；3、优质用户；4、潜力用户；5、观察用户

  [key: string]: unknown
}

export interface OrgMemberListTotalInfo {
  total_gold?: number // 总金额

  [key: string]: unknown
}

export interface OrgClubUserInfoData {
  club_id?: number // 俱乐部id
  create_time?: string // 创建时间
  agent_user_id?: number // 代理用户id
  user_service_ratio?: number // 最大玩家普通桌返水比例
  user_mtt_ratio?: number // 最大玩家MTT返水比例
  remark_name?: string // 备注名称
  remark_desc?: string // 备注描述
  user_level?: number // 用户等级 0 普通 1会长 2副会长 3管理员 4 代理
  user_info?: OrgClubUserInfoUserInfo // 用户信息
  freeze_status?: number // 0 正常；1 平台冻结；2 联盟拉黑；3 俱乐部冻结
  uc_deposit_advance?: number // UC垫付 1 开启 2 未开启
  club_gold_credit?: number // 俱乐部币信用余额
  club_gold_credit_limit?: number // 俱乐部币信用额度限
  friend_total?: number // 下线成员总数

  [key: string]: unknown
}

export interface OrgClubUserInfoUserInfo {
  user_id?: number // 用户id
  random_id?: number // 用户random id
  nickname?: string // 成员名称
  avatar?: string // 成员头像
  gold?: number // 成员金额
  usdt?: number // 成员usdt
  user_grade_level?: number // 用户等级 1、快进快出用户；2、流失用户；3、优质用户；4、潜力用户；5、观察用户
  user_grade_tags?: string // 用户标签 英文逗号分割。1、高活跃用户；2、常玩用户；3、长时间在线；4、有充值； 5、只看不玩；6、快进快出；7、长时间不活跃
  online_time_today?: number // 今日在线时长 单位：分钟
  online_time_daily_7_days?: number // 近7天日均在线时长 单位：分钟
  hand_number_today?: number // 今日手数
  hand_number_daily_7_days?: number // 近7天日均手数
  recharge_today?: number // 今日充值金额 单位：分
  recharge_daily_7_days?: number // 近7天日均充值金额 单位：分

  [key: string]: unknown
}

export interface OrgClubPlayerApplyListData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  items?: OrgClubPlayerApplyListDataElement[] // 业务数据，成功情况才有数据

  [key: string]: unknown
}

export interface OrgClubPlayerApplyListDataElement {
  id?: number // 申请id
  random_id?: number // 俱乐部随机id
  club_name?: string // 俱乐部名字
  logo?: string // 俱乐部头像
  club_members?: number // 俱乐部人数
  pretty_id?: number // 靓号 >0则是靓号 =0不是靓号

  [key: string]: unknown
}

export interface ClubJoinListData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  items?: ClubJoinListDataElement[] // 业务数据，成功情况才有数据

  [key: string]: unknown
}

export interface ClubJoinListDataElement {
  id?: number // 申请id
  random_id?: number // 俱乐部随机id
  club_name?: string // 俱乐部名字
  logo?: string // 俱乐部头像
  club_members?: number // 俱乐部人数
  pretty_id?: number // 靓号 >0则是靓号 =0不是靓号

  [key: string]: unknown
}

export interface OrgClubApplyTribeListData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  list?: OrgClubApplyTribeListDataElement[] // 联盟信息列表

  [key: string]: unknown
}

export interface OrgClubApplyTribeListDataElement {
  id?: number // 联盟ID
  tribe_name?: string // 联盟名称
  logo?: string // 联盟头像
  tribe_random_id?: number // 联盟随机ID

  [key: string]: unknown
}

export interface OrgTribeSearchByIdData {
  random_id?: number // 联盟随机id
  bring_in_auto_switch?: number // 自动带入开关
  room_permissions?: unknown // 房间权限

  [key: string]: unknown
}

export interface DeleleUserData {
  [key: string]: unknown
}

export interface LockUserData {
  [key: string]: unknown
}

export interface UnlockUserData {
  [key: string]: unknown
}

export interface ClubAgentUserListCoverData {
  [key: string]: unknown
}

export interface OrgClubUpLevelData {
  [key: string]: unknown
}

export interface OrgChangeClubDataData {
  [key: string]: unknown
}

export interface ModifyDigitalWalletAddressData {
  [key: string]: unknown
}

export interface OrgClubUserRoleChangeData {
  [key: string]: unknown
}

export interface ClubAgentAddData {
  [key: string]: unknown
}

export interface ClubAgentDelData {
  [key: string]: unknown
}

export interface OrgClubJoinData {
  [key: string]: unknown
}

export interface OrgClubApproValJoinData {
  [key: string]: unknown
}

export interface OrgClubCancleJoinClubData {
  [key: string]: unknown
}

export interface OrgClubQuitData {
  [key: string]: unknown
}

export interface OrgJoinTripData {
  [key: string]: unknown
}

export interface OrgClubCancleJoinTribeData {
  [key: string]: unknown
}

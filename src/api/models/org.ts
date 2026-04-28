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

    club_name?: string;
    logo?: string;
    random_id?: number;
    upper_limit?: number;
    club_members?: number;
    area_id?: string;
    club_type?: number;
    member_type?: number;
    create_time?: string;
    is_official?: number;
    club_status?: number;

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
  [key: string]: unknown
}

export interface LockUserResponseData extends LockUserData {
  [key: string]: unknown
}

// /api/org/club/admin/permission_switch (OrgClubAdminPermissionSwitch)
export interface OrgClubAdminPermissionSwitchRequest {

    club_id?: number;
    user_id?: number;
    create_room?: number;
    club_manage?: number;
    member_manage?: number;
    fund_manage?: number;
    get_data?: number;

  [key: string]: unknown
}

export interface OrgClubAdminPermissionSwitchResponseData extends OrgClubAdminPermissionSwitchData {
  [key: string]: unknown
}

export interface OrgClubAdminPermissionSwitchInfo {

    create_room?: number;
    club_manage?: number;
    member_manage?: number;
    fund_manage?: number;
    get_data?: number;

  [key: string]: unknown
}

export interface OrgClubAdminPermissionSwitchData {

    info?: OrgClubAdminPermissionSwitchInfo;

  [key: string]: unknown
}

// /api/org/club/admin/unlock/user (UnlockUser)
export interface UnlockUserRequest {

  //     user_id: number;
  //
  [key: string]: unknown
}

export interface UnlockUserResponseData extends UnlockUserData {
  [key: string]: unknown
}

// /api/org/club/agent/credit/balance (OrgClubAgentCreditBalaNce)
export interface OrgClubAgentCreditBalaNceRequest {

    user_id?: number;
    gold_type?: number;
    amount?: number;
    is_reset?: boolean;

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

    user_id?: number;
    gold_type?: number;
    amount?: number;
    is_reset?: boolean;

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

    user_id?: number;
    club_id?: number;

  [key: string]: unknown
}

export interface OrgClubAgentInviTationResponseData extends OrgClubAgentInviTationData {
  [key: string]: unknown
}

export interface OrgClubAgentInviTationData {
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

    user_id?: number;

  [key: string]: unknown
}

export interface OrgClubAgentRatioInfoResponseData extends OrgClubAgentRatioInfoData {
  [key: string]: unknown
}

export interface OrgClubAgentRatioInfoData {

    info?: OrgClubAgentRatioInfoInfo;

  [key: string]: unknown
}

export interface OrgClubAgentRatioInfoInfo {

    agent_service_ratio?: number;
    agent_insur_ratio?: number;
    agent_cowboy_ratio?: number;
    agent_mtt_ratio?: number;
    agent_jackpot_ratio?: number;

  [key: string]: unknown
}

// /api/org/club/agent/ratio/update (OrgClubAgentRatioUpdate)
export interface OrgClubAgentRatioUpdateRequest {

    user_id?: number;
    agent_service_ratio?: number;
    agent_insur_ratio?: number;
    agent_cowboy_ratio?: number;
    agent_mtt_ratio?: number;
    agent_jackpot_ratio?: number;

  [key: string]: unknown
}

export interface OrgClubAgentRatioUpdateResponseData {
  [key: string]: unknown
}

// /api/org/club/agent/user_list (ClubAgentUserList)
export interface ClubAgentUserListRequest {
  [key: string]: unknown
}

export interface ClubAgentUserListResponseData extends ClubAgentUserListData {
  [key: string]: unknown
}

// /api/org/club/agent/user_list_cover (ClubAgentUserListCover)
export interface ClubAgentUserListCoverRequest {
  [key: string]: unknown
}

export interface ClubAgentUserListCoverResponseData extends ClubAgentUserListCoverData {
  [key: string]: unknown
}

// /api/org/club/clone/apply (OrgClubCloneApply)
export interface OrgClubCloneApplyRequest {

    club_id?: number;

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
  [key: string]: unknown
}

export interface ClubUserWalletResponseData extends ClubUserWalletData {
  [key: string]: unknown
}

// /api/org/club/club_wallet/stats (OrgClubClubWalletStats)
export interface OrgClubClubWalletStatsRequest {

    gold_type?: number;
    start_time?: number;
    end_time?: number;

  [key: string]: unknown
}

export interface OrgClubClubWalletStatsResponseData extends OrgClubClubWalletStatsData {
  [key: string]: unknown
}

export interface OrgClubClubWalletStatsData {

    gold_before?: number;
    gold_after?: number;
    to_user?: number;
    recover_user?: number;
    to_club?: number;
    recover_club?: number;
    room_profit?: number;
    mtt_profit?: number;
    insurance?: number;
    sng_profit?: number;
    jackpot_profit?: number;
    mini_game_profit?: number;

  [key: string]: unknown
}

// /api/org/club/create (OrgClubCreate)
export interface OrgClubCreateRequest {

  //     area_id: null,
  //     club_name: null,
  //     desc: null,
  //     logo: null,
  //
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

    is_first?: number;

  [key: string]: unknown
}

// /api/org/club/credit/balance (OrgClubCreditBalaNce)
export interface OrgClubCreditBalaNceRequest {

    user_id?: number;
    gold_type?: number;
    amount?: number;
    is_reset?: boolean;

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

    user_id?: number;
    gold_type?: number;
    amount?: number;
    is_reset?: boolean;

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

    limit?: number;
    offset?: number;
    gold_type?: number;
    op_codes?: string[];
    start_time?: number;
    end_time?: number;
    sort_type?: number;
    order_type?: number;

  [key: string]: unknown
}

export interface OrgClubCreditLogResponseData extends OrgClubCreditLogData {
  [key: string]: unknown
}

export interface OrgClubCreditLogData {

    limit?: number;
    total?: number;
    offset?: number;
    data?: OrgClubCreditLogCreditData[];
    credit_info?: OrgClubCreditLogCreditInfo;

  [key: string]: unknown
}

export interface OrgClubCreditLogCreditInfo {

    club_credit_limit_total?: number;
    club_credit_limit_increase_total?: number;
    club_credit_limit_decrease_total?: number;
    club_credit_total?: number;
    club_credit_increase_total?: number;
    club_credit_decrease_total?: number;

  [key: string]: unknown
}

export interface OrgClubCreditLogCreditData {

    credit_change?: number;
    credit_after?: number;
    create_time?: string;
    op_code?: string;
    credit_limit?: number;
    user_random_id?: number;
    user_name?: string;

  [key: string]: unknown
}

// /api/org/club/delay_room_audit_switch/update (OrgClubDelayRoomAuditSwitchUpdate)
export interface OrgClubDelayRoomAuditSwitchUpdateRequest {

    delay_room_audit_switch?: number;

  [key: string]: unknown
}

export interface OrgClubDelayRoomAuditSwitchUpdateResponseData extends OrgClubDelayRoomAuditSwitchUpdateData {
  [key: string]: unknown
}

export interface OrgClubDelayRoomAuditSwitchUpdateData {
  [key: string]: unknown
}

// /api/org/club/disband (OrgClubDisbAnd)
export interface OrgClubDisbAndRequest {
  [key: string]: unknown
}

export interface OrgClubDisbAndResponseData extends OrgClubDisbAndData {
  [key: string]: unknown
}

export interface OrgClubDisbAndData {
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
  [key: string]: unknown
}

export interface ClubFundChangeLogResponseData extends ClubFundChangeLogData {
  [key: string]: unknown
}

// /api/org/club/info (OrgClubSearchById)
export interface OrgClubSearchByIdRequest {
  club_random_id: number;
}

export interface OrgClubSearchByIdResponseData {
    club_id?: number;
    club_name?: string;
    logo?: string;
    random_id?: number;
    upper_limit?: number;
    club_members?: number;
    area_id?: string;
    create_time?: string;
    desc?: string;
    more_contact?: string;
    level?: number;
    tables?: number;
    club_creator_random_id?: number;
    club_creator_avatar?: string;
    club_creator_nickname?: string;
    tribe_name?: string;
    search_switch?: number;
    auto_audit_switch?: number;
    show_contact_switch?: number;
    show_notice_switch?: number;
    user_level?: number;
    tribe_id?: number;
    tribe_random_id?: number;
    tribe_logo?: string;
    contact_info?: OrgClubSearchByIdContactInfo;
    user_gold?: number;
    user_ustd?: number;
    friend_total?: number;
    digital_wallet_switch?: number;
    digital_wallet_erc?: string;
    digital_wallet_trc?: string;
    grant_switch?: number;
    pretty_id?: number;
    first_update_name?: number;
    last_update_name_time?: string;
    welcomes?: string;
    welcomes_switch?: number;
    max_user_service_ratio?: number;
    max_user_mtt_ratio?: number;
    member_detail_type?: number;
    currency_exchange?: number;
    currency?: string;
    master_type?: number;
    banner?: string;
    fantasy_room_switch?: number;
    uc_deposit_advance?: number;
    banner_audit?: number;
    club_subscription_id?: number;
    club_subscription?: OrgClubSearchByIdClubVipInfo;
    member_type?: number;
    user_credit?: number;
    club_gold_credit_limit?: number;
    user_club_forbidden?: boolean;
    room_permissions?: unknown;
    new_labels?: unknown;
    club_user_wallet_switch?: number;
    prologue?: string;
    prologue_switch?: number;
    agent_uc_switch?: number;
    support_im_rid?: string;
    support_user_id?: number;
    deposit_switch?: number;
    security_deposit?: number;
    freeze_status?: number;

  [key: string]: unknown
}

// /api/org/club/invitation (OrgClubInviTation)
export interface OrgClubInviTationRequest {

    club_id?: number;

  [key: string]: unknown
}

export interface OrgClubInviTationResponseData extends OrgClubInviTationData {
  [key: string]: unknown
}

export interface OrgClubInviTationData {
  [key: string]: unknown
}

// /api/org/club/jackpot/recharge (OrgClubJackpotRecharge)
export interface OrgClubJackpotRechargeRequest {

    jackpot_id?: number;
    amount?: number;

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

    name?: string;
    gold?: number;
    nlh_switch?: number;
    nlh_setting?: OrgClubJackpotTemplateCreateJackpotSetting;
    plo_switch?: number;
    plo_setting?: OrgClubJackpotTemplateCreateJackpotSetting;
    six_plus_switch?: number;
    six_plus_setting?: OrgClubJackpotTemplateCreateJackpotSetting;
    bombpot_switch?: number;
    bombpot_setting?: OrgClubJackpotTemplateCreateJackpotSetting;
    aof_switch?: number;
    aof_setting?: OrgClubJackpotTemplateCreateJackpotSetting;

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateCreateResponseData extends OrgClubJackpotTemplateCreateData {
  [key: string]: unknown
}

export interface OrgClubJackpotTemplateCreateJackpotSetting {

    game_play_ratio?: number;
    blind_setting?: OrgClubJackpotTemplateCreateBlindsSetting[];
    royal_flush_switch?: number;
    royal_flush_ratio?: number;
    straight_flush_switch?: number;
    straight_flush_ratio?: number;
    four_ofa_kind_switch?: number;
    four_ofa_kind_ratio?: number;

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateCreateBlindsSetting {

    sb?: number;
    status?: number;
    blind_type?: number;
    prize_ratio?: number;
    contribute_pot_switch?: number;
    contribute_pot_limit?: number;
    award_bet_switch?: number;
    award_bet_limit?: number;
    award_other_switch?: number;
    award_other_ratio?: number;
    award_round_type?: number;
    contribute_type?: number;
    contribute_fixed_limit?: number;
    contribute_fixed_rate?: number;
    contribute_ratio?: number;
    contribute_pot_ratio?: number;
    mars_earth_ratio?: number;

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateCreateData {
  [key: string]: unknown
}

// /api/org/club/jackpot/template/del (OrgClubJackpotTemplateDel)
export interface OrgClubJackpotTemplateDelRequest {

    jackpot_id?: number;

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

    nlh_switch?: number;
    plo_switch?: number;
    six_plus_switch?: number;
    bombpot_switch?: number;
    aof_switch?: number;
    limit?: number;
    offset?: number;
    ids?: number[];

  [key: string]: unknown
}

export interface OrgClubJackpotTemplateListResponseData extends OrgClubJackpotTemplateListData {
  [key: string]: unknown
}

export interface OrgClubJackpotTemplateListData {

    limit?: number;
    offset?: number;
    items?: unknown[];

  [key: string]: unknown
}

// /api/org/club/jackpot/template/update (OrgClubJackpotTemplateUpdate)
export interface OrgClubJackpotTemplateUpdateRequest {

    name?: string;
    jackpot_id?: number;
    nlh_switch?: number;
    nlh_setting?: unknown;
    plo_switch?: number;
    plo_setting?: unknown;
    six_plus_switch?: number;
    six_plus_setting?: unknown;
    bombpot_switch?: number;
    bombpot_setting?: unknown;
    aof_switch?: number;
    aof_setting?: unknown;

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

    jackpot_id?: number;
    amount?: number;

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
  [key: string]: unknown
}

export interface OrgClubGetJoinlListResponseData extends OrgClubGetJoinlListData {
offset?: number;
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
  [key: string]: unknown
}

export interface OrgClubLevelInfoResponseData extends OrgClubLevelInfoData {
  [key: string]: unknown
}

// /api/org/club/level_up (OrgClubUpLevel)
export interface OrgClubUpLevelRequest {
  [key: string]: unknown
}

export interface OrgClubUpLevelResponseData extends OrgClubUpLevelData {
  [key: string]: unknown
}

// /api/org/club/list (OrgClubList)
export interface OrgClubListRequest {

    club_random_ids?: string;

  [key: string]: unknown
}

export interface OrgClubListResponseData extends OrgClubListData {
  [key: string]: unknown
}

export interface OrgClubListData {
  [key: string]: unknown
}

export interface OrgClubListClubData {

    club_name?: string;
    logo?: string;

  [key: string]: unknown
}

// /api/org/club/master/slave_club/list (OrgClubMasterSlaveClubList)
export interface OrgClubMasterSlaveClubListRequest {

    search?: string;
    sort_type?: number;
    order_type?: number;
    limit?: number;
    offset?: number;
    filter_type?: number;
    club_id?: number;

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubListResponseData extends OrgClubMasterSlaveClubListData {
  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubListData {

    limit?: number;
    offset?: number;
    total?: number;
    total_info?: OrgClubMasterSlaveClubListTotalInfo;
    data?: OrgClubMasterSlaveClubListRecord[];

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubListRecord {

    club_id?: number;
    club_name?: string;
    logo?: string;
    random_id?: number;
    club_members?: number;
    master_service_ratio?: number;
    master_insur_ratio?: number;
    master_mtt_ratio?: number;
    master_jackpot_ratio?: number;
    remark_name?: string;
    profit_total?: number;
    club_gold?: number;
    user_gold?: number;
    remark_desc?: string;
    slave_create_time?: string;
    club_subscription_id?: number;

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubListTotalInfo {

    member_total?: number;
    profit_total?: number;
    total_gold?: number;

  [key: string]: unknown
}

// /api/org/club/master/slave_club/ratio (OrgClubMasterSlaveClubRatio)
export interface OrgClubMasterSlaveClubRatioRequest {

    slave_club_id?: number;
    master_service_ratio?: number;
    master_insur_ratio?: number;
    master_mtt_ratio?: number;
    master_jackpot_ratio?: number;

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubRatioResponseData {
  [key: string]: unknown
}

// /api/org/club/master/slave_club/remark (OrgClubMasterSlaveClubRemark)
export interface OrgClubMasterSlaveClubRemarkRequest {

    slave_club_id?: number;
    remark_name?: string;
    remark_desc?: string;

  [key: string]: unknown
}

export interface OrgClubMasterSlaveClubRemarkResponseData {
  [key: string]: unknown
}

// /api/org/club/member/list (OrgMemberList)
export interface OrgMemberListRequest {

  //     club_id: null;
  //
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

    gold_type?: number;
    limit?: number;
    offset?: number;
    sort_type?: number;
    order_type?: number;
    start_time?: number;
    end_time?: number;

  [key: string]: unknown
}

export interface OrgClubMemberRakeBackResponseData extends OrgClubMemberRakeBackData {
  [key: string]: unknown
}

export interface OrgClubMemberRakeBackData {

    limit?: number;
    offset?: number;
    total?: number;
    data?: OrgClubMemberRakeBackWallet[];
    total_info?: OrgClubMemberRakeBackTotalInfo;

  [key: string]: unknown
}

export interface OrgClubMemberRakeBackTotalInfo {

    rake_back_all?: number;
    rake_back_payed?: number;
    rake_back_unpay?: number;

  [key: string]: unknown
}

export interface OrgClubMemberRakeBackWallet {

    random_num?: number;
    nick_name?: string;
    remark_name?: string;
    total_room_game_results?: number;
    total_service_profit?: number;
    freeze_status?: number;
    user_service_ratio?: number;
    user_mtt_ratio?: number;
    rb?: number;
    club_name?: string;
    club_remark_name?: string;
    club_remark_color?: string;
    rb_type?: number;
    rb_interval_type?: number;
    rb_interval_no?: number;
    unpay_rb?: number;
    payed_rb?: number;

  [key: string]: unknown
}

// /api/org/club/modify/club_desc (OrgClubModifyClubDesc)
export interface OrgClubModifyClubDescRequest {

    club_id?: number;
    desc?: string;

  [key: string]: unknown
}

export interface OrgClubModifyClubDescResponseData extends OrgClubModifyClubDescData {
  [key: string]: unknown
}

export interface OrgClubModifyClubDescData {
  [key: string]: unknown
}

// /api/org/club/modify/club_info (OrgchaNgeClubData)
export interface OrgchaNgeClubDataRequest {
  [key: string]: unknown
}

export interface OrgchaNgeClubDataResponseData extends OrgchaNgeClubDataData {
  [key: string]: unknown
}

// /api/org/club/modify/digital_wallet_address (ModifyDigitalWalletAddress)
export interface ModifyDigitalWalletAddressRequest {
  [key: string]: unknown
}

export interface ModifyDigitalWalletAddressResponseData extends ModifyDigitalWalletAddressData {
  [key: string]: unknown
}

// /api/org/club/my_create_clubs (OrgClubMyCreateClubs)
export interface OrgClubMyCreateClubsRequest {

    club_random_id?: number;

  [key: string]: unknown
}

export interface OrgClubMyCreateClubsResponseData extends OrgClubMyCreateClubsData {
  [key: string]: unknown
}

export interface OrgClubMyCreateClubsData {

    list?: OrgClubMyCreateClubsInfo[];

  [key: string]: unknown
}

export interface OrgClubMyCreateClubsInfo {

    club_logo?: string;
    club_id?: number;
    random_id?: number;
    club_name?: string;
    pretty_id?: number;

  [key: string]: unknown
}

// /api/org/club/role_change (OrgClubUserRoleChange)
export interface OrgClubUserRoleChangeRequest {
  [key: string]: unknown
}

export interface OrgClubUserRoleChangeResponseData extends OrgClubUserRoleChangeData {
  [key: string]: unknown
}

// /api/org/club/search_info (OrgClubSearchInfo)
export interface OrgClubSearchInfoRequest {

    club_random_id?: number;

  [key: string]: unknown
}

export interface OrgClubSearchInfoResponseData extends OrgClubSearchInfoData {
  [key: string]: unknown
}

export interface OrgClubSearchInfoData {

    club_id?: number;
    club_name?: string;
    logo?: string;
    random_id?: number;
    club_members?: number;
    user_status?: number;
    pretty_id?: number;
    club_subscription_id?: number;

  [key: string]: unknown
}

// /api/org/club/set/time_zone (OrgClubSetTimeZone)
export interface OrgClubSetTimeZoneRequest {

    time_zone?: number;

  [key: string]: unknown
}

export interface OrgClubSetTimeZoneResponseData {
  [key: string]: unknown
}

// /api/org/club/set/user/uc_advance (OrgClubSetUserUcadvaNce)
export interface OrgClubSetUserUcadvaNceRequest {

    user_id?: number;
    status?: number;

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

    subscription_id?: number;
    price_type?: number;

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

    subscription_id?: number;
    subscription_status?: number;
    equity_comparison?: number;

  [key: string]: unknown
}

export interface OrgClubSubscrIptionListResponseData extends OrgClubSubscrIptionListData {
  [key: string]: unknown
}

export interface OrgClubSubscrIptionListData {

    list?: OrgClubSubscrIptionListVIPEquityData[];

  [key: string]: unknown
}

export interface OrgClubSubscrIptionListVIPEquityData {

    id?: number;
    name?: string;
    logo?: string;
    price_configs?: OrgClubSubscrIptionListPriceConfigs[];
    subscription_type?: number;
    status?: number;
    equity_comparison?: number;
    top_club_level?: number;
    max_slave_club_num?: number;
    max_club_agent_num?: number;
    max_share_table_num?: number;
    max_table_template_num?: number;
    create_max_table_num?: number;
    im_service_permission?: number;
    timing_download_permission?: number;
    manager_patrol_table_permission?: number;
    welcome_message_permission?: number;
    pop_window_permission?: number;
    photo_announce_permission?: number;
    join_club_auto_audit_permission?: number;
    free_anti_cheating_audio?: number;
    free_anti_cheating_video?: number;
    free_anti_cheating_face?: number;
    free_up_table_num?: number;
    game_limit_ip_permission?: number;
    game_limit_gps_permission?: number;
    game_limit_safe_permission?: number;
    self_game_permission?: number;
    aof_permission?: number;
    auto_shut_table_permission?: number;
    straddle_permission?: number;
    second_public_card_permission?: number;
    insurance_permission?: number;

  [key: string]: unknown
}

export interface OrgClubSubscrIptionListPriceConfigs {

    price_type?: number;
    raw_price?: number;
    pay_price?: number;

  [key: string]: unknown
}

// /api/org/club/user_club (OrgClubGet)
export interface OrgClubGetRequest {

  //
  [key: string]: unknown
}

export type OrgClubGetResponseData = OrgClubData[]

// /api/org/club/user/add_agent (ClubAgentAdd)
export interface ClubAgentAddRequest {
  [key: string]: unknown
}

export interface ClubAgentAddResponseData extends ClubAgentAddData {
  [key: string]: unknown
}

// /api/org/club/user/admin/has (GuildAdminHas)
export interface GuildAdminHasRequest {
  [key: string]: unknown
}

export type GuildAdminHasResponseData = boolean

// /api/org/club/user/del_agent (ClubAgentDel)
export interface ClubAgentDelRequest {
  [key: string]: unknown
}

export interface ClubAgentDelResponseData extends ClubAgentDelData {
  [key: string]: unknown
}

// /api/org/club/user/info (OrgClubUserInfo)
export interface OrgClubUserInfoRequest {
  [key: string]: unknown
}

export interface OrgClubUserInfoResponseData extends OrgClubUserInfoData {
  [key: string]: unknown
}

// /api/org/club/user/join/apply (OrgClubJoin)
export interface OrgClubJoinRequest {
  club_id: number;
}

export interface OrgClubJoinResponseData extends OrgClubJoinData {
  [key: string]: unknown
}

// /api/org/club/user/join/audit (OrgClubApproValJoin)
export interface OrgClubApproValJoinRequest {

  //     "apply_id": ''
  //     "audit_op": ''
  //
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
  [key: string]: unknown
}

export interface OrgClubUserRemaRksResponseData {
  [key: string]: unknown
}

// /api/org/club/user/wallet/relation/grant (OrgClubUserWalletRelationGrant)
export interface OrgClubUserWalletRelationGrantRequest {

    user_ids?: number[];
    amount?: number;
    gold_type?: number;

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

    limit?: number;
    offset?: number;
    club_id?: number;

  [key: string]: unknown
}

export interface OrgClubUserWalletRelationListResponseData extends OrgClubUserWalletRelationListData {
  [key: string]: unknown
}

export interface OrgClubUserWalletRelationListData {

    data?: OrgClubUserWalletRelationListUserData[];

  [key: string]: unknown
}

export interface OrgClubUserWalletRelationListUserData {
  [key: string]: unknown
}

// /api/org/jackpot/template/info (OrgJackpotTemplateInfo)
export interface OrgJackpotTemplateInfoRequest {

    jackpot_id?: number;

  [key: string]: unknown
}

export interface OrgJackpotTemplateInfoResponseData extends OrgJackpotTemplateInfoData {
  [key: string]: unknown
}

export interface OrgJackpotTemplateInfoCombineData {

    total?: number;
    items?: unknown[];

  [key: string]: unknown
}

export interface OrgJackpotTemplateInfoData {

    item?: unknown;

  [key: string]: unknown
}

// /api/org/tribe/apply_list (OrgTribeApplyList)
export interface OrgTribeApplyListRequest {

    limit?: number;
    offset?: number;

  [key: string]: unknown
}

export interface OrgTribeApplyListResponseData extends OrgTribeApplyListData {
  [key: string]: unknown
}

export interface OrgTribeApplyListData {

    offset?: number;
    total?: number;
    list?: OrgTribeApplyListClubInfo[];

  [key: string]: unknown
}

export interface OrgTribeApplyListClubInfo {

    id?: number;
    club_name?: string;
    club_random_id?: number;
    tribe_name?: string;
    club_logo?: string;
    tribe_random_id?: number;
    club_subscription_id?: number;

  [key: string]: unknown
}

// /api/org/tribe/apply_upgrade (OrgTribeApplyUpgrAde)
export interface OrgTribeApplyUpgrAdeRequest {

    tribe_phone_area?: string;
    tribe_phone?: string;

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

    id?: number;
    audit_op?: number;
    description?: string;

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

    offset?: number;
    limit?: number;

  [key: string]: unknown
}

export interface OrgTribeBlackUserListResponseData extends OrgTribeBlackUserListData {
  [key: string]: unknown
}

export interface OrgTribeBlackUserListData {

    offset?: number;
    total?: number;
    data?: OrgTribeBlackUserListInfo[];

  [key: string]: unknown
}

export interface OrgTribeBlackUserListInfo {

    id?: number;
    create_time?: string;
    public_reason?: string;
    user_random_id?: number;
    user_name?: string;
    user_avatar?: string;

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

    config?: OrgTribeCheckUpgrAdeConfig;
    check_club_count?: number;
    check_member_count?: number;
    check_room_count?: number;
    tribe_phone_area?: string;
    tribe_phone?: string;
    tribe_phone_create_time?: string;

  [key: string]: unknown
}

export interface OrgTribeCheckUpgrAdeConfig {

    upgrade_switch?: number;
    club_count?: number;
    member_count?: number;
    day_count?: number;
    room_count?: number;
    hand_count?: number;

  [key: string]: unknown
}

// /api/org/tribe/club/fund/gold_change/log (OrgTribeClubFundGoldChangeLog)
export interface OrgTribeClubFundGoldChangeLogRequest {

    limit?: number;
    offset?: number;
    club_id?: number;
    gold_type?: number;
    op_codes?: string[];
    start_time?: number;
    end_time?: number;
    sort_type?: number;
    order_type?: number;

  [key: string]: unknown
}

export interface OrgTribeClubFundGoldChangeLogResponseData extends OrgTribeClubFundGoldChangeLogData {
  [key: string]: unknown
}

export interface OrgTribeClubFundGoldChangeLogData {

    offset?: number;
    list?: OrgTribeClubFundGoldChangeLogRecord[];
    total_info?: OrgTribeClubFundGoldChangeLogTotalInfo;

  [key: string]: unknown
}

export interface OrgTribeClubFundGoldChangeLogTotalInfo {

    grant_amount?: number;
    recover_amount?: number;
    profit_amount?: number;
    change_amount?: number;

  [key: string]: unknown
}

export interface OrgTribeClubFundGoldChangeLogRecord {

    gold_change?: number;
    gold_after?: number;
    create_time?: string;
    op_code?: string;
    name?: string;
    user_random_num?: number;
    user_nick_name?: string;
    src_room_id?: number;
    src_match_id?: number;
    admin_nick_name?: string;
    multi_lang_names_obj?: unknown;

  [key: string]: unknown
}

// /api/org/tribe/club/join/apply (OrgJoinTrip)
export interface OrgJoinTripRequest {
  [key: string]: unknown
}

export interface OrgJoinTripResponseData extends OrgJoinTripData {
  [key: string]: unknown
}

// /api/org/tribe/club/join/apply_list (OrgClubApplyTribeList)
export interface OrgClubApplyTribeListRequest {
  [key: string]: unknown
}

export interface OrgClubApplyTribeListResponseData extends OrgClubApplyTribeListData {
  [key: string]: unknown
}

// /api/org/tribe/club/join/cancel_apply (OrgClubCancleJoinTribe)
export interface OrgClubCancleJoinTribeRequest {
  [key: string]: unknown
}

export interface OrgClubCancleJoinTribeResponseData extends OrgClubCancleJoinTribeData {
  [key: string]: unknown
}

// /api/org/tribe/club/kickout (OrgTribeClubKickOut)
export interface OrgTribeClubKickOutRequest {

    club_id?: number;

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

    search?: string;
    sort_type?: number;
    order_type?: number;
    limit?: number;
    offset?: number;
    filter_type?: number;

  [key: string]: unknown
}

export interface OrgTribeClubListResponseData extends OrgTribeClubListData {
  [key: string]: unknown
}

export interface OrgTribeClubListData {

    limit?: number;
    offset?: number;
    total?: number;
    total_info?: OrgTribeClubListTotalInfo;
    data?: OrgTribeClubListRecord[];

  [key: string]: unknown
}

export interface OrgTribeClubListRecord {

    club_id?: number;
    club_name?: string;
    logo?: string;
    random_id?: number;
    club_members?: number;
    club_status?: number;
    room_game_ratio?: number;
    room_insur_ratio?: number;
    room_mtt_ratio?: number;
    jackpot_ratio?: number;
    profit_total?: number;
    club_gold?: number;
    user_gold?: number;
    tribe_create_time?: string;
    club_subscription_id?: number;

  [key: string]: unknown
}

export interface OrgTribeClubListTotalInfo {

    member_total?: number;
    profit_total?: number;
    total_gold?: number;

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

    data?: OrgTribeClubListAllRecord[];

  [key: string]: unknown
}

export interface OrgTribeClubListAllRecord {

    club_id?: number;
    club_name?: string;

  [key: string]: unknown
}

// /api/org/tribe/club/lock (OrgTribeClubLock)
export interface OrgTribeClubLockRequest {

    club_id?: number;

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

    club_id?: number;
    remark_name?: string;
    remark_desc?: string;

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

    list?: OrgTribeClubRemarkListInfo[];

  [key: string]: unknown
}

export interface OrgTribeClubRemarkListInfo {

    club_id?: number;
    remark_name?: string;
    remark_desc?: string;

  [key: string]: unknown
}

// /api/org/tribe/club/unlock (OrgTribeClubUnlock)
export interface OrgTribeClubUnlockRequest {

    club_id?: number;

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

    tribe_name?: string;
    logo?: string;
    currency?: string;

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

    is_first?: number;

  [key: string]: unknown
}

// /api/org/tribe/fund/gold_change/log (OrgTribeFundGoldChangeLog)
export interface OrgTribeFundGoldChangeLogRequest {

    limit?: number;
    offset?: number;
    gold_type?: number;
    op_codes?: string[];
    start_time?: number;
    end_time?: number;
    sort_type?: number;
    order_type?: number;

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogResponseData extends OrgTribeFundGoldChangeLogData {
  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogData {

    limit?: number;
    offset?: number;
    total?: number;
    list?: OrgTribeFundGoldChangeLogRecord[];
    total_info?: OrgTribeFundGoldChangeLogTotalInfo;
    diamond_info?: OrgTribeFundGoldChangeLogDiamondinfo;
    ratio_info?: OrgTribeFundGoldChangeLogRatioInfo;
    random_id?: number;

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogDiamondinfo {

    consume_amount?: number;
    trans_to_tribe_amount?: number;
    trans_to_user_amount?: number;

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogTotalInfo {

    grant_amount?: number;
    recover_amount?: number;
    profit_amount?: number;

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogRatioInfo {

    service_ratio?: number;
    insur_ratio?: number;

  [key: string]: unknown
}

export interface OrgTribeFundGoldChangeLogRecord {

    gold_change?: number;
    gold_after?: number;
    create_time?: string;
    op_code?: string;
    name?: string;
    club_name?: string;
    club_random_num?: number;
    user_random_num?: number;
    user_nick_name?: string;
    src_room_id?: number;
    src_match_id?: number;

  [key: string]: unknown
}

// /api/org/tribe/info (OrgTribeSearchById)
export interface OrgTribeSearchByIdRequest {
  [key: string]: unknown
}

export interface OrgTribeSearchByIdResponseData extends OrgTribeSearchByIdData {
  [key: string]: unknown
}

// /api/org/tribe/info_by_club (OrgTribeInfoByClub)
export interface OrgTribeInfoByClubRequest {

    tribe_random_id?: number;
    club_id?: number;

  [key: string]: unknown
}

export interface OrgTribeInfoByClubResponseData extends OrgTribeInfoByClubData {
  [key: string]: unknown
}

export interface OrgTribeInfoByClubData {

    tribe_base?: OrgTribeInfoByClubInfo;
    club_relation?: number;

  [key: string]: unknown
}

export interface OrgTribeInfoByClubInfo {

    name?: string;
    random_id?: number;
    logo?: string;

  [key: string]: unknown
}

// /api/org/tribe/list (OrgTribeList)
export interface OrgTribeListRequest {

    tribe_random_id?: number;
    sort_type?: number;
    order_type?: number;

  [key: string]: unknown
}

export interface OrgTribeListResponseData extends OrgTribeListData {
  [key: string]: unknown
}

export interface OrgTribeListData {

    list?: OrgTribeListCommunityData[];

  [key: string]: unknown
}

export interface OrgTribeListCommunityData {

    id?: number;
    random_id?: number;
    name?: string;
    logo?: string;
    pretty_id?: number;
    members?: number;
    room_count?: number;

  [key: string]: unknown
}

// /api/org/tribe/room_permissions (APIOrgTribeRoomPermissions)
export interface APIOrgTribeRoomPermissionsRequest {
  [key: string]: unknown
}

export type APIOrgTribeRoomPermissionsResponseData = unknown

// /api/org/tribe/room_permissions (OrgTribeRoomPermissionS)
export interface OrgTribeRoomPermissionSRequest {

    club_id?: number;
    tribe_id?: number;

  [key: string]: unknown
}

export interface OrgTribeRoomPermissionSResponseData extends OrgTribeRoomPermissionSData {
  [key: string]: unknown
}

export interface OrgTribeRoomPermissionSData {

    room_permissions?: unknown;

  [key: string]: unknown
}

// /api/org/tribe/set/time_zone (OrgTribeSetTimeZone)
export interface OrgTribeSetTimeZoneRequest {

    time_zone?: number;

  [key: string]: unknown
}

export interface OrgTribeSetTimeZoneResponseData {
  [key: string]: unknown
}

// /api/org/tribe/setting/club_profit_ratio (OrgTribeSettIngClubProfitRatio)
export interface OrgTribeSettIngClubProfitRatioRequest {

    club_id?: number;
    room_game_ratio?: number;
    room_insur_ratio?: number;
    room_mtt_ratio?: number;

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

    gold?: number;
    gold_lock?: number;
    forbidden?: boolean;
    usdt?: number;
    usdt_lock?: number;
    diamonds?: number;
    diamonds_lock?: number;
    random_id?: number;

  [key: string]: unknown
}

// /api/org/user/admin/favorite (OrgUserAdminFavorIte)
export interface OrgUserAdminFavorIteRequest {

    club_id?: number;
    tribe_id?: number;
    favorite?: number;

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

    club_id?: number;
    tribe_id?: number;

  [key: string]: unknown
}

export interface OrgUserCheckOrgResponseData extends OrgUserCheckOrgData {
  [key: string]: unknown
}

export interface OrgUserCheckOrgData {

    is_in_club?: boolean;
    is_in_tribe?: boolean;

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

    clubs?: OrgUserClubAdminListClubData[];

  [key: string]: unknown
}

export interface OrgUserClubAdminListClubData {

    id?: number;
    club_name?: string;
    logo?: string;
    random_id?: number;
    club_members?: number;
    tribe_id?: number;
    tribe_random_id?: number;
    user_level?: number;
    favorite?: number;

  [key: string]: unknown
}

// /api/org/user/new_label/read (APIOrgUserNewLabelRead)
export interface APIOrgUserNewLabelReadRequest {
  [key: string]: unknown
}

export interface APIOrgUserNewLabelReadResponseData {
  [key: string]: unknown
}

// /api/org/user/new_label/read (OrgUserNewLabelRead)
export interface OrgUserNewLabelReadRequest {

    tribe_id?: number;

  [key: string]: unknown
}

export interface OrgUserNewLabelReadResponseData {
  [key: string]: unknown
}

// /api/org/user/new_label/read/num (APIOrgUserNewLabelReadNum)
export interface APIOrgUserNewLabelReadNumRequest {
  [key: string]: unknown
}

export interface APIOrgUserNewLabelReadNumResponseData extends APIOrgUserNewLabelReadNumData {
  [key: string]: unknown
}

// /api/org/user/new_label/read/num (OrgUserNewLabelReadNum)
export interface OrgUserNewLabelReadNumRequest {

    tribe_id?: number;

  [key: string]: unknown
}

export interface OrgUserNewLabelReadNumResponseData extends OrgUserNewLabelReadNumData {
  [key: string]: unknown
}

export interface OrgUserNewLabelReadNumData {

    user_new_label_num?: unknown;

  [key: string]: unknown
}

// /api/org/user/self_profit/bill_notify/confim (OrgUserSelfProfitBillNotifyConfim)
export interface OrgUserSelfProfitBillNotifyConfimRequest {

    bill_ids?: number[];

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

    data?: OrgUserSelfProfitBillUnnotIfyBillData[];

  [key: string]: unknown
}

export interface OrgUserSelfProfitBillUnnotIfyBillData {

    amount?: number;
    bill_id?: number;

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

    data?: OrgUserSelfProfitUnpayRecordsRecord[];
    amount_total_uc?: number;
    latest_pay_time?: number;

  [key: string]: unknown
}

export interface OrgUserSelfProfitUnpayRecordsRecord {

    amount?: number;
    pay_time?: number;
    club_name?: string;
    club_rid?: number;
    club_logo?: string;

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

    tribes?: OrgUserTribeAdminListCommunityData[];

  [key: string]: unknown
}

export interface OrgUserTribeAdminListCommunityData {

    id?: number;
    random_id?: number;
    name?: string;
    club_count?: number;
    logo?: string;
    favorite?: number;

  [key: string]: unknown
}

export interface OrgClubIsMangerData {
    info?: OrgClubIsMangerInfo;

  [key: string]: unknown
}

export interface OrgClubIsMangerDataCombine {
    admins?: OrgClubIsMangerInfo[];

  [key: string]: unknown
}

export interface OrgClubIsMangerInfo {
    club_id?: number;
    create_room?: number;
    club_manage?: number;
    member_manage?: number;
    fund_manage?: number;
    get_data?: number;

  [key: string]: unknown
}

export interface ClubAgentUserListData {
    limit?: number;
    total?: number;
    offset?: number;
    total_info?: ClubAgentUserListTotalInfo;
    data?: ClubAgentUserListRecord[];

  [key: string]: unknown
}

export interface ClubAgentUserListRecord {
    user_id?: number;
    random_num?: number;
    nick_name?: string;
    avatar?: string;
    follow_user_count?: number;
    remark_name?: string;
    user_level?: number;
    gold?: number;
    user_service_ratio?: number;
    user_mtt_ratio?: number;
    rb_type?: number;
    rb_interval_type?: number;
    rb_interval_no?: number;
    rb_cyclic_type?: number;
    rb_cyclic_day?: number;
    club_gold_credit?: number;
    club_gold_credit_limit?: number;
    diamonds?: number;
    freeze_status?: number;

  [key: string]: unknown
}

export interface ClubAgentUserListTotalInfo {
    total_gold?: number;

  [key: string]: unknown
}

export interface ClubUserWalletData {
    golds?: number;
    gold_lock?: number;
    usdt?: number;
    usdt_lock?: number;
    forbidden?: boolean;
    gold_to_usdt_rate?: number;
    usdt_to_gold_rate?: number;
    club_gold_credit?: number;
    club_gold_credit_limit?: number;

  [key: string]: unknown
}

export interface OrgClubCreateData {
    ClubSwitchStatus?: number;

  [key: string]: unknown
}

export interface OrgClubGoldData {
    org_id?: number;
    gold?: number;
    gold_lock?: number;
    usdt?: number;
    usdt_lock?: number;
    forbidden?: boolean;
    gold_to_usdt_rate?: number;
    usdt_to_gold_rate?: number;
    diamond?: number;
    members_gold?: number;
    club_credit_limit_total?: number;
    club_credit_total?: number;
    members_table_gold?: number;

  [key: string]: unknown
}

export interface ClubFundChangeLogData {
    limit?: number;
    offset?: number;
    total?: number;
    list?: ClubFundChangeLogRecord[];
    total_info?: ClubFundChangeLogTotalInfo;
    ratio_info?: ClubFundChangeLogRatioInfo;

  [key: string]: unknown
}

export interface ClubFundChangeLogTotalInfo {
    grant_amount?: number;
    recover_amount?: number;
    profit_amount?: number;
    change_amount?: number;

  [key: string]: unknown
}

export interface ClubFundChangeLogRatioInfo {
    service_ratio?: number;
    insur_ratio?: number;
    cowboy_ratio?: number;
    prop_ratio?: number;
    mtt_ratio?: number;

  [key: string]: unknown
}

export interface ClubFundChangeLogRecord {
    gold_change?: number;
    gold_after?: number;
    create_time?: string;
    user_random_num?: number;
    user_nick_name?: string;
    admin_random_num?: number;
    admin_nick_name?: string;
    src_nick_name?: string;
    src_random_id?: number;
    src_room_id?: number;
    src_match_id?: number;
    name?: string;
    multi_lang_names_obj?: unknown;
    op_code?: string;
    src_type?: number;
    gold_type?: number;
    op_nick_name?: string;
    op_random_id?: number;

  [key: string]: unknown
}

export interface OrgClubData {
    club_id?: number;
    club_name?: string;
    logo?: string;
    random_id?: number;
    upper_limit?: number;
    club_members?: number;
    area_id?: string;
    create_time?: string;
    desc?: string;
    more_contact?: string;
    level?: number;
    tables?: number;
    club_creator_random_id?: number;
    club_creator_avatar?: string;
    club_creator_nickname?: string;
    tribe_name?: string;
    search_switch?: number;
    auto_audit_switch?: number;
    show_contact_switch?: number;
    show_notice_switch?: number;
    user_level?: number;
    tribe_id?: number;
    tribe_random_id?: number;
    tribe_logo?: string;
    contact_info?: OrgClubSearchByIdContactInfo;
    user_gold?: number;
    user_ustd?: number;
    friend_total?: number;
    digital_wallet_switch?: number;
    digital_wallet_erc?: string;
    digital_wallet_trc?: string;
    grant_switch?: number;
    pretty_id?: number;
    first_update_name?: number;
    last_update_name_time?: string;
    welcomes?: string;
    welcomes_switch?: number;
    max_user_service_ratio?: number;
    max_user_mtt_ratio?: number;
    member_detail_type?: number;
    currency_exchange?: number;
    currency?: string;
    master_type?: number;
    banner?: string;
    fantasy_room_switch?: number;
    uc_deposit_advance?: number;
    banner_audit?: number;
    club_subscription_id?: number;
    club_subscription?: OrgClubSearchByIdClubVipInfo;
    member_type?: number;
    user_credit?: number;
    club_gold_credit_limit?: number;
    user_club_forbidden?: boolean;
    room_permissions?: unknown;
    new_labels?: unknown;
    club_user_wallet_switch?: number;
    prologue?: string;
    prologue_switch?: number;
    agent_uc_switch?: number;
    support_im_rid?: string;
    support_user_id?: number;
    deposit_switch?: number;
    security_deposit?: number;
    freeze_status?: number;

  [key: string]: unknown
}

export interface OrgClubSearchByIdClubVipInfo {
    club_subscription_id?: number;
    club_subscription_name?: string;
    club_subscription_logo?: string;
    max_share_table_num?: number;
    pop_window_permission?: number;
    join_club_auto_audit_permission?: number;
    digital_wallet_permission?: number;
    free_anti_cheating_audio?: number;
    free_anti_cheating_video?: number;
    free_anti_cheating_face?: number;
    free_up_table_num?: number;
    game_limit_ip_permission?: number;
    game_limit_gps_permission?: number;
    game_limit_safe_permission?: number;
    self_game_permission?: number;
    aof_permission?: number;
    auto_shut_table_permission?: number;
    straddle_permission?: number;
    second_public_card_permission?: number;
    insurance_permission?: number;
    current_share_table_num?: number;
    used_free_anti_cheating_audio?: number;
    used_free_anti_cheating_video?: number;
    used_ree_anti_cheating_face?: number;
    used_free_up_table_num?: number;
    last_club_subscription_id?: number;
    last_club_subscription_name?: string;
    club_subscription_price_type?: number;
    club_subscription_end_time?: number;
    last_club_subscription_status?: number;
    free_change_club_name?: number;
    used_free_change_club_name?: number;
    room_check_pool_rate?: number;
    room_limit_hand?: number;
    room_force_show_card?: number;
    room_random_seat?: number;
    room_only_ios?: number;
    room_delay_view_card?: number;
    room_total_hand_limit?: number;

  [key: string]: unknown
}

export interface OrgClubSearchByIdContactInfo {
    telegram?: string;

  [key: string]: unknown
}

export interface OrgClubGetJoinlListData {
    offset?: number;
    data?: OrgClubGetJoinlListRecord[];

  [key: string]: unknown
}

export interface OrgClubGetJoinlListRecord {
    id?: number;
    club_id?: number;
    club_name?: string;
    logo?: string;
    nickname?: string;
    avatar?: string;
    user_random_id?: number;
    create_time?: string;

  [key: string]: unknown
}

export interface OrgClubLevelBenefitData {
    data?: OrgClubLevelBenefitRecord[];

  [key: string]: unknown
}

export interface OrgClubLevelBenefitRecord {
    club_level?: number;
    user_num?: number;
    level_count?: number;
    level_duration?: number;
    limit_type?: number;

  [key: string]: unknown
}

export interface OrgClubLevelInfoData {
    data?: OrgClubLevelInfoRecord;

  [key: string]: unknown
}

export interface OrgClubLevelInfoRecord {
    level?: number;
    up_level_time?: string;
    limit_type?: number;

  [key: string]: unknown
}

export interface OrgMemberListData {
    limit?: number;
    offset?: number;
    total?: number;
    total_info?: OrgMemberListTotalInfo;
    agent_list?: OrgMemberListAgencyInfo[];
    data?: OrgMemberListRecord[];

  [key: string]: unknown
}

export interface OrgMemberListAgencyInfo {
    user_id?: number;
    nick_name?: string;
    remark_name?: string;

  [key: string]: unknown
}

export interface OrgMemberListRecord {
    user_id?: number;
    random_num?: number;
    nick_name?: string;
    avatar?: string;
    club_member_type?: number;
    freeze_status?: number;
    agent_nick_name?: string;
    agent_random_id?: number;
    follow_user_count?: number;
    remark_name?: string;
    user_level?: number;
    gold?: number;
    usdt?: number;
    last_login_time_str?: string;
    user_service_ratio?: number;
    user_mtt_ratio?: number;
    club_name?: string;
    club_remark_name?: string;
    club_remark_color?: string;
    club_id?: number;
    rb_type?: number;
    rb_interval_type?: number;
    rb_interval_no?: number;
    rb_cyclic_type?: number;
    rb_cyclic_day?: number;
    is_boss?: number;
    club_gold_credit?: number;
    club_gold_credit_limit?: number;
    diamonds?: number;
    user_grade_level?: number;

  [key: string]: unknown
}

export interface OrgMemberListTotalInfo {
    total_gold?: number;

  [key: string]: unknown
}

export interface OrgClubUserInfoData {
    club_id?: number;
    create_time?: string;
    agent_user_id?: number;
    user_service_ratio?: number;
    user_mtt_ratio?: number;
    remark_name?: string;
    remark_desc?: string;
    user_level?: number;
    user_info?: OrgClubUserInfoUserInfo;
    freeze_status?: number;
    uc_deposit_advance?: number;
    club_gold_credit?: number;
    club_gold_credit_limit?: number;

  [key: string]: unknown
}

export interface OrgClubUserInfoUserInfo {
    user_id?: number;
    random_id?: number;
    nickname?: string;
    avatar?: string;
    gold?: number;
    usdt?: number;
    user_grade_level?: number;
    user_grade_tags?: string;
    online_time_today?: number;
    online_time_daily_7_days?: number;
    hand_number_today?: number;
    hand_number_daily_7_days?: number;
    recharge_today?: number;
    recharge_daily_7_days?: number;

  [key: string]: unknown
}

export interface OrgClubPlayerApplyListData {
    limit?: number;
    offset?: number;
    items?: OrgClubPlayerApplyListDataElement[];

  [key: string]: unknown
}

export interface OrgClubPlayerApplyListDataElement {
    id?: number;
    random_id?: number;
    club_name?: string;
    logo?: string;
    club_members?: number;
    pretty_id?: number;

  [key: string]: unknown
}

export interface ClubJoinListData {
    limit?: number;
    offset?: number;
    items?: ClubJoinListDataElement[];

  [key: string]: unknown
}

export interface ClubJoinListDataElement {
    id?: number;
    random_id?: number;
    club_name?: string;
    logo?: string;
    club_members?: number;
    pretty_id?: number;

  [key: string]: unknown
}

export interface OrgClubApplyTribeListData {
    limit?: number;
    offset?: number;
    list?: OrgClubApplyTribeListDataElement[];

  [key: string]: unknown
}

export interface OrgClubApplyTribeListDataElement {
    id?: number;
    tribe_name?: string;
    logo?: string;
    tribe_random_id?: number;

  [key: string]: unknown
}

export interface OrgTribeSearchByIdData {
    random_id?: number;
    bring_in_auto_switch?: number;
    room_permissions?: unknown;

  [key: string]: unknown
}

export interface APIOrgUserNewLabelReadNumData {
    user_new_label_num?: unknown;

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

export interface OrgchaNgeClubDataData {
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

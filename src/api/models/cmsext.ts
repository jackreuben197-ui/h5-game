// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/cmsext

// /api/cmsext/activity/club/add (CmsExtActivityClubAdd)
export interface CmsExtActivityClubAddRequest {

    activity_type?: number;
    description?: string;
    img_url?: string;
    home_img_url?: string;
    start_time?: number;
    end_time?: number;
    sort?: number;

  [key: string]: unknown
}

export interface CmsExtActivityClubAddResponseData {
  [key: string]: unknown
}

export interface CmsExtActivityClubAddData {
  [key: string]: unknown
}

// /api/cmsext/activity/club/admin_list (CmsExtActivityClubAdminList)
export interface CmsExtActivityClubAdminListRequest {
  [key: string]: unknown
}

export interface CmsExtActivityClubAdminListResponseData extends CmsExtActivityClubAdminListData {
  [key: string]: unknown
}

export interface CmsExtActivityClubAdminListData {

    list?: CmsExtActivityClubAdminListInfo[];

  [key: string]: unknown
}

export interface CmsExtActivityClubAdminListInfo {

    img_url?: string;
    start_time?: string;
    end_time?: string;
    publish?: number;
    home_img_url?: string;
    sort?: number;
    audit_status?: number;

  [key: string]: unknown
}

// /api/cmsext/activity/club/info (OrgClubActivityInfo)
export interface OrgClubActivityInfoRequest {
  [key: string]: unknown
}

export interface OrgClubActivityInfoResponseData {
  [key: string]: unknown
}

// /api/cmsext/activity/club/my_list (CmsExtActivityClubMyList)
export interface CmsExtActivityClubMyListRequest {
  [key: string]: unknown
}

export interface CmsExtActivityClubMyListResponseData extends CmsExtActivityClubMyListData {
  [key: string]: unknown
}

export interface CmsExtActivityClubMyListData {

    list?: CmsExtActivityClubMyListInfo[];

  [key: string]: unknown
}

export interface CmsExtActivityClubMyListInfo {

    description?: string;
    img_url?: string;
    start_time?: string;
    end_time?: string;
    publish?: number;
    home_img_url?: string;
    sort?: number;
    audit_status?: number;

  [key: string]: unknown
}

// /api/cmsext/activity/club/update (OrgClubActivityCreate)
export interface OrgClubActivityCreateRequest {

  //     club_id: number,  //
  //     activity_type: number,  //
  //     description: string,
  //     img_url: string,
  //
  [key: string]: unknown
}

export interface OrgClubActivityCreateResponseData {
  [key: string]: unknown
}

// /api/cmsext/club/notice (OrgClubNotice)
export interface OrgClubNoticeRequest {
  [key: string]: unknown
}

export interface OrgClubNoticeResponseData extends OrgClubNoticeData {
  [key: string]: unknown
}

// /api/cmsext/club/notice_get (OrgClubNoticeGet)
export interface OrgClubNoticeGetRequest {
  [key: string]: unknown
}

export interface OrgClubNoticeGetResponseData extends OrgClubNoticeGetData {
  [key: string]: unknown
}

// /api/cmsext/club/notice_update (OrgClubNoticeUpdate)
export interface OrgClubNoticeUpdateRequest {
  [key: string]: unknown
}

export interface OrgClubNoticeUpdateResponseData extends OrgClubNoticeUpdateData {
  [key: string]: unknown
}

// /api/cmsext/club/share/{0}/list (CmsExtClubShare0List)
export interface CmsExtClubShare0ListRequest {

    limit?: number;
    offset?: number;

  [key: string]: unknown
}

export interface CmsExtClubShare0ListResponseData extends CmsExtClubShare0ListData {
  [key: string]: unknown
}

export interface CmsExtClubShare0ListData {

    data?: CmsExtClubShare0ListShareTableData[];
    limit?: number;
    offset?: number;
    total?: number;

  [key: string]: unknown
}

export interface CmsExtClubShare0ListShareTableData {

    id?: number;
    create_time?: string;
    apply_club_random_id?: number;
    apply_club_name?: string;
    apply_club_logo?: string;
    share_club_name?: string;
    share_club_logo?: string;
    sb?: number;
    private_room?: number;
    ante?: number;
    seat_count?: number;
    play_duration?: number;
    game_type?: number;
    poker_type?: number;
    squid_base?: number;
    mushroom_base?: number;

  [key: string]: unknown
}

// /api/cmsext/club/share/apply/list (OrgClubShareApplyList)
export interface OrgClubShareApplyListRequest {
  [key: string]: unknown
}

export interface OrgClubShareApplyListResponseData {
  [key: string]: unknown
}

// /api/cmsext/club/share/approve/list (OrgClubShareApproveList)
export interface OrgClubShareApproveListRequest {
  [key: string]: unknown
}

export interface OrgClubShareApproveListResponseData {
  [key: string]: unknown
}

// /api/cmsext/club/share/approve/list (MttUserWallet)
export interface MttUserWalletRequest {
  [key: string]: unknown
}

export interface MttUserWalletResponseData {
  [key: string]: unknown
}

// /api/cmsext/club/share/audit (OrgClubShareAudit)
export interface OrgClubShareAuditRequest {
  [key: string]: unknown
}

export interface OrgClubShareAuditResponseData extends OrgClubShareAuditData {
  [key: string]: unknown
}

// /api/cmsext/club/share/pending/list (OrgClubSharePendingList)
export interface OrgClubSharePendingListRequest {
  [key: string]: unknown
}

export interface OrgClubSharePendingListResponseData {
  [key: string]: unknown
}

// /api/cmsext/club/user/notice_ignore (OrgClubNoticeIgnore)
export interface OrgClubNoticeIgnoreRequest {
  [key: string]: unknown
}

export interface OrgClubNoticeIgnoreResponseData extends OrgClubNoticeIgnoreData {
  [key: string]: unknown
}

// /api/cmsext/exchange/ticket/create (TicketCreate)
export interface TicketCreateRequest {

  //     user_id: number,// 玩家ID
  //     user_random_id: number,// 玩家randomID
  //     phone: number,// 电话
  //     email: string,// 邮箱
  //     ticket_type: number,// 问题类型
  //     description: string,//  问题描述
  //     img_url: string,//  图片描述
  //
  [key: string]: unknown
}

export interface TicketCreateResponseData {
  [key: string]: unknown
}

// /api/cmsext/hot_update/template/list (CmsExtHotUpdateTemplateList)
export interface CmsExtHotUpdateTemplateListRequest {

    last_update_time?: number;

  [key: string]: unknown
}

export interface CmsExtHotUpdateTemplateListResponseData extends CmsExtHotUpdateTemplateListData {
  [key: string]: unknown
}

export interface CmsExtHotUpdateTemplateListData {

    data?: unknown[];
    last_update_time?: number;

  [key: string]: unknown
}

// /api/cmsext/im/service/link (CmsExtImServiceLink)
export interface CmsExtImServiceLinkRequest {

    im_service_no?: string;
    language?: string;
    im_service_type?: number;

  [key: string]: unknown
}

export interface CmsExtImServiceLinkResponseData extends CmsExtImServiceLinkData {
  [key: string]: unknown
}

export interface CmsExtImServiceLinkData {

    im_link?: string;

  [key: string]: unknown
}

// /api/cmsext/im/service/list (CmsExtImServiceList)
export interface CmsExtImServiceListRequest {

    im_service_type?: number;

  [key: string]: unknown
}

export type CmsExtImServiceListResponseData = CmsExtImServiceListData[]

export interface CmsExtImServiceListData {

    im_service_no?: string;
    service_begin_time?: number;
    service_end_time?: number;

  [key: string]: unknown
}

// /api/cmsext/mini_game/club/config/create (CmsExtMiniGameClubConfigCreate)
export interface CmsExtMiniGameClubConfigCreateRequest {

    name?: string;
    room_config?: unknown;

  [key: string]: unknown
}

export interface CmsExtMiniGameClubConfigCreateResponseData extends CmsExtMiniGameClubConfigCreateData {
  [key: string]: unknown
}

export interface CmsExtMiniGameClubConfigCreateData {
  [key: string]: unknown
}

// /api/cmsext/mini_game/config/create (CmsExtMiniGameConfigCreate)
export interface CmsExtMiniGameConfigCreateRequest {

    name?: string;
    room_config?: unknown;

  [key: string]: unknown
}

export interface CmsExtMiniGameConfigCreateResponseData extends CmsExtMiniGameConfigCreateData {
  [key: string]: unknown
}

export interface CmsExtMiniGameConfigCreateData {

    room_id?: number;
    room_config?: unknown;

  [key: string]: unknown
}

// /api/cmsext/mini_game/tribe/config/create (CmsExtMiniGameTribeConfigCreate)
export interface CmsExtMiniGameTribeConfigCreateRequest {

    name?: string;
    room_config?: unknown;

  [key: string]: unknown
}

export interface CmsExtMiniGameTribeConfigCreateResponseData extends CmsExtMiniGameTribeConfigCreateData {
  [key: string]: unknown
}

export interface CmsExtMiniGameTribeConfigCreateData {
  [key: string]: unknown
}

// /api/cmsext/mtt/config/create (CmsExtMttConfigCreate)
export interface CmsExtMttConfigCreateRequest {

    template?: unknown;
    enter_before?: number;
    start_time?: number;
    apply_time?: number;
    create_mtt?: boolean;

  [key: string]: unknown
}

export interface CmsExtMttConfigCreateResponseData {
  [key: string]: unknown
}

// /api/cmsext/mtt/create (CmsExtMttCreate)
export interface CmsExtMttCreateRequest {

    template_id?: number;
    enter_before?: number;
    start_time?: number;
    apply_time?: number;

  [key: string]: unknown
}

export interface CmsExtMttCreateResponseData {
  [key: string]: unknown
}

export interface CmsExtMttCreateData {
  [key: string]: unknown
}

// /api/cmsext/mtt/template/create (CmsExtMttTemplateCreate)
export interface CmsExtMttTemplateCreateRequest {

    template?: unknown;
    enter_before?: number;
    start_time?: number;
    apply_time?: number;
    create_mtt?: boolean;

  [key: string]: unknown
}

export interface CmsExtMttTemplateCreateResponseData {
  [key: string]: unknown
}

// /api/cmsext/mtt/template/delete/{id} (CmsExtMttTemplateDeleteId)
export interface CmsExtMttTemplateDeleteIdRequest {
  [key: string]: unknown
}

export interface CmsExtMttTemplateDeleteIdResponseData {
  [key: string]: unknown
}

// /api/cmsext/mtt/template/list (CmsExtMttTemplateList)
export interface CmsExtMttTemplateListRequest {

    limit?: number;
    offset?: number;
    game_type?: number[];
    poker_type?: number[];
    origin_type?: number;
    search?: string;
    week_switch?: number;

  [key: string]: unknown
}

export interface CmsExtMttTemplateListResponseData extends CmsExtMttTemplateListData {
  [key: string]: unknown
}

export interface CmsExtMttTemplateListData {

    limit?: number;
    offset?: number;
    total?: number;
    templates?: unknown[];

  [key: string]: unknown
}

// /api/cmsext/mtt/template/update (CmsExtMttTemplateUpdate)
export interface CmsExtMttTemplateUpdateRequest {

    template?: unknown;
    enter_before?: number;
    start_time?: number;
    apply_time?: number;
    create_mtt?: boolean;

  [key: string]: unknown
}

export interface CmsExtMttTemplateUpdateResponseData {
  [key: string]: unknown
}

// /api/cmsext/mtt/template/week_switch/update (CmsExtMttTemplateWeekSwitchUpdate)
export interface CmsExtMttTemplateWeekSwitchUpdateRequest {

    template_id?: number;
    week_switch?: number;

  [key: string]: unknown
}

export interface CmsExtMttTemplateWeekSwitchUpdateResponseData {
  [key: string]: unknown
}

// /api/cmsext/room/club/batch/create (OrgRoomBatchCreate)
export interface OrgRoomBatchCreateRequest {
  [key: string]: unknown
}

export type OrgRoomBatchCreateResponseData = number

// /api/cmsext/room/club/config/create (OrgRoomClubCreate)
export interface OrgRoomClubCreateRequest {
  [key: string]: unknown
}

export interface OrgRoomClubCreateResponseData extends OrgRoomClubCreateData {
  [key: string]: unknown
}

// /api/cmsext/room/config/create (OrgRoomConfigCreate)
export interface OrgRoomConfigCreateRequest {
  [key: string]: unknown
}

export interface OrgRoomConfigCreateResponseData extends OrgRoomConfigCreateData {
  [key: string]: unknown
}

// /api/cmsext/room/create (OrgRoomCreate)
export interface OrgRoomCreateRequest {
  [key: string]: unknown
}

export interface OrgRoomCreateResponseData extends OrgRoomCreateData {
  [key: string]: unknown
}

// /api/cmsext/room/fixed/config (OrggetRoomConfig)
export interface OrggetRoomConfigRequest {
  [key: string]: unknown
}

export interface OrggetRoomConfigResponseData {
  [key: string]: unknown
}

// /api/cmsext/room/small_blind/ante (CmsExtRoomSmallBlindAnte)
export interface CmsExtRoomSmallBlindAnteRequest {
  [key: string]: unknown
}

export type CmsExtRoomSmallBlindAnteResponseData = CmsExtRoomSmallBlindAnteData[]

export interface CmsExtRoomSmallBlindAnteData {

    key?: number;
    value?: number[];

  [key: string]: unknown
}

// /api/cmsext/room/template/{0} (CmsExtRoomTemplate0)
export interface CmsExtRoomTemplate0Request {
  [key: string]: unknown
}

export interface CmsExtRoomTemplate0ResponseData extends CmsExtRoomTemplate0Data {
  [key: string]: unknown
}

export interface CmsExtRoomTemplate0Data {

    data?: unknown;

  [key: string]: unknown
}

// /api/cmsext/room/template/create (OrgCreateTemplate)
export interface OrgCreateTemplateRequest {
  [key: string]: unknown
}

export interface OrgCreateTemplateResponseData {
  [key: string]: unknown
}

// /api/cmsext/room/template/delete (OrgTemplateDelete)
export interface OrgTemplateDeleteRequest {
  [key: string]: unknown
}

export interface OrgTemplateDeleteResponseData extends OrgTemplateDeleteData {
  [key: string]: unknown
}

// /api/cmsext/room/template/list (OrggetTemplate)
export interface OrggetTemplateRequest {
  [key: string]: unknown
}

export interface OrggetTemplateResponseData extends OrggetTemplateData {
  [key: string]: unknown
}

// /api/cmsext/room/template/status (CmsExtRoomTemplateStatus)
export interface CmsExtRoomTemplateStatusRequest {

    id?: number;
    status?: number;

  [key: string]: unknown
}

export interface CmsExtRoomTemplateStatusResponseData extends CmsExtRoomTemplateStatusData {
  [key: string]: unknown
}

export interface CmsExtRoomTemplateStatusData {
  [key: string]: unknown
}

// /api/cmsext/room/template/update (OrgUpdateTemplate)
export interface OrgUpdateTemplateRequest {
  [key: string]: unknown
}

export interface OrgUpdateTemplateResponseData extends OrgUpdateTemplateData {
  [key: string]: unknown
}

// /api/cmsext/room/tribe/config/create (CmsExtRoomTribeConfigCreate)
export interface CmsExtRoomTribeConfigCreateRequest {

    name?: string;
    room_config?: unknown;

  [key: string]: unknown
}

export interface CmsExtRoomTribeConfigCreateResponseData extends CmsExtRoomTribeConfigCreateData {
  [key: string]: unknown
}

export interface CmsExtRoomTribeConfigCreateData {

    room_id?: number;
    room_config?: unknown;

  [key: string]: unknown
}

// /api/cmsext/room/user/batch/create (CmsExtRoomUserBatchCreate)
export interface CmsExtRoomUserBatchCreateRequest {
  [key: string]: unknown
}

export type CmsExtRoomUserBatchCreateResponseData = number

export interface CmsExtRoomUserBatchCreateInfo {

    template_id?: number;
    count?: number;

  [key: string]: unknown
}

// /api/cmsext/room/user/template/list (CmsExtRoomUserTemplateList)
export interface CmsExtRoomUserTemplateListRequest {

    mode?: number;
    limit?: number;
    offset?: number;
    bombpot?: number[];
    game_type_arr?: number[];
    poker_type?: number[];

  [key: string]: unknown
}

export interface CmsExtRoomUserTemplateListResponseData extends CmsExtRoomUserTemplateListData {
  [key: string]: unknown
}

export interface CmsExtRoomUserTemplateListData {
  [key: string]: unknown
}

// /api/cmsext/sng/club/config/create (CmsExtSngClubConfigCreate)
export interface CmsExtSngClubConfigCreateRequest {
  [key: string]: unknown
}

export interface CmsExtSngClubConfigCreateResponseData {
  [key: string]: unknown
}

// /api/cmsext/sng/config/create (CmsExtSngConfigCreate)
export interface CmsExtSngConfigCreateRequest {

    name?: string;
    anti_cheat_order_mic_type?: number;
    anti_cheat_order_type?: number;
    anti_cheat_type?: number;
    anti_cheat_video_type?: number;
    apply_fee_hunter?: number;
    apply_fee_pool?: number;
    apply_fee_service?: number;
    blindtable_type?: number;
    end_time?: number;
    game_icon?: string;
    game_play_type?: number;
    game_type?: number;
    initial_score?: number;
    limit_auto_check_times?: number;
    limit_auto_fold_times?: number;
    limit_buy_in?: number;
    limit_delay_times?: number;
    limit_participants?: number;
    op_duration?: number;
    plo_game_type?: number;
    prize_type?: number;
    prizes?: CmsExtSngConfigCreatePrize[];
    start_time?: number;
    upblind_interval?: number;
    video_verify_type?: number;
    blind_level_delay_time_table?: unknown[];
    delay_time_type?: number;
    max_delay_times?: number;

  [key: string]: unknown
}

export interface CmsExtSngConfigCreateResponseData extends CmsExtSngConfigCreateData {
  [key: string]: unknown
}

export interface CmsExtSngConfigCreatePrize {

    award_ratio?: number;
    rank_max?: number;
    rank_min?: number;
    award?: number;

  [key: string]: unknown
}

export interface CmsExtSngConfigCreateData {
  [key: string]: unknown
}

// /api/cmsext/sng/tribe/config/create (CmsExtSngTribeConfigCreate)
export interface CmsExtSngTribeConfigCreateRequest {
  [key: string]: unknown
}

export interface CmsExtSngTribeConfigCreateResponseData {
  [key: string]: unknown
}

// /api/cmsext/user/complaint/report (CmsExtUserComplaIntReport)
export interface CmsExtUserComplaIntReportRequest {

    type?: number;
    room_id?: number;
    match_id?: number;
    hand_num?: number;
    room_unique_id?: string;
    content?: string;
    user_game_record_id?: number;

  [key: string]: unknown
}

export interface CmsExtUserComplaIntReportResponseData extends CmsExtUserComplaIntReportData {
  [key: string]: unknown
}

export interface CmsExtUserComplaIntReportData {
  [key: string]: unknown
}

// /api/cmsext/wheel/template/list (CmsExtWheelTemplateList)
export interface CmsExtWheelTemplateListRequest {

    limit?: number;
    offset?: number;
    ids?: number[];
    status?: number;
    club_id?: number;
    tribe_id?: number;
    all_room_template?: number;
    all_manual_room?: number;

  [key: string]: unknown
}

export interface CmsExtWheelTemplateListResponseData extends CmsExtWheelTemplateListData {
  [key: string]: unknown
}

export interface CmsExtWheelTemplateListData {

    data?: unknown[];
    limit?: number;
    offset?: number;
    total?: number;

  [key: string]: unknown
}

export interface OrgClubNoticeData {
    info?: OrgClubNoticeRecord;

  [key: string]: unknown
}

export interface OrgClubNoticeRecord {
    id?: number;
    club_id?: number;
    title?: string;
    content?: string;
    start_time?: string;
    end_time?: string;
    tribe_id?: number;
    tribe_name?: string;
    tribe_notice_switch?: number;
    tribe_notice_title?: string;
    tribe_notice?: string;

  [key: string]: unknown
}

export interface OrgClubNoticeGetData {
    info?: OrgClubNoticeGetRecord;

  [key: string]: unknown
}

export interface OrgClubNoticeGetRecord {
    id?: number;
    club_id?: number;
    title?: string;
    content?: string;
    start_time?: string;
    end_time?: string;

  [key: string]: unknown
}

export interface OrgRoomBatchCreateInfo {
    template_id?: number;
    count?: number;
    ante?: number;
    sb?: number;

  [key: string]: unknown
}

export interface OrgRoomClubCreateData {
    room_id?: number;
    room_config?: RoomConfigResponse;

  [key: string]: unknown
}

export interface OrgRoomConfigCreateData {
    room_id?: number;
    room_config?: RoomConfigResponse;

  [key: string]: unknown
}

export interface OrgRoomCreateData {
    room_id?: number;
    room_config?: RoomConfigResponse;

  [key: string]: unknown
}

export interface OrggetTemplateData {
    limit?: number;
    offset?: number;
    total?: number;
    data?: RoomConfigRequest[];

  [key: string]: unknown
}

export interface OrgClubNoticeUpdateData {
  [key: string]: unknown
}

export interface OrgClubShareAuditData {
  [key: string]: unknown
}

export interface OrgClubNoticeIgnoreData {
  [key: string]: unknown
}

export interface OrgTemplateDeleteData {
  [key: string]: unknown
}

export interface OrgUpdateTemplateData {
  [key: string]: unknown
}

export interface RoomConfigResponse {
  [key: string]: unknown
}

export interface RoomConfigRequest {
  [key: string]: unknown
}


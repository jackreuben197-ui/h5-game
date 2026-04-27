// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/misc

// /api/misc/agora/token (MiscAgoraToken)
export interface MiscAgoraTokenRequest {

    channel_name?: string;
    role?: number;

  [key: string]: unknown
}

export interface MiscAgoraTokenResponseData {

    data?: string;

  [key: string]: unknown
}

// /api/misc/article/{id} (MiscArtiCleId)
export interface MiscArtiCleIdRequest {

    limit?: number;
    offset?: number;

  [key: string]: unknown
}

export interface MiscArtiCleIdResponseData {

    data?: MiscArtiCleIdData;

  [key: string]: unknown
}

export interface MiscArtiCleIdData {

    article?: MiscArtiCleIdRecord;

  [key: string]: unknown
}

export interface MiscArtiCleIdRecord {

    content_ex?: MiscArtiCleIdContentData[];

  [key: string]: unknown
}

export interface MiscArtiCleIdContentData {

    type?: string;
    value?: string;

  [key: string]: unknown
}

// /api/misc/article/info (MiscArtiCleInfo)
export interface MiscArtiCleInfoRequest {

    lang?: string;
    type?: number;

  [key: string]: unknown
}

export interface MiscArtiCleInfoResponseData {

    data?: MiscArtiCleInfoData;

  [key: string]: unknown
}

export interface MiscArtiCleInfoData {

    article?: MiscArtiCleInfoArticle;

  [key: string]: unknown
}

export interface MiscArtiCleInfoArticle {

    content_ex?: MiscArtiCleInfoContentData[];

  [key: string]: unknown
}

export interface MiscArtiCleInfoContentData {

    value?: string;

  [key: string]: unknown
}

// /api/misc/article/list (MiscArtiCleList)
export interface MiscArtiCleListRequest {

    type?: number;
    limit?: number;
    offset?: number;
    lang?: string;

  [key: string]: unknown
}

export interface MiscArtiCleListResponseData {

    data?: MiscArtiCleListData;

  [key: string]: unknown
}

export interface MiscArtiCleListData {

    limit?: number;
    offset?: number;
    total?: number;
    list?: MiscArtiCleListRecord[];

  [key: string]: unknown
}

export interface MiscArtiCleListRecord {

    id?: number;
    title?: string;
    publish_time?: string;
    author?: string;
    lang?: string;
    summary?: string;
    banner_url?: string;
    read_num?: number;
    repost_num?: number;
    like_num?: number;
    author_url?: string;
    images_url?: string;
    content?: string;

  [key: string]: unknown
}

export interface MiscArtiCleListContentData {

    type?: string;
    value?: string;

  [key: string]: unknown
}

// /api/misc/article/num/set (MiscArtiClenumSet)
export interface MiscArtiClenumSetRequest {

    id?: number;
    read_num?: number;
    repost_num?: number;
    like_num?: number;

  [key: string]: unknown
}

export interface MiscArtiClenumSetResponseData {
  [key: string]: unknown
}

// /api/misc/article/push/list (MiscArtiClePushList)
export interface MiscArtiClePushListRequest {

    types?: number[];
    limit?: number;
    offset?: number;
    lang?: string;

  [key: string]: unknown
}

export interface MiscArtiClePushListResponseData {

    data?: MiscArtiClePushListData;

  [key: string]: unknown
}

export interface MiscArtiClePushListData {

    limit?: number;
    offset?: number;
    total?: number;
    list?: MiscArtiClePushListRecord[];

  [key: string]: unknown
}

export interface MiscArtiClePushListRecord {

    publish_time?: string;
    article_list?: MiscArtiClePushListContentData[];

  [key: string]: unknown
}

export interface MiscArtiClePushListContentData {

    id?: number;
    title?: string;
    banner_url?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    award?: string;
    match_status?: number;

  [key: string]: unknown
}

// /api/misc/banner_lobby (MiscBannerLobby)
export interface MiscBannerLobbyRequest {

    lang?: string;

  [key: string]: unknown
}

export interface MiscBannerLobbyResponseData {

    data?: MiscBannerLobbyData;

  [key: string]: unknown
}

export interface MiscBannerLobbyData {

    lobby?: MiscBannerLobbyBannerInfo;

  [key: string]: unknown
}

export interface MiscBannerLobbyBannerInfo {

    resource_type?: number;
    image_url?: string;
    video_url?: string;
    video_cover_url?: string;

  [key: string]: unknown
}

// /api/misc/banner/list (MiscBannerList)
export interface MiscBannerListRequest {

    lang?: string; //语言(zh_CN:简体中文,zh_HK:繁体中文,en_US:英文
    type?: number; //1-大厅Banner,2-发现页(公会)Banner
    limit?: number; //条目
    offset?: number; //开始下标。例子（offset=0，limit=10，0-9。）

  [key: string]: unknown
}

export interface MiscBannerListResponseData {

    limit: number; //条目
    offset: number; //开始下标。例子（offset=0，limit=10，0-9。）
    total: number; //总条数
    list: MiscBannerListBannerInfo[]; // Banner列表

  [key: string]: unknown
}

export interface MiscBannerListBannerInfo {

    id: number; //banner id
    lang: string; //语言
    banner_type: number; //1-大厅Banner,2-发现页(公会)Banner
    image_url: string; //Banner图片连接
    redirect_url: string; //跳转连接
    description: string; //描述

  [key: string]: unknown
}

// /api/misc/combine (MiscCombine)
export interface MiscCombineRequest {

    api_list?: Array<
      (MiscCombineApiType)[keyof MiscCombineApiType]
    >;
    popup_newer_req?: RequestParamsOf<typeof MiscPopupNewer>;
    banner_lobby_req?: RequestParamsOf<typeof MiscBannerLobby>;
    article_list_req?: RequestParamsOf<typeof MiscArtiCleList>;
    msg_unread_req?: RequestParamsOf<typeof MsgMessageUnread>;
    msg_broadcast_num_req?: RequestParamsOf<
      typeof MsgMessageSystemBroadcastNum
    >;
    msg_red_num_req?: RequestParamsOf<typeof MessageRednum>;
    user_info_by_rid_req?: {
      user_id?: number;
    };
    user_stats_by_user_rid_req?: RequestParamsOf<typeof StatsOtherUserStats>;
    banner_list_req?: RequestParamsOf<typeof MiscBannerList>;
    club_notice_req?: {
      club_id?: number;
    };
    club_user_wallet_req?: RequestParamsOf<typeof ClubUserWallet>;
    club_user_info_req?: RequestParamsOf<typeof OrgClubUserInfo>;
    club_info_req?: RequestParamsOf<typeof OrgClubSearchById>;
    club_fund_detail_req?: RequestParamsOf<typeof OrgClubGold>;
    mall_goods_list_req?: RequestParamsOf<typeof PropMallGoodsList>;
    friend_room_stats_data_req?: RequestParamsOf<typeof FriendRoomStatsData>;
    friend_room_stats_data_info_req?: RequestParamsOf<
      typeof FriendRoomStatsDataInfo
    >;
    stats_user_stats_req?: RequestParamsOf<typeof StatsUserStats>;
    user_rival_room_stats_req?: RequestParamsOf<
      typeof StatsUserStatsRivalRoomStats
    >;
    user_allin_room_stats_req?: RequestParamsOf<typeof StatsUserStatsAllin>;
    user_card_type_room_stats_req?: RequestParamsOf<
      typeof StatsUserStatsCardType
    >;
    club_data_stats_data_info_req?: RequestParamsOf<
      typeof ClubDataStatsDataInfo
    >;
    club_data_stats_data_req?: RequestParamsOf<typeof ClubDataStatsData>;
    user_game_record_list_req?: RequestParamsOf<
      typeof StatsUserGameRecordList
    >;
    game_round_list_data_by_room_req?: RequestParamsOf<
      typeof MiscGameRoundListDataByRoom
    >;
    master_slave_club_list_req?: RequestParamsOf<
      typeof OrgClubMasterSlaveClubList
    >;
    club_admin_has_req?: RequestParamsOf<typeof OrgClubIsManger>;
    club_gold_change_log_req?: RequestParamsOf<typeof ClubFundChangeLog>;
    club_user_wallet_relation_req?: RequestParamsOf<
      typeof OrgClubUserWalletRelationList
    >;
    save_client_info_req?: RequestParamsOf<typeof UserSendInfo>;
    support_channel_list_req?: RequestParamsOf<
      typeof ChatSupportChannelList
    >;
    user_club_req?: RequestParamsOf<typeof OrgClubGet>;
    get_user_mute_list_req?: RequestParamsOf<typeof UserMuteList>;
    get_chat_shop_prop_list_req?: RequestParamsOf<typeof PropChatPropList>;
    get_tribe_black_user_list_req?: RequestParamsOf<
      typeof OrgTribeBlackUserList
    >;
    user_club_info_req?: RequestParamsOf<typeof OrgClubSearchById>;

  [key: string]: unknown
}

export interface MiscCombineResponseData {

    data?: MiscCombineData;

  [key: string]: unknown
}

export interface MiscCombineData {

    popup?: ResponseDataOf<typeof MiscPopupNewer>;
    banner_lobby_resp?: ResponseDataOf<typeof MiscBannerLobby>;
    article_list_resp?: ResponseDataOf<typeof MiscArtiCleList>;
    msg_unread_resp?: MiscCombineMsgUnreadResp;
    msg_broadcast_num_resp?: MiscCombineBroadcastNumResp;
    msg_todo_num_resp?: MiscCombineMsgTodoNumResp;
    org_self_profit_unpay_record_resp?: ResponseDataOf<
      typeof OrgUserSelfProfitUnpayRecords
    >;
    msg_red_num_resp?: ResponseDataOf<typeof MessageRednum>;
    org_self_profit_unnotify_resp?: unknown;
    user_wallet_total_resp?: ResponseDataOf<typeof WalletTotal>;
    mtt_platform_stats_resp?: MiscCombineMTTData;
    user_info_by_rid_resp?: unknown[];
    user_stats_by_user_rid_resp?: ResponseDataOf<typeof StatsOtherUserStats>;
    banner_list_resp?: ResponseDataOf<typeof MiscBannerList>;
    club_notice_resp?: unknown;
    club_user_wallet_resp?: ResponseDataOf<typeof ClubUserWallet>;
    club_user_info_resp?: ResponseDataOf<typeof OrgClubUserInfo>;
    club_info_resp?: ResponseDataOf<typeof OrgClubSearchById>;
    club_fund_detail_resp?: ResponseDataOf<typeof OrgClubGold>;
    mall_goods_list_resp?: ResponseDataOf<typeof PropMallGoodsList>;
    sign_in_activity_resp?: ResponseDataOf<typeof PropSignInActivityDetail>;
    friend_room_stats_data_resp?: ResponseDataOf<typeof FriendRoomStatsData>;
    friend_room_stats_data_info_resp?: ResponseDataOf<
      typeof FriendRoomStatsDataInfo
    >;
    stats_user_stats_resp?: ResponseDataOf<typeof StatsUserStats>;
    user_rival_room_stats_resp?: ResponseDataOf<
      typeof StatsUserStatsRivalRoomStats
    >;
    user_allin_room_stats_resp?: ResponseDataOf<typeof StatsUserStatsAllin>;
    user_card_type_room_stats_resp?: ResponseDataOf<
      typeof StatsUserStatsCardType
    >;
    club_data_stats_data_info_resp?: ResponseDataOf<
      typeof ClubDataStatsDataInfo
    >;
    club_data_stats_data_resp?: ResponseDataOf<typeof ClubDataStatsData>;
    user_game_record_list_resp?: ResponseDataOf<
      typeof StatsUserGameRecordList
    >;
    game_round_list_data_by_room_resp?: ResponseDataOf<
      typeof MiscGameRoundListDataByRoom
    >;
    master_slave_club_list_resp?: ResponseDataOf<
      typeof OrgClubMasterSlaveClubList
    >;
    club_admin_has_resp?: ResponseDataOf<typeof OrgClubIsManger>;
    club_gold_change_log_resp?: ResponseDataOf<typeof ClubFundChangeLog>;
    club_user_wallet_relation_resp?: ResponseDataOf<
      typeof OrgClubUserWalletRelationList
    >;
    user_white_list_info_resp?: MiscCombineUserWhiteListInfoResp;
    user_action_remaind_resp?: ResponseDataOf<typeof UserActionRemaind>;
    get_view_public_cards_free_count_resp?: ResponseDataOf<
      typeof RoomCenterHistoryViewPublicCardsFreeCount
    >;
    user_game_watch_pay_record_notice_resp?: ResponseDataOf<
      typeof RoomCenterGameWatchUnreadList
    >;
    support_channel_list_resp?: ResponseDataOf<
      typeof ChatSupportChannelList
    >;
    user_club_resp?: ResponseDataOf<typeof OrgClubGet>;
    user_jackpot_template_resp?: unknown;
    user_wheel_template_list_resp?: ResponseDataOf<
      typeof CmsExtWheelTemplateList
    >;
    get_user_mute_list_resp?: ResponseDataOf<typeof UserMuteList>;
    get_chat_shop_prop_list_resp?: ResponseDataOf<typeof PropChatPropList>;
    get_tribe_black_user_list_resp?: ResponseDataOf<
      typeof OrgTribeBlackUserList
    >;
    user_club_info_resp?: ResponseDataOf<typeof OrgClubSearchById>;
    user_club_admin_resp?: unknown;

  [key: string]: unknown
}

export interface MiscCombineUserWhiteListInfoResp {

    data?: ResponseDataOf<typeof ConfigUserWhitelistInfo>;

  [key: string]: unknown
}

export interface MiscCombineMTTData {

    match_count?: number;
    running_count?: number;
    sign_up_count?: number;
    alive?: number;
    prize_base_pool?: number;

  [key: string]: unknown
}

export interface MiscCombineMsgTodoNumResp {

    todo_num_list?: unknown[];

  [key: string]: unknown
}

export interface MiscCombineBroadcastNumResp {

    broadcast_num_list?: unknown[];

  [key: string]: unknown
}

export interface MiscCombineMsgUnreadResp {

    unreade_list?: ResponseDataOf<typeof MsgMessageUnread>[];

  [key: string]: unknown
}

// /api/misc/currency_description/info (MiscCurrencyDescriptionInfo)
export interface MiscCurrencyDescriptionInfoRequest {

    lang?: string;

  [key: string]: unknown
}

export interface MiscCurrencyDescriptionInfoResponseData {
  [key: string]: unknown
}

export interface MiscCurrencyDescriptionInfoData {

    currency_description?: MiscCurrencyDescriptionInfoContentDetails;

  [key: string]: unknown
}

export interface MiscCurrencyDescriptionInfoContentDetails {

    status?: number;

  [key: string]: unknown
}

// /api/misc/currency_exchage_rate (MiscCurrencyExchAgeRate)
export interface MiscCurrencyExchAgeRateRequest {

    from?: string;
    amount?: number;

  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateResponseData {

    data?: MiscCurrencyExchAgeRateData;

  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateData {

    amount?: number;

  [key: string]: unknown
}

// /api/misc/currency_exchage_rate/list (MiscCurrencyExchAgeRateList)
export interface MiscCurrencyExchAgeRateListRequest {

    from?: string;
    to?: string;
    amount?: number;

  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateListResponseData {

    data?: MiscCurrencyExchAgeRateListData;

  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateListData {

    from_currency?: string;
    exchange_list?: MiscCurrencyExchAgeRateListCurrencies[];

  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateListCurrencies {

    quotecurrency?: string;
    mid?: number;

  [key: string]: unknown
}

// /api/misc/face/detect (MiscFaceDetect)
export interface MiscFaceDetectRequest {
  [key: string]: unknown
}

export interface MiscFaceDetectResponseData {
  [key: string]: unknown
}

export interface MiscFaceDetectData {

    detect_code?: number;
    liveness_type?: number;

  [key: string]: unknown
}

// /api/misc/face/liveness/multi_photo (MiscFaceLivenessMultiPhoto)
export interface MiscFaceLivenessMultiPhotoRequest {
  [key: string]: unknown
}

export interface MiscFaceLivenessMultiPhotoResponseData {
  [key: string]: unknown
}

export interface MiscFaceLivenessMultiPhotoData {

    liveness?: boolean;

  [key: string]: unknown
}

// /api/misc/face/recog (MiscFaceRecog)
export interface MiscFaceRecogRequest {

    room_id?: number;
    recog_id?: number;

  [key: string]: unknown
}

export interface MiscFaceRecogResponseData {
  [key: string]: unknown
}

export interface MiscFaceRecogData {

    recog?: boolean;

  [key: string]: unknown
}

// /api/misc/face/recog/check (MiscFaceRecogCheck)
export interface MiscFaceRecogCheckRequest {

    room_id?: number;
    recog_user_id?: number;

  [key: string]: unknown
}

export interface MiscFaceRecogCheckResponseData {
  [key: string]: unknown
}

export interface MiscFaceRecogCheckData {

    can_request?: boolean;
    req_total?: number;
    last_status?: number;
    last_time?: number;
    success_total?: number;

  [key: string]: unknown
}

// /api/misc/face/recog/confirm (MiscFaceRecogConfirm)
export interface MiscFaceRecogConfirmRequest {

    recog_id?: number;
    confirm?: boolean;

  [key: string]: unknown
}

export interface MiscFaceRecogConfirmResponseData {
  [key: string]: unknown
}

// /api/misc/face/recog/request (MiscFaceRecogRequest)
export interface MiscFaceRecogRequestRequest {

    room_id?: number;
    recog_user_id?: number;

  [key: string]: unknown
}

export interface MiscFaceRecogRequestResponseData {
  [key: string]: unknown
}

export interface MiscFaceRecogRequestData {
  [key: string]: unknown
}

// /api/misc/face/recog/result (MiscFaceRecogResult)
export interface MiscFaceRecogResultRequest {

    room_id?: number;
    recog_id?: number;
    recog?: boolean;

  [key: string]: unknown
}

export interface MiscFaceRecogResultResponseData {
  [key: string]: unknown
}

export interface MiscFaceRecogResultData {

    recog?: boolean;

  [key: string]: unknown
}

// /api/misc/face/recog/room_last (MiscFaceRecogRoomLast)
export interface MiscFaceRecogRoomLastRequest {

    room_type?: number;
    match_id?: number;
    room_id?: number;

  [key: string]: unknown
}

export interface MiscFaceRecogRoomLastResponseData {

    data?: MiscFaceRecogRoomLastData[];

  [key: string]: unknown
}

export interface MiscFaceRecogRoomLastData {

    id?: number;
    room_type?: number;
    match_id?: number;
    room_id?: number;
    request_user_rid?: number;
    recog_user_rid?: number;
    status?: number;
    request_user_name?: string;
    recog_user_name?: string;
    timeout_stamp?: number;

  [key: string]: unknown
}

// /api/misc/face/save (MiscFaceSave)
export interface MiscFaceSaveRequest {
  [key: string]: unknown
}

export interface MiscFaceSaveResponseData {
  [key: string]: unknown
}

// /api/misc/face/save/limit (MiscFaceSaveLimit)
export interface MiscFaceSaveLimitRequest {
  [key: string]: unknown
}

export interface MiscFaceSaveLimitResponseData {

    data?: MiscFaceSaveLimitData;

  [key: string]: unknown
}

export interface MiscFaceSaveLimitData {

    global_limit?: number;
    user_used?: number;

  [key: string]: unknown
}

// /api/misc/face/seat_cancel_recog (MiscFaceSeatCancelRecog)
export interface MiscFaceSeatCancelRecogRequest {

    room_id?: number;

  [key: string]: unknown
}

export interface MiscFaceSeatCancelRecogResponseData {
  [key: string]: unknown
}

export interface MiscFaceSeatCancelRecogData {
  [key: string]: unknown
}

// /api/misc/face/seat_recog (MiscFaceSeatRecog)
export interface MiscFaceSeatRecogRequest {

    room_id?: number;

  [key: string]: unknown
}

export interface MiscFaceSeatRecogResponseData {
  [key: string]: unknown
}

export interface MiscFaceSeatRecogData {

    recog?: boolean;

  [key: string]: unknown
}

// /api/misc/game/get_round_status (MiscGameRoundStatus)
export interface MiscGameRoundStatusRequest {

  //     room_id: number, //普通牌局，
  //     room_unique_id: string, // room唯一标识
  //     hand_num: number, //手数
  // 
  [key: string]: unknown
}

export interface MiscGameRoundStatusResponseData {

  // 
  [key: string]: unknown
}

// /api/misc/game/record_round (MiscGameRecordRound)
export interface MiscGameRecordRoundRequest {

  //     id: number, // 牌普id
  //     room_id: number, // 普通牌局，
  //     match_id: number, // mtt赛事id
  //     room_unique_id: string, // room唯一标识
  //     name: string, //
  //     hand_num: number, // 手数
  //     change: number, // 金币变动值
  //     type: number, // 类型
  //     open: number, // 是否公开
  // 
  [key: string]: unknown
}

export interface MiscGameRecordRoundResponseData {
  [key: string]: unknown
}

// /api/misc/game/remove_round (MiscGameRemoveRound)
export interface MiscGameRemoveRoundRequest {

  //     room_id: number, // 普通牌局，
  //     room_unique_id: string, // room唯一标识
  //     hand_num: number, // 手数
  // 
  [key: string]: unknown
}

export interface MiscGameRemoveRoundResponseData {
  [key: string]: unknown
}

// /api/misc/game/round/list (MiscGameRoundList)
export interface MiscGameRoundListRequest {

  //     limit: number,
  //     offset: number,
  // 
  [key: string]: unknown
}

export interface MiscGameRoundListResponseData {
  [key: string]: unknown
}

// /api/misc/game/round/list/data_by_room (MiscGameRoundListDataByRoom)
export interface MiscGameRoundListDataByRoomRequest {

    club_id?: number;
    tribe_id?: number;
    limit?: number;
    offset?: number;
    game_types?: number[];
    poker_types?: number[];

  [key: string]: unknown
}

export interface MiscGameRoundListDataByRoomResponseData {

    data?: MiscGameRoundListDataByRoomData;

  [key: string]: unknown
}

export interface MiscGameRoundListDataByRoomData {

    limit?: number;
    offset?: number;
    total?: number;
    list?: MiscGameRoundListDataByRoomRecord[];

  [key: string]: unknown
}

export interface MiscGameRoundListDataByRoomRoomRecord {

    small_blind?: number;
    room_id?: number;
    name?: string;
    gold_type?: number;
    game_type?: number;
    poker_type?: number;
    random_ante?: string;

  [key: string]: unknown
}

export interface MiscGameRoundListDataByRoomUserGameRecord {

    id?: number;
    type?: number;
    room_id?: number;
    match_id?: number;
    name?: string;
    multi_lang_names_obj?: unknown;
    user_id?: number;
    hand_num?: number;
    open?: number;
    change?: number;
    create_time?: string;
    room_unique_id?: string;
    data?: string;
    replay?: unknown;
    replay_ft?: unknown;
    bet_pot?: number;
    encrypt_cards?: unknown;
    gold_type?: number;
    jackpot_award?: number;

  [key: string]: unknown
}

export interface MiscGameRoundListDataByRoomRecord {

    room_record?: MiscGameRoundListDataByRoomRoomRecord;
    user_game_records?: MiscGameRoundListDataByRoomUserGameRecord[];
    total?: number;

  [key: string]: unknown
}

// /api/misc/popup/newer (MiscPopupNewer)
export interface MiscPopupNewerRequest {
  [key: string]: unknown
}

export interface MiscPopupNewerResponseData {
  [key: string]: unknown
}

// /api/misc/report/feedback_question (MiscReportFeedbackQuestIon)
export interface MiscReportFeedbackQuestIonRequest {
  [key: string]: unknown
}

export interface MiscReportFeedbackQuestIonResponseData {
  [key: string]: unknown
}

// /api/misc/translate (MiscTranslate)
export interface MiscTranslateRequest {

    text?: string;
    target?: string;

  [key: string]: unknown
}

export interface MiscTranslateResponseData {

    data?: string;

  [key: string]: unknown
}

export interface MiscTranslateData {
  [key: string]: unknown
}

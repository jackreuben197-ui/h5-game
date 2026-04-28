// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/misc

import type {
  MsgMessageSystemBroadcastNumMsgInfo,
  MsgMessageSystemBroadcastNumRequest,
  MsgMessageTodoData,
  MsgMessageUnreadData,
  MsgMessageUnreadRequest,
  MessageRednumData,
  MessageRednumRequest,
} from '@/api/models/msg'
import type {
  StatsOtherUserStatsRequest,
  StatsOtherUserStatsData,
  FriendRoomStatsDataRequest,
  FriendRoomStatsDataData,
  FriendRoomStatsDataInfoRequest,
  FriendRoomStatsDataInfoData,
  StatsUserStatsRequest,
  StatsUserStatsData,
  StatsUserStatsRivalRoomStatsRequest,
  StatsUserStatsRivalRoomStatsData,
  StatsUserStatsAllinRequest,
  StatsUserStatsAllinData,
  StatsUserStatsCardTypeRequest,
  StatsUserStatsCardTypeData,
  ClubDataStatsDataInfoRequest,
  ClubDataStatsDataInfoData,
  ClubDataStatsDataRequest,
  ClubDataStatsDataData,
  StatsUserGameRecordListRequest,
  StatsUserGameRecordListData,
} from '@/api/models/stats'
import type {
  ClubUserWalletRequest,
  ClubUserWalletData,
  OrgClubUserInfoRequest,
  OrgClubUserInfoData,
  OrgClubSearchByIdRequest,
  OrgClubSearchByIdData,
  OrgClubGoldRequest,
  OrgClubGoldData,
  OrgClubMasterSlaveClubListRequest,
  OrgClubMasterSlaveClubListData,
  OrgClubIsMangerRequest,
  OrgClubIsMangerData,
  ClubFundChangeLogRequest,
  ClubFundChangeLogData,
  OrgClubUserWalletRelationListRequest,
  OrgClubUserWalletRelationListData,
  OrgClubGetRequest,
  OrgClubGetResponseData,
  OrgTribeBlackUserListRequest,
  OrgTribeBlackUserListData,
  OrgUserSelfProfitUnpayRecordsData,
} from '@/api/models/org'
import type {
  PropMallGoodsListRequest,
  PropMallGoodsListData,
  PropSignInActivityDetailData,
  PropChatPropListRequest,
  PropChatPropListData,
} from '@/api/models/prop'
import type {
  ChatSupportChannelListRequest,
  ChatSupportChannelListData,
} from '@/api/models/chat'
import type {
  OrgClubNoticeRequest,
  OrgClubNoticeRecord,
  CmsExtWheelTemplateListData,
} from '@/api/models/cmsext'
import type { UserMuteListData } from '@/api/models/user'
import type { UserWhitelistInfoInnerData } from '@/api/models/config'

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
    data?: MiscBannerListData;

  [key: string]: unknown
}

export interface MiscBannerListBannerInfo {

    id: number; //banner id
    lang: string; //语言
    banner_type: number; //1-大厅Banner,2-发现页(公会)Banner
    image_url: string; //Banner图片连接
    redirect_url: string; //跳转连接
    description: string; //描述
    resource_type?: number;
    video_url?: string;
    video_cover_url?: string;

  [key: string]: unknown
}

// /api/misc/combine (MiscCombine)
export interface MiscCombineRequest {

    api_list?: number[];
    popup_newer_req?: MiscPopupNewerRequest;
    banner_lobby_req?: MiscBannerLobbyRequest;
    article_list_req?: MiscArtiCleListRequest;
    msg_unread_req?: MsgMessageUnreadRequest;
    msg_broadcast_num_req?: MsgMessageSystemBroadcastNumRequest;
    msg_red_num_req?: MessageRednumRequest;
    user_info_by_rid_req?: {
      user_id?: number;
    };
    user_stats_by_user_rid_req?: StatsOtherUserStatsRequest;
    banner_list_req?: MiscBannerListRequest;
    club_notice_req?: OrgClubNoticeRequest;
    club_user_wallet_req?: ClubUserWalletRequest;
    club_user_info_req?: OrgClubUserInfoRequest;
    club_info_req?: OrgClubSearchByIdRequest;
    club_fund_detail_req?: OrgClubGoldRequest;
    mall_goods_list_req?: PropMallGoodsListRequest;
    friend_room_stats_data_req?: FriendRoomStatsDataRequest;
    friend_room_stats_data_info_req?: FriendRoomStatsDataInfoRequest;
    stats_user_stats_req?: StatsUserStatsRequest;
    user_rival_room_stats_req?: StatsUserStatsRivalRoomStatsRequest;
    user_allin_room_stats_req?: StatsUserStatsAllinRequest;
    user_card_type_room_stats_req?: StatsUserStatsCardTypeRequest;
    club_data_stats_data_info_req?: ClubDataStatsDataInfoRequest;
    club_data_stats_data_req?: ClubDataStatsDataRequest;
    user_game_record_list_req?: StatsUserGameRecordListRequest;
    game_round_list_data_by_room_req?: MiscGameRoundListDataByRoomRequest;
    master_slave_club_list_req?: OrgClubMasterSlaveClubListRequest;
    club_admin_has_req?: OrgClubIsMangerRequest;
    club_gold_change_log_req?: ClubFundChangeLogRequest;
    club_user_wallet_relation_req?: OrgClubUserWalletRelationListRequest;
    save_client_info_req?: {
      [key: string]: unknown;
    };
    support_channel_list_req?: ChatSupportChannelListRequest;
    user_club_req?: OrgClubGetRequest;
    get_user_mute_list_req?: {
      [key: string]: unknown;
    };
    get_chat_shop_prop_list_req?: PropChatPropListRequest;
    get_tribe_black_user_list_req?: OrgTribeBlackUserListRequest;
    user_club_info_req?: OrgClubGetRequest;

  [key: string]: unknown
}

export interface MiscCombineResponseData {

    data?: MiscCombineData;

  [key: string]: unknown
}

export interface MiscCombineData {

    popup?: MiscPopupNewerData;
    banner_lobby_resp?: MiscBannerLobbyResponseData;
    article_list_resp?: MiscArtiCleListResponseData;
    msg_unread_resp?: MiscCombineMsgUnreadResp;
    msg_broadcast_num_resp?: MiscCombineBroadcastNumResp;
    msg_todo_num_resp?: MiscCombineMsgTodoNumResp;
    org_self_profit_unpay_record_resp?: OrgUserSelfProfitUnpayRecordsData;
    msg_red_num_resp?: MessageRednumData[];
    org_self_profit_unnotify_resp?: unknown;
    user_wallet_total_resp?: unknown;
    mtt_platform_stats_resp?: MiscCombineMTTData;
    user_info_by_rid_resp?: unknown[];
    user_stats_by_user_rid_resp?: StatsOtherUserStatsData[];
    banner_list_resp?: MiscBannerListData;
    club_notice_resp?: OrgClubNoticeRecord;
    club_user_wallet_resp?: ClubUserWalletData;
    club_user_info_resp?: OrgClubUserInfoData;
    club_info_resp?: OrgClubSearchByIdData;
    club_fund_detail_resp?: OrgClubGoldData;
    mall_goods_list_resp?: PropMallGoodsListData;
    sign_in_activity_resp?: PropSignInActivityDetailData;
    friend_room_stats_data_resp?: FriendRoomStatsDataData;
    friend_room_stats_data_info_resp?: FriendRoomStatsDataInfoData;
    stats_user_stats_resp?: StatsUserStatsData;
    user_rival_room_stats_resp?: StatsUserStatsRivalRoomStatsData;
    user_allin_room_stats_resp?: StatsUserStatsAllinData;
    user_card_type_room_stats_resp?: StatsUserStatsCardTypeData;
    club_data_stats_data_info_resp?: ClubDataStatsDataInfoData;
    club_data_stats_data_resp?: ClubDataStatsDataData;
    user_game_record_list_resp?: StatsUserGameRecordListData;
    game_round_list_data_by_room_resp?: MiscGameRoundListDataByRoomData;
    master_slave_club_list_resp?: OrgClubMasterSlaveClubListData;
    club_admin_has_resp?: OrgClubIsMangerData;
    club_gold_change_log_resp?: ClubFundChangeLogData;
    club_user_wallet_relation_resp?: OrgClubUserWalletRelationListData;
    user_white_list_info_resp?: MiscCombineUserWhiteListInfoResp;
    user_action_remaind_resp?: unknown;
    get_view_public_cards_free_count_resp?: unknown;
    user_game_watch_pay_record_notice_resp?: unknown;
    support_channel_list_resp?: ChatSupportChannelListData;
    user_club_resp?: OrgClubGetResponseData;
    user_jackpot_template_resp?: unknown;
    user_wheel_template_list_resp?: CmsExtWheelTemplateListData;
    get_user_mute_list_resp?: UserMuteListData;
    get_chat_shop_prop_list_resp?: PropChatPropListData;
    get_tribe_black_user_list_resp?: OrgTribeBlackUserListData;
    user_club_info_resp?: OrgClubGetResponseData;
    user_club_admin_resp?: unknown;

  [key: string]: unknown
}

export interface MiscCombineUserWhiteListInfoResp {

  data?: UserWhitelistInfoInnerData;

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

  todo_num_list?: MsgMessageTodoData[];

  [key: string]: unknown
}

export interface MiscCombineBroadcastNumResp {

  broadcast_num_list?: MsgMessageSystemBroadcastNumMsgInfo[];

  [key: string]: unknown
}

export interface MiscCombineMsgUnreadResp {

  unreade_list?: MsgMessageUnreadData[];

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
    data?: MiscGameRoundStatusData;

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
    data?: MiscGameRecordRoundData;

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
    data?: MiscGameRemoveRoundData;

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

export interface MiscBannerListData {
    limit?: number;
    offset?: number;
    total?: number;
    list?: MiscBannerListBannerInfo[];

  [key: string]: unknown
}

export interface MiscGameRoundStatusData {
    records?: MiscGameRoundStatusRecord[];

  [key: string]: unknown
}

export interface MiscGameRoundStatusRecord {
    remove?: number;

  [key: string]: unknown
}

export interface MiscGameRecordRoundData {
  [key: string]: unknown
}

export interface MiscGameRemoveRoundData {
  [key: string]: unknown
}

export interface MiscPopupNewerData {
    popup?: MiscPopupNewerPopup;

  [key: string]: unknown
}

export interface MiscPopupNewerPopup {
    redirect_url?: string;
    type?: number;
    url?: string;

  [key: string]: unknown
}

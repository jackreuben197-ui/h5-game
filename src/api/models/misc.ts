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
  OrgClubData,
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
import type { StatsReplayData, StatsReplayFantasyData, StatsReplayMahjongData } from '@/api/models/replayDisplay'

// /api/misc/agora/token (MiscAgoraToken)
export interface MiscAgoraTokenRequest {

    channel_name?: string; // 声网频道名称
    role?: number; // 1-主持人,2-观众

  [key: string]: unknown
}

export type MiscAgoraTokenResponseData = string

// /api/misc/article/{id} (MiscArtiCleId)
export interface MiscArtiCleIdRequest {

    limit?: number; // 数据数量
    offset?: number; // 当前偏移值

  [key: string]: unknown
}

export interface MiscArtiCleIdResponseData extends MiscArtiCleIdData {
  [key: string]: unknown
}

export interface MiscArtiCleIdData {

    article?: MiscArtiCleIdRecord; // 文章数据

  [key: string]: unknown
}

export interface MiscArtiCleIdRecord {

    content_ex?: MiscArtiCleIdContentData[]; // 文章内容

  [key: string]: unknown
}

export interface MiscArtiCleIdContentData {

    type?: string; // 文章类型
    value?: string; // 文章

  [key: string]: unknown
}

// /api/misc/article/info (MiscArtiCleInfo)
export interface MiscArtiCleInfoRequest {

    lang?: string; // 多语言 en_US
    type?: number; // 3-用户协议；4-隐私协议；5-关于我们 10-俱乐部推广说明

  [key: string]: unknown
}

export interface MiscArtiCleInfoResponseData extends MiscArtiCleInfoData {
  [key: string]: unknown
}

export interface MiscArtiCleInfoData {

    article?: MiscArtiCleInfoArticle; // 文章数据

  [key: string]: unknown
}

export interface MiscArtiCleInfoArticle {

    content_ex?: MiscArtiCleInfoContentData[]; // 文章内容

  [key: string]: unknown
}

export interface MiscArtiCleInfoContentData {

    value?: string; // 文章

  [key: string]: unknown
}

// /api/misc/article/list (MiscArtiCleList)
export interface MiscArtiCleListRequest {

    type?: number; // 1-首页资讯（教程），2-心得，6-朋友桌资讯，7-赛事资讯, 8-FAQ, 9-新标志更新历史
    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    lang?: string; // 语言

  [key: string]: unknown
}

export interface MiscArtiCleListResponseData extends MiscArtiCleListData {
  [key: string]: unknown
}

export interface MiscArtiCleListData {

    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    total?: number; // 总条数
    list?: MiscArtiCleListRecord[];

  [key: string]: unknown
}

export interface MiscArtiCleListRecord {

    id?: number; // 牌普id
    title?: string; // 标题
    publish_time?: string; // 发布时间
    author?: string; // 作者
    lang?: string; // 语言
    summary?: string; // 概要信息
    banner_url?: string; // banner图片
    read_num?: number; // 观看数
    repost_num?: number; // 转发数
    like_num?: number; // 点赞数
    author_url?: string; // 作者头像
    images_url?: string; // 多张图片 逗号隔开
    content?: string; // faq内容， 需要客户端自己解析

  [key: string]: unknown
}

export interface MiscArtiCleListContentData {

    type?: string; // 文章类型
    value?: string; // 文章

  [key: string]: unknown
}

// /api/misc/article/num/set (MiscArtiClenumSet)
export interface MiscArtiClenumSetRequest {

    id?: number; // 文章id
    read_num?: number; // 观看数
    repost_num?: number; // 转发数
    like_num?: number; // 点赞数

  [key: string]: unknown
}

export interface MiscArtiClenumSetResponseData {
  [key: string]: unknown
}

// /api/misc/article/push/list (MiscArtiClePushList)
export interface MiscArtiClePushListRequest {

    types?: number[]; // 0全部,1-教程，2-心得，6-朋友桌资讯，7-赛事资讯, 8-FAQ,11-赛事回顾
    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    lang?: string; // 语言

  [key: string]: unknown
}

export interface MiscArtiClePushListResponseData extends MiscArtiClePushListData {
  [key: string]: unknown
}

export interface MiscArtiClePushListData {

    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    total?: number; // 总条数
    list?: MiscArtiClePushListRecord[];

  [key: string]: unknown
}

export interface MiscArtiClePushListRecord {

    publish_time?: string; // 发布时间
    article_list?: MiscArtiClePushListContentData[]; // 内容

  [key: string]: unknown
}

export interface MiscArtiClePushListContentData {

    id?: number;
    title?: string; // 标题
    banner_url?: string; // banner图片
    start_time?: string; // 开始时间
    end_time?: string; // 结束时间
    location?: string;
    award?: string;
    match_status?: number; // 1.预告 2.进行中 3.已结束

  [key: string]: unknown
}

// /api/misc/banner_lobby (MiscBannerLobby)
export interface MiscBannerLobbyRequest {

    lang?: string; // 语言(zh_CN:简体中文,zh_HK:繁体中文,en_US:英文

  [key: string]: unknown
}

export interface MiscBannerLobbyResponseData extends MiscBannerLobbyData {
  [key: string]: unknown
}

export interface MiscBannerLobbyData {

    lobby?: MiscBannerLobbyBannerInfo; // 顶部

  [key: string]: unknown
}

export interface MiscBannerLobbyBannerInfo {

    resource_type?: number; // 资源类型：1 图片，2 视频
    image_url?: string; // Banner 图片链接
    video_url?: string; // 视频链接
    video_cover_url?: string; // 视频封面图（视频第一帧图片）

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

export interface MiscBannerListResponseData extends MiscBannerListData {
limit: number; //条目
    offset: number; //开始下标。例子（offset=0，limit=10，0-9。）
    total: number; //总条数
    list: MiscBannerListBannerInfo[]; //Banner列表
  [key: string]: unknown
}

export interface MiscBannerListBannerInfo {

    id: number; //banner id
    lang: string; //语言
    banner_type: number; //1-大厅Banner,2-发现页(公会)Banner
    image_url: string; //Banner图片连接
    redirect_url: string; //跳转连接
    description: string; //描述
    resource_type?: number; // 1图片，2视频
    video_url?: string; // 视频链接
    video_cover_url?: string; // 视频第一帧图片

  [key: string]: unknown
}

// /api/misc/combine (MiscCombine)
export interface MiscCombineRequest {
    //  1."/api/misc/popup/newer" // 获取弹窗数据
    //  2."/api/misc/banner_lobby" // 大厅视频banner
    //  3."/api/misc/article/list" // 文章列表
    //  4."/api/org/user/self_profit/bill_unnotify" // 未通知到玩家返水
    //  5."/api/msg/message/unread" // 未读消息（只有五条）
    //  6."/api/user/wallet_total" // 玩家总钱包
    //  7."/api/msg/message/system/broadcast/num" // 获得平台消息未读消息数量
    //  8."api/msg/message/todo" // 得到消息的数量
    //  9."api/org/user/self_profit/unpay_records" // 用户返水
    //  10."api/msg/message/red_num" // 消息红点
    //  11."api/cmsext/im/service/list" // 俱乐部IM客服列表
    //  12."api/misc/banner/list" // banner列表
    //  13."api/cmsext/club/notice" // 俱乐部弹窗消息
    //  14."api/org/club/club_user/wallet" // 钱包
    //  15."api/org/club/user/info" // 俱乐部成员详细信息
    //  16."api/org/club/info" // 单个俱乐部信息
    //  17."api/org/club/fund/detail" // 基金详情
    //  18."api/org/club/jackpot/template/list" // 获取Jackpot模版列表
    //  19."api/stats/user_stats/all" // 生涯首页数据
    //  20."api/stats/user_stats/game_total" // 生涯首页消息数据
    //  21."api/prop/mall/goods/list" // 商品列表
    //  22."api/prop/sign_in/activity/detail" // 签到活动详情
    //  23.新接口 // mtt首页汇总
    //  24.“/api/user/:id/info” // 查询用户公共个人信息
    //  25.“/api/stats/other_user_stats/:id” // 查看其他人的个人统计
    //  26."/api/stats/friend_room_stats/data" // 朋友桌数据列表
    //  27."/api/stats/friend_room_stats/data_info" // 朋友桌数据统计信息
    //  28."api/stats/user_stats" // 战绩,个人统计详情 生涯数据-个人
    //  29."/api/stats/room/history/list" // 普通牌局的战绩列表
    //  30."/api/stats/mtt/history/list/data_by_date" // mtt的战绩列表(按日期汇总)
    //  31."api/stats/user_stats/rival_room_stats"// 生涯数据-对手
    //  32."api/stats/user_stats/allin"// 生涯数据-对手
    //  33."api/stats/user_stats/card_type"// 生涯数据-牌组
    //  34."api/misc/currency_description/info" // 货币描述
    //  35."api/misc/game/round/list/data_by_room" // 查询收藏牌普列表(根据房间分组)
    //  36."api/org/club/master/slave_club/list" // 获取从俱乐部列表
    //  38."api/org/club/admin/has" // 玩家是否可以管理公会，返回用户信息
    //  39."api/org/club/fund/gold_change/log" // 公会金豆变动明细列表
    //  40."api/stats/club_data_stats/data_info" // 公会数据管理统计信息
    //  42"api/stats/user/game/record/list" // 用户近期牌谱
    //  43."api/stats/club_data_stats/data" // 公会数据管理统计列表
    //  44."api/org/club/user/wallet/relation/list" // 玩家钱包互通成员列表
    //  45."api/user/gold_change/log" // 玩家资金变动
    //  46."api/prop/gold/price/list" // USDT价格列表
    //  47."api/config/online_withdraw_type_list" //联盟提现类型列表
    //  48."api/config/get_online_pay_type_user_address" //查询玩家钱包地址列表
    //  49."api/config/user/whitelist/info" // 获取玩家白名单配置信息
    //  50."api/user/info" // 获取玩家信息
    //  51."api/user/channel" // 获取通道信息
    //  52."api/user/send_info" // 上报用户设备
    //  53."api/user/action/remaind" // 用户剩余免费次数
    //  54."api/roomcenter/history/view_public_cards/free_count" // 玩家付费看公共牌剩余免费次数
    //  55."api/roomcenter/game/watch/unread/list" // 获取付费未读通知列表
    //  56."api/chat/support/channel/list" // 频道列表与未读数量
    //  57."api/org/club/user_club" // 查询玩家所属公会

    api_list?: number[]; // 选择接口枚举，不传返回全部 popup_newer_req?: MiscPopupNewerRequest; // 获取弹窗请求参数
    banner_lobby_req?: MiscBannerLobbyRequest; // 大厅视频banner请求参数
    article_list_req?: MiscArtiCleListRequest; // 文章列表请求参数
    msg_unread_req?: MsgMessageUnreadRequest; // 未读消息请求参数 5 /api/msg/message/unread
    msg_broadcast_num_req?: MsgMessageSystemBroadcastNumRequest; // 获得平台消息未读消息数量请求参数 7
    msg_red_num_req?: MessageRednumRequest; // 得到消息的数量请求参数 10."api/msg/message/red_num" // 消息红点
    user_info_by_rid_req?: {
      user_id?: number; // 查询用户公共个人信息
    };
    user_stats_by_user_rid_req?: StatsOtherUserStatsRequest; // 查看其他人的个人统计
    banner_list_req?: MiscBannerListRequest; // banner列表 12
    club_notice_req?: OrgClubNoticeRequest; // 俱乐部弹窗请求参数 13 /api/cmsext/club/notice
    club_user_wallet_req?: ClubUserWalletRequest; // 钱包请求参数 14 /api/org/club/club_user/wallet
    club_user_info_req?: OrgClubUserInfoRequest; // 俱乐部成员详细信息请求参数 15 /api/org/club/user/info
    club_info_req?: OrgClubSearchByIdRequest; // 单个俱乐部信息请求参数 16 /api/org/club/info
    club_fund_detail_req?: OrgClubGoldRequest; // 基金详情请求参数 17 api/org/club/fund/detail
    mall_goods_list_req?: PropMallGoodsListRequest; // 商品列表请求参数 21
    friend_room_stats_data_req?: FriendRoomStatsDataRequest; // 朋友桌数据列表请求参数 26
    friend_room_stats_data_info_req?: FriendRoomStatsDataInfoRequest; // 朋友桌数据统计信息请求参数 27
    stats_user_stats_req?: StatsUserStatsRequest; // 战绩,个人统计详情请求参数 28
    user_rival_room_stats_req?: StatsUserStatsRivalRoomStatsRequest; // 生涯战绩个人-对手请求参数 31
    user_allin_room_stats_req?: StatsUserStatsAllinRequest; // 生涯战绩个人-All in请求参数 32
    user_card_type_room_stats_req?: StatsUserStatsCardTypeRequest; // 生涯战绩个人-牌组请求参数 33
    club_data_stats_data_info_req?: ClubDataStatsDataInfoRequest; // 俱乐部牌局记录顶部信息请求参数 28
    club_data_stats_data_req?: ClubDataStatsDataRequest; // 俱乐部牌局记录信息请求参数 43
    user_game_record_list_req?: StatsUserGameRecordListRequest; // 近期牌谱信息请求参数 42
    game_round_list_data_by_room_req?: MiscGameRoundListDataByRoomRequest; // 收藏牌谱信息请求参数 35
    master_slave_club_list_req?: OrgClubMasterSlaveClubListRequest; // 从俱乐部列表请求参数 36
    club_admin_has_req?: OrgClubIsMangerRequest; // 是否可以管理俱乐部请求参数 38
    club_gold_change_log_req?: ClubFundChangeLogRequest; // 基金记录请求参数 39
    club_user_wallet_relation_req?: OrgClubUserWalletRelationListRequest; // 钱包互通成员列表请求参数 40
    save_client_info_req?: {
      [key: string]: unknown; // api/user/send_info 上报用户设备
    };
    support_channel_list_req?: ChatSupportChannelListRequest; // api/chat/support/channel/list 频道列表与未读数量
    user_club_req?: OrgClubGetRequest; // 57 api/org/club/user_club 查询玩家所属公会
    get_user_mute_list_req?: {
      [key: string]: unknown; // 61 /api/user/mute/list 房间禁言列表
    };
    get_chat_shop_prop_list_req?: PropChatPropListRequest; // 62 /api/prop/chat/prop/list 查询聊天道具列表请求参数
    get_tribe_black_user_list_req?: OrgTribeBlackUserListRequest; // 63 /api/org/tribe/black/user/list 联盟黑名单列表请求参数
    user_club_info_req?: OrgClubGetRequest; // 64 api/org/club/user_club 查询玩家所属公会详细信息请求参数

  [key: string]: unknown
}

export interface MiscCombineResponseData extends MiscCombineData {
  [key: string]: unknown
}

export interface MiscCombineData {

    popup?: MiscPopupNewerData; // 弹窗数据响应
    banner_lobby_resp?: MiscBannerLobbyResponseData; // 大厅视频banner响应
    article_list_resp?: MiscArtiCleListResponseData; // 文章列表响应
    msg_unread_resp?: MiscCombineMsgUnreadResp; // 未读消息响应
    msg_broadcast_num_resp?: MiscCombineBroadcastNumResp; // 获得平台消息未读消息数量消息响应 7
    msg_todo_num_resp?: MiscCombineMsgTodoNumResp; // 得到消息的数量消息响应
    org_self_profit_unpay_record_resp?: OrgUserSelfProfitUnpayRecordsData; // 用户返水消息响应 9
    msg_red_num_resp?: MessageRednumData[]; // 消息红点消息响应 10."api/msg/message/red_num" // 消息红点
    org_self_profit_unnotify_resp?: unknown; // 未通知到玩家返水消息响应 /api/org/user/self_profit/bill_unnotify
    user_wallet_total_resp?: unknown; // 玩家总钱包消息响应
    mtt_platform_stats_resp?: MiscCombineMTTData; // MTT汇总信息 <returns></returns>
    user_info_by_rid_resp?: unknown[]; // 查询用户公共个人信息
    user_stats_by_user_rid_resp?: StatsOtherUserStatsData[]; // 查看其他人的个人统计
    banner_list_resp?: MiscBannerListData; // banner列表响应 12
    club_notice_resp?: OrgClubNoticeRecord; // 俱乐部弹窗响应 13 /api/cmsext/club/notice
    club_user_wallet_resp?: ClubUserWalletData; // 钱包响应 14 /api/org/club/club_user/wallet
    club_user_info_resp?: OrgClubUserInfoData; // 俱乐部成员详细信息响应 15 /api/org/club/user/info
    club_info_resp?: OrgClubData; // 单个俱乐部信息响应 16 /api/org/club/info
    club_fund_detail_resp?: OrgClubGoldData; // 基金详情请求响应 17 /api/org/club/fund/detail
    mall_goods_list_resp?: PropMallGoodsListData; // 商品列表响应 21
    sign_in_activity_resp?: PropSignInActivityDetailData; // 签到活动详情响应 22
    friend_room_stats_data_resp?: FriendRoomStatsDataData; // 朋友桌数据列表响应 26
    friend_room_stats_data_info_resp?: FriendRoomStatsDataInfoData; // 朋友桌数据统计信息响应 27
    stats_user_stats_resp?: StatsUserStatsData; // 战绩,个人统计详情响应 28
    user_rival_room_stats_resp?: StatsUserStatsRivalRoomStatsData; // 生涯个人-对手响应 31
    user_allin_room_stats_resp?: StatsUserStatsAllinData; // 生涯个人-All in响应 32
    user_card_type_room_stats_resp?: StatsUserStatsCardTypeData; // 生涯个人-牌组响应 33
    club_data_stats_data_info_resp?: ClubDataStatsDataInfoData; // 俱乐部牌局记录顶部信息响应 40
    club_data_stats_data_resp?: ClubDataStatsDataData; // 俱乐部牌局记录信息响应 33
    user_game_record_list_resp?: StatsUserGameRecordListData; // 近期牌谱信息响应 42
    game_round_list_data_by_room_resp?: MiscGameRoundListDataByRoomData; // 收藏牌谱信息响应 35
    master_slave_club_list_resp?: OrgClubMasterSlaveClubListData; // 从俱乐部列表信息响应 36
    club_admin_has_resp?: OrgClubIsMangerData; // 是否可以管理俱乐部响应 38
    club_gold_change_log_resp?: ClubFundChangeLogData; // 基金记录信息响应 39
    club_user_wallet_relation_resp?: OrgClubUserWalletRelationListData; // 钱包互通成员列表响应 44
    user_white_list_info_resp?: MiscCombineUserWhiteListInfoResp; // 获取玩家白名单配置信息响应
    user_action_remaind_resp?: unknown; // 用户剩余免费次数响应
    get_view_public_cards_free_count_resp?: unknown; // 玩家付费看公共牌剩余免费次数响应
    user_game_watch_pay_record_notice_resp?: unknown; // /api/roomcenter/game/watch/unread/list 获取付费未读通知列表
    support_channel_list_resp?: ChatSupportChannelListData; // /api/chat/support/channel/list 频道列表与未读数量
    user_club_resp?: OrgClubGetResponseData; // /api/org/club/user_club 查询玩家所属公会响应
    user_jackpot_template_resp?: unknown; // 玩家所属俱乐部联盟所有模版列表
    user_wheel_template_list_resp?: CmsExtWheelTemplateListData; // 60 玩家所属俱乐部联盟所有轮盘模版列表(新接口) /api/cmsext/wheel/template/list
    get_user_mute_list_resp?: UserMuteListData; // 61 /api/user/mute/list 房间禁言列表响应
    get_chat_shop_prop_list_resp?: PropChatPropListData; // 62 /api/prop/chat/prop/list 查询聊天道具列表响应
    get_tribe_black_user_list_resp?: OrgTribeBlackUserListData; // 63 /api/org/tribe/black/user/list 联盟黑名单列表响应
    user_club_info_resp?: OrgClubGetResponseData; // 64 新接口.参考：api/org/club/user_club 查询玩家所属公会 返回api/org/club/info数据
    user_club_admin_resp?: unknown; // 查询玩家管理员列表 返回api/org/club/admin/has数据列表

  [key: string]: unknown
}

export interface MiscCombineUserWhiteListInfoResp {

  data?: UserWhitelistInfoInnerData;

  [key: string]: unknown
}

export interface MiscCombineMTTData {

    match_count?: number; // 总场次
    running_count?: number; // 进行中
    sign_up_count?: number; // 预报名
    alive?: number; // 参赛人数
    prize_base_pool?: number; // 总奖金

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

    lang?: string; // 语言 zh_CN: 简体中文 zh_TW: 繁体中文 en_US: 英文 pt_BR: 葡文

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

    status?: number; // 状态 1：开启 2：关闭

  [key: string]: unknown
}

// /api/misc/currency_exchage_rate (MiscCurrencyExchAgeRate)
export interface MiscCurrencyExchAgeRateRequest {

    from?: string; // 货币代码
    amount?: number; // 转换金额

  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateResponseData extends MiscCurrencyExchAgeRateData {
  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateData {

    amount?: number; // 兑换结果金额

  [key: string]: unknown
}

// /api/misc/currency_exchage_rate/list (MiscCurrencyExchAgeRateList)
export interface MiscCurrencyExchAgeRateListRequest {

    from?: string; // 目标货币（1单位汇率）
    to?: string; // 转换汇率货币，为空查全部，多个货币用逗号隔开（例："CNY,TWD"）
    amount?: number; // 转换数量，兑换from的数量，填1为正常汇率

  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateListResponseData extends MiscCurrencyExchAgeRateListData {
  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateListData {

    from_currency?: string; // 源货币
    exchange_list?: MiscCurrencyExchAgeRateListCurrencies[];

  [key: string]: unknown
}

export interface MiscCurrencyExchAgeRateListCurrencies {

    quotecurrency?: string; // 目标币种
    mid?: number; // 兑换金额结果

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

    detect_code?: number; // 0检测成功；1检测失败；2未检测到人脸；3多个人脸；4脸部区域太小；5不清晰；6姿态不正
    liveness_type?: number; // 1张嘴；2左转头；3右转头

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

    liveness?: boolean; // 活体检测结果（true=检测通过，false=检测未通过）

  [key: string]: unknown
}

// /api/misc/face/recog (MiscFaceRecog)
export interface MiscFaceRecogRequest {

    room_id?: number; // 房间id
    recog_id?: number; // 验证请求ID

  [key: string]: unknown
}

export interface MiscFaceRecogResponseData {
  [key: string]: unknown
}

export interface MiscFaceRecogData {

    recog?: boolean; // 检测是否成功

  [key: string]: unknown
}

// /api/misc/face/recog/check (MiscFaceRecogCheck)
export interface MiscFaceRecogCheckRequest {

    room_id?: number; // 房间ID
    recog_user_id?: number; // 验证用户ID

  [key: string]: unknown
}

export interface MiscFaceRecogCheckResponseData {
  [key: string]: unknown
}

export interface MiscFaceRecogCheckData {

    can_request?: boolean; // 是否可检测
    req_total?: number; // 总请求次数，不可超过3
    last_status?: number; // 最后一次验证状态，1 发起, 2 取消, 3 验证中, 4 超时, 5 失败, 6 成功
    last_time?: number; // 最后一次验证时间戳
    success_total?: number; // 成功验证次数

  [key: string]: unknown
}

// /api/misc/face/recog/confirm (MiscFaceRecogConfirm)
export interface MiscFaceRecogConfirmRequest {

    recog_id?: number; // 验证ID
    confirm?: boolean; // 是否确认收到验证请求；true确认开始；false退出站起等未确认

  [key: string]: unknown
}

export interface MiscFaceRecogConfirmResponseData {
  [key: string]: unknown
}

// /api/misc/face/recog/request (MiscFaceRecogRequest)
export interface MiscFaceRecogRequestRequest {

    room_id?: number; // 房间ID
    recog_user_id?: number; // 验证用户ID

  [key: string]: unknown
}

export interface MiscFaceRecogRequestResponseData {
  [key: string]: unknown
}

// /api/misc/face/recog/result (MiscFaceRecogResult)
export interface MiscFaceRecogResultRequest {

    room_id?: number; // 房间id
    recog_id?: number; // 验证请求ID
    recog?: boolean; // 人脸活体检测结果 true：活体 false：非活体

  [key: string]: unknown
}

export interface MiscFaceRecogResultResponseData {
  [key: string]: unknown
}

export interface MiscFaceRecogResultData {

    recog?: boolean; // 人脸活体检测结果 true：活体 false：非活体

  [key: string]: unknown
}

// /api/misc/face/recog/room_last (MiscFaceRecogRoomLast)
export interface MiscFaceRecogRoomLastRequest {

    room_type?: number; // 房间玩法类型
    match_id?: number; // 比赛id
    room_id?: number; // 房间id

  [key: string]: unknown
}

export type MiscFaceRecogRoomLastResponseData = MiscFaceRecogRoomLastData[]

export interface MiscFaceRecogRoomLastData {

    id?: number; // 验证id
    room_type?: number; // 房间玩法类型
    match_id?: number; // 比赛id
    room_id?: number; // 房间id
    request_user_rid?: number; // 请求用户id
    recog_user_rid?: number; // 被验证用户id
    status?: number; // 验证状态 1 发起, 2 取消, 3 验证中, 4 超时, 5 失败, 6 成功
    request_user_name?: string; // 发起人名称
    recog_user_name?: string; // 被验证人名称
    timeout_stamp?: number; // 超时时间戳

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

export interface MiscFaceSaveLimitResponseData extends MiscFaceSaveLimitData {
  [key: string]: unknown
}

export interface MiscFaceSaveLimitData {

    global_limit?: number; // 本月可重置次数
    user_used?: number; // 玩家已用次数

  [key: string]: unknown
}

// /api/misc/face/seat_cancel_recog (MiscFaceSeatCancelRecog)
export interface MiscFaceSeatCancelRecogRequest {

    room_id?: number; // 房间id

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

    room_id?: number; // 房间id

  [key: string]: unknown
}

export interface MiscFaceSeatRecogResponseData {
  [key: string]: unknown
}

export interface MiscFaceSeatRecogData {

    recog?: boolean; // 检测成功

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

export interface MiscGameRoundStatusResponseData extends MiscGameRoundStatusData {
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

export interface MiscGameRecordRoundResponseData extends MiscGameRecordRoundData {
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

export interface MiscGameRemoveRoundResponseData extends MiscGameRemoveRoundData {
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

    club_id?: number; // 俱乐部id
    tribe_id?: number; // 联盟id
    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    game_types?: number[]; // 游戏类型
    poker_types?: number[]; // 德州玩法细分类型

  [key: string]: unknown
}

export interface MiscGameRoundListDataByRoomResponseData extends MiscGameRoundListDataByRoomData {
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
    replay?: StatsReplayData | string;
    replay_ft?: StatsReplayFantasyData | string;
    replay_mj?: StatsReplayMahjongData | string;
    replay_gd?: unknown;
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
    lang?: string; // 语言
    type?: number; // 0-所有，1-开屏，2-登陆页，3-游戏内,4-loading

  [key: string]: unknown
}

export interface MiscPopupNewerResponseData {
  [key: string]: unknown
}

// /api/misc/report/feedback_question (MiscReportFeedbackQuestIon)
export interface MiscReportFeedbackQuestIonRequest {
    description?: string; // 问题或意见描述
    log_url?: string; // 日志地址
    name?: string; // 提交者姓名
    email?: string; // 提交者邮箱
    title?: string; // 标题

  [key: string]: unknown
}

export interface MiscReportFeedbackQuestIonResponseData {
  [key: string]: unknown
}

// /api/misc/translate (MiscTranslate)
export interface MiscTranslateRequest {

    text?: string; // 翻译内容
    target?: string; // 目标翻译语言

  [key: string]: unknown
}

export type MiscTranslateResponseData = string

export interface MiscTranslateData {
  [key: string]: unknown
}

export interface MiscBannerListData {
    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    total?: number; // 总条数
    list?: MiscBannerListBannerInfo[]; // Banner列表

  [key: string]: unknown
}

export interface MiscGameRoundStatusData {
    records?: MiscGameRoundStatusRecord[]; // 不为空则表示已经收藏

  [key: string]: unknown
}

export interface MiscGameRoundStatusRecord {
    remove?: number; // 是否已删除，1 为是

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

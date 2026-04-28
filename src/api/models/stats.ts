// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/stats

// /api/stats/client/click/log (StatsClientClickLog)
export interface StatsClientClickLogRequest {

        device_id?: string;
        mac_addr?: string;
        is_simulator?: boolean;
        simulator_name?: string;
        system_version?: string;
        user_device_no?: string;
        records?: StatsClientClickLogRecordData[];

  [key: string]: unknown
}

export interface StatsClientClickLogResponseData {

        data?: StatsClientClickLogData;

  [key: string]: unknown
}

export interface StatsClientClickLogRecordData {
  [key: string]: unknown
}

export interface StatsClientClickLogData {
  [key: string]: unknown
}

// /api/stats/club_data_stats/data (ClubDataStatsData)
export interface ClubDataStatsDataRequest {
  [key: string]: unknown
}

export interface ClubDataStatsDataResponseData {
    data?: ClubDataStatsDataData;

  [key: string]: unknown
}

// /api/stats/club_data_stats/data_detail (ClubDataStatsDataDetail)
export interface ClubDataStatsDataDetailRequest {
  [key: string]: unknown
}

export interface ClubDataStatsDataDetailResponseData {
    data?: ClubDataStatsDataDetailData;

  [key: string]: unknown
}

// /api/stats/club_data_stats/data_detail_info (ClubDataStatsDataDetailInfo)
export interface ClubDataStatsDataDetailInfoRequest {
  [key: string]: unknown
}

export interface ClubDataStatsDataDetailInfoResponseData {
    data?: ClubDataStatsDataDetailInfoData;

  [key: string]: unknown
}

// /api/stats/club_data_stats/data_detail/download (StatsClubDataStatsDataDetailDownLoad)
export interface StatsClubDataStatsDataDetailDownLoadRequest {

        filter_type?: number;
        start_time?: string;
        end_time?: string;
        start_time_unix?: number;
        end_time_unix?: number;
        lang?: string;
        time_zone?: number;

  [key: string]: unknown
}

export interface StatsClubDataStatsDataDetailDownLoadResponseData {

        data?: StatsClubDataStatsDataDetailDownLoadData;

  [key: string]: unknown
}

export interface StatsClubDataStatsDataDetailDownLoadData {

        log_id?: number;
        url?: string;

  [key: string]: unknown
}

// /api/stats/club_data_stats/data_info (ClubDataStatsDataInfo)
export interface ClubDataStatsDataInfoRequest {
  [key: string]: unknown
}

export interface ClubDataStatsDataInfoResponseData {
    data?: ClubDataStatsDataInfoData;

  [key: string]: unknown
}

// /api/stats/club_data_stats/user_detail (StatsClubDataStatsUserDetail)
export interface StatsClubDataStatsUserDetailRequest {

        filter_time?: number;
        start_time?: number;
        end_time?: number;
        time_long?: number;
        user_id?: number;
        filter_type?: number;
        time_zone?: number;

  [key: string]: unknown
}

export interface StatsClubDataStatsUserDetailResponseData {

        data?: StatsClubDataStatsUserDetailData;

  [key: string]: unknown
}

export interface StatsClubDataStatsUserDetailData {

        stats_all?: StatsClubDataStatsUserDetailTotalData;
        stats_nlh?: StatsClubDataStatsUserDetailTotalData;
        stats_plo?: StatsClubDataStatsUserDetailTotalData;
        stats_6?: StatsClubDataStatsUserDetailTotalData;

  [key: string]: unknown
}

export interface StatsClubDataStatsUserDetailTotalData {

        game_num?: number;
        hand_num?: number;
        grant_gold_amount?: number;
        recover_gold_amount?: number;
        recharge_usdt_amount?: number;
        recover_usdt_amount?: number;
        profit?: number;
        fee?: number;
        agent_fee?: number;
        insurance?: number;
        agent_insurance?: number;

  [key: string]: unknown
}

// /api/stats/club_data_stats/vip_game (GuildDataVipInfo)
export interface GuildDataVipInfoRequest {
  [key: string]: unknown
}

export interface GuildDataVipInfoResponseData {
    data?: GuildDataVipInfoData;

  [key: string]: unknown
}

// /api/stats/club_data_stats/vip_user (StatsClubDataStatsVipUser)
export interface StatsClubDataStatsVipUserRequest {

        vip_user_id?: number;

  [key: string]: unknown
}

export interface StatsClubDataStatsVipUserResponseData {

        data?: StatsClubDataStatsVipUserData;

  [key: string]: unknown
}

export interface StatsClubDataStatsVipUserData {

        info?: StatsClubDataStatsVipUserTotalData;

  [key: string]: unknown
}

export interface StatsClubDataStatsVipUserTotalData {

        user_count?: number;
        user_gold_tribe_total?: number;
        user_gold_usdt_total?: number;

  [key: string]: unknown
}

// /api/stats/club_data_stats/weekly_report (StatsClubDataStatsWeeklyReport)
export interface StatsClubDataStatsWeeklyReportRequest {

        time_zone?: number;

  [key: string]: unknown
}

export interface StatsClubDataStatsWeeklyReportResponseData {

        data?: StatsClubDataStatsWeeklyReportData;

  [key: string]: unknown
}

export interface StatsClubDataStatsWeeklyReportData {

        list?: StatsClubDataStatsWeeklyReportLableData[];
        total_info?: StatsClubDataStatsWeeklyReportTotalInfo;

  [key: string]: unknown
}

export interface StatsClubDataStatsWeeklyReportTotalInfo {

        deposits?: number;
        withdraw?: number;
        hands?: number;
        win?: number;
        fee?: number;
        ins?: number;
        prb?: number;
        crb?: number;
        start_time?: number;
        end_time?: number;

  [key: string]: unknown
}

export interface StatsClubDataStatsWeeklyReportLableData {

        name?: string;
        id?: number;
        hands?: number;
        win?: number;
        fee?: number;
        ins?: number;
        prb?: number;
        crb?: number;

  [key: string]: unknown
}

// /api/stats/club/agent/friend_data (ClubAgentFriendData)
export interface ClubAgentFriendDataRequest {
  [key: string]: unknown
}

export interface ClubAgentFriendDataResponseData {
  [key: string]: unknown
}

// /api/stats/club/agent/friend_info (ClubAgentFriendInfo)
export interface ClubAgentFriendInfoRequest {
  [key: string]: unknown
}

export interface ClubAgentFriendInfoResponseData {
  [key: string]: unknown
}

// /api/stats/club/profit (OrgClubEarnIng)
export interface OrgClubEarnIngRequest {
  [key: string]: unknown
}

export interface OrgClubEarnIngResponseData {
  [key: string]: unknown
}

// /api/stats/club/user_profit (OrgClubMemberEarnIng)
export interface OrgClubMemberEarnIngRequest {
  [key: string]: unknown
}

export interface OrgClubMemberEarnIngResponseData {
  [key: string]: unknown
}

// /api/stats/club/user/info (OrgClubUserGameInfo)
export interface OrgClubUserGameInfoRequest {
  [key: string]: unknown
}

export interface OrgClubUserGameInfoResponseData {
  [key: string]: unknown
}

// /api/stats/cowboy/history/room/detail (StatsCowboyHistoryRoomDetail)
export interface StatsCowboyHistoryRoomDetailRequest {

        room_id?: number;
        limit?: number;
        offset?: number;

  [key: string]: unknown
}

export interface StatsCowboyHistoryRoomDetailResponseData {

        data?: StatsCowboyHistoryRoomDetailDataObj;

  [key: string]: unknown
}

export interface StatsCowboyHistoryRoomDetailDataObj {

        records?: StatsCowboyHistoryRoomDetailPlayerEndDetail[];
        uroom?: StatsCowboyHistoryRoomDetailPlayerEndRoomInfo;

  [key: string]: unknown
}

export interface StatsCowboyHistoryRoomDetailPlayerEndDetail {

        user_win?: number;
        game_num?: number;
        user_random_id?: number;
        user_nick_name?: string;
        user_avatar?: string;
        cb_bet?: number;

  [key: string]: unknown
}

export interface StatsCowboyHistoryRoomDetailPlayerEndRoomInfo {

        user_win?: number;
        game_num?: number;

  [key: string]: unknown
}

// /api/stats/friend_room_stats (FriendRoomStats)
export interface FriendRoomStatsRequest {
  [key: string]: unknown
}

export interface FriendRoomStatsResponseData {
    data?: FriendRoomStatsData;

  [key: string]: unknown
}

// /api/stats/friend_room_stats/data (FriendRoomStatsData)
export interface FriendRoomStatsDataRequest {
  [key: string]: unknown
}

export interface FriendRoomStatsDataResponseData {
    data?: FriendRoomStatsDataData;

  [key: string]: unknown
}

// /api/stats/friend_room_stats/data_detail (FriendRoomStatsDataDetail)
export interface FriendRoomStatsDataDetailRequest {
  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailResponseData {
    data?: FriendRoomStatsDataDetailData;

  [key: string]: unknown
}

// /api/stats/friend_room_stats/data_detail_info (FriendRoomStatsDataDetailInfo)
export interface FriendRoomStatsDataDetailInfoRequest {
  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailInfoResponseData {
    data?: FriendRoomStatsDataDetailInfoData;

  [key: string]: unknown
}

// /api/stats/friend_room_stats/data_info (FriendRoomStatsDataInfo)
export interface FriendRoomStatsDataInfoRequest {
  [key: string]: unknown
}

export interface FriendRoomStatsDataInfoResponseData {
    data?: FriendRoomStatsDataInfoData;

  [key: string]: unknown
}

// /api/stats/friend_room_stats/user/room_detail/list (StatsFriendRoomStatsUserRoomDetailList)
export interface StatsFriendRoomStatsUserRoomDetailListRequest {

        _roomIds?: number[];
        _matchIds?: number[];

  [key: string]: unknown
}

export interface StatsFriendRoomStatsUserRoomDetailListResponseData {

        _data?: StatsFriendRoomStatsUserRoomDetailListData;

  [key: string]: unknown
}

export interface StatsFriendRoomStatsUserRoomDetailListData {

        _rooms?: unknown[];
        _matches?: unknown[];

  [key: string]: unknown
}

// /api/stats/friend_room_stats/user/room_id/list (StatsFriendRoomStatsUserRoomIdList)
export interface StatsFriendRoomStatsUserRoomIdListRequest {

        start_time?: number;
        end_time?: number;

  [key: string]: unknown
}

export interface StatsFriendRoomStatsUserRoomIdListResponseData {

        _data?: StatsFriendRoomStatsUserRoomIdListIdListData;

  [key: string]: unknown
}

export interface StatsFriendRoomStatsUserRoomIdListIdListData {

        _roomIds?: number[];
        _matchIds?: number[];

  [key: string]: unknown
}

// /api/stats/friend_room_stats/user/room_stats/list (StatsFriendRoomStatsUserRoomStatsList)
export interface StatsFriendRoomStatsUserRoomStatsListRequest {

        _roomIds?: number[];
        _matchIds?: number[];

  [key: string]: unknown
}

export interface StatsFriendRoomStatsUserRoomStatsListResponseData {

        _data?: StatsFriendRoomStatsUserRoomStatsListData;

  [key: string]: unknown
}

export interface StatsFriendRoomStatsUserRoomStatsListData {

        _rooms?: unknown[];
        _matches?: unknown[];

  [key: string]: unknown
}

// /api/stats/friend_stats/data (StatsFriendStatsData)
export interface StatsFriendStatsDataRequest {

        start_time?: number;
        end_time?: number;
        game_types?: number[];
        poker_types?: number[];
        offset?: number;
        limit?: number;

  [key: string]: unknown
}

export interface StatsFriendStatsDataResponseData {

        data?: StatsFriendStatsDataData;

  [key: string]: unknown
}

export interface StatsFriendStatsDataData {

        offset?: number;
        list?: StatsFriendStatsDataMemberInfo[];
        info?: StatsFriendStatsDataInfo;

  [key: string]: unknown
}

export interface StatsFriendStatsDataMemberInfo {

        user_random_id?: number;
        user_name?: string;
        user_avatar?: string;
        final_result?: number;

  [key: string]: unknown
}

export interface StatsFriendStatsDataInfo {

        user_num?: number;
        table_num?: number;
        profit?: number;

  [key: string]: unknown
}

// /api/stats/jackpot/award_logs (StatsJackpotAwardLogs)
export interface StatsJackpotAwardLogsRequest {

        jackpot_id?: number;
        game_type?: number[];
        poker_type?: number[];
        limit_bet_type?: number[];
        bombpot?: number[];
        start_time?: number;
        end_time?: number;
        limit?: number;
        offset?: number;

  [key: string]: unknown
}

export interface StatsJackpotAwardLogsResponseData {

        data?: StatsJackpotAwardLogsData;

  [key: string]: unknown
}

export interface StatsJackpotAwardLogsData {

        limit?: number;
        offset?: number;
        items?: StatsJackpotAwardLogsJackpotConfig[];
        top_cards_type_data?: StatsJackpotAwardLogsJackpotConfig;

  [key: string]: unknown
}

export interface StatsJackpotAwardLogsJackpotConfig {

        gold_change?: number;
        jackpot_id?: number;
        create_time?: string;
        create_timestamp?: number;
        user_id?: number;
        user_rid?: number;
        user_name?: string;
        src_room_id?: number;
        room_name?: string;
        room_multi_lang_names?: unknown;
        game_type?: number;
        poker_type?: number;
        bombpot?: number;
        cards_type?: number;
        card_data?: string;
        small_blind?: number;
        ante?: number;
        user_avatar?: string;
        mars_earth?: number;
          mushroom_amount?: number;
  [key: string]: unknown
}

// /api/stats/jackpot/gold_change_logs (StatsJackpotGoldChangeLogs)
export interface StatsJackpotGoldChangeLogsRequest {

        jackpot_id?: number;
        op_codes?: string[];
        limit?: number;
        offset?: number;

  [key: string]: unknown
}

export interface StatsJackpotGoldChangeLogsResponseData {

        data?: StatsJackpotGoldChangeLogsData;

  [key: string]: unknown
}

export interface StatsJackpotGoldChangeLogsData {

        limit?: number;
        offset?: number;
        items?: unknown[];

  [key: string]: unknown
}

// /api/stats/mtt_room_detail/{id} (StatsMttRoomDetail)
export interface StatsMttRoomDetailRequest {

        limit?: number; //条目
        offset?: number; //开始下标。例子（offset=0，limit=10，0-9。）

  [key: string]: unknown
}

export interface StatsMttRoomDetailGoods {

        i: number; //道具id
        na: string; //道具名称
        v: number; //价值等价货币
        n: number; //数量

  [key: string]: unknown
}

export interface StatsMttRoomDetailUserInfo {

        is_current_user: boolean; //是否当前用户
        user_id: number; //玩家ID
        user_random_id: number; //玩家随机ID
        nick_name: string; //玩家昵称
        avatar: string; //玩家头像
        rank: number; //排名
        hunter_rank: number; //带出筹码
        hunter_kill: number; //玩家手数
        award: number; //原始战绩
        hunter_award: number; //金豆扣减
        buy_in_times: number; //最终战绩
        goods_awrd: StatsMttRoomDetailGoods; //保险买入

  [key: string]: unknown
}

export interface StatsMttRoomDetailRoomData {

        game_type: number; //牌局类型(玩法) 游戏类型： 0-常规桌，1-OMAHA4，2-OMAHA5，3-OMAHA6
        game_room_name: string; //牌局名称
        room_id: number; //牌局ID
        start_time: number; //赛事开始时间
        end_time: number; //赛事结束时间
        player_count: number; //参与人数
        buy_in_count: number; //买入次数
        limit: number;
        offset: number;
        total: string; //总条数
        user_list: StatsMttRoomDetailUserInfo; //玩家列表

  [key: string]: unknown
}

export interface StatsMttRoomDetailData {

        room_data: StatsMttRoomDetailRoomData;
    mtt_room_data?: StatsMttRoomDetailRoomData;

  [key: string]: unknown
}

export interface StatsMttRoomDetailResponseData {

        data?: StatsMttRoomDetailData;

  [key: string]: unknown
}

// /api/stats/mtt_room_detail/{id} (StatsMttRoomDetailApi)
export interface StatsMttRoomDetailApiRequest {
  [key: string]: unknown
}

export interface StatsMttRoomDetailApiResponseData {
    data?: StatsMttRoomDetailApiData;

  [key: string]: unknown
}

// /api/stats/mtt/history/list (StatsMttHistoryList)
export interface StatsMttHistoryListRequest {

        time_type?: number;
        filter_type?: number;
        current_time_str?: string;
        limit?: number;
        offset?: number;
        time_zone?: number;

  [key: string]: unknown
}

export interface StatsMttHistoryListResponseData {

        data?: StatsMttHistoryListData;

  [key: string]: unknown
}

export interface StatsMttHistoryListData {
  [key: string]: unknown
}

// /api/stats/other_user_stats/{id} (StatsOtherUserStats)
export interface StatsOtherUserStatsRequest {
  [key: string]: unknown
}

export interface StatsOtherUserStatsResponseData {

        data?: StatsOtherUserStatsData; // 用户信息

  [key: string]: unknown
}

export interface StatsOtherUserStatsMTTRoomData {

        user_id?: number;
        play_times?: number; //参赛次数
        win_times?: number; //获奖次数
        frist_times?: number; //第一名次数
        second_times?: number; //第二名次数
        third_times?: number; //第三名次数

  [key: string]: unknown
}

export interface StatsOtherUserStatsRoomData {

        id?: number;
        user_id?: number;
        game_type?: number; //游戏类型： 0-常规桌，1-OMAHA4，2-OMAHA5，3-OMAHA6
        data_type?: number; //数据类型 1--今日；2--7天；3--30天；4--生涯
        total_game_cnt?: number; //总局数
        total_hand?: number; //总手数
        total_earn?: number; //总盈亏
        aveage_earn?: number; //场均战绩
        aveage_earn_hundred?: number; //战绩/百手
        vpip?: number; //入池率
        wins?: number; //入池胜率
        prf?: number; //翻牌前加注率
        bet3?: number; //翻牌前再加注率
        af?: number; //激进程度
        cbet?: number; //4Flop持续下注率
        wtsd?: number; //摊牌胜率
        allinWins?: number; //全下胜率
    in_pool_cnt?: number;
    in_pool_win_cnt?: number;
    prf_cnt?: number;

  [key: string]: unknown
}

export interface StatsOtherUserStatsData {

        mtt_room_data?: StatsOtherUserStatsMTTRoomData[]; //mtt数据
        room_data?: StatsOtherUserStatsRoomData[]; //普通牌局数据
    user_random_id?: number;
    fantasy_data?: StatsOtherUserStatsFantasyData;
    allin_data?: unknown;
    pool_rate?: number;
    mahjong_data?: unknown;
    sng_room_data?: StatsOtherUserStatsMTTRoomData;
    guandan_data?: unknown;
    room_total_hand?: number;
    room_in_pool_cnt?: number;

  [key: string]: unknown
}

// /api/stats/profit_data_stats/data_by_date (StatsProfitDataStatsDataByDate)
export interface StatsProfitDataStatsDataByDateRequest {

        gold_type?: number;
        start_time?: number;
        end_time?: number;
        search_type?: number;
        limit?: number;
        offset?: number;
        slave_club_id?: number;
        only_master?: boolean;
        game_types?: number[];
        poker_types?: number[];

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataByDateResponseData {

        data?: StatsProfitDataStatsDataByDateData;

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataByDateData {

        date_total?: StatsProfitDataStatsDataByDateDateTotal[];
        limit?: number;
        offset?: number;
        total?: number;

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataByDateDateTotal {

        date?: string;
        list?: StatsProfitDataStatsDataByDateRecord[];
        total_profit?: number;

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataByDateRecord {

        game_type?: number;
        poker_type?: number;
        fee?: number;
        game_status?: number;
        start_time_str?: string;
        insurance?: number;
        bombpot?: number;
        mushroom_mode?: number;
        squid_on?: number;
        jackpot_profit?: number;
        mini_profit?: number;

  [key: string]: unknown
}

// /api/stats/profit_data_stats/data_info (StatsProfitDataStatsDataInfo)
export interface StatsProfitDataStatsDataInfoRequest {

        gold_type?: number;
        start_time?: number;
        end_time?: number;
        search_type?: number;
        slave_club_id?: number;
        only_master?: boolean;
        game_types?: number[];
        poker_types?: number[];

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataInfoResponseData {

        data?: StatsProfitDataStatsDataInfoData;

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataInfoData {

        info?: StatsProfitDataStatsDataInfoTotalData;

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataInfoTotalData {

        total_profit?: number;
        fee?: number;
        insurence?: number;
        jackpot?: number;
        mini_game?: number;

  [key: string]: unknown
}

// /api/stats/profit_data_stats/user_by_date (StatsProfitDataStatsUserByDate)
export interface StatsProfitDataStatsUserByDateRequest {

        gold_type?: number;
        start_time?: number;
        end_time?: number;
        search_type?: number;
        limit?: number;
        offset?: number;
        slave_club_id?: number;
        only_master?: boolean;
        game_types?: number[];
        poker_types?: number[];
        time_zone?: number;

  [key: string]: unknown
}

export interface StatsProfitDataStatsUserByDateResponseData {

        data?: StatsProfitDataStatsUserByDateData;

  [key: string]: unknown
}

export interface StatsProfitDataStatsUserByDateData {

        date_total?: StatsProfitDataStatsUserByDateDateTotal[];
        limit?: number;
        offset?: number;
        total?: number;

  [key: string]: unknown
}

export interface StatsProfitDataStatsUserByDateDateTotal {

        date?: string;
        list?: StatsProfitDataStatsUserByDateRecord[];
        total_profit?: number;

  [key: string]: unknown
}

export interface StatsProfitDataStatsUserByDateRecord {

        user_random_id?: number;
        nick_name?: string;
        avatar?: string;
        fee?: number;
        insurance?: number;
        jackpot_profit?: number;
        mini_profit?: number;

  [key: string]: unknown
}

// /api/stats/room_detail/{id} (StatsRoomDetail)
export interface StatsRoomDetailRequest {

        limit?: number; //条目
        offset?: number; //开始下标。例子（offset=0，limit=10，0-9。）

  [key: string]: unknown
}

export interface StatsRoomDetailUserInfo {

        is_current_user: boolean; //是否当前用户
        user_id: number; //玩家ID
        user_random_id: number; //玩家随机ID
        nick_name: string; //玩家昵称
        avatar: string; //玩家头像
        bring_in: number; //买入筹码
        bring_out: number; //带出筹码
        user_room_hand_num: number; //玩家手数
        original_results: number; //原始战绩
        gold_deduction: number; //金豆扣减
        finally_game_results: number; //最终战绩
        insurance_buy_in: number; //保险买入
        insurance_profit: number; //保险收入
        insurance_sum: number; //保险合计
        insurance_original: number; //原始保险
    mushroom_count?: number;
    mushroom_amount?: number;
    in_pool_cnt?: number;
    mj_win_self_draw_count?: number;
    mj_win_discard_count?: number;
    mj_lose_discard_count?: number;
    mj_concealed_kong_count?: number;
    mj_exposed_kong_count?: number;
    cb_wins?: number;
    gd_rank_1?: number;
    gd_rank_2?: number;
    gd_rank_3?: number;
    gd_rank_4?: number;

  [key: string]: unknown
}

export interface StatsRoomDetailRoomData {

        limit: number;
        offset: number;
        total: number; //总条数
        game_type: number; //牌局类型(玩法) 游戏类型： 0-常规桌，1-OMAHA4，2-OMAHA5，3-OMAHA6
        game_room_name: string; //牌局名称
        room_id: number; //牌局ID
        ante: number; //前注
        blind: number; //盲注级别	small_blind
        player_duration: number; //牌局时长，单位秒
        all_bring_in: number; //总带入筹码
        room_total_hand_num: number; //本局总手数
        insurance_on: number; //是否开启保险 0-close, 1- open
        insurance_total: number; //牌局保险总计
        end_time: string; //结束时间
        user_list: StatsRoomDetailUserInfo; //玩家列表
    multi_lang_names_obj?: unknown;
    start_time?: string;
    max_bet_pot?: number;
    all_bet_pot?: number;

  [key: string]: unknown
}

export interface StatsRoomDetailData {

        room_data: StatsRoomDetailRoomData;

  [key: string]: unknown
}

export interface StatsRoomDetailResponseData {

        data?: StatsRoomDetailData;

  [key: string]: unknown
}

// /api/stats/room/history/list (RoomCenterHistoryList)
export interface RoomCenterHistoryListRequest {

    //     group_by?: number,      //1 room 2 mtt 3 mttroom
    //     limit?: number,         //条目
    //     offset?: number,        //开始下标。例子（offset=0，limit=10，0-9。）
    //     game_type?: number,     //游戏类型，对应客户端 枚举 GameType
    //
  [key: string]: unknown
}

export interface RoomCenterHistoryListRecords {

    //     Name: string,//房间名称
    //     Type: number,//房间类型
    //     MatchID: number,//比赛id
    //     RoomID: number,//房间id
    //     Time: string,//开始时间
    //     Change: number,//筹码变动
    //     Count: number,//总手数
    //
  [key: string]: unknown
}

export interface RoomCenterHistoryListData {

    //     limit: number,
    //     offset: number,
    //     total: number,// //总条数
    //     records: RoomCenterHistoryListRecords,
    //
  [key: string]: unknown
}

// /api/stats/room/insurance_data (StatsRoomInsuranceData)
export interface StatsRoomInsuranceDataRequest {

        room_id?: number;
        limit?: number;
        offset?: number;

  [key: string]: unknown
}

export interface StatsRoomInsuranceDataResponseData {

        data?: StatsRoomInsuranceDataData;

  [key: string]: unknown
}

export interface StatsRoomInsuranceDataData {

        limit?: number;
        offset?: number;
        list?: StatsRoomInsuranceDataRecord[];

  [key: string]: unknown
}

export interface StatsRoomInsuranceDataRecord {

        nick_name?: string;
        hand_num?: number;
        user_rid?: number;
        insur_bet?: number;
        insur_win?: number;
        create_time?: number;

  [key: string]: unknown
}

// /api/stats/room/insurance_info (StatsRoomInsuranceInfo)
export interface StatsRoomInsuranceInfoRequest {
  [key: string]: unknown
}

export interface StatsRoomInsuranceInfoResponseData {
  [key: string]: unknown
}

// /api/stats/tribe/stats/current (StatsTribeStatsCurrent)
export interface StatsTribeStatsCurrentRequest {

        time_zone?: number;

  [key: string]: unknown
}

export interface StatsTribeStatsCurrentResponseData {

        data?: StatsTribeStatsCurrentData;

  [key: string]: unknown
}

export interface StatsTribeStatsCurrentData {

        yesterday_balance?: number;
        current_balance?: number;
        current_recharge?: number;
        current_withdrawal?: number;
        current_profit?: number;
        current_add_member?: number;
        current_active_count?: number;
        current_hands_count?: number;
        seven_day_profit?: StatsTribeStatsCurrentSevenDataCurve[];
        seven_day_new_user?: StatsTribeStatsCurrentSevenDataCurve[];
        seven_day_active_user?: StatsTribeStatsCurrentSevenDataCurve[];
        seven_day_hand_num?: StatsTribeStatsCurrentSevenDataCurve[];
        apply_count?: number;

  [key: string]: unknown
}

export interface StatsTribeStatsCurrentSevenDataCurve {

        x?: string;
        y?: string;

  [key: string]: unknown
}

// /api/stats/tribe/stats/data_by_date (StatsTribeStatsDataByDate)
export interface StatsTribeStatsDataByDateRequest {

        filter_type?: number;
        current_time_str?: string;
        start_time?: number;
        end_time?: number;
        limit?: number;
        offset?: number;
        club_id?: number;
        game_types?: number[];
        time_zone?: number;

  [key: string]: unknown
}

export interface StatsTribeStatsDataByDateResponseData {

        data?: StatsTribeStatsDataByDateData;

  [key: string]: unknown
}

export interface StatsTribeStatsDataByDateData {

        date_total?: StatsTribeStatsDataByDateDateTotal[];
        offset?: number;

  [key: string]: unknown
}

export interface StatsTribeStatsDataByDateDateTotal {

        date?: string;
        list?: StatsTribeStatsDataByDateRecord[];
        tribe_service_profit_total?: number;
        tribe_insurance_profit_total?: number;

  [key: string]: unknown
}

export interface StatsTribeStatsDataByDateRecord {

        room_id?: number;
        match_id?: number;
        game_type?: number;
        poker_type?: number;
        sb?: number;
        buy_in?: number;
        buy_in_times?: number;
        fee?: number;
        game_status?: number;
        match_player_num?: number;
        is_match?: number;
        start_time_str?: string;
        insurance?: number;
        ante?: number;
        name?: string;
        multi_lang_names_obj?: unknown;
        bombpot?: number;
        club_name?: string;
        club_remark_name?: string;
        club_remark_color?: string;

  [key: string]: unknown
}

// /api/stats/tribe/stats/data_detail (StatsTribeStatsDataDetail)
export interface StatsTribeStatsDataDetailRequest {

        club_id?: number;
        room_id?: number;
        match_id?: number;
        limit?: number;
        offset?: number;

  [key: string]: unknown
}

export interface StatsTribeStatsDataDetailResponseData {

        data?: StatsTribeStatsDataDetailData;

  [key: string]: unknown
}

export interface StatsTribeStatsDataDetailData {

        list?: unknown[];
        offset?: number;

  [key: string]: unknown
}

// /api/stats/tribe/stats/data_detail_info (StatsTribeStatsDataDetailInfo)
export interface StatsTribeStatsDataDetailInfoRequest {

        club_id?: number;
        room_id?: number;
        match_id?: number;

  [key: string]: unknown
}

export interface StatsTribeStatsDataDetailInfoResponseData {

        data?: StatsTribeStatsDataDetailInfoData;

  [key: string]: unknown
}

export interface StatsTribeStatsDataDetailInfoData {

        info?: unknown;

  [key: string]: unknown
}

// /api/stats/tribe/stats/data_info (StatsTribeStatsDataInfo)
export interface StatsTribeStatsDataInfoRequest {

        filter_type?: number;
        current_time_str?: string;
        start_time?: number;
        end_time?: number;
        club_id?: number;
        game_types?: number[];
        time_zone?: number;

  [key: string]: unknown
}

export interface StatsTribeStatsDataInfoResponseData {

        data?: StatsTribeStatsDataInfoData;

  [key: string]: unknown
}

export interface StatsTribeStatsDataInfoData {

        info?: StatsTribeStatsDataInfoTotalData;

  [key: string]: unknown
}

export interface StatsTribeStatsDataInfoTotalData {

        game_num?: number;
        hand_num?: number;
        tribe_service_profit_total?: number;
        tribe_insurance_profit_total?: number;

  [key: string]: unknown
}

// /api/stats/tribe/stats/download (StatsTribeStatsDownLoad)
export interface StatsTribeStatsDownLoadRequest {

        filter_type?: number;
        start_time?: string;
        end_time?: string;
        start_time_unix?: number;
        end_time_unix?: number;
        lang?: string;
        time_zone?: number;

  [key: string]: unknown
}

export interface StatsTribeStatsDownLoadResponseData {

        data?: StatsTribeStatsDownLoadData;

  [key: string]: unknown
}

export interface StatsTribeStatsDownLoadData {

        url?: string;

  [key: string]: unknown
}

// /api/stats/user_stats (StatsUserStats)
export interface StatsUserStatsRequest {

        game_type?: number; //游戏类型0-all,1-常规桌，2-OMAHA4，3-OMAHA5，4-OMAHA6,5-mtt
        time_type?: number; //游戏类型1-今日, 2-7天, 3-30天, 4-生涯
        time_long?: number; //客户端时间戳
        room_Type?: number;

  [key: string]: unknown
}

export interface StatsUserStatsMTTRoomData {

        user_id: string;
        play_times: number; //参赛次数
        win_times: number; //获奖次数
        frist_times: number; //第一名次数
        second_times: string; //第二名次数
        third_times: number; //第三名次数

  [key: string]: unknown
}

export interface StatsUserStatsRoomData {

        id: string;
        user_id: number;
        game_type: number; //游戏类型： 0-常规桌，1-OMAHA4，2-OMAHA5，3-OMAHA6
        data_type: number; //数据类型 1--今日；2--7天；3--30天；4--生涯
        total_game_cnt: string; //总局数
        total_hand: number; //总手数
        total_earn: number; //总盈亏
        aveage_earn: number; //场均战绩
        aveage_earn_hundred: number; //战绩/百手
        vpip: number; //入池率
        wins: number; //入池胜率
        prf: number; //翻牌前加注率
        bet3: number; //翻牌前再加注率
        af: number; //激进程度
        cbet: number; //4Flop持续下注率
        wtsd: number; //摊牌胜率
        allinWins: number; //全下胜率
    fantasy_count?: number;
    nuts?: number;
    full_win?: number;
    max_card_data?: string;
    mj_win_self_draw_count?: number;
    mj_win_discard_count?: number;
    mj_lose_discard_count?: number;
    mj_concealed_kong_count?: number;
    mj_exposed_kong_count?: number;
    cb_wins?: number;
    cb_bet?: number;
    gd_rank1?: number;
    gd_rank2?: number;
    gd_rank3?: number;
    gd_rank4?: number;
    gd_rank1_rate?: number;

  [key: string]: unknown
}

export interface StatsUserStatsData {

        mtt_room_data: StatsUserStatsMTTRoomData;
        room_data: StatsUserStatsRoomData;

  [key: string]: unknown
}

export interface StatsUserStatsResponseData {

        data?: StatsUserStatsData;

  [key: string]: unknown
}

// /api/stats/user_stats/all (StatsUserStatsAll)
export interface StatsUserStatsAllRequest {
  [key: string]: unknown
}

export interface StatsUserStatsAllResponseData {
  [key: string]: unknown
}

// /api/stats/user_stats/allin (StatsUserStatsAllin)
export interface StatsUserStatsAllinRequest {

        gold_type?: number;
        end_time?: number;
        start_time?: number;
        aof_type?: number;
        club_id?: number;
        game_types?: number[];
        poker_types?: number[];

  [key: string]: unknown
}

export interface StatsUserStatsAllinResponseData {

        data?: StatsUserStatsAllinData;

  [key: string]: unknown
}

export interface StatsUserStatsAllinData {

        stats?: StatsUserStatsAllinStats;

  [key: string]: unknown
}

export interface StatsUserStatsAllinStats {

        hand_count?: number;
        loss_count?: number;
        profit_count?: number;
        profit_total?: number;
        active_count?: number;
        passive_count?: number;
        ahead_count?: number;
        behind_count?: number;
        active_profit_count?: number;
        passive_profit_count?: number;
        ahead_profit_count?: number;
        behind_profit_count?: number;

  [key: string]: unknown
}

// /api/stats/user_stats/card_type (StatsUserStatsCardType)
export interface StatsUserStatsCardTypeRequest {

        gold_type?: number;
        aof_type?: number;
        start_time?: number;
        end_time?: number;
        club_id?: number;
        order_type?: number;
        limit?: number;
        offset?: number;
        game_types?: number[];
        poker_types?: number[];

  [key: string]: unknown
}

export interface StatsUserStatsCardTypeResponseData {

        data?: StatsUserStatsCardTypeData;

  [key: string]: unknown
}

export interface StatsUserStatsCardTypeData {

        total?: number;
        limit?: number;
        offset?: number;
        records?: StatsUserStatsCardTypeRecord[];

  [key: string]: unknown
}

export interface StatsUserStatsCardTypeRecord {

        hand_card_type?: string;
        hand_count?: number;
        loss_count?: number;
        profit_count?: number;
        profit_total?: number;
        profit_ratio?: number;

  [key: string]: unknown
}

// /api/stats/user_stats/rival_room_stats (StatsUserStatsRivalRoomStats)
export interface StatsUserStatsRivalRoomStatsRequest {

        gold_type?: number;
        start_time?: number;
        end_time?: number;
        order_type?: number;
        club_id?: number;
        limit?: number;
        offset?: number;

  [key: string]: unknown
}

export interface StatsUserStatsRivalRoomStatsResponseData {

        data?: StatsUserStatsRivalRoomStatsData;

  [key: string]: unknown
}

export interface StatsUserStatsRivalRoomStatsData {

        total?: number;
        limit?: number;
        offset?: number;
        records?: StatsUserStatsRivalRoomStatsRecord[];

  [key: string]: unknown
}

export interface StatsUserStatsRivalRoomStatsRecord {

        user_id?: number;
        nickname?: string;
        avatar?: string;
        hand_count?: number;
        loss_count?: number;
        profit_count?: number;
        profit_total?: number;

  [key: string]: unknown
}

// /api/stats/user/game/record/list (StatsUserGameRecordList)
export interface StatsUserGameRecordListRequest {

        filter_type?: number;
        room_type?: number;
        current_time_str?: string;
        club_id?: number;
        limit?: number;
        offset?: number;
        game_types?: number[];
        poker_types?: number[];
        start_time?: number;
        time_zone?: number;

  [key: string]: unknown
}

export interface StatsUserGameRecordListResponseData {

        data?: StatsUserGameRecordListData;

  [key: string]: unknown
}

export interface StatsUserGameRecordListData {

        total?: number;
        limit?: number;
        offset?: number;
        records?: StatsUserGameRecordListMap[];

  [key: string]: unknown
}

export interface StatsUserGameRecordListMap {

        total?: number;
        room_record?: StatsUserGameRecordListRoom_record;
        user_game_records?: StatsUserGameRecordListRecord[];

  [key: string]: unknown
}

export interface StatsUserGameRecordListRoom_record {

        name?: string;
        room_id?: number;
        small_blind?: number;
        game_type?: number;
        poker_type?: number;
        gold_type?: number;
        random_ante?: string;

  [key: string]: unknown
}

export interface StatsUserGameRecordListRecord {

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

// /api/stats/user/room/match/id/list (StatsUserRoomMatchIdList)
export interface StatsUserRoomMatchIdListRequest {

        start_time?: number;
        end_time?: number;

  [key: string]: unknown
}

export interface StatsUserRoomMatchIdListResponseData {

        _data?: StatsUserRoomMatchIdListIdListData;

  [key: string]: unknown
}

export interface StatsUserRoomMatchIdListIdListData {

        _matchIds?: number[];
        _roomIds?: number[];

  [key: string]: unknown
}

// /api/stats/user/room/match/list (StatsUserRoomMatchList)
export interface StatsUserRoomMatchListRequest {

        _roomIds?: number[];
        _matchIds?: number[];

  [key: string]: unknown
}

export interface StatsUserRoomMatchListResponseData {

        _recordData?: unknown;

  [key: string]: unknown
}

// /api/stats/user/standings (ClubStandiNgs)
export interface ClubStandiNgsRequest {

    //     "user_id": number,
    //     "game_type": number,
    //     "time_type": number,
    //     "time_long": number
    //
  [key: string]: unknown
}

export interface ClubStandiNgsResponseData {
  [key: string]: unknown
}

export interface ClubDataStatsDataData {
    list?: ClubDataStatsDataRecord[];

  [key: string]: unknown
}

export interface ClubDataStatsDataRecord {
    room_id?: number;
    match_id?: number;
    game_start_time?: string;
    date?: string;
    game_type?: number;
    poker_types?: number;
    sb?: number;
    buy_in?: number;
    buy_in_times?: number;
    fee?: number;
    game_status?: number;
    match_player_num?: number;
    is_match?: number;
    start_time?: number;
    start_time_str?: string;
    insurance?: number;
    ante?: number;

  [key: string]: unknown
}

export interface ClubDataStatsDataDetailData {
  list?: DataRecord[];
    offset?: number;
    room_info?: ClubDataStatsDataDetailRoomInfo;

  [key: string]: unknown
}

export interface ClubDataStatsDataDetailRoomInfo {
    jackpot?: number;

  [key: string]: unknown
}

export interface ClubDataStatsDataDetailInfoData {
  info?: DataTotalData;

  [key: string]: unknown
}

export interface ClubDataStatsDataInfoData {
    info?: ClubDataStatsDataInfoTotalData;

  [key: string]: unknown
}

export interface ClubDataStatsDataInfoTotalData {
    game_num?: number;
    hand_num?: number;
    profit?: number;
    fee?: number;
    insurence?: number;
    club_total_profit?: number;
    jackpot?: number;
    mini_game?: number;

  [key: string]: unknown
}

export interface GuildDataVipInfoData {
    list?: GuildDataVipInfoTotalData[];

  [key: string]: unknown
}

export interface GuildDataVipInfoTotalData {
    filter_time?: number;
    game_type?: number;
    hand_num?: number;
    profit?: number;
    fee?: number;

  [key: string]: unknown
}

export interface DataRecord {
  [key: string]: unknown
}

export interface DataTotalData {
  [key: string]: unknown
}

export interface FriendRoomStatsData {
    friend_room_stats_6?: FriendRoomStatsRecord;
    friend_room_stats_nlh?: FriendRoomStatsRecord;
    friend_room_stats_plo?: FriendRoomStatsRecord;
    friend_room_stats_fantasy?: FriendRoomStatsRecord;
    friend_room_stats_mj?: FriendRoomStatsRecord;

  [key: string]: unknown
}

export interface FriendRoomStatsRecord {
    game_type?: number;
    game_num?: number;
    hand_num?: number;

  [key: string]: unknown
}

export interface FriendRoomStatsDataData {
    list?: FriendRoomStatsDataRecord[];
    limit?: number;
    offset?: number;
    total?: number;

  [key: string]: unknown
}

export interface FriendRoomStatsDataRecord {
    room_id?: number;
    game_start_time?: string;
    date?: string;
    game_type?: number;
    poker_type?: number;
    sb?: number;
    buy_in?: number;
    fee?: number;
    game_status?: number;
    start_time_str?: string;
    bombpot?: number;
    mushroom_mode?: number;
    squid_on?: number;

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailData {
    list?: FriendRoomStatsDataDetailRecord[];
    limit?: number;
    offset?: number;
    total?: number;

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailRecord {
    avatar?: string;
    nick_name?: string;
    random_id?: number;
    win?: number;
    fee?: number;
    buy_in?: number;
    hand_num?: number;

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailInfoData {
    info?: FriendRoomStatsDataDetailInfoTotalData;

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailInfoTotalData {
    game_status?: number;
    creator_id?: number;
    creator_name?: string;
    name?: string;
    sb?: number;
    min_buy_in?: number;
    max_buy_in?: number;
    fee_ratio?: number;
    total_fee?: number;
    insurance?: number;
    player_num?: number;

  [key: string]: unknown
}

export interface FriendRoomStatsDataInfoData {
    info?: FriendRoomStatsDataInfoTotalData;

  [key: string]: unknown
}

export interface FriendRoomStatsDataInfoTotalData {
    game_num?: number;
    hand_num?: number;
    profit?: number;
    fee?: number;

  [key: string]: unknown
}

export interface StatsMttRoomDetailApiData {
    mtt_room_data?: StatsMttRoomDetailApiRoomData;

  [key: string]: unknown
}

export interface StatsMttRoomDetailApiRoomData {
    game_type?: number;
    game_room_name?: string;
    room_id?: number;
    start_time?: string;
    end_time?: string;
    player_count?: number;
    buy_in_count?: number;
    limit?: number;
    user_list?: StatsMttRoomDetailApiUserInfo[];

  [key: string]: unknown
}

export interface StatsMttRoomDetailApiUserInfo {
    user_random_id?: number;
    nick_name?: string;
    avatar?: string;
    award?: number;
    hunter_award?: number;
    goods_awrd?: StatsMttRoomDetailApiGoods[];

  [key: string]: unknown
}

export interface StatsMttRoomDetailApiGoods {
    n?: number;

  [key: string]: unknown
}

export interface StatsOtherUserStatsFantasyData {
    total_game_cnt?: number;
    nuts?: number;
    wins?: number;
    fantasy_count?: number;

  [key: string]: unknown
}


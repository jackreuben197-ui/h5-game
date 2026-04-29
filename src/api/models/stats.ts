// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/stats

// /api/stats/client/click/log (StatsClientClickLog)
export interface StatsClientClickLogRequest {

        device_id?: string; // 设备唯一id
        mac_addr?: string; // mac地址
        is_simulator?: boolean; // 是否是模拟器
        simulator_name?: string; // 模拟器名称
        system_version?: string; // 系统版本号
        user_device_no?: string; // 设备机型
        records?: StatsClientClickLogRecordData[]; // 统计数据列表

  [key: string]: unknown
}

export interface StatsClientClickLogResponseData extends StatsClientClickLogData {
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
    end_time?: number; // 结束时间戳
    current_time_str?: string; // 当前时间
    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    user_id?: number; // 传0 个人数据。传值 俱乐部数据
    game_types?: number[]; // 游戏类型
    time_zone?: number; // 时区

  [key: string]: unknown
}

export interface ClubDataStatsDataResponseData extends ClubDataStatsDataData {
  [key: string]: unknown
}

// /api/stats/club_data_stats/data_detail (ClubDataStatsDataDetail)
export interface ClubDataStatsDataDetailRequest {
    room_id?: number; // 房间id
    match_id?: number; // 比赛id
    order_by?: string; // 订单号
    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    slave_club_id?: number; // 从俱乐部id
    only_master?: boolean; // 只查询主俱乐部数据

  [key: string]: unknown
}

export interface ClubDataStatsDataDetailResponseData extends ClubDataStatsDataDetailData {
  [key: string]: unknown
}

// /api/stats/club_data_stats/data_detail_info (ClubDataStatsDataDetailInfo)
export interface ClubDataStatsDataDetailInfoRequest {
    room_id?: number; // 房间id
    match_id?: number; // 比赛id
    slave_club_id?: number; // 从俱乐部id
    only_master?: boolean; // 只查询主俱乐部数据

  [key: string]: unknown
}

export interface ClubDataStatsDataDetailInfoResponseData extends ClubDataStatsDataDetailInfoData {
  [key: string]: unknown
}

// /api/stats/club_data_stats/data_detail/download (StatsClubDataStatsDataDetailDownLoad)
export interface StatsClubDataStatsDataDetailDownLoadRequest {

        filter_type?: number; // 筛选类型 0为全部1 金豆（UC） 2 USDT（GC） 3 记分牌（chip）
        start_time?: string; // 开始时间
        end_time?: string; // 结束时间
        start_time_unix?: number; // 开始时间时间戳，单位秒
        end_time_unix?: number; // 结束时间时间戳，单位秒
        lang?: string; // 语言代码
        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsClubDataStatsDataDetailDownLoadResponseData extends StatsClubDataStatsDataDetailDownLoadData {
  [key: string]: unknown
}

export interface StatsClubDataStatsDataDetailDownLoadData {

        log_id?: number;
        url?: string;

  [key: string]: unknown
}

// /api/stats/club_data_stats/data_info (ClubDataStatsDataInfo)
export interface ClubDataStatsDataInfoRequest {
    filter_type?: number; // 筛选类型 1 UC币（UC） 2 USDT（GC） 3 记分牌（chip）
    start_time?: number; // 开始时间戳
    end_time?: number; // 结束时间戳
    current_time_str?: string; // 时间戳
    user_id?: number; // 指定用户
    slave_club_id?: number; // 从俱乐id
    only_master?: boolean; // 只查询主俱乐部数据
    game_types?: number[]; // 游戏类型
    poker_types?: number[]; // 牌型
    club_id?: number;

  [key: string]: unknown
}

export interface ClubDataStatsDataInfoResponseData extends ClubDataStatsDataInfoData {
  [key: string]: unknown
}

// /api/stats/club_data_stats/user_detail (StatsClubDataStatsUserDetail)
export interface StatsClubDataStatsUserDetailRequest {

        filter_time?: number; // 时间范围（天数） 0 全部 1 今天 7 7天内 以此类推
        start_time?: number; // 开始时间戳
        end_time?: number; // 结束时间戳
        time_long?: number; // 时间戳
        user_id?: number; // 用户id
        filter_type?: number; // 1 USDT 2 联盟币 3 记分牌
        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsClubDataStatsUserDetailResponseData extends StatsClubDataStatsUserDetailData {
  [key: string]: unknown
}

export interface StatsClubDataStatsUserDetailData {

        stats_all?: StatsClubDataStatsUserDetailTotalData; // 所有游戏类型的汇总数据
        stats_nlh?: StatsClubDataStatsUserDetailTotalData; // NLH（德州扑克）游戏数据汇总
        stats_plo?: StatsClubDataStatsUserDetailTotalData; // PLO（奥马哈）游戏数据汇总
        stats_6?: StatsClubDataStatsUserDetailTotalData; // 6+游戏数据汇总

  [key: string]: unknown
}

export interface StatsClubDataStatsUserDetailTotalData {

        game_num?: number; // 游戏局数
        hand_num?: number; // 手数
        grant_gold_amount?: number; // 总发放联盟币数（新）
        recover_gold_amount?: number; // 总回收联盟币数
        recharge_usdt_amount?: number; // 总充值usdt数
        recover_usdt_amount?: number; // 总回收usdt数
        profit?: number; // 收益
        fee?: number; // 服务
        agent_fee?: number; // 代理服务
        insurance?: number; // 保险
        agent_insurance?: number; // 代理保险

  [key: string]: unknown
}

// /api/stats/club_data_stats/vip_game (GuildDataVipInfo)
export interface GuildDataVipInfoRequest {
    filter_type?: number; // 1 UC币（UC） 2 USDT（GC） 3 记分牌（chip）
    start_time?: number; // 开始时间戳
    end_time?: number; // 结束时间戳
    time_long?: number; // 时间戳
    user_id?: number; // 用户id
    game_types?: number[]; // 游戏类型
    time_zone?: number; // 时区

  [key: string]: unknown
}

export interface GuildDataVipInfoResponseData extends GuildDataVipInfoData {
  [key: string]: unknown
}

// /api/stats/club_data_stats/vip_user (StatsClubDataStatsVipUser)
export interface StatsClubDataStatsVipUserRequest {

        vip_user_id?: number; // 用户id

  [key: string]: unknown
}

export interface StatsClubDataStatsVipUserResponseData extends StatsClubDataStatsVipUserData {
  [key: string]: unknown
}

export interface StatsClubDataStatsVipUserData {

        info?: StatsClubDataStatsVipUserTotalData;

  [key: string]: unknown
}

export interface StatsClubDataStatsVipUserTotalData {

        user_count?: number; // 下线总人数
        user_gold_tribe_total?: number; // 总充值联盟币数
        user_gold_usdt_total?: number; // 总充值usdt数

  [key: string]: unknown
}

// /api/stats/club_data_stats/weekly_report (StatsClubDataStatsWeeklyReport)
export interface StatsClubDataStatsWeeklyReportRequest {

        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsClubDataStatsWeeklyReportResponseData extends StatsClubDataStatsWeeklyReportData {
  [key: string]: unknown
}

export interface StatsClubDataStatsWeeklyReportData {

        list?: StatsClubDataStatsWeeklyReportLableData[];
        total_info?: StatsClubDataStatsWeeklyReportTotalInfo;

  [key: string]: unknown
}

export interface StatsClubDataStatsWeeklyReportTotalInfo {

        deposits?: number; // 充值（+发放）总额
        withdraw?: number; // 提现（+回收）总额
        hands?: number; // 总手数
        win?: number; // 总输赢
        fee?: number; // 总服务费
        ins?: number; // 总保险
        prb?: number; // 总返水（个人返水）
        crb?: number; // 俱乐部总收入
        start_time?: number; // 周报统计开始时间（时间戳）
        end_time?: number; // 周报统计结束时间（时间戳）

  [key: string]: unknown
}

export interface StatsClubDataStatsWeeklyReportLableData {

        name?: string; // 玩家名称
        id?: number; // 玩家ID
        hands?: number; // 手数
        win?: number; // 输赢
        fee?: number; // 服务费
        ins?: number; // 保险
        prb?: number; // 返水（个人返水）
        crb?: number; // 俱乐部收入

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

        room_id?: number; // 房间id
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值

  [key: string]: unknown
}

export interface StatsCowboyHistoryRoomDetailResponseData extends StatsCowboyHistoryRoomDetailDataObj {
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

export interface FriendRoomStatsResponseData extends FriendRoomStatsData {
  [key: string]: unknown
}

// /api/stats/friend_room_stats/data (FriendRoomStatsData)
export interface FriendRoomStatsDataRequest {
    start_time?: number; // 开始时间戳
    end_time?: number; // 结束时间戳
    limit?: number; // 每次请求的数据条数
    offset?: number; // 数据起始偏移值
    game_types?: number[]; // 游戏类型
    time_zone?: number; // 时区

  [key: string]: unknown
}

export interface FriendRoomStatsDataResponseData extends FriendRoomStatsDataData {
  [key: string]: unknown
}

// /api/stats/friend_room_stats/data_detail (FriendRoomStatsDataDetail)
export interface FriendRoomStatsDataDetailRequest {
    room_id?: number; // 房间ID
    order_by?: string; // 排序
    limit?: number; // 数据数量
    offset?: number; // 当前偏移值

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailResponseData extends FriendRoomStatsDataDetailData {
  [key: string]: unknown
}

// /api/stats/friend_room_stats/data_detail_info (FriendRoomStatsDataDetailInfo)
export interface FriendRoomStatsDataDetailInfoRequest {
    room_id?: number; // 房间id

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailInfoResponseData extends FriendRoomStatsDataDetailInfoData {
  [key: string]: unknown
}

// /api/stats/friend_room_stats/data_info (FriendRoomStatsDataInfo)
export interface FriendRoomStatsDataInfoRequest {
    start_time?: number; // 开始时间戳
    end_time?: number; // 结束时间戳
    game_types?: number[]; // 游戏类型

  [key: string]: unknown
}

export interface FriendRoomStatsDataInfoResponseData extends FriendRoomStatsDataInfoData {
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

        start_time?: number; // 开始时间
        end_time?: number; // 结束时间
        game_types?: number[]; // 游戏类型（0-德州; 1-OMAHA4; 2-OMAHA5; 3-OMAHA6; 4-Fantasy; 5-牛仔; 6-麻将; 7-掼蛋）
        poker_types?: number[]; // 牌类型
        offset?: number; // 当前偏移值
        limit?: number; // 数据数量

  [key: string]: unknown
}

export interface StatsFriendStatsDataResponseData extends StatsFriendStatsDataData {
  [key: string]: unknown
}

export interface StatsFriendStatsDataData {

        offset?: number; // 当前偏移值
        list?: StatsFriendStatsDataMemberInfo[]; // 成员信息列表
        info?: StatsFriendStatsDataInfo; // 汇总信息

  [key: string]: unknown
}

export interface StatsFriendStatsDataMemberInfo {

        user_random_id?: number; // 用户随机ID
        user_name?: string; // 用户名称
        user_avatar?: string; // 用户头像
        final_result?: number; // 盈亏

  [key: string]: unknown
}

export interface StatsFriendStatsDataInfo {

        user_num?: number; // 参与人数
        table_num?: number; // 牌桌数量
        profit?: number; // 我的收益

  [key: string]: unknown
}

// /api/stats/jackpot/award_logs (StatsJackpotAwardLogs)
export interface StatsJackpotAwardLogsRequest {

        jackpot_id?: number; // jackpot ID
        game_type?: number[]; // 游戏类型：0德州；1、2、3奥马哈
        poker_type?: number[]; // 扑克类型：0普通；2-6+
        limit_bet_type?: number[]; // 限注类型：0-无底池限制，1-底池限制，2-AOF
        bombpot?: number[]; // Bombpot 类型：0-非；1是
        start_time?: number; // 开始时间
        end_time?: number; // 结束时间
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值

  [key: string]: unknown
}

export interface StatsJackpotAwardLogsResponseData extends StatsJackpotAwardLogsData {
  [key: string]: unknown
}

export interface StatsJackpotAwardLogsData {

        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
        items?: StatsJackpotAwardLogsJackpotConfig[];
        top_cards_type_data?: StatsJackpotAwardLogsJackpotConfig; // 最大牌型（相同牌型金额最大的）

  [key: string]: unknown
}

export interface StatsJackpotAwardLogsJackpotConfig {

        gold_change?: number; // 资金变动
        jackpot_id?: number; // jackpot模版ID
        create_time?: string; // 创建时间
        create_timestamp?: number; // 创建时间戳 ; 注意：目前只有推送数据时，才有该值
        user_id?: number; // 用户id
        user_rid?: number; // 用户rid
        user_name?: string; // 用户名称
        src_room_id?: number; // 房间id
        room_name?: string; // 房间名称
        room_multi_lang_names?: unknown;
        game_type?: number; // 游戏类型：0-常规桌，1-OMAHA4，2-OMAHA5，3-OMAHA6
        poker_type?: number; // 牌类型：0-标准,长牌，2-短牌
        bombpot?: number; // bombpot开启 0 关闭 1 开启
        cards_type?: number; // 获奖牌型；10-皇家同花顺;9-同花顺;8-四条
        card_data?: string; // 58,28,53,13,8,
        small_blind?: number; // 小盲
        ante?: number; // 前注
        user_avatar?: string; // 用户头像
        mars_earth?: number; // 1.火星撞地球奖励 0.默认
          mushroom_amount?: number;
  [key: string]: unknown
}

// /api/stats/jackpot/gold_change_logs (StatsJackpotGoldChangeLogs)
export interface StatsJackpotGoldChangeLogsRequest {

        jackpot_id?: number; // ID
        op_codes?: string[]; // 操作码：JACKPOTCONTRI贡献；JACKPOTAWD奖励
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值

  [key: string]: unknown
}

export interface StatsJackpotGoldChangeLogsResponseData extends StatsJackpotGoldChangeLogsData {
  [key: string]: unknown
}

export interface StatsJackpotGoldChangeLogsData {

        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
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
        limit: number; // 条目数
        offset: number;
        total: string; //总条数
        user_list: StatsMttRoomDetailUserInfo; //玩家列表

  [key: string]: unknown
}

export interface StatsMttRoomDetailData {

        room_data: StatsMttRoomDetailRoomData;
    mtt_room_data?: StatsMttRoomDetailRoomData; // MTT 房间配置信息

  [key: string]: unknown
}

export interface StatsMttRoomDetailResponseData extends StatsMttRoomDetailData {
  [key: string]: unknown
}

// /api/stats/mtt_room_detail/{id} (StatsMttRoomDetailApi)
export interface StatsMttRoomDetailApiRequest {
    limit?: number; // 条目数量
    offset?: number; // 开始下标。例子（offset=0，limit=10，表示第0-9条）

  [key: string]: unknown
}

export interface StatsMttRoomDetailApiResponseData extends StatsMttRoomDetailApiData {
  [key: string]: unknown
}

// /api/stats/mtt/history/list (StatsMttHistoryList)
export interface StatsMttHistoryListRequest {

        time_type?: number; // 时间类型: 1-今日, 2-7天, 3-30天, 4-生涯
        filter_type?: number; // 筛选类型: 1-USDT 2-联盟币 3-记分牌
        current_time_str?: string; // 时间戳（毫秒）
        limit?: number; // 条目数量
        offset?: number; // 开始下标。例子（offset=0，limit=10，0-9。）
        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsMttHistoryListResponseData extends StatsMttHistoryListData {
  [key: string]: unknown
}

export interface StatsMttHistoryListData {
  [key: string]: unknown
}

// /api/stats/other_user_stats/{id} (StatsOtherUserStats)
export interface StatsOtherUserStatsRequest {
    game_type?: number; // 游戏类型 0-常规桌，1-OMAHA4，2-OMAHA5，3-OMAHA6 4-Fantasy
    poker_type?: number; // 牌类型
    gold_type?: number; // 币种类型，1 联盟币， 2 usdt, 3 记分牌
    origin_type?: number; // 币种类型，1 联盟币， 2 usdt, 3 记分牌
    room_id?: number; // 房间id
    user_random_id?: number[]; // 玩家随机Id

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
    in_pool_cnt?: number; // 入池手数
    in_pool_win_cnt?: number; // 入池赢牌手数
    prf_cnt?: number; // 翻牌前加注手数

  [key: string]: unknown
}

export interface StatsOtherUserStatsData {

        mtt_room_data?: StatsOtherUserStatsMTTRoomData[]; //mtt数据
        room_data?: StatsOtherUserStatsRoomData[]; //普通牌局数据
    user_random_id?: number; // 玩家随机Id
    fantasy_data?: StatsOtherUserStatsFantasyData; // Fantasy 数据
    allin_data?: unknown; // All-in 数据
    pool_rate?: number; // 入池率
    mahjong_data?: unknown; // 麻将数据
    sng_room_data?: StatsOtherUserStatsMTTRoomData; // SNG 数据
    guandan_data?: unknown; // 掼蛋数据
    room_total_hand?: number; // 房间总手数
    room_in_pool_cnt?: number; // 房间入池手数

  [key: string]: unknown
}

// /api/stats/profit_data_stats/data_by_date (StatsProfitDataStatsDataByDate)
export interface StatsProfitDataStatsDataByDateRequest {

        gold_type?: number; // 1 UC币（UC） 2 USDT（GC） 3 记分牌（chip）
        start_time?: number; // 开始时间戳
        end_time?: number; // 结束时间戳
        search_type?: number; // 0朋友桌，1 俱樂部
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
        slave_club_id?: number; // 从俱乐部id
        only_master?: boolean; // 只查询主俱乐部数据
        game_types?: number[]; // 游戏类型
        poker_types?: number[]; // 牌类型 0-长牌 2-短牌

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataByDateResponseData extends StatsProfitDataStatsDataByDateData {
  [key: string]: unknown
}

export interface StatsProfitDataStatsDataByDateData {

        date_total?: StatsProfitDataStatsDataByDateDateTotal[]; // 收益数据列表
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
        total?: number; // 总条数

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataByDateDateTotal {

        date?: string; // 时间
        list?: StatsProfitDataStatsDataByDateRecord[];
        total_profit?: number; // 收益

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataByDateRecord {

        game_type?: number; // 游戏类型 1-NLH，2-PLO，3-6
        poker_type?: number; // 游戏类型 1-NLH，2-PLO，3-6
        fee?: number; // 服务费
        game_status?: number; // 牌局状态 1-准备中 2-进行中 3-已结束
        start_time_str?: string; // 牌局日期带时区
        insurance?: number; // 保险
        bombpot?: number; // 1是开启bombpot
        mushroom_mode?: number;
        squid_on?: number;
        jackpot_profit?: number; // jackpot收益
        mini_profit?: number; // 牛仔收益

  [key: string]: unknown
}

// /api/stats/profit_data_stats/data_info (StatsProfitDataStatsDataInfo)
export interface StatsProfitDataStatsDataInfoRequest {

        gold_type?: number; // 1 UC币（UC） 2 USDT（GC） 3 记分牌（chip）
        start_time?: number; // 开始时间戳
        end_time?: number; // 结束时间戳
        search_type?: number; // 查询类型 0朋友桌，1 俱樂部
        slave_club_id?: number; // 从俱乐部id
        only_master?: boolean; // 只查询主俱乐部数据
        game_types?: number[]; // 游戏类型
        poker_types?: number[]; // 牌类型

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataInfoResponseData extends StatsProfitDataStatsDataInfoData {
  [key: string]: unknown
}

export interface StatsProfitDataStatsDataInfoData {

        info?: StatsProfitDataStatsDataInfoTotalData;

  [key: string]: unknown
}

export interface StatsProfitDataStatsDataInfoTotalData {

        total_profit?: number; // 总盈利
        fee?: number; // 服务费
        insurence?: number; // 保险
        jackpot?: number; // jackpot
        mini_game?: number; // 牛仔

  [key: string]: unknown
}

// /api/stats/profit_data_stats/user_by_date (StatsProfitDataStatsUserByDate)
export interface StatsProfitDataStatsUserByDateRequest {

        gold_type?: number; // 1 UC币（UC） 2 USDT（GC） 3 记分牌（chip）
        start_time?: number; // 开始时间戳
        end_time?: number; // 结束时间戳
        search_type?: number; // 0朋友桌，1 俱樂部
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
        slave_club_id?: number; // 从俱乐部id
        only_master?: boolean; // 只查询主俱乐部数据
        game_types?: number[]; // 游戏类型
        poker_types?: number[]; // 牌类型 0-长牌 2-短牌
        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsProfitDataStatsUserByDateResponseData extends StatsProfitDataStatsUserByDateData {
  [key: string]: unknown
}

export interface StatsProfitDataStatsUserByDateData {

        date_total?: StatsProfitDataStatsUserByDateDateTotal[];
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
        total?: number; // 总条数

  [key: string]: unknown
}

export interface StatsProfitDataStatsUserByDateDateTotal {

        date?: string;
        list?: StatsProfitDataStatsUserByDateRecord[];
        total_profit?: number; // 收益

  [key: string]: unknown
}

export interface StatsProfitDataStatsUserByDateRecord {

        user_random_id?: number; // 比赛ID
        nick_name?: string; // 名称
        avatar?: string; // 图标
        fee?: number; // 服务费
        insurance?: number; // 保险
        jackpot_profit?: number; // jackpot收益
        mini_profit?: number; // 牛仔收益

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
    mushroom_count?: number; // 蘑菇次数
    mushroom_amount?: number; // 蘑菇金额
    in_pool_cnt?: number; // 入池手数
    mj_win_self_draw_count?: number; // 麻将自摸次数
    mj_win_discard_count?: number; // 麻将接炮次数
    mj_lose_discard_count?: number; // 麻将点炮次数
    mj_concealed_kong_count?: number; // 麻将暗杠次数
    mj_exposed_kong_count?: number; // 麻将明杠次数
    cb_wins?: number; // 牛仔押中率
    gd_rank_1?: number; // 掼蛋头游次数
    gd_rank_2?: number; // 掼蛋二游次数
    gd_rank_3?: number; // 掼蛋三游次数
    gd_rank_4?: number; // 掼蛋末游次数

  [key: string]: unknown
}

export interface StatsRoomDetailRoomData {

        limit: number; // 条目
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
    multi_lang_names_obj?: unknown; // 牌局名称，多语言
    start_time?: string; // 开始时间
    max_bet_pot?: number; // 最大底池
    all_bet_pot?: number; // 总流水

  [key: string]: unknown
}

export interface StatsRoomDetailData {

        room_data: StatsRoomDetailRoomData; // 房间数据

  [key: string]: unknown
}

export interface StatsRoomDetailResponseData extends StatsRoomDetailData {
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

        room_id?: number; // 房间ID
        limit?: number; // 条目数量
        offset?: number; // 开始下标（例子：offset=0，limit=10，表示0-9）

  [key: string]: unknown
}

export interface StatsRoomInsuranceDataResponseData extends StatsRoomInsuranceDataData {
  [key: string]: unknown
}

export interface StatsRoomInsuranceDataData {

        limit?: number; // 条目数量
        offset?: number; // 开始下标
        list?: StatsRoomInsuranceDataRecord[]; // 记录列表

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
    room_id?: number; // 房间ID
    limit?: number; // 条目数量
    offset?: number; // 开始下标（例子：offset=0，limit=10，表示0-9）

  [key: string]: unknown
}

export interface StatsRoomInsuranceInfoResponseData {
  [key: string]: unknown
}

// /api/stats/tribe/stats/current (StatsTribeStatsCurrent)
export interface StatsTribeStatsCurrentRequest {

        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsTribeStatsCurrentResponseData extends StatsTribeStatsCurrentData {
  [key: string]: unknown
}

export interface StatsTribeStatsCurrentData {

        yesterday_balance?: number; // 昨日基金余额
        current_balance?: number; // 今日基金余额
        current_recharge?: number; // 今日充值
        current_withdrawal?: number; // 今日提现
        current_profit?: number; // 今日盈利
        current_add_member?: number; // 今日新增成员
        current_active_count?: number; // 今日活跃人数
        current_hands_count?: number; // 今日手数
        seven_day_profit?: StatsTribeStatsCurrentSevenDataCurve[]; // 七日收益走势
        seven_day_new_user?: StatsTribeStatsCurrentSevenDataCurve[]; // 七日新增走势
        seven_day_active_user?: StatsTribeStatsCurrentSevenDataCurve[]; // 七日活跃走势
        seven_day_hand_num?: StatsTribeStatsCurrentSevenDataCurve[]; // 七日手数走势
        apply_count?: number; // 待审批数量

  [key: string]: unknown
}

export interface StatsTribeStatsCurrentSevenDataCurve {

        x?: string; // 日期
        y?: string; // 值

  [key: string]: unknown
}

// /api/stats/tribe/stats/data_by_date (StatsTribeStatsDataByDate)
export interface StatsTribeStatsDataByDateRequest {

        filter_type?: number; // 筛选类型：1 UC币（UC） 2 USDT（GC） 3 记分牌（chip）
        current_time_str?: string; // 当前时间戳（字符串）
        start_time?: number; // 开始时间戳
        end_time?: number; // 结束时间戳
        limit?: number; // 条目数
        offset?: number; // 开始下标
        club_id?: number; // 过滤的俱乐部ID
        game_types?: number[]; // 游戏类型
        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsTribeStatsDataByDateResponseData extends StatsTribeStatsDataByDateData {
  [key: string]: unknown
}

export interface StatsTribeStatsDataByDateData {

        date_total?: StatsTribeStatsDataByDateDateTotal[]; // 日期统计
        offset?: number; // 偏移量

  [key: string]: unknown
}

export interface StatsTribeStatsDataByDateDateTotal {

        date?: string; // 日期
        list?: StatsTribeStatsDataByDateRecord[]; // 牌局列表
        tribe_service_profit_total?: number; // 联盟服务费（联盟总收益=联盟服务费+联盟保险费）
        tribe_insurance_profit_total?: number; // 联盟保险费（联盟总收益=联盟服务费+联盟保险费）

  [key: string]: unknown
}

export interface StatsTribeStatsDataByDateRecord {

        room_id?: number; // 房间ID
        match_id?: number; // 比赛ID
        game_type?: number; // 游戏类型：1-NLH，2-PLO，3-6+
        poker_type?: number; // 牌型类型
        sb?: number; // 小盲注
        buy_in?: number; // 买入记分牌
        buy_in_times?: number; // MTT买入次数
        fee?: number; // 服务费
        game_status?: number; // 牌局状态：1-准备中 2-进行中 3-已结束
        match_player_num?: number; // MTT参赛人数
        is_match?: number; // 是否为MTT：0-普通牌局 1-MTT
        start_time_str?: string; // 牌局开始时间（带时区）
        insurance?: number; // 保险
        ante?: number; // 前注
        name?: string; // 牌局名称
        multi_lang_names_obj?: unknown; // 牌局名称（多语言）
        bombpot?: number; // 是否开启Bombpot：1-开启
        club_name?: string; // 俱乐部名称
        club_remark_name?: string; // 俱乐部备注名称
        club_remark_color?: string; // 俱乐部备注颜色

  [key: string]: unknown
}

// /api/stats/tribe/stats/data_detail (StatsTribeStatsDataDetail)
export interface StatsTribeStatsDataDetailRequest {

        club_id?: number; // 俱乐部ID（过滤用）
        room_id?: number; // 房间ID
        match_id?: number; // 比赛ID
        limit?: number; // 条目数量
        offset?: number; // 开始下标（offset=0,limit=10,返回0-9）

  [key: string]: unknown
}

export interface StatsTribeStatsDataDetailResponseData extends StatsTribeStatsDataDetailData {
  [key: string]: unknown
}

export interface StatsTribeStatsDataDetailData {

        list?: unknown[]; // 数据列表
        offset?: number; // 偏移量

  [key: string]: unknown
}

// /api/stats/tribe/stats/data_detail_info (StatsTribeStatsDataDetailInfo)
export interface StatsTribeStatsDataDetailInfoRequest {

        club_id?: number; // 俱乐部ID（过滤条件）
        room_id?: number; // 房间ID
        match_id?: number; // 比赛ID

  [key: string]: unknown
}

export interface StatsTribeStatsDataDetailInfoResponseData extends StatsTribeStatsDataDetailInfoData {
  [key: string]: unknown
}

export interface StatsTribeStatsDataDetailInfoData {

        info?: unknown; // 统计信息

  [key: string]: unknown
}

// /api/stats/tribe/stats/data_info (StatsTribeStatsDataInfo)
export interface StatsTribeStatsDataInfoRequest {

        filter_type?: number; // 币种类型：1-UC币，2-USDT(GC)，3-记分牌(chip)
        current_time_str?: string; // 客户端当前时间戳（毫秒）
        start_time?: number; // 开始时间戳（毫秒）
        end_time?: number; // 结束时间戳（毫秒）
        club_id?: number; // 过滤俱乐部ID
        game_types?: number[]; // 游戏类型列表
        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsTribeStatsDataInfoResponseData extends StatsTribeStatsDataInfoData {
  [key: string]: unknown
}

export interface StatsTribeStatsDataInfoData {

        info?: StatsTribeStatsDataInfoTotalData; // 汇总信息

  [key: string]: unknown
}

export interface StatsTribeStatsDataInfoTotalData {

        game_num?: number; // 总局数
        hand_num?: number; // 总手数
        tribe_service_profit_total?: number; // 总服务费
        tribe_insurance_profit_total?: number; // 总保险费

  [key: string]: unknown
}

// /api/stats/tribe/stats/download (StatsTribeStatsDownLoad)
export interface StatsTribeStatsDownLoadRequest {

        filter_type?: number; // 筛选类型
        start_time?: string; // 开始时间
        end_time?: string; // 结束时间
        start_time_unix?: number; // 开始时间戳
        end_time_unix?: number; // 结束时间戳
        lang?: string; // 语言
        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsTribeStatsDownLoadResponseData extends StatsTribeStatsDownLoadData {
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
    filter_type?: number; // 1-联盟币 2-USDT 3-记分牌 4-钻石
    room_type?: number; // 0-生涯，1-朋友桌，2-俱乐部
    club_id?: number; // 俱乐部ID
    max_card_game_type?: number; // 游戏类型0-all,1-常规桌,2-PLO,3-6+,4-Fantasy,5-Mahjong;目前只有0。1，2,3 统计最大牌， 其他类型有需要再与后端定义
    game_types?: number[]; // 游戏类型
    poker_types?: number[]; // 德州玩法细分类型
    time_zone?: number; // 时区

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
    fantasy_count?: number; // 进范数
    nuts?: number; // 特种牌型率
    full_win?: number; // 全胜次数
    max_card_data?: string;
    mj_win_self_draw_count?: number; // 麻将自摸次数
    mj_win_discard_count?: number; // 麻将接炮次数
    mj_lose_discard_count?: number; // 麻将点炮次数
    mj_concealed_kong_count?: number; // 麻将暗杠次数
    mj_exposed_kong_count?: number; // 麻将明杠次数
    cb_wins?: number; // 牛仔：押中率
    cb_bet?: number; // 牛仔：总押注
    gd_rank1?: number; // 掼蛋头游次数
    gd_rank2?: number; // 掼蛋二游次数
    gd_rank3?: number; // 掼蛋三游次数
    gd_rank4?: number; // 掼蛋末游次数
    gd_rank1_rate?: number; // 掼蛋头游率

  [key: string]: unknown
}

export interface StatsUserStatsData {

        mtt_room_data: StatsUserStatsMTTRoomData;
        room_data: StatsUserStatsRoomData; // 普通牌局数据

  [key: string]: unknown
}

export interface StatsUserStatsResponseData extends StatsUserStatsData {
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

        gold_type?: number; // 币种1-联盟币 2-USDT 3-记分牌 4-钻石
        end_time?: number; // 结束时间，单位秒
        start_time?: number; // 开始时间，单位秒
        aof_type?: number; // aof类型，1是aof，2非aof
        club_id?: number; // 俱乐部ID
        game_types?: number[]; // 游戏类型
        poker_types?: number[]; // 德州玩法细分类型

  [key: string]: unknown
}

export interface StatsUserStatsAllinResponseData extends StatsUserStatsAllinData {
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

        gold_type?: number; // 币种1-联盟币 2-USDT 3-记分牌 4-钻石
        aof_type?: number; // aof类型，1是aof，2非aof
        start_time?: number; // 开始时间戳，单位秒
        end_time?: number; // 结束时间戳，单位秒
        club_id?: number; // 俱乐部ID
        order_type?: number; // 1总手数升序；2总手数降序；3胜率升序；4升率降序；5盈亏升序；6盈亏降序
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
        game_types?: number[]; // 游戏类型
        poker_types?: number[]; // 德州玩法细分类型

  [key: string]: unknown
}

export interface StatsUserStatsCardTypeResponseData extends StatsUserStatsCardTypeData {
  [key: string]: unknown
}

export interface StatsUserStatsCardTypeData {

        total?: number; // 总数
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
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

        gold_type?: number; // 币种1-联盟币 2-USDT 3-记分牌 4-钻石
        start_time?: number; // 开始时间戳，单位秒
        end_time?: number; // 结束时间戳，单位秒
        order_type?: number; // 1盈利升序 2盈利降序
        club_id?: number; // 俱乐部ID
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值

  [key: string]: unknown
}

export interface StatsUserStatsRivalRoomStatsResponseData extends StatsUserStatsRivalRoomStatsData {
  [key: string]: unknown
}

export interface StatsUserStatsRivalRoomStatsData {

        total?: number; // 总数
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
        records?: StatsUserStatsRivalRoomStatsRecord[]; // 记录

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

        filter_type?: number; // 筛选类型： 1 = UC币， 2 = USDT， 3 = 记分牌， 4 = 钻石
        room_type?: number; // 房间类型： 0 = 生涯， 1 = 朋友桌， 2 = 俱乐部
        current_time_str?: string; // 客户端当前时间戳（字符串形式）
        club_id?: number; // 俱乐部ID
        limit?: number; // 数据数量
        offset?: number; // 当前偏移值
        game_types?: number[]; // 游戏类型列表
        poker_types?: number[]; // 德州玩法细分类型
        start_time?: number; // 开始时间戳
        time_zone?: number; // 时区

  [key: string]: unknown
}

export interface StatsUserGameRecordListResponseData extends StatsUserGameRecordListData {
  [key: string]: unknown
}

export interface StatsUserGameRecordListData {

        total?: number; // 总条数
        limit?: number; // 每页条数
        offset?: number; // 偏移量（分页起始位置）
        records?: StatsUserGameRecordListMap[]; // 数据记录列表

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
    room_id?: number; // 房间id
    match_id?: number; // 比赛ID
    game_start_time?: string; // 牌局开始时间
    date?: string; // 牌局日期
    game_type?: number; // 游戏类型 1-NLH，2-PLO，3-6
    poker_types?: number; // 德州详细牌型
    sb?: number; // 小盲注
    buy_in?: number; // 买入记分牌
    buy_in_times?: number; // mtt:买入次数
    fee?: number; // 服务费
    game_status?: number; // 牌局状态 1-准备中 2-进行中 3-已结束
    match_player_num?: number; // mtt参赛人数
    is_match?: number; // 0 牌局 1 mtt
    start_time?: number; // 服务器判断时区的时间戳（秒）
    start_time_str?: string; // 牌局日期带时区
    insurance?: number; // 保险
    ante?: number; // 前注

  [key: string]: unknown
}

export interface ClubDataStatsDataDetailData {
  list?: DataRecord[];
    offset?: number; // 数据数量
    room_info?: ClubDataStatsDataDetailRoomInfo; // 房间信息

  [key: string]: unknown
}

export interface ClubDataStatsDataDetailRoomInfo {
    jackpot?: number; // jackpot

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
    game_num?: number; // 局数
    hand_num?: number; // 手数
    profit?: number; // 玩家盈利
    fee?: number; // 服务费
    insurence?: number; // 保险
    club_total_profit?: number; // 俱乐部总收益
    jackpot?: number; // jackpot收益
    mini_game?: number; // 牛仔收益

  [key: string]: unknown
}

export interface GuildDataVipInfoData {
    list?: GuildDataVipInfoTotalData[];

  [key: string]: unknown
}

export interface GuildDataVipInfoTotalData {
    filter_time?: number; // 时间范围（天数） 0 全部 1 今天 7 7天内 以此类推
    game_type?: number; // 游戏类型 0全部 1nlh 2plo 36+
    hand_num?: number; // 手数
    profit?: number; // 玩家盈利
    fee?: number; // 服务费

  [key: string]: unknown
}

export interface DataRecord {
  [key: string]: unknown
}

export interface DataTotalData {
  [key: string]: unknown
}

export interface FriendRoomStatsData {
    friend_room_stats_6?: FriendRoomStatsRecord; // 6+
    friend_room_stats_nlh?: FriendRoomStatsRecord; // NLH
    friend_room_stats_plo?: FriendRoomStatsRecord; // PLO
    friend_room_stats_fantasy?: FriendRoomStatsRecord; // Fantasy
    friend_room_stats_mj?: FriendRoomStatsRecord; // 麻将

  [key: string]: unknown
}

export interface FriendRoomStatsRecord {
    game_type?: number; // 类型 game_type: 0-all, 1-NLH, 2-PLO, 3-6+, 4-Fantasy, 5-Mahjong
    game_num?: number; // 局数
    hand_num?: number; // 手数

  [key: string]: unknown
}

export interface FriendRoomStatsDataData {
    list?: FriendRoomStatsDataRecord[];
    limit?: number; // 每次请求的数据条数
    offset?: number; // 数据起始偏移值
    total?: number; // 总条数

  [key: string]: unknown
}

export interface FriendRoomStatsDataRecord {
    room_id?: number; // 房间id
    game_start_time?: string; // 牌局开始时间（时间戳）
    date?: string; // 牌局日期
    game_type?: number; // 游戏类型 (0-all, 1-NLH, 2-PLO, 3-6+, 4-Fantasy, 6-Mahjong)
    poker_type?: number; // 牌类型
    sb?: number; // 小盲注
    buy_in?: number; // 买入记分牌
    fee?: number; // 服务费
    game_status?: number; // 牌局状态 1-准备中 2-进行中 3-已结束
    start_time_str?: string; // 牌局开始时间（格式化字符串）
    bombpot?: number; // 是否开启bombpot (1 是, 0 否)
    mushroom_mode?: number; // 蘑菇玩法模式 (0-非蘑菇, 1-正常模式, 2-前注模式)
    squid_on?: number; // 鱿鱼 0-非 1-是

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailData {
    list?: FriendRoomStatsDataDetailRecord[];
    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    total?: number; // 总条数

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailRecord {
    avatar?: string; // 玩家头像
    nick_name?: string; // 玩家名称
    random_id?: number; // 玩家ID
    win?: number; // 盈利值
    fee?: number; // 服务费
    buy_in?: number; // 买入记分牌
    hand_num?: number; // 手数

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailInfoData {
    info?: FriendRoomStatsDataDetailInfoTotalData;

  [key: string]: unknown
}

export interface FriendRoomStatsDataDetailInfoTotalData {
    game_status?: number; // 牌局状态（1-准备中; 2-进行中; 3-已结束）
    creator_id?: number; // 创建者ID
    creator_name?: string; // 创建者名称
    name?: string; // 名称
    sb?: number; // 小盲注
    min_buy_in?: number; // 最小带入记分牌
    max_buy_in?: number; // 最大带入记分牌
    fee_ratio?: number; // 服务费比例
    total_fee?: number; // 总服务费
    insurance?: number; // 保险金额
    player_num?: number; // 总玩家数

  [key: string]: unknown
}

export interface FriendRoomStatsDataInfoData {
    info?: FriendRoomStatsDataInfoTotalData;

  [key: string]: unknown
}

export interface FriendRoomStatsDataInfoTotalData {
    game_num?: number; // 局数
    hand_num?: number; // 手数
    profit?: number; // 玩家盈利
    fee?: number; // 服务费

  [key: string]: unknown
}

export interface StatsMttRoomDetailApiData {
    mtt_room_data?: StatsMttRoomDetailApiRoomData; // MTT 房间配置信息

  [key: string]: unknown
}

export interface StatsMttRoomDetailApiRoomData {
    game_type?: number; // 牌局类型(玩法) 游戏类型：0-常规桌，1-OMAHA4，2-OMAHA5，3-OMAHA6
    game_room_name?: string; // 牌局名称
    room_id?: number; // 牌局ID
    start_time?: string; // 赛事开始时间
    end_time?: string; // 赛事结束时间
    player_count?: number; // 参与人数
    buy_in_count?: number; // 买入次数
    limit?: number; // 条目数
    user_list?: StatsMttRoomDetailApiUserInfo[]; // 玩家列表

  [key: string]: unknown
}

export interface StatsMttRoomDetailApiUserInfo {
    user_random_id?: number; // 玩家随机ID
    nick_name?: string; // 玩家昵称
    avatar?: string; // 玩家头像
    award?: number; // 用户奖励金币
    hunter_award?: number; // 猎人赛奖励金币
    goods_awrd?: StatsMttRoomDetailApiGoods[]; // 奖励的道具

  [key: string]: unknown
}

export interface StatsMttRoomDetailApiGoods {
    n?: number; // 数量

  [key: string]: unknown
}

export interface StatsOtherUserStatsFantasyData {
    total_game_cnt?: number; // 总局数
    nuts?: number; // 坚果次数（最大牌局）
    wins?: number; // 胜利次数
    fantasy_count?: number; // Fantasy次数

  [key: string]: unknown
}


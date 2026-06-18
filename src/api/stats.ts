import http from '@/api/http'
import type { ApiResponse } from '@/api/models/common'
import type {
  ClubAgentFriendDataRequest,
  ClubAgentFriendDataResponseData,
  ClubAgentFriendInfoRequest,
  ClubAgentFriendInfoResponseData,
  ClubDataStatsDataDetailInfoRequest,
  ClubDataStatsDataDetailInfoResponseData,
  ClubDataStatsDataDetailRequest,
  ClubDataStatsDataDetailResponseData,
  ClubDataStatsDataInfoRequest,
  ClubDataStatsDataInfoResponseData,
  ClubDataStatsDataRequest,
  ClubDataStatsDataResponseData,
  ClubStandiNgsRequest,
  ClubStandiNgsResponseData,
  FriendRoomStatsDataDetailInfoRequest,
  FriendRoomStatsDataDetailInfoResponseData,
  FriendRoomStatsDataDetailRequest,
  FriendRoomStatsDataDetailResponseData,
  FriendRoomStatsDataInfoRequest,
  FriendRoomStatsDataInfoResponseData,
  FriendRoomStatsDataRequest,
  FriendRoomStatsDataResponseData,
  FriendRoomStatsRequest,
  FriendRoomStatsResponseData,
  GuildDataVipInfoRequest,
  GuildDataVipInfoResponseData,
  OrgClubEarnIngRequest,
  OrgClubEarnIngResponseData,
  OrgClubMemberEarnIngRequest,
  OrgClubMemberEarnIngResponseData,
  OrgClubUserGameInfoRequest,
  OrgClubUserGameInfoResponseData,
  RoomCenterHistoryListData,
  RoomCenterHistoryListRequest,
  StatsClientClickLogRequest,
  StatsClientClickLogResponseData,
  StatsClubDataStatsDataDetailDownLoadRequest,
  StatsClubDataStatsDataDetailDownLoadResponseData,
  StatsClubDataStatsUserDetailRequest,
  StatsClubDataStatsUserDetailResponseData,
  StatsClubDataStatsVipUserRequest,
  StatsClubDataStatsVipUserResponseData,
  StatsClubDataStatsWeeklyReportRequest,
  StatsClubDataStatsWeeklyReportResponseData,
  StatsCowboyHistoryRoomDetailRequest,
  StatsCowboyHistoryRoomDetailResponseData,
  StatsFriendRoomStatsUserRoomDetailListRequest,
  StatsFriendRoomStatsUserRoomDetailListResponseData,
  StatsFriendRoomStatsUserRoomIdListRequest,
  StatsFriendRoomStatsUserRoomIdListResponseData,
  StatsFriendRoomStatsUserRoomStatsListRequest,
  StatsFriendRoomStatsUserRoomStatsListResponseData,
  StatsFriendStatsDataRequest,
  StatsFriendStatsDataResponseData,
  StatsJackpotAwardLogsRequest,
  StatsJackpotAwardLogsResponseData,
  StatsJackpotGoldChangeLogsRequest,
  StatsJackpotGoldChangeLogsResponseData,
  StatsMttHistoryListRequest,
  StatsMttHistoryListResponseData,
  StatsMttRoomDetailApiRequest,
  StatsMttRoomDetailApiResponseData,
  StatsMttRoomDetailRequest,
  StatsMttRoomDetailResponseData,
  StatsOtherUserStatsRequest,
  StatsOtherUserStatsResponseData,
  StatsProfitDataStatsDataByDateRequest,
  StatsProfitDataStatsDataByDateResponseData,
  StatsProfitDataStatsDataInfoRequest,
  StatsProfitDataStatsDataInfoResponseData,
  StatsProfitDataStatsUserByDateRequest,
  StatsProfitDataStatsUserByDateResponseData,
  StatsRoomDetailRequest,
  StatsRoomDetailResponseData,
  StatsRoomInsuranceDataRequest,
  StatsRoomInsuranceDataResponseData,
  StatsRoomInsuranceInfoRequest,
  StatsRoomInsuranceInfoResponseData,
  StatsTribeStatsCurrentRequest,
  StatsTribeStatsCurrentResponseData,
  StatsTribeStatsDataByDateRequest,
  StatsTribeStatsDataByDateResponseData,
  StatsTribeStatsDataDetailInfoRequest,
  StatsTribeStatsDataDetailInfoResponseData,
  StatsTribeStatsDataDetailRequest,
  StatsTribeStatsDataDetailResponseData,
  StatsTribeStatsDataInfoRequest,
  StatsTribeStatsDataInfoResponseData,
  StatsTribeStatsDownLoadRequest,
  StatsTribeStatsDownLoadResponseData,
  StatsUserGameRecordListRequest,
  StatsUserGameRecordListResponseData,
  StatsUserRoomMatchIdListRequest,
  StatsUserRoomMatchIdListResponseData,
  StatsUserRoomMatchListRequest,
  StatsUserRoomMatchListResponseData,
  StatsUserStatsAllRequest,
  StatsUserStatsAllResponseData,
  StatsUserStatsAllinRequest,
  StatsUserStatsAllinResponseData,
  StatsUserStatsCardTypeRequest,
  StatsUserStatsCardTypeResponseData,
  StatsUserStatsRequest,
  StatsUserStatsResponseData,
  StatsUserStatsRivalRoomStatsRequest,
  StatsUserStatsRivalRoomStatsResponseData,
} from '@/api/models/stats'
import { useUserInfoStore } from '@/stores/userInfo'

const userInfoStore = useUserInfoStore()
const formatPath = (template: string, pathParams: Record<string, string | number>): string =>
  template.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))
void formatPath

// 对齐 cocos WebStatsClientClickLog.API
export async function postStatsClientClickLogApi(
  payload: StatsClientClickLogRequest = {} as StatsClientClickLogRequest,
): Promise<ApiResponse<StatsClientClickLogResponseData>> {
  const endpoint = '/stats/client/click/log'
  const response = await http.post<ApiResponse<StatsClientClickLogResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubDataStatsData.API
export async function postClubDataStatsDataApi(
  payload: ClubDataStatsDataRequest = {} as ClubDataStatsDataRequest,
): Promise<ApiResponse<ClubDataStatsDataResponseData>> {
  const endpoint = '/stats/club_data_stats/data'
  const response = await http.post<ApiResponse<ClubDataStatsDataResponseData>>(endpoint, payload, {
    headers: {
      'X-Club': userInfoStore.currentClub?.club_id,
    },
  })
  return response.data
}

// 对齐 cocos WebClubDataStatsDataDetail.API
export async function postClubDataStatsDataDetailApi(
  payload: ClubDataStatsDataDetailRequest = {} as ClubDataStatsDataDetailRequest,
): Promise<ApiResponse<ClubDataStatsDataDetailResponseData>> {
  const endpoint = '/stats/club_data_stats/data_detail'
  const response = await http.post<ApiResponse<ClubDataStatsDataDetailResponseData>>(
    endpoint,
    payload,
    {
      headers: {
        'X-Club': userInfoStore.currentClub?.club_id,
      },
    },
  )
  return response.data
}

// 对齐 cocos WebClubDataStatsDataDetailInfo.API
export async function postClubDataStatsDataDetailInfoApi(
  payload: ClubDataStatsDataDetailInfoRequest = {} as ClubDataStatsDataDetailInfoRequest,
): Promise<ApiResponse<ClubDataStatsDataDetailInfoResponseData>> {
  const endpoint = '/stats/club_data_stats/data_detail_info'
  const response = await http.post<ApiResponse<ClubDataStatsDataDetailInfoResponseData>>(
    endpoint,
    payload,
    {
      headers: {
        'X-Club': userInfoStore.currentClub?.club_id,
      },
    },
  )
  return response.data
}

// 对齐 cocos WebStatsClubDataStatsDataDetailDownLoad.API
export async function postStatsClubDataStatsDataDetailDownLoadApi(
  payload: StatsClubDataStatsDataDetailDownLoadRequest = {} as StatsClubDataStatsDataDetailDownLoadRequest,
): Promise<ApiResponse<StatsClubDataStatsDataDetailDownLoadResponseData>> {
  const endpoint = '/stats/club_data_stats/data_detail/download'
  const response = await http.post<ApiResponse<StatsClubDataStatsDataDetailDownLoadResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebClubDataStatsDataInfo.API
export async function postClubDataStatsDataInfoApi(
  payload: ClubDataStatsDataInfoRequest = {} as ClubDataStatsDataInfoRequest,
): Promise<ApiResponse<ClubDataStatsDataInfoResponseData>> {
  const endpoint = '/stats/club_data_stats/data_info'
  const response = await http.post<ApiResponse<ClubDataStatsDataInfoResponseData>>(
    endpoint,
    payload,
    {
      headers: {
        'X-Club': userInfoStore.currentClub?.club_id,
      },
    },
  )
  return response.data
}

// 对齐 cocos WebStatsClubDataStatsUserDetail.API
export async function postStatsClubDataStatsUserDetailApi(
  payload: StatsClubDataStatsUserDetailRequest = {} as StatsClubDataStatsUserDetailRequest,
): Promise<ApiResponse<StatsClubDataStatsUserDetailResponseData>> {
  const endpoint = '/stats/club_data_stats/user_detail'
  const response = await http.post<ApiResponse<StatsClubDataStatsUserDetailResponseData>>(
    endpoint,
    payload,
    {
      headers: {
        'X-Club': userInfoStore.currentClub?.club_id,
      },
    },
  )
  return response.data
}

// 对齐 cocos WebGuildDataVipInfo.API
export async function postGuildDataVipInfoApi(
  payload: GuildDataVipInfoRequest = {} as GuildDataVipInfoRequest,
): Promise<ApiResponse<GuildDataVipInfoResponseData>> {
  const endpoint = '/stats/club_data_stats/vip_game'
  const response = await http.post<ApiResponse<GuildDataVipInfoResponseData>>(
    endpoint,
    payload,
    {
      headers: {
        'X-Club': userInfoStore.currentClub?.club_id,
      },
    },)
  return response.data
}

// 对齐 cocos WebStatsClubDataStatsVipUser.API
export async function postStatsClubDataStatsVipUserApi(
  payload: StatsClubDataStatsVipUserRequest = {} as StatsClubDataStatsVipUserRequest,
): Promise<ApiResponse<StatsClubDataStatsVipUserResponseData>> {
  const endpoint = '/stats/club_data_stats/vip_user'
  const response = await http.post<ApiResponse<StatsClubDataStatsVipUserResponseData>>(
    endpoint,
    payload,
    {
      headers: {
        'X-Club': userInfoStore.currentClub?.club_id,
      },
    },
  )
  return response.data
}

// 对齐 cocos WebStatsClubDataStatsWeeklyReport.API
export async function postStatsClubDataStatsWeeklyReportApi(
  payload: StatsClubDataStatsWeeklyReportRequest = {} as StatsClubDataStatsWeeklyReportRequest,
): Promise<ApiResponse<StatsClubDataStatsWeeklyReportResponseData>> {
  const endpoint = '/stats/club_data_stats/weekly_report'
  const response = await http.post<ApiResponse<StatsClubDataStatsWeeklyReportResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebClubAgentFriendData.API
export async function postClubAgentFriendDataApi(
  payload: ClubAgentFriendDataRequest = {} as ClubAgentFriendDataRequest,
): Promise<ApiResponse<ClubAgentFriendDataResponseData>> {
  const endpoint = '/stats/club/agent/friend_data'
  const response = await http.post<ApiResponse<ClubAgentFriendDataResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebClubAgentFriendInfo.API
export async function postClubAgentFriendInfoApi(
  payload: ClubAgentFriendInfoRequest = {} as ClubAgentFriendInfoRequest,
): Promise<ApiResponse<ClubAgentFriendInfoResponseData>> {
  const endpoint = '/stats/club/agent/friend_info'
  const response = await http.post<ApiResponse<ClubAgentFriendInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubEarnIng.API
export async function postOrgClubEarnIngApi(
  payload: OrgClubEarnIngRequest = {} as OrgClubEarnIngRequest,
): Promise<ApiResponse<OrgClubEarnIngResponseData>> {
  const endpoint = '/stats/club/profit'
  const response = await http.post<ApiResponse<OrgClubEarnIngResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubMemberEarnIng.API
export async function postOrgClubMemberEarnIngApi(
  payload: OrgClubMemberEarnIngRequest = {} as OrgClubMemberEarnIngRequest,
): Promise<ApiResponse<OrgClubMemberEarnIngResponseData>> {
  const endpoint = '/stats/club/user_profit'
  const response = await http.post<ApiResponse<OrgClubMemberEarnIngResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebOrgClubUserGameInfo.API
export async function postOrgClubUserGameInfoApi(
  payload: OrgClubUserGameInfoRequest = {} as OrgClubUserGameInfoRequest,
): Promise<ApiResponse<OrgClubUserGameInfoResponseData>> {
  const endpoint = '/stats/club/user/info'
  const response = await http.post<ApiResponse<OrgClubUserGameInfoResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebStatsCowboyHistoryRoomDetail.API
export async function postStatsCowboyHistoryRoomDetailApi(
  payload: StatsCowboyHistoryRoomDetailRequest = {} as StatsCowboyHistoryRoomDetailRequest,
): Promise<ApiResponse<StatsCowboyHistoryRoomDetailResponseData>> {
  const endpoint = '/stats/cowboy/history/room/detail'
  const response = await http.post<ApiResponse<StatsCowboyHistoryRoomDetailResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebFriendRoomStats.API
export async function postFriendRoomStatsApi(
  payload: FriendRoomStatsRequest = {} as FriendRoomStatsRequest,
): Promise<ApiResponse<FriendRoomStatsResponseData>> {
  const endpoint = '/stats/friend_room_stats'
  const response = await http.post<ApiResponse<FriendRoomStatsResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebFriendRoomStatsData.API
export async function postFriendRoomStatsDataApi(
  payload: FriendRoomStatsDataRequest = {} as FriendRoomStatsDataRequest,
): Promise<ApiResponse<FriendRoomStatsDataResponseData>> {
  const endpoint = '/stats/friend_room_stats/data'
  const response = await http.post<ApiResponse<FriendRoomStatsDataResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebFriendRoomStatsDataDetail.API
export async function postFriendRoomStatsDataDetailApi(
  payload: FriendRoomStatsDataDetailRequest = {} as FriendRoomStatsDataDetailRequest,
): Promise<ApiResponse<FriendRoomStatsDataDetailResponseData>> {
  const endpoint = '/stats/friend_room_stats/data_detail'
  const response = await http.post<ApiResponse<FriendRoomStatsDataDetailResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebFriendRoomStatsDataDetailInfo.API
export async function postFriendRoomStatsDataDetailInfoApi(
  payload: FriendRoomStatsDataDetailInfoRequest = {} as FriendRoomStatsDataDetailInfoRequest,
): Promise<ApiResponse<FriendRoomStatsDataDetailInfoResponseData>> {
  const endpoint = '/stats/friend_room_stats/data_detail_info'
  const response = await http.post<ApiResponse<FriendRoomStatsDataDetailInfoResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebFriendRoomStatsDataInfo.API
export async function postFriendRoomStatsDataInfoApi(
  payload: FriendRoomStatsDataInfoRequest = {} as FriendRoomStatsDataInfoRequest,
): Promise<ApiResponse<FriendRoomStatsDataInfoResponseData>> {
  const endpoint = '/stats/friend_room_stats/data_info'
  const response = await http.post<ApiResponse<FriendRoomStatsDataInfoResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsFriendRoomStatsUserRoomDetailList.API
export async function postStatsFriendRoomStatsUserRoomDetailListApi(
  payload: StatsFriendRoomStatsUserRoomDetailListRequest = {} as StatsFriendRoomStatsUserRoomDetailListRequest,
): Promise<ApiResponse<StatsFriendRoomStatsUserRoomDetailListResponseData>> {
  const endpoint = '/stats/friend_room_stats/user/room_detail/list'
  const response = await http.post<ApiResponse<StatsFriendRoomStatsUserRoomDetailListResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsFriendRoomStatsUserRoomIdList.API
export async function postStatsFriendRoomStatsUserRoomIdListApi(
  payload: StatsFriendRoomStatsUserRoomIdListRequest = {} as StatsFriendRoomStatsUserRoomIdListRequest,
): Promise<ApiResponse<StatsFriendRoomStatsUserRoomIdListResponseData>> {
  const endpoint = '/stats/friend_room_stats/user/room_id/list'
  const response = await http.post<ApiResponse<StatsFriendRoomStatsUserRoomIdListResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsFriendRoomStatsUserRoomStatsList.API
export async function postStatsFriendRoomStatsUserRoomStatsListApi(
  payload: StatsFriendRoomStatsUserRoomStatsListRequest = {} as StatsFriendRoomStatsUserRoomStatsListRequest,
): Promise<ApiResponse<StatsFriendRoomStatsUserRoomStatsListResponseData>> {
  const endpoint = '/stats/friend_room_stats/user/room_stats/list'
  const response = await http.post<ApiResponse<StatsFriendRoomStatsUserRoomStatsListResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsFriendStatsData.API
export async function postStatsFriendStatsDataApi(
  payload: StatsFriendStatsDataRequest = {} as StatsFriendStatsDataRequest,
): Promise<ApiResponse<StatsFriendStatsDataResponseData>> {
  const endpoint = '/stats/friend_stats/data'
  const response = await http.post<ApiResponse<StatsFriendStatsDataResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebStatsJackpotAwardLogs.API
export async function postStatsJackpotAwardLogsApi(
  payload: StatsJackpotAwardLogsRequest = {} as StatsJackpotAwardLogsRequest,
): Promise<ApiResponse<StatsJackpotAwardLogsResponseData>> {
  const endpoint = '/stats/jackpot/award_logs'
  const response = await http.post<ApiResponse<StatsJackpotAwardLogsResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsJackpotGoldChangeLogs.API
export async function postStatsJackpotGoldChangeLogsApi(
  payload: StatsJackpotGoldChangeLogsRequest = {} as StatsJackpotGoldChangeLogsRequest,
): Promise<ApiResponse<StatsJackpotGoldChangeLogsResponseData>> {
  const endpoint = '/stats/jackpot/gold_change_logs'
  const response = await http.post<ApiResponse<StatsJackpotGoldChangeLogsResponseData>>(
    endpoint,
    payload, {
      headers: {
        'X-Club': userInfoStore.currentClub?.club_id,
      },
    }
  )
  return response.data
}

// 对齐 cocos WebStatsMttRoomDetail.API
export async function postStatsMttRoomDetailApi(
  payload: StatsMttRoomDetailRequest = {} as StatsMttRoomDetailRequest,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<StatsMttRoomDetailResponseData>> {
  const endpoint = formatPath('/stats/mtt_room_detail/{id}', pathParams)
  const response = await http.post<ApiResponse<StatsMttRoomDetailResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebStatsMttRoomDetailApi.API
export async function postStatsMttRoomDetailApiApi(
  payload: StatsMttRoomDetailApiRequest = {} as StatsMttRoomDetailApiRequest,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<StatsMttRoomDetailApiResponseData>> {
  const endpoint = formatPath('/stats/mtt_room_detail/{id}', pathParams)
  const response = await http.post<ApiResponse<StatsMttRoomDetailApiResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsMttHistoryList.API
export async function postStatsMttHistoryListApi(
  payload: StatsMttHistoryListRequest = {} as StatsMttHistoryListRequest,
): Promise<ApiResponse<StatsMttHistoryListResponseData>> {
  const endpoint = '/stats/mtt/history/list'
  const response = await http.post<ApiResponse<StatsMttHistoryListResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebStatsOtherUserStats.API
export async function postStatsOtherUserStatsApi(
  payload: StatsOtherUserStatsRequest = {} as StatsOtherUserStatsRequest,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<StatsOtherUserStatsResponseData>> {
  const endpoint = formatPath('/stats/other_user_stats/{id}', pathParams)
  const response = await http.post<ApiResponse<StatsOtherUserStatsResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebStatsProfitDataStatsDataByDate.API
export async function postStatsProfitDataStatsDataByDateApi(
  payload: StatsProfitDataStatsDataByDateRequest = {} as StatsProfitDataStatsDataByDateRequest,
): Promise<ApiResponse<StatsProfitDataStatsDataByDateResponseData>> {
  const endpoint = '/stats/profit_data_stats/data_by_date'
  const response = await http.post<ApiResponse<StatsProfitDataStatsDataByDateResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsProfitDataStatsDataInfo.API
export async function postStatsProfitDataStatsDataInfoApi(
  payload: StatsProfitDataStatsDataInfoRequest = {} as StatsProfitDataStatsDataInfoRequest,
): Promise<ApiResponse<StatsProfitDataStatsDataInfoResponseData>> {
  const endpoint = '/stats/profit_data_stats/data_info'
  const response = await http.post<ApiResponse<StatsProfitDataStatsDataInfoResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsProfitDataStatsUserByDate.API
export async function postStatsProfitDataStatsUserByDateApi(
  payload: StatsProfitDataStatsUserByDateRequest = {} as StatsProfitDataStatsUserByDateRequest,
): Promise<ApiResponse<StatsProfitDataStatsUserByDateResponseData>> {
  const endpoint = '/stats/profit_data_stats/user_by_date'
  const response = await http.post<ApiResponse<StatsProfitDataStatsUserByDateResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsRoomDetail.API
export async function postStatsRoomDetailApi(
  payload: StatsRoomDetailRequest = {} as StatsRoomDetailRequest,
  pathParams: Record<string, string | number> = {},
): Promise<ApiResponse<StatsRoomDetailResponseData>> {
  const endpoint = formatPath('/stats/room_detail/{id}', pathParams)
  const response = await http.post<ApiResponse<StatsRoomDetailResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebRoomCenterHistoryList.API
export async function postRoomCenterHistoryListApi(
  payload: RoomCenterHistoryListRequest = {} as RoomCenterHistoryListRequest,
): Promise<ApiResponse<RoomCenterHistoryListData>> {
  const endpoint = '/stats/room/history/list'
  const response = await http.post<ApiResponse<RoomCenterHistoryListData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebStatsRoomInsuranceData.API
export async function postStatsRoomInsuranceDataApi(
  payload: StatsRoomInsuranceDataRequest = {} as StatsRoomInsuranceDataRequest,
): Promise<ApiResponse<StatsRoomInsuranceDataResponseData>> {
  const endpoint = '/stats/room/insurance_data'
  const response = await http.post<ApiResponse<StatsRoomInsuranceDataResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsRoomInsuranceInfo.API
export async function postStatsRoomInsuranceInfoApi(
  payload: StatsRoomInsuranceInfoRequest = {} as StatsRoomInsuranceInfoRequest,
): Promise<ApiResponse<StatsRoomInsuranceInfoResponseData>> {
  const endpoint = '/stats/room/insurance_info'
  const response = await http.post<ApiResponse<StatsRoomInsuranceInfoResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsTribeStatsCurrent.API
export async function postStatsTribeStatsCurrentApi(
  payload: StatsTribeStatsCurrentRequest = {} as StatsTribeStatsCurrentRequest,
): Promise<ApiResponse<StatsTribeStatsCurrentResponseData>> {
  const endpoint = '/stats/tribe/stats/current'
  const response = await http.post<ApiResponse<StatsTribeStatsCurrentResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsTribeStatsDataByDate.API
export async function postStatsTribeStatsDataByDateApi(
  payload: StatsTribeStatsDataByDateRequest = {} as StatsTribeStatsDataByDateRequest,
): Promise<ApiResponse<StatsTribeStatsDataByDateResponseData>> {
  const endpoint = '/stats/tribe/stats/data_by_date'
  const response = await http.post<ApiResponse<StatsTribeStatsDataByDateResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsTribeStatsDataDetail.API
export async function postStatsTribeStatsDataDetailApi(
  payload: StatsTribeStatsDataDetailRequest = {} as StatsTribeStatsDataDetailRequest,
): Promise<ApiResponse<StatsTribeStatsDataDetailResponseData>> {
  const endpoint = '/stats/tribe/stats/data_detail'
  const response = await http.post<ApiResponse<StatsTribeStatsDataDetailResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsTribeStatsDataDetailInfo.API
export async function postStatsTribeStatsDataDetailInfoApi(
  payload: StatsTribeStatsDataDetailInfoRequest = {} as StatsTribeStatsDataDetailInfoRequest,
): Promise<ApiResponse<StatsTribeStatsDataDetailInfoResponseData>> {
  const endpoint = '/stats/tribe/stats/data_detail_info'
  const response = await http.post<ApiResponse<StatsTribeStatsDataDetailInfoResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsTribeStatsDataInfo.API
export async function postStatsTribeStatsDataInfoApi(
  payload: StatsTribeStatsDataInfoRequest = {} as StatsTribeStatsDataInfoRequest,
): Promise<ApiResponse<StatsTribeStatsDataInfoResponseData>> {
  const endpoint = '/stats/tribe/stats/data_info'
  const response = await http.post<ApiResponse<StatsTribeStatsDataInfoResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsTribeStatsDownLoad.API
export async function postStatsTribeStatsDownLoadApi(
  payload: StatsTribeStatsDownLoadRequest = {} as StatsTribeStatsDownLoadRequest,
): Promise<ApiResponse<StatsTribeStatsDownLoadResponseData>> {
  const endpoint = '/stats/tribe/stats/download'
  const response = await http.post<ApiResponse<StatsTribeStatsDownLoadResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsUserStats.API
export async function postStatsUserStatsApi(
  payload: StatsUserStatsRequest = {} as StatsUserStatsRequest,
): Promise<ApiResponse<StatsUserStatsResponseData>> {
  const endpoint = '/stats/user_stats'
  const response = await http.post<ApiResponse<StatsUserStatsResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebStatsUserStatsAll.API
export async function postStatsUserStatsAllApi(
  payload: StatsUserStatsAllRequest = {} as StatsUserStatsAllRequest,
): Promise<ApiResponse<StatsUserStatsAllResponseData>> {
  const endpoint = '/stats/user_stats/all'
  const response = await http.post<ApiResponse<StatsUserStatsAllResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebStatsUserStatsAllin.API
export async function postStatsUserStatsAllinApi(
  payload: StatsUserStatsAllinRequest = {} as StatsUserStatsAllinRequest,
): Promise<ApiResponse<StatsUserStatsAllinResponseData>> {
  const endpoint = '/stats/user_stats/allin'
  const response = await http.post<ApiResponse<StatsUserStatsAllinResponseData>>(endpoint, payload)
  return response.data
}

// 对齐 cocos WebStatsUserStatsCardType.API
export async function postStatsUserStatsCardTypeApi(
  payload: StatsUserStatsCardTypeRequest = {} as StatsUserStatsCardTypeRequest,
): Promise<ApiResponse<StatsUserStatsCardTypeResponseData>> {
  const endpoint = '/stats/user_stats/card_type'
  const response = await http.post<ApiResponse<StatsUserStatsCardTypeResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsUserStatsRivalRoomStats.API
export async function postStatsUserStatsRivalRoomStatsApi(
  payload: StatsUserStatsRivalRoomStatsRequest = {} as StatsUserStatsRivalRoomStatsRequest,
): Promise<ApiResponse<StatsUserStatsRivalRoomStatsResponseData>> {
  const endpoint = '/stats/user_stats/rival_room_stats'
  const response = await http.post<ApiResponse<StatsUserStatsRivalRoomStatsResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsUserGameRecordList.API
export async function postStatsUserGameRecordListApi(
  payload: StatsUserGameRecordListRequest = {} as StatsUserGameRecordListRequest,
): Promise<ApiResponse<StatsUserGameRecordListResponseData>> {
  const endpoint = '/stats/user/game/record/list'
  const response = await http.post<ApiResponse<StatsUserGameRecordListResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsUserRoomMatchIdList.API
export async function postStatsUserRoomMatchIdListApi(
  payload: StatsUserRoomMatchIdListRequest = {} as StatsUserRoomMatchIdListRequest,
): Promise<ApiResponse<StatsUserRoomMatchIdListResponseData>> {
  const endpoint = '/stats/user/room/match/id/list'
  const response = await http.post<ApiResponse<StatsUserRoomMatchIdListResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebStatsUserRoomMatchList.API
export async function postStatsUserRoomMatchListApi(
  payload: StatsUserRoomMatchListRequest = {} as StatsUserRoomMatchListRequest,
): Promise<ApiResponse<StatsUserRoomMatchListResponseData>> {
  const endpoint = '/stats/user/room/match/list'
  const response = await http.post<ApiResponse<StatsUserRoomMatchListResponseData>>(
    endpoint,
    payload,
  )
  return response.data
}

// 对齐 cocos WebClubStandiNgs.API
export async function postClubStandiNgsApi(
  payload: ClubStandiNgsRequest = {} as ClubStandiNgsRequest,
): Promise<ApiResponse<ClubStandiNgsResponseData>> {
  const endpoint = '/stats/user/standings'
  const response = await http.post<ApiResponse<ClubStandiNgsResponseData>>(endpoint, payload)
  return response.data
}

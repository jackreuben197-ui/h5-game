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
  start_time?: string | null
  apply_start_time?: string | null
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

// /roomcenter/user/all/mtt/sng/ids 响应 data。
export interface AllMttSngIdsData {
  mtt_id_list?: MttIdInfoRecord[]
  sng_id_list?: SngIdInfoRecord[]
  mtt_series_list?: MttSeriesInfoRecord[]
  [key: string]: unknown
}

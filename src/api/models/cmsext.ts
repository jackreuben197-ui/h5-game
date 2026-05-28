// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/cmsext

// /api/cmsext/activity/club/add (CmsExtActivityClubAdd)
export interface CmsExtActivityClubAddRequest {
  activity_type?: number // 1 图片； 2 文字
  description?: string // 文字可选
  img_url?: string // 原图地址
  home_img_url?: string // 首页图地址
  start_time?: number // 公告开始时间 unix时间戳（秒）
  end_time?: number // 公告结束时间 unix时间戳（秒）
  sort?: number // 序号 对应 1 2 3

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
  list?: CmsExtActivityClubAdminListInfo[]

  [key: string]: unknown
}

export interface CmsExtActivityClubAdminListInfo {
  img_url?: string
  start_time?: string
  end_time?: string
  publish?: number
  home_img_url?: string
  sort?: number
  audit_status?: number

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
  list?: CmsExtActivityClubMyListInfo[]

  [key: string]: unknown
}

export interface CmsExtActivityClubMyListInfo {
  description?: string
  img_url?: string
  start_time?: string
  end_time?: string
  publish?: number
  home_img_url?: string
  sort?: number
  audit_status?: number

  [key: string]: unknown
}

// /api/cmsext/activity/club/update (OrgClubActivityCreate)
export interface OrgClubActivityCreateRequest {
  //     club_id: number,  //
  //     activity_type: number,  //
  //     description: string,
  //     img_url: string,
  //
  home_img_url?: string // 首页图地址
  start_time?: number // 公告开始时间 unix时间戳（秒）
  end_time?: number // 公告结束时间 unix时间戳（秒）
  publish?: number // 1 不发布；2 发布
  sort?: number // 序号对应 1 2 3

  [key: string]: unknown
}

export interface OrgClubActivityCreateResponseData {
  [key: string]: unknown
}

// /api/cmsext/club/notice (OrgClubNotice)
export interface OrgClubNoticeRequest {
  club_id?: number // 俱乐部id

  [key: string]: unknown
}

export interface OrgClubNoticeResponseData extends OrgClubNoticeData {
  [key: string]: unknown
}

// /api/cmsext/club/notice_get (OrgClubNoticeGet)
export interface OrgClubNoticeGetRequest {
  club_id?: number // 俱乐部Iid

  [key: string]: unknown
}

export interface OrgClubNoticeGetResponseData extends OrgClubNoticeGetData {
  [key: string]: unknown
}

// /api/cmsext/club/notice_update (OrgClubNoticeUpdate)
export interface OrgClubNoticeUpdateRequest {
  id?: number // 消息id
  club_id?: number // 俱乐部id
  title?: string // 标题
  content?: string // 内容
  start_time?: number // 开始时间
  end_time?: number // 结束时间

  [key: string]: unknown
}

export interface OrgClubNoticeUpdateResponseData extends OrgClubNoticeUpdateData {
  [key: string]: unknown
}

// /api/cmsext/club/share/{0}/list (CmsExtClubShare0List)
export interface CmsExtClubShare0ListRequest {
  limit?: number // 数据数量
  offset?: number // 当前偏移值

  [key: string]: unknown
}

export interface CmsExtClubShare0ListResponseData extends CmsExtClubShare0ListData {
  [key: string]: unknown
}

export interface CmsExtClubShare0ListData {
  data?: CmsExtClubShare0ListShareTableData[]
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总数

  [key: string]: unknown
}

export interface CmsExtClubShare0ListShareTableData {
  id?: number // 牌局id
  create_time?: string // 创建时间
  apply_club_random_id?: number // 申请俱乐部id
  apply_club_name?: string // 申请俱乐部名称
  apply_club_logo?: string // 申请俱乐部图标
  share_club_name?: string // 共享牌局俱乐部名称
  share_club_logo?: string // 共享牌局俱乐部图标
  sb?: number // 小盲
  private_room?: number // 是否私有房
  ante?: number // 前注
  seat_count?: number // 房间座位数量
  play_duration?: number // 游戏时长
  game_type?: number // 游戏类型
  poker_type?: number // 牌类型
  squid_base?: number // 鱿鱼基数，大于0，显示，等于0关闭
  mushroom_base?: number // 蘑菇基数 大于0 显示 等于0 关闭

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
  apply_id?: number // 申请ID
  audit_op?: number // 审批状态(audit_op):2-通过;3-拒绝;4-取消

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
  club_id?: number // 俱乐部id

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
  last_update_time?: number

  [key: string]: unknown
}

export interface CmsExtHotUpdateTemplateListResponseData extends CmsExtHotUpdateTemplateListData {
  [key: string]: unknown
}

export interface CmsExtHotUpdateTemplateListData {
  data?: unknown[] // 房间模板数据
  last_update_time?: number // 最后更新时间

  [key: string]: unknown
}

// /api/cmsext/im/service/link (CmsExtImServiceLink)
export interface CmsExtImServiceLinkRequest {
  im_service_no?: string // 客服im号
  language?: string // 语言
  im_service_type?: number // 客服类型 1.俱乐部客服 2.官方FlowChat大厅首页客服 3.官方FlowChat钻石商城客服

  [key: string]: unknown
}

export interface CmsExtImServiceLinkResponseData extends CmsExtImServiceLinkData {
  [key: string]: unknown
}

export interface CmsExtImServiceLinkData {
  im_link?: string // 客服im链接

  [key: string]: unknown
}

// /api/cmsext/im/service/list (CmsExtImServiceList)
export interface CmsExtImServiceListRequest {
  im_service_type?: number // 客服类型 1.俱乐部客服 2.官方FlowChat大厅首页客服 3.官方FlowChat钻石商城客服

  [key: string]: unknown
}

export type CmsExtImServiceListResponseData = CmsExtImServiceListData[]

export interface CmsExtImServiceListData {
  im_service_no?: string // IM客服号
  service_begin_time?: number // 客服开始时间
  service_end_time?: number // 客服结束时间
  avatar?: string // 客服头像

  [key: string]: unknown
}

// /api/cmsext/mini_game/club/config/create (CmsExtMiniGameClubConfigCreate)
export interface CmsExtMiniGameClubConfigCreateRequest {
  name?: string // 游戏名称
  room_config?: unknown // 游戏配置

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
  name?: string // 游戏名称
  room_config?: unknown // 游戏配置

  [key: string]: unknown
}

export interface CmsExtMiniGameConfigCreateResponseData extends CmsExtMiniGameConfigCreateData {
  [key: string]: unknown
}

export interface CmsExtMiniGameConfigCreateData {
  room_id?: number // 房间ID
  room_config?: unknown // 传回的配置信息

  [key: string]: unknown
}

// /api/cmsext/mini_game/tribe/config/create (CmsExtMiniGameTribeConfigCreate)
export interface CmsExtMiniGameTribeConfigCreateRequest {
  name?: string // 房间名称
  room_config?: unknown // 房间配置信息

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
  template?: unknown // MTT模板配置
  enter_before?: number // 提前进桌的多少秒（开赛前）
  start_time?: number // 开赛时间戳(秒)
  apply_time?: number // 报名时间戳(秒)
  create_mtt?: boolean // 是否创建mtt比赛

  [key: string]: unknown
}

export interface CmsExtMttConfigCreateResponseData {
  [key: string]: unknown
}

// /api/cmsext/mtt/create (CmsExtMttCreate)
export interface CmsExtMttCreateRequest {
  template_id?: number
  enter_before?: number
  start_time?: number
  apply_time?: number

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
  template?: unknown // MTT模板配置
  enter_before?: number // 提前进桌的多少秒（开赛前）
  start_time?: number // 开赛时间戳(秒)
  apply_time?: number // 报名时间戳(秒)
  create_mtt?: boolean // 是否创建mtt比赛

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
  limit?: number
  offset?: number
  game_type?: number[]
  poker_type?: number[]
  origin_type?: number // 1 平台，2 联盟，3 俱乐部 4 个人（朋友桌）
  search?: string
  week_switch?: number // 周期赛(1:开启 2：关闭 3：全部)

  [key: string]: unknown
}

export interface CmsExtMttTemplateListResponseData extends CmsExtMttTemplateListData {
  [key: string]: unknown
}

export interface CmsExtMttTemplateListData {
  limit?: number
  offset?: number
  total?: number
  templates?: unknown[]

  [key: string]: unknown
}

// /api/cmsext/mtt/template/update (CmsExtMttTemplateUpdate)
export interface CmsExtMttTemplateUpdateRequest {
  template?: unknown // MTT模板配置
  enter_before?: number // 提前进桌的多少秒（开赛前）
  start_time?: number // 开赛时间戳(秒)
  apply_time?: number // 报名时间戳(秒)
  create_mtt?: boolean // 是否创建mtt比赛

  [key: string]: unknown
}

export interface CmsExtMttTemplateUpdateResponseData {
  [key: string]: unknown
}

// /api/cmsext/mtt/template/week_switch/update (CmsExtMttTemplateWeekSwitchUpdate)
export interface CmsExtMttTemplateWeekSwitchUpdateRequest {
  template_id?: number // MTT模板ID
  week_switch?: number // 周期赛(1:开启 2：关闭 3:删除)

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
  name?: string // 房间名称
  room_config?: RoomConfigRequest // 房间配置信息

  [key: string]: unknown
}

export interface OrgRoomClubCreateResponseData extends OrgRoomClubCreateData {
  [key: string]: unknown
}

// /api/cmsext/room/config/create (OrgRoomConfigCreate)
export interface OrgRoomConfigCreateRequest {
  name?: string // 房间名称
  room_config?: RoomConfigRequest // 房间配置请求
  standard?: boolean // 是否一键创建

  [key: string]: unknown
}

export interface OrgRoomConfigCreateResponseData extends OrgRoomConfigCreateData {
  [key: string]: unknown
}

// /api/cmsext/room/create (OrgRoomCreate)
export interface OrgRoomCreateRequest {
  anti_cheat_type?: number // 防作弊类型 ，2 实时语音 3 实时视频
  fee_on?: boolean // 开启活跃度积分，true：使用配置的服务费设置；false：服务费为0
  insurance_on?: boolean // 开启保险，true：使用配置的保险配置；false：关闭保险
  max_rate?: number // 最大带入
  min_rate?: number // 最小带入
  sb?: number // 小盲
  squid_on?: boolean // 开启鱿鱼，true：使用配置的鱿鱼设置；false：关闭鱿鱼玩法
  template_id?: number // 模版Id
  seat_count?: number // 座位数量 <returns></returns>
  joker?: number // 赖子
  play_hands_limit?: number // 局数 <returns></returns>

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
  key?: number
  value?: number[]

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
  data?: unknown

  [key: string]: unknown
}

// /api/cmsext/room/template/create (OrgCreateTemplate)
export interface OrgCreateTemplateRequest {
  name?: string // 模版名称
  room_config?: RoomConfigRequest // 房间配置

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
  mode?: number // 模式：0 全部，1 普通房间，2 随机匹配
  limit?: number // 条目数
  offset?: number // 起始下标
  bombpot?: unknown // bombpot 筛选
  standard?: boolean // 是否标准模版，true 为是
  standard_ext?: boolean // 特殊标准模板（一键开桌）
  game_type_arr?: number[] // 游戏类型
  poker_type?: number[] // 牌类型
  origin_type?: number // 查询创建来源：0 全部，2 联盟，3 公会(外)，4 个人（朋友桌），5 公会（内）
  ids?: number[] // 房间模版 Id 列表

  [key: string]: unknown
}

export interface OrggetTemplateResponseData extends OrggetTemplateData {
  [key: string]: unknown
}

// /api/cmsext/room/template/status (CmsExtRoomTemplateStatus)
export interface CmsExtRoomTemplateStatusRequest {
  id?: number // 模版ID
  status?: number // 1 开启 2 关闭

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
  id?: number // 房间 ID
  name?: string // 房间名称
  room_config?: RoomConfigRequest // 房间配置信息

  [key: string]: unknown
}

export interface OrgUpdateTemplateResponseData extends OrgUpdateTemplateData {
  [key: string]: unknown
}

// /api/cmsext/room/tribe/config/create (CmsExtRoomTribeConfigCreate)
export interface CmsExtRoomTribeConfigCreateRequest {
  name?: string // 房间名称
  room_config?: unknown // 房间配置

  [key: string]: unknown
}

export interface CmsExtRoomTribeConfigCreateResponseData extends CmsExtRoomTribeConfigCreateData {
  [key: string]: unknown
}

export interface CmsExtRoomTribeConfigCreateData {
  room_id?: number // 房间id
  room_config?: unknown // 房间配置

  [key: string]: unknown
}

// /api/cmsext/room/user/batch/create (CmsExtRoomUserBatchCreate)
export interface CmsExtRoomUserBatchCreateRequest {
  [key: string]: unknown
}

export type CmsExtRoomUserBatchCreateResponseData = number

export interface CmsExtRoomUserBatchCreateInfo {
  template_id?: number // 模板ID
  count?: number // 数量

  [key: string]: unknown
}

// /api/cmsext/room/user/template/list (CmsExtRoomUserTemplateList)
export interface CmsExtRoomUserTemplateListRequest {
  mode?: number // 模式：0 全部，1 普通房间，2 随机匹配
  limit?: number // 条目数
  offset?: number // 起始下标
  bombpot?: number[] // bombpot 配置数组
  game_type_arr?: number[] // 游戏类型
  poker_type?: number[] // 牌类型

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
  name?: string
  anti_cheat_order_mic_type?: number
  anti_cheat_order_type?: number
  anti_cheat_type?: number
  anti_cheat_video_type?: number
  apply_fee_hunter?: number
  apply_fee_pool?: number
  apply_fee_service?: number
  blindtable_type?: number
  end_time?: number
  game_icon?: string
  game_play_type?: number
  game_type?: number
  initial_score?: number
  limit_auto_check_times?: number
  limit_auto_fold_times?: number
  limit_buy_in?: number
  limit_delay_times?: number
  limit_participants?: number
  op_duration?: number
  plo_game_type?: number
  prize_type?: number
  prizes?: CmsExtSngConfigCreatePrize[]
  start_time?: number
  upblind_interval?: number
  video_verify_type?: number
  blind_level_delay_time_table?: unknown[]
  delay_time_type?: number
  max_delay_times?: number

  [key: string]: unknown
}

export interface CmsExtSngConfigCreateResponseData extends CmsExtSngConfigCreateData {
  [key: string]: unknown
}

export interface CmsExtSngConfigCreatePrize {
  award_ratio?: number
  rank_max?: number
  rank_min?: number
  award?: number

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
  type?: number
  room_id?: number
  match_id?: number
  hand_num?: number
  room_unique_id?: string
  content?: string
  user_game_record_id?: number

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
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  ids?: number[] // 抽奖轮盘模版ids
  status?: number // 轮盘状态 1.上架 2.下架
  club_id?: number // 俱乐部id
  tribe_id?: number // 联盟id
  all_room_template?: number
  all_manual_room?: number

  [key: string]: unknown
}

export interface CmsExtWheelTemplateListResponseData extends CmsExtWheelTemplateListData {
  [key: string]: unknown
}

export interface CmsExtWheelTemplateListData {
  data?: unknown[]
  limit?: number
  offset?: number
  total?: number

  [key: string]: unknown
}

export interface OrgClubNoticeData {
  info?: OrgClubNoticeRecord

  [key: string]: unknown
}

export interface OrgClubNoticeRecord {
  id?: number // 消息id
  club_id?: number // 俱乐部id
  title?: string // 俱乐部弹窗标题
  content?: string // 俱乐部弹窗内容
  start_time?: string // 开始时间
  end_time?: string // 结束时间
  tribe_id?: number // 联盟id
  tribe_name?: string // 联盟名称
  tribe_notice_switch?: number // 通知开关 1.开 其他关
  tribe_notice_title?: string // 联盟通知标题
  tribe_notice?: string // 联盟通知

  [key: string]: unknown
}

export interface OrgClubNoticeGetData {
  info?: OrgClubNoticeGetRecord

  [key: string]: unknown
}

export interface OrgClubNoticeGetRecord {
  id?: number // 消息id
  club_id?: number // 俱乐部id
  title?: string // 俱乐部标题
  content?: string // 内容
  start_time?: string // 开始时间
  end_time?: string // 结束时间

  [key: string]: unknown
}

export interface OrgRoomBatchCreateInfo {
  template_id?: number // 模板id
  count?: number // 数量
  ante?: number // 前注
  sb?: number // 小盲

  [key: string]: unknown
}

export interface OrgRoomClubCreateData {
  room_id?: number // 房间id
  room_config?: RoomConfigResponse // 房间配置

  [key: string]: unknown
}

export interface OrgRoomConfigCreateData {
  room_id?: number // 房间ID
  room_config?: RoomConfigResponse // 房间配置响应

  [key: string]: unknown
}

export interface OrgRoomCreateData {
  room_id?: number // 房间id
  room_config?: RoomConfigResponse

  [key: string]: unknown
}

export interface OrggetTemplateData {
  limit?: number // 条目数
  offset?: number // 起始下标
  total?: number // 总数
  data?: RoomConfigRequest[] // 房间模版数据

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

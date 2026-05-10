// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/msg

// /api/msg/message/clear_unread (MsgMessageUnreadClear)
export interface MsgMessageUnreadClearRequest {
  msg_type?: number // 消息类型

  [key: string]: unknown
}

export interface MsgMessageUnreadClearResponseData extends MsgMessageUnreadClearData {
  [key: string]: unknown
}

// /api/msg/message/list (MsgMessageList)
export interface MsgMessageListRequest {
  msg_type: number //消息类型
  limit: number //条目
  offset: number //开始下标。例子（offset=0，limit=10，0-9。）
  clubID?: number // 如果是俱乐部消息，则对应俱乐部ID
  TribeID?: number // 如果是联盟消息，则对应联盟ID

  [key: string]: unknown
}

export interface MsgMessageListResponseData {
  data?: MsgMessageListData
  [key: string]: unknown
}

export interface MsgMessageListData {
  offset: number //开始下标。例子（offset=0，limit=10，0-9。）
  total: number //总条目数
  list: MsgMessageListMsgInfo[]
  limit?: number // 条目数量

  [key: string]: unknown
}

// /api/msg/message/read (MsgMessageRead)
export interface MsgMessageReadRequest {
  id?: number // 消息ID
  msg_type?: number // 1-bag,2-club,3-money,4-system,5-tribe

  [key: string]: unknown
}

export interface MsgMessageReadResponseData extends MsgMessageReadData {
  [key: string]: unknown
}

export interface MsgMessageReadData {
  [key: string]: unknown
}

// /api/msg/message/red_num (MessageRednum)
export interface MessageRednumRequest {
  club_id?: number // 俱乐部ID

  [key: string]: unknown
}

export type MessageRednumResponseData = MessageRednumData[]

// /api/msg/message/system/broadcast/num (MsgMessageSystemBroadcastNum)
export interface MsgMessageSystemBroadcastNumRequest {
  [key: string]: unknown
}

export type MsgMessageSystemBroadcastNumResponseData = MsgMessageSystemBroadcastNumMsgInfo[]

export interface MsgMessageSystemBroadcastNumMsgInfo {
  msg_main_type?: number // 消息主类型（1-Bag; 2-Club; 3-Money; 4-System; 5-Tribe）
  num?: number // 未读消息数量
  msg_type?: number // 消息子类型（对应 MessageSubType）

  [key: string]: unknown
}

// /api/msg/message/todo (MsgMessageTodo)
export interface MsgMessageTodoRequest {
  [key: string]: unknown
}

export type MsgMessageTodoResponseData = MsgMessageTodoData[]

export interface MsgMessageTodoData {
  num?: number // 消息条数
  type?: number // 消息类型 1 未读消息； 2 充值申请； 3 加入俱乐部申请； 4 共享牌局申请； 6 带入申请； 7 延时申请 8.加入联盟申请 9 俱乐部充值申请

  [key: string]: unknown
}

// /api/msg/message/todo/all_info (MsgMessageTodoAllInfo)
export interface MsgMessageTodoAllInfoRequest {
  todo_types?: number[] // 获取哪些信息全部信息（2.用户充值信息 3.用户申请加入俱乐部 4.共享牌桌 6.带入申请 7.延迟申请 8.俱乐部加入联盟 9.俱乐部充值申请

  [key: string]: unknown
}

export interface MsgMessageTodoAllInfoResponseData extends MsgMessageTodoAllInfoData {
  [key: string]: unknown
}

export interface MsgMessageTodoAllInfoData {
  num_map?: MsgMessageTodoAllInfoDataElement[] // 未读数量
  user_order_list?: ClubMemberOrderListOrderInfo[] // 玩家充值申请
  club_user_join_list?: ClubMemberJoinListRecord[] // 玩家入会申请
  club_share_template_list?: ShareTableListShareTableData[] // 共享牌桌申请
  room_bring_in_list?: UserRoomSitApplyRecordsRecord[] // 玩家带入申请
  room_delay_list?: CommonSendDelayApplyDelayApplyData[] // 玩家延时申请
  club_join_tribe_list?: TribeApplyListClubInfo[] // 俱乐部申请加入联盟
  club_order_list?: TribeOrderListClubInfo[] // 俱乐部充值申请
  unread_msg_list?: MessageListMsgInfo[] // 未读消息列表 只包含俱乐部2025和2026类型的消息

  [key: string]: unknown
}

export interface MsgMessageTodoAllInfoDataElement {
  num?: number // 数量
  type?: number // 类型

  [key: string]: unknown
}

// /api/msg/message/unread (MsgMessageUnread)
export interface MsgMessageUnreadRequest {
  [key: string]: unknown
}

export type MsgMessageUnreadResponseData = MsgMessageUnreadData[] & {
  msg_main_type: number //消息类型:1-bag,2-club,3-money,4-system,5-tribe,6-带入
  num: number //未读消息数量
  title: string
  content: string
  remark: string
  msg_type: number //消息类型 MessageSubType
  create_time: string //创建时间
  [key: string]: unknown
}

/**
 * 消息模板说明
 * {0}给您的{1}回收{2}{3}成功
 * {0}:conetent
 * {1}:remark
 * {2}:title
 * {3}:未启用
 */
export interface MsgMessageListMsgInfo {
  msg_id?: number // 消息ID
  title?: string // 标题
  content?: string // 内容
  remark?: string // 备注
  msg_type?: number // 消息类型（MessageSubType）
  create_time?: string // 创建时间
  game_type?: number // 游戏类型
  multi_language_id?: string // 房间名称多语言key
  sender_name?: string // 发送者名称
  sender_icon?: string // 发送者图标
  object_string?: string // JSON字符串，main_type=4，msg_type=2044 时用于付费看手牌
  msg_status?: number // 消息状态：1 未读，2 已读
  member_icon?: string // 成员头像
  member_name?: string // 成员名称
  member_id?: number // 成员ID

  [key: string]: unknown
}

export interface MessageRednumData {
  num?: number // 数量
  type?: number // 任务类型（1-未读消息; 2-未处理充提豆; 3-未处理入会; 4-共享牌局申请; 5-汇率设置; 6-带入申请; 7-延时申请）

  [key: string]: unknown
}

export interface MsgMessageUnreadData {
  msg_main_type?: number // 消息主类型: 1-bag, 2-club, 3-money, 4-system, 5-tribe
  num?: number // 未读消息数量
  msg_type?: number // 消息子类型 (MessageSubType)
  create_time?: string // 创建时间

  [key: string]: unknown
}

export interface MsgMessageUnreadClearData {
  [key: string]: unknown
}

export interface ClubMemberOrderListOrderInfo {
  club_id?: number // 俱乐部id
  order_no?: string // 订单号
  order_type?: number // 0-全部;1-充豆;2-提豆;3-发豆；4-转换
  gold_num?: number // 申请金豆
  amount?: number // 数额
  dest_gold_type?: number
  dest_amount?: number
  gold_type?: number // 币类型:1-联盟币 2-usdt
  user_random_id?: number // 玩家id
  nickname?: string // 玩家昵称
  avatar?: string // 玩家头像
  club_name?: string // 俱乐部名称
  user_desc?: string // 玩家描述
  club_logo?: string // 俱乐部图标
  currency?: string // 货币代码

  [key: string]: unknown
}

export interface ClubMemberJoinListRecord {
  id?: number // 申请id
  club_id?: number // 俱乐部id
  club_name?: string // 俱乐部名字
  logo?: string // 俱乐部logo
  nickname?: string // 申请人名称
  avatar?: string // logo图片
  user_random_id?: number // 用户id
  create_time?: string // 创建时间

  [key: string]: unknown
}

export interface ShareTableListShareTableData {
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

export interface UserRoomSitApplyRecordsRecord {
  id?: number // 记录id
  room_id?: number // 房间id
  room_name?: string // 房间名称
  poker_type?: number // 0-德州 1-OMAHA4 2-OMAHA5 3-OMAHA6 4.fantasy 5.牛仔 6-麻將
  user_random_id?: number // 用户随机id
  user_name?: string // 用户名
  avatar?: string // 玩家头像
  bring_in?: number // 带入冻结，1 开启，2 关闭
  status?: number // 0-all，1-待审批，2-通过，3-拒绝，4-取消
  create_time?: string // 创建时间
  sender_name?: string // 发送者名称
  sender_icon?: string // 发送者图标
  op_user_random_id?: number // 审核用户随机ID
  op_user_name?: string // 审核用户名称
  op_user_avatar?: string // 审核用户头像
  club_id?: number // 俱乐部id
  game_type?: number // 游戏类型
  squid_base?: number // 鱿鱼基数，大于0，显示，等于0关闭
  mushroom_base?: number // 蘑菇基数 大于0 显示 等于0 关闭
  sng_id?: number // sng_id>0 就是一个sng申请

  [key: string]: unknown
}

export interface CommonSendDelayApplyDelayApplyData {
  id?: number // 记录id
  room_id?: number // 房间id
  club_id?: number // 俱乐部id
  room_name?: string // 房间名称
  game_type?: number // 房间类型
  poker_type?: number // 牌类型(poker_type)
  hands?: number // 游戏手数
  user_random_id?: number // 用户随机id
  user_name?: string // 用户名
  avatar?: string // 玩家头像
  status?: number // 0-all，1-待审批，2-通过，3-拒绝，4-取消
  create_time?: string // 创建时间
  sender_name?: string // 发送者名称
  sender_icon?: string // 发送者图标
  op_user_random_id?: number // 审核用户随机ID
  op_user_name?: string // 审核用户名称
  op_user_avatar?: string // 审核人头像
  users?: CommonSendDelayApplyDelayInfo[]
  squid_base?: number // 鱿鱼基数，大于0，显示，等于0关闭
  mushroom_base?: number // 蘑菇基数 大于0 显示 等于0 关闭

  [key: string]: unknown
}

export interface TribeApplyListClubInfo {
  id?: number // 申请id
  club_name?: string // 俱乐部名称
  club_random_id?: number // 俱乐部id
  tribe_name?: string // 联盟名称
  club_logo?: string // 联盟图标
  tribe_random_id?: number // 联盟id
  club_subscription_id?: number // 俱乐部会员id

  [key: string]: unknown
}

export interface TribeOrderListClubInfo {
  club_name?: string // 俱乐部名称
  club_random_id?: number // 俱乐部id
  tribe_name?: string // 联盟名称
  tribe_random_id?: number // 联盟id
  order_no?: string // 申请订单编号
  gold_num?: number // 金额
  club_logo?: string // 俱乐部图标
  tribe_logo?: string // 联盟头像
  club_subscription_id?: number // 俱乐部会员id

  [key: string]: unknown
}

export interface MessageListMsgInfo {
  msg_id?: number // 消息ID
  title?: string // 标题
  content?: string // 内容
  remark?: string // 备注
  msg_type?: number // 消息类型（MessageSubType）
  create_time?: string // 创建时间
  game_type?: number // 游戏类型
  multi_language_id?: string // 房间名称多语言key
  sender_name?: string // 发送者名称
  sender_icon?: string // 发送者图标
  object_string?: string // JSON字符串，main_type=4，msg_type=2044 时用于付费看手牌
  msg_status?: number // 消息状态：1 未读，2 已读
  member_icon?: string // 成员头像
  member_name?: string // 成员名称
  member_id?: number // 成员ID

  [key: string]: unknown
}

export interface CommonSendDelayApplyDelayInfo {
  user_name?: string // 用户名称

  [key: string]: unknown
}

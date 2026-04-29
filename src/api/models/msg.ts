// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/msg

// /api/msg/message/clear_unread (MsgMessageUnreadClear)
export interface MsgMessageUnreadClearRequest {
    msg_type?: number; // 消息类型

  [key: string]: unknown
}

export interface MsgMessageUnreadClearResponseData extends MsgMessageUnreadClearData {
  [key: string]: unknown
}

// /api/msg/message/list (MsgMessageList)
export interface MsgMessageListRequest {

  //     msg_type: number,//消息类型
  //     limit: number,//条目
  //     offset: number,//开始下标。例子（offset=0，limit=10，0-9。）
  //
    clubID?: number; // 如果是俱乐部消息，则对应俱乐部ID
    TribeID?: number; // 如果是联盟消息，则对应联盟ID

  [key: string]: unknown
}

export interface MsgMessageListResponseData {

  //     data?: MsgMessageListData,
  //
  [key: string]: unknown
}

export interface MsgMessageListData {

  //     offset: number,//开始下标。例子（offset=0，limit=10，0-9。）
  //     total: number,//总条目数
  //     list: MsgMessageListMsgInfo,
  //
    limit?: number; // 条目数量

  [key: string]: unknown
}

// /api/msg/message/read (MsgMessageRead)
export interface MsgMessageReadRequest {

    id?: number; // 消息ID
    msg_type?: number; // 1-bag,2-club,3-money,4-system,5-tribe

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
    club_id?: number; // 俱乐部ID

  [key: string]: unknown
}

export type MessageRednumResponseData = MessageRednumData[]

// /api/msg/message/system/broadcast/num (MsgMessageSystemBroadcastNum)
export interface MsgMessageSystemBroadcastNumRequest {
  [key: string]: unknown
}

export type MsgMessageSystemBroadcastNumResponseData = MsgMessageSystemBroadcastNumMsgInfo[]

export interface MsgMessageSystemBroadcastNumMsgInfo {

    msg_main_type?: number; // 消息主类型（1-Bag; 2-Club; 3-Money; 4-System; 5-Tribe）
    num?: number; // 未读消息数量
    msg_type?: number; // 消息子类型（对应 MessageSubType）

  [key: string]: unknown
}

// /api/msg/message/todo (MsgMessageTodo)
export interface MsgMessageTodoRequest {
  [key: string]: unknown
}

export type MsgMessageTodoResponseData = MsgMessageTodoData[]

export interface MsgMessageTodoData {

    num?: number;
    type?: number;

  [key: string]: unknown
}

// /api/msg/message/todo/all_info (MsgMessageTodoAllInfo)
export interface MsgMessageTodoAllInfoRequest {

    todo_types?: number[]; // 获取哪些信息全部信息（2.用户充值信息 3.用户申请加入俱乐部 4.共享牌桌 6.带入申请 7.延迟申请 8.俱乐部加入联盟 9.俱乐部充值申请

  [key: string]: unknown
}

export interface MsgMessageTodoAllInfoResponseData extends MsgMessageTodoAllInfoData {
  [key: string]: unknown
}

export interface MsgMessageTodoAllInfoData {

    num_map?: MsgMessageTodoAllInfoDataElement[]; // 未读数量
    user_order_list?: unknown[]; // 玩家充值申请
    club_user_join_list?: unknown[]; // 玩家入会申请
    club_share_template_list?: unknown[]; // 共享牌桌申请
    room_bring_in_list?: unknown[]; // 玩家带入申请
    room_delay_list?: unknown[]; // 玩家延时申请
    club_join_tribe_list?: unknown[]; // 俱乐部申请加入联盟
    club_order_list?: unknown[]; // 俱乐部充值申请
    unread_msg_list?: unknown[]; // 未读消息列表 只包含俱乐部2025和2026类型的消息

  [key: string]: unknown
}

export interface MsgMessageTodoAllInfoDataElement {

    num?: number; // 数量
    type?: number; // 类型

  [key: string]: unknown
}

// /api/msg/message/unread (MsgMessageUnread)
export interface MsgMessageUnreadRequest {
  [key: string]: unknown
}

export type MsgMessageUnreadResponseData = MsgMessageUnreadData[] & {
msg_main_type: number; //消息类型:1-bag,2-club,3-money,4-system,5-tribe,6-带入
    num: number; //未读消息数量
    title: string;
    content: string;
    remark: string;
    msg_type: number; //消息类型 MessageSubType
    create_time: string; //创建时间
  [key: string]: unknown
}

export interface MsgMessageListMsgInfo {
    msg_id?: number; // 消息ID
    title?: string; // 标题
    content?: string; // 内容
    remark?: string; // 备注
    msg_type?: number; // 消息类型（MessageSubType）
    create_time?: string; // 创建时间
    game_type?: number; // 游戏类型
    multi_language_id?: string; // 房间名称多语言key
    sender_name?: string; // 发送者名称
    sender_icon?: string; // 发送者图标
    object_string?: string; // JSON字符串，main_type=4，msg_type=2044 时用于付费看手牌
    msg_status?: number; // 消息状态：1 未读，2 已读
    member_icon?: string; // 成员头像
    member_name?: string; // 成员名称
    member_id?: number; // 成员ID

  [key: string]: unknown
}

export interface MessageRednumResponseData2 {
    red_num_list?: MessageRednumData[];

  [key: string]: unknown
}

export interface MessageRednumData {
    num?: number; // 数量
    type?: number; // 任务类型（1-未读消息; 2-未处理充提豆; 3-未处理入会; 4-共享牌局申请; 5-汇率设置; 6-带入申请; 7-延时申请）

  [key: string]: unknown
}

export interface MsgMessageUnreadData {
    msg_main_type?: number; // 消息主类型: 1-bag, 2-club, 3-money, 4-system, 5-tribe
    num?: number; // 未读消息数量
    msg_type?: number; // 消息子类型 (MessageSubType)
    create_time?: string; // 创建时间

  [key: string]: unknown
}

export interface MsgMessageUnreadClearData {
  [key: string]: unknown
}


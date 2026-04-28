// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/msg

// /api/msg/message/clear_unread (MsgMessageUnreadClear)
export interface MsgMessageUnreadClearRequest {
  [key: string]: unknown
}

export interface MsgMessageUnreadClearResponseData {
    data?: MsgMessageUnreadClearData;

  [key: string]: unknown
}

// /api/msg/message/list (MsgMessageList)
export interface MsgMessageListRequest {

  //     msg_type: number,//消息类型
  //     limit: number,//条目
  //     offset: number,//开始下标。例子（offset=0，limit=10，0-9。）
  //
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
    limit?: number;

  [key: string]: unknown
}

// /api/msg/message/read (MsgMessageRead)
export interface MsgMessageReadRequest {

    id?: number;
    msg_type?: number;

  [key: string]: unknown
}

export interface MsgMessageReadResponseData {

    data?: MsgMessageReadData;

  [key: string]: unknown
}

export interface MsgMessageReadData {
  [key: string]: unknown
}

// /api/msg/message/red_num (MessageRednum)
export interface MessageRednumRequest {
  [key: string]: unknown
}

export interface MessageRednumResponseData {
    data?: MessageRednumData[];

  [key: string]: unknown
}

// /api/msg/message/system/broadcast/num (MsgMessageSystemBroadcastNum)
export interface MsgMessageSystemBroadcastNumRequest {
  [key: string]: unknown
}

export interface MsgMessageSystemBroadcastNumResponseData {

    data?: MsgMessageSystemBroadcastNumMsgInfo[];

  [key: string]: unknown
}

export interface MsgMessageSystemBroadcastNumMsgInfo {

    msg_main_type?: number;
    num?: number;
    msg_type?: number;

  [key: string]: unknown
}

// /api/msg/message/todo (MsgMessageTodo)
export interface MsgMessageTodoRequest {
  [key: string]: unknown
}

export interface MsgMessageTodoResponseData {

    data?: MsgMessageTodoData[];

  [key: string]: unknown
}

export interface MsgMessageTodoData {

    num?: number;
    type?: number;

  [key: string]: unknown
}

// /api/msg/message/todo/all_info (MsgMessageTodoAllInfo)
export interface MsgMessageTodoAllInfoRequest {

    todo_types?: number[];

  [key: string]: unknown
}

export interface MsgMessageTodoAllInfoResponseData {

    data?: MsgMessageTodoAllInfoData;

  [key: string]: unknown
}

export interface MsgMessageTodoAllInfoData {

    num_map?: MsgMessageTodoAllInfoDataElement[];
    user_order_list?: unknown[];
    club_user_join_list?: unknown[];
    club_share_template_list?: unknown[];
    room_bring_in_list?: unknown[];
    room_delay_list?: unknown[];
    club_join_tribe_list?: unknown[];
    club_order_list?: unknown[];
    unread_msg_list?: unknown[];

  [key: string]: unknown
}

export interface MsgMessageTodoAllInfoDataElement {

    num?: number;
    type?: number;

  [key: string]: unknown
}

// /api/msg/message/unread (MsgMessageUnread)
export interface MsgMessageUnreadRequest {
  [key: string]: unknown
}

export interface MsgMessageUnreadResponseData {

    msg_main_type: number; //消息类型:1-bag,2-club,3-money,4-system,5-tribe,6-带入
    num: number; //未读消息数量
    title: string;
    content: string;
    remark: string;
    msg_type: number; //消息类型 MessageSubType
    create_time: string; //创建时间
    data?: MsgMessageUnreadData[];

  [key: string]: unknown
}

export interface MsgMessageListMsgInfo {
    msg_id?: number;
    title?: string;
    content?: string;
    remark?: string;
    msg_type?: number;
    create_time?: string;
    game_type?: number;
    multi_language_id?: string;
    sender_name?: string;
    sender_icon?: string;
    object_string?: string;
    msg_status?: number;
    member_icon?: string;
    member_name?: string;
    member_id?: number;

  [key: string]: unknown
}

export interface MessageRednumResponseData2 {
    red_num_list?: MessageRednumData[];

  [key: string]: unknown
}

export interface MessageRednumData {
    num?: number;
    type?: number;

  [key: string]: unknown
}

export interface MsgMessageUnreadData {
    msg_main_type?: number;
    num?: number;
    msg_type?: number;
    create_time?: string;

  [key: string]: unknown
}

export interface MsgMessageUnreadClearData {
  [key: string]: unknown
}


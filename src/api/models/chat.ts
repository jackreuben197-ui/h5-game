// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/chat

// /api/chat/club/inform/template/del (DelmsgTemplate)
export interface DelmsgTemplateRequest {

  //     id: number
  //
  [key: string]: unknown
}

export interface DelmsgTemplateResponseData {

  //
  [key: string]: unknown
}

// /api/chat/club/inform/template/list (GetmsgList)
export interface GetmsgListRequest {
  [key: string]: unknown
}

export interface GetmsgListResponseData {
  [key: string]: unknown
}

// /api/chat/club/inform/template/set (SetmsgTemplate)
export interface SetmsgTemplateRequest {

  //     template_name: string, //名称,
  //     content: string, //内容
  //
  [key: string]: unknown
}

export interface SetmsgTemplateResponseData {

  //
  [key: string]: unknown
}

// /api/chat/club/messages (OrggetMessList)
export interface OrggetMessListRequest {

  //     "history_id": number, // 查历史，小于此ID的消息
  //     "last_id": number, // 查最新，大于此ID的消息
  //     "limit": 10,
  //     "offset": 0
  //
  [key: string]: unknown
}

export interface OrggetMessListResponseData {
  [key: string]: unknown
}

// /api/chat/club/messages/new_count (OrggetNewMessNum)
export interface OrggetNewMessNumRequest {

  //     "msg_id": number
  //
  [key: string]: unknown
}

export interface OrggetNewMessNumResponseData {
  [key: string]: unknown
}

// /api/chat/club/send_messages (SendMsg)
export interface SendMsgRequest {

  //     "content": string,
  //     "message_type": number,  // 消息类型 1 普通消息 2 会长公告 3 战绩分享 4 牌谱分享
  //     "standings_user_id": number, // 消息类型为 3战绩分享 时，分享的玩家ID
  //     "game_round_id": number,// 消息类型为 4牌谱分享 时，牌谱ID
  //     "amount": number
  //
  [key: string]: unknown
}

export interface SendMsgResponseData {
  [key: string]: unknown
}

// /api/chat/club/send_messages (OrgSendMess)
export interface OrgSendMessRequest {

  //     "content": string,
  //     "message_type": number,  // 消息类型 1 普通消息 2 会长公告 3 战绩分享 4 牌谱分享
  //     "standings_user_id": number, // 消息类型为 3战绩分享 时，分享的玩家ID
  //     "game_round_id": number// 消息类型为 4牌谱分享 时，牌谱ID
  //
  [key: string]: unknown
}

export interface OrgSendMessResponseData {
  [key: string]: unknown
}

// /api/chat/message/report (ChatMessageReport)
export interface ChatMessageReportRequest {

    room_id?: number;
    msg_user_rid?: number;
    report_type?: string;
    other?: string;
    messages?: ChatMessageReportChaMessage[];

  [key: string]: unknown
}

export interface ChatMessageReportResponseData {
  [key: string]: unknown
}

export interface ChatMessageReportChaMessage {

    msg_user_rid?: number;
    content?: string;
    msg_time?: number;

  [key: string]: unknown
}

// /api/chat/room/message/sync (ChatRoomMessageSync)
export interface ChatRoomMessageSyncRequest {

    room_id?: number;
    block_user_random_ids?: string[];
    is_cowboy?: number;
    msg_types?: number[];

  [key: string]: unknown
}

export interface ChatRoomMessageSyncResponseData {

    data?: ChatRoomMessageSyncData;

  [key: string]: unknown
}

export interface ChatRoomMessageSyncData {

    data?: ChatRoomMessageSyncChatData[];

  [key: string]: unknown
}

export interface ChatRoomMessageSyncChatData {

    extra?: string;

  [key: string]: unknown
}

// /api/chat/support/channel/list (ChatSupportChannelList)
export interface ChatSupportChannelListRequest {

    limit?: number;
    offset?: number;
    order?: number;
    im_service_types?: number[];

  [key: string]: unknown
}

export interface ChatSupportChannelListResponseData {

    data?: ChatSupportChannelListData;

  [key: string]: unknown
}

export interface ChatSupportChannelListData {

    limit?: number;
    offset?: number;
    total?: number;
    list?: ChatSupportChannelListServiceData[];

  [key: string]: unknown
}

export interface ChatSupportChannelListServiceData {

    club_id?: number;
    tribe_id?: number;
    user_id?: number;
    support_user_id?: number;
    user_nickname?: string;
    user_avatar?: string;
    club_name?: string;
    club_logo?: string;
    unread_count?: number;
    im_service_type?: number;

  [key: string]: unknown
}

// /api/chat/support/message/list (ChatSupportMessageList)
export interface ChatSupportMessageListRequest {

    limit?: number;
    offset?: number;
    tribe_id?: number;
    club_id?: number;
    to_user_id?: number;
    from?: number;
    asc?: boolean;
    set_read?: boolean;
    im_service_type?: number;

  [key: string]: unknown
}

export interface ChatSupportMessageListResponseData {

    data?: ChatSupportMessageListData;

  [key: string]: unknown
}

export interface ChatSupportMessageListData {

    limit?: number;
    offset?: number;
    more?: boolean;
    list?: ChatSupportMessageListChatData[];

  [key: string]: unknown
}

export interface ChatSupportMessageListChatData {

    channel?: string;
    club_id?: number;
    tribe_id?: number;
    user_id?: number;
    support_user_id?: number;
    text?: string;
    url?: string;
    file_name?: string;
    file_size?: number;
    thumb_url?: string;
    duration?: number;
    local_time?: number;
    time_token?: number;
    status?: number;
    msg_type?: number;
    user_send?: boolean;
    sub_type?: number;
    extra?: string;

  [key: string]: unknown
}

export interface ChatSupportMessageListMatchRechargeOrder {

    user_info?: string;
    amount?: number;
    pay_price?: number;
    type_name?: string;
    order_no?: string;
    timestamp?: number;

  [key: string]: unknown
}

export interface ChatSupportMessageListMatchWithdrawOrder {

    user_info?: string;
    amount?: number;
    pay_price?: number;
    type_name?: string;
    order_no?: string;
    timestamp?: number;
    address?: string;

  [key: string]: unknown
}

// /api/chat/support/message/read (ChatSupportMessageRead)
export interface ChatSupportMessageReadRequest {

    club_id?: number;
    to_user_id?: number;
    time_token?: number;
    im_service_type?: number;

  [key: string]: unknown
}

export interface ChatSupportMessageReadResponseData {
  [key: string]: unknown
}

// /api/chat/support/message/send (ChatSupportMessageSend)
export interface ChatSupportMessageSendRequest {

    tribe_id?: number;
    club_id?: number;
    to_user_id?: number;
    msg_type?: number;
    text?: string;
    url?: string;
    file_name?: string;
    file_size?: number;
    thumb_url?: string;
    duration?: number;
    im_service_type?: number;

  [key: string]: unknown
}

export interface ChatSupportMessageSendResponseData {

    data?: ChatSupportMessageSendData;

  [key: string]: unknown
}

export interface ChatSupportMessageSendData {

    time_token?: number;

  [key: string]: unknown
}


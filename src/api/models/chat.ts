// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/chat

// /api/chat/club/inform/template/del (DelmsgTemplate)
export interface DelmsgTemplateRequest {

  //     id: number
  [key: string]: unknown
}

export interface DelmsgTemplateResponseData {

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
  [key: string]: unknown
}

export interface SetmsgTemplateResponseData {

  [key: string]: unknown
}

// /api/chat/club/messages (OrggetMessList)
export interface OrggetMessListRequest {

  //     "history_id": number, // 查历史，小于此ID的消息
  //     "last_id": number, // 查最新，大于此ID的消息
  //     "limit": 10,
  //     "offset": 0
  [key: string]: unknown
}

export interface OrggetMessListResponseData {
  [key: string]: unknown
}

// /api/chat/club/messages/new_count (OrggetNewMessNum)
export interface OrggetNewMessNumRequest {

  //     "msg_id": number
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
  [key: string]: unknown
}

export interface OrgSendMessResponseData {
  [key: string]: unknown
}

// /api/chat/message/report (ChatMessageReport)
export interface ChatMessageReportRequest {

    room_id?: number; // 房间ID
    msg_user_rid?: number; // 被举报用户RID
    report_type?: string; // 举报类型 多个类型逗号分割
    other?: string; // 其他信息
    messages?: ChatMessageReportChaMessage[]; // 聊天内容

  [key: string]: unknown
}

export interface ChatMessageReportResponseData {
  [key: string]: unknown
}

export interface ChatMessageReportChaMessage {

    msg_user_rid?: number; // 消息用户RID
    content?: string; // 消息内容
    msg_time?: number; // 消息时间戳，单位秒

  [key: string]: unknown
}

// /api/chat/room/message/sync (ChatRoomMessageSync)
export interface ChatRoomMessageSyncRequest {

    room_id?: number; // 房间号
    block_user_random_ids?: string[]; // 屏蔽人random id
    is_cowboy?: number; // 是否是牛仔 0否 1是
    msg_types?: number[]; // 消息类型 不传返回所有类型

  [key: string]: unknown
}

export interface ChatRoomMessageSyncResponseData extends ChatRoomMessageSyncData {
  [key: string]: unknown
}

export interface ChatRoomMessageSyncData {

    data?: ChatRoomMessageSyncChatData[]; // 聊天记录列表

  [key: string]: unknown
}

export interface ChatRoomMessageSyncChatData {

    extra?: string; // 聊天内容

  [key: string]: unknown
}

// /api/chat/support/channel/list (ChatSupportChannelList)
export interface ChatSupportChannelListRequest {

    limit?: number; // 条目数
    offset?: number; // 开始下标
    order?: number; // 排序方式；1:最新消息时间;2:创建时间
    im_service_types?: number[]; // 为空默认只查1、2、3类型 4撮合订单客服

  [key: string]: unknown
}

export interface ChatSupportChannelListResponseData extends ChatSupportChannelListData {
  [key: string]: unknown
}

export interface ChatSupportChannelListData {

    limit?: number; // 条目数
    offset?: number; // 开始下标
    total?: number; // 总条数
    list?: ChatSupportChannelListServiceData[]; // 客服数据列表

  [key: string]: unknown
}

export interface ChatSupportChannelListServiceData {

    club_id?: number; // 俱乐部ID
    tribe_id?: number; // 联盟ID
    user_id?: number; // 用户ID
    support_user_id?: number; // 客服用户ID
    user_nickname?: string; // 用户昵称
    user_avatar?: string; // 用户头像
    club_name?: string; // 俱乐部名称
    club_logo?: string; // 俱乐部Logo
    unread_count?: number; // 未读消息数量
    im_service_type?: number; // IM客服类型 1.俱乐部客服 2.官方FlowChat大厅首页客服 3.官方FlowChat钻石商城客服 4.撮合订单客服

  [key: string]: unknown
}

// /api/chat/support/message/list (ChatSupportMessageList)
export interface ChatSupportMessageListRequest {

    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    tribe_id?: number; // 联盟id
    club_id?: number; // 俱乐部ID
    to_user_id?: number; // 回复用户ID
    from?: number; // 起始时间戳
    asc?: boolean; // 排序顺序（true-大于from正序; false-小于from倒序）
    set_read?: boolean; // 是否将消息设置为已读
    im_service_type?: number; // IM客服类型 1.俱乐部客服 2.官方FlowChat大厅首页客服 3.官方FlowChat钻石商城客服 4.撮合订单客服

  [key: string]: unknown
}

export interface ChatSupportMessageListResponseData extends ChatSupportMessageListData {
  [key: string]: unknown
}

export interface ChatSupportMessageListData {

    limit?: number; // 数据数量
    offset?: number; // 当前偏移值
    more?: boolean;
    list?: ChatSupportMessageListChatData[]; // 聊天记录列表

  [key: string]: unknown
}

export interface ChatSupportMessageListChatData {

    channel?: string; // 聊天频道
    club_id?: number; // 俱乐部ID
    tribe_id?: number; // 联盟id
    user_id?: number; // 用户ID
    support_user_id?: number; // 客服用户ID
    text?: string; // 文本内容
    url?: string; // 资源URL
    file_name?: string; // 文件名
    file_size?: number; // 文件大小
    thumb_url?: string; // 缩略图URL
    duration?: number; // 时长（秒
    local_time?: number; // 发送本地时间戳
    time_token?: number; // Token
    status?: number; // 消息状态 2为删除
    msg_type?: number; // 消息类型（1-文本; 2-图片; 3-音频; 4-视频; 5-文件 6-客服撮合交易订单）
    user_send?: boolean; // 是否用户发送的消息
    sub_type?: number; // 当msg_type=6时 1是充值 2是提现
    extra?: string; // 当msg_type=6时 附件订单json字符串

  [key: string]: unknown
}

export interface ChatSupportMessageListMatchRechargeOrder {

    user_info?: string; // 充值用户：XXX/IDXXXXXX
    amount?: number; // 充值UC
    pay_price?: number; // 支付金额
    type_name?: string; // 支付类型
    order_no?: string; // 订单号
    timestamp?: number; // 申请时间，时间戳（秒）

  [key: string]: unknown
}

export interface ChatSupportMessageListMatchWithdrawOrder {

    user_info?: string; // 提现用户：XXX/IDXXXXXX
    amount?: number; // 回收UC
    pay_price?: number; // 回收金额
    type_name?: string; // 收款类型
    order_no?: string; // 订单号
    timestamp?: number; // 申请时间，时间戳（秒）
    address?: string; // 钱包地址

  [key: string]: unknown
}

// /api/chat/support/message/read (ChatSupportMessageRead)
export interface ChatSupportMessageReadRequest {

    club_id?: number; // 俱乐部ID
    to_user_id?: number; // 回复用户ID
    time_token?: number; // Token
    im_service_type?: number; // 客服类型 1.俱乐部客服 2.官方FlowChat大厅首页客服 3.官方FlowChat钻石商城客服 4.撮合订单客服

  [key: string]: unknown
}

export interface ChatSupportMessageReadResponseData {
  [key: string]: unknown
}

// /api/chat/support/message/send (ChatSupportMessageSend)
export interface ChatSupportMessageSendRequest {

    tribe_id?: number; // 联盟id
    club_id?: number; // 俱乐部ID
    to_user_id?: number; // 回复用户ID
    msg_type?: number; // 消息类型（1-文本; 2-图片; 3-音频; 4-视频; 5-文件）
    text?: string; // 文本内容
    url?: string; // 资源URL
    file_name?: string; // 文件名
    file_size?: number; // 文件大小
    thumb_url?: string; // 缩略图URL
    duration?: number; // 时长（秒
    im_service_type?: number; // IM客服类型 1.俱乐部客服 2.官方FlowChat大厅首页客服 3.官方FlowChat钻石商城客服 4.撮合订单客服

  [key: string]: unknown
}

export interface ChatSupportMessageSendResponseData extends ChatSupportMessageSendData {
  [key: string]: unknown
}

export interface ChatSupportMessageSendData {

    time_token?: number;

  [key: string]: unknown
}

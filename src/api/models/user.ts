// /user/refresh 请求参数。
export interface UserRefreshRequest {
  [key: string]: unknown
}

// /user/refresh 响应 data。
export interface UserRefreshData {
  // 刷新的 token。
  token?: string
  // 过期时间。
  expire_at?: number
  [key: string]: unknown
}

// /user/check_phone 请求参数。
export interface UserCheckPhoneRequest {
  // 手机号码。
  phone?: string
  // 国家区号。
  area?: string
  // 邮箱。
  email?: string
  [key: string]: unknown
}

// /user/check_phone 响应 data。
export interface UserCheckPhoneData {
  [key: string]: unknown
}

// /user/check_email 请求参数。
export interface UserCheckEmailRequest {
  email?: string
  [key: string]: unknown
}

// /user/check_email 响应 data。
export interface UserCheckEmailData {
  [key: string]: unknown
}

// /user/sendcode 请求参数。
export interface UserSendCodeRequest {
  // 手机号码。
  phone?: string
  // 国家区号。
  area?: string
  [key: string]: unknown
}

// /user/send_email_code 请求参数。
export interface UserSendEmailCodeRequest {
  lang?: number
  email?: string
  [key: string]: unknown
}

// /user/send_email_code 响应 data。
export interface UserSendEmailCodeData {
  [key: string]: unknown
}

// /user/modify/password 请求参数。
export interface UserModifyPasswordRequest {
  email?: string
  // 手机号码。
  phone?: string
  // 密码。
  password?: string
  // 国家区号。
  area?: string
  // 验证码。
  code?: string
  [key: string]: unknown
}

// /user/modify/password 响应 data。
export interface UserModifyPasswordData {
  user_id?: number
  [key: string]: unknown
}

// /user/modify/user_info 请求参数。
export interface UserModifyInfoRequest {
  // 性别。
  sex?: number
  // 昵称。
  nick_name?: string
  // 头像地址。
  avatar?: string
  [key: string]: unknown
}

// /user/modify/user_info 响应 data。
export interface UserModifyInfoData {
  data?: Record<string, unknown>
  [key: string]: unknown
}

// /user/check_nickname 请求参数。
export interface UserCheckNicknameRequest {
  nickname?: string
  [key: string]: unknown
}

// /user/check_nickname 响应 data。
export interface UserCheckNicknameData {
  data?: Record<string, unknown>
  [key: string]: unknown
}

// /user/register 请求参数。
export interface UserRegisterRequest {
  // 手机号码。
  phone?: string
  // 密码。
  password?: string
  // 国家区号。
  area?: string
  // 验证码。
  code?: string
  email?: string
  // 平台（1-IOS 2-Android 3-Windows 4-OSX 5-Web 6-MiniWeb 7-Linux）。
  platform?: number
  // 邀请码。
  invite_code?: string
  // 绑定邀请码唯一id（代理）
  trace_hash?: string
  [key: string]: unknown
}

// /user/register 响应 data。
export interface UserRegisterData {
  // 用户 id。
  userId?: number
  [key: string]: unknown
}

// /user/{id}/info 请求参数。
export interface OtherUserInfoRequest {
  [key: string]: unknown
}

// /user/{id}/info 响应 data。
export interface OtherUserInfoData {
  [key: string]: unknown
}

// /user/room/{id} 最近带出信息。
export interface UserRoomLastBringOut {
  // 带出到钱包的金豆。
  to_wallet?: number
  // 服务费。
  fee?: number
  // 公会 id。
  club_id?: number
  // 钱包类型（1 gold/联盟币，2 usdt）。
  gold_type?: number
  [key: string]: unknown
}

// /user/room/{id} 钱包项。
export interface UserRoomWalletItem {
  // 用户 id。
  w_u_id?: number
  // 公会 id。
  club_id?: number
  // 联盟 id。
  tribe_id?: number
  // 金豆。
  gold?: number
  // 锁定金豆。
  gold_lock?: number
  // 钱包状态（1 正常，2 停用，3 提现中）。
  wallet_status?: number
  // 钱包类型（1 gold/联盟币，2 usdt）。
  gold_type?: number
  // 币种三字码。
  gold_currency?: string
  // 公会随机 id。
  club_random_id?: number
  // 公会名称。
  club_name?: string
  [key: string]: unknown
}

// /user/room/{id} 请求参数。
export interface UserRoomRequest {
  [key: string]: unknown
}

// /user/room/{id} 响应 data。
export interface UserRoomData {
  last_bring_out?: UserRoomLastBringOut
  wallet?: UserRoomWalletItem[]
  [key: string]: unknown
}

// /user/room_settle/detail/{id} 请求参数。
export interface UserRoomSettleDetailRequest {
  [key: string]: unknown
}

// /user/room_settle/detail/{id} 个人结算。
export interface UserRoomSettleSelf {
  user_random_id?: number
  nick_name?: string
  avatar?: string
  user_hand_num?: number
  bring_in?: number
  bring_out?: number
  [key: string]: unknown
}

// /user/room_settle/detail/{id} 玩家结算项。
export interface UserRoomSettleUserInfo {
  user_random_id?: number
  nick_name?: string
  avatar?: string
  user_hand_num?: number
  bring_in?: number
  bring_out?: number
  mushroom_count?: number
  mushroom_amount?: number
  squid_in?: number
  squid_out?: number
  punish_fee?: number
  [key: string]: unknown
}

// /user/room_settle/detail/{id} 响应 data。
export interface UserRoomSettleDetailData {
  list?: UserRoomSettleUserInfo[]
  self_settle?: UserRoomSettleSelf
  insurance?: number
  insurance_on?: number
  room_name?: string
  room_id?: number
  end_time?: string | number
  game_type?: string | number
  [key: string]: unknown
}

// /user/bind_status 响应 data。
export interface UserBindStatusData {
  // cocos 未提供 bind_status 的完整字段定义，按兼容保留。
  email_bind?: boolean
  phone_bind?: boolean
  third_party_bind?: boolean
  [key: string]: unknown
}

// /user/bind_email 请求参数。
export interface UserBindEmailRequest {
  email?: string
  code?: string
  password?: string
  [key: string]: unknown
}

// /user/bind_phone 请求参数。
export interface UserBindPhoneRequest {
  phone?: string
  area?: string
  code?: string
  password?: string
  [key: string]: unknown
}

// /user/bind_third_party 请求参数。
export interface UserBindThirdPartyRequest {
  token?: string
  source?: string
  app_source?: number
  [key: string]: unknown
}

// /user/mute/list 响应 data。
export interface UserMuteListData {
  ids?: number[]
  [key: string]: unknown
}

// /user/my_wallets 钱包项。
export interface UserMyWalletItem {
  gold?: number
  club_name?: string
  [key: string]: unknown
}

// /user/my_wallets 响应 data。
export interface UserMyWalletsData {
  amount?: number
  wallet?: UserMyWalletItem[]
  [key: string]: unknown
}

// /user/get_avatars 头像项。
export interface UserAvatarItem {
  url?: string
  avatar_type?: number
  [key: string]: unknown
}

// /user/get_avatars 响应 data。
export interface UserAvatarsData {
  list?: UserAvatarItem[]
  [key: string]: unknown
}

// ===== 由 models/auth.ts 合并而来 =====

// 登录接口请求参数。
export interface LoginRequest {
  phone: string
  password: string
  area: string
}

// /user/login2 请求参数（对齐 Cocos 客户端）。
export interface LoginV2Request {
  area?: string
  phone?: string
  email?: string
  password: string
  invite_code?: string
  trace_hash?: string
  [key: string]: unknown
}

// 登录接口返回结构（重点字段 token）。
export interface LoginResponse {
  token: string
  [key: string]: unknown
}

// 用户信息接口外层响应。
export interface UserInfoResponse {
  code: number
  data: UserInfoData
  message: string
  [key: string]: unknown
}

// 用户信息接口 data。
export interface UserInfoData {
  closeChatTime?: number
  muteList: Array<Record<string, unknown>>
  openChat: boolean
  user: UserInfoUser
  [key: string]: unknown
}

// 用户对象（按当前业务使用保留常用字段）。
// export interface UserInfoUser {
//   nickname: string
//   unid?: number
//   userid?: number
//   id?: number
//   wUid?: number
//   pUid?: number
//   w_u_id?: number
//   [key: string]: unknown
// }

// /api/user/ws 外层响应。
export interface UserWsResponse {
  code: number
  message: string
  data?: UserWsData
  [key: string]: unknown
}

// /api/user/ws 的 data。
export interface UserWsData {
  // websocket 端口，来自 /api/user/ws。
  port?: number
  [key: string]: unknown
}

// /api/user/send_verify_code (UserDeleteCode)

export interface UserDeleteCodeRequest {
  area?: string // 区号
  phone?: string // 手机号码
  email?: string // 邮箱地址
  lang?: number // 语言

  [key: string]: unknown
}

export interface UserDeleteCodeResponseData extends UserDeleteCodeData {
  [key: string]: unknown
}

export interface UserDeleteCodeData {
  [key: string]: unknown
}

// /api/user/delete (UserDelete)

export interface UserDeleteRequest {
  area?: string // 区号
  phone?: string // 手机号码
  email?: string // 邮箱地址
  code?: string // 验证码

  [key: string]: unknown
}

export interface UserDeleteResponseData extends UserDeleteData {
  [key: string]: unknown
}

export interface UserDeleteData {
  [key: string]: unknown
}

// /api/user/quick_password/verify (UserVerifyPassword)

export interface UserVerifyPasswordRequest {
  user_pwd_type?: number // 用户密码类型： 1 - 普通密码 2 - 数字密码 3 - 手势密码 4 - 生物密码（面容或指纹）
  password?: string // 密码的MD5哈希值

  [key: string]: unknown
}

export interface UserVerifyPasswordResponseData extends UserVerifyPasswordData {
  [key: string]: unknown
}

export interface UserVerifyPasswordData {
  verify?: boolean // 校验是否通过
  failed_count?: number // 失败次数

  [key: string]: unknown
}

// /api/user/quick_password/modify (UserModifyQuickInfo)

export interface UserModifyQuickInfoRequest {
  user_pwd_type?: number // 密码类型：1 普通密码；2 数字密码；3 手势密码；4 生物密码（面容或指纹）
  switch_status?: number // 开关状态：1 开；2 关
  password?: string // 用户密码的MD5哈希值

  [key: string]: unknown
}

export interface UserModifyQuickInfoResponseData extends UserModifyQuickInfoData {
  [key: string]: unknown
}

export interface UserModifyQuickInfoData {
  [key: string]: unknown
}

// /api/user/modify/quick/login/switch (UserModifyQuickSwitch)

export interface UserModifyQuickSwitchRequest {
  quick_login_switch?: number // 快捷登录开关状态：1 开启；2 关闭
  quick_login_type?: string // 快捷登录类型组合，格式为"1_2_3"： 1 代表手势密码 2 代表数字密码 3 代表生物识别（面容/指纹） 示例："1_3"表示启用手势和生物识别

  [key: string]: unknown
}

export interface UserModifyQuickSwitchResponseData extends UserModifyQuickSwitchData {
  [key: string]: unknown
}

export interface UserModifyQuickSwitchData {
  [key: string]: unknown
}

// /api/user/modify/bringin/password/switch (UserModifyBringInSwitch)

export interface UserModifyBringInSwitchRequest {
  bringin_pwd_switch?: number // 带入二级密码开关：1=开，2=关
  bringin_pwd_type?: number // 带入二级密码类型：1=手势，2=数字密码，3=生物识别
  bringin_pwd_verify_type?: number // 带入二级密码验证频率类型： 1=每次带入，2=每桌一次

  [key: string]: unknown
}

export interface UserModifyBringInSwitchResponseData extends UserModifyBringInSwitchData {
  [key: string]: unknown
}

export interface UserModifyBringInSwitchData {
  [key: string]: unknown
}

// /api/user/wallets_log (UserBill)

export interface UserBillRequest {
  gold_type?: number // 钱包类型 1=UC 2=GC 3=记分牌 4=钻石
  origin_type?: number // 记分牌来源 当 gold_type=3 时生效： 3=俱乐部桌 4=朋友桌
  limit?: number // 每页条数
  offset?: number // 开始下标
  user_id?: number // 用户ID
  op_codes?: string[] // 操作类型编码数组
  sort_type?: number // 排序类型：1-创建时间；2-成员数；3-等级
  order_type?: number // 排序方式 1=升序 2=降序
  start_time?: number // 开始时间戳
  end_time?: number // 结束时间戳
  club_id?: number // 俱乐部ID

  [key: string]: unknown
}

export interface UserBillResponseData extends UserBillData {
  [key: string]: unknown
}

export interface UserBillData {
  limit?: number // 数据数量
  offset?: number // 当前偏移值
  total?: number // 总条数
  list?: UserBillWallet[] // 钱包列表
  total_info?: UserBillTotalInfo // 统计信息列表

  [key: string]: unknown
}

// /api/user/my_wallets (UserWallet)

export interface UserWalletRequest {
  gold_type?: number // 货币类型： 1 = UC， 2 = GC， 3 = 记分牌， 4 = 钻石
  origin_type?: number // 记分牌来源（仅在 gold_type=3 时使用）： 3 = 俱乐部桌， 4 = 朋友桌

  [key: string]: unknown
}

export interface UserWalletResponseData extends UserWalletData {
  [key: string]: unknown
}

export interface UserWalletData {
  amount?: number // 金额
  wallet?: UserWalletWallet[] // 钱包列表
  [key: string]: unknown
}

// /user/gold_change/log 请求参数。
export interface UserGoldChangeLogRequest {
  limit?: number
  offset?: number
  gold_type?: number // 1-联盟币 2-USDT
  op_codes?: string[]
  start_time?: number
  end_time?: number
  [key: string]: unknown
}

// /user/gold_change/log 单条记录。
export interface UserGoldChangeLogRecord {
  gold_change?: number // 资金变动量（正=收入 负=支出）
  gold_after?: number // 变动后余额
  create_time?: string
  op_code?: string // 操作类型标识
  src_type?: number // 来源：0普通 1德州牌桌 2-MTT 3牛仔
  src_room_id?: number
  src_match_id?: number
  name?: string // 牌局/来源名称
  gold_type?: number // 1-联盟币 2-USDT
  src_nick_name?: string
  src_random_id?: number
  [key: string]: unknown
}

// /user/gold_change/log 响应 data。
export interface UserGoldChangeLogData {
  limit?: number
  offset?: number
  total?: number
  list?: UserGoldChangeLogRecord[]
  [key: string]: unknown
}

// /api/user/wallets_log (UserBill)

export interface UserBillTotalInfo {
  grant_amount?: number // 发放总额
  recover_amount?: number // 回收总额
  bring_amount?: number // 赢取金额
  self_profit_amount?: number // 返水（RB）总额
  change_amount?: number // 变动总额

  [key: string]: unknown
}

export interface UserBillWallet {
  gold_change?: number // 余额变动
  gold_after?: number // 变动后余额
  create_time?: string // 创建时间
  op_code?: string // 操作类型
  gold_type?: number // 金币类型
  club_name?: string // 俱乐部名称
  src_type?: number
  src_room_id?: number // 来源房间ID
  name?: string // 牌局名称
  room_info?: UserBillRoom_info // 房间信息 没有则为null
  date?: string // 显示的日期 为空则不显示
  memeber_array?: UserBillMember[] // 批量赠送钻石
  memeber_count?: number // 批量赠送钻石的成员数量
  tribe_name?: string // 联盟名称
  nick_name?: string // 用户名称
  user_random_id?: number // 用户随机id
  op_nick_name?: string // 发送目的用户名称
  op_random_id?: number // 发送目的用户id
  multi_lang_names_obj?: unknown // 多语言名称
  src_match_id?: number
  match_tribe_name?: string
  src_nick_name?: string // 来源用户昵称
  src_random_id?: number // 来源用户ID

  [key: string]: unknown
}

export interface UserBillRoom_info {
  club_name?: string // 创建房间的俱乐部名称
  creator_name?: string // 创建房间的用户名
  bring_in_amount?: number // 总带入
  bring_out_amount?: number // 总带出
  origin_type?: number // 创建来源 1=平台 2=联盟 3=俱乐部 4=个人（朋友桌）
  share_table?: number // 是否共享牌桌 1=不共享 2=共享
  records?: UserBillRecord[] // 变动金额列表
  self_profit_amount?: number // 自身返水金额
  game_type?: number // 游戏类型
  ante?: number // 前注
  poker_type?: number // 牌型

  [key: string]: unknown
}

export interface UserBillRecord {
  gold_change?: number // 变动金额
  op_code?: string // 操作类型
  create_time?: string // 创建时间

  [key: string]: unknown
}

export interface UserBillMember {
  nick_name?: string // 名称
  gold_change?: number // 变动金额
  create_time?: string // 创建时间

  [key: string]: unknown
}

// /api/user/user_diamonds_wallet (UserDiamondsWallet)

export interface UserDiamondsWalletRequest {
  [key: string]: unknown
}

export interface UserDiamondsWalletRecord {
  user_id?: number // 用户ID
  diamonds?: number // 用户钻石余额
  diamonds_lock?: number // 是否锁住
  wallet_status?: number // 用户钱包状态 1:正常 2 冻结 3 锁定
  at?: string // 联盟币

  [key: string]: unknown
}

export interface UserDiamondsWalletData {
  all_profit?: number // 累计看牌收益
  today_profit?: number // 今日看牌收益
  yestoday_profit?: number // 昨日看牌收益
  diamonds_wallet?: UserDiamondsWalletRecord // 钻石钱包

  [key: string]: unknown
}

export interface UserDiamondsWalletResponseData extends UserDiamondsWalletData {
  [key: string]: unknown
}

// /api/user/my_wallets (UserWallet)

export interface UserWalletWallet {
  gold?: number // 金额
  club_name?: string // 俱乐部名称

  [key: string]: unknown
}

export interface UserInfoUser {
  p_u_id?: number // 玩家真实id（客户端不用这个id）
  area?: string // 手机号地区 例子：+86
  phone?: string // 手机号
  gold?: number // UC币
  un_id?: number // 玩家随机id
  nickname?: string // 名字
  avatar?: string // 头像
  sex?: number // 性别
  province?: string // 省会
  mnt?: number // 修改用户[名称]次数
  mat?: number // 修改用户[头像]次数
  ut?: number // 1 普通用户; 2 支桌号; 3 牌局机器人; 4 牛仔机器人； 5 游客
  limit?: number // 用户限制 1 不限制, 2 限制
  club_id?: number // 俱乐部ID
  save_face?: number // 是否保存人脸验证，1 是，2否
  email?: string // 邮箱
  quick_login_switch?: number // 快捷登录 1开 其他关
  bringin_pwd_switch?: number // 带入二级密码 1开 其他关
  quick_login_type?: string // 快捷登录类型
  bringin_pwd_type?: number // 带入二级密码类型
  bringin_pwd_verify_type?: number // 带入二级密码证明类型
  digital_switch?: number // 数字密码 1开 其他关
  gesture_switch?: number // 手势密码 1开 其他关
  biometric_switch?: number // 生物识别 1开 其他关
  user_current_subscription?: UserInfoUserVIPInfo // 用户VIP信息
  lucky_num?: number // 幸运号
  extra_status?: UserInfoUserExtraStatus // 用户额外状态
  trader_expire_time?: number // USDT批发商有效期
  user_today_diamond_send_time?: number // 今天赠送次数
  diamond_free_times?: number // 钻石免费次数
  diamonds?: number // 用户钻石余额
  forbid?: number // 冻结状态 0 被冻结；1 正常
  ip_addr?: string // 玩家的IP属地

  [key: string]: unknown
}

export interface UserInfoUserExtraStatus {
  share_table_guide?: number // 是否完成分享引导
  change_desk_guide?: number // 是否完成桌布引导
  isShowBB?: number // 是不是展示BB 1展示 0不展示

  [key: string]: unknown
}

export interface UserInfoUserVIPInfo {
  subscription_id?: number // 会员ID
  subscription_name?: string // 会员名称
  subscription_logo?: string // 会员Logo
  subscription_end_time?: number // 会员到期时间（时间戳）
  free_add_time_num?: number // 免费加时次数
  free_view_card_num?: number // 免费查看翻牌次数
  free_use_chat_prop_num?: number // 免费扔道具次数
  free_use_chat_emoji_num?: number // 免费使用表情次数
  free_use_chat_bullet_num?: number // 免费使用弹幕框次数
  free_use_chat_avatar_num?: number // 免费使用头像聊天框次数
  free_added_time_num?: number // 已免费加时次数
  free_viewed_card_num?: number // 已免费查看翻牌次数
  free_used_chat_prop_num?: number // 已免费扔道具次数
  free_used_chat_emoji_num?: number // 已免费使用表情次数
  free_used_chat_bullet_num?: number // 已免费使用弹幕框次数
  free_used_chat_avatar_num?: number // 已免费使用头像聊天框次数
  subscription_price_type?: number // 价格类型：0=永久，1=30天（月），2=90天（季），3=180天（半年），4=365天（年）
  free_collect_card?: number // 免费收藏牌谱次数
  free_change_user_name?: number // 免费修改玩家昵称次数
  free_watch_card?: number // 免费看手牌次数
  free_used_collect_card?: number // 已免费使用收藏牌谱次数
  free_used_change_user_name?: number // 已免费使用修改玩家昵称次数
  free_used_watch_card?: number // 已免费使用看手牌次数

  [key: string]: unknown
}

// /api/user/trader/apply/list (USDTApplyList)

export interface USDTApplyListRequest {
    status?: number; // 订单状态 1-申请中 2-成功 3-拒绝 4-取消 5-超时

  [key: string]: unknown
}

export interface USDTApplyListResponseData extends USDTApplyListData {
  [key: string]: unknown
}

export interface USDTApplyListData {
    list?: USDTApplyListApplyInfo[]; // 申请列表

  [key: string]: unknown
}

export interface USDTApplyListApplyInfo {
    order_no?: string; // 订单号
    status?: number; // 订单状态 1-申请中 2-成功 3-拒绝 4-取消 5-超时
    reject_reason?: string; // 拒绝理由
    read_status?: number; // 已读状态
    audit_time?: string; // 审核时间
    update_time?: string; // 更新时间
    create_time?: string; // 创建时间

  [key: string]: unknown
}

// /api/user/trader/apply (USDTApply)

export interface USDTApplyRequest {
  [key: string]: unknown
}

export interface USDTApplyResponseData extends USDTApplyData {
  [key: string]: unknown
}

export interface USDTApplyData {
    data?: USDTApplyListApplyInfo[]; // 申请列表

  [key: string]: unknown
}

// /api/user/trader/apply/read (USDTApplyRead)

export interface USDTApplyReadRequest {
    order_nos?: string[];

  [key: string]: unknown
}

export interface USDTApplyReadResponseData extends USDTApplyReadData {
  [key: string]: unknown
}

export interface USDTApplyReadData {
  [key: string]: unknown
}

// /api/user/freeze/public/list (NewSafety)

export interface NewSafetyRequest {
    limit?: number; // 条目数量
    offset?: number; // 开始下标。例子：offset=0，limit=10，代表0-9条数据

  [key: string]: unknown
}

export interface NewSafetyResponseData extends NewSafetyData {
  [key: string]: unknown
}

export interface NewSafetyData {
    limit?: number; // 条目数量
    offset?: number; // 开始下标
    list?: NewSafetyRecord[]; // 数据记录列表

  [key: string]: unknown
}

export interface NewSafetyRecord {
    create_time?: string; // 创建时间
    user_random_id?: number; // 用户随机ID
    user_nick_name?: string; // 用户昵称
    user_avatar?: string; // 用户头像

  [key: string]: unknown
}

// /api/user/club/creator/grant (ClubSendDiamonds)

export interface ClubSendDiamondsRequest {
    amount?: number; // 金额
    user_ids?: number[]; // 用户IDs

  [key: string]: unknown
}

export interface ClubSendDiamondsResponseData extends ClubSendDiamondsData {
  [key: string]: unknown
}

export interface ClubSendDiamondsData {
  [key: string]: unknown
}

// /api/user/agent/diamonds/grant (UserAgencySendDiamonds)

export interface UserAgencySendDiamondsRequest {
    amount?: number; // 金额
    user_id?: number; // 用户id

  [key: string]: unknown
}

export interface UserAgencySendDiamondsResponseData extends UserAgencySendDiamondsData {
  [key: string]: unknown
}

export interface UserAgencySendDiamondsData {
  [key: string]: unknown
}

// /api/user/agent/gold/grant (UserAgencyGoldGrant)

export interface UserAgencyGoldGrantRequest {
    user_id?: number; // 用户ID
    amount?: number; // 金额
    op_type?: number; // 操作类型： 1 - 发放豆 2 - 回收豆
    legal_tender?: number; // 法币金额（单位：分）

  [key: string]: unknown
}

export interface UserAgencyGoldGrantResponseData extends UserAgencyGoldGrantData {
  [key: string]: unknown
}

export interface UserAgencyGoldGrantData {
  [key: string]: unknown
}

// /api/user/login_third_party (UserLoginThirdParty)

export interface UserLoginThirdPartyRequest {
    source: string; // 第三方平台标识，支持 facebook,instagram,google,telegram
    app_source: number; // 应用来源，1-IOS 2-Android 3-Web
    telegram_init_data: string; // Telegram 登录所需的 init_data 字符串,
    platform: number; // 平台(platform):1-IOS 2-Android 3-Windows 4-OSX 5-Web 6-MiniWeb 7-Linux
    invite_code?: string; // 邀请码
    trace_hash?: string; // 绑定邀请码唯一id（代理）
    device_id?: string;
    user_device_no?: string;
    system_version?: string;
    client_language?: string;
    system_language?: string;
    gps_latitude?: string;
    gps_longitude?: string;
    is_simulator?: boolean;
    mac_addr?: string;
}

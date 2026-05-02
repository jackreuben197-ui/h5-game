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
  [key: string]: unknown
}

// /user/room_settle/detail/{id} 响应 data。
export interface UserRoomSettleDetailData {
  list?: UserRoomSettleUserInfo[]
  self_settle?: UserRoomSettleSelf
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
export interface UserInfoUser {
  nickname: string
  unid?: number
  userid?: number
  id?: number
  wUid?: number
  pUid?: number
  [key: string]: unknown
}

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

// 与 Cocos 端 StorageKey.ts 保持一致，便于双端共用同一批 key 约定。
export default class StorageKey {
  // 清理所有记录的标记。
  static CLEAN_ALL_FLAG = 'CLEAN_ALL_FLAG'
  // 登录数据（H5 侧 Pinia 持久化主键）。
  static LOGIN_DATA = 'LOGIN_DATA'
  // 全局共享缓存（userInfo / clubList / currentClubId）。
  static USER_DATA = 'USER_DATA'
  // token 字符串。
  static TOKEN = 'TOKEN'
  // websocket 端口（对应 Cocos LoginSession.SyncWS 的 data.port）。
  static WS_PORT = 'WS_PORT'
  // websocket 端口更新时间（毫秒时间戳）。
  static WS_PORT_UPDATED_AT = 'WS_PORT_UPDATED_AT'
  // 牌局列表缓存（用于页面秒开 + 静默刷新）。
  static ROOM_LIST_CACHE = 'ROOM_LIST_CACHE'
  // 牌局分组展开状态缓存（key 为 groupKey，value 为是否展开）。
  static ROOM_GROUP_EXPANDED_CACHE = 'ROOM_GROUP_EXPANDED_CACHE'
  // 联盟封禁名单缓存（按 tribe_id 维度存储）。
  static TRIBE_BLACK_USER_LIST_CACHE = 'TRIBE_BLACK_USER_LIST_CACHE'
  // 首页玩法统计缓存（扑克/麻将/小游戏/MTT）。
  static HOME_ROOM_STATS_CACHE = 'HOME_ROOM_STATS_CACHE'
  // MTT 列表缓存（首页与 MTT 列表页共享）。
  static MTT_LIST_CACHE = 'MTT_LIST_CACHE'
  // 全局配置缓存（global/config，登录后静默拉取）。
  static APP_CONFIG_CACHE = 'APP_CONFIG_CACHE'
  // 收费配置缓存（diamond/config，独立 key 避免与游戏设置混用）。
  static DIAMOND_CONFIG_CACHE = 'DIAMOND_CONFIG_CACHE'
  // 通用多语言模板缓存（名称/道具/简介等模板文本都可复用）。
  static MULTI_LANGUAGE_TEMPLATE_CACHE = 'MULTI_LANGUAGE_TEMPLATE_CACHE'
  // 用户协议/隐私协议缓存（按 type + language 维度存储）。
  static PROTOCOL_ARTICLE_CACHE = 'PROTOCOL_ARTICLE_CACHE'
  // 登录区号列表缓存（/config/register/area）。
  static LOGIN_AREA_LIST_CACHE = 'LOGIN_AREA_LIST_CACHE'
  // token 有效期。
  static TOKEN_EXPIREAT = 'TOKEN_EXPIREAT'
  // 电话区号（保持原拼写 AERA，与 Cocos 对齐）。
  static AERA_CODE = 'AERA_CODE'
  // 手机号。
  static PHONE = 'PHONE'
  // 当前语言。
  static Language = 'Language'

  // 用户 ID 相关缓存。
  static KEY_USERID = 'KEY_USERID'
  // 手机号相关缓存。
  static KEY_PHONE = 'KEY_PHONE'
  // 首次手机号标记。
  static KEY_PHONE_FIRST = 'KEY_PHONE_FIRST'

  // 验证码时间：忘记密码（手机）。
  static CODE_TIME_RESET_PHONE = 'CODE_TIME_RESET_PHONE'
  // 验证码时间：忘记密码（邮箱）。
  static CODE_TIME_RESET_MAIL = 'CODE_TIME_RESET_MAIL'
  // 验证码时间：注册（手机）。
  static CODE_TIME_REGIST_PHONE = 'CODE_TIME_REGIST_PHONE'
  // 验证码时间：注册（邮箱）。
  static CODE_TIME_REGIST_MAIL = 'CODE_TIME_REGIST_MAIL'
  // 验证码时间：快速登录（手机）。
  static CODE_TIME_QUIKLY_LOGIN_PHONE = 'CODE_TIME_QUIKLY_LOGIN_PHONE'
  // 验证码时间：邮箱登录。
  static CODE_TIME_EMAIL = 'CODE_TIME_EMAIL'
  // 验证码时间：更换绑定。
  static CODE_TIME_CHANGE_BLIND = 'CODE_TIME_CHANGE_BLIND'

  // 是否打开弹幕（1 关闭，0 打开）。
  static OpenBarrage = 'OpenBarrage'
  // 桌布样式。
  static SettingDeskType = 'SettingDeskType'
  // 扑克牌样式。
  static SettingPokerType = 'SettingPokerType'
  // 自定义加注索引。
  static kQuickActionIndexKEY = 'kQuickActionIndexKEY'
  // 自定义加注值。
  static kQuickActionIndexValueKEY = 'kQuickActionIndexValueKEY'
  // 牌面类型切换。
  static togglesCardType = 'togglesCardType'
  // 声音开关。
  static soundIsOpen = 'soundIsOpen'
  // 渠道代理邀请码缓存（首次打开分享链接时缓存参数 i）。
  static AGENT_INVITE_CODE = 'AGENT_INVITE_CODE'
}

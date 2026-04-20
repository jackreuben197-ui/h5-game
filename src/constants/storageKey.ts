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
}

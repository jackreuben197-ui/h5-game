// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/userproxy

// /api/userproxy/im/auth/user_token (UserProxyImAuthUserToken)
export interface UserProxyImAuthUserTokenRequest {

    platform?: number; // 平台
    operatio_id?: string; // 时间戳 秒

  [key: string]: unknown
}

export interface UserProxyImAuthUserTokenResponseData {
  [key: string]: unknown
}

export interface UserProxyImAuthUserTokenData {

    userID?: string; // IM用户ID
    token?: string; // 令牌
    expiredTime?: number; // 过期时间

  [key: string]: unknown
}


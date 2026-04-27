// 该文件由迁移脚本从 cocos Request 自动生成并做结构化转换。
// 前缀: /api/userproxy

// /api/userproxy/im/auth/user_token (UserProxyImAuthUserToken)
export interface UserProxyImAuthUserTokenRequest {

    platform?: number;
    operatio_id?: string;

  [key: string]: unknown
}

export interface UserProxyImAuthUserTokenResponseData {
  [key: string]: unknown
}

export interface UserProxyImAuthUserTokenData {

    userID?: string;
    token?: string;
    expiredTime?: number;

  [key: string]: unknown
}

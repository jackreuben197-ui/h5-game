import { postDiamondConfigApi, postGlobalConfigApi } from '@/api/config'
import { getUserClubApi, getUserInfoApi } from '@/api/user'
import {
  forwardDiamondConfigToCocos,
  forwardGlobalConfigToCocos,
  forwardUserClubToCocos,
} from '@/bridge/sync/h5BusinessSync'
import StorageKey from '@/constants/storageKey'
import { setLocale, type LocaleCode } from '@/i18n'
import LoginSession from '@/session/loginSession'
import { useAppConfigStore } from '@/stores/appConfig'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/stores/pinia'
import { useUserInfoStore } from '@/stores/userInfo'
import { localStore } from '@/utils/localStore'
import { ensureMultiLanguageTemplateLoaded } from '@/utils/multiLanguageTemplate'
import { readClubListCache } from '@/utils/userClubListCache'

let inFlightToken = ''
let inFlightPromise: Promise<PostAuthProfileSyncResult> | null = null

interface PostAuthProfileSyncResult {
  userInfoSynced: boolean
  userClubSynced: boolean
}

export interface PostAuthSyncResult extends PostAuthProfileSyncResult {
  websocketSynced: boolean
}

function combinePostAuthSync(
  websocketSync: Promise<boolean>,
  profileSync: Promise<PostAuthProfileSyncResult>,
): Promise<PostAuthSyncResult> {
  return Promise.all([websocketSync, profileSync]).then(([websocketSynced, profile]) => ({
    websocketSynced,
    ...profile,
  }))
}

// 登录成功 / 启动时持有有效 token 都走这里：把首页无关的拉取/同步集中起来，避免必须切到首页才触发。
export function syncPostAuthData(): Promise<PostAuthSyncResult> {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken.trim()
  if (!token || gameStore.isGuestAccount) {
    return Promise.resolve({
      websocketSynced: false,
      userInfoSynced: false,
      userClubSynced: false,
    })
  }

  // WS 保活独立于资料同步：同一 token 已同步过时，仍允许刷新/路由切换兜底恢复 WS。
  const wsReady = LoginSession.EnsureWS()
    .then(() => true)
    .catch((error) => {
      console.warn('[post-auth-sync] ensure ws failed:', error)
      return false
    })

  if (!gameStore.shouldSyncIdentity(token)) {
    return combinePostAuthSync(
      wsReady,
      Promise.resolve({ userInfoSynced: true, userClubSynced: true }),
    )
  }

  if (inFlightPromise && inFlightToken === token) {
    return combinePostAuthSync(wsReady, inFlightPromise)
  }

  inFlightToken = token
  inFlightPromise = runPostAuthSync(token).finally(() => {
    if (inFlightToken === token) {
      inFlightToken = ''
      inFlightPromise = null
    }
  })
  return combinePostAuthSync(wsReady, inFlightPromise)
}

async function runPostAuthSync(token: string): Promise<PostAuthProfileSyncResult> {
  const gameStore = useGameStore(pinia)
  const appConfigStore = useAppConfigStore(pinia)
  const userInfoStore = useUserInfoStore(pinia)

  await appConfigStore.restorePublicConfigCache()
    .then(() => {
      if (appConfigStore.globalConfig) {
        forwardGlobalConfigToCocos(appConfigStore.globalConfig)
      }
      if (appConfigStore.diamondConfig) {
        forwardDiamondConfigToCocos(appConfigStore.diamondConfig)
      }
    })
    .catch((error) => {
      console.warn('[post-auth-sync] restore public config cache failed:', error)
    })

  // 上一次登录已知 userId 时，先用用户级 IndexedDB 缓存填充 clubList，再发请求静默刷新。
  if (gameStore.loginUserId && !userInfoStore.clubList.length) {
    try {
      const cached = await readClubListCache(gameStore.loginUserId)
      if (cached.length && !userInfoStore.clubList.length) {
        userInfoStore.setClubList(cached)
        forwardUserClubToCocos({ code: 0, message: '', data: cached })
      }
    } catch (error) {
      console.warn('[post-auth-sync] hydrate club list cache failed:', error)
    }
  }

  const userInfoSync = getUserInfoApi()
    .then((userInfo) => {
      if (gameStore.sessionToken.trim() !== token) {
        return false
      }
      const user = userInfo.user as Record<string, unknown>
      const userId = String(user.p_u_id ?? user.pUid ?? user.userid ?? user.un_id ?? '')
      const userName = String(user.nickname ?? gameStore.loginAccount ?? '')

      gameStore.setLoginUser({
        account: gameStore.loginAccount || userName,
        nickname: userName,
        userId,
      })
      const languageCode = resolveLanguageCode(user)
      const localSavedLanguage = localStore.getItem<string>(StorageKey.Language, '')
      if (!localSavedLanguage && languageCode) {
        setLocale(languageCode as LocaleCode)
      }
      return true
    })
    .catch((error) => {
      console.warn('[post-auth-sync] sync user info failed:', error)
      return false
    })

  const userClubSync = getUserClubApi()
    .then(() => gameStore.sessionToken.trim() === token)
    .catch((error) => {
      console.warn('[post-auth-sync] sync user club failed:', error)
      return false
    })

  // 配置和多语言不参与身份确认，后台刷新即可；登录弹窗只等待用户、俱乐部和 WS。
  void Promise.allSettled([
    postGlobalConfigApi({})
      .then((res) => {
        if (res.code === 0 && res.data) {
          appConfigStore.setGlobalConfig(res.data)
          forwardGlobalConfigToCocos(res.data)
        }
      })
      .catch((error) => {
        console.warn('[post-auth-sync] sync global config failed:', error)
      }),

    postDiamondConfigApi({})
      .then((res) => {
        if (res.code === 0 && res.data) {
          appConfigStore.setDiamondConfig(res.data)
          forwardDiamondConfigToCocos(appConfigStore.diamondConfig)
        }
      })
      .catch((error) => {
        console.warn('[post-auth-sync] sync diamond config failed:', error)
      }),

    ensureMultiLanguageTemplateLoaded().catch((error) => {
      console.warn('[post-auth-sync] sync multi-language template failed:', error)
    }),
  ])

  const [userInfoSynced, userClubSynced] = await Promise.all([userInfoSync, userClubSync])
  if (userInfoSynced && userClubSynced && gameStore.sessionToken.trim() === token) {
    gameStore.markIdentitySynced(token)
  }
  return { userInfoSynced, userClubSynced }
}

function resolveLanguageCode(user: Record<string, unknown>): string {
  const languageKeys = ['language', 'client_language', 'system_language', 'lt']
  for (const key of languageKeys) {
    const value = user[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

import { postDiamondConfigApi, postGlobalConfigApi } from '@/api/config'
import { getUserClubApi, getUserInfoApi } from '@/api/user'
import {
  forwardDiamondConfigToCocos,
  forwardGlobalConfigToCocos,
} from '@/bridge/sync/h5BusinessSync'
import StorageKey from '@/constants/storageKey'
import { setLocale, type LocaleCode } from '@/i18n'
import LoginSession from '@/session/loginSession'
import { useAppConfigStore } from '@/stores/appConfig'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/stores/pinia'
import { localStore } from '@/utils/localStore'
import { ensureMultiLanguageTemplateLoaded } from '@/utils/multiLanguageTemplate'

let inFlightToken = ''
let inFlightPromise: Promise<void> | null = null

// 登录成功 / 启动时持有有效 token 都走这里：把首页无关的拉取/同步集中起来，避免必须切到首页才触发。
export function syncPostAuthData(): void {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken.trim()
  if (!token) {
    return
  }

  // WS 保活独立于资料同步：同一 token 已同步过时，仍允许刷新/路由切换兜底恢复 WS。
  void LoginSession.EnsureWS().catch((error) => {
    console.warn('[post-auth-sync] ensure ws failed:', error)
  })

  if (!gameStore.shouldSyncProfile(token)) {
    return
  }

  if (inFlightPromise && inFlightToken === token) {
    return
  }

  inFlightToken = token
  inFlightPromise = runPostAuthSync(token).finally(() => {
    if (inFlightToken === token) {
      inFlightToken = ''
      inFlightPromise = null
    }
  })
}

async function runPostAuthSync(token: string): Promise<void> {
  const gameStore = useGameStore(pinia)
  const appConfigStore = useAppConfigStore(pinia)

  await Promise.allSettled([
    getUserInfoApi()
      .then((userInfo) => {
        const user = userInfo.user as Record<string, unknown>
        const userId = String(user.p_u_id ?? user.pUid ?? user.userid ?? user.un_id ?? '')
        const userName = String(user.nickname ?? gameStore.loginAccount ?? '')

        gameStore.setLoginUser({
          account: gameStore.loginAccount || userName,
          nickname: userName,
          userId,
        })
        gameStore.markProfileSynced(token)

        const languageCode = resolveLanguageCode(user)
        const localSavedLanguage = localStore.getItem<string>(StorageKey.Language, '')
        if (!localSavedLanguage && languageCode) {
          setLocale(languageCode as LocaleCode)
        }
      })
      .catch((error) => {
        console.warn('[post-auth-sync] sync user info failed:', error)
      }),

    getUserClubApi().catch((error) => {
      console.warn('[post-auth-sync] sync user club failed:', error)
    }),

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

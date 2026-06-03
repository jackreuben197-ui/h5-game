import { getUserClubApi, getUserInfoApi } from '@/api/user'
import { postDiamondConfigApi, postGlobalConfigApi } from '@/api/config'
import {
  forwardDiamondConfigToCocos,
  forwardGlobalConfigToCocos,
} from '@/bridge/sync/h5BusinessSync'
import StorageKey from '@/constants/storageKey'
import { setLocale } from '@/i18n'
import LoginSession from '@/session/loginSession'
import { pinia } from '@/stores/pinia'
import { useAppConfigStore } from '@/stores/appConfig'
import { useGameStore } from '@/stores/game'
import { localStore } from '@/utils/localStore'
import { ensureMultiLanguageTemplateLoaded } from '@/utils/multiLanguageTemplate'

let inFlightToken = ''
let inFlightPromise: Promise<void> | null = null

export function syncPostAuthData(): void {
  const gameStore = useGameStore(pinia)
  const token = gameStore.sessionToken.trim()
  if (!token) {
    return
  }

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
        if (!localSavedLanguage) {
          setLocale(languageCode || 'en')
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

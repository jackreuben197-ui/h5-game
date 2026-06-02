import { getUserClubApi, getUserInfoApi } from '@/api/user'
import { postDiamondConfigApi, postGlobalConfigApi } from '@/api/config'
import {
  forwardDiamondConfigToCocos,
  forwardGlobalConfigToCocos,
} from '@/bridge/sync/h5BusinessSync'
import { ensureMultiLanguageTemplateLoaded } from '@/utils/multiLanguageTemplate'
import LoginSession from '@/session/loginSession'
import { useGameStore } from '@/stores/game'
import { useAppConfigStore } from '@/stores/appConfig'
import { pinia } from '@/stores/pinia'
import { setLocale } from '@/i18n'
import type { LocaleCode } from '@/i18n'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'

// 登录成功 / 启动时持有有效 token 都走这里：把首页无关的拉取/同步集中起来，避免必须切到首页才触发。
export function syncPostAuthData(): void {
  const gameStore = useGameStore(pinia)
  const appConfigStore = useAppConfigStore(pinia)
  const token = gameStore.sessionToken.trim()
  if (!token) {
    return
  }

  // 同一 token 已同步过则跳过资料类拉取，仅确保 WS 通道在线。
  if (!gameStore.shouldSyncProfile(token)) {
    void LoginSession.EnsureWS().catch((error) => {
      console.warn('[post-auth-sync] ensure ws failed:', error)
    })
    return
  }

  void getUserInfoApi()
    .then((userInfo) => {
      const user = userInfo.user as Record<string, unknown>
      const userId = String(user.p_u_id ?? user.pUid ?? user.userid ?? '')
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
    })
    .catch((error) => {
      console.warn('[post-auth-sync] sync user info failed:', error)
    })

  void getUserClubApi().catch((error) => {
    console.warn('[post-auth-sync] sync user club failed:', error)
  })

  void postGlobalConfigApi({})
    .then((res) => {
      if (res.code === 0 && res.data) {
        appConfigStore.setGlobalConfig(res.data)
        forwardGlobalConfigToCocos(res.data)
      }
    })
    .catch((error) => {
      console.warn('[post-auth-sync] sync global config failed:', error)
    })

  void postDiamondConfigApi({})
    .then((res) => {
      if (res.code === 0 && res.data) {
        appConfigStore.setDiamondConfig(res.data)
        forwardDiamondConfigToCocos(appConfigStore.diamondConfig)
      }
    })
    .catch((error) => {
      console.warn('[post-auth-sync] sync diamond config failed:', error)
    })

  void ensureMultiLanguageTemplateLoaded().catch((error) => {
    console.warn('[post-auth-sync] sync multi-language template failed:', error)
  })

  void LoginSession.EnsureWS().catch((error) => {
    console.warn('[post-auth-sync] ensure ws failed:', error)
  })
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

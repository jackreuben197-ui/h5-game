import { computed, type ComputedRef } from 'vue'
import { useAppConfigStore } from '@/stores/appConfig'
import { useUserInfoStore } from '@/stores/userInfo'
import { isChannelPackageHost } from '@/utils/channelPackage'
import { isTelegramMiniAppEnv } from '@/utils/environment'

interface HomeAnnouncementConfig {
  h5: string
  tg: string
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// 正常情况下 globalConfig 已把 CMS str_value 展开为字符串；同时兼容接口直接
// 返回配置对象或保留 { str_value } 包装的情况，避免不同环境响应结构不一致。
function parseHomeAnnouncementConfig(raw: unknown, depth = 0): HomeAnnouncementConfig {
  if (!raw || depth > 2) {
    return { h5: '', tg: '' }
  }

  if (typeof raw === 'string') {
    const text = raw.trim()
    if (!text) return { h5: '', tg: '' }
    try {
      return parseHomeAnnouncementConfig(JSON.parse(text), depth + 1)
    } catch {
      return { h5: text, tg: '' }
    }
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { h5: '', tg: '' }
  }

  const source = raw as Record<string, unknown>
  if (source.str_value !== undefined) {
    return parseHomeAnnouncementConfig(source.str_value, depth + 1)
  }

  return {
    h5: toText(source.h5),
    tg: toText(source.tg),
  }
}

export function useHomeAnnouncement(): {
  noticeText: ComputedRef<string>
  ensureHomeAnnouncementConfig: () => Promise<void>
} {
  const appConfigStore = useAppConfigStore()
  const userInfoStore = useUserInfoStore()
  const isChannelPackage = isChannelPackageHost()

  const platformAnnouncement = computed(() =>
    parseHomeAnnouncementConfig(appConfigStore.globalConfig?.home_announcement_config),
  )

  const channelClubAnnouncement = computed(() => {
    return (
      toText(userInfoStore.currentJoinedClub?.announcement) ||
      toText(userInfoStore.channelDefaultClub?.announcement)
    )
  })

  const noticeText = computed(() => {
    if (isChannelPackage) {
      return channelClubAnnouncement.value || platformAnnouncement.value.h5
    }
    return isTelegramMiniAppEnv()
      ? platformAnnouncement.value.tg
      : platformAnnouncement.value.h5
  })

  async function ensureHomeAnnouncementConfig(): Promise<void> {
    if (appConfigStore.globalConfig) return
    await appConfigStore.ensureGuestGlobalConfig()
  }

  return { noticeText, ensureHomeAnnouncementConfig }
}

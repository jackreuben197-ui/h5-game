import { defineStore } from 'pinia'
import type { UserInfoData, UserInfoUser } from '@/api/models/user'
import type { OrgClubSearchInfoData, OrgClubData } from '@/api/models/org'
import { postOrgClubDefaultApi } from '@/api/org'
import StorageKey from '@/constants/storageKey'
import { dzpkPersistStorage } from '@/utils/localStore'
import {
  CHANNEL_MAIN_DOMAIN,
  copyStorageToMainDomain,
  extractInviteCodeFromSubdomain,
  isChannelPackageHost,
  resolveInviteCode,
} from '@/utils/channelPackage'

export type ClubInfo = OrgClubData

interface UserInfoState {
  userInfo: UserInfoData | null
  clubList: ClubInfo[]
  channelDefaultClub: ClubInfo | null
  currentClubId: string
  clubAgentInvitations: Record<string, string>
}

function normalizeClubId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function resolveSafariBaseUrl(hostname: string): string {
  const normalizedHostname = hostname.trim().toLowerCase()
  if (!normalizedHostname || normalizedHostname === CHANNEL_MAIN_DOMAIN) {
    return ''
  }
  return normalizedHostname
}

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function normalizeDefaultClub(club: OrgClubSearchInfoData | undefined): ClubInfo | null {
  if (!club) {
    return null
  }
  const clubId = toSafeInt(club.club_id)
  if (clubId <= 0) {
    return null
  }
  return {
    ...club,
    club_id: clubId,
    club_name: String(club.club_name || ''),
    logo: String(club.logo || ''),
    safari_icon_url: String(club.safari_icon_url || ''),
    safari_label: String(club.safari_label || ''),
    safari_base_url: String(club.safari_base_url || ''),
    room_logo: String(club.room_logo || ''),
    banner: String(club.banner || ''),
    random_id: toSafeInt(club.random_id),
    support_im_rid: String(club.support_im_rid || ''),
    club_members: toSafeInt((club as Record<string, unknown>).club_members),
  }
}

// 当前 SPA 会话内的去重缓存，刷新页面后重置；与持久化的 channelDefaultClub 配合：
// - 已 loaded 直接返回 store 中的值
// - 有 in-flight 请求时并发调用共享同一个 promise
let channelDefaultClubLoaded = false
let channelDefaultClubInFlight: Promise<ClubInfo | null> | null = null

export const useUserInfoStore = defineStore('h5-userInfo-store', {
  state: (): UserInfoState => ({
    userInfo: null,
    clubList: [],
    channelDefaultClub: null,
    currentClubId: '',
    clubAgentInvitations: {},
  }),
  getters: {
    currentJoinedClub(state): ClubInfo | null {
      if (!state.currentClubId) {
        return null
      }
      return (
        state.clubList.find((club) => normalizeClubId(club.club_id) === state.currentClubId) || null
      )
    },
    currentClub(state): ClubInfo | null {
      if (!state.currentClubId) {
        return null
      }
      return (
        state.clubList.find((club) => normalizeClubId(club.club_id) === state.currentClubId) || null
      )
    },
  },
  actions: {
    setUserInfo(userInfo: UserInfoData | null): void {
      this.userInfo = userInfo
    },
    syncUserFields(fields: Partial<UserInfoUser>): boolean {
      if (!this.userInfo?.user) {
        return false
      }

      this.userInfo = {
        ...this.userInfo,
        user: {
          ...this.userInfo.user,
          ...fields,
        },
      }
      return true
    },
    setClubList(list: ClubInfo[]): void {
      const normalized = (Array.isArray(list) ? list : []).filter(
        (club): club is ClubInfo =>
          Boolean(club) &&
          typeof club === 'object' &&
          normalizeClubId((club as ClubInfo).club_id) !== '',
      )

      this.clubList = normalized

      const subDomainInviteCode = resolveInviteCode()
      // 独立自定义域名没有邀请码前缀，必须用 default 接口返回的 club_id 固定当前俱乐部。
      // 否则登录/体验账号的俱乐部列表会默认选中第一项，把页面重新渲染成官方包。
      if (!subDomainInviteCode && isChannelPackageHost()) {
        const channelClubId = normalizeClubId(this.channelDefaultClub?.club_id)
        if (channelClubId) {
          const targetClub = normalized.find(
            (item) => normalizeClubId(item.club_id) === channelClubId,
          )
          if (targetClub) {
            this.channelDefaultClub = {
              ...this.channelDefaultClub,
              ...targetClub,
              diamond_room_switch:
                targetClub.diamond_room_switch ?? this.channelDefaultClub?.diamond_room_switch,
              h5_menu: targetClub.h5_menu ?? this.channelDefaultClub?.h5_menu,
            }
            channelDefaultClubLoaded = true
            this.currentClubId = channelClubId
          } else {
            // 未加入自定义域名对应的俱乐部时，保留公开俱乐部配置用于游客页面，
            // 但不能选中账号名下的其他俱乐部。
            this.currentClubId = ''
          }
          return
        }
      }

      if (subDomainInviteCode) {
        const targetClub = normalized.find(
          (item) => item.invitation_code?.toLowerCase() === subDomainInviteCode.toLowerCase(),
        )
        if (targetClub) {
          // 用户俱乐部接口不保证返回渠道 CMS 配置字段；保留 default 接口的公开配置，
          // 再用登录用户的俱乐部资料刷新成员态字段。
          this.channelDefaultClub = {
            ...this.channelDefaultClub,
            ...targetClub,
            diamond_room_switch:
              targetClub.diamond_room_switch ?? this.channelDefaultClub?.diamond_room_switch,
            h5_menu: targetClub.h5_menu ?? this.channelDefaultClub?.h5_menu,
          }
          channelDefaultClubLoaded = true
          this.currentClubId = normalizeClubId(targetClub.club_id)
          return
        } else {
          this.currentClubId = ''
          copyStorageToMainDomain()
          return
        }
      }

      if (!normalized.length) {
        this.currentClubId = ''
        return
      }

      const currentExists = normalized.some(
        (club) => normalizeClubId(club.club_id) === this.currentClubId,
      )
      if (currentExists) {
        return
      }

      // 默认选中第一个俱乐部。
      this.currentClubId = normalizeClubId(normalized[0].club_id)
    },
    setChannelDefaultClub(club: ClubInfo | null): void {
      this.channelDefaultClub = club
    },
    async ensureChannelDefaultClub(): Promise<ClubInfo | null> {
      if (channelDefaultClubLoaded) {
        return this.channelDefaultClub
      }
      if (channelDefaultClubInFlight) {
        return channelDefaultClubInFlight
      }

      const hostname =
        typeof window === 'undefined' ? '' : window.location.hostname.trim().toLowerCase()
      // 普通本地开发无需请求渠道俱乐部；但渠道包模拟同样运行在 localhost
      // （Cocos 预览通常是 :7456），此时必须按测试邀请码正常初始化。
      if (hostname === 'localhost' && !isChannelPackageHost(hostname)) return null
      // 旧渠道域名 xxx.{CHANNEL_MAIN_DOMAIN} 必须继续按邀请码查询，不能当成自定义域名。
      const channelInviteCode = extractInviteCodeFromSubdomain(hostname)
      const baseUrl = channelInviteCode ? '' : resolveSafariBaseUrl(hostname)
      const inviteCode = channelInviteCode || (baseUrl ? '' : resolveInviteCode(hostname))
      const payload = baseUrl
        ? { base_url: baseUrl }
        : inviteCode
          ? { invite_code: inviteCode }
          : {}

      channelDefaultClubInFlight = (async () => {
        try {
          const response = await postOrgClubDefaultApi(payload)
          if (Number(response.code) !== 0) {
            throw new Error(String(response.msg || '渠道俱乐部加载失败'))
          }
          const club = normalizeDefaultClub(response.data?.club)
          const responseH5Menu = Number(response.data?.h5_menu)
          if (club && club.h5_menu === undefined && Number.isFinite(responseH5Menu)) {
            club.h5_menu = responseH5Menu
          }
          if (club && club.diamond_room_switch === undefined) {
            club.diamond_room_switch = Number(response.data?.diamond_room_switch) === 1 ? 1 : 2
          }
          this.channelDefaultClub = club
          channelDefaultClubLoaded = true
          return club
        } catch (error) {
          console.warn('[userInfo] ensureChannelDefaultClub failed:', error)
          // 刷新时可能已从持久化状态恢复出有效渠道配置；网络抖动不能把名称、
          // Banner scope 和 h5_menu 一起清空。loaded 保持 false，后续调用仍可重试。
          return this.channelDefaultClub
        } finally {
          channelDefaultClubInFlight = null
        }
      })()

      return channelDefaultClubInFlight
    },
    setCurrentClubById(clubId: number | string): boolean {
      const targetId = normalizeClubId(clubId)
      if (!targetId) {
        return false
      }

      const exists = this.clubList.some((club) => normalizeClubId(club.club_id) === targetId)
      if (!exists) {
        return false
      }

      this.currentClubId = targetId
      return true
    },
    setCurrentClub(club: ClubInfo | null): boolean {
      if (!club || club.club_id === undefined || club.club_id === null) {
        return false
      }
      return this.setCurrentClubById(club.club_id)
    },
    syncCurrentClubFields(fields: Partial<ClubInfo>): boolean {
      if (!this.currentClubId || !fields || typeof fields !== 'object') {
        return false
      }

      const index = this.clubList.findIndex(
        (club) => normalizeClubId(club.club_id) === this.currentClubId,
      )
      if (index < 0) {
        return false
      }

      const nextClub: ClubInfo = {
        ...this.clubList[index],
        ...fields,
      }
      const nextList = [...this.clubList]
      nextList[index] = nextClub
      this.clubList = nextList
      return true
    },
    syncCurrentClubDiamond(diamond: number): boolean {
      if (!this.currentClubId || !Number.isFinite(diamond)) {
        return false
      }

      const normalized = Math.max(0, Number(diamond))
      return this.syncCurrentClubFields({
        user_gold: normalized,
        diamonds: normalized,
      })
    },
    syncUserDiamond(diamond: number): boolean {
      if (!this.userInfo?.user || !Number.isFinite(diamond)) {
        return false
      }

      this.userInfo = {
        ...this.userInfo,
        user: {
          ...this.userInfo.user,
          diamonds: Math.max(0, Number(diamond)),
        },
      }
      return true
    },
    clearInfo(): void {
      this.userInfo = null
      this.clubList = []
      this.channelDefaultClub = null
      this.currentClubId = ''
      this.clubAgentInvitations = {}
      channelDefaultClubLoaded = false
      channelDefaultClubInFlight = null
    },
    clearPrivateInfo(): void {
      // 游客预览仍需保留渠道俱乐部的公开资料，只清真实账号维度的数据。
      this.userInfo = null
      this.clubList = []
      this.currentClubId = ''
      this.clubAgentInvitations = {}
    },
    setClubAgentInvitation(clubRandomId: number | string | null | undefined, link: string): void {
      const cacheKey = normalizeClubId(clubRandomId)
      if (!cacheKey) {
        return
      }

      const normalized = (link || '').trim()
      if (!normalized) {
        delete this.clubAgentInvitations[cacheKey]
        return
      }

      this.clubAgentInvitations[cacheKey] = normalized
    },
    getClubAgentInvitation(clubRandomId: number | string | null | undefined): string {
      const cacheKey = normalizeClubId(clubRandomId)
      if (!cacheKey) {
        return ''
      }

      return this.clubAgentInvitations[cacheKey] || ''
    },
    syncCurrentClubDesc(desc: string): boolean {
      if (!this.currentClubId || typeof desc !== 'string') {
        return false
      }

      const normalized = desc.trim()
      return this.syncCurrentClubFields({
        desc: normalized,
      })
    },
  },
  persist: {
    key: StorageKey.USER_DATA,
    storage: dzpkPersistStorage,
    pick: ['userInfo', 'clubList', 'channelDefaultClub', 'currentClubId', 'clubAgentInvitations'],
  },
})

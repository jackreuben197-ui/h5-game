import { defineStore } from 'pinia'
import type { UserInfoData, UserInfoUser } from '@/api/models/user'
import type { OrgClubSearchInfoData, OrgClubData } from '@/api/models/org'
import { postOrgClubDefaultApi } from '@/api/org'
import StorageKey from '@/constants/storageKey'
import { dzpkPersistStorage } from '@/utils/localStore'
import { resolveInviteCode } from '@/utils/channelPackage'
import { copyStorageToMainDomain } from '@/utils/channelPackage'
import { resolveTelegramClubRandomId } from '@/utils/telegramStartParam'

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
      if (subDomainInviteCode) {
        const targetClub = normalized.find(
          (item) => item.invitation_code?.toLowerCase() === subDomainInviteCode.toLowerCase(),
        )
        if (targetClub) {
          // 登录后以用户俱乐部列表中的渠道俱乐部刷新游客态数据。
          // 不能清成 null：ensureChannelDefaultClub 可能已标记 loaded，随后会一直返回 null，
          // 导致首页拿不到渠道 club_id，从而跳过 /misc/banner/list。
          this.channelDefaultClub = targetClub
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

      // Channel subdomain / Telegram club_<code> links resolve to an invite_code; Telegram
      // game links (login_/home_<roomId>_<clubRandomId>) resolve to a club random id. Both
      // select the same private-domain club via /org/club/default.
      const inviteCode = resolveInviteCode()
      const clubRandomId = Number(resolveTelegramClubRandomId())
      const payload = inviteCode
        ? { invite_code: inviteCode }
        : clubRandomId
          ? { random_id: clubRandomId }
          : {}

      channelDefaultClubInFlight = (async () => {
        try {
          const response = await postOrgClubDefaultApi(payload)
          if (Number(response.code) !== 0) {
            throw new Error(String(response.msg || '渠道俱乐部加载失败'))
          }
          const club = normalizeDefaultClub(response.data?.club)
          this.channelDefaultClub = club
          channelDefaultClubLoaded = true
          return club
        } catch (error) {
          console.warn('[userInfo] ensureChannelDefaultClub failed:', error)
          this.channelDefaultClub = null
          return null
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

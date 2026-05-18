import { defineStore } from 'pinia'
import type { UserInfoData } from '@/api/models/user'
import type { OrgClubData } from '@/api/models/org'
import StorageKey from '@/constants/storageKey'
import { dzpkPersistStorage } from '@/utils/localStore'

export type ClubInfo = OrgClubData

interface UserInfoState {
  userInfo: UserInfoData | null
  clubList: ClubInfo[]
  currentClubId: string
  clubAgentInvitations: Record<string, string>
}

function normalizeClubId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

export const useUserInfoStore = defineStore('h5-userInfo-store', {
  state: (): UserInfoState => ({
    userInfo: null,
    clubList: [],
    currentClubId: '',
    clubAgentInvitations: {},
  }),
  getters: {
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
    setClubList(list: ClubInfo[]): void {
      const normalized = (Array.isArray(list) ? list : []).filter(
        (club): club is ClubInfo =>
          Boolean(club) && typeof club === 'object' && normalizeClubId((club as ClubInfo).club_id) !== '',
      )

      this.clubList = normalized

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
      //测试默认选择竞技场俱乐部
      const tatget = normalized.find((item) => item.club_id == 49)
      if (tatget){
        this.currentClubId = normalizeClubId(tatget.club_id)
        return
      }
      this.currentClubId = normalizeClubId(normalized[0].club_id)
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
    clearInfo(): void {
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
    pick: ['userInfo', 'clubList', 'currentClubId', 'clubAgentInvitations'],
  },
})

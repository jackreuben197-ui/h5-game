import { defineStore } from 'pinia'
import type { UserInfoData } from '@/api/models/auth'
import StorageKey from '@/constants/storageKey'
import { dzpkPersistStorage } from '@/utils/localStore'

export interface ClubInfo {
  club_id: number | string
  club_name?: string
  [key: string]: unknown
}

interface UserInfoState {
  userInfo: UserInfoData | null
  clubList: ClubInfo[]
  currentClubId: string
}

function normalizeClubId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

export const useUserInfoStore = defineStore('h5-userInfo-store', {
  state: (): UserInfoState => ({
    userInfo: null,
    clubList: [],
    currentClubId: '',
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
      if (!club) {
        return false
      }
      return this.setCurrentClubById(club.club_id)
    },
    clearInfo(): void {
      this.userInfo = null
      this.clubList = []
      this.currentClubId = ''
    },
  },
  persist: {
    key: StorageKey.USER_DATA,
    storage: dzpkPersistStorage,
    pick: ['userInfo', 'clubList', 'currentClubId'],
  },
})

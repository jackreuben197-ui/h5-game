import { pinia } from '@/stores/pinia'
import { useUserInfoStore } from '@/stores/userInfo'

export interface OpenGlobalCustomerServiceChatPayload {
  imServiceType?: number
  clubId?: number
  tribeId?: number
  supportUserId?: number
}

type GlobalCustomerServiceChatListener = (
  payload: OpenGlobalCustomerServiceChatPayload,
) => void

const listeners = new Set<GlobalCustomerServiceChatListener>()

const OFFICIAL_IM_SERVICE_TYPE = 2

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.floor(num)
}

function hasClubSupportService(club: unknown): boolean {
  if (!club || typeof club !== 'object') return false
  const raw = (club as Record<string, unknown>).support_im_rid
  if (raw === undefined || raw === null) return false

  const text = String(raw).trim()
  if (!text) return false

  const num = Number(text)
  if (Number.isFinite(num)) return num > 0
  return true
}

function preprocessOpenPayload(
  payload: OpenGlobalCustomerServiceChatPayload,
): OpenGlobalCustomerServiceChatPayload {
  const normalized: OpenGlobalCustomerServiceChatPayload = {
    imServiceType: toSafeInt(payload.imServiceType),
    clubId: toSafeInt(payload.clubId),
    tribeId: toSafeInt(payload.tribeId),
    supportUserId: toSafeInt(payload.supportUserId),
  }

  const clubId = Number(normalized.clubId || 0)
  if (clubId <= 0) {
    normalized.imServiceType = OFFICIAL_IM_SERVICE_TYPE
    return normalized
  }

  const userInfoStore = useUserInfoStore(pinia)
  const matchedClub = userInfoStore.clubList.find((club) => Number(club.club_id || 0) === clubId)
  if (!hasClubSupportService(matchedClub)) {
    normalized.imServiceType = OFFICIAL_IM_SERVICE_TYPE
  }

  return normalized
}

export function openGlobalCustomerServiceChat(
  payload: OpenGlobalCustomerServiceChatPayload = {},
): void {
  const normalized = preprocessOpenPayload(payload)
  listeners.forEach((listener) => {
    listener(normalized)
  })
}

export function subscribeGlobalCustomerServiceChat(
  listener: GlobalCustomerServiceChatListener,
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

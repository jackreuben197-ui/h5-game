import type { StatsUserGameRecordListRecord, StatsUserGameRecordListRoom_record } from '@/api/models/stats'

const STORAGE_KEY = 'mine:hand-replay:selected'

export interface HandReplaySessionPayload {
  handId: string
  roomRecord?: StatsUserGameRecordListRoom_record
  handRecord: StatsUserGameRecordListRecord
}

let memoryPayload: HandReplaySessionPayload | null = null

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function setHandReplaySession(payload: HandReplaySessionPayload): void {
  memoryPayload = payload
  if (!canUseSessionStorage()) return
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function getHandReplaySession(handId?: string): HandReplaySessionPayload | null {
  if (memoryPayload && (!handId || memoryPayload.handId === handId)) {
    return memoryPayload
  }

  if (!canUseSessionStorage()) return null
  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as HandReplaySessionPayload
    if (parsed && typeof parsed.handId === 'string') {
      if (!handId || parsed.handId === handId) {
        memoryPayload = parsed
        return parsed
      }
    }
  } catch {
    return null
  }

  return null
}

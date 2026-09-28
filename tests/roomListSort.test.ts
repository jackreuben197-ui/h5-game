import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import type { RoomRecord } from '../src/api/models/roomcenter.ts'

const timeMockUrl = `data:text/javascript,${encodeURIComponent(`
  export function toTimestampMs(value) {
    if (typeof value === 'number') return value > 1e12 ? value : value * 1000;
    const parsed = Date.parse(String(value || ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
`)}`

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/utils/time') {
      return { url: timeMockUrl, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
const {
  isRoomParticipated,
  sortRoomRecordsForDisplay,
} = await import('../src/utils/roomListSort.ts')
hooks.deregister()

function room(
  rid: number,
  participated: number | string,
  emptySeat: number,
  createTime: string,
): RoomRecord {
  return {
    rid,
    game_type: 0,
    poker_type: 0,
    sb: 100,
    seat_count: 9,
    empty_seat: emptySeat,
    create_time: createTime,
    participation_status: participated as number,
  }
}

test('participation status accepts the numeric string returned by some room APIs', () => {
  assert.equal(isRoomParticipated(room(1, '1', 3, '2026-01-01T00:00:00Z')), true)
})

test('room order keeps participated/open, new/open, participated/full, other/full tiers', () => {
  const records = [
    room(4, 0, 0, '2026-04-01T00:00:00Z'),
    room(2, 0, 3, '2026-02-01T00:00:00Z'),
    room(3, 1, 0, '2026-03-01T00:00:00Z'),
    room(1, 1, 3, '2026-01-01T00:00:00Z'),
  ]

  assert.deepEqual(sortRoomRecordsForDisplay(records).map((item) => item.rid), [1, 2, 3, 4])
})

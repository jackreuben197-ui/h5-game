import assert from 'node:assert/strict'
import test from 'node:test'
import type { RoomRecord } from '../src/api/models/roomcenter.ts'
import { getRoomPlayerCount } from '../src/utils/roomVisibility.ts'

test('room users override stale guest roomers count', () => {
  const room = {
    roomers: 11,
    users: [{}, {}],
  } as RoomRecord

  assert.equal(getRoomPlayerCount(room), 2)
})

test('an explicit empty users list is treated as an empty table', () => {
  const room = {
    roomers: 11,
    users: [],
  } as RoomRecord

  assert.equal(getRoomPlayerCount(room), 0)
})

test('roomers remains the fallback when room detail users are absent', () => {
  assert.equal(getRoomPlayerCount({ roomers: 2 } as RoomRecord), 2)
  assert.equal(getRoomPlayerCount({ roomers: -1 } as RoomRecord), 0)
})

test('seat occupancy wins over roomers when the room reports seats', () => {
  assert.equal(getRoomPlayerCount({ roomers: 0, seat_count: 9, empty_seat: 6 } as RoomRecord), 3)
  assert.equal(getRoomPlayerCount({ roomers: 11, seat_count: 6, empty_seat: 6 } as RoomRecord), 0)
})

test('roomers still wins when seat data is incomplete', () => {
  assert.equal(getRoomPlayerCount({ roomers: 4, seat_count: 0, empty_seat: 0 } as RoomRecord), 4)
  assert.equal(getRoomPlayerCount({ roomers: 4, seat_count: 9 } as RoomRecord), 4)
})

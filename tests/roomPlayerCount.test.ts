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

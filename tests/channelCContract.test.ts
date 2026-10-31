import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mttDisplayPatch,
  promoteRoomDisplayFields,
  readMttDisplayFields,
  readRoomDisplayFields,
  roomDisplayPatch,
} from '../src/utils/lobbyDisplayFields.ts'
import { mergeMttListPage, reconcileMttListResponse } from '../src/utils/mttListMerge.ts'
import {
  buildPlayerInvitationUrl,
  normalizeInviterRandomId,
  withPlayerInviter,
} from '../src/utils/playerInvitation.ts'

test('room config preserves all existing settings while promoting new scalars to the body', () => {
  const request = {
    name: 'existing template',
    room_config: {
      sb: 100,
      seat_count: 8,
      is_top: 1,
      room_intro: '经典德州',
      room_features: '欢乐竞技',
    },
  }
  assert.deepEqual(promoteRoomDisplayFields(request), {
    name: 'existing template',
    room_config: { sb: 100, seat_count: 8 },
    is_top: 1,
    room_intro: '经典德州',
    room_features: '欢乐竞技',
  })
  assert.equal(request.room_config.is_top, 1)
  assert.deepEqual(
    promoteRoomDisplayFields({ ...request, is_top: 0, room_intro: '', room_features: '' }),
    {
      name: 'existing template',
      room_config: { sb: 100, seat_count: 8 },
      is_top: 0,
      room_intro: '',
      room_features: '',
    },
  )
})

test('new protocol default values remove recommendation and clear room text and C images', () => {
  const room = { is_top: 1, room_intro: 'old intro', room_features: 'old features' }
  const roomPatch = readRoomDisplayFields({
    getIsTop: () => 0,
    getRoomIntro: () => '',
    getRoomFeatures: () => '',
  })
  assert.deepEqual(
    { ...room, ...roomDisplayPatch(roomPatch) },
    { is_top: 0, room_intro: '', room_features: '' },
  )
  const mtt = { is_top: 1, mtt_banner_url_c: 'old-c.png', mtt_banner_url: 'ab.png' }
  const mttPatch = readMttDisplayFields({ getIsTop: () => 0, getMttBannerUrlC: () => '' })
  assert.deepEqual(
    { ...mtt, ...mttDisplayPatch(mttPatch) },
    { is_top: 0, mtt_banner_url_c: '', mtt_banner_url: 'ab.png' },
  )
})

test('older protocol without new getters leaves the HTTP configuration intact', () => {
  assert.deepEqual(readRoomDisplayFields({}), {})
  assert.deepEqual(readMttDisplayFields({}), {})
  assert.deepEqual(roomDisplayPatch({ is_top: undefined, room_intro: undefined }), {})
})

test('MTT HTTP response combines full records and changed records without losing zero or empty values', () => {
  const cached = [
    { match_id: 1, is_top: 1, mtt_banner_url_c: 'old-c.png', name: 'cached', apply_fee_pool: 100 },
    { match_id: 2, is_top: 1, mtt_banner_url_c: 'cached-c.png' },
  ]
  const result = mergeMttListPage(
    [{ match_id: 2, name: 'new snapshot', is_top: 1, mtt_banner_url_c: 'new-c.png' }],
    [
      { match_id: 1, is_top: 0, mtt_banner_url_c: '' },
      { match_id: 2, is_top: 0 },
    ],
    cached,
  )
  assert.deepEqual(
    result.find((record) => record.match_id === 1),
    {
      match_id: 1,
      is_top: 0,
      mtt_banner_url_c: '',
      name: 'cached',
      apply_fee_pool: 100,
    },
  )
  assert.equal(result.find((record) => record.match_id === 2)?.mtt_banner_url_c, 'new-c.png')
  assert.equal(result.find((record) => record.match_id === 2)?.is_top, 0)
  assert.equal(cached[0]?.is_top, 1)
})

test('player invitation passes the existing random id only together with a target club code', () => {
  assert.deepEqual(withPlayerInviter({ invite_code: 'club-code', email: 'a@b.com' }, '123456'), {
    invite_code: 'club-code',
    email: 'a@b.com',
    inviter_random_id: 123456,
  })
  assert.deepEqual(withPlayerInviter({ invite_code: '' }, 123456), { invite_code: '' })
  assert.deepEqual(withPlayerInviter({ invite_code: 'club-code' }, 0), { invite_code: 'club-code' })
  for (const invalid of ['-1', '1.5', '1e5', 'abc', true, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(normalizeInviterRandomId(invalid), undefined)
  }
})

test('player invite URLs include both values on custom domains and preserve existing query params', () => {
  const url = new URL(
    buildPlayerInvitationUrl('https://club.example/#/?source=qr', 'club-code', 123456),
  )
  const params = new URLSearchParams(url.hash.split('?')[1])
  assert.equal(url.hostname, 'club.example')
  assert.equal(params.get('source'), 'qr')
  assert.equal(params.get('invite_code'), 'club-code')
  assert.equal(params.get('random_id'), '123456')
  assert.equal(params.has('inviter_random_id'), false)
  assert.equal(params.get('mode'), 'register')
  assert.equal(params.has('i'), false)
})


test('full list snapshots retain updates, additions and removals received during the request', () => {
  const original = [{ match_id: 1, participants: 0 }, { match_id: 2, participants: 0 }, { match_id: 3, participants: 0 }]
  const latest = [{ ...original[0], participants: 7 }, original[2], { match_id: 4, participants: 2 }]
  const result = reconcileMttListResponse(
    [{ match_id: 1, participants: 0 }, { match_id: 2, participants: 0 }, { match_id: 3, participants: 5 }],
    original,
    latest,
  )
  assert.deepEqual(result, [{ match_id: 1, participants: 7 }, { match_id: 3, participants: 5 }, { match_id: 4, participants: 2 }])
})

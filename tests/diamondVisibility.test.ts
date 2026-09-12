import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { checkIsShowForClubAndTribe } from '../src/utils/roomVisibility.ts'
import type { RoomRecord, MttListRecord } from '../src/api/models/roomcenter.ts'

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/utils/roomVisibility') {
      return nextResolve(new URL('../src/utils/roomVisibility.ts', import.meta.url).href, context)
    }
    return nextResolve(specifier, context)
  },
})
const { isMttRecordVisible } = await import('../src/utils/mttVisibility.ts')
hooks.deregister()

const room = { origin_type: 1, gold_type: 4 } as RoomRecord
const mtt = { origin_type: 1, gold_type: 4, game_type: 1 } as MttListRecord

for (const clubId of [0, 123]) {
  for (const enabled of [false, true]) {
    test(`channel diamond visibility club=${clubId} enabled=${enabled}`, () => {
      assert.equal(checkIsShowForClubAndTribe(room, clubId, 456, true, enabled), enabled)
      for (const globalMttSwitch of [false, true]) {
        assert.equal(isMttRecordVisible(mtt, undefined, clubId, 456, globalMttSwitch, enabled), globalMttSwitch && enabled)
      }
    })
  }
}

test('official package retains existing room and MTT rules', () => {
  assert.equal(checkIsShowForClubAndTribe(room, 123, 456), true)
  assert.equal(isMttRecordVisible(mtt, undefined, 123, 456, false), false)
  assert.equal(isMttRecordVisible(mtt, undefined, 123, 456, true), true)
})

test('channel switch does not affect non-diamond platform content or club relations', () => {
  for (const enabled of [false, true]) {
    assert.equal(checkIsShowForClubAndTribe({ ...room, gold_type: 1 }, 123, 456, true, enabled), true)
    assert.equal(isMttRecordVisible({ ...mtt, gold_type: 1 }, undefined, 123, 456, false, enabled), false)
    assert.equal(checkIsShowForClubAndTribe({ ...room, origin_type: 3, relate_club_ids: [123] }, 123, 456, true, enabled), true)
    assert.equal(checkIsShowForClubAndTribe({ ...room, origin_type: 3, relate_club_ids: [999] }, 123, 456, true, enabled), false)
  }
})

test('MTT metadata supplies origin and currency; mahjong stays hidden', () => {
  assert.equal(isMttRecordVisible({ ...mtt, origin_type: undefined, gold_type: undefined }, { origin_type: 1, gold_type: 4 }, 123, 456, true, false), false)
  assert.equal(isMttRecordVisible({ ...mtt, game_type: 6 }, undefined, 123, 456, true, true), false)
})

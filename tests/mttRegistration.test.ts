import assert from 'node:assert/strict'
import test from 'node:test'
import { isMttRegistered } from '../src/utils/mttRegistration.ts'

test('positive mtt_buy marks the player as registered', () => {
  assert.equal(isMttRegistered({ mtt_buy: 1 }), true)
  assert.equal(isMttRegistered({ mtt_buy: '2' }), true)
})

test('missing, zero, and invalid mtt_buy are not registered', () => {
  assert.equal(isMttRegistered({}), false)
  assert.equal(isMttRegistered({ mtt_buy: 0 }), false)
  assert.equal(isMttRegistered({ mtt_buy: 'invalid' }), false)
})

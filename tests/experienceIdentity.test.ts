import assert from 'node:assert/strict'
import test from 'node:test'
import { isExperienceUserInfo } from '../src/session/experienceIdentity.ts'

test('detects the documented user_type=6 experience account', () => {
  assert.equal(isExperienceUserInfo({ user: { user_type: 6 } }), true)
})

test('detects the current test environment ut=6 response', () => {
  assert.equal(isExperienceUserInfo({ user: { user_type: 0, ut: 6 } }), true)
})

test('does not classify a real account as experience', () => {
  assert.equal(isExperienceUserInfo({ user: { user_type: 0, ut: 1 } }), false)
})

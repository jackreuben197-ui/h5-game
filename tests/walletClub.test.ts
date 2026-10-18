import assert from 'node:assert/strict'
import test from 'node:test'
import {
  resolveWalletClub,
  resolveWalletClubGold,
  resolveWalletClubId,
} from '../src/utils/walletClub.ts'

const clubs = [
  { club_id: 38, club_name: 'First', user_gold: 6_943_390 },
  { club_id: 72, club_name: 'Second', user_gold: 12_345 },
]

test('wallet balance follows the selected /user_club record', () => {
  const club = resolveWalletClub(clubs, 72, null)

  assert.equal(club, clubs[1])
  assert.equal(resolveWalletClubId(club), 72)
  assert.equal(resolveWalletClubGold(club), 12_345)
})

test('directed wallet club takes precedence over the globally selected club', () => {
  assert.equal(resolveWalletClub(clubs, 72, null, '38'), clubs[0])
  assert.equal(resolveWalletClub(clubs, 38, null, ['72']), clubs[1])
})

test('an unknown explicit club never falls back to another club balance', () => {
  assert.equal(resolveWalletClub(clubs, 38, null, 999), null)
  assert.equal(resolveWalletClubGold(null), 0)
})

test('wallet club helpers reject invalid ids and balances', () => {
  assert.equal(resolveWalletClubId({ club_id: 0 }), undefined)
  assert.equal(resolveWalletClubGold({ club_id: 38, user_gold: 'invalid' }), 0)
})

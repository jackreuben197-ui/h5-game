import assert from 'node:assert/strict'
import test from 'node:test'
import { filterWalletsForCurrentClub } from '../src/utils/channelWallet.ts'

const wallets = [
  { club_id: 101, club_name: 'Current' },
  { club_id: 202, club_name: 'Other' },
]

test('channel package only exposes the current club wallet', () => {
  assert.deepEqual(filterWalletsForCurrentClub(wallets, true, 101), [wallets[0]])
})

test('channel package exposes no wallets when current club context is missing', () => {
  assert.deepEqual(filterWalletsForCurrentClub(wallets, true, 0), [])
})

test('official package keeps the original multi-wallet list', () => {
  assert.deepEqual(filterWalletsForCurrentClub(wallets, false, 101), wallets)
})

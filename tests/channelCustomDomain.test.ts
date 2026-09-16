import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  isChannelPackageHostname,
  isChannelSubdomainHostname,
} from '../src/utils/channelHost.ts'

const mainDomain = 'test2-game.awanptest.com'

test('custom club domain is rendered as a channel package', () => {
  assert.equal(isChannelPackageHostname('kong4.wearenewpoker.com', mainDomain), true)
  assert.equal(isChannelSubdomainHostname('kong4.wearenewpoker.com', mainDomain), false)
})

test('legacy invite-code subdomain remains a channel package', () => {
  assert.equal(isChannelPackageHostname(`ksGuBmMk.${mainDomain}`, mainDomain), true)
  assert.equal(isChannelSubdomainHostname(`ksGuBmMk.${mainDomain}`, mainDomain), true)
})

test('official and local preview hosts are not channel packages', () => {
  assert.equal(isChannelPackageHostname(mainDomain, mainDomain), false)
  assert.equal(isChannelPackageHostname('localhost', mainDomain), false)
  assert.equal(isChannelPackageHostname('127.0.0.1', mainDomain), false)
})

test('custom domain club stays scoped to the default API club', () => {
  const storeSource = readFileSync(new URL('../src/stores/userInfo.ts', import.meta.url), 'utf8')
  const homeSource = readFileSync(
    new URL('../src/views/home/HomeIndexView.vue', import.meta.url),
    'utf8',
  )

  assert.match(storeSource, /!subDomainInviteCode && isChannelPackageHost\(\)/)
  assert.match(storeSource, /normalizeClubId\(this\.channelDefaultClub\?\.club_id\)/)
  assert.match(
    homeSource,
    /if \(isChannelPackage\) \{\s*return userInfoStore\.channelDefaultClub/,
  )
})

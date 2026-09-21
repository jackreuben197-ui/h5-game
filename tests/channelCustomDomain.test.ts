import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  findConfiguredBaseDomain,
  isChannelPackageHostname,
  isChannelSubdomainHostname,
  parseActivePlatformDomains,
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

test('both platform domain types are official and type 1 generates invite subdomains', () => {
  const mainDomains = parseActivePlatformDomains(
    '{"data":[{"id":3,"domain":"fanuf.maintest71.com","domain_type":2,"status":"active"}]}',
    2,
  )
  const qrCodeDomains = parseActivePlatformDomains(
    '{"data":[{"id":2,"domain":"fbdgqp.tet982m32.com","domain_type":1,"status":"active"}]}',
    1,
  )

  assert.deepEqual(mainDomains, ['fanuf.maintest71.com'])
  assert.deepEqual(qrCodeDomains, ['fbdgqp.tet982m32.com'])
  assert.equal(isChannelPackageHostname('fanuf.maintest71.com', mainDomains), false)
  assert.equal(
    isChannelPackageHostname('fbdgqp.tet982m32.com', [...mainDomains, ...qrCodeDomains]),
    false,
  )
  assert.equal(isChannelPackageHostname('club-code.fbdgqp.tet982m32.com', mainDomains), true)
  assert.equal(
    findConfiguredBaseDomain('club-code.fbdgqp.tet982m32.com', qrCodeDomains),
    'fbdgqp.tet982m32.com',
  )
})

test('platform domain config ignores inactive and mismatched records', () => {
  const raw = {
    data: [
      { domain: 'active.example.com', domain_type: 1, status: 'active' },
      { domain: 'suspended.example.com', domain_type: 1, status: 'suspended' },
      { domain: 'main.example.com', domain_type: 2, status: 'active' },
    ],
  }

  assert.deepEqual(parseActivePlatformDomains(raw, 1), ['active.example.com'])
  assert.deepEqual(parseActivePlatformDomains(raw, 2), ['main.example.com'])
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

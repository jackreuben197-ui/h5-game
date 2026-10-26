import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSafariWebAppConfig } from '../src/utils/safariWebApp.ts'

const platformIcon = 'https://example.com/icon-192.png'
const tribeIcon = 'https://example.com/tribe.png'
const clubIcon = 'https://example.com/club.png'

test('Safari branding resolves each field through club, tribe, platform', () => {
  assert.deepEqual(
    resolveSafariWebAppConfig({
      safari_label: 'Club',
      safari_icon_url: clubIcon,
      tribe_safari_label: 'Tribe',
      tribe_safari_icon_url: tribeIcon,
    }, platformIcon),
    { label: 'Club', iconUrl: clubIcon, hasCustomIcon: true },
  )
  assert.deepEqual(
    resolveSafariWebAppConfig({
      safari_label: '  ',
      safari_icon_url: clubIcon,
      tribe_safari_label: 'Tribe',
      tribe_safari_icon_url: tribeIcon,
    }, platformIcon),
    { label: 'Tribe', iconUrl: clubIcon, hasCustomIcon: true },
  )
  assert.deepEqual(
    resolveSafariWebAppConfig({
      safari_icon_url: 'javascript:alert(1)',
      tribe_safari_icon_url: tribeIcon,
    }, platformIcon),
    { label: 'Newpkr', iconUrl: tribeIcon, hasCustomIcon: true },
  )
  assert.deepEqual(resolveSafariWebAppConfig(null, platformIcon, 'Platform'), {
    label: 'Platform', iconUrl: platformIcon, hasCustomIcon: false,
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_CLUB_NAME, resolveSafariWebAppConfig } from '../src/utils/safariWebApp.ts'

const platformIcon = 'https://example.com/icon-192.png'
const clubIcon = 'https://example.com/club.png'

test('Safari branding uses server-resolved club fields, then platform defaults', () => {
  assert.deepEqual(
    resolveSafariWebAppConfig({
      safari_label: 'Server resolved label',
      safari_icon_url: clubIcon,
    }, platformIcon),
    { label: 'Server resolved label', iconUrl: clubIcon, hasCustomIcon: true },
  )
  assert.deepEqual(
    resolveSafariWebAppConfig({
      safari_label: '  ',
      safari_icon_url: clubIcon,
    }, platformIcon),
    { label: DEFAULT_CLUB_NAME, iconUrl: clubIcon, hasCustomIcon: true },
  )
  assert.deepEqual(
    resolveSafariWebAppConfig({
      safari_label: 'Server resolved label',
      safari_icon_url: 'javascript:alert(1)',
    }, platformIcon),
    { label: 'Server resolved label', iconUrl: platformIcon, hasCustomIcon: false },
  )
  assert.deepEqual(resolveSafariWebAppConfig(null, platformIcon, 'Platform'), {
    label: 'Platform', iconUrl: platformIcon, hasCustomIcon: false,
  })
})

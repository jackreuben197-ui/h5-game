import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildHomeContentModeCacheKey,
  getHomeContentModeCache,
  setHomeContentModeCache,
} from '../src/utils/homeContentModeCache.ts'

const baseContext = {
  sessionKey: 'user_123',
  isChannelPackage: true,
  clubId: 456,
  tribeId: 0,
  displayPlatformMtt: true,
  displayPlatformDiamond: true,
  isChannelMenuVersionB: false,
}

test('reuses the confirmed home mode in the same SPA context', () => {
  const key = buildHomeContentModeCacheKey(baseContext)
  setHomeContentModeCache(key, 'mtt')
  assert.equal(getHomeContentModeCache(key), 'mtt')
})

test('CMS visibility and menu changes cannot reuse an incompatible home mode', () => {
  const key = buildHomeContentModeCacheKey(baseContext)
  setHomeContentModeCache(key, 'mtt')

  assert.equal(
    getHomeContentModeCache(
      buildHomeContentModeCacheKey({ ...baseContext, displayPlatformDiamond: false }),
    ),
    null,
  )
  assert.equal(
    getHomeContentModeCache(
      buildHomeContentModeCacheKey({ ...baseContext, displayPlatformMtt: false }),
    ),
    null,
  )
  assert.equal(
    getHomeContentModeCache(
      buildHomeContentModeCacheKey({ ...baseContext, isChannelMenuVersionB: true }),
    ),
    null,
  )
})

test('club and login scope changes cannot reuse another scope mode', () => {
  const key = buildHomeContentModeCacheKey(baseContext)
  setHomeContentModeCache(key, 'mtt')

  assert.equal(
    getHomeContentModeCache(buildHomeContentModeCacheKey({ ...baseContext, clubId: 789 })),
    null,
  )
  assert.equal(
    getHomeContentModeCache(
      buildHomeContentModeCacheKey({ ...baseContext, sessionKey: 'user_999' }),
    ),
    null,
  )
})

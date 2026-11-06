import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const entrySource = readFileSync(
  new URL('../src/entry/cocos-h5-entry.ts', import.meta.url),
  'utf8',
)
const routerSource = readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8')
const homeSource = readFileSync(
  new URL('../src/views/home/HomeIndexView.vue', import.meta.url),
  'utf8',
)

test('Vue mount is not gated by before-login config or channel landing requests', () => {
  assert.doesNotMatch(entrySource, /ensureGuestGlobalConfig|preparePlatformDomains/)
  const blockingGuards = routerSource.slice(
    routerSource.indexOf('router.beforeEach'),
    routerSource.indexOf('router.afterEach'),
  )
  assert.doesNotMatch(blockingGuards, /ensureChannelDefaultClub|ensureExperienceSession/)
  assert.match(routerSource, /to\.meta\.requiresAuth && to\.name !== 'lobby'/)
  assert.match(entrySource, /mountH5App\(container\)/)
})

test('the A/B banner waits for the channel menu and skips the version C homepage', () => {
  assert.match(homeSource, /channelClubReady\.then\(loadHomeBanners\)/)
  assert.match(homeSource, /if \(isVersionC\.value\) return\s+try \{\s+await fetchLobbyBannerImages\(\)/)
  assert.match(homeSource, /initialBannersReady\.then\(loadHomeBanners\)/)
})

test('home defers session bootstrap until first paint and validates it before loading lists', () => {
  const firstPaintIndex = homeSource.indexOf('await waitForH5FirstPaint()')
  const sessionIndex = homeSource.indexOf('const sessionReady = ensureExperienceSession()')
  assert.ok(firstPaintIndex >= 0)
  assert.ok(sessionIndex > firstPaintIndex)
  assert.match(
    homeSource,
    /Promise\.allSettled\(\[\s*roomListStore\.bootstrapRoomList\(\),\s*mttListStore\.bootstrapMttList\(\),/,
  )
  assert.match(homeSource, /const listsReady = sessionReady\.then/)
  assert.doesNotMatch(homeSource, /const listsReady = initialSessionKey/)
})

test('official zones render immediately while channel lists wait for resolved data', () => {
  assert.match(homeSource, /if \(!isChannelPackage\.value\) \{\s*return 'zones'/)
  assert.match(homeSource, /v-else-if="showOfficialHomeSections \|\| homeContentReady"/)
  assert.match(homeSource, /v-if="homeContentReady && homeContentMode === 'mtt'"/)
  assert.match(homeSource, /v-else-if="homeContentReady && homeContentMode === 'poker'"/)
})

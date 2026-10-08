import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const bottomTabSource = readFileSync(
  new URL('../src/components/Tabbar/MainBottomTab.vue', import.meta.url),
  'utf8',
)
const homeSource = readFileSync(
  new URL('../src/views/home/HomeIndexView.vue', import.meta.url),
  'utf8',
)
const mainLayoutSource = readFileSync(
  new URL('../src/views/main/MainLayoutView.vue', import.meta.url),
  'utf8',
)
const homeTopBarSource = readFileSync(
  new URL('../src/components/HomeTopBar.vue', import.meta.url),
  'utf8',
)
const roomListSource = readFileSync(
  new URL('../src/views/home/gameList.vue', import.meta.url),
  'utf8',
)

test('channel version B table and match tabs return to the shared home page', () => {
  assert.match(bottomTabSource, /path: '\/home\?section=poker'/)
  assert.match(bottomTabSource, /path: '\/home\?section=mtt'/)
  assert.doesNotMatch(bottomTabSource, /path: '\/gameList'/)
  assert.doesNotMatch(bottomTabSource, /path: '\/match'/)
})

test('shared home selects the requested embedded section without changing page shell', () => {
  assert.match(homeSource, /route\.query\.section/)
  assert.match(homeSource, /requestedHomeSection\.value === 'poker'/)
  assert.match(homeSource, /requestedHomeSection\.value === 'mtt'/)
  assert.match(homeSource, /watch\(requestedHomeSection/)
})

test('dark home uses the shared pink main background without a white-only override', () => {
  assert.match(mainLayoutSource, /background-image: var\(--main-bg-dark\)/)
  assert.doesNotMatch(mainLayoutSource, /\.main-layout--home\s*\{[^}]*background-color:\s*#fff/s)
  assert.match(mainLayoutSource, /@include theme-light\s*\{[^}]*background-image: var\(--main-bg-light\)/s)
})

test('dark home content keeps light text and the embedded poker glass visual', () => {
  assert.match(homeTopBarSource, /\.home-top-bar__logo\s*\{[\s\S]*?color:\s*#fff/)
  assert.match(homeSource, /\.section-title\s*\{[\s\S]*?color:\s*#fff/)
  assert.doesNotMatch(roomListSource, /:force-light="props\.embedded"/)
  assert.match(
    roomListSource,
    /\.room-list-page--embedded \.group-list\s*\{[\s\S]*?background:\s*rgba\(255, 255, 255, 0\.24\);[\s\S]*?backdrop-filter:\s*blur\(0\.3533rem\) saturate\(1\.04\)/,
  )
})

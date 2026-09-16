import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const manageButtonSource = readFileSync(
  new URL('../src/components/Club/ChannelClubManageFloatingButton.vue', import.meta.url),
  'utf8',
)
const matchPageSource = readFileSync(
  new URL('../src/views/mtt/MatchIndexView.vue', import.meta.url),
  'utf8',
)
const tablePageSource = readFileSync(
  new URL('../src/views/home/gameList.vue', import.meta.url),
  'utf8',
)

test('channel menu version B keeps club management entry on match and table pages', () => {
  assert.match(matchPageSource, /<ChannelClubManageFloatingButton\s*\/>/)
  assert.match(tablePageSource, /<ChannelClubManageFloatingButton v-if="!props\.embedded"\s*\/>/)
})

test('club management entry is version-B-only and does not expose table creation', () => {
  assert.match(manageButtonSource, /isVersionB\.value/)
  assert.match(manageButtonSource, /userInfoStore\.currentJoinedClub/)
  assert.match(manageButtonSource, /router\.push\('\/club\/detail'\)/)
  assert.doesNotMatch(manageButtonSource, /createTable|UIGuild_CreateTable/)
})

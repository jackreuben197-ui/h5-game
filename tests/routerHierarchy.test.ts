import assert from 'node:assert/strict'
import test from 'node:test'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { clubRoutes, clubTabRoute } from '../src/router/routes/club.ts'
import { messageRoutes, messageTabRoute } from '../src/router/routes/message.ts'
import { mineRoutes, mineTabRoute } from '../src/router/routes/mine.ts'

const homeRoute: RouteRecordRaw = {
  path: 'home',
  name: 'lobby',
  component: {},
  meta: {
    requiresAuth: true,
    guestPreview: true,
    tabKey: 'home',
    moduleTitle: '首页',
    desktopLayout: 'primary',
  },
}

const mainRoute: RouteRecordRaw = {
  path: '/',
  component: {},
  children: [homeRoute, clubTabRoute, messageTabRoute, mineTabRoute],
}

const legacyGuestRedirects: RouteRecordRaw[] = [
  {
    path: '/guest/home',
    redirect: (to) => ({ name: 'lobby', query: to.query, hash: to.hash }),
  },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes: [...legacyGuestRedirects, mainRoute, ...clubRoutes, ...messageRoutes, ...mineRoutes],
})

test('module route hierarchy keeps public paths and names stable', () => {
  const cases = [
    ['/home', 'lobby'],
    ['/club', 'club'],
    ['/club/member/42/agent-profit', 'club-member-agent-profit'],
    ['/club/jackpot/pool-reward/reward-records', 'club-jackpot-pool-reward-reward-records'],
    ['/message/detail', 'message-detail'],
    ['/mine/settings/account/security-password/setup', 'mine-settings-account-security-password-setup'],
    ['/mine/career/friends/record/detail', 'mine-career-record-detail'],
    ['/mine/career/club/mahjong/hand', 'mine-career-club-mahjong-hand'],
    ['/mine/hand-collection/detail', 'mine-hand-collection-detail'],
  ] as const

  for (const [path, name] of cases) {
    const resolved = router.resolve(path)
    assert.equal(resolved.name, name, path)
    assert.equal(resolved.meta.requiresAuth, true, `${path} should remain authenticated`)
  }
})

test('legacy guest home path still lands on the lobby', async () => {
  await router.push('/guest/home?invite_code=abc')
  assert.equal(router.currentRoute.value.name, 'lobby')
  assert.equal(router.currentRoute.value.query.invite_code, 'abc')
})

test('first-level tabs and content pages keep their desktop layouts', () => {
  assert.equal(router.resolve('/club').meta.desktopLayout, 'primary')
  assert.equal(router.resolve('/message').meta.desktopLayout, 'primary')
  assert.equal(router.resolve('/mine').meta.desktopLayout, 'primary')
  assert.equal(router.resolve('/club/member/42').meta.desktopLayout, 'content')
  assert.equal(router.resolve('/message/detail').meta.desktopLayout, 'content')
  assert.equal(router.resolve('/mine/settings/account').meta.desktopLayout, 'content')

  // These pages intentionally had no explicit desktop layout before the refactor.
  assert.equal(router.resolve('/mine/career/club/cowboy/hand').meta.desktopLayout, undefined)
})

test('club, message and mine reuse their formal first-level pages for guest preview', () => {
  assert.equal(router.resolve('/club').meta.guestPreview, true)
  assert.equal(router.resolve('/message').meta.guestPreview, true)
  assert.equal(router.resolve('/mine').meta.guestPreview, true)
})

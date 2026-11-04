import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { registerHooks } from 'node:module'
import { effectScope } from 'vue'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const stateUrl = moduleUrl(`
  import { reactive } from "${import.meta.resolve('vue')}";
  export const state = reactive({ clubId: 1, channel: true, realUser: false, telegram: false, cms: [], scene: [], calls: [], cmsGate: null });
`)
const dependencies = new Map([
  [
    '@/api/config',
    moduleUrl(`
    import { state } from '${stateUrl}';
    export async function postBeforeLoginConfigApi(payload) {
      state.calls.push(['cms', payload]);
      const list = state.cms;
      if (state.cmsGate) await state.cmsGate;
      return { code: 0, data: { banner_list_resp: { list } } };
    }
  `),
  ],
  [
    '@/api/misc',
    moduleUrl(`
    import { state } from '${stateUrl}';
    export async function postMiscBannerListApi(payload) {
      state.calls.push(['scene', payload]);
      return { code: 0, data: { list: state.scene } };
    }
  `),
  ],
  [
    '@/stores/game',
    moduleUrl(`
    import { state } from '${stateUrl}';
    export const useGameStore = () => ({ get isRealUser() { return state.realUser; } });
  `),
  ],
  [
    '@/stores/userInfo',
    moduleUrl(`
    import { state } from '${stateUrl}';
    export const useUserInfoStore = () => ({
      get channelDefaultClub() { return { club_id: state.clubId }; },
      async ensureChannelDefaultClub() { return { club_id: state.clubId }; },
    });
  `),
  ],
  [
    '@/i18n',
    moduleUrl(`export const getLocale = () => 'cn'; export const toServerLang = () => 'zh_CN';`),
  ],
  [
    '@/utils/environment',
    moduleUrl(
      `import { state } from '${stateUrl}'; export const isTelegramMiniAppEnv = () => state.telegram;`,
    ),
  ],
  [
    '@/utils/channelPackage',
    moduleUrl(`
      import { state } from '${stateUrl}';
      export const isChannelPackageHost = () => state.channel;
    `),
  ],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = dependencies.get(specifier)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})
const { useLobbyBannerImages } = await import('../src/composables/useLobbyBannerImages.ts')
const { state } = await import(stateUrl)
hooks.deregister()

function mountBanners(t: TestContext, variant?: 'c') {
  const scope = effectScope()
  t.after(() => scope.stop())
  return scope.run(() => useLobbyBannerImages(variant))!
}

function banner(clubId: number, extra: Record<string, unknown> = {}) {
  return {
    club_id: clubId,
    lang: 'zh_CN',
    banner_type: 1,
    display_scene: 1,
    status: 1,
    image_url: 'ab.png',
    image_url_c: 'c.png',
    ...extra,
  }
}

test('C and A/B read their own image fields and never share cached images', async (t) => {
  state.clubId = 101
  state.realUser = false
  state.calls = []
  state.cms = [banner(101)]
  const c = mountBanners(t, 'c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['c.png'])
  const ab = mountBanners(t)
  await ab.fetchLobbyBannerImages()
  assert.deepEqual(ab.banners.value.map((item) => item.imageUrl), ['ab.png'])
  const repeatedC = mountBanners(t, 'c')
  await repeatedC.fetchLobbyBannerImages()
  assert.deepEqual(repeatedC.banners.value.map((item) => item.imageUrl), ['c.png'])
  assert.equal(state.calls.length, 2)
})

test('a club with only A/B images falls back to the platform C image, not another club', async (t) => {
  state.clubId = 102
  state.cms = [
    banner(102, { image_url_c: '' }),
    banner(0, { image_url_c: 'platform-c.png' }),
    banner(999, { image_url_c: 'other-club.png' }),
  ]
  const c = mountBanners(t, 'c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['platform-c.png'])
})

test('authenticated A/B and C requests share the H5 scene and select their own image fields', async (t) => {
  state.clubId = 103
  state.realUser = true
  state.calls = []
  state.scene = [banner(999), banner(103, { image_url_c: 'club-scene-c.png' })]
  const c = mountBanners(t, 'c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['club-scene-c.png'])
  assert.equal(state.calls.length, 1)
  assert.equal(state.calls[0][0], 'scene')
  assert.equal(state.calls[0][1].club_id, 103)
  assert.equal(state.calls[0][1].display_scene, 1)
  const ab = mountBanners(t)
  await ab.fetchLobbyBannerImages()
  assert.deepEqual(ab.banners.value.map((item) => item.imageUrl), ['ab.png'])
  assert.equal(state.calls[1][1].display_scene, 1)
})

test('missing C scene image falls through to the public C banner configuration', async (t) => {
  state.clubId = 104
  state.realUser = true
  state.scene = [banner(104, { image_url_c: '' })]
  state.cms = [banner(0, { image_url_c: 'fallback-c.png' })]
  const c = mountBanners(t, 'c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['fallback-c.png'])
})

test('missing artwork returns no remote URL for the view fallback and respects visibility', async (t) => {
  state.clubId = 105
  state.realUser = false
  state.cms = [
    banner(105, { image_url: '', image_url_c: '' }),
    banner(105, { lang: 'en_US' }),
    banner(105, { display_scene: 2 }),
    banner(105, { status: 2 }),
  ]
  const c = mountBanners(t, 'c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), [])
})

test('Telegram keeps the same scene for both image variants', async (t) => {
  state.clubId = 106
  state.realUser = false
  state.telegram = true
  state.cms = [
    banner(106, { display_scene: 1, image_url_c: 'h5-c.png' }),
    banner(106, { display_scene: 2, image_url: 'telegram-ab.png', image_url_c: 'telegram-c.png' }),
  ]
  const c = mountBanners(t, 'c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['telegram-c.png'])
  const ab = mountBanners(t)
  await ab.fetchLobbyBannerImages()
  assert.deepEqual(ab.banners.value.map((item) => item.imageUrl), ['telegram-ab.png'])
  state.telegram = false
})

test('club pictures read mutually exclusive association fields and refresh saved posters', async (t) => {
  state.clubId = 107
  state.realUser = true
  state.scene = [
    banner(107, { id: 42, association_type: 2, poster_url: 'https://cdn.example/old.png' }),
    banner(107, {
      id: 43,
      association_type: 1,
      template_id: 10,
      template_name: 'Weekly tournament',
      poster_url: 'https://cdn.example/unused.png',
    }),
    banner(107, { id: 44, resource_type: 2, association_type: 1, template_id: 10 }),
    banner(107, { id: 45, redirect_url: 'https://example.com/legacy' }),
  ]
  const c = mountBanners(t, 'c')
  await c.fetchLobbyBannerImages()
  const [poster, template, video, legacy] = c.banners.value
  assert.deepEqual(poster?.association, { type: 'poster', url: 'https://cdn.example/old.png' })
  assert.deepEqual(template?.association, {
    type: 'mtt',
    templateId: '10',
    templateName: 'Weekly tournament',
  })
  assert.equal(video?.association, undefined)
  assert.equal(legacy?.association, undefined)

  state.scene = [
    banner(107, { id: 42, association_type: 2, poster_url: 'https://cdn.example/new.png' }),
  ]
  const refreshed = await c.refreshLobbyBanner(poster!)
  assert.deepEqual(refreshed?.association, { type: 'poster', url: 'https://cdn.example/new.png' })

  state.scene = [
    banner(107, { id: 42, association_type: 0, poster_url: 'https://cdn.example/new.png' }),
  ]
  assert.equal((await c.refreshLobbyBanner(poster!))?.association, undefined)
})

test('public channel banners also consume the server association fields', async (t) => {
  state.clubId = 108
  state.realUser = false
  state.cms = [
    banner(108, { id: 43, association_type: 1, template_id: '20', template_name: 'Weekend Cup' }),
  ]
  const ab = mountBanners(t)
  await ab.fetchLobbyBannerImages()
  assert.deepEqual(ab.banners.value[0]?.association, {
    type: 'mtt',
    templateId: '20',
    templateName: 'Weekend Cup',
  })
})

test('C guests use the club public artwork when the aggregate does not include the C field', async (t) => {
  state.clubId = 49
  state.realUser = false
  state.calls = []
  state.cms = [
    banner(0, { id: 292, lang: 'zh_TW', image_url: 'platform.png', image_url_c: undefined }),
    banner(49, { id: 300, image_url: 'club-first.png', image_url_c: undefined }),
    banner(49, { id: 298, image_url: 'club-second.png', image_url_c: undefined }),
    banner(49, { id: 301, banner_type: 13, image_url: 'other-position.png', image_url_c: undefined }),
    banner(99, { id: 302, image_url: 'other-club.png', image_url_c: undefined }),
  ]
  const c = mountBanners(t, 'c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['club-first.png', 'club-second.png'])
  assert.equal(state.calls[0]?.[1].banner_list_req.club_id, 49)
})

test('a mounted C guest page requests banner/list when the player signs in', async (t) => {
  state.clubId = 109
  state.realUser = false
  state.calls = []
  state.cms = [banner(109, { image_url_c: 'guest-c.png' })]
  state.scene = [banner(109, { image_url_c: 'member-c.png' })]
  const c = mountBanners(t, 'c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['guest-c.png'])

  state.realUser = true
  await new Promise<void>((resolve) => setImmediate(resolve))
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['member-c.png'])
  assert.deepEqual(state.calls.map(([source]) => source), ['cms', 'scene'])
  assert.equal(state.calls[1]?.[1].club_id, 109)

  const reopened = mountBanners(t, 'c')
  await reopened.fetchLobbyBannerImages()
  assert.equal(state.calls.length, 2)
})

test('a late public response cannot replace the authenticated banner', async (t) => {
  state.clubId = 110
  state.realUser = false
  state.calls = []
  state.cms = [banner(110, { image_url_c: 'old-guest.png' })]
  state.scene = [banner(110, { image_url_c: 'current-member.png' })]
  let releaseCms!: () => void
  state.cmsGate = new Promise<void>((resolve) => { releaseCms = resolve })
  t.after(() => { state.cmsGate = null })
  const c = mountBanners(t, 'c')
  const guestLoad = c.fetchLobbyBannerImages()
  await new Promise<void>((resolve) => setImmediate(resolve))

  state.realUser = true
  await c.fetchLobbyBannerImages()
  await new Promise<void>((resolve) => setImmediate(resolve))
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['current-member.png'])
  releaseCms()
  await guestLoad
  assert.deepEqual(c.banners.value.map((item) => item.imageUrl), ['current-member.png'])
  assert.deepEqual(state.calls.map(([source]) => source), ['cms', 'scene'])
})

test('the official package can show the platform traditional Chinese configuration', async (t) => {
  state.channel = false
  state.realUser = false
  state.calls = []
  state.cms = [
    banner(49, { image_url: 'club-cn.png' }),
    banner(0, { lang: 'zh_TW', image_url: 'platform-tw.png' }),
  ]
  const ab = mountBanners(t)
  await ab.fetchLobbyBannerImages()
  assert.deepEqual(ab.banners.value.map((item) => item.imageUrl), ['platform-tw.png'])
  state.realUser = true
  await new Promise<void>((resolve) => setImmediate(resolve))
  assert.deepEqual(state.calls.map(([source]) => source), ['cms'])
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const stateUrl = moduleUrl(`
  export const state = { clubId: 1, realUser: false, telegram: false, cms: [], scene: [], calls: [] };
`)
const dependencies = new Map([
  [
    '@/api/config',
    moduleUrl(`
    import { state } from '${stateUrl}';
    export async function postBeforeLoginConfigApi(payload) {
      state.calls.push(['cms', payload]);
      return { code: 0, data: { banner_list_resp: { list: state.cms } } };
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
  ['@/utils/channelPackage', moduleUrl(`export const isChannelPackageHost = () => true;`)],
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

test('C and A/B read their own image fields and never share cached images', async () => {
  state.clubId = 101
  state.realUser = false
  state.calls = []
  state.cms = [banner(101)]
  const c = useLobbyBannerImages('c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.bannerImages.value, ['c.png'])
  const ab = useLobbyBannerImages()
  await ab.fetchLobbyBannerImages()
  assert.deepEqual(ab.bannerImages.value, ['ab.png'])
  const repeatedC = useLobbyBannerImages('c')
  await repeatedC.fetchLobbyBannerImages()
  assert.deepEqual(repeatedC.bannerImages.value, ['c.png'])
  assert.equal(state.calls.length, 2)
})

test('a club with only A/B images falls back to the platform C image, not another club', async () => {
  state.clubId = 102
  state.cms = [
    banner(102, { image_url_c: '' }),
    banner(0, { image_url_c: 'platform-c.png' }),
    banner(999, { image_url_c: 'other-club.png' }),
  ]
  const c = useLobbyBannerImages('c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.bannerImages.value, ['platform-c.png'])
})

test('authenticated A/B and C requests share the H5 scene and select their own image fields', async () => {
  state.clubId = 103
  state.realUser = true
  state.calls = []
  state.scene = [banner(999), banner(103, { image_url_c: 'club-scene-c.png' })]
  const c = useLobbyBannerImages('c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.bannerImages.value, ['club-scene-c.png'])
  assert.equal(state.calls.length, 1)
  assert.equal(state.calls[0][0], 'scene')
  assert.equal(state.calls[0][1].club_id, 103)
  assert.equal(state.calls[0][1].display_scene, 1)
  const ab = useLobbyBannerImages('ab')
  await ab.fetchLobbyBannerImages()
  assert.deepEqual(ab.bannerImages.value, ['ab.png'])
  assert.equal(state.calls[1][1].display_scene, 1)
})

test('missing C scene image falls through to the public C banner configuration', async () => {
  state.clubId = 104
  state.realUser = true
  state.scene = [banner(104, { image_url_c: '' })]
  state.cms = [banner(0, { image_url_c: 'fallback-c.png' })]
  const c = useLobbyBannerImages('c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.bannerImages.value, ['fallback-c.png'])
})

test('missing C artwork returns no remote URL for the view fallback and respects visibility', async () => {
  state.clubId = 105
  state.realUser = false
  state.cms = [
    banner(105, { image_url_c: '' }),
    banner(105, { lang: 'en_US' }),
    banner(105, { display_scene: 2 }),
    banner(105, { status: 2 }),
  ]
  const c = useLobbyBannerImages('c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.bannerImages.value, [])
})

test('Telegram keeps the same scene for both image variants', async () => {
  state.clubId = 106
  state.realUser = false
  state.telegram = true
  state.cms = [
    banner(106, { display_scene: 1, image_url_c: 'h5-c.png' }),
    banner(106, { display_scene: 2, image_url: 'telegram-ab.png', image_url_c: 'telegram-c.png' }),
  ]
  const c = useLobbyBannerImages('c')
  await c.fetchLobbyBannerImages()
  assert.deepEqual(c.bannerImages.value, ['telegram-c.png'])
  const ab = useLobbyBannerImages('ab')
  await ab.fetchLobbyBannerImages()
  assert.deepEqual(ab.bannerImages.value, ['telegram-ab.png'])
  state.telegram = false
})

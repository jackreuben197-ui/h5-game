import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { createPinia, setActivePinia } from 'pinia'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const mockUrl = moduleUrl(`
  export const state = {
    configRequests: [], defaultRequests: [], globalRequests: 0, cachedConfig: null,
    configResponse: async () => ({ code: 0, data: null }),
    globalResponse: async () => ({ code: 0, data: null }),
    defaultResponse: async () => ({ code: 0, data: { club: { club_id: 97 } } }),
  };
  export async function postBeforeLoginConfigApi(payload) {
    state.configRequests.push(payload);
    return state.configResponse();
  }
  export async function postGlobalConfigApi() {
    state.globalRequests++;
    return state.globalResponse();
  }
  export async function postOrgClubDefaultApi(payload) {
    state.defaultRequests.push(payload);
    return state.defaultResponse();
  }
  export const PUBLIC_STORE_APP_CONFIG = 'app_config';
  export const PUBLIC_STORE_DIAMOND_CONFIG = 'diamond_config';
  export const PUBLIC_STORE_UC_CONFIG = 'uc_config';
  export async function readPublicCache() { return null; }
  export async function readPublicCacheEntries(store) {
    return store === 'app_config' && state.cachedConfig
      ? Object.entries(state.cachedConfig).map(([key, value]) => ({ key, value }))
      : [];
  }
  export async function replacePublicCacheEntries() {}
  export const localStore = { getItem: (_key, fallback) => fallback, setItem() {}, removeItem() {} };
  export const dzpkPersistStorage = { getItem: () => null, setItem() {}, removeItem() {} };
`)
const aliases = new Map([
  ['@/stores/appConfig', new URL('../src/stores/appConfig.ts', import.meta.url).href],
  ['@/utils/channelPackage', new URL('../src/utils/channelPackage.ts', import.meta.url).href],
  ['@/utils/channelHost', new URL('../src/utils/channelHost.ts', import.meta.url).href],
  ['@/utils/playerInvitation', new URL('../src/utils/playerInvitation.ts', import.meta.url).href],
  ['@/constants/storageKey', moduleUrl('export default {};')],
])
for (const name of ['api/config', 'api/org', 'utils/indexedDB', 'utils/localStore']) {
  aliases.set(`@/${name}`, mockUrl)
}
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = aliases.get(specifier)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})
const { useUserInfoStore } = await import('../src/stores/userInfo.ts')
const { useAppConfigStore } = await import('../src/stores/appConfig.ts')
const { configurePlatformDomains, isChannelPackageHost, getPlatformQrCodeDomains } =
  await import('../src/utils/channelPackage.ts')
const { state } = await import(mockUrl)
hooks.deregister()

const invitationUrl =
  'https://ksgubmmk.nsh.cjsjd.com/#/home?mode=register&i=nvEDgGfw&random_id=92625674'
const officialDomain = 'fbdgqp.tet982m32.com'
const channelUrl = `https://rhswehjy.${officialDomain}/`
const domainConfig = {
  plat_domain_main_info: JSON.stringify({
    data: ['fanuf.maintest71.com', `official.${officialDomain}`].map((domain) => ({
      domain, domain_type: 2, status: 'active',
    })),
  }),
  plat_domain_qrcode_info: JSON.stringify({
    data: ['nsh.cjsjd.com', officialDomain].map((domain) => ({
      domain, domain_type: 1, status: 'active',
    })),
  }),
}
const configResponse = (config: object = domainConfig) => ({
  code: 0,
  data: { global_config_resp: { global_config: config } },
})
const nextTurn = () => new Promise<void>((resolve) => setImmediate(resolve))
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')

test.beforeEach(() => {
  setActivePinia(createPinia())
  useUserInfoStore().clearInfo()
  configurePlatformDomains(null)
  state.configRequests.length = 0
  state.defaultRequests.length = 0
  state.cachedConfig = null
  state.configResponse = async () => configResponse()
  state.defaultResponse = async () => ({ code: 0, data: { club: { club_id: 97 } } })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: new URL(invitationUrl) },
  })
})

test.after(() => {
  if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

test('first visit waits for platform domains, deduplicates callers and sends the subdomain club code', async () => {
  window.location.href = `${channelUrl}#/?invite_code=OtherClub`
  let resolveConfig!: (response: ReturnType<typeof configResponse>) => void
  state.configResponse = () => new Promise((resolve) => { resolveConfig = resolve })
  const user = useUserInfoStore()
  const first = user.ensureChannelDefaultClub()
  const second = user.ensureChannelDefaultClub()
  const authCode = user.resolveAuthInviteCode()
  await nextTurn()

  assert.equal(state.configRequests.length, 1)
  assert.deepEqual(state.defaultRequests, [])
  resolveConfig(configResponse())
  const clubs = await Promise.all([first, second])
  assert.deepEqual(clubs.map((club) => club?.club_id), [97, 97])
  assert.equal(await authCode, 'rhswehjy')
  assert.deepEqual(state.defaultRequests, [{ invite_code: 'rhswehjy' }])
  await user.ensureChannelDefaultClub()
  assert.equal(await useAppConfigStore().ensurePlatformDomainsReady(), true)
  assert.equal(state.configRequests.length, 1)
  assert.equal(state.defaultRequests.length, 1)
})

test('stale cached domains cannot authorize a base_url request before a fresh domain list arrives', async () => {
  state.cachedConfig = {
    ...domainConfig,
    plat_domain_qrcode_info: '{"data":[{"domain":"old.example.com","domain_type":1,"status":"active"}]}',
  }
  const app = useAppConfigStore()
  await app.restorePublicConfigCache()
  assert.equal(app.platformDomainsReady, false)
  assert.deepEqual(getPlatformQrCodeDomains(), [])

  await useUserInfoStore().ensureChannelDefaultClub()
  assert.equal(state.configRequests.length, 1)
  assert.deepEqual(state.defaultRequests, [{ invite_code: 'ksgubmmk' }])
})

test('cache restoration during an existing config request cannot discard the fresh domain list', async () => {
  let resolveConfig!: (response: ReturnType<typeof configResponse>) => void
  state.configResponse = () => new Promise((resolve) => { resolveConfig = resolve })
  const app = useAppConfigStore()
  const existingConfigRequest = app.ensureGuestGlobalConfig()
  state.cachedConfig = { ...domainConfig, plat_domain_qrcode_info: '{"data":[]}' }
  await app.restorePublicConfigCache()
  const clubReady = useUserInfoStore().ensureChannelDefaultClub()
  await nextTurn()
  assert.equal(state.configRequests.length, 1)
  assert.deepEqual(state.defaultRequests, [])

  resolveConfig(configResponse())
  await Promise.all([existingConfigRequest, clubReady])
  assert.equal(app.platformDomainsReady, true)
  assert.deepEqual(state.defaultRequests, [{ invite_code: 'ksgubmmk' }])
})

test('fresh global config already received in this session does not need another config request', async () => {
  useAppConfigStore().setGlobalConfig(domainConfig)
  await useUserInfoStore().ensureChannelDefaultClub()
  assert.deepEqual(state.configRequests, [])
  assert.deepEqual(state.defaultRequests, [{ invite_code: 'ksgubmmk' }])
})

test('home startup shares the first authenticated config result, and a later refresh can retry', async () => {
  const app = useAppConfigStore()
  const token = 'restored-session'
  state.globalRequests = 0
  state.globalResponse = async () => ({ code: 1, data: null })
  const sync = app.ensureFreshGlobalConfig(token)
  const home = app.waitForFreshGlobalConfig(token)
  assert.deepEqual(await Promise.all([sync, home]), [false, false])
  assert.equal(await app.waitForFreshGlobalConfig(token), false)
  assert.equal(state.globalRequests, 1)

  state.globalResponse = async () => ({ code: 0, data: domainConfig })
  assert.equal(await app.ensureFreshGlobalConfig(token), true)
  assert.equal(await app.waitForFreshGlobalConfig(token), true)
  assert.equal(state.globalRequests, 2)
})

test('a real custom domain still sends its full hostname after platform domains load', async () => {
  window.location.href = 'https://club.example.com/#/home?mode=register&i=nvEDgGfw&random_id=92625674'
  await useUserInfoStore().ensureChannelDefaultClub()
  assert.equal(state.configRequests.length, 1)
  assert.deepEqual(state.defaultRequests, [{ base_url: 'club.example.com' }])
})

test('an explicit club invite on a custom domain takes the invite lookup path', async () => {
  window.location.href = 'https://club.example.com/#/?invite_code=ClubCode&i=AgentCode'
  await useUserInfoStore().ensureChannelDefaultClub()
  assert.deepEqual(state.defaultRequests, [{ invite_code: 'ClubCode' }])
})

test('explicit agent invites still wait for the official domain lists', async () => {
  const user = useUserInfoStore()
  state.configResponse = async () => configResponse({})
  await assert.rejects(user.resolveAuthInviteCode(), /域名配置加载失败/)
  assert.deepEqual(state.defaultRequests, [])

  state.configResponse = async () => configResponse()
  assert.equal(await user.resolveAuthInviteCode(), 'nvEDgGfw')
})

test('an incomplete authenticated config cannot replace the loaded official domains', async () => {
  window.location.href = `https://${officialDomain}/`
  const app = useAppConfigStore()
  app.setGlobalConfig(domainConfig)
  app.setGlobalConfig({ plat_domain_main_info: domainConfig.plat_domain_main_info })

  assert.equal(await app.ensurePlatformDomainsReady(), true)
  assert.equal(isChannelPackageHost(), false)
  assert.deepEqual(state.configRequests, [])
})

test('auth uses the default club code on a custom domain and honors agent links', async () => {
  window.location.href = 'https://club.example.com/'
  state.defaultResponse = async () => ({
    code: 0,
    data: { club: { club_id: 97, invitation_code: 'ClubCode' } },
  })
  const user = useUserInfoStore()

  assert.equal(await user.resolveAuthInviteCode(), 'ClubCode')
  assert.deepEqual(state.defaultRequests, [{ base_url: 'club.example.com' }])
  window.location.hash = '/?i=AgentCode&invite_code=LinkCode'
  assert.equal(await user.resolveAuthInviteCode(), 'AgentCode')
})

for (const url of [channelUrl, 'https://club.example.com/']) {
  test(`restored sessions stay on ${url} and select the channel club by ID`, async () => {
    window.location.href = url
    state.defaultResponse = async () => ({
      code: 0,
      data: { club: { club_id: 97, invitation_code: 'rhswehjy', h5_menu: 3 } },
    })
    const user = useUserInfoStore()
    await user.ensureChannelDefaultClub()

    // The cache or account can lack the channel membership when startup sync begins.
    user.setClubList([{ club_id: 98 }])
    assert.equal(window.location.href, url)
    assert.equal(user.currentClubId, '')
    assert.equal(user.channelDefaultClub?.club_id, 97)

    user.setClubList([{ club_id: 98 }, { club_id: 97 }])
    assert.equal(window.location.href, url)
    assert.equal(user.currentClubId, '97')
    assert.equal(user.channelDefaultClub?.invitation_code, 'rhswehjy')
    assert.equal(user.channelDefaultClub?.h5_menu, 3)
  })
}

for (const hostname of ['fanuf.maintest71.com', 'nsh.cjsjd.com', officialDomain, `official.${officialDomain}`]) {
  test(`an official platform hostname does not query the channel default after config resolves: ${hostname}`, async () => {
    window.location.href = `https://${hostname}/#/home`
    const user = useUserInfoStore()
    assert.equal(await user.resolveAuthInviteCode(), '')
    assert.equal(await user.ensureChannelDefaultClub(), null)
    assert.deepEqual(state.defaultRequests, [])
  })
}

const unavailableConfigs = [
  ['network failure', () => Promise.reject(new Error('domain list unavailable'))],
  ['business failure', async () => ({ code: 1, data: null })],
  ['missing global config', async () => ({ code: 0, data: null })],
  ['missing domain lists', async () => configResponse({})],
  ['missing QR domain list', async () => configResponse({
    plat_domain_main_info: domainConfig.plat_domain_main_info,
  })],
  ['invalid QR domain JSON', async () => configResponse({
    ...domainConfig, plat_domain_qrcode_info: '{invalid',
  })],
] as const

for (const [reason, response] of unavailableConfigs) {
  test(`unavailable domain lists block /default and allow a later retry: ${reason}`, async (t) => {
    t.mock.method(console, 'warn', () => {})
    state.configResponse = response
    const user = useUserInfoStore()
    assert.equal(await user.ensureChannelDefaultClub(), null)
    assert.deepEqual(state.defaultRequests, [])
    assert.equal(useAppConfigStore().platformDomainsReady, false)

    state.configResponse = async () => configResponse()
    await user.ensureChannelDefaultClub()
    assert.equal(state.configRequests.length, 2)
    assert.deepEqual(state.defaultRequests, [{ invite_code: 'ksgubmmk' }])
  })
}

test('a valid empty QR domain list still supports custom domains when main domains are available', async () => {
  state.configResponse = async () => configResponse({
    ...domainConfig, plat_domain_qrcode_info: '{"data":[]}',
  })
  window.location.href = 'https://club.example.com/#/home'
  await useUserInfoStore().ensureChannelDefaultClub()
  assert.equal(useAppConfigStore().platformDomainsReady, true)
  assert.deepEqual(state.defaultRequests, [{ base_url: 'club.example.com' }])
})

test('an empty platform list still recognizes the built-in official domain and its subdomain', async () => {
  state.configResponse = async () => configResponse({
    plat_domain_main_info: '{"data":[]}', plat_domain_qrcode_info: '{"data":[]}',
  })
  window.location.href = 'https://test2-game.awanptest.com/'
  const user = useUserInfoStore()
  assert.equal(await user.ensureChannelDefaultClub(), null)
  assert.deepEqual(state.defaultRequests, [])

  window.location.href = 'https://rhswehjy.test2-game.awanptest.com/'
  await user.ensureChannelDefaultClub()
  assert.deepEqual(state.defaultRequests, [{ invite_code: 'rhswehjy' }])
})

test('a failed /default can retry using the ready domain list', async (t) => {
  t.mock.method(console, 'warn', () => {})
  state.defaultResponse = async () => ({ code: 1, msg: 'temporary failure' })
  const user = useUserInfoStore()
  assert.equal(await user.ensureChannelDefaultClub(), null)
  state.defaultResponse = async () => ({ code: 0, data: { club: { club_id: 97 } } })
  assert.equal((await user.ensureChannelDefaultClub())?.club_id, 97)
  assert.equal(state.configRequests.length, 1)
  assert.deepEqual(state.defaultRequests, [
    { invite_code: 'ksgubmmk' }, { invite_code: 'ksgubmmk' },
  ])
})

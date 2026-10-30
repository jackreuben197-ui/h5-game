import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { createPinia, setActivePinia } from 'pinia'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const mockUrl = moduleUrl(`
  export const state = {
    configRequests: [], defaultRequests: [], cachedConfig: null,
    configResponse: async () => ({ code: 0, data: null }),
    defaultResponse: async () => ({ code: 0, data: { club: { club_id: 97 } } }),
  };
  export async function postBeforeLoginConfigApi(payload) {
    state.configRequests.push(payload);
    return state.configResponse();
  }
  export async function postGlobalConfigApi() { return { code: 0, data: null }; }
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
const { configurePlatformDomains } = await import('../src/utils/channelPackage.ts')
const { state } = await import(mockUrl)
hooks.deregister()

const invitationUrl =
  'https://ksgubmmk.nsh.cjsjd.com/#/home?mode=register&i=nvEDgGfw&random_id=92625674'
const domainConfig = {
  plat_domain_main_info: JSON.stringify({
    data: [{ domain: 'fanuf.maintest71.com', domain_type: 2, status: 'active' }],
  }),
  plat_domain_qrcode_info: JSON.stringify({
    data: [{ domain: 'nsh.cjsjd.com', domain_type: 1, status: 'active' }],
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
  let resolveConfig!: (response: ReturnType<typeof configResponse>) => void
  state.configResponse = () => new Promise((resolve) => { resolveConfig = resolve })
  const user = useUserInfoStore()
  const first = user.ensureChannelDefaultClub()
  const second = user.ensureChannelDefaultClub()
  await nextTurn()

  assert.equal(state.configRequests.length, 1)
  assert.deepEqual(state.defaultRequests, [])
  resolveConfig(configResponse())
  const clubs = await Promise.all([first, second])
  assert.deepEqual(clubs.map((club) => club?.club_id), [97, 97])
  assert.deepEqual(state.defaultRequests, [{ invite_code: 'ksgubmmk' }])
  await user.ensureChannelDefaultClub()
  assert.equal(state.configRequests.length, 1)
  assert.equal(state.defaultRequests.length, 1)
})

test('stale cached domains cannot authorize a base_url request before a fresh domain list arrives', async () => {
  state.cachedConfig = { ...domainConfig, plat_domain_qrcode_info: '{"data":[]}' }
  const app = useAppConfigStore()
  await app.restorePublicConfigCache()
  assert.equal(app.platformDomainsReady, false)

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

test('a real custom domain still sends its full hostname after platform domains load', async () => {
  window.location.href = 'https://club.example.com/#/home?mode=register&i=nvEDgGfw&random_id=92625674'
  await useUserInfoStore().ensureChannelDefaultClub()
  assert.equal(state.configRequests.length, 1)
  assert.deepEqual(state.defaultRequests, [{ base_url: 'club.example.com' }])
})

for (const hostname of ['fanuf.maintest71.com', 'nsh.cjsjd.com']) {
  test(`an official platform hostname does not query the channel default after config resolves: ${hostname}`, async () => {
    window.location.href = `https://${hostname}/#/home`
    assert.equal(await useUserInfoStore().ensureChannelDefaultClub(), null)
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
  ['empty domain lists', async () => configResponse({
    plat_domain_main_info: '{"data":[]}', plat_domain_qrcode_info: '{"data":[]}',
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

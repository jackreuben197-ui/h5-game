import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire, registerHooks, stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { resolveWsProxyUrl } from '../src/utils/h5OnlyDev.ts'
import { encodeHoldemPacket } from '../src/bridge/ws/holdemPacket.ts'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const helperSource = stripTypeScriptTypes(
  readFileSync(new URL('../src/utils/h5OnlyDev.ts', import.meta.url), 'utf8'),
)

test('H5-only switch is explicit and cannot relax production login requirements', async () => {
  for (const [env, expected] of [
    [{ DEV: true, VITE_H5_ONLY: 'true' }, true],
    [{ DEV: true }, false],
    [{ DEV: false, VITE_H5_ONLY: 'true' }, false],
  ] as const) {
    const helper = await import(
      moduleUrl(helperSource.replaceAll('import.meta.env', `(${JSON.stringify(env)})`))
    )
    assert.equal(helper.isH5OnlyDevMode(), expected)
  }
})

test('relative websocket proxy follows the current port and HTTPS while explicit URLs stay intact', () => {
  assert.equal(
    resolveWsProxyUrl('/api/channel/', 'http://127.0.0.1:5174/?invite_code=club#/home'),
    'ws://127.0.0.1:5174/api/channel/',
  )
  assert.equal(
    resolveWsProxyUrl('/api/channel/', 'http://localhost:5175/'),
    'ws://localhost:5175/api/channel/',
  )
  assert.equal(
    resolveWsProxyUrl('/api/channel/', 'https://h5.example/'),
    'wss://h5.example/api/channel/',
  )
  assert.equal(
    resolveWsProxyUrl('wss://test.example:4430/', 'http://localhost:5174/'),
    'wss://test.example:4430/',
  )
})

const mockUrl = moduleUrl(`
  export const state = { h5: true, failProfile: false, calls: [], synced: '', onProfile: () => {} };
  export const game = {
    sessionToken: 'test-token', isGuestAccount: false, isRealUser: true, loginUserId: '', loginAccount: 'test',
    shouldSyncIdentity: token => token !== state.synced,
    setLoginUser: user => { game.loginUserId = user.userId },
    setWebsocketPort() {},
    markIdentitySynced: token => { state.synced = token; state.onProfile() },
  };
  const storage = new Map([['token', 'test-token']]);
  export const localStore = { getItem: (key, fallback) => storage.get(key) ?? fallback, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  export const useGameStore = () => game;
  export const pinia = {};
  export const useUserInfoStore = () => ({ clubList: [] });
  export const useAppConfigStore = () => ({ restorePublicConfigCache: async () => {}, ensureFreshGlobalConfig: async () => false });
  export const getUserWsApi = async () => { state.calls.push('ws-port'); return { port: 9999 } };
  export const getUserInfoApi = async () => { state.calls.push('user-info'); if (state.failProfile) throw new Error('profile unavailable'); return { user: { p_u_id: 'real-user' } } };
  export const getUserClubApi = async () => { state.calls.push('clubs'); return [] };
  export const postDiamondConfigApi = async () => ({ code: 0, data: null });
  export const postPrivateUcConfigApi = async () => ({ code: 0, data: null });
  export const isChannelPackageHost = () => false;
  export const normalizePrivateUcConfig = value => value;
  export const isH5OnlyDevMode = () => state.h5;
  export const createLogger = () => ({ info() {}, warn() {}, debug() {} });
  export const readClubListCache = async () => [];
  export const ensureMultiLanguageTemplateLoaded = async () => {};
  export const setLocale = () => {};
  export const forwardDiamondConfigToCocos = () => {};
  export const forwardGlobalConfigToCocos = () => {};
  export const forwardPrivateUcChargeConfigToCocos = () => {};
  export const forwardUserClubToCocos = () => {};
  export const initUserBalanceSync = () => () => {};
  export const sendBridgeMessage = () => {};
  export const subscribeCocosMessages = () => () => {};
`)
const require = createRequire(import.meta.url)
const { Code } = require('@silenthill/agreement-web/runtime')
const helperUrl = new URL('../src/utils/h5OnlyDev.ts', import.meta.url).href
const wsUrl = new URL('../src/bridge/ws/wsProxy.ts', import.meta.url).href
const aliases = new Map([
  ['@/session/loginSession', new URL('../src/session/loginSession.ts', import.meta.url).href],
  ['@/bridge/ws', wsUrl],
  ['./holdemPacket', new URL('../src/bridge/ws/holdemPacket.ts', import.meta.url).href],
  [
    '@/utils/h5OnlyDev',
    moduleUrl(
      `export { isH5OnlyDevMode } from ${JSON.stringify(mockUrl)}; export { resolveWsProxyUrl } from ${JSON.stringify(helperUrl)};`,
    ),
  ],
  [
    '@/constants/storageKey',
    moduleUrl(
      'export default { TOKEN: "token", WS_PORT: "port", WS_PORT_UPDATED_AT: "port-time" };',
    ),
  ],
  [
    '@silenthill/agreement-web',
    moduleUrl(`export const Code = ${JSON.stringify(Code)}; export const ServerMessageError = {};`),
  ],
  [
    '@bridge-protocol',
    moduleUrl(
      'export const BRIDGE_ACTION = {}; export const BRIDGE_MSG_TYPE = { FORWARD: 0, H5: 1 };',
    ),
  ],
])
for (const name of [
  'api/config',
  'api/user',
  'bridge/sync/h5BusinessSync',
  'i18n',
  'stores/appConfig',
  'stores/game',
  'stores/pinia',
  'stores/userInfo',
  'utils/localStore',
  'utils/multiLanguageTemplate',
  'utils/userClubListCache',
  'utils/channelPackage',
  'utils/logger',
])
  aliases.set(`@/${name}`, mockUrl)
aliases.set('../core/cocosBridgeChannel', mockUrl)
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = aliases.get(specifier)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url !== wsUrl) return nextLoad(url, context)
    const source = readFileSync(new URL(url), 'utf8').replaceAll(
      'import.meta.env',
      '({ VITE_WS_PROXY_URL: "/api/channel/" })',
    )
    return { format: 'module', source: stripTypeScriptTypes(source), shortCircuit: true }
  },
})
const { syncPostAuthData } = await import('../src/session/postAuthSync.ts')
const { default: LoginSession } = await import('../src/session/loginSession.ts')
const { subscribeH5WsMessages } = await import('../src/bridge/ws/wsProxy.ts')
const { state, game } = await import(mockUrl)
hooks.deregister()

function browserHarness() {
  const previous = ['window', 'document', 'WebSocket'].map(
    (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
  )
  const originalNow = Date.now
  let now = 1000
  let nextId = 0
  const timers = new Map<number, { due: number; run: () => void }>()
  const intervals = new Map<number, () => void>()
  const sockets: FakeSocket[] = []
  class FakeSocket {
    static OPEN = 1
    static CONNECTING = 0
    readyState = 0
    binaryType = ''
    onopen: (() => void) | null = null
    onclose: ((event: object) => void) | null = null
    onerror: (() => void) | null = null
    onmessage: ((event: object) => void) | null = null
    url: string
    constructor(url: string) {
      this.url = url
      sockets.push(this)
    }
    send() {}
    open() {
      this.readyState = 1
      this.onopen?.()
    }
    close() {
      this.readyState = 3
      this.onclose?.({ code: 1006, reason: '', wasClean: false })
    }
  }
  const document = { addEventListener() {}, removeEventListener() {} }
  const window = {
    location: new URL('http://127.0.0.1:5174/?invite_code=club#/home'),
    addEventListener() {},
    removeEventListener() {},
    setTimeout(run, delay) {
      const id = ++nextId
      timers.set(id, { due: now + delay, run })
      return id
    },
    clearTimeout(id) {
      timers.delete(id)
    },
    setInterval(run) {
      const id = ++nextId
      intervals.set(id, run)
      return id
    },
    clearInterval(id) {
      intervals.delete(id)
    },
  }
  for (const [key, value] of Object.entries({ window, document, WebSocket: FakeSocket }))
    Object.defineProperty(globalThis, key, { configurable: true, value })
  Date.now = () => now
  function advance(ms: number) {
    const end = now + ms
    while (true) {
      const next = [...timers]
        .filter(([, timer]) => timer.due <= end)
        .sort((a, b) => a[1].due - b[1].due)[0]
      if (!next) break
      const [id, timer] = next
      timers.delete(id)
      now = timer.due
      timer.run()
    }
    now = end
  }
  return {
    sockets,
    advance,
    cleanup() {
      LoginSession.ClearWS()
      advance(10001)
      Date.now = originalNow
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else Reflect.deleteProperty(globalThis, key)
      }
    },
  }
}

test(
  'H5 login completes with real profile data while WS is pending, and socket failure never retries',
  { timeout: 1000 },
  async () => {
    const browser = browserHarness()
    try {
      state.h5 = true
      state.synced = ''
      state.failProfile = false
      const result = await syncPostAuthData()
      assert.deepEqual(result, {
        websocketRequired: false,
        websocketSynced: false,
        userInfoSynced: true,
        userClubSynced: true,
      })
      assert.equal(game.loginUserId, 'real-user')
      assert.equal(browser.sockets[0]?.url, 'ws://127.0.0.1:5174/api/channel/')
      browser.sockets[0]!.close()
      browser.advance(65000)
      assert.equal(browser.sockets.length, 1)
    } finally {
      browser.cleanup()
    }
  },
)

test('H5-only mode still delivers real websocket packets to H5 subscribers when connected', async () => {
  const browser = browserHarness()
  let receivedCode = 0
  const stop = subscribeH5WsMessages((event) => {
    receivedCode = event.packet?.code ?? 0
  })
  try {
    state.h5 = true
    state.synced = ''
    state.failProfile = false
    await syncPostAuthData()
    const socket = browser.sockets[0]!
    socket.open()
    browser.advance(25)
    socket.onmessage?.({ data: encodeHoldemPacket({ code: 155, token: 'test-token' }).slice(4) })
    assert.equal(receivedCode, 155)
  } finally {
    stop()
    browser.cleanup()
  }
})

test('H5-only mode still reports profile failures instead of fabricating a successful login', async () => {
  const browser = browserHarness()
  try {
    state.h5 = true
    state.synced = ''
    state.failProfile = true
    const result = await syncPostAuthData()
    assert.equal(result.userInfoSynced, false)
    assert.equal(result.userClubSynced, true)
    assert.equal(result.websocketRequired, false)
  } finally {
    browser.cleanup()
    state.failProfile = false
  }
})

test(
  'normal integration keeps WS as a login requirement and retains automatic reconnect',
  { timeout: 1000 },
  async () => {
    const browser = browserHarness()
    try {
      state.h5 = false
      state.synced = ''
      const profile = new Promise<void>((resolve) => {
        state.onProfile = resolve
      })
      let completed = false
      const pending = syncPostAuthData().then((result) => {
        completed = true
        return result
      })
      await profile
      assert.equal(completed, false)
      browser.sockets[0]!.close()
      browser.advance(1000)
      assert.equal(browser.sockets.length, 2)
      browser.sockets[1]!.open()
      browser.advance(25)
      const result = await pending
      assert.equal(result.websocketRequired, true)
      assert.equal(result.websocketSynced, true)
    } finally {
      browser.cleanup()
      state.onProfile = () => {}
    }
  },
)

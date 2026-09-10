import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

// 执行生产 HTML 的完整 Telegram 初始化段，覆盖事件顺序而非复制实现。
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(source => source.includes('function initTelegramWebApp()'))!

function boot(options: { fullscreenThrows?: boolean; optionalThrows?: boolean; fullscreen?: boolean } = {}) {
  const styles = new Map<string, string>()
  const windowEvents = new Map<string, Array<() => void>>()
  const documentEvents = new Map<string, Array<() => void>>()
  const events = new Map<string, Array<() => void>>()
  const timers: Array<{ callback: () => void; delay: number }> = []
  const dispatched: string[] = []
  const listen = (map: Map<string, Array<() => void>>, name: string, callback: () => void) => {
    map.set(name, [...(map.get(name) || []), callback])
  }
  const emit = (map: Map<string, Array<() => void>>, name: string) => {
    for (const callback of map.get(name) || []) callback()
  }
  const tg = {
    initData: 'test-only', platform: 'ios', isFullscreen: options.fullscreen ?? true,
    viewportHeight: 300, viewportStableHeight: 850,
    safeAreaInset: { top: 44, bottom: 34 }, contentSafeAreaInset: { top: 50, bottom: 0 },
    onEvent: (name: string, callback: () => void) => listen(events, name, callback),
    requestFullscreen() { if (options.fullscreenThrows) throw new Error('unsupported') },
    lockOrientation() { if (options.optionalThrows) throw new Error('unsupported') },
    ready() {}, expand() {},
  }
  const document = {
    activeElement: { tagName: 'BODY' },
    documentElement: { style: { setProperty: (key: string, value: string) => styles.set(key, value) }, setAttribute() {} },
    getElementById: () => null,
    addEventListener: (name: string, callback: () => void) => listen(documentEvents, name, callback),
  }
  const window: any = {
    Telegram: { WebApp: tg }, location: { search: '', hash: '#/home' },
    innerHeight: 400, innerWidth: 390, screen: { height: 900 },
    visualViewport: { height: 250, addEventListener() {} },
    getComputedStyle: () => ({ getPropertyValue: (key: string) => styles.get(key) || '' }),
    addEventListener: (name: string, callback: () => void) => listen(windowEvents, name, callback),
    dispatchEvent(event: Event) { dispatched.push(event.type); emit(windowEvents, event.type) },
    setTimeout(callback: () => void, delay: number) { timers.push({ callback, delay }); return timers.length },
    clearTimeout() {}, setInterval() { return 1 }, clearInterval() {},
  }
  runInNewContext(script, { window, document, Event, URLSearchParams, console: { log() {}, warn() {} } })
  return { window, document, tg, styles, dispatched, events, timers,
    emit: (name: string) => emit(events, name),
    focusout: () => emit(documentEvents, 'focusout') }
}

test('launch/expand height differences without input focus do not suppress safe area', () => {
  const app = boot()
  assert.equal(app.window.__H5_SAFE_AREA_TOP__, 94)
  assert.equal(app.styles.get('--tg-safe-area-guard-top'), '94px')
  assert.ok(app.dispatched.includes('h5:safe-area-changed'))
})

test('fullscreen failure and unsupported optional methods do not disable safe-area subscriptions', () => {
  const app = boot({ fullscreenThrows: true, optionalThrows: true })
  app.tg.safeAreaInset.top = 59
  app.emit('safeAreaChanged')
  assert.equal(app.window.__H5_SAFE_AREA_TOP__, 109)
  assert.ok(app.events.has('fullscreenFailed'))
})

test('late fullscreen/safe-area events update geometry after initial startup', () => {
  const app = boot({ fullscreen: false })
  app.tg.isFullscreen = true
  app.tg.safeAreaInset.top = 59
  app.emit('fullscreenChanged')
  assert.equal(app.window.__H5_SAFE_AREA_TOP__, 109)
  const before = app.dispatched.length
  app.emit('viewportChanged')
  assert.equal(app.dispatched.length, before, 'unchanged insets should not resend geometry')
})

test('actual keyboard freezes geometry and focusout retries after keyboard closing', () => {
  const app = boot()
  app.document.activeElement.tagName = 'INPUT'
  app.tg.safeAreaInset.top = 59
  app.emit('safeAreaChanged')
  assert.equal(app.window.__H5_SAFE_AREA_TOP__, 94)
  app.document.activeElement.tagName = 'BODY'
  app.window.__H5_KEYBOARD_CLOSING__ = true
  app.focusout()
  app.window.__H5_KEYBOARD_CLOSING__ = false
  for (const timer of app.timers.filter(timer => timer.delay === 300 || timer.delay === 1000)) timer.callback()
  assert.equal(app.window.__H5_SAFE_AREA_TOP__, 109)
})

test('late safe area is forwarded after the Cocos handshake without resending token', async () => {
  const { transpileModule, ModuleKind } = await import('typescript')
  const source = readFileSync(new URL('../src/bridge/core/cocosBridgeChannel.ts', import.meta.url), 'utf8')
  const code = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } }).outputText
  const app = boot()
  const sent: Array<{ action: string; payload: any }> = []
  app.window.__CC_READY__ = true
  app.window.CocosBridge = { sendMessage(action: string, payload: any) { sent.push({ action, payload }) } }
  const modules: Record<string, unknown> = {
    '@bridge-protocol': {
      BRIDGE_ACTION: { H5_READY: 'h5Ready' }, BRIDGE_MSG_TYPE: { H5: 1 },
      createBridgeMessage: (action: string, payload: unknown, options: object) => ({ action, payload, ...options }),
      normalizeBridgeMsgType: (value: number) => value,
    },
    '@/constants/storageKey': { default: { TOKEN: 'token' } },
    '@/utils/localStore': { localStore: { getItem: () => 'existing-token' } },
    '@/utils/logger': { createLogger: () => ({ info() {}, debug() {}, warn() {} }) },
    '@/components/Toast': {}, '../channels/dialogChannel': {},
  }
  runInNewContext(code, { window: app.window, exports: {}, Blob,
    require: (name: string) => {
      assert.ok(name in modules, `unexpected dependency ${name}`)
      return modules[name]
    },
  })
  assert.equal(sent.length, 1)
  assert.equal(sent[0].payload.token, 'existing-token')
  app.tg.safeAreaInset.top = 59
  app.emit('safeAreaChanged')
  assert.equal(sent.length, 2)
  assert.equal(sent[1].action, 'h5Ready')
  assert.equal(sent[1].payload.safeArea.top, 109)
  assert.equal('token' in sent[1].payload, false)
})

const sdkLoader = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(source => source.includes('document.write('))!

function loadSdk(hash: string, storedParams: string | null, storageThrows = false) {
  const scripts: string[] = []
  const window: any = {
    location: { search: '', hash },
    sessionStorage: { getItem() { if (storageThrows) throw new Error('blocked'); return storedParams } },
  }
  runInNewContext(sdkLoader, { window, document: { write: (value: string) => scripts.push(value) } })
  return { window, scripts }
}

test('route hash refresh retains Telegram SDK loading through its session initParams', () => {
  const first = loadSdk('#tgWebAppData=test-only&tgWebAppVersion=8.0', null)
  assert.equal(first.scripts.length, 1)
  const refresh = loadSdk('#/home', JSON.stringify({ tgWebAppData: 'test-only', tgWebAppVersion: '8.0' }))
  assert.equal(refresh.scripts.length, 1)
  assert.equal(refresh.window.__H5_TG_MINI_APP__, true)
})

test('ordinary browser and broken session cache do not enable Telegram mode', () => {
  for (const stored of [null, '{}', 'broken-json']) {
    assert.equal(loadSdk('#/home', stored).scripts.length, 0)
  }
  assert.equal(loadSdk('#tgWebAppData=test-only', null, true).scripts.length, 1)
})

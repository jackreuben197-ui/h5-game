import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { parse, compileScript } from 'vue/compiler-sfc'
import * as vue from 'vue'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const filename = new URL('../src/components/BridgePanel/panels/BridgeMttSettlementPanel.vue', import.meta.url)
const { descriptor } = parse(readFileSync(filename, 'utf8'))
const compiled = compileScript(descriptor, { id: 'mtt-settlement-test' })
const code = ts.transpileModule(compiled.content, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText

function fixture(inTable: boolean, overrides: Record<string, unknown> = {}) {
  const mounted: Array<() => Promise<void>> = []
  const unmounted: Array<() => void> = []
  const routes: unknown[] = []
  const events: string[] = []
  const timers: Array<() => void> = []
  let resolveAward: ((value: unknown) => void) | undefined
  const props = vue.reactive({ panelProps: { matchId: 456, inTable, isRebuy: false,
    canContinueWatching: false, watchingPending: true, ...overrides },
    closePanel: (event: string) => events.push(event), emitPanelEvent() {} })
  const module = { exports: {} as any }
  const store = { bootstrapMttList() {}, async fetchMttList() {}, async fetchAllMttSngIds() {} }
  runInNewContext(code, { module, exports: module.exports, console: { log() {} },
    setTimeout: (callback: () => void) => { timers.push(callback); return timers.length }, clearTimeout() {},
    require(name: string) {
      if (name === 'vue') return { ...vue, onMounted: (fn: () => Promise<void>) => mounted.push(fn),
        onUnmounted: (fn: () => void) => unmounted.push(fn) }
      if (name === 'vue-router') return { useRouter: () => ({ replace: async (route: unknown) => { routes.push(route) } }) }
      if (name === '@/stores/mttList') return { useMttListStore: () => store }
      if (name === '@/api/roomcenter') return {
        getRoomcenterMttDetailApi: async () => ({ code: 0, data: {} }),
        getRoomcenterMttMyawardApi: () => new Promise(resolve => { resolveAward = resolve }),
      }
      if (name === '@/api/misc') return { postMiscGameDescriptionInfoApi: async () => ({ code: 0, data: { list: [] } }) }
      if (name === '@/i18n') return { t: (key: string) => key, getLocale: () => 'cn' }
      if (name === '@/utils/multiLanguageTemplate') return { resolveTemplateTextByKey: (key: string) => key }
      if (name === '@/utils/time') return { formatDateTime: () => '', toTimestampMs: () => 0 }
      if (name.startsWith('@/')) return {}
      return require(name)
    },
  })
  const component = module.exports.default
  const setup = component.setup(props, { expose() {} })
  return { props, setup, events, routes, timers,
    mount: () => mounted[0](), unmount: () => unmounted.forEach(fn => fn()),
    award(value: unknown) { assert.ok(resolveAward); resolveAward(value) } }
}

test('桌内结算加载时不跳转列表，观战按钮只在原桌进房成功后响应', async () => {
  const f = fixture(true)
  const mounting = f.mount()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.routes.length, 0)
  f.setup.handleContinueWatching()
  assert.deepEqual(f.events, [])
  f.props.panelProps.canContinueWatching = true
  f.props.panelProps.watchingPending = false
  f.setup.handleContinueWatching()
  assert.deepEqual(f.events, ['continueWatching'])
  f.award({ code: 0, data: { rank: 10 } })
  await mounting
})

test('桌内重购与返回大厅交由 Cocos 完成退桌和导航，旧重购入口仍可用', async () => {
  const f = fixture(true)
  await f.setup.handleRebuy()
  f.setup.handleReturnLobby()
  assert.deepEqual(f.events, ['rebuy', 'returnLobby'])
  assert.equal(f.routes.length, 0)
  const legacy = fixture(false)
  await legacy.setup.handleRebuy()
  assert.equal((legacy.routes[0] as any).name, 'mtt-detail')
  assert.equal((legacy.routes[0] as any).query.id, '456')
})

test('关闭结算后晚到的奖励回包不会继续创建轮询定时器', async () => {
  const f = fixture(true)
  const mounting = f.mount()
  await new Promise(resolve => setImmediate(resolve))
  f.unmount()
  f.award({ code: 0, data: null })
  await mounting
  assert.equal(f.timers.length, 0)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { AxiosError } from 'axios'

const runtime = { module: { exports: {} } }
runInNewContext(readFileSync(new URL('../public/h5-cc-i18n.min.js', import.meta.url), 'utf8'), runtime)
const sharedI18n = runtime.module.exports as {
  setLocale: (locale: string) => void
  get: (key: string, fallback?: string) => string
}
Object.assign(globalThis, { __H5_CC_I18N__: sharedI18n })

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const stubUrl = moduleUrl(`
  export const state = { body: null, error: null, toasts: [], path: '' };
  export default { async post(path) {
    state.path = path;
    if (state.error) throw state.error;
    return { data: state.body };
  } };
  export const forwardRoomsListToCocos = () => {};
  export const createLogger = () => ({ warn() {} });
`)
const toastUrl = moduleUrl(`
  import { state } from ${JSON.stringify(stubUrl)};
  import { resolveGameToastMessage } from '@/components/Toast/resolveMessage';
  export { resolveGameToastMessage };
  export const showGameToast = (message) => state.toasts.push(resolveGameToastMessage(message));
`)
const aliases = new Map([
  ['@/api/http', stubUrl],
  ['@/components/Toast', toastUrl],
  ['@/components/Toast/resolveMessage', new URL('../src/components/Toast/resolveMessage.ts', import.meta.url).href],
  ['@/bridge/sync', stubUrl],
  ['@/utils/logger', stubUrl],
  ['@/i18n', new URL('../src/i18n/index.ts', import.meta.url).href],
  ['@/constants/storageKey', new URL('../src/constants/storageKey.ts', import.meta.url).href],
  ['@/utils/localStore', new URL('../src/utils/localStore.ts', import.meta.url).href],
  ['./parser', new URL('../src/i18n/parser.ts', import.meta.url).href],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = aliases.get(specifier)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})
const { getRoomcenterMttRegistrationRestrictionsApi, mttBuyInApi } = await import('../src/api/roomcenter.ts')
const { t } = await import('../src/i18n/index.ts')
const { state } = await import(stubUrl)
hooks.deregister()

test('the restriction lookup uses the documented detail route and accepts nested or top-level settings', async () => {
  const settings = { limit_gps: true, limit_gps_distance: 80, limit_ip: false }
  for (const data of [settings, { mtt: settings }]) {
    state.body = { code: 0, data }
    const result = await getRoomcenterMttRegistrationRestrictionsApi(7)
    assert.equal(state.path, '/roomcenter/mtt/7')
    assert.equal(result.data?.limit_gps, true)
    assert.equal(result.data?.limit_gps_distance, 80)
    assert.equal(result.data?.limit_ip, false)
  }
})

test('MTT restriction errors use the localized error code text and API distance', async () => {
  state.toasts.length = 0
  state.body = { code: 10023, message: '', data: null }
  await mttBuyInApi(7)
  state.body = { code: 10024, message: '', data: { limit_gps_distance: 80 } }
  await mttBuyInApi(7, {}, 50)
  state.body = { code: 10024, message: '', data: null }
  await mttBuyInApi(7, {}, 50)
  await mttBuyInApi(7)
  for (const code of [10025, 10026]) {
    state.body = { code, message: '', data: null }
    await mttBuyInApi(7)
  }
  assert.deepEqual(state.toasts, [
    '报名失败，该 IP 已有其他账号报名',
    '报名失败，与其他报名玩家距离不足 80 米',
    '报名失败，与其他报名玩家距离不足 50 米',
    '报名失败，与其他报名玩家距离不足',
    '本场比赛需要验证位置，请开启定位权限后报名。',
    '无法获取您的位置，请检查定位设置后重试。',
  ])
})

test('MTT buy-in localizes a restriction returned with an HTTP error', async () => {
  const data = { code: 10024, message: '', data: { limit_gps_distance: 100 } }
  state.error = AxiosError.from(new Error('Conflict'))
  state.error.response = { data, status: 409 }
  try {
    assert.equal(await mttBuyInApi(7), data)
    assert.equal(state.toasts.at(-1), '报名失败，与其他报名玩家距离不足 100 米')
  } finally {
    state.error = null
  }
})

test('the shared runtime contains location and registration error messages in all four locales', () => {
  for (const locale of ['zh-CN', 'zh-TW', 'en', 'pt']) {
    sharedI18n.setLocale(locale)
    for (const key of [
      'ServerErrorCode_10023',
      'ServerErrorCode_10024',
      'ServerErrorCode_10025',
      'ServerErrorCode_10026',
      'MttApplyGpsTooClose',
    ]) {
      assert.ok(sharedI18n.get(key, ''), `${locale}/${key}`)
    }
    assert.match(sharedI18n.get('ServerErrorCode_10024'), /\{distance\}/)
  }
  assert.equal(t('ServerErrorCode_10025'), '本场比赛需要验证位置，请开启定位权限后报名。')
  assert.equal(t('ServerErrorCode_10026'), '无法获取您的位置，请检查定位设置后重试。')
})

test('ordinary table codes keep their original translations', async () => {
  state.toasts.length = 0
  state.body = { code: 31027, message: '', data: null }
  await mttBuyInApi(7)
  state.body = { code: 31028, message: '', data: null }
  await mttBuyInApi(7)
  assert.deepEqual(state.toasts, ['IP相同，无法坐下', 'GPS位置相近，无法坐下'])
})

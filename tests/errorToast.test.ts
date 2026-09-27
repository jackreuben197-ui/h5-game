import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const i18nMockUrl = moduleUrl(`
  const messages = {
    ServerErrorCode_20021: '您有多笔充值订单未支付，请去记录中查看',
  };
  export function t(key) { return messages[key] || key; }
`)
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/i18n') {
      return { url: i18nMockUrl, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
const { resolveGameToastMessage } = await import(
  '../src/components/Toast/resolveMessage.ts'
)
hooks.deregister()

test('unmatched server error i18n keys do not produce toast text', () => {
  assert.equal(resolveGameToastMessage('ServerErrorCode_90020'), '')
})

test('matched server error i18n keys use their localized text', () => {
  assert.equal(
    resolveGameToastMessage('ServerErrorCode_20021'),
    '您有多笔充值订单未支付，请去记录中查看',
  )
})

test('ordinary toast messages are preserved', () => {
  assert.equal(resolveGameToastMessage('请求失败，请稍后再试'), '请求失败，请稍后再试')
})

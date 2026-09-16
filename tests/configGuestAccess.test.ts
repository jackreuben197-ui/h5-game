import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const httpMockUrl = moduleUrl(`
  export const calls = [];
  export default {
    async post(...args) {
      calls.push(args);
      return { data: { code: 0, data: [] } };
    },
  };
`)
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/api/http') {
      return { url: httpMockUrl, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
const { getMultiLanguageTemplateApi, postOnlineWithdrawTypeListApi } = await import('../src/api/config.ts')
const { calls } = await import(httpMockUrl)
hooks.deregister()

test('multi-language templates allow authenticated guest accounts', async () => {
  calls.length = 0
  await getMultiLanguageTemplateApi()
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], '/config/multi_language/template')
  assert.equal(calls[0][2]?.allowGuestAccount, true)
})

test('online withdraw type list allows authenticated guest accounts for preview', async () => {
  calls.length = 0
  await postOnlineWithdrawTypeListApi({ club_id: 123 })
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], '/config/online_withdraw_type_list')
  assert.equal(calls[0][1]?.club_id, 123)
  assert.equal(calls[0][2]?.allowGuestAccount, true)
})

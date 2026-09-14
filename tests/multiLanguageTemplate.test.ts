import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const apiMockUrl = moduleUrl(`
  export const calls = [];
  export const responses = [];
  export async function getMultiLanguageTemplateApi() {
    calls.push('fetch');
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return response;
  }
`)
const indexedDbMockUrl = moduleUrl(`
  const records = new Map();
  export const PUBLIC_STORE_MULTI_LANGUAGE_TEMPLATE = 'multi_language_template';
  export async function openPublicIndexedDB() {
    return {
      transaction() {
        const tx = {
          error: null,
          objectStore() {
            return {
              getAll() {
                const request = {};
                queueMicrotask(() => {
                  request.result = [...records.values()];
                  request.onsuccess?.();
                });
                return request;
              },
              clear() { records.clear(); },
              put(value, key) { records.set(key, value); },
            };
          },
        };
        queueMicrotask(() => tx.oncomplete?.());
        return tx;
      },
    };
  }
`)
const stubs: Record<string, string> = {
  '@/api/config': apiMockUrl,
  '@/api/models/config': moduleUrl('export {}'),
  '@/constants/storageKey': moduleUrl("export default { MULTI_LANGUAGE_TEMPLATE_CACHE: 'templates' }"),
  '@/i18n': moduleUrl("export const getLocale = () => 'cn'"),
  '@/utils/indexedDB': indexedDbMockUrl,
  '@/utils/localStore': moduleUrl('export const localStore = { getItem: (_key, fallback) => fallback, removeItem() {} }'),
  '@/utils/logger': moduleUrl('export const createLogger = () => ({ warn() {} })'),
}
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return stubs[specifier] ? { url: stubs[specifier], shortCircuit: true } : nextResolve(specifier, context)
  },
})
const templateModule = await import('../src/utils/multiLanguageTemplate.ts')
const apiMock = await import(apiMockUrl)
hooks.deregister()

test('failed or invalid first loads remain retryable for an authenticated session', async () => {
  apiMock.responses.push(new Error('not authenticated'))
  await templateModule.ensureMultiLanguageTemplateLoaded()
  assert.equal(templateModule.resolveTemplateTextByKey('MTT2025'), '')

  apiMock.responses.push({ code: 90010, data: null })
  await templateModule.ensureMultiLanguageTemplateLoaded()
  assert.equal(templateModule.resolveTemplateTextByKey('MTT2025'), '')

  apiMock.responses.push({
    code: 0,
    data: [{ template_id: 'MTT2025', cn_name: '周末锦标赛', us_name: 'Weekend Tournament' }],
  })
  await templateModule.ensureMultiLanguageTemplateLoaded()
  assert.equal(templateModule.resolveTemplateTextByKey('MTT2025-01'), '周末锦标赛-01')
  assert.equal(apiMock.calls.length, 3)

  await templateModule.ensureMultiLanguageTemplateLoaded()
  assert.equal(apiMock.calls.length, 3)
})

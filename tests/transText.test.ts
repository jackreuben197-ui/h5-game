import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const translations: Record<string, string> = {
  OpCodeString_CLUBTOUSER: '发放',
  OpCodeString_CLUBRECOVEUSER: '回收',
}

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/i18n') {
      return {
        url: moduleUrl(`
          const translations = ${JSON.stringify(translations)};
          export const getLocale = () => 'zh-CN';
          export const t = (key) => translations[key] ?? key;
        `),
        shortCircuit: true,
      }
    }
    if (specifier === '@/utils/multiLanguageTemplate') {
      return {
        url: moduleUrl('export const resolveTemplateTextByKey = () => "";'),
        shortCircuit: true,
      }
    }
    return nextResolve(specifier, context)
  },
})
const { resolveBillOpCodeText } = await import('../src/utils/transText.ts')
hooks.deregister()

test('club UC issue and reclaim titles stay concise on every wallet tab', () => {
  for (const activeTab of [1, 2, 4]) {
    assert.equal(resolveBillOpCodeText({ opCode: 'CLUBTOUSER' }, activeTab), '发放')
    assert.equal(resolveBillOpCodeText({ opCode: 'CLUBRECOVEUSER' }, activeTab), '回收')
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { statSync } from 'node:fs'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const httpMockUrl = moduleUrl(`
  export default {
    defaults: { baseURL: '' },
    async post() { return { data: { code: 0 } }; }
  };
`)

function resolveFilePath(basePath: string): string | null {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}/index.ts`,
    `${basePath}.vue`,
    `${basePath}.js`,
  ]
  for (const c of candidates) {
    try {
      const stat = statSync(c)
      if (stat.isFile()) return c
    } catch {
      // ignore
    }
  }
  return null
}

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/api/http') {
      return { url: httpMockUrl, shortCircuit: true }
    }
    if (specifier.endsWith('.vue')) {
      return { url: 'data:text/javascript,export default {}', shortCircuit: true }
    }
    if (specifier.startsWith('@/')) {
      const rel = specifier.slice(2)
      const absPath = new URL(`../src/${rel}`, import.meta.url).pathname.slice(1)
      const found = resolveFilePath(absPath)
      if (found) {
        if (found.endsWith('.vue')) {
          return { url: 'data:text/javascript,export default {}', shortCircuit: true }
        }
        return { url: new URL(`file:///${found.replace(/\\/g, '/')}`).href, shortCircuit: true }
      }
    }
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const parentUrl = new URL(context.parentURL)
      const targetUrl = new URL(specifier, parentUrl)
      const found = resolveFilePath(targetUrl.pathname.slice(1))
      if (found) {
        if (found.endsWith('.vue')) {
          return { url: 'data:text/javascript,export default {}', shortCircuit: true }
        }
        return { url: new URL(`file:///${found.replace(/\\/g, '/')}`).href, shortCircuit: true }
      }
    }
    return nextResolve(specifier, context)
  },
})

const { resolveApiBaseUrl, appConfig } = await import('../src/utils/appConfig.ts')
hooks.deregister()

test('resolveApiBaseUrl returns valid absolute URL in production build when baseApi is relative or empty', () => {
  const originalBaseApi = appConfig.baseApi
  const originalApiDomains = appConfig.apiDomains

  try {
    appConfig.baseApi = '/api'
    appConfig.apiDomains = []

    const resolved = resolveApiBaseUrl()
    assert.match(resolved, /^https?:\/\//i)
    assert.match(resolved, /\/api$/i)
  } finally {
    appConfig.baseApi = originalBaseApi
    appConfig.apiDomains = originalApiDomains
  }
})

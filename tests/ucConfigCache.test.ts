import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { createPinia, setActivePinia } from 'pinia'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const indexedDbMockUrl = moduleUrl(`
  export const writes = [];
  export const PUBLIC_STORE_APP_CONFIG = 'app_config';
  export const PUBLIC_STORE_DIAMOND_CONFIG = 'diamond_config';
  export const PUBLIC_STORE_UC_CONFIG = 'uc_config';
  export async function readPublicCache() { return null; }
  export async function readPublicCacheEntries() { return []; }
  export async function replacePublicCacheEntries(store, entries) {
    writes.push({ store, entries: structuredClone(entries) });
  }
`)
const stubs: Record<string, string> = {
  '@/api/config': moduleUrl(`
    export async function postBeforeLoginConfigApi() { return { code: 0, data: null }; }
    export async function postGlobalConfigApi() { return { code: 0, data: null }; }
  `),
  '@/api/models/config': moduleUrl('export {}'),
  '@/constants/storageKey': moduleUrl(`
    export default {
      APP_CONFIG_CACHE: 'app_config_cache',
      DIAMOND_CONFIG_CACHE: 'diamond_config_cache',
    };
  `),
  '@/utils/indexedDB': indexedDbMockUrl,
  '@/utils/localStore': moduleUrl(`
    export const localStore = {
      getItem: (_key, fallback) => fallback,
      removeItem() {},
    };
  `),
  '@/utils/channelPackage': moduleUrl(`
    export const CHANNEL_PACKAGE_UC_CHARGE_ENABLED = true;
    export function configurePlatformDomains() {}
    export function getPrivateUcChargeConfigs() {
      return Array.from({ length: 9 }, (_, index) => ({ feeType: index + 1, price: 0 }));
    }
    export function isChannelPackageHost() { return true; }
  `),
}
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return stubs[specifier]
      ? { url: stubs[specifier], shortCircuit: true }
      : nextResolve(specifier, context)
  },
})
const appConfigModule = await import('../src/stores/appConfig.ts')
const indexedDbMock = await import(indexedDbMockUrl)
hooks.deregister()

test('private UC config persists plain values instead of Pinia proxies', async () => {
  setActivePinia(createPinia())
  const store = appConfigModule.useAppConfigStore()
  store.setPrivateUcConfig({
    chargeItems: [{ feeType: 6, price: 1 }],
    diamondConfig: {
      8: {
        1000: {
          id: 36,
          config_type: 8,
          status: 1,
          type_ext: 1000,
          start_time: 0,
          end_time: 0,
          setting: [
            { sb: 1000, blind_type: 3, price: 1, discount_price: 1, discount: 1 },
          ],
        },
      },
    },
    mttRecordFeeConfig: null,
  })

  await new Promise<void>((resolve) => setImmediate(resolve))

  assert.equal(indexedDbMock.writes.length, 1)
  assert.equal(indexedDbMock.writes[0].store, 'uc_config')
  assert.deepEqual(
    indexedDbMock.writes[0].entries.map((entry: { key: IDBValidKey }) => entry.key),
    ['charge_items', 'mtt_record_fee_config', 8],
  )
  assert.equal(indexedDbMock.writes[0].entries[2].value[1000].setting[0].price, 1)
})

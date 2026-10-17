import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`

test('wallet price list is available to an authenticated guest account', async () => {
  const httpMockUrl = moduleUrl(`
    export const calls = [];
    export default {
      async post(...args) {
        calls.push(args);
        return { data: { code: 0, data: { list: [], pay_types: [] } } };
      },
    };
  `)
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === '@/api/http') return { url: httpMockUrl, shortCircuit: true }
      return nextResolve(specifier, context)
    },
  })

  try {
    const { postPropGoldPriceListApi } = await import('../src/api/prop.ts')
    const { calls } = await import(httpMockUrl)
    await postPropGoldPriceListApi({ club_id: 37 }, 37)

    assert.equal(calls.length, 1)
    assert.equal(calls[0][0], '/prop/gold/price/list')
    assert.equal(calls[0][2]?.headers?.['X-Club'], '37')
    assert.equal(calls[0][2]?.allowGuestAccount, true)
  } finally {
    hooks.deregister()
  }
})

test('wallet store falls back to the public channel club for preview pricing', async () => {
  const mockUrl = moduleUrl(`
    export const calls = [];
    export const useUserInfoStore = () => ({
      currentClub: null,
      clubList: [],
      channelDefaultClub: { club_id: 73 },
    });
    export const postPropGoldPriceListApi = async (...args) => {
      calls.push(args);
      return {
        code: 0,
        data: {
          list: [],
          pay_types: [],
          first_recharge_reward: [{
            start_amount: 100,
            end_amount: 1000000,
            rewards: [{ prop_id: 654, prop_name: 'MTT ticket', prop_value: 50000, quantity: 1 }],
          }],
          daily_recharge_reward: [],
        },
      };
    };
    export const postClubFundOrderListApi = async () => ({ code: 0, data: { list: [] } });
    export const isPrivateDomainMode = () => false;
    export const ref = value => ({ value });
    export const computed = getter => ({ get value() { return getter(); } });
    export const defineStore = (_id, setup) => {
      let store;
      return () => store ||= setup();
    };
  `)
  const stubs: Record<string, string> = {
    vue: mockUrl,
    pinia: mockUrl,
    '@/api/prop': mockUrl,
    '@/api/order': mockUrl,
    '@/stores/userInfo': mockUrl,
    '@/utils/channelPackage': mockUrl,
    '@/features/rechargeReward/model':
      new URL('../src/features/rechargeReward/model.ts', import.meta.url).href,
  }
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      return stubs[specifier] ? { url: stubs[specifier], shortCircuit: true } : nextResolve(specifier, context)
    },
  })

  try {
    const { useWalletStore } = await import('../src/stores/wallet.ts')
    const { calls } = await import(mockUrl)
    const walletStore = useWalletStore()
    await walletStore.loadPriceList()

    assert.equal(calls.length, 1)
    assert.equal(calls[0][0]?.club_id, 73)
    assert.equal(calls[0][0]?.source_type, 2)
    assert.deepEqual(calls[0][0]?.gold_types, [1])
    assert.equal(calls[0][1], 73)
    assert.equal(walletStore.hasRechargeRewardActivity.value, true)
    assert.deepEqual(walletStore.firstRechargeRewardTiers.value, [
      {
        startAmount: 1,
        endAmount: 10_000,
        rewards: [
          {
            propId: 654,
            propName: 'MTT ticket',
            propValue: 500,
            quantity: 1,
            propIcon: '',
          },
        ],
      },
    ])
    assert.deepEqual(walletStore.calculateUsdtPrice(10_000, 2, 0.05, 2), {
      apiPayPrice: 47.5,
      totalUiPrice: 47.5,
    })
    assert.deepEqual(walletStore.calculateUsdtPrice(10_000, 2, 0.05, 1), {
      apiPayPrice: 50,
      totalUiPrice: 50,
    })
    assert.deepEqual(walletStore.calculateUsdtPrice(10_000, 0, 0), {
      apiPayPrice: 0,
      totalUiPrice: 0,
    })
    assert.deepEqual(walletStore.calculateRechargeUsdtPrice(10_000, 0, 0), {
      apiPayPrice: 0,
      totalUiPrice: 0,
    })
    assert.equal(walletStore.calculateCustomerServicePrice(10_000, Number.NaN, 0), 0)
    assert.deepEqual(walletStore.calculateRechargeUsdtPrice(10_000, 2, 0.05, 2, 0.1), {
      apiPayPrice: 47.5,
      totalUiPrice: 47.5,
    })
    assert.deepEqual(walletStore.calculateCustomerServicePrice(10_000, 2, 0.05, 1, 0.1), 45)
    assert.deepEqual(walletStore.calculateCustomerServicePrice(10_000, 2, 0.05, 2, 0.1), 47.5)
    assert.equal(walletStore.calculateRechargeUsdtPrice(7, 30, 0.0213, 2, 0.0137).totalUiPrice, 0.0023)
  } finally {
    hooks.deregister()
  }
})

test('wallet recharge and record requests keep the explicitly directed club context', async () => {
  const httpMockUrl = moduleUrl(`
    export const calls = [];
    export default {
      async post(...args) {
        calls.push(args);
        return { data: { code: 0, data: { list: [] } } };
      },
    };
  `)
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === '@/api/http') return { url: httpMockUrl, shortCircuit: true }
      return nextResolve(specifier, context)
    },
  })

  try {
    const { postClubFundOrderListApi, postClubPlayerOrderRecordApi, postRechargeGoldApi } =
      await import('../src/api/order.ts')
    const { calls } = await import(httpMockUrl)

    await postClubFundOrderListApi({ my_order: true }, 91)
    await postClubPlayerOrderRecordApi({ order_type: 1 }, 91)
    await postRechargeGoldApi({ amount: 10_000 }, 91)

    assert.equal(calls[0][2]?.xClub, 91)
    assert.equal(calls[1][2]?.xClub, 91)
    assert.equal(calls[2][2]?.xClub, 91)
  } finally {
    hooks.deregister()
  }
})

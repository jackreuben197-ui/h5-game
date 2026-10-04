import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: new URL('https://fanuf.maintest71.com/#/'),
    history: { replaceState() {} },
  },
})

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const stubs: Record<string, string> = {
  '@/constants/storageKey': moduleUrl(
    'export default { LOGIN_DATA: "login_data", AGENT_INVITE_CODE: "agent_invite_code" }',
  ),
  '@/utils/localStore': moduleUrl(
    'export const localStore = { getItem: () => "", setItem() {}, removeItem() {} }',
  ),
  '@/utils/channelHost': new URL('../src/utils/channelHost.ts', import.meta.url).href,
}
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return stubs[specifier]
      ? { url: stubs[specifier], shortCircuit: true }
      : nextResolve(specifier, context)
  },
})
const channelPackage = await import('../src/utils/channelPackage.ts')
hooks.deregister()

test('private UC config publishes all nine defined fee types with zero prices hidden', () => {
  assert.deepEqual(channelPackage.getPrivateUcChargeConfigs(), [
    { feeType: 1, price: 0 },
    { feeType: 2, price: 0 },
    { feeType: 3, price: 0 },
    { feeType: 4, price: 0 },
    { feeType: 5, price: 0 },
    { feeType: 6, price: 0 },
    { feeType: 7, price: 0 },
    { feeType: 8, price: 0 },
    { feeType: 9, price: 0 },
  ])
  assert.equal(channelPackage.CHANNEL_PACKAGE_UC_CHARGE_ENABLED, true)
  assert.equal(channelPackage.isPrivateUcChargeVisible(0, 'club.example.com'), false)
})

test('private UC API amounts are scaled and blind-level settings keep type_ext detail', () => {
  const normalized = channelPackage.normalizePrivateUcConfig({
    club_id: 97,
    data: [
      { fee_type: 1, config_kind: 1, str_value: '{"price":10000}' },
      { fee_type: 2, config_kind: 1, value: 20000, str_value: '' },
      {
        fee_type: 3,
        config_kind: 1,
        str_value: '{"status":1,"floor_price":30000,"ratio":0.1,"decimal_type":3,"discount":1,"start_time":0,"end_time":0}',
      },
      {
        fee_type: 4,
        config_kind: 1,
        str_value: '{"raw_price":40000,"pay_price":30000,"status":1,"start_time":0,"end_time":0}',
      },
      {
        fee_type: 5,
        config_kind: 1,
        value: 99,
        str_value: '{"game_delay_times":99,"free_addtime_daily_times":99}',
      },
      {
        fee_type: 6,
        config_kind: 1,
        value: 99,
        str_value: '{"view_type":2,"free_count":99}',
      },
      {
        id: 17,
        fee_type: 5,
        config_kind: 2,
        config_type: 2,
        type_ext: 1210,
        status: 1,
        setting: '[{"sb":10,"blind_type":1,"price":1100,"discount_price":500,"discount":0.5}]',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        start_time: 1767225600,
        end_time: 1798761599,
      },
      {
        id: 38,
        fee_type: 6,
        config_kind: 2,
        config_type: 31,
        type_ext: 0,
        status: 1,
        setting: '[{"sb":10,"blind_type":1,"price":900,"discount_price":0,"discount":1}]',
        start_date: '',
        end_date: '',
        start_time: 0,
        end_time: 0,
      },
      {
        id: 39,
        fee_type: 7,
        config_kind: 2,
        config_type: 9,
        type_ext: 210,
        status: 1,
        setting: '[{"sb":10,"blind_type":1,"record_floor":1200,"record_ratio":0.5,"discount":1,"decimal_type":2}]',
        start_date: '',
        end_date: '',
        start_time: 0,
        end_time: 0,
      },
    ],
    gold_type: 1,
    tribe_id: 35,
    unit_scale: 100,
  } as any)

  assert.deepEqual(normalized.chargeItems, [
    { feeType: 1, price: 100 },
    { feeType: 2, price: 200 },
    { feeType: 3, price: 300 },
    { feeType: 4, price: 400 },
    { feeType: 5, price: 0 },
    { feeType: 6, price: 0 },
    { feeType: 7, price: 0 },
    { feeType: 8, price: 0 },
    { feeType: 9, price: 0 },
  ])
  assert.deepEqual(normalized.mttRecordFeeConfig, {
    status: 1,
    floor_price: 300,
    ratio: 0.1,
    decimal_type: 3,
    discount: 1,
    start_time: 0,
    end_time: 0,
  })
  assert.equal(normalized.diamondConfig[2][1210].setting[0].sb, 10)
  assert.equal(normalized.diamondConfig[2][1210].setting[0].price, 11)
  assert.equal(normalized.diamondConfig[2][1210].setting[0].discount_price, 5)
  assert.equal(normalized.diamondConfig[31][0].setting[0].price, 9)
  assert.equal(normalized.diamondConfig[9][210].setting[0].record_floor, 12)
  assert.equal(normalized.diamondConfig[9][210].setting[0].record_ratio, 0.5)
})

test('runtime platform domains drive package classification and invite URLs', () => {
  channelPackage.configurePlatformDomains({
    plat_domain_main_info:
      '{"data":[{"domain":"fanuf.maintest71.com","domain_type":2,"status":"active"}]}',
    plat_domain_qrcode_info:
      '{"data":[{"domain":"fbdgqp.tet982m32.com","domain_type":1,"status":"active"}]}',
  })

  assert.equal(channelPackage.isChannelPackageHost('fanuf.maintest71.com'), false)
  assert.equal(channelPackage.isChannelPackageHost('test2-game.awanptest.com'), false)
  assert.equal(channelPackage.isChannelPackageHost('fbdgqp.tet982m32.com'), false)
  assert.equal(channelPackage.extractInviteCodeFromSubdomain('club123.fbdgqp.tet982m32.com'), 'club123')
  assert.equal(
    channelPackage.buildChannelClubInviteUrl('club123'),
    'https://club123.fbdgqp.tet982m32.com',
  )
  assert.equal(
    channelPackage.buildChannelAgentInviteUrl('agent456', 'club123'),
    'https://club123.fbdgqp.tet982m32.com/#/?mode=register&i=agent456',
  )
})

test('missing qr-code domains keep the invite code in a hash parameter', () => {
  channelPackage.configurePlatformDomains({
    plat_domain_main_info:
      '{"data":[{"domain":"fanuf.maintest71.com","domain_type":2,"status":"active"}]}',
    plat_domain_qrcode_info: '{"data":[]}',
  })

  assert.equal(
    channelPackage.buildChannelClubInviteUrl('club123'),
    'https://fanuf.maintest71.com/#/?invite_code=club123',
  )
  assert.equal(
    channelPackage.buildChannelAgentInviteUrl('agent456', 'club123'),
    'https://fanuf.maintest71.com/#/?invite_code=club123&mode=register&i=agent456',
  )
})

test('club custom domain takes priority over platform qr-code domains', () => {
  channelPackage.configurePlatformDomains({
    plat_domain_main_info:
      '{"data":[{"domain":"fanuf.maintest71.com","domain_type":2,"status":"active"}]}',
    plat_domain_qrcode_info:
      '{"data":[{"domain":"fbdgqp.tet982m32.com","domain_type":1,"status":"active"}]}',
  })

  assert.equal(
    channelPackage.buildChannelClubInviteUrl('club123', 'club-short.example.com'),
    'https://club-short.example.com',
  )
  assert.equal(
    channelPackage.buildChannelAgentInviteUrl(
      'agent456',
      'club123',
      'https://club-short.example.com/path',
    ),
    'https://club-short.example.com/#/?mode=register&i=agent456',
  )
})

test.after(() => {
  if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

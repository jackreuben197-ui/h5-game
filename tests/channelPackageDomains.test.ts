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

test('runtime platform domains drive package classification and invite URLs', () => {
  channelPackage.configurePlatformDomains({
    plat_domain_main_info:
      '{"data":[{"domain":"fanuf.maintest71.com","domain_type":2,"status":"active"}]}',
    plat_domain_qrcode_info:
      '{"data":[{"domain":"fbdgqp.tet982m32.com","domain_type":1,"status":"active"}]}',
  })

  assert.equal(channelPackage.isChannelPackageHost('fanuf.maintest71.com'), false)
  assert.equal(channelPackage.isChannelPackageHost('fbdgqp.tet982m32.com'), true)
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

test.after(() => {
  if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

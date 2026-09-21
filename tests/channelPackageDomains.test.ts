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
  '@/utils/appConfig': moduleUrl('export const appConfig = { channelMainDomain: "" }'),
  '@/utils/telegramStartParam': moduleUrl(
    'export const isTelegramMiniAppEnv = () => false; export const readTelegramStartParam = () => ""; export const resolveTelegramClubInviteCode = () => ""; export const resolveTelegramClubRandomId = () => ""',
  ),
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
  assert.equal(channelPackage.isChannelPackageHost('test2-game.awanptest.com'), false)
  assert.equal(channelPackage.isChannelPackageHost('fbdgqp.tet982m32.com'), false)
  assert.equal(channelPackage.extractInviteCodeFromSubdomain('club123.fbdgqp.tet982m32.com'), 'club123')
  assert.equal(
    channelPackage.buildChannelClubInviteUrl('club123'),
    'https://club123.fbdgqp.tet982m32.com/#/home',
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
    'https://club-short.example.com/#/home',
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

test('hosts outside the platform domain config fall back to the deploy apex', () => {
  channelPackage.configurePlatformDomains({
    plat_domain_main_info:
      '{"data":[{"domain":"fanuf.maintest71.com","domain_type":2,"status":"active"},{"domain":"nsh.cjsjd.com","domain_type":1,"status":"active"}]}',
    plat_domain_qrcode_info: '{"data":[]}',
  })
  window.location = new URL('https://prvw-game.trackyourchoice.com/#/') as unknown as Location

  assert.equal(channelPackage.isChannelPackageHost('prvw-game.trackyourchoice.com'), false)
  assert.equal(channelPackage.isOfficialPackageHost('prvw-game.trackyourchoice.com'), true)
  assert.equal(channelPackage.isChannelPackageHost('ccsgame.recognitionway.com'), false)
  assert.equal(channelPackage.isChannelPackageHost('bepvazti.prvw-game.trackyourchoice.com'), true)
  assert.equal(
    channelPackage.extractInviteCodeFromSubdomain('bepvazti.prvw-game.trackyourchoice.com'),
    'bepvazti',
  )
  assert.equal(
    channelPackage.buildChannelRegisterUrl({ inviteCode: 'RhSwEHJy' }),
    'https://RhSwEHJy.prvw-game.trackyourchoice.com/#/?mode=register&i=RhSwEHJy',
  )
  assert.equal(
    channelPackage.buildChannelAgentInviteUrl('SlCnUbVA', 'RhSwEHJy'),
    'https://RhSwEHJy.prvw-game.trackyourchoice.com/#/?mode=register&i=SlCnUbVA',
  )

  window.location = new URL('https://bepvazti.prvw-game.trackyourchoice.com/#/') as unknown as Location
  assert.equal(
    channelPackage.buildChannelClubInviteUrl('RhSwEHJy'),
    'https://RhSwEHJy.prvw-game.trackyourchoice.com/#/home',
  )
})

test.after(() => {
  if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

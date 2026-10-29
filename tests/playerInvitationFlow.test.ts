import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const storageUrl = moduleUrl(`
  const storage = new Map();
  export const localStore = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
`)
const aliases = new Map([
  [
    '@/constants/storageKey',
    moduleUrl(`export default { AGENT_INVITE_CODE: 'agent', PLAYER_INVITATION: 'player' };`),
  ],
  ['@/utils/localStore', storageUrl],
  ['@/utils/channelHost', new URL('../src/utils/channelHost.ts', import.meta.url).href],
  ['@/utils/playerInvitation', new URL('../src/utils/playerInvitation.ts', import.meta.url).href],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = aliases.get(specifier)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})
const channel = await import('../src/utils/channelPackage.ts')
const { localStore } = await import(storageUrl)
hooks.deregister()

function withLocation(href: string, run: () => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: new URL(href) },
  })
  try {
    run()
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
}

test('ordinary invitation survives route changes, remains scoped to its target club and clears after login', () => {
  withLocation('https://club.example/?invite_code=club-code#/?inviter_random_id=123456', () => {
    localStore.setItem('agent', 'old-agent-code')
    channel.cacheAgentInviteCodeIfPresent()
    assert.equal(channel.parseInviteParamsFromLocation().inviterRandomId, 123456)
    assert.equal(channel.resolveAgentInviteCode(), '')
    window.location.hash = '/home'
    assert.equal(channel.resolveInviterRandomId('club-code'), 123456)
    assert.equal(channel.resolveInviterRandomId('another-club'), undefined)
    channel.clearAgentInviteCodeCache()
    assert.equal(channel.resolveInviterRandomId('club-code'), undefined)
  })
})

test('a new agent invitation clears the previous ordinary player referral', () => {
  withLocation('https://club.example/?invite_code=club-code#/?i=agent-code', () => {
    localStore.setItem('player', { id: 123456, inviteCode: 'club-code' })
    channel.cacheAgentInviteCodeIfPresent()
    assert.equal(channel.resolveAgentInviteCode(), 'agent-code')
    assert.equal(channel.resolveInviterRandomId('club-code'), undefined)
    channel.clearAgentInviteCodeCache()
  })
})

test('the existing club sharing flow includes the club code on a custom domain player invite', () => {
  withLocation('https://official.example/#/club', () => {
    const url = new URL(
      channel.buildChannelPlayerInviteUrl(123456, 'club-code', 'https://custom.example'),
    )
    const params = new URLSearchParams(url.hash.split('?')[1])
    assert.equal(url.hostname, 'custom.example')
    assert.equal(params.get('invite_code'), 'club-code')
    assert.equal(params.get('inviter_random_id'), '123456')
  })
})

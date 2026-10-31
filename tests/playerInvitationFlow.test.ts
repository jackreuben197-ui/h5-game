import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { appendInvitationRandomId, withPlayerInviter } from '../src/utils/playerInvitation.ts'

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

test.beforeEach(() => channel.clearAgentInviteCodeCache())

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
  withLocation('https://club.example/?invite_code=club-code#/?random_id=123456', () => {
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
    assert.equal(params.get('random_id'), '123456')
    assert.equal(params.has('inviter_random_id'), false)
  })
})

test('player share URLs map random_id to inviter_random_id in the registration body after navigation', () => {
  withLocation('https://official.example/#/club', () => {
    window.location.href = channel.buildChannelPlayerInviteUrl(
      123456,
      'club-code',
      'https://custom.example',
    )
    channel.cacheAgentInviteCodeIfPresent()
    window.location.hash = '/home'
    const payload = withPlayerInviter(
      { invite_code: 'club-code', email: 'player@example.com' },
      channel.resolveInviterRandomId('club-code'),
    )
    assert.deepEqual(payload, {
      invite_code: 'club-code',
      email: 'player@example.com',
      inviter_random_id: 123456,
    })
    channel.clearAgentInviteCodeCache()
  })
})

test('agent QR URLs retain both the agent code and inviter ID across navigation', () => {
  withLocation('https://official.example/#/club', () => {
    window.location.href = channel.buildChannelAgentInviteUrl(
      'agent-code',
      'club-code',
      'https://custom.example',
      654321,
    )
    const params = new URLSearchParams(window.location.hash.split('?')[1])
    assert.equal(params.get('i'), 'agent-code')
    assert.equal(params.get('random_id'), '654321')
    assert.equal(params.has('inviter_random_id'), false)
    assert.equal(channel.parseInviteParamsFromLocation().inviterRandomId, 654321)
    assert.equal(channel.resolveAgentInviteCode(), 'agent-code')
    channel.cacheAgentInviteCodeIfPresent()
    window.location.hash = '/home'
    const code = channel.resolveAgentInviteCode()
    assert.equal(code, 'agent-code')
    assert.deepEqual(
      withPlayerInviter({ invite_code: code }, channel.resolveInviterRandomId(code)),
      {
        invite_code: 'agent-code',
        inviter_random_id: 654321,
      },
    )
    assert.equal(channel.resolveInviterRandomId('another-agent'), undefined)
    channel.clearAgentInviteCodeCache()
    assert.equal(channel.resolveInviterRandomId(code), undefined)
  })
})

for (const idField of ['random_id', 'inviter_random_id']) {
  test(`the reported agent link submits its original agent code and ${idField} before and after navigation`, () => {
    withLocation(
      `https://ksgubmmk.nsh.cjsjd.com/#/home?mode=register&i=nvEDgGfw&${idField}=92625674`,
      () => {
        localStore.setItem('player', { id: 123456, inviteCode: 'old-club' })
        const registerPayload = () => {
          const code = channel.resolveAgentInviteCode()
          return withPlayerInviter(
            { invite_code: code, trace_hash: 'nvEDgGfw', platform: 5 },
            channel.resolveInviterRandomId(code),
          )
        }
        const expected = {
          invite_code: 'nvEDgGfw', trace_hash: 'nvEDgGfw', platform: 5,
          inviter_random_id: 92625674,
        }
        assert.deepEqual(registerPayload(), expected)
        channel.cacheAgentInviteCodeIfPresent()
        assert.deepEqual(localStore.getItem('player'), {
          id: 92625674, inviteCode: 'nvEDgGfw',
        })
        window.location.hash = '/home'
        assert.deepEqual(registerPayload(), expected)
        channel.clearAgentInviteCodeCache()
      },
    )
  })
}

test('cached inviter IDs remain scoped to the matching agent code', () => {
  withLocation('https://club.example/#/home', () => {
    localStore.setItem('agent', 'agent-code')
    localStore.setItem('player', { id: 654321, inviteCode: 'agent-code' })
    assert.equal(channel.resolveAgentInviteCode(), 'agent-code')
    assert.equal(channel.resolveInviterRandomId('agent-code'), 654321)
    assert.equal(channel.resolveInviterRandomId('another-agent'), undefined)
    channel.clearAgentInviteCodeCache()
  })
})

for (const role of ['administrator', 'player']) {
  test(`${role} invitation preserves the club code and inviter ID after navigation`, () => {
    withLocation('https://official.example/#/club', () => {
      window.location.href = channel.buildChannelPlayerInviteUrl(
        92625674, 'club-code', 'https://custom.example',
      )
      localStore.setItem('agent', 'previous-agent')
      channel.cacheAgentInviteCodeIfPresent()
      window.location.hash = '/home'
      assert.equal(channel.resolveAgentInviteCode(), '')
      assert.deepEqual(
        withPlayerInviter(
          { invite_code: 'club-code' }, channel.resolveInviterRandomId('club-code'),
        ),
        { invite_code: 'club-code', inviter_random_id: 92625674 },
      )
    })
  })
}

test('a new agent invitation replaces the previous inviter even when the agent code is unchanged', () => {
  withLocation('https://club.example/#/?i=agent-code&random_id=111111', () => {
    channel.cacheAgentInviteCodeIfPresent()
    window.location.hash = '/home?i=agent-code&random_id=222222'
    channel.cacheAgentInviteCodeIfPresent()
    window.location.hash = '/home'
    assert.equal(channel.resolveInviterRandomId('agent-code'), 222222)
  })
})

test('random_id is read from either query location, takes precedence over the legacy field and validates IDs', () => {
  for (const href of [
    'https://club.example/?invite_code=club-code&random_id=123456#/',
    'https://club.example/#/?invite_code=club-code&random_id=123456',
    'https://club.example/?inviter_random_id=999999#/?invite_code=club-code&random_id=123456',
  ]) {
    withLocation(href, () => {
      assert.equal(channel.parseInviteParamsFromLocation().inviterRandomId, 123456)
    })
  }
  for (const id of ['0', '-1', '1.5', 'abc', '9007199254740992']) {
    withLocation(`https://club.example/#/?invite_code=club-code&random_id=${id}`, () => {
      assert.equal(channel.parseInviteParamsFromLocation().inviterRandomId, undefined)
      assert.deepEqual(
        withPlayerInviter(
          { invite_code: 'club-code' },
          channel.resolveInviterRandomId('club-code'),
        ),
        {
          invite_code: 'club-code',
        },
      )
    })
  }
})

test('inviter_random_id invitation links keep the server registration field after navigation', () => {
  withLocation('https://club.example/#/?invite_code=club-code&inviter_random_id=123456', () => {
    channel.cacheAgentInviteCodeIfPresent()
    window.location.hash = '/home'
    assert.deepEqual(
      withPlayerInviter({ invite_code: 'club-code' }, channel.resolveInviterRandomId('club-code')),
      {
        invite_code: 'club-code',
        inviter_random_id: 123456,
      },
    )
    channel.clearAgentInviteCodeCache()
  })
})

test('cached agent links use the current sharer ID without losing routes or attribution', () => {
  const shared = new URL(
    appendInvitationRandomId(
      'https://club.example/?random_id=111111&source=app#/home?i=agent-code&inviter_random_id=222222',
      123456,
    ),
  )
  const hash = new URLSearchParams(shared.hash.split('?')[1])
  assert.equal(shared.searchParams.get('source'), 'app')
  assert.equal(shared.searchParams.has('random_id'), false)
  assert.equal(shared.hash.split('?')[0], '#/home')
  assert.equal(hash.get('i'), 'agent-code')
  assert.equal(hash.get('random_id'), '123456')
  assert.equal(hash.has('inviter_random_id'), false)
})

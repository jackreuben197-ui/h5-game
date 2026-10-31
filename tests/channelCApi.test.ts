import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { withPlayerInviter } from '../src/utils/playerInvitation.ts'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const stubUrl = moduleUrl(`
  export const state = { calls: [], data: null };
  export default { async post(...args) { state.calls.push(args); return { data: { code: 0, data: state.data } }; } };
  export const forwardUserClubToCocos = () => {};
  export const forwardUserInfoToCocos = () => {};
  export const useGameStore = () => ({});
  export const pinia = {};
  export const useUserInfoStore = () => ({});
  export const writeClubListCache = () => {};
  export const isExperienceUserInfo = () => false;
`)
const aliases = new Map([
  [
    '@/utils/lobbyDisplayFields',
    new URL('../src/utils/lobbyDisplayFields.ts', import.meta.url).href,
  ],
])
const stubbed = new Set([
  '@/api/http',
  '@/bridge/sync',
  '@/stores/game',
  '@/stores/pinia',
  '@/stores/userInfo',
  '@/utils/userClubListCache',
  '@/session/experienceIdentity',
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = aliases.get(specifier) ?? (stubbed.has(specifier) ? stubUrl : null)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})
const misc = await import('../src/api/misc.ts')
const cmsext = await import('../src/api/cmsext.ts')
const user = await import('../src/api/user.ts')
const { state } = await import(stubUrl)
hooks.deregister()

test('existing extension-service room APIs preserve nested responses and send new fields at the body root', async () => {
  state.calls = []
  state.data = { data: { id: 5, is_top: 0, room_intro: '', room_features: '' } }
  const payload = {
    name: 'real template',
    room_config: { sb: 100, is_top: 0, room_intro: '', room_features: '' },
  }
  const created = await cmsext.postOrgCreateTemplateApi(payload)
  await cmsext.postOrgUpdateTemplateApi({ ...payload, id: 5 })
  await cmsext.postOrgRoomClubCreateApi(payload)
  assert.deepEqual(created.data, state.data)
  assert.equal(created.data?.data?.is_top, 0)
  for (const [, body] of state.calls) {
    assert.equal(body.is_top, 0)
    assert.equal(body.room_intro, '')
    assert.equal(body.room_features, '')
    assert.deepEqual(body.room_config, { sb: 100 })
    assert.equal(body.name, 'real template')
  }
})

test('Banner lobby and Banner list call their separate existing endpoints with the shared H5 scene', async () => {
  state.calls = []
  state.data = { lobby: { image_url_c: 'c.png', display_scene: 1 } }
  const response = await misc.postMiscBannerLobbyApi({ club_id: 5, display_scene: 1 })
  await misc.postMiscBannerListApi({ club_id: 5, type: 1, display_scene: 1 })
  assert.equal(response.data?.lobby?.image_url_c, 'c.png')
  assert.deepEqual(
    state.calls.map((call: unknown[]) => call[0]),
    ['/misc/banner_lobby', '/misc/banner/list'],
  )
  assert.equal(state.calls[0][1].display_scene, 1)
  assert.equal(state.calls[1][1].display_scene, 1)
})

for (const { role, inviteCode, traceHash } of [
  { role: 'administrator', inviteCode: 'club-code', traceHash: '' },
  { role: 'agent', inviteCode: 'nvEDgGfw', traceHash: 'nvEDgGfw' },
  { role: 'player', inviteCode: 'club-code', traceHash: '' },
]) {
  test(`both registration endpoints retain ${role} invite_code and inviter_random_id`, async () => {
    state.calls = []
    const payload = withPlayerInviter(
      {
        email: 'player@example.com',
        password: 'hashed',
        invite_code: inviteCode,
        ...(traceHash ? { trace_hash: traceHash } : {}),
      },
      123456,
    )
    state.data = { token: 'registered-token' }
    const registered = await user.postUserRegisterApi(payload)
    assert.equal(registered.data?.token, 'registered-token')
    state.data = 'player@example.com'
    const invited = await user.postUserInviteRegisterApi(payload)
    assert.equal(invited.data, 'player@example.com')
    assert.equal(state.calls[0][0], '/user/register')
    assert.equal(state.calls[1][0], '/user/invite_register')
    for (const [, body] of state.calls) {
      assert.equal(body.inviter_random_id, 123456)
      assert.equal('random_id' in body, false)
      assert.equal(body.email, 'player@example.com')
      assert.equal(body.password, 'hashed')
      assert.equal(body.invite_code, inviteCode)
      assert.equal(body.trace_hash, traceHash || undefined)
    }
  })
}

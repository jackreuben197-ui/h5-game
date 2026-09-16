import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const mockUrl = moduleUrl(`
  export const calls = [];
  export const game = {
    sessionToken: '', loginUserId: '', loginAccount: '', syncedIdentityToken: '', isGuestAccount: false,
    shouldSyncIdentity(token) { return token !== this.syncedIdentityToken },
    setGuestAccount(value) { this.isGuestAccount = value },
    setSessionToken(value) { this.sessionToken = value },
    setLoginUser(value) { this.loginUserId = value.userId },
    markIdentitySynced(value) { this.syncedIdentityToken = value }
  };
  export const useGameStore = () => game;
  export const postUserExperienceLoginApi = async () => {
    calls.push('experience-login'); return { token: 'experience-token' };
  };
  export const getUserInfoApi = async () => {
    calls.push('user-info'); return { user: { p_u_id: 'guest-id', user_type: 6 } };
  };
  export const postUserLogoutApi = async () => {};
  export const useRoomListStore = () => ({ bootstrapRoomList: async () => { calls.push('rooms') } });
  export const useMttListStore = () => ({ bootstrapMttList: async () => { calls.push('mtt') } });
  export const useUserInfoStore = () => ({});
  export const localStore = { getItem: () => '', setItem() {} };
  export const pinia = {};
  export const getLocale = () => 'en';
  export const isChannelPackageHost = () => false;
  export const resolveInviteCode = () => '';
  export const isTelegramMiniAppEnv = () => Boolean(globalThis.window.__H5_TG_MINI_APP__);
  export const syncPostAuthData = async () => {};
  let templatesLoaded = false;
  export const ensureMultiLanguageTemplateLoaded = async () => {
    if (templatesLoaded) return;
    templatesLoaded = true;
    calls.push('templates');
  };
  export const resetTemplateMock = () => { templatesLoaded = false };
`)
const stubs: Record<string, string> = {
  '@/session/experienceIdentity': new URL('../src/session/experienceIdentity.ts', import.meta.url).href,
  '@/session/loginSession': moduleUrl('export default { EnsureWS: async () => {} }'),
  '@/constants/storageKey': moduleUrl('export default {}'),
}
for (const name of ['api/user', 'session/postAuthSync', 'i18n', 'stores/pinia', 'stores/game',
  'stores/mttList', 'stores/roomList', 'stores/userInfo', 'utils/localStore', 'utils/environment',
  'utils/channelPackage', 'utils/multiLanguageTemplate']) {
  stubs[`@/${name}`] = mockUrl
}
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return stubs[specifier] ? { url: stubs[specifier], shortCircuit: true } : nextResolve(specifier, context)
  },
})
const { ensureExperienceSession } = await import('../src/session/experienceSession.ts')
const { game, calls, resetTemplateMock } = await import(mockUrl)
hooks.deregister()

for (const telegram of [false, true]) {
  test(`first visit uses the shared experience/list bootstrap (telegram=${telegram})`, async () => {
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { __H5_TG_MINI_APP__: telegram } })
    try {
      Object.assign(game, { sessionToken: '', loginUserId: '', syncedIdentityToken: '', isGuestAccount: false })
      calls.length = 0
      resetTemplateMock()
      assert.equal(await ensureExperienceSession(), true)
      assert.equal(game.isGuestAccount, true)
      assert.deepEqual(calls, ['experience-login', 'user-info', 'templates', 'rooms', 'mtt'])
      // 路由再次调用时不重复领取；模拟刷新重新校验仍复用已领取的体验 token。
      await ensureExperienceSession()
      assert.equal(calls.filter((call: string) => call === 'experience-login').length, 1)
      game.syncedIdentityToken = ''
      await ensureExperienceSession()
      assert.equal(calls.filter((call: string) => call === 'experience-login').length, 1)
      assert.equal(game.sessionToken, 'experience-token')
    } finally {
      if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
      else Reflect.deleteProperty(globalThis, 'window')
    }
  })
}

import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

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
  '@/utils/iosWebClip': moduleUrl('export const isIos = () => false'),
  '@/utils/channelPackage': new URL('../src/utils/channelPackage.ts', import.meta.url).href,
  '@/assets/icons/NEX-GAME.png': moduleUrl('export default "/icons/NEX-GAME.png"'),
  '@/assets/icons/Official_web_logo.jpeg': moduleUrl('export default "/icons/Official_web_logo.jpeg"'),
}

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return stubs[specifier]
      ? { url: stubs[specifier], shortCircuit: true }
      : nextResolve(specifier, context)
  },
})

const {
  applySafariWebAppConfig,
  DEFAULT_CLUB_NAME,
  DEFAULT_CLUB_ICON,
  OFFICIAL_WEB_NAME,
  OFFICIAL_WEB_ICON,
} = await import('../src/utils/safariWebApp.ts')

hooks.deregister()

test('safari web app config display rules', async (t) => {
  await t.test('official web link uses fixed name and logo', () => {
    const metaTitle = { setAttribute: (k: string, v: string) => { (metaTitle as any)[k] = v } } as any
    const touchIcon = { setAttribute: (k: string, v: string) => { (touchIcon as any)[k] = v } } as any
    const favicon = { setAttribute: (k: string, v: string) => { (favicon as any)[k] = v } } as any

    const originalDoc = (globalThis as any).document
    const originalWin = (globalThis as any).window

    try {
      ;(globalThis as any).window = {
        location: { href: 'https://partyholdem.com/', hostname: 'partyholdem.com', search: '', hash: '' },
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      }
      ;(globalThis as any).document = {
        title: '',
        querySelector: (selector: string) => {
          if (selector.includes('apple-mobile-web-app-title')) return metaTitle
          if (selector.includes('apple-touch-icon')) return touchIcon
          if (selector.includes('icon')) return favicon
          return null
        },
        createElement: () => ({ setAttribute: () => {} }),
        head: { appendChild: () => {} },
      }

      applySafariWebAppConfig(null)

      assert.equal((globalThis as any).document.title, OFFICIAL_WEB_NAME)
      assert.equal(metaTitle.content, OFFICIAL_WEB_NAME)
      assert.equal(touchIcon.href, OFFICIAL_WEB_ICON)
    } finally {
      ;(globalThis as any).document = originalDoc
      ;(globalThis as any).window = originalWin
    }
  })

  await t.test('club link defaults to NEW-GAME and default logo when CMS custom values are empty', () => {
    const metaTitle = { setAttribute: (k: string, v: string) => { (metaTitle as any)[k] = v } } as any
    const touchIcon = { setAttribute: (k: string, v: string) => { (touchIcon as any)[k] = v } } as any
    const favicon = { setAttribute: (k: string, v: string) => { (favicon as any)[k] = v } } as any

    const originalDoc = (globalThis as any).document
    const originalWin = (globalThis as any).window

    try {
      ;(globalThis as any).window = {
        location: {
          href: 'https://partyholdem.com/#/?invite_code=TEST123',
          hostname: 'partyholdem.com',
          search: '',
          hash: '#/?invite_code=TEST123',
        },
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      }
      ;(globalThis as any).document = {
        title: '',
        querySelector: (selector: string) => {
          if (selector.includes('apple-mobile-web-app-title')) return metaTitle
          if (selector.includes('apple-touch-icon')) return touchIcon
          if (selector.includes('icon')) return favicon
          return null
        },
        createElement: () => ({ setAttribute: () => {} }),
        head: { appendChild: () => {} },
      }

      // No custom name/logo configured in CMS
      applySafariWebAppConfig({ club_id: 123 })

      assert.equal((globalThis as any).document.title, DEFAULT_CLUB_NAME)
      assert.equal(metaTitle.content, DEFAULT_CLUB_NAME)
      assert.equal(touchIcon.href, DEFAULT_CLUB_ICON)
    } finally {
      ;(globalThis as any).document = originalDoc
      ;(globalThis as any).window = originalWin
    }
  })

  await t.test('club link uses CMS custom name (指尖牌桌) and custom icon when configured', () => {
    const metaTitle = { setAttribute: (k: string, v: string) => { (metaTitle as any)[k] = v } } as any
    const touchIcon = { setAttribute: (k: string, v: string) => { (touchIcon as any)[k] = v } } as any
    const favicon = { setAttribute: (k: string, v: string) => { (favicon as any)[k] = v } } as any

    const originalDoc = (globalThis as any).document
    const originalWin = (globalThis as any).window

    try {
      ;(globalThis as any).window = {
        location: {
          href: 'https://partyholdem.com/?club_id=924086',
          hostname: 'partyholdem.com',
          search: '?club_id=924086',
          hash: '',
        },
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      }
      ;(globalThis as any).document = {
        title: '',
        querySelector: (selector: string) => {
          if (selector.includes('apple-mobile-web-app-title')) return metaTitle
          if (selector.includes('apple-touch-icon')) return touchIcon
          if (selector.includes('icon')) return favicon
          return null
        },
        createElement: () => ({ setAttribute: () => {} }),
        head: { appendChild: () => {} },
      }

      // CMS config: Desktop Name = 指尖牌桌, Desktop Icon = custom_icon.png
      applySafariWebAppConfig({
        club_id: 924086,
        safari_label: '指尖牌桌',
        safari_icon_url: 'https://img.example.com/custom_icon.png',
      })

      assert.equal((globalThis as any).document.title, '指尖牌桌')
      assert.equal(metaTitle.content, '指尖牌桌')
      assert.equal(touchIcon.href, 'https://img.example.com/custom_icon.png')
    } finally {
      ;(globalThis as any).document = originalDoc
      ;(globalThis as any).window = originalWin
    }
  })
})

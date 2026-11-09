import assert from 'node:assert/strict'
import test from 'node:test'

const storage = new Map<string, string>()
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: new URL('https://prvw-game.trackyourchoice.com/?icon=pmf6t#/home'),
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    },
  },
})

const {
  HOME_SHORTCUT_CACHE_KEY,
  clearHomeShortcutCache,
  hasUnresolvedHomeShortcutCode,
  parseHomeShortcutRecords,
  readHomeShortcutCode,
  resolveHomeShortcutConfig,
  setHomeShortcutRecords,
  writeHomeShortcutCache,
} = await import('../src/utils/homeShortcut.ts')

const serverValue =
  '{"data":[{"id":3,"domain":"https://test.abc.com?icon=pmf6t","domain_name":"test.abc.com","description":"Dragon","icon_url":"https://static.trackyourchoice.com/image-normal/20261109121130-eZcik.png","status":1,"random_code":"pmf6t","create_time":"2026-11-09T12:11:38Z","update_time":"2026-11-09T12:11:38Z"},' +
  '{"id":4,"description":"Disabled","icon_url":"https://static.example.com/off.png","status":2,"random_code":"off01"},' +
  '{"id":5,"description":"No code","icon_url":"https://static.example.com/nocode.png","status":1,"random_code":""},' +
  '{"id":6,"description":"","icon_url":"javascript:alert(1)","status":1,"random_code":"bad01"}]}'

test('parses the server JSON string and keeps only active records with a code', () => {
  const records = parseHomeShortcutRecords(serverValue)
  assert.deepEqual(records, [
    {
      code: 'pmf6t',
      label: 'Dragon',
      iconUrl: 'https://static.trackyourchoice.com/image-normal/20261109121130-eZcik.png',
    },
  ])
})

test('accepts an already parsed object and a bare array', () => {
  const parsed = JSON.parse(serverValue) as { data: unknown[] }
  assert.equal(parseHomeShortcutRecords(parsed)?.length, 1)
  assert.equal(parseHomeShortcutRecords(parsed.data)?.length, 1)
})

test('returns null for missing, empty or broken config', () => {
  assert.equal(parseHomeShortcutRecords(undefined), null)
  assert.equal(parseHomeShortcutRecords(''), null)
  assert.equal(parseHomeShortcutRecords('{oops'), null)
  assert.equal(parseHomeShortcutRecords(42), null)
  assert.deepEqual(parseHomeShortcutRecords('{"data":[]}'), [])
})

test('reads the icon code from the search string or from the hash query', () => {
  assert.equal(readHomeShortcutCode({ search: '?icon=pmf6t', hash: '#/home' }), 'pmf6t')
  assert.equal(readHomeShortcutCode({ search: '?a=1&icon= xyz ', hash: '' }), 'xyz')
  assert.equal(readHomeShortcutCode({ search: '', hash: '#/home?icon=fromhash' }), 'fromhash')
  assert.equal(readHomeShortcutCode({ search: '?icon=first', hash: '#/home?icon=second' }), 'first')
  assert.equal(readHomeShortcutCode({ search: '?invite_code=abc', hash: '#/home' }), '')
  assert.equal(readHomeShortcutCode({}), '')
})

test('falls back to the cached record only while the config is unknown', () => {
  storage.clear()
  setHomeShortcutRecords(undefined)
  assert.equal(resolveHomeShortcutConfig(), null)

  writeHomeShortcutCache({ code: 'pmf6t', label: 'Cached', iconUrl: 'https://cdn.example.com/a.png' })
  assert.ok(storage.has(HOME_SHORTCUT_CACHE_KEY))
  assert.deepEqual(resolveHomeShortcutConfig(), {
    code: 'pmf6t',
    label: 'Cached',
    iconUrl: 'https://cdn.example.com/a.png',
  })
  assert.equal(resolveHomeShortcutConfig({ search: '?icon=other', hash: '' }), null)
  assert.equal(hasUnresolvedHomeShortcutCode(), false)

  clearHomeShortcutCache()
  assert.equal(resolveHomeShortcutConfig(), null)
})

test('matches by random_code once the config is loaded and ignores the cache', () => {
  storage.clear()
  writeHomeShortcutCache({ code: 'pmf6t', label: 'Stale', iconUrl: 'https://cdn.example.com/stale.png' })
  setHomeShortcutRecords(serverValue)
  assert.deepEqual(resolveHomeShortcutConfig(), {
    code: 'pmf6t',
    label: 'Dragon',
    iconUrl: 'https://static.trackyourchoice.com/image-normal/20261109121130-eZcik.png',
  })
  assert.equal(hasUnresolvedHomeShortcutCode(), false)

  assert.equal(resolveHomeShortcutConfig({ search: '?icon=off01', hash: '' }), null)
  assert.equal(hasUnresolvedHomeShortcutCode({ search: '?icon=off01', hash: '' }), true)
  assert.equal(hasUnresolvedHomeShortcutCode({ search: '', hash: '#/home' }), false)

  setHomeShortcutRecords('{"data":[]}')
  assert.equal(resolveHomeShortcutConfig(), null)
  assert.equal(hasUnresolvedHomeShortcutCode(), true)
})

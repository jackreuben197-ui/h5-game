import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const entry = readFileSync(new URL('../src/entry/cocos-h5-entry.ts', import.meta.url), 'utf8')

test('Cocos settings, main and engine wait for the H5 first-paint signal', () => {
  assert.doesNotMatch(html, /<script\s+src=["'](?:src\/settings|main)\.js/)
  assert.match(html, /addEventListener\(['"]h5:first-paint['"],\s*startCocos/)

  const settings = html.indexOf("loadScript('src/settings.js'")
  const main = html.indexOf("loadScript('main.js'")
  const engine = html.indexOf("'cocos2d-js-min.js'")
  assert.ok(settings >= 0)
  assert.ok(main > settings)
  assert.ok(engine > main)
})

test('H5 emits the Cocos boot signal only after mounting and two animation frames', () => {
  const mount = entry.indexOf('mountH5App(container)')
  const schedule = entry.indexOf('startCocosAfterFirstPaint()', mount)
  assert.ok(mount >= 0)
  assert.ok(schedule > mount)
  assert.match(
    entry,
    /requestAnimationFrame\(\(\) => \{\s*window\.requestAnimationFrame\(dispatchReady\)/,
  )
  assert.match(entry, /dispatchEvent\(new Event\(['"]h5:first-paint['"]\)\)/)
})

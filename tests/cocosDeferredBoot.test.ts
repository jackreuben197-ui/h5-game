import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const entry = readFileSync(new URL('../src/entry/cocos-h5-entry.ts', import.meta.url), 'utf8')

test('Cocos runtime loads eagerly while boot waits for the H5 first-paint signal', () => {
  assert.match(html, /<script\s+src=["']src\/settings\.js["']/)
  assert.match(html, /<script\s+src=["']main\.js["']/)
  assert.doesNotMatch(html, /loadScript\(["'](?:src\/settings|main)\.js["']/)
  assert.match(html, /addEventListener\(['"]h5:first-paint['"],\s*markH5FirstPaintReady/)

  const runtimeLoader = html.indexOf('function loadCocosRuntime()')
  const eagerRuntimeLoad = html.indexOf(
    '// 页面解析到这里就开始加载 framework；boot 仍必须同时等待 H5 首帧和 runtime。\n        loadCocosRuntime()',
    runtimeLoader,
  )
  assert.ok(runtimeLoader >= 0)
  assert.ok(eagerRuntimeLoad > runtimeLoader)
  assert.match(
    html,
    /if \(cocosBootStarted \|\| !cocosRuntimeReady \|\| !h5FirstPaintReady\)/,
  )
  assert.match(html, /function tryBootCocos\(\)[\s\S]*window\.boot\(\)/)
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

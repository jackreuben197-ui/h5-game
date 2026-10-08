import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const homeSource = readFileSync(
  new URL('../src/views/home/HomeIndexView.vue', import.meta.url),
  'utf8',
)

test('home proactively starts websocket for every resolved session, including guests', () => {
  assert.match(homeSource, /const websocketReady = sessionReady\.then/)
  assert.match(homeSource, /LoginSession\.EnsureWS\(\)/)
  assert.doesNotMatch(homeSource, /if \(gameStore\.isRealUser\).*startHomeWebSocketAfterCocosReady/s)
})

test('home waits for the delayed Cocos handshake and reconnects an early websocket', () => {
  assert.match(homeSource, /onBridgeHandshakeDone\(\(\) =>/)
  assert.match(homeSource, /ensureHomeWebSocket\(true\)/)
  assert.match(homeSource, /ensureWsProxyConnected\(\{ port: cachedPort, force: true \}\)/)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const runtimeFile = require.resolve('@silenthill/agreement-web/runtime')
const declarations = readFileSync(join(dirname(runtimeFile), 'index.d.ts'), 'utf8')
const protocol = require(runtimeFile)

try {
  assert.equal(protocol.Code.MSG_S_TRIBE_ACTIVITY_REWARD, 155)
  assert.match(declarations, /MSG_S_TRIBE_ACTIVITY_REWARD\s*:\s*155\s*;/)
  assert.equal(typeof protocol.ServerMessageTribeActivityReward.deserializeBinary, 'function')
  assert.match(declarations, /export class ServerMessageTribeActivityReward\b/)
} catch (cause) {
  throw new Error('protobuf 缺少 155 活动奖励协议，请先运行 pnpm sync:protocol。', { cause })
}

console.log('protobuf 155 活动奖励运行时与类型声明检查通过')

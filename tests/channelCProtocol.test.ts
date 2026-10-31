import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire, registerHooks } from 'node:module'
import { encodeHoldemPacket } from '../src/bridge/ws/holdemPacket.ts'

const require = createRequire(import.meta.url)
const runtimePath = require.resolve('@silenthill/agreement-web/runtime')
const pb = require(runtimePath)
const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const pbModule = moduleUrl(`
  import { createRequire } from 'node:module';
  const pb = createRequire(${JSON.stringify(import.meta.url)})(${JSON.stringify(runtimePath)});
  export const Code = pb.Code;
  export const ServerMessageTribeActivityReward = pb.ServerMessageTribeActivityReward;
  export const ServerMessageUserOrderAudit = pb.ServerMessageUserOrderAudit;
  export const ServerMessageRoomChangeNotify = pb.ServerMessageRoomChangeNotify;
  export const ServerMessageMttSeriesNotify = pb.ServerMessageMttSeriesNotify;
  export const ServerMessageUserMttChangeNotify = pb.ServerMessageUserMttChangeNotify;
  export const ServerMessageUserSngChangeNotify = pb.ServerMessageUserSngChangeNotify;
`)
const aliases = new Map([
  ['@silenthill/agreement-web', pbModule],
  ['@/utils/logger', moduleUrl('export const createLogger = () => ({ warn() {}, info() {} });')],
  [
    '@/utils/lobbyDisplayFields',
    new URL('../src/utils/lobbyDisplayFields.ts', import.meta.url).href,
  ],
  ['./holdemPacket', new URL('../src/bridge/ws/holdemPacket.ts', import.meta.url).href],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = aliases.get(specifier)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})
const { decodeRoomChangeNotifyFromRawPacket } = await import('../src/bridge/ws/roomChangeNotify.ts')
const { decodeUserMttChangeNotifyFromRawPacket } = await import('../src/bridge/ws/mttNotify.ts')
const { decodeTribeActivityReward } = await import('../src/bridge/ws/tribeActivityRewardNotify.ts')
const { decodeUserOrderAudit } = await import('../src/bridge/ws/orderAuditNotify.ts')
hooks.deregister()

function serverPacket(code: number, message: { serializeBinary(): Uint8Array }): ArrayBuffer {
  // 入站消息不包含客户端发送包最前面的 4 字节 dataLength。
  return encodeHoldemPacket({ code, token: '', body: message.serializeBinary() }).slice(4)
}

test('installed protocol decodes real room binary records with recommendation and both descriptions', () => {
  const room = new pb.RoomRecord()
  room.setRid(101)
  room.setStatus(1)
  room.setIsTop(1)
  room.setRoomIntro('经典德州')
  room.setRoomFeatures('欢乐竞技')
  const message = new pb.ServerMessageRoomChangeNotify()
  message.setChangeType(1)
  message.setRoom(room)
  const decoded = decodeRoomChangeNotifyFromRawPacket(serverPacket(140, message))
  assert.equal(decoded?.room?.is_top, 1)
  assert.equal(decoded?.room?.room_intro, '经典德州')
  assert.equal(decoded?.room?.room_features, '欢乐竞技')
})

test('room binary changes retain protocol defaults for recommendation off and text clears', () => {
  const change = new pb.RoomChange()
  change.setRid(101)
  change.setStatus(1)
  const message = new pb.ServerMessageRoomChangeNotify()
  message.setChangeType(2)
  message.setRoomChange(change)
  const decoded = decodeRoomChangeNotifyFromRawPacket(serverPacket(140, message))
  assert.equal(decoded?.roomChange?.is_top, 0)
  assert.equal(decoded?.roomChange?.room_intro, '')
  assert.equal(decoded?.roomChange?.room_features, '')
})

test('installed protocol decodes MTT C artwork separately from the A/B artwork', () => {
  const match = new pb.UserMttRecord()
  match.setMatchId(201)
  match.setIsTop(1)
  match.setParticipants(12)
  match.setMttBannerUrl('ab.png')
  match.setMttBannerUrlC('c.png')
  const message = new pb.ServerMessageUserMttChangeNotify()
  message.setChangeType(1)
  message.setMtt(match)
  const decoded = decodeUserMttChangeNotifyFromRawPacket(serverPacket(151, message))
  assert.equal(decoded?.mtt?.is_top, 1)
  assert.equal(decoded?.mtt?.participants, 12)
  assert.equal(decoded?.mtt?.mtt_banner_url, 'ab.png')
  assert.equal(decoded?.mtt?.mtt_banner_url_c, 'c.png')
})

test('MTT binary changes include zero and empty C artwork without dropping default values', () => {
  const change = new pb.UserMttRecordChange()
  change.setMatchId(201)
  const message = new pb.ServerMessageUserMttChangeNotify()
  message.setChangeType(2)
  message.setMttChange(change)
  const decoded = decodeUserMttChangeNotifyFromRawPacket(serverPacket(151, message))
  assert.equal(decoded?.mttChange?.is_top, 0)
  assert.equal(decoded?.mttChange?.mtt_banner_url_c, '')
  assert.equal(decoded?.mttChange?.participants, 0)
})

test('MTT participant changes decode from real binary notifications', () => {
  const change = new pb.UserMttRecordChange()
  change.setMatchId(201)
  change.setParticipants(8)
  const message = new pb.ServerMessageUserMttChangeNotify()
  message.setChangeType(2)
  message.setMttChange(change)
  const decoded = decodeUserMttChangeNotifyFromRawPacket(serverPacket(151, message))
  assert.equal(decoded?.mttChange?.participants, 8)
})

test('155 decodes actual binary activity awards with UC and localized ticket keys', () => {
  assert.equal(pb.Code.MSG_S_TRIBE_ACTIVITY_REWARD, 155)
  const message = new pb.ServerMessageTribeActivityReward()
  message.setOrderNo('activity-order-1')
  message.setClubId(5)
  message.setTribeId(10)
  message.setRewardKind(17)
  message.setTier(100)
  message.setRewardGold(300)
  const prop = new pb.RechargeRewardProp()
  prop.setPropId(662)
  prop.setPropName('PROP2023.TICKET')
  prop.setPropValue(50000)
  prop.setQuantity(2)
  message.addRewardProps(prop)
  const decoded = decodeTribeActivityReward(serverPacket(155, message))
  assert.equal(decoded?.orderNo, 'activity-order-1')
  assert.equal(decoded?.rewardGold, 300)
  assert.equal(decoded?.clubId, 5)
  assert.equal(decoded?.tribeId, 10)
  assert.equal(decoded?.rewardKind, 17)
  assert.equal(decoded?.tier, 100)
  assert.equal(decoded?.rewards[0]?.propName, 'PROP2023.TICKET')
  assert.equal(decoded?.rewards[0]?.propValue, 500)
  assert.equal(decoded?.rewards[0]?.quantity, 2)
  assert.equal(decodeTribeActivityReward(serverPacket(140, message)), null)
})

test('155 handles coin-only awards and rejects missing order identity or malformed packets', () => {
  const message = new pb.ServerMessageTribeActivityReward()
  assert.equal(decodeTribeActivityReward(serverPacket(155, message)), null)
  message.setOrderNo('coin-only')
  message.setRewardGold(100)
  const decoded = decodeTribeActivityReward(serverPacket(155, message))
  assert.equal(decoded?.rewardGold, 100)
  assert.deepEqual(decoded?.rewards, [])
  assert.equal(decodeTribeActivityReward(new ArrayBuffer(2)), null)
})

test('133 decodes integer UC and props from the installed protobuf without rescaling UC', () => {
  const message = new pb.ServerMessageUserOrderAudit()
  message.setOrderNo('recharge-uc-and-props')
  message.setStatus(2)
  message.setOrderType(1)
  message.setRewardRechargeAmount(151)
  const prop = new pb.RechargeRewardProp()
  prop.setPropId(662)
  prop.setPropName('PROP2023.TICKET')
  prop.setPropValue(50000)
  prop.setQuantity(2)
  message.addRewardProps(prop)

  const decoded = decodeUserOrderAudit(serverPacket(pb.Code.MSG_S_USER_ORDER_AUDIT, message))
  assert.deepEqual(decoded, {
    orderNo: 'recharge-uc-and-props',
    status: 2,
    orderCategory: 0,
    orderType: 1,
    rewardGold: 151,
    closeChat: false,
    delay: 0,
    rewards: [{
      propId: 662,
      propName: 'PROP2023.TICKET',
      propValue: 500,
      quantity: 2,
      propIcon: '',
    }],
  })
  assert.equal(decodeUserOrderAudit(serverPacket(155, message)), null)
  assert.equal(decodeUserOrderAudit(new ArrayBuffer(2)), null)
})

test('133 supports UC-only and legacy props-only packets', () => {
  const message = new pb.ServerMessageUserOrderAudit()
  message.setOrderNo('recharge-uc-only')
  message.setStatus(2)
  message.setOrderType(1)
  message.setRewardRechargeAmount(100)
  const coins = decodeUserOrderAudit(serverPacket(133, message))
  assert.equal(coins?.rewardGold, 100)
  assert.deepEqual(coins?.rewards, [])

  message.setRewardRechargeAmount(0)
  const prop = new pb.RechargeRewardProp()
  prop.setPropName('PROP2023.TICKET')
  prop.setQuantity(1)
  message.addRewardProps(prop)
  const props = decodeUserOrderAudit(serverPacket(133, message))
  assert.equal(props?.rewardGold ?? 0, 0)
  assert.equal(props?.rewards.length, 1)
})

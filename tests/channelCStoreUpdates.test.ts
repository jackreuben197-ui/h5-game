import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'

const moduleUrl = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`
const stubUrl = moduleUrl(`
  export const state = { mtt: null };
  export const defineStore = (_id, options) => () => {
    const store = options.state();
    for (const [key, action] of Object.entries(options.actions)) store[key] = action.bind(store);
    return store;
  };
  export const getRoomIdsApi = () => {};
  export const getRoomsDetailApi = () => {};
  export const postRoomcenterUserContrastRoomsApi = () => {};
  export const getAllMttSngIdsApi = () => {};
  export const postRoomCenterUserMatchListApi = () => {};
  export const Code = {};
  export const subscribeH5WsCode = () => {};
  export const subscribeH5WsCodes = () => {};
  export const decodeRoomChangeNotifyFromRawPacket = () => null;
  export const ROOM_CHANGE_TYPE = { ADD: 1, UPDATE: 2 };
  export const decodeHoldemPacket = () => null;
  export const useGameStore = () => ({ loginUserId: '1', sessionToken: 'token' });
  export const bulkUpsertRooms = () => {};
  export const loadRoomsByRids = () => {};
  export const readScopeMeta = () => {};
  export const writeScopeMeta = () => {};
  export const scopeForUser = (uid) => 'user_' + uid;
  export const ROOM_LIST_DATA_VERSION = 1;
  export const SCOPE_GUEST = 'guest';
  export const isRoomParticipated = () => false;
  export const sortRoomRecordsForDisplay = (records) => records;
  export const createLogger = () => ({ debug() {}, warn() {} });
  export const ServerMessageSeated = {};
  export const localStore = { getItem: () => null, setItem() {}, removeItem() {} };
  export const decodeMttSeriesNotifyFromRawPacket = () => null;
  export const decodeUserMttChangeNotifyFromRawPacket = () => state.mtt;
  export const decodeUserSngChangeNotifyFromRawPacket = () => null;
  export const GAME_ROOM_DATA_CHANGE_TYPE = { ADD: 1, UPDATE: 2, REMOVE: 3 };
  export const MTT_MATCH_STATUS = { CREATED: 0, RUNNING: 1, CLOSED: 2, CANCEL: 3 };
  export default {};
`)
const stubbed = new Set([
  'pinia',
  '@/api/roomcenter',
  '@/bridge/ws',
  '@/bridge/ws/roomChangeNotify',
  '@/bridge/ws/holdemPacket',
  '@/stores/game',
  '@/utils/roomListCache',
  '@/utils/roomListSort',
  '@/utils/logger',
  '@silenthill/agreement-web',
  '@/bridge/ws/mttNotify',
  '@/constants/storageKey',
  '@/utils/localStore',
])
const helpers = new Map([
  [
    '@/utils/lobbyDisplayFields',
    new URL('../src/utils/lobbyDisplayFields.ts', import.meta.url).href,
  ],
  ['@/utils/mttListMerge', new URL('../src/utils/mttListMerge.ts', import.meta.url).href],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = helpers.get(specifier) ?? (stubbed.has(specifier) ? stubUrl : null)
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})
const { useRoomListStore } = await import('../src/stores/roomList.ts')
const { useMttListStore } = await import('../src/stores/mttList.ts')
const { state } = await import(stubUrl)
hooks.deregister()

const originalRoom = () => ({
  rid: 1,
  name: 'real table',
  status: 1,
  sb: 100,
  is_top: 1,
  room_intro: 'old intro',
  room_features: 'old features',
})

test('room HTTP cache contrast applies recommendation off and both text clears', () => {
  const store = useRoomListStore()
  store.records = [originalRoom()]
  store.applyContrastPatch({ rid: 1, status: 1, is_top: 0, room_intro: '', room_features: '' })
  assert.equal(store.records[0]?.is_top, 0)
  assert.equal(store.records[0]?.room_intro, '')
  assert.equal(store.records[0]?.room_features, '')
  assert.equal(store.records[0]?.sb, 100)
})

test('room WebSocket update clears new fields and persists the updated cache', () => {
  const store = useRoomListStore()
  let saved = false
  store.persistRoomListCache = () => {
    saved = true
  }
  store.records = [originalRoom()]
  store.applyRoomUpdateChange({
    changeType: 2,
    sendTimestamp: 20,
    roomChange: {
      rid: 1,
      status: 1,
      empty_seat: 8,
      hand_num: 0,
      users: [],
      relate_club_ids: [],
      relate_tribe_club_list: [],
      is_top: 0,
      room_intro: '',
      room_features: '',
    },
  })
  assert.equal(store.records[0]?.is_top, 0)
  assert.equal(store.records[0]?.room_intro, '')
  assert.equal(store.records[0]?.room_features, '')
  assert.equal(saved, true)
})

test('MTT WebSocket update clears only C artwork and recommendation, and persists them', () => {
  const store = useMttListStore()
  let saved = false
  store.persistMttListCache = () => {
    saved = true
  }
  store.records = [
    { match_id: 1, status: 0, is_top: 1, mtt_banner_url_c: 'c.png', mtt_banner_url: 'ab.png' },
  ]
  state.mtt = {
    changeType: 2,
    sendTimestamp: 20,
    mttChange: {
      match_id: 1,
      status: 0,
      participants: 2,
      series_id: 3,
      pinned_time: 0,
      is_top: 0,
      mtt_banner_url_c: '',
    },
  }
  store.applyUserMttChangeNotify(new ArrayBuffer(0))
  assert.equal(store.records[0]?.is_top, 0)
  assert.equal(store.records[0]?.mtt_banner_url_c, '')
  assert.equal(store.records[0]?.mtt_banner_url, 'ab.png')
  assert.equal(saved, true)
})

export interface DebugAccount {
  account: string
  nickname: string
  password: string
}

export const DEBUG_ACCOUNTS: DebugAccount[] = [
  { account: '13110105062', nickname: '牛牛（杰1）', password: '1011abc' },
  { account: '13010105062', nickname: 'AA130（杰2）', password: '1011abc' },
  { account: '13210105062', nickname: '饿了么（万江）', password: '1234567' },
  { account: '18810105002', nickname: '飞驰（万江）', password: 's123456' },
  { account: '15811174413', nickname: 'qqq（智江）', password: 'abc123' },
  { account: '18110105002', nickname: '181（kong1）', password: 's123456' },
  { account: '17110105002', nickname: '171（kong2）', password: 's123456' },
  { account: '19910105001', nickname: '199（kong3）', password: 's123456' },
  { account: '15165171892', nickname: 'xbp(bp1)', password: '123456' },
  { account: '17610868761', nickname: 'xub(bp2)', password: '123456' },
  { account: '15165171895', nickname: 'xub(bp3)', password: '123456' },
  { account: '13610105062', nickname: '美人师兄(md)', password: '1011abc' },
  { account: '18310105002', nickname: '1821（md）', password: '123456' },
  { account: '18410105002', nickname: '18410105002（天代理）', password: 's123456' },
  { account: '18610105002', nickname: '18610105000（天成员）', password: 's123456' },
  { account: '13710105001', nickname: 'King（竞技场代理）', password: '123456' },
  { account: '13310105062', nickname: 'P133（竞技场代理）', password: '1011abc' },
  { account: '19000000001', nickname: '模拟器1', password: '111111' },
  { account: '19000000002', nickname: '模拟器2', password: '111111' },
  { account: '19000000003', nickname: '模拟器3', password: '111111' },
  { account: '19000000004', nickname: '模拟器4', password: '111111' },
  { account: '19000000005', nickname: '模拟器5', password: '111111' },
  { account: '19000000006', nickname: '模拟器6', password: '111111' },
  { account: '18500000000', nickname: '小米', password: '111111' },
  { account: '18700000000', nickname: 'oppo', password: '111111' },
  { account: '19000000000', nickname: '三星测试机', password: '111111' },

]

export const DEFAULT_DEBUG_ACCOUNT = DEBUG_ACCOUNTS.find(
  (item) => item.account === '18410105002',
) ?? DEBUG_ACCOUNTS[0]

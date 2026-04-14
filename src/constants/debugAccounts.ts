export interface DebugAccount {
  account: string
  nickname: string
  password: string
}

export const DEBUG_ACCOUNTS: DebugAccount[] = [
  { account: '13110105062', nickname: '牛牛（竞技场会长）', password: '1011abc' },
  { account: '13010105062', nickname: 'AA130（竞技场管理员）', password: '1011abc' },
  { account: '13210105062', nickname: '饿了么（光头协会会长）', password: '1234567' },
  { account: '18810105002', nickname: '飞驰（天然碱水会长）', password: 's123456' },
  { account: '13610105062', nickname: '美人师兄', password: '1011abc' },
  { account: '15811174413', nickname: 'qqqqqqqq（江）', password: 'abc123' },
  { account: '18110105002', nickname: '18110105002（宇）', password: 's123456' },
  { account: '17110105002', nickname: '17110105002（宇）', password: 's123456' },
  { account: '19910105001', nickname: '19910105001（宇）', password: 's123456' },
  { account: '18410105002', nickname: '18410105002（天代理）', password: 's123456' },
  { account: '18610105002', nickname: '18610105000（天成员）', password: 's123456' },
  { account: '18310105002', nickname: '18210005000（竞、天管理）', password: '123456' },
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
  { account: '15165171892', nickname: 'xbpfire111', password: '123456' },
  { account: '17610868761', nickname: 'xubp111', password: '123456' },
  { account: '15165171895', nickname: 'xubp111', password: '123456' },
]

export const DEFAULT_DEBUG_ACCOUNT = DEBUG_ACCOUNTS.find(
  (item) => item.account === '18410105002',
) ?? DEBUG_ACCOUNTS[0]

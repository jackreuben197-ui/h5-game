# 会话、跨端与接口开发参考

返回 [开发入口](../../README.md) · [渠道 C 产品说明](../channel-c.md)

## 1. Cocos Bridge 与 WS 协作规范

目录分层及 Dialog、Panel、WS 重连和持久化协议详见 [Bridge 参考](../../src/bridge/README.md)。

### 1.1 统一调用协议

H5 与 Cocos 双向交互统一使用函数直调，不再要求 JSON 字符串包裹：

```ts
sendMessage(type, payload, msgtype?, requestId?, timestamp?, source?)
onMessgeRecv(type, payload, msgtype?, requestId?, timestamp?, source?)
```

- `type`：动作名（如 `wsSend`、`wsMessage`、`ccReady`）
- `payload`：动作参数
- `msgtype`：消息处理层级（`0=转发层`，`1=H5 业务层`）
- `requestId` / `timestamp`：可选链路追踪字段
- `source`：可选来源字段（CC 建议传 `cc`）

`msgtype` 约定（当前实现）：

- Cocos -> H5：
  - `msgtype=0` 或未携带：按“转发层”处理（如 WS 透传）
  - `msgtype=1`：按“H5 业务层”处理（如 toast、ready 握手）
- H5 -> Cocos：
  - `msgtype=1`：H5 业务层主动发送
  - `msgtype=0`：H5 代发/回传的网络透传消息（WS 生命周期、WS 消息）
- 兼容说明：
  - 入站消息若未携带 `msgtype`，H5 侧按 `0` 处理，兼容旧协议

Cocos 回调 H5 的推荐入口：

```js
window.H5Bridge.onMessgeRecv(type, payload, msgtype, requestId, timestamp, source)
```

兼容入口（legacy）：

- `window.__H5_GAME_ON_COCOS_MESSAGE__(rawOrObject)`
- `window.postMessage(messageObject, '*')`

### 1.2 职责边界（当前约定）

- 层级关系（同页融合）：
  - `#GameCanvas`（Cocos）在底层，`z-index: 1`
  - `#app`（H5）在上层，`z-index: 10`
  - 需要露出 Cocos 画面时，由 Cocos 下发 `h5Hide`，H5 隐藏 `#app`
  - 需要恢复 H5 时，下发 `h5Show`
- 牌桌内（Cocos 主导）：
  - Cocos 负责 WS 协议编解码（进桌、退桌等业务包）
  - H5 只负责建立连接、透传二进制、回传服务端消息
  - WS 心跳由 H5 统一保活维护（默认每 5 秒发送 `HEARTBEAT(code=2)`）
- 牌桌外（H5 业务可自管）：
  - H5 可独立发送 WS 查询类请求并等待回包（例如战绩）
- WS 连接策略：
  - 默认主流程：H5 在登录阶段主动建立连接
  - `wsConnect` 仅作为 Cocos 侧可选兼容入口（重连/兜底时可用）
- `REGISTER(code=1)`：
  - H5 在 websocket `open` 后自动发送一次（对齐 Cocos）
  - 业务层仍可手动调用补发（可调用多次）
  - 查询请求本身要使用各自业务 `query code`，不是固定 `REGISTER`
- `HEARTBEAT(code=2)`：
  - H5 在 websocket `open` 后自动发送一次并开启定时心跳
  - websocket 关闭/重连/主动断连时自动停止旧心跳

### 1.3 Cocos -> H5 动作规范

说明：

- `wsConnect/wsSend/wsClose` 默认 `msgtype=0`（转发层）
- `h5Hide/h5Show/h5Navigate` 使用 `msgtype=1`（H5 业务层）

1. `wsConnect`（可选）：建立/复用 websocket

```ts
sendMessage('wsConnect', { port: 25201 }, 0)
// 或
sendMessage('wsConnect', { url: 'wss://test2.awanptest.com:25201' }, 0)
```

2. `wsSend`：发送 websocket 消息（仅支持 `text`、`binary`）

```ts
sendMessage(
  'wsSend',
  {
    dataType: 'binary',
    data: buffer, // ArrayBuffer / Uint8Array / Blob
  },
  0,
)
```

说明：

- `dataType="binary"`

3. `wsClose`：关闭 websocket

```ts
sendMessage('wsClose', { code: 1000, reason: 'leave gameplay' }, 0)
```

4. `h5Hide` / `h5Show`：控制 H5 根层显隐（`msgtype=1`）

```ts
sendMessage('h5Hide', {}, 1) // 隐藏 H5，露出 Cocos 画布
sendMessage('h5Show', {}, 1) // 恢复显示 H5
```

5. `h5Navigate`：让 H5 执行路由跳转（`msgtype=1`）

```ts
sendMessage(
  'h5Navigate',
  {
    path: '/club/members',
    query: { clubId: 41, from: 'cocos' },
    replace: false,
    ensureVisible: true,
  },
  1,
)
```

也支持按路由名跳转：

```ts
sendMessage(
  'h5Navigate',
  {
    name: 'club-members',
    params: { id: '41' },
  },
  1,
)
```

### 1.4 H5 -> Cocos 回传规范

1. `wsOpen`：连接成功
2. `wsMessage`：收到服务端消息（文本或二进制）
3. `wsError`：错误
4. `wsClosed`：连接关闭

说明：本节动作默认 `msgtype=0`（转发层）。

示例（收到 WS 二进制后回传）：

```ts
onMessgeRecv(
  'wsMessage',
  {
    dataType: 'binary',
    data: buffer, // 原始 websocket 字节
  },
  0,
)
```

说明：

- `wsMessage` 二进制回传为原始 binary（structured clone），不再经过 base64 中转。

### 1.5 牌桌外 H5 自发 WS 示例

H5 可直接使用 `src/bridge/ws/wsProxy.ts` 暴露的能力处理查询类请求：

```ts
import {
  ensureWsProxyConnected,
  h5SendRegisterPacket,
  h5SendHoldemPacket,
  waitH5WsPacket,
} from '@/bridge/ws'

// 1) 确保已连接
ensureWsProxyConnected({ port: 25201 })

// 2) H5 在 WS open 后会自动 REGISTER，这里保留手动补发能力（可选）
h5SendRegisterPacket()

// 3) 发送查询包（code 必须是业务查询协议号，不是 REGISTER）
h5SendHoldemPacket({
  code: 1300,
  roomId: 0,
  matchId: 0,
  bodyBase64: 'CgQxMjM0',
})

// 4) 等待指定协议号回包
const packet = await waitH5WsPacket(1300, { timeoutMs: 5000 })
console.log(packet.code, packet.roomId, packet.matchId, packet.body)
```

### 1.6 进入牌桌动作（H5 -> Cocos）

H5 点击牌桌后只通知 Cocos 业务意图，不直接发送 EnterRoom WS 包：

```ts
sendMessage(
  'enterTable',
  {
    userName: '玩家昵称',
    userId: '10001',
    token: 'xxx',
    websocketPort: 25201,
    from: 'h5-lobby',
    roomId: '90547896',
    roomName: 'NLH 2/4',
  },
  1,
)
```

### 1.7 H5 / Cocos Ready 握手规范

为避免 H5 与 Cocos 异步加载导致消息丢失，双方在“可接收消息”后执行 ready 握手。

1. H5 侧

- Bridge 入站监听初始化完成后设置：`window.__H5_READY__ = true`
- 若检测到 `window.__CC_READY__ === true`，发送：`sendMessage('h5Ready', {}, 1)`

- 收到 `ccReady` 后立即回复：`sendMessage('h5Ack', {}, 1)`

2. Cocos 侧（约定）

- Cocos 可接收消息后设置：`window.__CC_READY__ = true`
- 若检测到 `window.__H5_READY__ === true`，发送：`onMessgeRecv('ccReady', {}, 1)`

- 收到 `h5Ready` 后回复：`onMessgeRecv('ccAck', {}, 1)`

3. 动作说明

- `ccReady`：Cocos 宣告“我可接收消息”
- `h5Ready`：H5 宣告“我可接收消息”
- `h5Ack` / `ccAck`：对方 ready 消息回执

### 1.8 游客预览与体验账号会话

游客不是“无 token 用户”，而是服务端分配的独立体验账号。H5 负责体验账号的领取、释放、真实身份
拦截和登录后的会话切换；Cocos 只消费 H5 同步后的标准化身份，不解析服务端原始用户字段。

#### 1.8.1 体验账号生命周期

1. `ensureExperienceSession()` 优先使用已有 token 调用 `user/info` 校验身份；只有确认本地没有可用 token
   时，才调用 `/api/user/experience/login` 领取体验账号。并发初始化共享同一个 Promise，禁止重复领取。
2. 体验登录请求携带设备标识、语言和渠道邀请码，但不传经纬度，避免游客预览阶段触发定位授权。
3. `user/info` 返回的 `user_type=6` 只在 `experienceIdentity.ts` 中转换为 `isGuestAccount`。同步给
   Cocos 的 `syncUser` 使用语义字段 `isExperience`，Cocos 不得读取 `raw.user_type`、`ut` 或数字 `6`。
4. 体验账号和真实账号共用 `/api/user/logout`。只有服务端确认退出后才能清理本地 token；真实账号
   登录/注册前必须先退出当前体验账号，避免体验账号一直占用、服务端不断创建新账号。
5. 真实登录失败时重新调用 `ensureExperienceSession()` 恢复游客态。页面退出时对体验账号发送
   `keepalive` 登出请求；本地 token 暂时保留到下次启动校验，避免登出请求尚未到达服务端就重复领取。
6. 游客设置页不展示“退出登录”。真实账号主动退出后可通过 `restoreExperience` 重新进入游客预览态。

本地渠道联调使用 URL 参数 `?invite_code=<测试邀请码>#/home`。该分支仅在 Vite 开发模式下对 localhost/IP 生效，继续调用真实渠道默认俱乐部和体验会话接口。生产构建通过真实域名或分享链接解析渠道；不要在源码里填写固定测试邀请码。

#### 1.8.2 页面预览和真实身份拦截

一级页面只维护一套，不再为游客复制独立页面。路由 `meta` 只决定页面是否允许预览；涉及真实身份的
按钮必须在发出 HTTP/WS 请求前调用 `requireRealUser(pendingAction)`。服务端鉴权错误是兜底，不是游客
交互的主拦截方式。

| 场景 | 游客可预览 | 必须调用 `requireRealUser` 的操作 |
| --- | --- | --- |
| 主页/俱乐部 | 首页内容、俱乐部页、普通桌和比赛列表滚动、在线客服 | 充值、创建牌桌、加入/管理俱乐部等身份操作 |
| 普通牌桌 | 进入牌桌观战 | 点击空座入座 |
| 比赛 | 比赛列表、比赛详情 | 报名、买入、余额不足后的充值 |
| 朋友桌 | 加入页、创建游戏界面 | 输入邀请码加入、最终创建牌桌、模板增删改 |
| 小游戏 | 游戏入口和内容 | 实际参与或报名 |
| 充值/提现 | 页面和说明内容 | 提交充值、提现及订单操作 |
| 消息/我的 | 一级入口和无账号依赖内容 | 消息详情、个人资料、商城及其他账号数据 |

`requireRealUser` 会记录 `pendingAction` 并打开全局登录弹窗；普通 H5 场景登录成功后继续原操作。新增
真实身份功能时，拦截必须放在最靠近用户动作的入口，不能依赖接口报错后再补弹窗。

#### 1.8.3 牌桌内登录并继续入座

牌桌内登录不能热替换 Cocos 的用户和 WS 数据。真实登录成功后必须把 Cocos 当作一次全新启动，重新
执行初始化和进桌流程，再继续原有入座逻辑：

```text
游客观战
  → 点击空座
  → Cocos 发送 h5Navigate(loginContext='table-sitdown')
  → H5 在牌桌上方覆盖登录弹窗
  ├─ 取消：关闭覆盖层，保持游客观战
  └─ 登录/注册：先调用 /user/logout 释放体验账号
       → 获取真实 token
       → tableSitdownAuth(state='switching')
       → 暂停 Cocos WS 写入，清理旧 WS 和 H5 游客会话数据
       → 用真实 token 重新同步 WS 端口、user/info 和俱乐部列表
       ├─ 未加入当前渠道俱乐部：取消待入座并跳转官方首页
       └─ 已加入：重新发送原牌桌 enterTable
            → Cocos 完整初始化并重新进入同一牌桌
            → 房间快照就绪后校验原座位仍为空
            → 调用原有 Sitdown，继续买入/余额不足充值流程
```

H5 事务入口是 `src/session/cocosTableSitdownAuth.ts`。正常联调和生产环境的 `syncPostAuthData()` 必须同时确认 WS、用户信息和
俱乐部列表同步成功，不能在俱乐部请求失败时误判为“用户未加入俱乐部”。事务期间无论成功或异常都要
恢复 Cocos WS 写入。

纯 H5 本地测试使用 `corepack pnpm dev:h5`（`.env.h5`）。只有 `DEV=true` 且 `VITE_H5_ONLY=true` 时，普通 H5 登录才不等待 WS；真实用户资料、俱乐部列表、token 及账号类型校验仍必需。返回结果用 `websocketRequired=false` 表示这一差异，不把未连接伪装为 `websocketSynced=true`。WS 保留一次后台连接与真实推送，失败不自动重连；Cocos 消息不下发。牌桌内登录事务继续要求 WS 就绪。生产构建即便误带该开关，也不放宽约束。

相关跨端协议：

| 方向 | action | 作用 |
| --- | --- | --- |
| Cocos → H5 | `h5Navigate` + `loginContext='table-sitdown'` | 在当前牌桌上打开登录覆盖层 |
| H5 → Cocos | `tableSitdownAuth` | 通知 `switching` 或 `cancelled`，控制待入座事务 |
| H5 → Cocos | `syncUser` | 同步标准化真实身份和 `isExperience` |
| H5 → Cocos | `enterTable` | 使用真实 token 和新 WS 端口重新进原牌桌 |

新增或修改这些字段时，先更新并构建 `h5-cc-bridge`，再同步 H5 的冻结协议副本，最后刷新 H5/Cocos
依赖锁文件。不能只修改某一端的本地类型。

## 2. 协议依赖同步（Protobuf）

Bridge 的 action/payload 类型与服务端 protobuf 是两种依赖：前者由 `@bridge-protocol` 和 `VITE_BRIDGE_TARGET` 选择；后者统一由 `@silenthill/agreement-web` 提供。

```bash
pnpm sync:protocol
pnpm check:protocol
```

`sync:protocol` 使用 package.json 声明的 pnpm 版本更新协议依赖及锁文件，随后检查运行时和类型声明。`check:protocol` 验证 155 活动奖励的协议号、正式解码类及声明；`predev`、`prebuild` 也会执行该检查。缺失时先更新上游生成产物，禁止手工补 protobuf 字段编号或改 node_modules。

`@holdem-pb` 的类型入口由 `src/types/holdem-pb.d.ts` 转发包的正式 exports.types；运行时代码由 Vite 插件把 `holdem-pb.js` 注入页面，在构建时发布到 `dist/libs/`。H5 和 Cocos 应使用相同的服务端协议版本，升级后一起检查锁文件和融合包的运行时资源，不在文档中固定某次提交的 SHA。

| 命令 | 数据来源与产物 | 提交要求 |
| --- | --- | --- |
| `sync:i18n` | 同级语言包构建优先，否则依赖包；复制到 `public/h5-cc-i18n.min.js` | 本仓库跟踪该运行文件，语言变更时检查其 diff |
| `sync:protocol` | 更新 `@silenthill/agreement-web` 及 `pnpm-lock.yaml` | 提交相关依赖变更和锁文件，生成运行时由构建输出 |

新增 WS 业务消息时，按 [Bridge 的 WS 解析流程](../../src/bridge/README.md#84-后续新增-ws-业务消息的建议流程)注册正式解码和分发。协议二进制回归见 `tests/channelCProtocol.test.ts`。


## 3. 渠道 C 接口维护

页面规则统一见 [产品文档](../channel-c.md)，本节只记录实现和接口约定，不维护一次性交付清单。

### 3.1 配置与列表

| 数据 | 约定 | 主要实现 |
| --- | --- | --- |
| 渠道菜单 | `/org/club/default` 的 `h5_menu`：1=B、2=A、3=C，缺省 A；登录后的其他俱乐部不决定渠道菜单 | `useChannelBottomMenu.ts`、`features/channelC/menu.ts` |
| 推荐与说明 | 只认数字 `is_top === 1`；`room_intro` / `room_features` 缺省不占行 | `features/channelC/model.ts`、`lobbyDisplayFields.ts` |
| Banner | `/misc/banner_lobby` 与 `/misc/banner/list` 保留各自现有用途；H5 / Telegram 场景为 1 / 2；C 取 `image_url_c`，A/B 取 `image_url` | `useLobbyBannerImages.ts`、`api/misc.ts` |
| MTT 封面 | C 使用 `mtt_banner_url_c`，A/B 保留 `mtt_banner_url`；缺失 / 加载失败按卡片规格兜底 | `ChannelCMttCard.vue` |
| MTT 系列 | `mtt_series_list[].id` 与 `series_id` 关联；`type=1/2/3` 对应大 / 中 / 小，场次数补偿复用 A/B | `utils/mttCardLayout.ts` |
| 多选筛选 | 玩法、盲注、赛事类型、赛事分类保持数组；同组并集，跨组交集 | `features/channelC/filters.ts`、`useChannelCFilters.ts` |

HTTP 完整记录、缓存比对及 WS 变化记录都需保留显式 `0`、`false` 和空字符串；只有字段缺失才保留旧值。不能将历史 `is_hot` 推断成新的推荐标记。

牌桌最低买入仍为 `sb × 2 × min_rate`，时间使用 `start_time` 与秒单位 `play_duration`。免费 / 收费按 `apply_fee_pool`，猎人赛按 `hunter_on`，滚雪球优先 `snowball_on`，缺省时兼容已有 `hunter_bonus` 规则。不要在 UI 里建立另一套判断。

CMS / 扩展服务协作时，牌桌新展示字段在请求 body 顶层，原完整房间配置保留；MTT 配置沿用 `template` / `config` 各自既有接口层级，不能统一拍平所有响应。后台 A/B、C 图片分别保存；数组允许主动清空，加载失败不能把默认空数组回写成配置。客户端只调用客户端 API，不调用 CMS 管理接口。

### 3.2 奖励查询、状态和单位

统一调用 `POST /api/prop/tribe/reward/info`，body 为：

```json
{ "club_id": 123, "reward_type": "all" }
```

现有 HTTP 客户端负责 `/api` 前缀与鉴权。直接读取 `data.hand_reward`、`invite_reward`、`first_recharge_reward`、`daily_recharge_reward`、`tribe_id` 和 `hand_reward_club_id`；不要多展开一层 `data`。入口先经真实账号校验。

`useTribeRewardStore` 按账号和目标俱乐部隔离，同一范围并发请求合并；旧账号 / 旧俱乐部的迟到响应不能覆盖当前范围。通知触发查询期间需合并为一次后续刷新。充值模式切换复用这份配置，缺失 / `rewards=null` 按空列表，失败允许重试，不补展示数据。

| 字段 | 语义 / 单位 |
| --- | --- |
| `current_count` | 当前玩家手数或有效邀请数，由服务端统计 |
| `completed` / `earned` | 条件完成 / 已建奖励单，仍可能待发奖 |
| `rewarded` | 只有严格为 `true` 才表示已到账 |
| `delivered` | 通知发送状态，不能用于判定已到账 |
| `reward_gold` | UC，直接展示，不除以 100 |
| `start_amount` / `end_amount` | 充值区间，单位 UC，不除以 100；旧钱包奖励适配遵循同一规则 |
| `sb` / `prop_value` | 分单位，只在展示归一化时除以 100 一次 |
| `prop_name` | 服务端多语言名称 ID，先解析公共名称模板，再回退语言包 / 原文 |

### 3.3 活动奖励通知

订阅 `155 / Code.MSG_S_TRIBE_ACTIVITY_REWARD`，使用共享包正式 `ServerMessageTribeActivityReward` 解码：`order_no`、`tribe_id`、`club_id`、`reward_kind`、`tier`、`reward_gold`、`reward_props`。

`reward_kind=1` 为对局，2 为邀新；未知类型使用通用到账标题，旧 133 沿用充值来源。保留 `reward_kind/tier`，按 `order_no` 去重；155 可补全同单旧 133 正在展示或排队的内容。旧订单成功通知继续负责关闭支付弹窗。

H5 不可见时活动通知排队，回到大厅后展示；旧充值通知保留牌局中不补弹的行为。登出 / 切号清空队列，活动通知刷新同俱乐部或同联盟的已打开活动页，不在前端发奖或累加钱包。

主要实现为 `bridge/ws`、`features/tribeReward`、`stores/tribeReward.ts`、`GlobalRechargeRewardPopup.vue`。维护协议时同时检查业务类型、安装包声明、二进制解码和浏览器脚本版本，避免只更新 TypeScript 而继续加载旧 protobuf。

### 3.4 邀请与注册

- 分享链接和二维码统一通过 `channelPackage.ts` / `playerInvitation.ts` 生成；域名、普通邀请、代理邀请码及 `random_id` 的产品规则见 [邀请分享](../channel-c.md#8-邀请分享与注册归因)。
- 所有邀请角色均携带 `random_id`：管理员和普通玩家读 `user/info.user.un_id`；代理可读俱乐部用户详情 `user_info.random_id`，缺失时回退到当前玩家 `un_id`。不是内部用户主键或俱乐部随机 ID。
- 同时读取普通查询参数和 hash 查询参数；优先 `random_id`，兼容旧 `inviter_random_id`。按正的安全整数校验。
- `PLAYER_INVITATION` 将邀请人 ID 与本次有效邀请码一起缓存，代理码另存 `AGENT_INVITE_CODE`；代理码与邀请人 ID 可以同时存在。新邀请不能串用旧 ID，跨页面仍保留同一次邀请的两个字段。
- `LoginModal.handleRegister` 通过 `withPlayerInviter()` 组装 `UserRegisterRequest`，所有邀请角色均将链接中的 `random_id` 映射为数字 `inviter_random_id`；`/user/invite_register` 使用同一请求字段。`invite_code` 沿用既有规则：代理取 `i` 中的代理码，其他取俱乐部码。`random_id` 仅用于链接，不作为注册请求字段。
- `register` 响应可包含 token 等登录字段；`invite_register` 的 data 为手机号 / 邮箱字符串，分别声明响应类型。登录 / 注册成功后清除邀请缓存。

### 3.5 维护验证入口

| 范围 | 回归入口 |
| --- | --- |
| 字段、增量和协议 | `channelCContract.test.ts`、`channelCStoreUpdates.test.ts`、`channelCProtocol.test.ts` |
| 排序、筛选和搜索 | `channelCFeed.test.ts`、`channelCFilters.test.ts`、`channelCSearch.test.ts` |
| 图片与 API | `lobbyBannerVariants.test.ts`、`channelCApi.test.ts` |
| 邀请与域名 | `playerInvitationFlow.test.ts`、`channelPackageDomains.test.ts`、`channelCustomDomain.test.ts` |
| 奖励 | `tribeRewardApi.test.ts`、`tribeRewardStore.test.ts`、`tribeReward.test.ts`、`rechargeReward.test.ts` |

这些测试验证本地规则和接口契约；涉及真实账号的数据统计、支付、自动发奖及推送时，仍需相应测试环境的端到端验证，不沿用历史文档里的固定测试项数或“已验收”结论。

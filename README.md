# h5-game

牌桌外 H5 项目（嵌入 Cocos WebView）。

## 1. 技术栈

- Vue 3 + TypeScript + Vite
- Sass (SCSS)
- Vant 4（按需引入）
- Vue Router
- Pinia + pinia-plugin-persistedstate
- Axios
- Dayjs
- VueUse
- @vitejs/plugin-legacy

## 2. 环境要求

- Node.js `>=20.19`
- 推荐 Node.js `24 LTS`
- pnpm `10.x`（建议）
- macOS / Windows / Linux 均可

检查命令：

```bash
node -v
pnpm -v
```

## 3. 首次拉取后完整运行流程

进入项目目录

### 3.1 安装并切换 Node（推荐 nvm）

```bash

# 安装 24
nvm install 24

# 切换到 24
nvm use 24

# 可选：设置默认版本（新终端自动生效）
nvm alias default 24
```

如果你看到 `N/A: version "v24" is not yet installed`，先执行 `nvm install 24` 再 `nvm use 22`。

### 3.2 启用 pnpm（corepack）

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

### 3.3 安装依赖并启动

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm dev
```

浏览器访问终端输出的地址（通常是 `http://localhost:5173`）。

首次安装如果看到：

```text
Ignored build scripts: @parcel/watcher, core-js
```

这是 pnpm 10 的安全提示，当前项目可正常开发和构建；如需放开再按需执行 `pnpm approve-builds`。

## 4. 环境变量

项目已内置默认后端（生产）：

```bash
VITE_API_BASE_URL=https://test2.awanptest.com/api
```

位置：`/Users/wangjie/web/cocos/h5-game/.env`

开发环境已单独配置（用于解决本地 CORS）：

```bash
VITE_API_BASE_URL=/api
VITE_PROXY_TARGET=https://test2.awanptest.com
```

位置：`/Users/wangjie/web/cocos/h5-game/.env.development`

如果你要切换环境，可以在命令前临时覆盖：

```bash
VITE_API_BASE_URL=https://your-api-domain pnpm dev
```

## 4.1 本地 CORS 说明

- 本地 `pnpm dev` 时，前端请求会先打到同源 `/api`
- Vite 会把 `/api/*` 代理到 `VITE_PROXY_TARGET`
- 代理不再重写路径，因此最终是 `https://test2.awanptest.com/api/*`
- 这样浏览器端不再直接跨域到后端，登录接口可正常调用
- 注意：生产环境若仍是跨域访问，仍需要服务端配置 CORS 或走同域网关

## 5. 自适应方案（当前实现）

当前采用 `rem + 动态根字体` 方案（基于 375 设计稿）：

- `src/utils/rem.ts` 在运行时设置 `html font-size`
- 基准：设计稿宽度 `375`，`1rem = 37.5px(设计稿)`，会随屏宽等比缩放
- 设计令牌 + SCSS 变量（`src/styles/_tokens.scss`）
- 断点媒体查询（`src/styles/_mixins.scss`）
- `safe-area-inset-*` 适配刘海屏/底部安全区
- `viewport-fit=cover`（见 `index.html`）

## 6. 打包与发布

生产构建：

```bash
pnpm build
```

本地预览构建产物：

```bash
pnpm preview
```

构建产物目录：`dist/`。
把 `dist/` 内容放到 Cocos WebView 资源目录，再打 Cocos 最终包。

## 7. 目录结构（关键）

- `src/views/auth/LoginView.vue`
- `src/views/lobby/LobbyView.vue`
- `src/views/debug/BridgeDebugView.vue`
- `src/bridge/`：H5 与 Cocos 通信桥
- `src/styles/`：tokens / mixins / reset / page-shell / app-components / vant-overrides / responsive

## 8. 样式开发约定

- 页面优先使用现成结构类：`.page-shell`、`.section-card`、`.section-title`
- 大小优先用设计变量，不要在页面散写大量 `rem` 数字
- 业务局部样式放在页面 SFC，通用样式放 `src/styles/`

备注：

- 375 设计稿下，`1rem = 37.5px(设计稿)`，优先按设计稿标注换算到 rem
- 页面内避免硬编码十进制长小数，优先使用 tokens 变量
- 新增通用样式时，先放 `src/styles/`，避免重复复制到多个页面

### 8.1 页面滚动公共类

为避免真机与浏览器模拟器滚动行为不一致，项目提供两个滚动辅助类（定义在 `src/styles/_utilities.scss`）：

- `app-scroll-page`：内容撑高辅助类（用于页面内容可能超高的场景）
- `app-scroll-standalone`：独立路由页面滚动视口类（用于不复用 `MainLayoutView` 的页面）

使用规则：

1. 页面复用 `MainLayoutView`（如首页/俱乐部/消息/我的主模块页面）：
- 视口滚动由 `MainLayoutView` 统一负责。
- 页面根节点可按需补 `app-scroll-page`，用于避免内容被 flex 压缩。

2. 页面不复用 `MainLayoutView`（独立详情页/列表页）：
- 页面根节点必须加 `app-scroll-standalone`，创建稳定滚动视口。
- 若页面内部存在复杂 flex 结构，建议同时加 `app-scroll-page`。

示例：

```vue
<!-- 复用 MainLayoutView 的页面 -->
<div class="message-page app-scroll-page">...</div>

<!-- 独立路由页面（不走 MainLayoutView） -->
<div class="club-room-history-bg app-scroll-standalone app-scroll-page">...</div>
```

## 9. Cocos Bridge 与 WS 协作规范

目录分层说明见：`src/bridge/README.md`。

### 9.1 统一调用协议

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

### 9.2 职责边界（当前约定）

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

### 9.3 Cocos -> H5 动作规范

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

### 9.4 H5 -> Cocos 回传规范

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

### 9.5 牌桌外 H5 自发 WS 示例

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

### 9.6 进入牌桌动作（H5 -> Cocos）

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

### 9.7 H5 / Cocos Ready 握手规范

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

## 10. 多语言（TXT）用法

当前多语言使用 Cocos 同源 `txt` 文件，不依赖 `vue-i18n`：

- Cocos 源目录（单一来源）：`../pokerqueen/assets/resources/config/USER_*.txt`
- H5 运行目录（同步产物）：`public/assets/resources/config/USER_*.txt`
- 启动/打包前自动执行同步：`predev`、`prebuild`
- 可手动执行：`pnpm sync:i18n`
- 解析器：`src/i18n/parser.ts`（`key=value` + `\n` 转义 + `{0}` 占位符）
- 核心模块：`src/i18n/index.ts`
- 组合式 API：`src/i18n/useTextI18n.ts`

示例（`<script setup lang="ts">`）：

```ts
import { useTextI18n } from '@/i18n/useTextI18n'

const { t, setLocale, locale, supportedLocales } = useTextI18n()

setLocale('en')
const text = t('Wallet_AddItem7', 100, 12)
// => Recharge 100 UV cost 12 yuan
```

示例（Options API / 模板）：

```vue
<template>
  <div>{{ $txt('error999') }}</div>
  <div>{{ $txt('Wallet_AddItem7', 100, 12) }}</div>
</template>
```

语言切换与默认规则：

- 支持：`en | pt | zh | cn`
- 优先读取 `localStorage(dzpk_Language)`
- 无缓存时按浏览器语言推断
- 语言文件按需加载（`fetch public/assets/resources/config/*.txt`），避免主包体积暴涨

本地存储统一约定（与 Cocos 对齐）：

- 前缀：`dzpk_`
- 语言 key：`Language`（最终存储项为 `dzpk_Language`）
- 登录态 key：`LOGIN_DATA`（最终存储项为 `dzpk_LOGIN_DATA`）
- token key：`TOKEN`（最终存储项为 `dzpk_TOKEN`）

## 11. 全局业务组件

### 11.1 TopActionButton

位置：`src/components/TopActionButton.vue`

用途：

- 顶部右侧常用操作按钮（文字 + 图标）

Props：

- `name: string` 按钮文字
- `icon: string` 图标地址
- `iconAlt?: string` 图标 alt 文案（可选）

Events：

- `click` 按钮点击事件（透传原始 `MouseEvent`）

示例：

```vue
<TopActionButton name="切换" :icon="walletIcon" icon-alt="wallet" @click="handleTodoClick" />
```

### 11.2 PageBackHeader

位置：`src/components/PageBackHeader.vue`

用途：

- 统一页面头部返回区域
- 内置返回箭头，支持标题和右侧操作区扩展

Props：

- `title?: string` 标题文案（默认空字符串）

Events：

- `back` 点击返回区域触发（透传原始 `MouseEvent`）

Slots：

- `right`：右侧扩展区域（例如操作按钮组）
- `default`：整块自定义内容（优先级高于 `right`）

模式约定（自动判断）：

1. 仅文字（无插槽）
2. 文字 + 右侧插槽（使用 `#right`）
3. 纯插槽内容（使用默认插槽）

示例 1：返回 + 文字

```vue
<PageBackHeader title="大厅" @back="handleBack" />
```

示例 2：返回 + 文字 + 右侧插槽

```vue
<PageBackHeader title="扑克专区" @back="handleBack">
  <template #right>
    <div class="action-wrap">
      <TopActionButton
        name="切换"
        :icon="walletIcon"
        @click="handleTodoClick"
      />
    </div>
  </template>
</PageBackHeader>
```

示例 3：返回 + 纯插槽

```vue
<PageBackHeader @back="handleBack">
  <div class="custom-header-content">
    <span>自定义头部内容</span>
  </div>
</PageBackHeader>
```

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

## 9. Cocos Bridge 与 WS 协作规范

### 9.1 统一消息信封

H5 与 Cocos 双向消息统一使用 JSON 信封：

```json
{
  "action": "wsSend",
  "payload": {},
  "requestId": "cocos_1744780000000_xxx",
  "timestamp": 1744780000000
}
```

- `action`：动作名
- `payload`：动作参数
- `requestId` / `timestamp`：建议携带，便于排查链路

Cocos 回调 H5 的统一入口：

```js
window.__H5_GAME_ON_COCOS_MESSAGE__(rawJsonOrSchemeUrl)
```

### 9.2 职责边界（当前约定）

- 牌桌内（Cocos 主导）：
  - Cocos 负责 WS 协议编解码（心跳、进桌、退桌等）
  - H5 只负责建立连接、透传二进制、回传服务端消息
- 牌桌外（H5 业务可自管）：
  - H5 可独立发送 WS 查询类请求并等待回包（例如战绩）
- WS 连接策略：
  - 默认主流程：H5 在登录阶段主动建立连接
  - `wsConnect` 仅作为 Cocos 侧可选兼容入口（重连/兜底时可用）
- `REGISTER(code=1)`：
  - H5 默认不自动发送
  - 仅在后端要求握手时，H5 才手动调用（可调用多次）
  - 查询请求本身要使用各自业务 `query code`，不是固定 `REGISTER`

### 9.3 Cocos -> H5 动作规范

1. `wsConnect`（可选）：建立/复用 websocket

```json
{
  "action": "wsConnect",
  "payload": {
    "port": 25201
  }
}
```

或

```json
{
  "action": "wsConnect",
  "payload": {
    "url": "wss://test2.awanptest.com:25201"
  }
}
```

2. `wsSend`：发送 websocket 消息（仅支持 `text` 与 `binary-base64`）

```json
{
  "action": "wsSend",
  "payload": {
    "dataType": "binary-base64",
    "data": "WU0AAv//////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAIQ..."
  }
}
```

3. `wsClose`：关闭 websocket

```json
{
  "action": "wsClose",
  "payload": {
    "code": 1000,
    "reason": "leave gameplay"
  }
}
```

### 9.4 H5 -> Cocos 回传规范

1. `wsOpen`：连接成功
2. `wsMessage`：收到服务端消息（文本或二进制 base64）
3. `wsError`：错误
4. `wsClosed`：连接关闭

示例（收到 WS 二进制后回传）：

```json
{
  "action": "wsMessage",
  "payload": {
    "dataType": "binary-base64",
    "data": "WU0AAv//////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAIQ..."
  }
}
```

### 9.5 牌桌外 H5 自发 WS 示例

H5 可直接使用 `src/bridge/wsBridge.ts` 暴露的能力处理查询类请求：

```ts
import {
  ensureWsProxyConnected,
  h5SendRegisterPacket,
  h5SendHoldemPacket,
  waitH5WsPacket,
} from '@/bridge/wsBridge'

// 1) 确保已连接
ensureWsProxyConnected({ port: 25201 })

// 2) 仅在后端要求握手时，手动 REGISTER（可选）
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

```json
{
  "action": "enterTable",
  "payload": {
    "userName": "玩家昵称",
    "userId": "10001",
    "token": "xxx",
    "websocketPort": 25201,
    "from": "h5-lobby",
    "roomId": "90547896",
    "roomName": "NLH 2/4"
  }
}
```

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

- 支持：`zh | tw | en | pt`
- 优先读取 `localStorage(dzpk_Language)`
- 无缓存时按浏览器语言推断
- 语言文件按需加载（`fetch public/assets/resources/config/*.txt`），避免主包体积暴涨
- 如果你的 Cocos 项目不在默认相对路径，可在执行命令前设置：
  - `COCOS_I18N_SOURCE_DIR=/your/cocos/assets/resources/config pnpm dev`

本地存储统一约定（与 Cocos 对齐）：

- 前缀：`dzpk_`
- 语言 key：`Language`（最终存储项为 `dzpk_Language`）
- 登录态 key：`LOGIN_DATA`（最终存储项为 `dzpk_LOGIN_DATA`）
- token key：`TOKEN`（最终存储项为 `dzpk_TOKEN`）

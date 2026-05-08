# Bridge 目录说明

本文档说明 `src/bridge` 各子目录职责边界，目标是让后续改动能快速判断“代码该放哪里”。

## 1. 目录分层

```text
src/bridge
├── core/       # H5 <-> Cocos 通道与握手（底层传输）
├── protocol/   # 动作常量、消息信封、双向 payload 类型
├── ws/         # H5 代理服务器 WebSocket（连接、收发、重连、解析）
├── channels/   # Cocos -> H5 的业务通道（UI/Toast/路由等）
├── sync/       # H5 HTTP 结果同步到 Cocos
└── index.ts    # 顶层聚合导出
```

## 2. 各文件夹功能说明

### `core/`

职责：

- 统一 H5 与 Cocos 的消息收发入口。
- 管理 ready/ack 握手状态（`__H5_READY__` / `__CC_READY__`）。
- 处理多种桥接通道能力探测（direct call / injected / webkit / postMessage / scheme）。

典型文件：

- `cocosBridgeChannel.ts`：`sendBridgeMessage`、`subscribeCocosMessages`、握手管理。

不应放在这里的内容：

- 服务器 websocket 逻辑。
- 具体业务动作处理（如 toast、路由跳转、列表刷新）。

---

### `protocol/`

职责：

- 定义跨端约定的动作名（`BRIDGE_ACTION`）。
- 定义消息信封结构（`BridgeMessage`、`msgtype`、`requestId` 等）。
- 定义 Cocos -> H5 与 H5 -> Cocos 的 payload 类型。

典型文件：

- `actions.ts`：动作常量与 `msgtype` 常量。
- `message.ts`：消息规范化、解析、序列化。
- `cocosToH5.ts`：Cocos 下发到 H5 的 payload 类型。
- `h5ToCocos.ts`：H5 回传给 Cocos 的 payload 类型。

维护约定：

- 新增 action 必须先加到 `actions.ts`。
- 新增 payload 类型必须归类到 `cocosToH5.ts` 或 `h5ToCocos.ts`。

---

### `ws/`

职责：

- H5 侧代理 websocket：连接、发送、接收、关闭、重连、心跳。
- 把服务端消息透传给 Cocos（按约定 `dataType` + 原始 binary/text）。
- 对服务端二进制包做协议头解析（仅用于分流与日志，不改写透传数据）。
- 提供 H5 自身的 ws 订阅与按 code 分发能力。

典型文件：

- `wsProxy.ts`：桥接动作 `wsConnect/wsSend/wsClose` 的核心实现。
- `holdemPacket.ts`：Holdem 包头编解码与 code 解析。
- `messageCenter.ts`：H5 业务按 code 订阅 WS 消息。

不应放在这里的内容：

- UI 显隐、toast、路由等页面逻辑。
- HTTP 响应同步逻辑。

---

### `channels/`

职责：

- 消费 Cocos -> H5 的业务消息，并落到具体 UI 行为。
- 仅处理“业务层动作”，不处理底层传输细节。

典型文件：

- `toastChannel.ts`：`showToast` / 兼容 toast 动作。
- `uiChannel.ts`：`h5Hide`、`h5Show`、`h5Navigate`。

维护约定：

- 每个业务通道建议单文件，命名为 `xxxChannel.ts`。
- 页面相关副作用尽量封装在对应 channel，避免散落在 `main.ts`。

---

### `sync/`

职责：

- 把 H5 的 HTTP 结果（如 `user/info`、`user_club`、`rooms/list`）同步给 Cocos。
- 与握手状态联动：握手完成后再下发需要延迟同步的消息。

典型文件：

- `h5BusinessSync.ts`：`forwardUserInfoToCocos`、`forwardUserClubToCocos`、`forwardRoomsListToCocos`。

不应放在这里的内容：

- 真实 HTTP 请求本身（请求仍在 `src/api`）。
- WebSocket 长连接收发。

## 3. 新需求如何归类

1. 新增跨端动作名或 payload 结构：放 `protocol/`。
2. 改桥接收发方式、握手、source/msgtype 过滤：放 `core/`。
3. 与服务器 websocket 长连接相关：放 `ws/`。
4. Cocos 下发后触发 H5 UI 行为：放 `channels/`。
5. H5 HTTP 结果同步给 Cocos：放 `sync/`。

## 4. 命名建议

- 文件名：`lowerCamelCase`。
- 通道类文件后缀：`Channel.ts`。
- websocket 代理类文件后缀：`Proxy.ts`。
- 协议常量统一使用 `BRIDGE_ACTION`，不要在业务代码中写硬编码字符串。

## 5. 对外导出约定

- 子目录内通过 `index.ts` 聚合导出。
- 上层模块优先从 `@/bridge/<layer>` 引用，而不是跨层深路径引用。
- `src/bridge/index.ts` 仅做总聚合导出，不放业务逻辑。

## 6. WebSocket 协议解析（H5 侧）

### 6.1 分层原则

- `wsProxy.ts` 负责连接、收发、重连、心跳、原始消息透传给 Cocos。
- `holdemPacket.ts` 只负责包头解析（取 code、token、body 等基础字段）。
- `messageCenter.ts` 负责“按 code 分发订阅”。
- `roomChangeNotify.ts` 与 `mttNotify.ts` 负责“业务 protobuf 解析 + 结构映射”。

### 6.2 现状：使用生成 protobuf 代码解析

当前 H5 对以下 code 使用生成的 protobuf 代码（与 Cocos/Unity 思路一致）：

- `140` `ROOM_CHANGE_NOTIFY`
- `151` `USER_MTT_CHANGE_NOTIFY`
- `152` `USER_SNG_CHANGE_NOTIFY`
- `153` `MTT_SERIES_NOTIFY`

对应实现：

- `src/bridge/ws/roomChangeNotify.ts`
- `src/bridge/ws/mttNotify.ts`

生成文件位置：

- `src/bridge/ws/pb/protobuf/holdem/*.js`
- `src/bridge/ws/pb/protobuf/holdem/*.d.ts`

**懒加载策略**：pb 类在 decoder 模块初始化时通过 fire-and-forget `void import(...)` 后台预取，不阻塞主包加载。`define_pb.js`（约 975 KB，gzip ~92 KB）与所有 recv pb 文件被单独打入 `pb-holdem` chunk，不进入主 bundle，首屏不加载。

**类型安全**：使用 `import type` + `typeof ClassName` 获取 pb 构造函数类型（仅类型位置，零运行时开销），通过 `null` 守卫保证 pb 尚未加载完成时 decode 函数安全返回 `null`。

### 6.3 为什么不再手写 wire 解析

- 与 Cocos/Unity 的字段定义保持一致，减少协议偏差。
- 新增/变更字段时只需更新生成文件与映射层，维护成本更低。
- 避免手写 varint / fieldNo / wireType 时遗漏字段或类型不一致。

### 6.4 后续新增 WS 业务消息的建议流程

1. 在 `scripts/update_protocol.sh` 的 `H5_RECV_FILES` 数组中追加新协议的 pb 文件名（不含扩展名，如 `recv_g_xxx_notify_pb`）。
2. 执行 `pnpm sync:protocol`，将 pb 生成文件（`.js` + `.d.ts`）同步到 `src/bridge/ws/pb/protobuf/holdem/`，并把更新的文件提交到 git。
3. 在 `messageCenter.ts` 新增对应 code 常量（如需要）。
4. 新增 `xxxNotify.ts` decoder 文件：
   - 用 `import type` 引入 pb 类型（零运行时）。
   - 用 `void import(...).then(mod => { pbClass = mod.XxxClass })` 懒加载 pb 类（fire-and-forget）。
   - 提供 `decodeXxxFromRawPacket(rawPacket)` 方法，在 pb 类未就绪时安全返回 `null`。
5. 在 store 或业务层通过 `subscribeH5WsCode/subscribeH5WsCodes` 订阅并消费。
6. 仅在映射层输出 H5 业务需要的数据结构，不在 `wsProxy.ts` 混入业务逻辑。
7. 更新本 README 6.2 节的协议列表。

### 6.5 Vite CJS→ESM 插件与分包策略

**问题背景**：`protoc-gen-js` 生成的 pb 文件是 CommonJS 格式（`require()`），而 Vite 工程启用了 `"type": "module"`，直接 `import` 会触发 `ReferenceError: require is not defined`。

**解决方案**：`vite.config.ts` 中的 `pbCjsToEsmPlugin` 在 Rollup `transform` 钩子内联完成 CJS→ESM 转换，无需修改生成文件：

- 注入 `import jspb from 'google-protobuf'` 替代 `require('google-protobuf')`。
- 注入 `import * as protobuf_holdem_define_pb from './define_pb.js'` 替代 `require('./define_pb.js')`。
- 从 `goog.exportSymbol(...)` 调用中提取符号名，生成具名 ESM `export { ... }` 语句。
- 同时作用于 `vite dev`（transform 阶段）和 `vite build`（Rollup transform 钩子），无需额外配置。

**分包**：`manualChunks` 将所有 `/bridge/ws/pb/` 路径文件归入独立的 `pb-holdem` chunk，不进入主 bundle，按需动态加载。

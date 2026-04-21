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

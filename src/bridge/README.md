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
- `dialogChannel.ts`：`showDialog` / `dialogResult` 双向交互弹窗。
- `panelChannel.ts`：`showPanel` / `panelEvent` / `closePanel` 复杂交互面板。
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

## 6. Dialog Bridge 使用说明

### 6.1 适用场景

`toast` 适合单向提示；`dialog` 适合需要用户确认、取消、关闭后再把结果回传给 Cocos 的场景。

当前实现采用“全局 Host + 协议驱动”模式：

- Cocos 下发 `showDialog`
- H5 全局 `dialogChannel.ts` 接收消息
- 根组件中的 `GlobalBridgeDialogHost.vue` 使用 `GameDialog.vue` 展示
- 用户点击确认/取消/关闭后，H5 回传 `dialogResult`

这意味着业务页面不需要各自常驻一个 dialog，只需要在应用根部保留一个全局宿主组件。

### 6.2 相关文件

- `src/bridge/protocol/actions.ts`
- `src/bridge/protocol/cocosToH5.ts`
- `src/bridge/protocol/h5ToCocos.ts`
- `src/bridge/channels/dialogChannel.ts`
- `src/components/Dialog/GlobalBridgeDialogHost.vue`
- `src/components/Dialog/GameDialog.vue`

### 6.3 协议约定

#### Cocos -> H5

action: `showDialog`

payload 类型：`CocosDialogPayload`

```ts
interface CocosDialogPayload {
  title?: string
  message: string
  showCancelButton?: boolean
  showConfirmButton?: boolean
  cancelButtonText?: string
  confirmButtonText?: string
  closeOnClickOverlay?: boolean
  ensureVisible?: boolean
}
```

说明：

- `message` 必填。
- `showCancelButton` 为 `true` 时显示取消按钮。
- `showConfirmButton` 默认 `true`。
- `closeOnClickOverlay` 默认 `false`。
- `ensureVisible` 默认 `false`，这样 dialog 会直接覆盖在 Cocos canvas 上，而不会把整个 H5 页面重新显示出来。
- 只有明确传 `ensureVisible: true` 时，才会在弹窗前调用 `setH5Visible(true)`。
- 本次请求使用桥接消息自带的 `requestId` 作为 dialog 请求标识，无需业务层额外传 `dialogId`。

#### H5 -> Cocos

action: `dialogResult`

payload 类型：`DialogResultPayload`

```ts
interface DialogResultPayload {
  dialogRequestId: string
  action: 'confirm' | 'cancel' | 'close'
}
```

说明：

- `dialogRequestId` 对应最初 `showDialog` 那条桥接消息的 `requestId`。
- `confirm` 表示点击确认按钮。
- `cancel` 表示点击取消按钮。
- `close` 表示通过遮罩关闭或外部关闭。

### 6.4 Cocos 侧发送示例

```ts
H5MsgMgr.sendToH5('showDialog', 1, {
  title: '提示',
  message: '是否离开当前牌桌？',
  showCancelButton: true,
  confirmButtonText: '确定',
  cancelButtonText: '取消',
})
```

如果只需要一个单按钮提示，也可以只传文案：

```ts
H5MsgMgr.sendToH5('showDialog', 1, {
  message: '报名成功',
})
```

### 6.5 Cocos 侧接收结果示例

```ts
H5MsgMgr.Instance.on('dialogResult', (payload) => {
  if (!payload?.dialogRequestId) {
    return
  }

  if (payload.action === 'confirm') {
    // 用户确认
    return
  }

  if (payload.action === 'cancel' || payload.action === 'close') {
    // 用户取消或关闭
  }
})
```

如果同一时刻可能存在多类弹窗流程，建议 Cocos 侧用 `dialogRequestId` 关联本次业务上下文，再决定后续逻辑。

## 7. Panel Bridge 使用说明

### 7.1 适用场景

当 Cocos 需要拉起一个“不是简单确认框”的 H5 交互层时，推荐使用 `panel bridge`：

- 内部有 tab 切换
- 有图片、活动说明、奖励列表
- 有多种按钮和上报事件
- 内容由 Cocos 传参驱动

这类场景不建议让 Cocos 直接拼 HTML，而是由 H5 预先准备可复用面板组件，Cocos 只传：

- `panelType`
- `title`
- `props`

H5 再根据 `panelType` 动态加载对应组件并渲染。

### 7.2 相关文件

- `src/bridge/protocol/actions.ts`
- `src/bridge/protocol/cocosToH5.ts`
- `src/bridge/protocol/h5ToCocos.ts`
- `src/bridge/channels/panelChannel.ts`
- `src/components/BridgePanel/GlobalBridgePanelHost.vue`
- `src/components/BridgePanel/panelRegistry.ts`

### 7.3 协议约定

#### Cocos -> H5：打开面板

action: `showPanel`

```ts
interface CocosPanelPayload {
  panelType: string
  title?: string
  props?: Record<string, unknown>
  closeOnClickOverlay?: boolean
  ensureVisible?: boolean
}
```

说明：

- `panelType` 必填，用于选择具体 H5 组件。
- `props` 由对应面板组件自行解释。
- `closeOnClickOverlay` 默认 `true`，用户点击遮罩会直接关闭当前 panel，并回传 `panelEvent(close)`。
- `ensureVisible` 默认 `false`，因此默认覆盖在 Cocos 牌桌上，而不会把整个 H5 页面显示出来。

#### Cocos -> H5：关闭面板

action: `closePanel`

```ts
interface ClosePanelPayload {
  requestId?: string
  panelType?: string
}
```

说明：

- 两个字段都不传时，关闭当前活动面板。
- 传 `requestId` 或 `panelType` 时，仅在匹配当前面板时才关闭。

#### H5 -> Cocos：面板事件回传

action: `panelEvent`

```ts
interface PanelEventPayload {
  panelRequestId: string
  event: string
  payload?: unknown
}
```

说明：

- `panelRequestId` 对应最初 `showPanel` 的桥接消息 `requestId`。
- `event` 用于区分交互类型，如 `tabChange`、`primaryAction`、`close`。
- `payload` 可携带 tab key、按钮参数、表单值等业务数据。

### 7.4 Cocos 侧发送示例

```ts
H5MsgMgr.sendToH5('showPanel', 1, {
  panelType: 'richTabsDemo',
  title: '活动中心',
  props: {
    heading: '五月活动',
    summary: '不同 tab 的内容由 Cocos 动态控制',
    defaultTab: 'reward',
    tabs: [
      {
        key: 'reward',
        label: '奖励说明',
        description: '累计完成任务后即可领取奖励',
        imageUrl: 'https://example.com/reward-banner.png',
        bullets: ['完成 3 局', '累计带入 1000', '奖励次日发放'],
      },
      {
        key: 'task',
        label: '任务列表',
        description: '这里也可以换成更复杂的任务 UI',
        bullets: ['任务 A', '任务 B'],
      },
    ],
  },
})
```

### 7.5 Cocos 侧接收事件示例

```ts
H5MsgMgr.Instance.on('panelEvent', (payload) => {
  if (!payload?.panelRequestId) {
    return
  }

  if (payload.event === 'tabChange') {
    console.log('tab changed:', payload.payload)
    return
  }

  if (payload.event === 'primaryAction') {
    console.log('primary action:', payload.payload)
    return
  }

  if (payload.event === 'close') {
    console.log('panel closed:', payload.payload)
  }
})
```

### 7.6 新增自定义面板的步骤

1. 在 `src/components/BridgePanel/panels/` 新建一个面板组件。
2. 在 `panelRegistry.ts` 注册 `panelType -> 组件` 映射，建议使用异步加载。
3. 组件通过 `panelProps` 接收 Cocos 传参。
4. 组件通过 `emitPanelEvent(event, payload)` 回传交互事件。
5. 组件通过 `closePanel(reason, payload)` 主动关闭。

## 8. WebSocket 协议解析（H5 侧）

### 8.1 分层原则

- `wsProxy.ts` 负责连接、收发、重连、心跳、原始消息透传给 Cocos。
- `holdemPacket.ts` 只负责包头解析（取 code、token、body 等基础字段）。
- `messageCenter.ts` 负责“按 code 分发订阅”。
- `roomChangeNotify.ts` 与 `mttNotify.ts` 负责“业务 protobuf 解析 + 结构映射”。

### 8.2 现状：使用生成 protobuf 代码解析

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

### 8.3 为什么不再手写 wire 解析

- 与 Cocos/Unity 的字段定义保持一致，减少协议偏差。
- 新增/变更字段时只需更新生成文件与映射层，维护成本更低。
- 避免手写 varint / fieldNo / wireType 时遗漏字段或类型不一致。

### 8.4 后续新增 WS 业务消息的建议流程

1. 在 `scripts/update_protocol.sh` 的 `H5_RECV_FILES` 数组中追加新协议的 pb 文件名（不含扩展名，如 `recv_g_xxx_notify_pb`）。
2. 执行 `pnpm sync:protocol`，将 pb 生成文件（`.js` + `.d.ts`）同步到 `src/bridge/ws/pb/protobuf/holdem/`，并把更新的文件提交到 git。
3. 在 `messageCenter.ts` 新增对应 code 常量（如需要）。
4. 新增 `xxxNotify.ts` decoder 文件：
   - 用 `import type` 引入 pb 类型（零运行时）。
   - 用 `void import(...).then(mod => { pbClass = mod.XxxClass })` 懒加载 pb 类（fire-and-forget）。
   - 提供 `decodeXxxFromRawPacket(rawPacket)` 方法，在 pb 类未就绪时安全返回 `null`。
5. 在 store 或业务层通过 `subscribeH5WsCode/subscribeH5WsCodes` 订阅并消费。
6. 仅在映射层输出 H5 业务需要的数据结构，不在 `wsProxy.ts` 混入业务逻辑。
7. 更新本 README 8.2 节的协议列表。

### 8.5 Vite CJS→ESM 插件与分包策略

**问题背景**：`protoc-gen-js` 生成的 pb 文件是 CommonJS 格式（`require()`），而 Vite 工程启用了 `"type": "module"`，直接 `import` 会触发 `ReferenceError: require is not defined`。

**解决方案**：`vite.config.ts` 中的 `pbCjsToEsmPlugin` 在 Rollup `transform` 钩子内联完成 CJS→ESM 转换，无需修改生成文件：

- 注入 `import jspb from 'google-protobuf'` 替代 `require('google-protobuf')`。
- 注入 `import * as protobuf_holdem_define_pb from './define_pb.js'` 替代 `require('./define_pb.js')`。
- 从 `goog.exportSymbol(...)` 调用中提取符号名，生成具名 ESM `export { ... }` 语句。
- 同时作用于 `vite dev`（transform 阶段）和 `vite build`（Rollup transform 钩子），无需额外配置。

**分包**：`manualChunks` 将所有 `/bridge/ws/pb/` 路径文件归入独立的 `pb-holdem` chunk，不进入主 bundle，按需动态加载。

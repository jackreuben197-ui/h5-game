# 缓存与日志开发参考

返回 [开发入口](../../README.md) · [渠道 C 产品说明](../channel-c.md)

## 1. 日志系统

位置：`src/utils/logger.ts`

统一封装 `console.log/info/warn/error`，支持全局 level 控制和单 logger 独立开关。

### 1.1 Level 说明

| Level | 输出内容 |
|-------|---------|
| `debug` | debug / info / warn / error |
| `info` | info / warn / error |
| `warn` | warn / error |
| `error` | error |
| `silent` | 全部静默 |

开发环境默认 `debug`，生产环境默认 `warn`（可被 `VITE_DROP_CONSOLE=true` 在构建时彻底抹除）。
内置可视化调试面板只在开发环境加载；生产排查时显式设置 `VITE_DEBUG_CONSOLE=true`。

### 1.2 在模块中使用

```ts
import { createLogger } from '@/utils/logger'

const log = createLogger('[myModule]')

log.debug('详细数据', { key: value })  // 仅 debug level 输出
log.info('状态变更')
log.warn('异常降级:', error)
log.error('致命错误:', error)
```

同 tag 多次调用 `createLogger` 返回同一实例（注册表单例）。

### 1.3 已注册的 logger 及职责

| Tag | 文件 | 职责 |
|-----|------|------|
| `[ws]` | `bridge/ws/wsProxy.ts` | WS 连接状态、重连、鉴权 |
| `[wsSend]` | `bridge/ws/wsProxy.ts` | WS 发包（每个 packet 详情） |
| `[wsRecv]` | `bridge/ws/wsProxy.ts` | WS 收包（每个 packet 详情） |
| `[bridge][h5->cc]` | `bridge/core/cocosBridgeChannel.ts` | H5 发给 Cocos 的非转发消息 |
| `[bridge][cc->h5]` | `bridge/core/cocosBridgeChannel.ts` | Cocos 发给 H5 的非转发消息 |
| `[bridge]` | `bridge/channels/uiChannel.ts` | navigate / visibility 等 bridge UI 事件 |
| `[roomList]` | `stores/roomList.ts` | 房间列表拉取与 WS 推送 |
| `[mttList]` | `stores/mttList.ts` | MTT 列表拉取与 WS 推送 |
| `[i18n]` | `i18n/index.ts` / `utils/multiLanguageTemplate.ts` | 语言包加载 |
| `[h5]` | `main.ts` | 应用挂载 |

### 1.4 运行时动态控制

项目在 `window.__log` 上暴露了运行时调试方法，可直接在浏览器控制台调用：

```js
// 查看所有 logger 及当前 level
__log.list()

// 全局静默 debug/info（常用：关掉 WS/Bridge 刷屏）
__log.setGlobalLevel('warn')

// 单独控制某个 logger
__log.setLevel('[wsSend]', 'silent')      // 关掉 WS 发包日志
__log.setLevel('[wsRecv]', 'silent')      // 关掉 WS 收包日志
__log.setLevel('[bridge][h5->cc]', 'silent')  // 关掉 H5→Cocos 消息
__log.setLevel('[bridge][cc->h5]', 'silent')  // 关掉 Cocos→H5 消息

// 恢复某个 logger 跟随全局
__log.setLevel('[wsSend]', null)

// 公告富文本外链默认使用浏览器跳转
__log.getIframeMode()       // false

// 开启 iframe 模式（仅影响公告富文本中的第三方链接）
__log.setIframeMode(true)

// 恢复默认浏览器跳转模式
__log.setIframeMode(false)
```

也可以在页面的 `LOG` 调试面板中，通过“公告链接”一栏的按钮直接切换。

### 1.5 在组件生命周期中临时调试

需要调试某个页面时，在生命周期内临时提升特定 logger 的 level，离开时恢复：

```ts
import { setLoggerLevel } from '@/utils/logger'
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  setLoggerLevel('[ws]', 'debug')
  setLoggerLevel('[wsSend]', 'debug')
})
onUnmounted(() => {
  setLoggerLevel('[ws]', null)    // null = 恢复跟随全局
  setLoggerLevel('[wsSend]', null)
})
```

## 2. 用户级本地缓存（IndexedDB）

### 2.1 目标

- **切换用户天然隔离**：A 账号登出后 B 账号登录，互相看不到对方的缓存。
- **不卡加载**：首屏先用本地缓存渲染，后台静默 fetch 覆盖更新。
- **按"用户 → 俱乐部"分层扩展**：后续要缓存某 club 的成员列表、房间列表等不需要重新设计存储结构。
- **H5 与 Cocos 共用一份库**：cocos 不再开自己的 `cc_cache_user_*`，所有持久化经 bridge 委托给 H5（详见 [Bridge 持久化代理](../../src/bridge/README.md#10-持久化代理storage-bridge)）。

### 2.2 整体布局

```
浏览器 IndexedDB（per origin）
├── public_cache                  ← 全用户共享（多语言模板、全局配置等）
│   ├── multi_language_template
│   ├── app_config
│   └── diamond_config
│
├── user_cache_1001               ← 用户 1001 的私有 db（H5 + Cocos 共用）
│   ├── club_list                 ← h5 自己的：用户 1001 的俱乐部列表
│   │   ├── (key: clubId)
│   │   └── ...
│   ├── table_user_base_info      ← cocos 通过 bridge 写：牌桌内玩家公共信息
│   ├── table_user_data_info      ← cocos 通过 bridge 写：牌桌内玩家战绩
│   └── game_replays              ← cocos 通过 bridge 写：局内牌谱
│
├── user_cache_1002
│   └── ...
│
└── ...
```

**db 命名**：`user_cache_${userId}`，H5 与 Cocos 共用同一份；cocos 端通过 `ccStorageOp` 把读写转发到 H5 进程。

**为什么 per-user 一个 db**：

- 退出登录 / GDPR 类清理可一次 `indexedDB.deleteDatabase(name)` 干净抹除。
- 一个用户的 schema 升级不影响其他用户。
- DevTools 调试时按用户一目了然。
- 浏览器存储配额是 per-origin 而不是 per-db，多 db 不额外吃配额。

### 2.3 公共 API：`userCache(userId)`

源码：`src/utils/userCache.ts`

```ts
const cache = userCache(userId)

// 读
await cache.get<T>(storeName, key)
await cache.getAll<T>(storeName, range?)

// 写
await cache.put(storeName, key, value)
await cache.bulkReplace(storeName, entries, range?)

// 删
await cache.delete(storeName, keyOrRange)
await cache.clear(storeName)
```

**约定：**

- 所有 op 异常都被吞掉并 `log.warn`，只返回 fallback（读：`null` / `[]`；写：静默）。缓存层失败不应阻塞业务。
- `userId` 为空时所有 op 直接 no-op，调用方不用每次自己判空。
- 同一个 `userId` 的 db 连接被缓存，重复调用 `userCache(uid)` 不会重复 `indexedDB.open`。

#### `bulkReplace` 的两种用法

```ts
// 1. 整表替换（用户级数据，如 club_list）
await cache.bulkReplace('club_list', clubs.map(c => [c.club_id, c]))

// 2. 范围替换（俱乐部级数据，只替换某个 club 的分片）
await cache.bulkReplace(
  'club_members',
  members.map(m => [[clubId, m.user_id] as [string, string], m]),
  IDBKeyRange.bound([clubId], [clubId, []]),
)
```

### 2.4 键策略

| 场景               | 推荐 key                | 范围查询                                              |
| ------------------ | ----------------------- | ----------------------------------------------------- |
| 用户级数据         | 简单 key（如 `clubId`） | `getAll()`                                            |
| 俱乐部级数据       | `[clubId, subId]`       | `IDBKeyRange.bound([clubId], [clubId, []])`           |
| 用户 + 房间        | `[roomId]`              | `getAll()`                                            |

**为什么用复合键 `[clubId, subId]` 而不是字符串拼接 `"${clubId}_${subId}"`：**

- 范围查询是 IndexedDB 原生能力，毫秒级；字符串前缀方案要游标遍历过滤。
- 删除一个 club 全部数据：`store.delete(IDBKeyRange.bound([clubId], [clubId, []]))` 一次完成。
- 类型清晰：`[number, number]` vs 容易拼错的字符串。

### 2.5 新增一个缓存类型的步骤

以"缓存某 club 的成员列表"为例：

#### 1. 在 `src/utils/indexedDB.ts` 注册 store

```ts
export const USER_STORE_CLUB_LIST = 'club_list'
export const USER_STORE_CLUB_MEMBERS = 'club_members'   // ← 新增

export type UserCacheStoreName =
  | typeof USER_STORE_CLUB_LIST
  | typeof USER_STORE_CLUB_MEMBERS                       // ← 加入 union

const USER_CACHE_STORES: UserCacheStoreName[] = [
  USER_STORE_CLUB_LIST,
  USER_STORE_CLUB_MEMBERS,                               // ← 加入数组
]
```

#### 2. bump db 版本

```ts
const USER_CACHE_DB_VERSION = 2   // 1 → 2
```

老用户下次 `open` 时会触发 `onupgradeneeded`，自动补建新 store；老 store 数据保留。

#### 3. 写薄壳模块

```ts
// src/utils/clubMembersCache.ts
import type { ClubMember } from '@/types/club'
import { USER_STORE_CLUB_MEMBERS } from '@/utils/indexedDB'
import { userCache } from '@/utils/userCache'

export async function readClubMembers(
  userId: string | number,
  clubId: string | number,
): Promise<ClubMember[]> {
  const id = String(clubId)
  return userCache(userId).getAll<ClubMember>(
    USER_STORE_CLUB_MEMBERS,
    IDBKeyRange.bound([id], [id, []]),
  )
}

export async function writeClubMembers(
  userId: string | number,
  clubId: string | number,
  members: ClubMember[],
): Promise<void> {
  const id = String(clubId)
  const entries = members
    .filter((m) => m?.user_id != null)
    .map((m) => [[id, String(m.user_id)] as [string, string], m] as [
      [string, string],
      ClubMember,
    ])
  await userCache(userId).bulkReplace(
    USER_STORE_CLUB_MEMBERS,
    entries,
    IDBKeyRange.bound([id], [id, []]),   // 只替换这个 club 的分片
  )
}
```

#### 4. 在调用点使用

```ts
// 拉成员列表前先 hydrate
const cached = await readClubMembers(uid, clubId)
if (cached.length) store.setMembers(cached)

// 拉回后落地 + 更新 store
const list = await fetchClubMembersApi(clubId)
store.setMembers(list)
void writeClubMembers(uid, clubId, list)
```

### 2.6 调用约定（强烈建议遵循）

#### 写缓存

> **不要 await。** 缓存只是加速，不应阻塞主流程。

```ts
// ✅
userInfoStore.setClubList(list)
void writeClubListCache(userId, list)

// ❌
await writeClubListCache(userId, list)
userInfoStore.setClubList(list)
```

#### 读缓存

> **UI 初始化时 hydrate → 不阻塞 fetch → fetch 回来覆盖。** 有缓存时不显示 loading；fetch 失败时若已有缓存内容就不弹错。

```ts
// 1. 缓存填充（无网即可显示）
if (!store.list.length) {
  const cached = await readClubListCache(userId)
  if (cached.length) store.setList(cached)
}

const hasInitial = store.list.length > 0
if (!hasInitial) loading.value = true

// 2. 静默 fetch + 落地
try {
  const list = await fetchApi()
  store.setList(list)
  void writeClubListCache(userId, list)
} catch (error) {
  if (!hasInitial) showFailToast('加载失败')
  else console.warn('[xxx] 静默刷新失败', error)
} finally {
  loading.value = false
}
```

### 2.7 与 `public_cache` 的关系

| 维度              | `public_cache`                | `user_cache_${uid}`                     |
| ----------------- | ----------------------------- | --------------------------------------- |
| 作用域            | 全用户共享                    | 单用户私有（H5 + Cocos 共用）           |
| 典型数据          | 多语言模板、全局配置、钻石档位 | 俱乐部列表、牌桌玩家信息、牌谱…         |
| 隔离              | 否                            | 切换用户天然隔离                        |
| 清理              | 升级版本时由 `onupgradeneeded` 处理 | 退出账号无需清理，下次同账号秒开 |
| API               | `readPublicCache` / `writePublicCache` | `userCache(uid).get/put/...`（H5）/ `cocosCache().get/put/...`（CC，bridge 转发） |

### 2.8 与 cocos 端的对应

H5 与 Cocos 共用同一个 `user_cache_${uid}`，cocos 通过 bridge 把读写委托给 H5（协议见 [Bridge 持久化代理](../../src/bridge/README.md#10-持久化代理storage-bridge)）：

| 维度       | h5                                       | cocos                                                |
| ---------- | ---------------------------------------- | ---------------------------------------------------- |
| db 命名    | `user_cache_${uid}`                      | `user_cache_${uid}`（与 H5 同一份，bridge 转发）      |
| 用户切换   | Map 缓存多个 db 连接                     | 由 H5 端按当前登录态决定 uid                          |
| API 形态   | `userCache(uid).get/put/...`             | `cocosCache().get/put/...`（uid 隐式，内部走 bridge） |
| 已有 store | `club_list`                              | `table_user_base_info` / `table_user_data_info` / `game_replays` |
| TTL        | 不内置；wrapper 自行决定                 | wrapper 用 `CacheRecord<T> = {data, updatedAt}` 包一层 |

两端共用 db 但 store 名严格区分：H5 自有 store（如 `club_list`）只在 H5 进程内访问；cocos 写入的 store 必须在 `CC_CACHE_STORES` 白名单中，否则 `ccStorageProxy` 会拒绝。

### 2.9 已落地的缓存清单

| Store                     | 写入方  | Key                | 数据                  | 调用方                                                       |
| ------------------------- | ------- | ------------------ | --------------------- | ------------------------------------------------------------ |
| `club_list`               | H5      | `clubId`           | `ClubInfo`            | `src/utils/userClubListCache.ts`                             |
| `table_user_base_info`    | Cocos   | `userRandomId`     | `CacheRecord<info>`   | `pokerqueen/assets/script/tools/PlayerInfoCacheDB.ts`        |
| `table_user_data_info`    | Cocos   | 复合（含 game/poker/origin/gold type） | `CacheRecord<stats>` | 同上                                                         |
| `game_replays`            | Cocos   | `userId_roomId_handNum` 或 `userId_m{matchId}_handNum` | 牌谱 | `pokerqueen/assets/script/tools/ReplayCacheDB.ts`            |

更新此表请同步本节。新增 cocos 写入的 store 时同时更新 `src/utils/indexedDB.ts` 的 `CC_CACHE_STORES`（白名单）与 `USER_CACHE_DB_VERSION`。

### 2.10 FAQ

**Q：为什么不放一个 db、用 key 前缀区分用户？**

A：清理某个用户的数据要游标遍历前缀匹配，没有 `deleteDatabase` 干净；schema 升级要全员一起。per-user db 是最低心智负担的选择。

**Q：为什么不在每个用户 db 内部再按 club 拆 store（`user_xx_club_yy_data`）？**

A：IndexedDB 创建 object store 必须在 `onupgradeneeded` 里、要 bump version。每加入一个新 club 就升级 schema 不现实。复合键 `[clubId, subId]` 才是 IndexedDB 的官方姿势。

**Q：为什么 H5 与 Cocos 共用一个 db？**

A：早期 H5 / Cocos 各自开 `h5_cache_user_*` 和 `cc_cache_user_*`，配额、清理、调试都要看两份。改成共用 `user_cache_${uid}` 后：清账号一次 `deleteDatabase` 就干净；DevTools 看一张表；Cocos 不再有本地落盘，所有数据出口都汇聚到 H5（详见 [Bridge 持久化代理](../../src/bridge/README.md#10-持久化代理storage-bridge)）。

**Q：缓存陈旧怎么办？**

A：当前不做 TTL — fetch 回来直接覆盖即可。如果未来需要"超过 N 分钟才强刷"之类策略，把 value 包成 `{ data, updatedAt }`、把 `USER_CACHE_DB_VERSION` 加一、迁移老数据即可，外层 API 不变。（cocos 那边已经是这种用法，见 `PlayerInfoCacheDB.ts`。）

**Q：多 tab 怎么办？**

A：当前 H5 在 Cocos WebView 里基本单 tab。如果以后出现并发场景，可在 `userCache.ts` 给 db 连接加 `onversionchange` 监听，触发时关闭并从 `_dbCache` 剔除。

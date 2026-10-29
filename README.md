# h5-game 开发说明

牌桌外 H5 应用，与 Cocos 同页融合，承载大厅、比赛、俱乐部、钱包、消息和个人中心。技术栈为 Vue 3、TypeScript、Vite、Vant、Pinia、Sass 和 Axios。

本 README 是开发入口；渠道 C 的页面行为和业务规则集中维护在 [产品文档](docs/channel-c.md)。

## 开发文档索引

| 文档 | 内容 |
| --- | --- |
| [页面布局、主题与多语言](docs/development/ui.md) | 手机 / Pad / 桌面布局、滚动与安全区、弹窗、图片导出、主题和文案 |
| [会话、跨端与接口](docs/development/integration.md) | 游客与真实账号切换、Bridge / WS、protobuf 同步、渠道 C 接口约定 |
| [公共组件](docs/development/components.md) | 按钮、导航、表格、弹窗、Toast、图片上传和游客登录入口 |
| [缓存与日志](docs/development/state-and-debugging.md) | 用户隔离、IndexedDB、Cocos 持久化代理和日志排查 |
| [Bridge 详细参考](src/bridge/README.md) | 各层职责、Dialog / Panel 协议、WS 重连和 Storage Bridge |

## 环境要求

- 开发 / 构建基线：Node.js `20.20.0`，以 `.nvmrc` 为准。
- 包管理器：pnpm `11.18.0`，以 `package.json#packageManager` 为准。
- 自动化测试：使用 Node.js 24。测试直接执行 `.ts` 并调用 `node:module.registerHooks`，不能直接用 `.nvmrc` 的 Node 20 运行。
- 共享依赖通过 Git 安装，需要能访问 `package.json` 声明的仓库；依赖安装版本由 `pnpm-lock.yaml` 固定。

## 安装与启动

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.18.0 --activate
pnpm install
pnpm dev
```

Vite 配置端口为 `80`，以终端输出的实际地址为准。配置了 `h5.com` hosts 时可通过该域名联调；不要求修改源码中的域名。

需要使用普通本地端口时，同时覆盖 WS 代理地址，避免 HTTP 已改到新端口而 WS 仍连接 localhost:80：

```bash
VITE_WS_PROXY_URL=ws://127.0.0.1:5174/api/channel/ pnpm dev --host 127.0.0.1 --port 5174
```

也可在被 Git 忽略的 `.env.local` / `.env.development.local` 中配置本机覆盖项。修改环境变量后重启 Vite。

`predev` 自动检查 protobuf 并同步语言运行文件。`sync:i18n` 优先使用同级 `../h5-cc-i18n/dist/`，不存在时才读取依赖包；遇到旧文案时先检查脚本输出的来源。

## 环境变量与本地代理

默认值和环境配置以 `.env`、`.env.development`、`vite.config.ts` 为准。当前仓库默认后端为测试域名 `test2.awanptest.com`，不是生产环境声明。

| 变量 | 用途与当前约定 |
| --- | --- |
| `VITE_API_BASE_URL` | `.env` 为 `https://test2.awanptest.com/api`；开发环境为同源 `/api` |
| `VITE_PROXY_TARGET` | 开发 HTTP / WS 代理目标，默认 `https://test2.awanptest.com` |
| `VITE_PROXY_IM_TARGET` | `/api/imoss` 的独立代理目标，见 Vite 配置 |
| `VITE_WS_PROXY_URL` | 指定完整 WS 代理地址时优先使用；开发配置为 `ws://localhost/api/channel/` |
| `VITE_WS_URL_TEMPLATE` | 无 WS 代理且连接参数未提供完整 URL 时，用模板和服务端端口拼接；`{0}` 替换为 `:端口` |
| `VITE_BRIDGE_TARGET` | `pokerqueen`（默认）或 `h5-cc-game`，决定 Bridge 协议来源 |
| `VITE_DEBUG_CONSOLE` | 开发默认加载调试面板；生产需显式设为 `true` |
| `VITE_DROP_CONSOLE` | 构建时移除 `console.*`，默认关闭 |
| `VITE_BUILD_SOURCEMAP` | 构建 source map，默认关闭 |
| `VITE_BUNDLE_ANALYZE` | 输出分析数据；`analyze` 模式也会启用 |
| `VITE_NATIVE_MENU_GUARD` | 开发环境配置为 `open`，允许浏览器原生菜单用于调试 |

本地请求保留 `/api` 前缀，由 Vite 转发到目标服务；WS 走同一代理。部署环境需提供相应的同源网关或服务端 CORS 配置。

Bridge action / payload 类型统一从 `@bridge-protocol` 导入：

| `VITE_BRIDGE_TARGET` | 运行时来源 |
| --- | --- |
| `pokerqueen` | `src/bridge/protocol/` 的兼容副本 |
| `h5-cc-game` | `@silenthill/h5-cc-bridge/h5-side` |

类型检查始终需要安装共享 Bridge 包；服务端 protobuf 另由 `@silenthill/agreement-web` 提供。两类协议不要混用。

## 渠道页面联调

本地开发时使用真实测试邀请码：

```text
http://127.0.0.1:5174/?invite_code=<测试邀请码>#/home
```

localhost / IP 只有在 Vite 开发模式且显式提供 `invite_code` 时才按该入口走渠道初始化。线上根据渠道域名、分享参数和默认俱乐部配置识别，不在源码中写固定测试邀请码。

菜单版本只认 `/org/club/default` 的 `h5_menu`：`1=B`、`2=A`、`3=C`，未配置使用 A。联调 C 版需使用服务端已配置为 3 的俱乐部；不要用客户端随机菜单或假牌桌代替配置。

游客由服务端分配体验账号，也持有有效 token。身份入口必须判断 `gameStore.isRealUser`，不能仅判断 token；新增私有操作使用 `requireRealUser()`。生命周期和牌桌内登录续接见 [会话说明](docs/development/integration.md)。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Vite；前置协议检查与语言同步 |
| `pnpm build` | 前置检查后执行 `vue-tsc -b` 和生产构建，产物为 `dist/` |
| `pnpm build:debug` | 带 source map 的类型检查与构建 |
| `pnpm build:analyze` | 输出 bundle 分析数据 |
| `pnpm analyze:report` / `pnpm analyze:server` | 静态分析报告 / 本地分析服务 |
| `pnpm preview` | 本地预览构建产物 |
| `pnpm exec vue-tsc -b` | 单独执行类型检查 |
| `pnpm lint` / `pnpm lint:fix` | 全量 ESLint 检查 / 修复 |
| `pnpm test` | Node 24 下执行 `tests/*.test.ts` |
| `pnpm sync:i18n` | 同步语言运行文件到 `public/` |
| `pnpm sync:protocol` | 更新服务端 protobuf 依赖和锁文件，并检查协议 |
| `pnpm check:protocol` | 检查 protobuf 运行时和类型声明 |
| `pnpm assets:compress` | 执行图片 / SVG 压缩脚本，运行前确认资源改动范围 |

`build:debug` 和 `build:analyze` 不会触发名为 `prebuild` 的生命周期。直接运行它们前，先执行 `pnpm check:protocol` 和 `pnpm sync:i18n`。

按改动范围运行检查，例如：

```bash
pnpm exec vue-tsc -b
pnpm exec eslint src/components/ChannelC/ChannelCHeader.vue
# 以下测试在 Node 24 下执行
node --test tests/playerInvitationFlow.test.ts tests/tribeReward.test.ts
pnpm build
```

测试文件名是入口索引，不在文档记录固定的“已通过多少项”。真实服务端的保存、充值、奖励到账和 WS 推送需用对应测试账号验证，单元测试与构建不能代替这些业务验收。

## 目录与修改入口

```text
src/
├── api/                  # HTTP 请求及接口模型
├── bridge/               # 跨端通道、WS 代理、业务同步与协议兼容层
├── components/           # 公共组件、ChannelC、全局 Host
├── composables/          # 页面复用能力
├── features/             # channelC、tribeReward 等业务规则
├── i18n/                 # 四语言适配与文本格式化
├── router/               # 路由、身份守卫、桌面布局元数据
├── session/              # 体验会话、登录事务与跨端身份切换
├── stores/               # Pinia 状态、列表与缓存协调
├── styles/               # 主题、基础样式及按需加载的桌面样式
├── utils/                # 名称模板、邀请链接、缓存、主题、日志等
└── views/                # 大厅、俱乐部、比赛、钱包、消息、我的
scripts/                  # 协议、语言和资源维护脚本
tests/                    # 业务、接口及跨端回归
docs/                     # 产品说明与开发参考
```

开发约定：

- API 模型、字段适配和业务规则分别放在 `api/models`、`features` / `utils`、store / composable 中，页面复用现有入口。
- HTTP / WS 增量更新需区分“字段缺失”和显式 `0`、`false`、空字符串，后者可能用于清空旧值。
- 路由 `meta.desktopLayout` 决定桌面框架；小于 `600px` 使用手机尺寸策略，已迁移桌面页面固定 `1rem=40px`。
- 每个页面明确滚动容器，长列表需把底部菜单、安全区和悬浮操作的占位计入可滚动高度。
- 通用颜色使用主题变量；页面专属差异与原选择器共置。服务端名称先解析多语言模板，再回退语言 key / 原文。
- 用户数据按账号和俱乐部隔离，登出、切换账号及旧请求迟到都需考虑。

## 构建与融合发布

H5 的 `dist/` 需同步到目标 Cocos 项目的 H5 资源 / 构建流程，再生成最终包。`pokerqueen` 与 `h5-cc-game` 应使用匹配的 Bridge 目标和相同的服务端协议版本。

`index.html` 同时作为融合模板，会引用由最终 Cocos 构建提供的 `src/settings.js`、`main.js` 和 `cocos2d-js*.js`。单独运行 H5 预览时这些资源可能 404；验收融合包时必须确认它们已由 Cocos 构建补齐。

## 常见排查入口

| 现象 | 先检查 |
| --- | --- |
| 协议检查提示缺少 155 | `pnpm sync:protocol`、锁文件、安装包的运行时和正式类型声明 |
| 修改文案后未生效 | `sync:i18n` 日志是否优先读取了旧的同级 `h5-cc-i18n/dist/` |
| 本地 HTTP 正常但 WS 不通 | `VITE_WS_PROXY_URL` 是否匹配当前开发端口，以及 `/api` 的 WS 代理 |
| 本地看到 A/B 而非 C | URL 渠道参数、默认俱乐部响应及 `h5_menu`，不要根据登录后的其他俱乐部判断菜单 |
| 有 token 仍显示登录按钮 | 是否为服务端体验账号，查看 `isGuestAccount` / `isRealUser` |
| 列表到底仍被底栏挡住 | 滚动容器、Flex 是否压缩内容容器、底部菜单与悬浮按钮的占位 |
| `pnpm test` 在 Node 20 失败 | 切到 Node 24 后执行；测试使用原生 TS 和 `registerHooks` |

详细调试方法见 [缓存与日志](docs/development/state-and-debugging.md)，组件接口以当前源码为准。

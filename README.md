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

### 4.x bridge 协议来源开关：`VITE_BRIDGE_TARGET`

`.env` 内的 `VITE_BRIDGE_TARGET` 决定 `@bridge-protocol` 别名解析到哪一份协议源：

| 值 | `@bridge-protocol` 解析到 | 使用场景 |
|---|---|---|
| `pokerqueen`（默认）| 本地 `src/bridge/protocol/`（冻结副本）| 对接旧 cocos 项目 pokerqueen |
| `h5-cc-game` | npm 包 `@silenthill/h5-cc-bridge`（h5-side 入口）| 对接新 cocos 项目 h5-cc-game，两端共用同一份类型 |

`@silenthill/h5-cc-bridge` 由 [独立仓库](https://github.com/soolary/h5-cc-bridge) 管理，本仓库通过 `package.json` 里的 git URL 依赖拉取。详细机制见 `src/bridge/README.md §0`。

切换后需重启 dev / 重新 build。两种模式下 h5-game 的传输层和业务层（`core/` `channels/` `sync/` `ws/`）都不变。

## 4.1 本地 CORS 说明

- 本地 `pnpm dev` 时，前端请求会先打到同源 `/api`
- Vite 会把 `/api/*` 代理到 `VITE_PROXY_TARGET`
- 代理不再重写路径，因此最终是 `https://test2.awanptest.com/api/*`
- 这样浏览器端不再直接跨域到后端，登录接口可正常调用
- 注意：生产环境若仍是跨域访问，仍需要服务端配置 CORS 或走同域网关

## 5. 移动端、Pad 和桌面端自适应规范

移动端和桌面端共用 Vue 模板和业务逻辑，只在尺寸策略及布局层区分：

- 小于 `600px`：沿用移动端 `375` 设计稿，基准为 `1rem = 37.5px`，最大按 `480px` 手机框计算。
- `600px` 及以上：只有路由明确声明了桌面框架才进入桌面布局；已迁移页面固定
  `1rem = 40px`，字体不随浏览器宽度无限放大。
- 页面背景铺满浏览器；交互内容位于最大 `1440 × 1024` 的居中舞台。一级页常规内容最大宽度为
  `1360px`，二三级内容页按设计稿确定内部宽度和滚动区域。
- `1440 × 1024` 是最大内容舞台，不是强制宽高比，也不是把页面整体缩放到这个分辨率。窗口不足时宽高
  分别收缩，优先压缩留白并让中间内容滚动；窗口更大时只有背景继续铺满，内容不再放大。
- `src/utils/rem.ts` 只计算根字号，`src/utils/mainLayout.ts` 管理当前页面框架，
  `src/styles/_main_desktop.scss` 维护五个一级页面，`src/styles/_content_desktop.scss` 维护已迁移的
  二三级内容页。
- 基础尺寸令牌放在 `src/styles/_base.scss`，主题颜色放在 `src/styles/_themes.scss`。

### 5.1 桌面布局如何开启

路由 `meta` 是唯一开关，不在 `index.html` 维护路由白名单，也不按 `/mine/*`、`/club/*`
这样的路径前缀自动匹配：

```ts
{
  path: 'mine',
  component: () => import('@/views/mine/MineIndexView.vue'),
  meta: {
    desktopLayout: 'primary',
  },
}
```

导航成功后，路由统一调用 `syncMainLayout()`，把布局类型写到
对应的 `html[data-main-layout]`。视口、`rem` 和桌面 CSS 都读取同一状态。因此：

- 写 `desktopLayout: 'primary'`：该页面在 `600px` 以上使用一级桌面布局。
- 写 `desktopLayout: 'content'`：该页面在 `600px` 以上使用二三级内容页布局；扑克专区
  `/gameList`、赛事专区 `/mttList`、俱乐部首页 `/club/index` 和创建模板玩法选择
  `/club/table/create`、创建牌桌 `/createTable` 是当前参考实现。
- 不写：继续使用原移动端/手机框布局。
- 导航被取消或发生重定向时，不会提前污染当前页面布局。

`src/router/meta.d.ts` 是 Vue Router 的 TypeScript 类型补充。它让编辑器知道
`route.meta.desktopLayout` 是合法字段，并限制其值必须来自 `MainLayout`；它不生成运行时代码。
以后新增布局类型，只需先在 `src/utils/mainLayout.ts` 的 `MAIN_LAYOUTS` 中登记，路由类型会自动同步。

页面继续使用已有业务根类，例如 `.home-page`、`.club-index`、`.message-page`。如果已有根类不能稳定
限定公共桌面规则，可以增加语义明确的页面根类，例如 `.club-members-desktop-page`，但必须在
`_content_desktop.scss` 中立即被使用。不要为了“可能以后会用”增加空标记类，也不要给每个断点重复
创建一套类名。只有真正被公共 CSS 消费的结构才增加公共类，例如当前共用标题和余额区域的：

```html
<div class="title-bar main-primary-header">
  <div class="currency-info main-primary-currency"></div>
</div>
```

### 5.2 `rem`、`clamp()` 和 `cqw` 怎么选

| 单位 | 用途 | 本项目规则 |
| --- | --- | --- |
| `rem` | 字体、固定可读尺寸 | 已迁移桌面页固定以 `40px` 为 `1rem`，页面原有文字可以继续使用 |
| `clamp()` | 有上下限的自适应尺寸 | 页边距、列表间距、普通卡片和图标优先使用 |
| `cqw` | 相对组件自身宽度的比例尺寸 | 只用于必须整块等比缩放的复合组件内部 |
| `px` | 桌面端明确固定的尺寸 | 桌面覆盖层里的字号、卡片、按钮、底部导航、1px 边线可直接使用 |

`1cqw` 等于最近一个声明了 `container-type: inline-size` 的容器宽度的 `1%`。它与 `vw`
不同：浏览器再宽，也只按当前卡片自身宽度计算。

当前看起来 `cqw` 较多，是因为朋友桌主视觉和消息/我的顶部卡片都属于“按设计稿整体等比缩放”的
复合组件，内部每一个坐标、圆角和图标都要跟随自己的容器。它只集中在这两个容器中，不是全站单位。
设计稿标注换算公式为：

```text
cqw = 设计稿中的像素值 / 组件设计宽度 × 100
```

例如宽度为 `606px` 的朋友桌主视觉，设计稿内 `33px` 的偏移约为 `5.45cqw`。
普通正文禁止使用 `cqw`；朋友桌主视觉里与牌桌构图绑定的标题属于复合视觉的一部分，可以随整桌缩放。
消息和“我的”卡片内需要保持可读的文字已经使用固定 `rem`。

在集中维护的桌面覆盖层中，不必为了形式统一把设计稿的每个 `px` 换算成 `rem`。桌面根字号虽然固定，
但直接写固定 `px` 更容易核对设计稿，也更能表达“此尺寸不跟随窗口缩放”。`clamp()` 只给确实需要在
Pad 与桌面之间变化的尺寸，并且必须同时给出合理的最小值和最大值。

### 5.3 样式分层

| 层级 | 放置位置 | 内容 |
| --- | --- | --- |
| 全局令牌 | `_base.scss`、`_themes.scss` | 颜色、基础尺寸、主题变量 |
| 公共能力 | `_mixins.scss`、`_utilities.scss` | 主题 mixin、滚动和安全区等无业务能力 |
| 一级桌面框架 | `_main_desktop.scss` | 当前五个一级页和公共底部 Tab |
| 二三级内容页框架 | `_content_desktop.scss` | 扑克专区及后续同类列表/详情/表单页 |
| 页面移动端样式 | 页面 `.vue` 的 scoped style | 页面原有移动端布局和局部状态 |
| 其他页面族桌面样式 | 独立的 `_*_desktop.scss` | 无法复用现有框架的沉浸式或特殊页面族 |

公共样式的抽取标准：至少两个页面实际复用，并且结构语义一致。只出现一次的样式留在页面或页面族
文件中，避免公共文件变成无法追踪的全局覆盖集合。

桌面页面族样式默认只负责尺寸、间距、定位、排列和滚动范围。颜色、背景、边框颜色、阴影、滤镜、
字体和主题差异继续由原组件样式管理；除非产品明确要求桌面端采用另一套视觉资源，否则不要在
`_*_desktop.scss` 中重复覆盖这些属性。

### 5.4 剩余页面迁移步骤

每次迁移按下面顺序处理：

1. **先分类**：确定它是一级 Tab 页、普通内容页（列表/详情/表单），还是沉浸式牌桌/游戏页。
2. **保留移动端**：不要重写现有模板和移动端样式，先确认 `375 × 812` 不回归。
3. **确定桌面舞台**：按设计稿明确最大宽高、内容最大宽度、是否整页滚动，以及背景是否铺满。
4. **复用页面族**：普通二三级页面优先复用现有 `_content_desktop.scss` 和 `content`；页面专属规则
   必须以页面根类收口，不要把规则堆到 `_main_desktop.scss`。
5. **必要时登记新类型**：只有舞台、滚动或交互模型明显不同且无法复用时，才在 `MAIN_LAYOUTS` 登记
   新类型并编写配套基础舞台。普通二三级页面给对应路由加
   `meta: { desktopLayout: 'content' }`，不要误标为 `primary`。
6. **优先复用业务类**：现有根类足够定位时不增加新类；只有多个页面共享同一结构时才增加公共契约类。
7. **选择单位**：保留页面原有文字的 `rem`；桌面覆盖层中设计明确固定的尺寸可用 `px`；有限缩放用
   `clamp()`；只有独立等比复合组件才启用 `container-type` 和 `cqw`。
8. **只迁移布局**：默认只调整尺寸、间距、位置、排列和滚动，不增删业务元素，不改原有颜色、阴影、
   边框和明暗主题。为了建立舞台或滚动区可以增加无业务含义的结构容器。
9. **回归检查**：至少检查 `375 × 812`、`768 × 1024`、`1024 × 768`、`1366 × 768`、
   `1440 × 1024`、`1920 × 1080`，并验证 Chrome、Edge、Safari 下的滚动、弹窗、键盘、安全区及主题切换。

创建牌桌 `/createTable` 可作为桌面长表单的参考：顶部导航固定在内容舞台内，“一键开桌”和“专业参数”
共用同一套 1360px 内容边界；页签下方分别管理自己的纵向滚动。专业参数的操作栏位于长表单末尾，
不要在桌面端继续使用移动端的全视口 `position: fixed`，否则浏览器大于 1440px 时会脱离内容舞台。

一级 Tab 页如果以后再增加，只需复用已实现的 `primary`；新类型页面必须先完成对应的公共舞台样式，
再向路由开放，不能只加 `meta` 而没有配套 CSS。

#### 5.4.1 普通内容页的标准舞台

页面背景与内容舞台要分开：页面根节点负责铺满浏览器，舞台负责限制业务内容。不要给根节点直接写
`max-width: 1440px`，否则背景也会被截成一条。普通二三级页可按下面的结构实现：

```scss
@media (min-width: 600px) {
  html[data-main-layout='content'] .example-page {
    --example-gutter: clamp(24px, 2.7778vw, 40px);
    --example-stage-top: max(
      0px,
      calc((var(--app-full-height, 100dvh) - var(--content-stage-height)) / 2)
    );

    position: relative;
    width: 100%;
    height: var(--app-full-height, 100dvh);
    min-height: 0;
    overflow: hidden;
  }

  html[data-main-layout='content'] .example-page__stage {
    position: absolute;
    top: var(--example-stage-top);
    left: 50%;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    width: var(--content-stage-width);
    height: var(--content-stage-height);
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    transform: translateX(-50%);
  }

  html[data-main-layout='content'] .example-page__body {
    min-width: 0;
    min-height: 0;
    padding: 0 var(--example-gutter);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
```

如果页面现有根结构本身已经可以充当舞台，可用 `display: flex` 居中而不新增 `__stage`。关键是始终保留
“全浏览器背景”和“最大 1440 × 1024 内容”这两个层次。

#### 5.4.2 顶部、滚动区和底部操作

- 顶部导航、筛选区和底部操作栏占固定行，中间列表或表单使用 `minmax(0, 1fr)`、`min-height: 0` 和
  `overflow-y: auto`。缺少 `min-height: 0` 是 Flex/Grid 子项无法滚动、只能看到一半内容的常见原因。
- 窗口高度不足时滚动中间内容，不把卡片、字号和按钮一起纵向压扁；长列表也不要依赖整个 `body` 滚动。
- 底部按钮固定在舞台内，可保持设计稿明确的按钮宽度；不要直接相对浏览器使用全局
  `position: fixed`。悬浮菜单同理，应固定在舞台右下角，不需要和主操作按钮贴在一起。
- 牌桌卡片、赛事卡片等重复项应左对齐，数量不足一行时不要用 `space-between` 拉开。优先使用
  `grid-template-columns: repeat(auto-fill, 固定或有限宽度)` 配合 `justify-content: start`。
- 列表卡片需要占满内容行时，给列表列轨道或卡片写 `width: 100%`，不要只让外层容器变宽。

#### 5.4.3 Teleport 弹窗和底部抽屉

Vant 的 Popup、Dialog 等组件经常 `Teleport` 到 `body`，因此它们不再是页面根元素的后代，页面 scoped
选择器和只定义在页面根节点上的 CSS 变量都可能失效。桌面适配时按以下规则处理：

1. 给 Teleport 的实体节点增加唯一类，例如 `class="sheet-popup member-role-sheet-popup"`。
2. 在 `_content_desktop.scss` 使用
   `html[data-main-layout='content'] .member-role-sheet-popup` 定位，不要写成
   `.member-detail-page .member-role-sheet-popup`。
3. 遮罩继续覆盖整个浏览器，抽屉本体限制为 `var(--content-stage-width)` 并水平居中；舞台未占满窗口高度时，
   底边偏移应与舞台一致。
4. 抽屉外层可以铺满舞台宽度，内部表单、单选项和按钮仍可保持设计稿的固定最大宽度并居中。
5. 不要用 `transform: translateX(-50%)` 居中 Vant 底部 Popup，Vant 的进出场动画也会写 `transform`。
   使用 `left: 0; right: 0; margin-inline: auto`，避免覆盖动画。

参考写法：

```scss
@media (min-width: 600px) {
  html[data-main-layout='content'] .example-sheet-popup.van-popup--bottom {
    right: 0;
    bottom: max(
      0px,
      calc((var(--app-full-height, 100dvh) - var(--content-stage-height)) / 2)
    );
    left: 0;
    width: var(--content-stage-width);
    margin-inline: auto;
  }
}
```

#### 5.4.4 表单控件、拉杆和数字键盘

- 数字输入统一复用 `src/components/KeyBoard/NumericKeypad.vue`。它已经在 `600px` 以上横向扩展到最大
  `1440px`，按键高度根据视口高度独立调整，不要在页面内再复制一套键盘。
- 键盘和 Popup 一样会 Teleport 到 `body`；打开键盘后应让中间表单保持可滚动，避免最后一项和操作按钮
  永久被遮住。
- 桌面拉杆使用 Pointer Event；拖动开始后调用 `setPointerCapture()`，根据真实轨道
  `getBoundingClientRect()` 计算百分比。不要拿设计稿宽度或放大后的 `cqw` 反推坐标，否则鼠标会比圆球快。
- 全局禁止拖拽和文本选择时，不要在父层统一阻断 `pointerdown`/`pointermove`。`input`、`textarea`、
  `[contenteditable]`、`range` 和自定义拉杆必须保留正常指针事件。

#### 5.4.5 可直接参考的已迁移页面

| 场景 | 参考实现 | 重点 |
| --- | --- | --- |
| 五个一级页 | `src/views/home/HomeIndexView.vue` 等五个 `*IndexView.vue` | 背景全屏、1360px 常规内容、固定大小的 `MainBottomTab` |
| 牌桌/赛事列表 | `src/views/home/gameList.vue`、`src/views/mtt/mttList.vue`、俱乐部牌桌列表 | 卡片左对齐、赛事卡片整行宽度、列表独立滚动 |
| 长表单 | `src/views/table/CreateTableTemplate.vue`、`src/views/club/ClubAgentProfitSettingView.vue` | 固定顶部、滚动表单、舞台内底部操作、键盘 |
| 设置列表 | `src/views/club/ClubDetailView.vue`、`src/views/club/ClubMembersView.vue` | 1360px 内容边界、整行条目、浮动按钮、弹窗 |
| 长详情 | `src/views/club/ClubMemberDetailView.vue`、`src/views/club/ClubRoomHistoryDetailView.vue`、`src/components/RoomDataDetail/RoomDataDetail.vue` | 内容舞台内纵向滚动，底部抽屉单独适配 |
| 成员关系页 | `src/views/club/ClubAgentVipStatisticsView.vue`、`ClubMemberBindAgentView.vue`、`ClubMemberUnbindAgentView.vue` | 顶部摘要固定、长列表滚动、底部主按钮 |
| 窄内容构图 | `src/views/club/ClubLevelView.vue` | 宽舞台内保持窄主体，矮窗口下允许内容滚动 |

迁移新页面时，先选择同交互模型的参考，而不是只找视觉最相似的页面。例如页面长得像列表，但底部存在
固定确认按钮，应优先参考“成员关系页”的滚动和底部结构。

#### 5.4.6 样式应该放在哪里

- 页面 `.vue` 的 scoped style：保留移动端布局、业务状态、颜色、阴影、主题和只出现一次的视觉规则。
- `_content_desktop.scss`：已迁移普通内容页在桌面端的几何尺寸、排列、定位和滚动边界。所有规则必须以
  `html[data-main-layout='content'] .页面根类` 收口。
- `_main_desktop.scss`：只维护五个一级页和 `MainBottomTab`，不要继续塞二三级页面。
- 公共组件内部的桌面媒体查询：只有行为确实被多个页面共享时使用，例如 `NumericKeypad`、
  `MainBottomTab`。不要为了一个页面把页面专属位置写进公共组件。
- 独立 `_*_desktop.scss`：仅用于牌桌、沉浸式游戏等舞台和交互模型明显不同的页面族。

若桌面与移动端仅布局不同，不要复制一份 `*DesktopView.vue` 独立维护。只有 DOM 结构或业务交互确实不同，
且共享模板会产生大量条件分支时，才考虑拆分组件。

### 5.5 缩放性能约束

- 大面积、会随窗口缩放的静态背景，不要直接使用从 Figma 导出的复杂 SVG。若文件含
  `foreignObject`、`backdrop-filter`、`feTurbulence`、大范围 `feGaussianBlur` 或位移滤镜，
  应预栅格化为带透明通道的 `2x WebP`；SVG 可保留为设计源文件，但不在运行时引用。
- 不要给普通页面根节点或每一张列表卡片都加 `container-type`。`cqw` 仅放在需要整块等比缩放的独立
  复合视觉容器，普通列表使用 Grid/Flex、固定尺寸和 `clamp()`。
- `window.resize` 与 `visualViewport.resize` 可能在同一帧重复触发，监听器必须通过同一个
  `requestAnimationFrame` 合并，并在写 CSS 变量前比较新旧值。
- 已迁移桌面页根字号固定为 `40px`，缩放过程中禁止重复写入相同 `font-size`。
- 长列表中谨慎使用 `backdrop-filter`、大模糊和多层阴影；静态卡片优先使用普通半透明背景或
  预合成图片。列表数量较多时，再根据真实数据量引入虚拟列表。
- 不要在连续 `resize`、`pointermove` 中交替读取布局并写入样式。先读取所有
  `getBoundingClientRect()`，再在同一帧更新状态；只有尺寸确实变化时才触发 Vue 更新。
- 用浏览器拖动窗口回归时，如果只有复杂大图区域卡顿，先临时关闭 SVG/滤镜确认瓶颈；如果全页卡顿，
  再检查 resize 监听、根字号写入和大范围响应式状态更新，避免凭感觉只调 CSS 动画。

### 5.6 Cocos 牌桌的桌面画布

全站默认的 `480px` 手机框不能直接删除，它仍用于移动端页面和尚未迁移的二三级页面。牌桌使用独立
状态放宽宿主容器：Cocos 发送 `h5Hide` 后，H5 会给 `html` 增加
`data-cocos-active="1"`；在 `600px` 及以上，`body`、`GameDiv` 和 `GameCanvas` 随即使用完整浏览器
视口，并通知 Cocos 重新计算 frame size。Cocos 发送 `h5Show` 返回 H5 时会恢复当前 H5 路由自己的
布局规则。移动端牌桌不受影响，仍沿用原来的移动端尺寸策略。

修改本仓库后，如需让同级 `h5-cc-game` 使用尚未提交的本地代码，在 `h5-cc-game` 目录执行：

```bash
pnpm run sync:h5-game:local
```

该命令会构建本地 `h5-game`、同步到 Cocos 的 Web 模板，并清理旧的 Cocos `build`，之后需要重新构建
或预览 `h5-cc-game`。不要通过删除 `--app-frame-max-width` 或把全站默认宽度永久改为 `100vw` 来调试，
否则未完成桌面迁移的页面也会被一并拉伸。

如果 Cocos 期望的 Canvas 宽度是 `1440px`，实际却始终为 `1438px`，优先检查 `GameDiv`、
`GameCanvas` 及其父节点是否存在左右各 `1px` 的边框或内边距，并区分 `clientWidth` 与
`getBoundingClientRect().width`。牌桌宿主应使用 `box-sizing: border-box` 且不带边框/内边距；不要用
给 Canvas 再加 `2px` 的方式掩盖宿主尺寸错误。

### 5.7 DOM 截图和海报导出

邀请链接等海报不能直接截图正在显示的 Vant Dialog 节点。实时弹窗通常带有 Teleport、进出场
`transform`、半透明背景、`backdrop-filter` 和圆角裁切，`html2canvas` 在移动端可能导出粗白边，在
桌面端还可能把滤镜分块渲染成白色网格。

当前 `ClubDetailView.vue` 的邀请海报是参考实现，处理顺序如下：

1. 获取可见卡片宽度，把源节点克隆到屏幕外的独立宿主，不修改正在显示的弹窗。
2. 导出副本去掉 `transform`、动画、滤镜、阴影等渲染上下文，并设置明确的不透明背景；导出 JPEG 时
   不能依赖透明背景。
3. 用 `data-*-export-ignore` 标记关闭、保存等不应出现在图片中的控件，只在副本中删除它们。不要临时
   给原按钮写 `display: none`，否则异常或异步下载会让页面按钮无法恢复。
4. 等待副本中的所有图片完成 `load`/`error`，并等待 `document.fonts.ready` 后再调用 `html2canvas`。
5. 下载时把 `<a>` 临时加入 `document.body`，点击后移除；Object URL 延迟约一秒再释放，兼容 Safari。
6. 无论成功或失败都在 `finally` 删除离屏宿主并恢复保存状态。

`html2canvas` 适合结构简单的业务海报。若海报依赖复杂滤镜、视频、跨域背景或需要像素级一致，应改为
Canvas 主动绘制或使用预合成图片，不要继续堆截图兼容样式。

### 5.8 桌面迁移验收清单

单个页面只有满足下面项目才算完成桌面迁移：

- 路由已声明正确的 `desktopLayout`，直接刷新、返回和重定向后 `html[data-main-layout]` 状态正确。
- `375 × 812` 移动端无回归；`768 × 1024` Pad、`1024 × 768` 横屏 Pad、`1366 × 768` 常见笔记本、
  `1440 × 1024` 设计舞台和 `1920 × 1080` 大屏均无内容截断。
- 大于 `1440 × 1024` 时只有背景扩展，交互内容仍在居中舞台内；不足舞台时无强制宽高比，无整页缩放。
- 使用 0 条、1 条、少量和多条数据检查列表；卡片左对齐或整行占满符合页面类型，滚动区能到达最后一项。
- 用长俱乐部名、长玩家名、较大数字和不同语言检查省略、换行与按钮挤压，不只验证中文短文案。
- 顶部导航、底部按钮、悬浮菜单、Popup/Dialog、角色抽屉、数字键盘和拉杆都位于内容舞台的正确位置。
- 浅色和深色主题分别检查；桌面样式没有意外覆盖移动端已有颜色、阴影、背景图和状态样式。
- 在 Windows Chrome、Windows Edge、macOS Safari、macOS Chrome 中验证滚轮、触控板、鼠标拖动、
  Pad 触摸和窗口连续缩放，观察是否有明显卡顿。
- 需要登录的页面使用真实登录态做视觉检查，不为截图向 localStorage 填假数据或绕过权限逻辑。
- 最后执行 `pnpm build`；若本次涉及较多样式或模板调整，再执行 `pnpm lint`，只处理本次改动产生的问题。

### 5.9 常见问题快速定位

| 现象 | 优先检查 |
| --- | --- |
| 桌面字体随窗口变得很大 | 路由是否缺少 `desktopLayout`；页面是否错误使用 `vw`/`cqw` 字号 |
| 页面只能看到一半且无法滚动 | Flex/Grid 滚动子项是否缺少 `min-height: 0`；是否错误禁用了中间区滚动 |
| 大屏上按钮跑到内容区外 | 是否相对浏览器使用了 `position: fixed`，而不是相对舞台定位 |
| Popup 仍保持手机宽度 | 是否 Teleport 到 `body`；桌面全局选择器是否能直接命中 Popup 实体类 |
| Popup 动画或位置错乱 | 是否用 `transform` 居中并覆盖了 Vant 自己的进出场 transform |
| 少量牌桌被平均拉得很开 | Grid/Flex 是否使用了 `space-between`；改为左对齐固定/有限列宽 |
| 缩放窗口明显卡顿 | 复杂 SVG/滤镜、重复 resize 监听、重复根字号写入、每卡片 `container-type` |
| 拉杆圆球落后鼠标 | 是否按设计宽度计算；应使用当前轨道 DOMRect、Pointer Event 和 pointer capture |
| 导出图片有粗白边或白色网格 | 是否直接截图带 transform/backdrop-filter 的实时弹窗；改为离屏纯色副本 |
| 深色桌面和深色移动端不一致 | `_content_desktop.scss` 是否越权覆盖了颜色、阴影、滤镜或主题变量 |

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

### 8.2 字体接入规范

当前项目字体接入约定如下：

1. 字体文件统一放在 `public/assets/fonts/`。
2. 全局 `@font-face` 统一写在 `src/styles/_base.scss`。
3. 全局默认字体链在 `src/styles/_base.scss` 的 `--font-family-sans` 配置。
4. 页面局部特殊字体（例如 MTT 倒计时）在对应 SFC 局部样式中覆盖。

当前已接入示例：

- `HONOR Sans CN`：`public/assets/fonts/HONORSansCN-Regular.woff2`
- `Keania One`：`public/assets/fonts/KeaniaOne-Regular.woff2`

`@font-face` 示例（见 `src/styles/_base.scss`）：

```scss
@font-face {
  font-family: 'HONOR Sans CN';
  src: url('/assets/fonts/HONORSansCN-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

注意：

- 仅写 `font-family` 不会自动下载字体；必须有 `@font-face + 对应文件`。
- 推荐优先使用 `woff2`；文件较大时建议做子集化，避免首屏性能损耗。
- 改完字体文件后建议硬刷新（`Cmd + Shift + R`）并在 Network 中确认字体请求返回 `200`。

### 8.3 主题体系（深浅双主题）

产品需求：现有版本定义为**深色主题**，新增一套**浅色主题**。默认跟随当前手机、浏览器或
Telegram WebView 暴露的系统明暗偏好；运行时同时支持深色、浅色和跟随系统三种模式。

#### 架构总览

| 部分 | 位置 | 职责 |
|------|------|------|
| 主题变量层 | `src/styles/_themes.scss` | 只放跨页面通用语义色，按 `html[data-theme]` 切换 |
| 全局基础层 | `src/styles/_base.scss` | 字体、尺寸令牌、reset、页面骨架与少量仍在使用的排版类 |
| 公共组件层 | `src/styles/_components.scss` | 全局复用块与 Vant 覆盖 |
| 局部覆盖 mixin | `src/styles/_mixins.scss` → `theme-light` / `theme-dark` | 变量表达不了的差异（背景图、阴影等） |
| 运行时 | `src/utils/theme.ts` | 维护 `html[data-theme]`、持久化模式、监听系统明暗、同步 `<meta name="theme-color">` |
| 组件侧 API | `src/composables/useTheme.ts` | JS 里读主题 / 切换模式（图表配色、动态图片、设置页开关） |
| 首帧防闪烁 | `index.html` 内联脚本 | 样式生效前设好 `data-theme`，避免开屏闪错主题 |
| 持久化 | `localStorage` `dzpk_h5_THEME_MODE`（`StorageKey.THEME_MODE`） | 存用户选择的模式 `light / dark / system` |

三个概念区分：

- **mode（模式）**：用户的选择，`light` / `dark` / `system`，持久化。
- **theme（生效主题）**：`light` / `dark`，`system` 按 Telegram 或浏览器环境归一后的结果。
- `html[data-theme='light'|'dark']`：CSS 的唯一切换开关。

#### 默认模式

默认模式为 `system`，以下两处必须保持同步，确保首帧和 Vue 运行时不会切换闪烁：

1. `src/utils/theme.ts` → `DEFAULT_THEME_MODE = 'system'`
2. `index.html` 内联脚本 → 无有效存储时回退 `mode = 'system'`

`system` 在 Telegram Mini App 中优先使用 `WebApp.colorScheme`，并监听 `themeChanged`；普通手机浏览器
使用 `prefers-color-scheme`。Telegram SDK 尚未加载时先按浏览器环境判断，SDK 就绪后会自动校正。

#### 预览方式

URL 加 `?theme=light`（hash 路由内也可）可强制预览浅色，仅当次会话生效、不落存储，
供美术走查 / 测试对照用。调试面板“当前主题”旁的切换按钮可即时轮换三种模式。

#### 变量清单（`--c-*`）

| 变量 | 语义 | 深色值（= 现网观感） |
|------|------|---------------------|
| `--c-brand` | 当前主题主色 | `#05e7ae`（浅色为 `#69beff`） |
| `--c-brand-rgb` | 当前主题主色 RGB 通道，供透明度组合 | `5, 231, 174`（浅色为 `105, 190, 255`） |
| `--c-text` | 主要文字 | `#fff` |
| `--c-text-muted` | 次要 / 弱化文字 | `rgba(255,255,255,.5)` |
| `--c-page` | 页面底色 | `#0f0f0f` |
| `--c-surface` | 通用卡片 / 容器底色 | `rgba(255,255,255,.1)` |
| `--c-overlay` | 遮罩 | `rgba(12,12,12,.6)` |
| `--c-border` | 通用边框 | `rgba(255,255,255,.2)` |
| `--c-divider` | 分隔线 | `rgba(255,255,255,.1)` |

> `#69beff` 直接作为浅色主题的 `--c-brand`，不要再为渐变、按压态等拆出多组近似品牌色变量。
> 需要不同透明度时写 `rgba(var(--c-brand-rgb), alpha)`，透明度保留在页面或组件语义位置；不要再硬编码两套 RGB。
> 页面特有的渐变、玻璃和阴影放在页面样式中，用主题 mixin 覆盖；只有多个页面真正复用时才新增全局变量。

#### 页面迁移写法

**1. 颜色一律换成变量**（最主要的工作量，全项目约 1300 处写死色值）：

```scss
// Before
color: #fff;
background: rgba(255, 255, 255, 0.1);

// After
color: var(--c-text);
background: var(--c-surface);
```

常见写死值 → 变量对照：主题主色用 `--c-brand`，文字用 `--c-text/--c-text-muted`，
页面与卡片用 `--c-page/--c-surface`。语义优先于色值，不要机械替换，也不要为页面独有颜色扩充全局变量。

**2. 变量表达不了的差异用 mixin**（例如两套背景图）：

```scss
@use '@/styles/mixins' as *;

.main-layout {
  background-image: url('@/assets/images/main_bg.webp');

  @include theme-light {
    background-image: url('@/assets/images/main_bg_light.png');
  }
}
```

主题 mixin 必须写在需要覆盖的原始 class 选择器内部，与该 class 的深色样式就地共置；禁止在页面
根节点或其他父级选择器中集中嵌套多个子 class 的浅色覆盖。

```scss
// ✅ 正确：浅色差异紧跟原始 class，不改变选择器的父级关系
.club-size-pill {
  position: absolute;
  right: 0.5rem;
  bottom: 0.3rem;
  background: rgba(255, 255, 255, 0.2);

  @include theme-light {
    background: rgba(164, 164, 164, 0.2);
  }
}

// ❌ 错误：集中覆盖会增加父级依赖和 specificity，可能干扰定位、状态类及响应式规则
.club-detail-bg {
  @include theme-light {
    .club-size-pill {
      background: rgba(164, 164, 164, 0.2);
    }
  }
}
```

伪元素、状态选择器和组合选择器也遵循同一原则：在其已有选择器声明内直接加入
`@include theme-light`，不要统一收口到文件末尾的主题覆盖区。

**3. 图标与图片素材**：单色 SVG 统一封装组件，路径只写一份，使用 `currentColor`，主题只改
`color`；不要为搜索、牌型等单色图标再维护 `_light.svg`。

只有多色位图或复杂装饰无法用 `currentColor` 时，才使用两套素材：

```html
<img class="only-dark" src="@/assets/images/logo_dark.png" />
<img class="only-light" src="@/assets/images/logo_light.png" />
```

命名约定：浅色素材与深色同名加 `_light` 后缀。

**4. JS 侧需要主题时**（图表、canvas、动态样式）：

```ts
import { useTheme } from '@/composables/useTheme'

const { theme, isDark, setMode } = useTheme() // theme 是响应式的，watch 即可跟随切换
```

**5. 模板工具类**：`.tc-text/.tc-muted/.tc-brand`、`.bg-c-page/.bg-c-surface`（见 `_themes.scss`）。
`_utilities.scss` 里的 `.text-white/.bg-white-10` 等白色系类不随主题变化，迁移时替换掉。

#### 迁移节奏

1. ✅ 基础架构：变量层 / 运行时 / 防闪烁 / 预览参数，默认跟随 Telegram 或浏览器系统主题。
2. ✅ 按首版 Figma 校准浅色基础色与俱乐部列表页，并收敛为少量全局语义变量。
3. ✅ 5 个一级页面及其游客页逐页对稿迁移，深色保持现有布局与观感。
4. 🔄 二级页面、公共组件（Dialog/Toast/Tabbar/Vant 覆盖）继续按同一规则推进；按钮与
   `GameCreateForm` 已接入深浅主题，创建牌桌的专业参数 / 一键开桌模式已完成浅色迁移。
5. ✅ 品牌纯色和透明色统一为 `--c-brand` / `--c-brand-rgb`；页面专属渐变仍由页面局部维护，
   浅色必须使用 `theme-light` 给出完整覆盖，不能只替换渐变的第一个色阶。

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

## 11. 组件

### 11.1 TopActionButton

位置：`src/components/Button/TopActionButton.vue`

用途：

- 顶部右侧常用操作按钮（文字 + 图标）
- 深色使用原玻璃效果；浅色使用白色胶囊、黑色文字，并通过 CSS mask 将现有单色图标着色为主题色，
  调用方无需维护 `_light` 图标或修改现有 Props。

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

`PrimaryButton` 的浅色样式统一为 `--c-brand` 纯色、白字、无深色高光阴影；页面不要再次覆盖一套浅色渐变。

`src/components/GameCreateForm/` 下的输入、下拉、步进器、开关、滑杆、模式 Tab 和提示气泡均在组件内处理主题。
页面层只负责卡片 / 页面背景等容器语义；下拉与提示气泡的 Vant `theme` 必须跟随 `useTheme()`，不能写死为
`dark`。单色的提示、编辑和下拉图标统一由 `AppSvgIcon` 使用 `currentColor` 着色。

### 11.2 PageBackHeader

位置：`src/components/HeaderBack/HeaderBack.vue`

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
      <TopActionButton name="切换" :icon="walletIcon" @click="handleTodoClick" />
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

---

### 11.3 GameTable

位置：`src/components/Table/`

文件结构：

```
Table/
├── index.ts              # 统一导出
├── types.ts              # 类型定义 + InjectionKey
├── GameTable.vue         # 主容器，管理排序状态，provide 列注册上下文
├── GameTableColumn.vue   # 列定义（不渲染，onMounted 通过 inject 向父级注册配置）
├── GameTableHeader.vue   # 统一 header 条（pill 胶囊样式）
├── GameTableRow.vue      # 单行卡片
└── GameTableCell.vue     # 单元格内容，支持 formatter 和自定义 slot
```

#### GameTable Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `Record<string, any>[]` | — | 表格数据 |
| `showHeader` | `boolean` | `true` | 是否显示表头 |
| `defaultSort` | `{ prop: string; order: 'asc'\|'desc'\|'' }` | — | 默认排序状态 |
| `height` | `string` | — | body 固定高度（如 `'10rem'`），超出后滚动；不设则随内容撑开 |
| `v-model:loading` | `boolean` | `false` | 加载中状态，true 时不触发新的 load；父组件请求完成后置为 false |
| `finished` | `boolean` | `false` | 全部加载完毕，不再触发 load |
| `disabled` | `boolean` | `false` | 禁用滚动加载 |
| `offset` | `number` | `50` | 距底部多少 px 时触发 load |

#### GameTable Events

| Event | 参数 | 说明 |
|-------|------|------|
| `sortChange` | `(col, order)` | 点击排序触发，order 循环 asc → desc → '' |
| `load` | — | 滚动触底时触发，父组件应请求下一页数据并在完成后将 `loading` 置为 false |
| `selectChange` | `(col, option)` | 下拉选择触发 |
| `rowClick` | `(row)` | 行点击触发 |

#### GameTableColumn Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `prop` | `string` | — | 数据字段名 |
| `label` | `string` | — | 表头显示文字 |
| `flex` | `number` | `1` | flex 权重，设置 `width` 后失效 |
| `width` | `string` | — | 固定列宽，如 `'1.5rem'`、`'25%'` |
| `sortable` | `boolean` | `false` | 是否启用排序 |
| `select` | `{ text: string; value: any }[]` | — | 下拉筛选选项，有值则显示下拉箭头 |
| `align` | `'left'\|'center'\|'right'` | `'center'` | 内容对齐 |
| `fixed` | `boolean` | `false` | 固定列（预留，暂不处理横向滚动） |
| `formatter` | `(value, row) => any` | 原值 | 自定义格式化显示值 |

#### 自定义 slot 渲染

`GameTableColumn` 的默认 slot 接收 `{ row, value }` 作用域，可自定义单元格内容：

```vue
<GameTableColumn prop="name" label="玩家" :flex="2">
  <template #default="{ row, value }">
    <img :src="row.avatar" class="avatar" />
    <span>{{ value }}</span>
  </template>
</GameTableColumn>
```

#### 完整示例

```vue
<script setup lang="ts">
import { GameTable, GameTableColumn } from '@/components/Table'

const data = [
  { rank: 1, name: '玩家A', score: 9800, type: 'NLH' },
  { rank: 2, name: '玩家B', score: 8700, type: 'PLO' },
]

function onSortChange(col, order) {
  console.log('sort', col.prop, order)
}

function onSelectChange(col, option) {
  console.log('filter', col.prop, option.value)
}
</script>

<template>
  <GameTable
    :data="data"
    :show-header="true"
    :default-sort="{ prop: 'score', order: 'desc' }"
    @sort-change="onSortChange"
    @select-change="onSelectChange"
    @row-click="(row) => console.log(row)"
  >
    <GameTableColumn prop="rank" label="排名" width="1rem" />
    <GameTableColumn prop="name" label="玩家" :flex="2">
      <template #default="{ row, value }">
        <img :src="row.avatar" style="width:0.6rem;height:0.6rem;border-radius:50%" />
        <span style="margin-left:0.12rem">{{ value }}</span>
      </template>
    </GameTableColumn>
    <GameTableColumn prop="score" label="积分" :sortable="true" :formatter="(v) => v.toLocaleString()" />
    <GameTableColumn
      prop="type"
      label="类型"
      :select="[
        { text: '全部', value: '' },
        { text: 'NLH', value: 'nlh' },
        { text: 'PLO', value: 'plo' },
      ]"
    />
  </GameTable>
</template>
```

#### 分页滚动加载示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GameTable, GameTableColumn } from '@/components/Table'

const data = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
let page = 1

async function onLoad() {
  const res = await fetchTableData({ page: page++ })
  data.value.push(...res.list)
  loading.value = false
  if (data.value.length >= res.total) finished.value = true
}
</script>

<template>
  <GameTable :data="data" height="12rem" v-model:loading="loading" :finished="finished" @load="onLoad">
    <GameTableColumn prop="rank" label="排名" width="1rem" />
    <GameTableColumn prop="name" label="玩家" />
    <GameTableColumn prop="score" label="积分" :sortable="true" />
  </GameTable>
</template>
```

**注意事项：**
- `height` 必须设置，否则 body 不是滚动容器，无法触发 `load`
- `load` 触发后组件自动将 `loading` 设为 true，请求完成后父组件**必须**将其置为 false
- 数据不足一屏时组件会在 `loading` 变 false 后自动再次检查并触发 `load`，直到内容溢出或 `finished` 为 true
- 自定义底部状态可通过 `#loading` / `#finished` slot 覆盖默认样式

#### 样式说明

- **Header**：整体为一个 pill 胶囊条，样式与 `FilterTabbar--pill` 激活态完全一致（外层白色内阴影环 + 内层绿色填充 + 绿色 glow）
- **Row**：每行为一个独立圆角卡片（`border-radius: 0.425rem`，`background: rgba(0,0,0,0.2)`），最小高度 `0.85rem`，行间有 `0.12rem` 间距
- **下拉面板**：`background: rgba(0,0,0,0.37)` + `backdrop-filter: blur(0.16rem)`
- **排序图标**：上下箭头对（Vant `arrow-up` / `arrow-down`），激活态变白色，后续可替换为自定义 SVG
- **下拉箭头**：Vant `arrow-down`，展开时旋转 180°

---

### 11.4 GameDialog

位置：`src/components/Dialog/`

二次封装 `van-dialog`，保留其 overlay/teleport/lockScroll 等底层能力，完全替换视觉 UI。

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `v-model:show` | `boolean` | — | 控制显示/隐藏 |
| `title` | `string` | — | 标题文字 |
| `message` | `string` | — | 内容文字 |
| `showCancelButton` | `boolean` | `false` | 是否显示取消按钮 |
| `cancelButtonText` | `string` | `'取消'` | 取消按钮文字 |
| `confirmButtonText` | `string` | `'确认'` | 确认按钮文字 |
| `confirmButtonDisabled` | `boolean` | `false` | 确认按钮是否禁用 |
| `beforeClose` | `(action) => boolean\|Promise<boolean>` | — | 关闭前回调，return false 阻止关闭 |

其余 `van-dialog` 原生属性（`overlay`、`teleport`、`closeOnClickOverlay` 等）均通过 `v-bind="$attrs"` 透传。

#### Slots

| Slot | 说明 |
|------|------|
| `#title` | 自定义标题内容，覆盖 `title` prop |
| `#default` | 自定义 body 内容，覆盖 `message` prop |

#### Events

| Event | 说明 |
|-------|------|
| `confirm` | 点击确认按钮 |
| `cancel` | 点击取消按钮 |
| `close` | 弹窗关闭 |

#### 示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GameDialog } from '@/components/Dialog'

const show = ref(false)
</script>

<template>
  <!-- 文字版 -->
  <GameDialog
    v-model:show="show"
    title="提示"
    message="确定要退出房间吗？"
    :show-cancel-button="true"
    @confirm="handleConfirm"
    @cancel="show = false"
  />

  <!-- 自定义内容 -->
  <GameDialog v-model:show="show" title="规则说明">
    <template #default>
      <div style="text-align:left; color:#fff">自定义内容...</div>
    </template>
  </GameDialog>
</template>
```

#### 样式说明

- **背景**：`component_dialog_bg.png`，`background-size: 100% auto` 从顶部裁切，内容多高显示多高，不拉伸
- **内阴影**：`inset 2.12px 4.24px 17.23px rgba(242,242,242,0.9)` + 四角高光
- **尺寸**：宽 `9rem`，最小高 `2rem`，圆角 `0.97rem`，内边距 `0.5rem`
- **body**：最大高 `12rem`，超出滚动（隐藏滚动条）
- **确认按钮**：`PrimaryButton`（`:shadow="false"` 关闭高光阴影）
- **取消按钮**：`rgba(0,0,0,0.3)` + `backdrop-filter: blur(0.05rem)`
- **遮罩**：使用 `--c-overlay`，Vant 全局覆盖集中在 `_components.scss`

---

### 11.5 GameToast

位置：`src/components/Toast/`

二次封装 `van-toast`，保留其定时关闭/位置/遮罩能力，完全替换视觉 UI。

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `v-model:show` | `boolean` | — | 控制显示/隐藏 |
| `message` | `string\|number` | — | 提示文字 |
| `duration` | `number` | `2000` | 展示时长(ms)，`0` 不自动关闭 |
| `overlay` | `boolean` | `false` | 是否显示遮罩 |
| `closeOnClick` | `boolean` | `false` | 点击 toast 本身关闭 |
| `closeOnClickOverlay` | `boolean` | `false` | 点击遮罩关闭 |
| `forbidClick` | `boolean` | `false` | 是否禁止背景点击穿透 |
| `position` | `'top'\|'middle'\|'bottom'` | `'middle'` | 展示位置 |

其余 `van-toast` 原生属性通过 `v-bind="$attrs"` 透传。

#### Slots

| Slot | 说明 |
|------|------|
| `#default` | 自定义内容，覆盖 `message` prop，可放任意节点 |

#### Events

| Event | 说明 |
|-------|------|
| `close` | toast 关闭时触发 |

#### 示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GameToast } from '@/components/Toast'

const show = ref(false)
</script>

<template>
  <!-- 文字版 -->
  <GameToast v-model:show="show" message="操作成功" />

  <!-- 自定义内容 -->
  <GameToast v-model:show="show" :duration="0" :close-on-click="true">
    <div style="display:flex;align-items:center;gap:0.2rem">
      <van-icon name="success" size="0.5rem" color="var(--c-brand)" />
      <span style="color:#fff;font-size:0.43rem">充值成功</span>
    </div>
  </GameToast>
</template>
```

#### 样式说明

- **背景**：与 GameDialog 相同，`component_dialog_bg.png` 顶部裁切不拉伸
- **内阴影**：与 GameDialog 完全一致
- **尺寸**：宽 `8.45rem`，最小高 `1.6rem`，圆角 `0.9rem`
- **内边距**：上下 `0.6rem`，左右 `0.4rem`
- **字体**：`0.43rem`，白色，支持自动换行
- **遮罩**：默认不开启（`overlay: false`），开启后颜色 `rgba(12,12,12,0.6)`

---

### 11.6 ImageUploadSheet

位置：`src/components/ImageUploadSheet/ImageUploadSheet.vue`

底部弹窗式图片上传组件，支持拍照和相册两种来源，自动上传至 OSS，通过 `v-model` 绑定返回的图片 URL。底部弹窗经 `<teleport to="body">` 挂载，不受父级 `overflow: hidden` 影响。

#### Props

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `modelValue` | `string` | `''` | 图片 URL，配合 `v-model` 使用 |
| `accept` | `string` | `'image/*'` | 透传给 `<input type="file">` 的 accept 属性 |

#### Emits

| 事件 | 载荷 | 说明 |
|---|---|---|
| `update:modelValue` | `string` | OSS 上传成功后返回的图片 URL |
| `upload-start` | — | 开始上传时触发 |
| `upload-end` | — | 上传结束时触发（成功与失败均会触发） |
| `error` | `string` | 上传失败时触发，携带错误消息 |

#### 默认插槽（scoped slot）

| Slot Prop | 类型 | 说明 |
|---|---|---|
| `open` | `() => void` | 调用后弹出底部来源选择弹窗 |
| `imageUrl` | `string` | 当前 `modelValue` 的透传，可直接用于渲染预览 |
| `uploading` | `boolean` | 上传进行中状态，可用于显示 loading |

#### 示例

```vue
<ImageUploadSheet v-model="avatarUrl">
  <template #default="{ open, imageUrl, uploading }">
    <button class="avatar-trigger" @click="open">
      <img :src="imageUrl || fallbackImg" />
      <span v-if="uploading">上传中...</span>
    </button>
  </template>
</ImageUploadSheet>
```

监听上传状态：

```vue
<ImageUploadSheet
  v-model="avatarUrl"
  @upload-start="loading = true"
  @upload-end="loading = false"
  @error="onUploadError"
>
  ...
</ImageUploadSheet>
```

---

## 12. 日志系统

位置：`src/utils/logger.ts`

统一封装 `console.log/info/warn/error`，支持全局 level 控制和单 logger 独立开关。

### 12.1 Level 说明

| Level | 输出内容 |
|-------|---------|
| `debug` | debug / info / warn / error |
| `info` | info / warn / error |
| `warn` | warn / error |
| `error` | error |
| `silent` | 全部静默 |

开发环境默认 `debug`，生产环境默认 `warn`（可被 `VITE_DROP_CONSOLE=true` 在构建时彻底抹除）。

### 12.2 在模块中使用

```ts
import { createLogger } from '@/utils/logger'

const log = createLogger('[myModule]')

log.debug('详细数据', { key: value })  // 仅 debug level 输出
log.info('状态变更')
log.warn('异常降级:', error)
log.error('致命错误:', error)
```

同 tag 多次调用 `createLogger` 返回同一实例（注册表单例）。

### 12.3 已注册的 logger 及职责

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

### 12.4 运行时动态控制

项目在 `window.__log` 上暴露了三个方法，可直接在浏览器控制台调用：

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
```

### 12.5 在组件生命周期中临时调试

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

## 13. 协议文件同步（Protobuf）

pb 生成文件（`.js` + `.d.ts`）**已提交到 git**，通常不需要每次开发都重新执行。

```bash
pnpm sync:protocol
```

**何时需要执行**：上游 `agreement-web` 仓库新增或变更了 H5 订阅的协议时。

**执行后**：把更新的 pb 文件提交到 git，与代码一起走 CR 流程。

**与 `sync:i18n` 的区别**：

| 命令 | 触发方式 | 来源 | 产物是否提交 git |
|------|---------|------|----------------|
| `sync:i18n` | `predev` / `prebuild` 自动 | `pokerqueen/` 语言文件 | 否（仅运行时需要） |
| `sync:protocol` | 手动按需 | `agreement-web` 仓库 | 是（pb 文件已纳入版控） |

**白名单维护**：`scripts/update_protocol.sh` 中的 `H5_RECV_FILES` 数组。H5 只同步大厅 / 全局通知（code < 1000），游戏内协议由 Cocos 自行管理，双方都从同一个 `agreement-web` 仓库拉取。

新增协议的完整步骤见 `src/bridge/README.md` 6.4 节。

## 14. 用户级本地缓存（IndexedDB）

### 14.1 目标

- **切换用户天然隔离**：A 账号登出后 B 账号登录，互相看不到对方的缓存。
- **不卡加载**：首屏先用本地缓存渲染，后台静默 fetch 覆盖更新。
- **按"用户 → 俱乐部"分层扩展**：后续要缓存某 club 的成员列表、房间列表等不需要重新设计存储结构。
- **H5 与 Cocos 共用一份库**：cocos 不再开自己的 `cc_cache_user_*`，所有持久化经 bridge 委托给 H5（详见 `src/bridge/README.md §10`）。

### 14.2 整体布局

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

### 14.3 公共 API：`userCache(userId)`

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

### 14.4 键策略

| 场景               | 推荐 key                | 范围查询                                              |
| ------------------ | ----------------------- | ----------------------------------------------------- |
| 用户级数据         | 简单 key（如 `clubId`） | `getAll()`                                            |
| 俱乐部级数据       | `[clubId, subId]`       | `IDBKeyRange.bound([clubId], [clubId, []])`           |
| 用户 + 房间        | `[roomId]`              | `getAll()`                                            |

**为什么用复合键 `[clubId, subId]` 而不是字符串拼接 `"${clubId}_${subId}"`：**

- 范围查询是 IndexedDB 原生能力，毫秒级；字符串前缀方案要游标遍历过滤。
- 删除一个 club 全部数据：`store.delete(IDBKeyRange.bound([clubId], [clubId, []]))` 一次完成。
- 类型清晰：`[number, number]` vs 容易拼错的字符串。

### 14.5 新增一个缓存类型的步骤

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

### 14.6 调用约定（强烈建议遵循）

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

### 14.7 与 `public_cache` 的关系

| 维度              | `public_cache`                | `user_cache_${uid}`                     |
| ----------------- | ----------------------------- | --------------------------------------- |
| 作用域            | 全用户共享                    | 单用户私有（H5 + Cocos 共用）           |
| 典型数据          | 多语言模板、全局配置、钻石档位 | 俱乐部列表、牌桌玩家信息、牌谱…         |
| 隔离              | 否                            | 切换用户天然隔离                        |
| 清理              | 升级版本时由 `onupgradeneeded` 处理 | 退出账号无需清理，下次同账号秒开 |
| API               | `readPublicCache` / `writePublicCache` | `userCache(uid).get/put/...`（H5）/ `cocosCache().get/put/...`（CC，bridge 转发） |

### 14.8 与 cocos 端的对应

H5 与 Cocos 共用同一个 `user_cache_${uid}`，cocos 通过 bridge 把读写委托给 H5（协议见 `src/bridge/README.md §10`）：

| 维度       | h5                                       | cocos                                                |
| ---------- | ---------------------------------------- | ---------------------------------------------------- |
| db 命名    | `user_cache_${uid}`                      | `user_cache_${uid}`（与 H5 同一份，bridge 转发）      |
| 用户切换   | Map 缓存多个 db 连接                     | 由 H5 端按当前登录态决定 uid                          |
| API 形态   | `userCache(uid).get/put/...`             | `cocosCache().get/put/...`（uid 隐式，内部走 bridge） |
| 已有 store | `club_list`                              | `table_user_base_info` / `table_user_data_info` / `game_replays` |
| TTL        | 不内置；wrapper 自行决定                 | wrapper 用 `CacheRecord<T> = {data, updatedAt}` 包一层 |

两端共用 db 但 store 名严格区分：H5 自有 store（如 `club_list`）只在 H5 进程内访问；cocos 写入的 store 必须在 `CC_CACHE_STORES` 白名单中，否则 `ccStorageProxy` 会拒绝。

### 14.9 已落地的缓存清单

| Store                     | 写入方  | Key                | 数据                  | 调用方                                                       |
| ------------------------- | ------- | ------------------ | --------------------- | ------------------------------------------------------------ |
| `club_list`               | H5      | `clubId`           | `ClubInfo`            | `src/utils/userClubListCache.ts`                             |
| `table_user_base_info`    | Cocos   | `userRandomId`     | `CacheRecord<info>`   | `pokerqueen/assets/script/tools/PlayerInfoCacheDB.ts`        |
| `table_user_data_info`    | Cocos   | 复合（含 game/poker/origin/gold type） | `CacheRecord<stats>` | 同上                                                         |
| `game_replays`            | Cocos   | `userId_roomId_handNum` 或 `userId_m{matchId}_handNum` | 牌谱 | `pokerqueen/assets/script/tools/ReplayCacheDB.ts`            |

更新此表请同步本节。新增 cocos 写入的 store 时同时更新 `src/utils/indexedDB.ts` 的 `CC_CACHE_STORES`（白名单）与 `USER_CACHE_DB_VERSION`。

### 14.10 FAQ

**Q：为什么不放一个 db、用 key 前缀区分用户？**

A：清理某个用户的数据要游标遍历前缀匹配，没有 `deleteDatabase` 干净；schema 升级要全员一起。per-user db 是最低心智负担的选择。

**Q：为什么不在每个用户 db 内部再按 club 拆 store（`user_xx_club_yy_data`）？**

A：IndexedDB 创建 object store 必须在 `onupgradeneeded` 里、要 bump version。每加入一个新 club 就升级 schema 不现实。复合键 `[clubId, subId]` 才是 IndexedDB 的官方姿势。

**Q：为什么 H5 与 Cocos 共用一个 db？**

A：早期 H5 / Cocos 各自开 `h5_cache_user_*` 和 `cc_cache_user_*`，配额、清理、调试都要看两份。改成共用 `user_cache_${uid}` 后：清账号一次 `deleteDatabase` 就干净；DevTools 看一张表；Cocos 不再有本地落盘，所有数据出口都汇聚到 H5（详见 `src/bridge/README.md §10`）。

**Q：缓存陈旧怎么办？**

A：当前不做 TTL — fetch 回来直接覆盖即可。如果未来需要"超过 N 分钟才强刷"之类策略，把 value 包成 `{ data, updatedAt }`、把 `USER_CACHE_DB_VERSION` 加一、迁移老数据即可，外层 API 不变。（cocos 那边已经是这种用法，见 `PlayerInfoCacheDB.ts`。）

**Q：多 tab 怎么办？**

A：当前 H5 在 Cocos WebView 里基本单 tab。如果以后出现并发场景，可在 `userCache.ts` 给 db 连接加 `onversionchange` 监听，触发时关闭并从 `_dbCache` 剔除。

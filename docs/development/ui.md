# 页面布局、主题与多语言

返回 [开发入口](../../README.md) · [渠道 C 产品说明](../channel-c.md)

## 1. 移动端、Pad 和桌面端自适应规范

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

### 1.1 桌面布局如何开启

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

### 1.2 `rem`、`clamp()` 和 `cqw` 怎么选

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

### 1.3 样式分层

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

两份桌面页面族样式不会进入移动端首包：路由声明 `desktopLayout` 且视口达到 `600px` 时，
`mainLayout.ts` 会在导航确认前按 `primary/content` 加载对应 CSS；从手机宽度切到桌面宽度时也会自动补载。

桌面页面族样式默认只负责尺寸、间距、定位、排列和滚动范围。颜色、背景、边框颜色、阴影、滤镜、
字体和主题差异继续由原组件样式管理；除非产品明确要求桌面端采用另一套视觉资源，否则不要在
`_*_desktop.scss` 中重复覆盖这些属性。

### 1.4 新增与迁移页面步骤

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

#### 1.4.1 普通内容页的标准舞台

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

#### 1.4.2 顶部、滚动区和底部操作

- 顶部导航、筛选区和底部操作栏占固定行，中间列表或表单使用 `minmax(0, 1fr)`、`min-height: 0` 和
  `overflow-y: auto`。缺少 `min-height: 0` 是 Flex/Grid 子项无法滚动、只能看到一半内容的常见原因。
- 窗口高度不足时滚动中间内容，不把卡片、字号和按钮一起纵向压扁；长列表也不要依赖整个 `body` 滚动。
- 底部按钮固定在舞台内，可保持设计稿明确的按钮宽度；不要直接相对浏览器使用全局
  `position: fixed`。悬浮菜单同理，应固定在舞台右下角，不需要和主操作按钮贴在一起。
- 牌桌卡片、赛事卡片等重复项应左对齐，数量不足一行时不要用 `space-between` 拉开。优先使用
  `grid-template-columns: repeat(auto-fill, 固定或有限宽度)` 配合 `justify-content: start`。
- 列表卡片需要占满内容行时，给列表列轨道或卡片写 `width: 100%`，不要只让外层容器变宽。

#### 1.4.3 Teleport 弹窗和底部抽屉

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

#### 1.4.4 表单控件、拉杆和数字键盘

- 数字输入统一复用 `src/components/KeyBoard/NumericKeypad.vue`。它已经在 `600px` 以上横向扩展到最大
  `1440px`，按键高度根据视口高度独立调整，不要在页面内再复制一套键盘。
- 键盘和 Popup 一样会 Teleport 到 `body`；打开键盘后应让中间表单保持可滚动，避免最后一项和操作按钮
  永久被遮住。
- 桌面拉杆使用 Pointer Event；拖动开始后调用 `setPointerCapture()`，根据真实轨道
  `getBoundingClientRect()` 计算百分比。不要拿设计稿宽度或放大后的 `cqw` 反推坐标，否则鼠标会比圆球快。
- 全局禁止拖拽和文本选择时，不要在父层统一阻断 `pointerdown`/`pointermove`。`input`、`textarea`、
  `[contenteditable]`、`range` 和自定义拉杆必须保留正常指针事件。

#### 1.4.5 可直接参考的已迁移页面

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

#### 1.4.6 样式应该放在哪里

- 页面 `.vue` 的 scoped style：保留移动端布局、业务状态、颜色、阴影、主题和只出现一次的视觉规则。
- `_content_desktop.scss`：已迁移普通内容页在桌面端的几何尺寸、排列、定位和滚动边界。所有规则必须以
  `html[data-main-layout='content'] .页面根类` 收口。
- `_main_desktop.scss`：只维护五个一级页和 `MainBottomTab`，不要继续塞二三级页面。
- 公共组件内部的桌面媒体查询：只有行为确实被多个页面共享时使用，例如 `NumericKeypad`、
  `MainBottomTab`。不要为了一个页面把页面专属位置写进公共组件。
- 独立 `_*_desktop.scss`：仅用于牌桌、沉浸式游戏等舞台和交互模型明显不同的页面族。

若桌面与移动端仅布局不同，不要复制一份 `*DesktopView.vue` 独立维护。只有 DOM 结构或业务交互确实不同，
且共享模板会产生大量条件分支时，才考虑拆分组件。

### 1.5 缩放性能约束

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

### 1.6 Cocos 牌桌的桌面画布

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

### 1.7 DOM 截图和海报导出

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

### 1.8 桌面迁移验收清单

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

### 1.9 常见问题快速定位

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

## 2. 样式开发约定

- 页面优先使用现成结构类：`.page-shell`、`.section-card`、`.section-title`
- 大小优先用设计变量，不要在页面散写大量 `rem` 数字
- 业务局部样式放在页面 SFC，通用样式放 `src/styles/`

备注：

- 375 设计稿下，`1rem = 37.5px(设计稿)`，优先按设计稿标注换算到 rem
- 页面内避免硬编码十进制长小数，优先使用 tokens 变量
- 新增通用样式时，先放 `src/styles/`，避免重复复制到多个页面

### 2.1 页面滚动公共类

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


复用外层滚动容器的长列表，承载内容的 Flex 子项必须允许按内容撑高。渠道 C 的 `.module-slot` 使用 `flex: 1 0 auto`，否则子内容溢出时会丢失底部菜单的预留空间。它与“内部独立滚动子项使用 `min-height: 0`”属于两种不同布局，不能相互替换。主页显示俱乐部管理悬浮按钮时，还需给最后一张卡片预留按钮高度。

### 2.2 字体接入规范

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

### 2.3 主题体系（深浅双主题）

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

**1. 通用语义颜色使用变量**：

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

#### 维护要求

新增页面和公共组件均沿用上述主题规则；默认模式、首帧脚本与运行时保持一致。新增品牌色使用语义变量，页面专属渐变在组件内维护完整的深浅色差异。


## 3. 多语言用法

当前多语言使用 `@silenthill/h5-cc-i18n` 共享包，不依赖 `vue-i18n`：

- 单一来源：`@silenthill/h5-cc-i18n` 仓库；实际安装版本由 `pnpm-lock.yaml` 固定。
- H5 运行文件：`public/h5-cc-i18n.min.js`，在 Vue 入口前建立 `window.__H5_CC_I18N__`。
- `predev`、`prebuild` 自动执行 `sync:i18n`：优先复制同级 `../h5-cc-i18n/dist/` 的构建产物，不存在时使用依赖包产物。可手动执行 `pnpm sync:i18n`；联调时需确认脚本输出的实际来源，避免误用过期的同级构建。
- 当前运行包内含四种语言，切换语言不再额外请求 TXT 文件。
- 格式化器：`src/i18n/parser.ts`（处理 `\n` 转义和 `{0}` 占位符）
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
- 底层共享包语言码：`zh-CN | zh-TW | en | pt`；业务层继续使用 `cn | zh | en | pt`

本地存储统一约定（与 Cocos 对齐）：

- 前缀：`dzpk_`
- 语言 key：`Language`（最终存储项为 `dzpk_Language`）
- 登录态 key：`LOGIN_DATA`（最终存储项为 `dzpk_LOGIN_DATA`）
- token key：`TOKEN`（最终存储项为 `dzpk_TOKEN`）

赛事名称、道具名称等服务端模板 ID 先调用 `resolveTemplateTextByKey(rawName, getLocale())`，未命中再调用 `t(rawName)` 并保留原文或业务兜底；带编号后缀的名称沿用模板解析规则。在 `computed` 中读取 `multiLanguageTemplateVersion.value`，确保模板异步到达后重新计算。


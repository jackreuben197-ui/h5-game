# 公共组件开发参考

返回 [开发入口](../../README.md) · [渠道 C 产品说明](../channel-c.md)

## 1. TopActionButton

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

## 2. 页面返回导航（HeaderBack）

位置：`src/components/HeaderBack/HeaderBack.vue`

用途：

- 统一页面头部返回区域
- 内置返回箭头，支持标题和右侧操作区扩展

Props：

- `title?: string` 标题文案（默认空字符串）
- `showBack?: boolean` 是否显示返回入口，默认 `true`
- `extraPadding?: boolean` 是否增加顶部留白，默认 `false`

Events：

- `back` 点击返回区域触发（透传原始 `MouseEvent`）

示例把组件导入命名为 `PageBackHeader`；业务中也可沿用 `HeaderBack`。不监听 `back` 时，组件默认执行路由返回。

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

## 3. GameTable

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

### GameTable Props

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

### GameTable Events

| Event | 参数 | 说明 |
|-------|------|------|
| `sortChange` | `(col, order)` | 点击排序触发，order 循环 asc → desc → '' |
| `load` | — | 滚动触底时触发，父组件应请求下一页数据并在完成后将 `loading` 置为 false |
| `selectChange` | `(col, option)` | 下拉选择触发 |
| `rowClick` | `(row)` | 行点击触发 |

### GameTableColumn Props

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

### 自定义 slot 渲染

`GameTableColumn` 的默认 slot 接收 `{ row, value }` 作用域，可自定义单元格内容：

```vue
<GameTableColumn prop="name" label="玩家" :flex="2">
  <template #default="{ row, value }">
    <img :src="row.avatar" class="avatar" />
    <span>{{ value }}</span>
  </template>
</GameTableColumn>
```

### 完整示例

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

### 分页滚动加载示例

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

### 样式说明

- **Header**：整体为一个 pill 胶囊条，样式与 `FilterTabbar--pill` 激活态完全一致（外层白色内阴影环 + 内层绿色填充 + 绿色 glow）
- **Row**：每行为一个独立圆角卡片（`border-radius: 0.425rem`，`background: rgba(0,0,0,0.2)`），最小高度 `0.85rem`，行间有 `0.12rem` 间距
- **下拉面板**：`background: rgba(0,0,0,0.37)` + `backdrop-filter: blur(0.16rem)`
- **排序图标**：上下箭头对（Vant `arrow-up` / `arrow-down`），激活态变白色，后续可替换为自定义 SVG
- **下拉箭头**：Vant `arrow-down`，展开时旋转 180°

---

## 4. GameDialog

位置：`src/components/Dialog/`

二次封装 `van-dialog`，保留其 overlay/teleport/lockScroll 等底层能力，完全替换视觉 UI。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `v-model:show` | `boolean` | — | 控制显示/隐藏 |
| `title` | `string` | — | 标题文字 |
| `message` | `string` | — | 内容文字 |
| `showCancelButton` | `boolean` | `false` | 是否显示取消按钮 |
| `showConfirmButton` | `boolean` | `true` | 是否显示确认按钮 |
| `showFooter` | `boolean` | `true` | 是否显示操作区 |
| `cancelButtonText` | `string` | 公共取消文案 | 取消按钮文字 |
| `confirmButtonText` | `string` | 公共确认文案 | 确认按钮文字 |
| `confirmButtonDisabled` | `boolean` | `false` | 确认按钮是否禁用 |
| `dialogWidth` / `cardMinHeight` / `bodyMaxHeight` | `string` | `9rem` / `2rem` / `12rem` | 弹窗宽度、卡片最小高度及内容最大高度 |
| `cardStyle` / `bodyStyle` / `overlayStyle` | 样式对象 | 见源码 | 按调用场景调整卡片、内容及遮罩 |
| `showBoxShawdow` | `boolean` | `true` | 是否显示卡片阴影，沿用现有属性拼写 |
| `beforeClose` | `(action) => boolean\|Promise<boolean>` | — | 关闭前回调，return false 阻止关闭 |

其余 `van-dialog` 原生属性（`overlay`、`teleport`、`closeOnClickOverlay` 等）均通过 `v-bind="$attrs"` 透传。

### Slots

| Slot | 说明 |
|------|------|
| `#title` | 自定义标题内容，覆盖 `title` prop |
| `#default` | 自定义 body 内容，覆盖 `message` prop |

### Events

| Event | 说明 |
|-------|------|
| `confirm` | 点击确认按钮 |
| `cancel` | 点击取消按钮 |
| `close` | 弹窗关闭 |

### 示例

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

### 样式说明

- **背景**：`component_dialog_bg.png`，`background-size: 100% auto` 从顶部裁切，内容多高显示多高，不拉伸
- **内阴影**：`inset 2.12px 4.24px 17.23px rgba(242,242,242,0.9)` + 四角高光
- **尺寸**：宽 `9rem`，最小高 `2rem`，圆角 `0.97rem`，内边距 `0.5rem`
- **body**：最大高 `12rem`，超出滚动（隐藏滚动条）
- **确认按钮**：`PrimaryButton`（`:shadow="false"` 关闭高光阴影）
- **取消按钮**：`rgba(0,0,0,0.3)` + `backdrop-filter: blur(0.05rem)`
- **遮罩**：使用 `--c-overlay`，Vant 全局覆盖集中在 `_components.scss`

---

## 5. GameToast

位置：`src/components/Toast/`

二次封装 `van-toast`，保留其定时关闭/位置/遮罩能力，完全替换视觉 UI。

### Props

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

### Slots

| Slot | 说明 |
|------|------|
| `#default` | 自定义内容，覆盖 `message` prop，可放任意节点 |

### Events

| Event | 说明 |
|-------|------|
| `close` | toast 关闭时触发 |

### 示例

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

### 样式说明

- **背景**：与 GameDialog 相同，`component_dialog_bg.png` 顶部裁切不拉伸
- **内阴影**：与 GameDialog 完全一致
- **尺寸**：宽 `8.45rem`，最小高 `1.6rem`，圆角 `0.9rem`
- **内边距**：上下 `0.6rem`，左右 `0.4rem`
- **字体**：`0.43rem`，白色，支持自动换行
- **遮罩**：默认不开启（`overlay: false`），开启后颜色 `rgba(12,12,12,0.6)`

---

## 6. ImageUploadSheet

位置：`src/components/ImageUploadSheet/ImageUploadSheet.vue`

底部弹窗式图片上传组件，支持拍照和相册两种来源，自动上传至 OSS，通过 `v-model` 绑定返回的图片 URL。底部弹窗经 `<teleport to="body">` 挂载，不受父级 `overflow: hidden` 影响。

### Props

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `modelValue` | `string` | `''` | 图片 URL，配合 `v-model` 使用 |
| `accept` | `string` | `'image/*'` | 透传给 `<input type="file">` 的 accept 属性 |

### Emits

| 事件 | 载荷 | 说明 |
|---|---|---|
| `update:modelValue` | `string` | OSS 上传成功后返回的图片 URL |
| `upload-start` | — | 开始上传时触发 |
| `upload-end` | — | 上传结束时触发（成功与失败均会触发） |
| `error` | `string` | 上传失败时触发，携带错误消息 |

### 默认插槽（scoped slot）

| Slot Prop | 类型 | 说明 |
|---|---|---|
| `open` | `() => void` | 调用后弹出底部来源选择弹窗 |
| `imageUrl` | `string` | 当前 `modelValue` 的透传，可直接用于渲染预览 |
| `uploading` | `boolean` | 上传进行中状态，可用于显示 loading |

### 示例

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

## 7. 游客登录与注册按钮

`src/components/GuestAuthActions.vue` 由 A/B 的 `HomeTopBar` 和 C 的 `ChannelCHeader` 共用，按 `gameStore.isRealUser` 显隐，通过 `requireRealUser(undefined, { mode })` 打开登录或注册模式。体验 token 不等于真实登录。

组件使用固定按钮高度、单行行高和独立文字容器居中。局部尺寸通过 `--guest-auth-button-height`、`--guest-auth-button-padding` 覆盖；C 版与搜索按钮同高。新增调用点直接复用组件，避免复制身份判断和按钮样式。


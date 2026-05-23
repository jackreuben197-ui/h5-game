<script setup lang="ts">
import { ref, provide, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import GameTableHeader from './GameTableHeader.vue'
import GameTableRow from './GameTableRow.vue'
import { TABLE_INJECT_KEY } from './types'
import type { ColumnConfig, SelectOption, SortOrder } from './types'

interface DefaultSort {
  prop: string
  order: SortOrder
}

const props = withDefaults(
  defineProps<{
    data: Record<string, any>[]
    showHeader?: boolean
    defaultSort?: DefaultSort
    /** 第一行汇总数据，按列对齐渲染，与 summary slot 二选一，slot 优先 */
    summaryData?: Record<string, any>
    /** 固定 body 高度，超出后滚动，如 '10rem' */
    height?: string
    /** v-model:loading，加载中时不触发新的 load 事件 */
    loading?: boolean
    /** 是否已全部加载完毕，true 时不再触发 load */
    finished?: boolean
    /** 是否禁用滚动加载 */
    disabled?: boolean
    /** 距底部多少 px 时触发 load，默认 50 */
    offset?: number
  }>(),
  {
    showHeader: true,
    defaultSort: undefined,
    summaryData: undefined,
    height: undefined,
    loading: false,
    finished: false,
    disabled: false,
    offset: 50,
  },
)

const emit = defineEmits<{
  sortChange: [col: ColumnConfig, order: SortOrder]
  selectChange: [col: ColumnConfig, option: SelectOption]
  rowClick: [row: Record<string, any>]
  /** 滚动到底部附近，通知父组件加载下一页 */
  load: []
  'update:loading': [value: boolean]
}>()

// ---- Column registration via provide/inject ----
const columns = ref<ColumnConfig[]>([])
const sortProp = ref(props.defaultSort?.prop ?? '')
const sortOrder = ref<SortOrder>(props.defaultSort?.order ?? '')

provide(TABLE_INJECT_KEY, {
  registerColumn(col: ColumnConfig) {
    const idx = columns.value.findIndex(c => c.prop === col.prop)
    if (idx >= 0) columns.value.splice(idx, 1, col)
    else columns.value.push(col)
  },
  unregisterColumn(prop: string) {
    const idx = columns.value.findIndex(c => c.prop === prop)
    if (idx >= 0) columns.value.splice(idx, 1)
  },
})

// ---- Sort ----
function handleSortClick(col: ColumnConfig) {
  if (sortProp.value !== col.prop) {
    sortProp.value = col.prop
    sortOrder.value = 'asc'
  } else if (sortOrder.value === 'asc') {
    sortOrder.value = 'desc'
  } else if (sortOrder.value === 'desc') {
    sortOrder.value = ''
    sortProp.value = ''
  } else {
    sortOrder.value = 'asc'
  }
  emit('sortChange', col, sortOrder.value)
}

function handleSelect(col: ColumnConfig, option: SelectOption) {
  emit('selectChange', col, option)
}

// ---- Scroll / infinite load ----
const bodyRef = ref<HTMLElement | null>(null)

const bodyStyle = computed(() => {
  if (!props.height) return {}
  return {
    height: props.height,
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  }
})

const isScrollable = computed(() => !!props.height)

function tryLoad() {
  if (!isScrollable.value) return
  if (props.loading || props.finished || props.disabled) return
  const el = bodyRef.value
  if (!el) return
  if (el.scrollHeight - el.scrollTop - el.clientHeight <= props.offset) {
    emit('update:loading', true)
    emit('load')
  }
}

// 数据更新后（新一页加入），再检查一次是否还需要继续加载
watch(() => props.data.length, () => nextTick(tryLoad))

// loading 变为 false 后再检查（防止内容不足一屏时需要连续加载）
watch(() => props.loading, (val) => { if (!val) nextTick(tryLoad) })

onMounted(() => bodyRef.value?.addEventListener('scroll', tryLoad, { passive: true }))
onUnmounted(() => bodyRef.value?.removeEventListener('scroll', tryLoad))
</script>

<script lang="ts">
export default { name: 'GameTable' }
</script>

<template>
  <div class="game-table">
    <GameTableHeader
      v-if="showHeader && columns.length"
      :columns="columns"
      :sort-prop="sortProp"
      :sort-order="sortOrder"
      @sort-click="handleSortClick"
      @select="handleSelect"
    />

    <div ref="bodyRef" class="game-table__body scrollbar-hide" :style="bodyStyle">
      <!-- 首行：自定义 summary slot 或 summaryData 汇总行 -->
      <template v-if="$slots.summary">
        <div class="game-table__summary">
          <slot name="summary" />
        </div>
      </template>
      <GameTableRow
        v-else-if="summaryData"
        :row="summaryData"
        :columns="columns"
        :is-summary="true"
      />

      <GameTableRow
        v-for="(row, i) in data"
        :key="i"
        :row="row"
        :columns="columns"
        @row-click="emit('rowClick', $event)"
      />

      <!-- 底部状态区 -->
      <div class="game-table__status">
        <slot v-if="loading" name="loading">
          <van-loading size="0.4rem" color="rgba(255,255,255,0.5)" />
        </slot>
        <slot v-else-if="finished && data.length" name="finished">
          <span class="game-table__finished-text">没有更多了</span>
        </slot>
      </div>
    </div>

    <!-- 隐藏 slot：GameTableColumn 在此注册自身 -->
    <div class="game-table__columns-slot">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.game-table {
  width: 100%;
  font-family: 'HONOR Sans CN', sans-serif;
}

.game-table__body {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  padding: 0 0.12rem;
}

/* 固定高度滚动时，避免 flex 子项被压缩导致行高变小 */
.game-table__body > * {
  flex-shrink: 0;
}

.game-table__summary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0.85rem;
  border-radius: 0.425rem;
  background: rgba(0, 0, 0, 0.2);
  overflow: hidden;
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.75);
  font-family: 'HONOR Sans CN', sans-serif;
}

.game-table__status {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.24rem 0;
  min-height: 0.64rem;
}

.game-table__finished-text {
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.4);
}

.game-table__columns-slot {
  display: none;
}
</style>

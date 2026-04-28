<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { ColumnConfig, SelectOption, SortOrder } from './types'

const props = defineProps<{
  columns: ColumnConfig[]
  sortProp: string
  sortOrder: SortOrder
}>()

const emit = defineEmits<{
  sortClick: [col: ColumnConfig]
  select: [col: ColumnConfig, option: SelectOption]
}>()

const openDropdown = ref<string | null>(null)

function handleCellClick(col: ColumnConfig, e: MouseEvent) {
  e.stopPropagation()
  if (col.select?.length) {
    openDropdown.value = openDropdown.value === col.prop ? null : col.prop
    return
  }
  if (col.sortable) {
    emit('sortClick', col)
  }
}

function handleSelectOption(col: ColumnConfig, option: SelectOption) {
  openDropdown.value = null
  emit('select', col, option)
}

function closeDropdown() {
  openDropdown.value = null
}

function colStyle(col: ColumnConfig): Record<string, string> {
  if (col.width) {
    return { width: col.width, flexShrink: '0', flexGrow: '0', flexBasis: col.width }
  }
  return { flex: String(col.flex) }
}

onMounted(() => document.addEventListener('click', closeDropdown))
onUnmounted(() => document.removeEventListener('click', closeDropdown))
</script>

<script lang="ts">
export default { name: 'GameTableHeader' }
</script>

<template>
  <div class="game-table__header">
    <div class="game-table__header-inner">
      <div
        v-for="col in columns"
        :key="col.prop"
        class="game-table__header-cell"
        :class="{
          'game-table__header-cell--sortable': col.sortable,
          'game-table__header-cell--active-asc': col.sortable && sortProp === col.prop && sortOrder === 'asc',
          'game-table__header-cell--active-desc': col.sortable && sortProp === col.prop && sortOrder === 'desc',
        }"
        :style="colStyle(col)"
        @click="handleCellClick(col, $event)"
      >
        <span class="game-table__header-label">{{ col.label }}</span>

        <!-- Sort icon (up/down pair) -->
        <span v-if="col.sortable" class="game-table__sort-wrap">
          <van-icon
            name="arrow-up"
            class="game-table__sort-icon"
            :class="{ 'game-table__sort-icon--active': sortProp === col.prop && sortOrder === 'asc' }"
          />
          <van-icon
            name="arrow-down"
            class="game-table__sort-icon"
            :class="{ 'game-table__sort-icon--active': sortProp === col.prop && sortOrder === 'desc' }"
          />
        </span>

        <!-- Select dropdown arrow -->
        <van-icon
          v-if="col.select?.length"
          name="arrow-down"
          class="game-table__select-arrow"
          :class="{ 'game-table__select-arrow--open': openDropdown === col.prop }"
        />

        <!-- Dropdown panel -->
        <Transition name="gt-dropdown">
          <div
            v-if="col.select?.length && openDropdown === col.prop"
            class="game-table__dropdown"
            @click.stop
          >
            <div
              v-for="option in col.select"
              :key="String(option.value)"
              class="game-table__dropdown-item"
              @click="handleSelectOption(col, option)"
            >
              {{ option.text }}
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ---- Outer container: white inner shadow ring (matches FilterTabbar--pill outer button) ----
.game-table__header {
  display: flex;       // flex 让内层可垂直居中，形成四边均匀的环形间距
  align-items: center;
  margin: 0 0.12rem 0.2rem;
  border-radius: 0.65rem;
  padding: 0.10rem 0.10rem;
  // border: 0.83px solid white;
  box-shadow:
    0 0 0.2rem 0.01rem rgba(0, 175, 131, 0.9) inset,
}

// ---- Inner container: green fill (matches FilterTabbar--pill .inner-content) ----
.game-table__header-inner {
  display: flex;
  flex: 1;           // 在父级 flex 里横向撑满
  min-width: 0;      // 防止 flex item 撑破父容器
  box-sizing: border-box;
  border-radius: 0.55rem;
  background: rgba(0, 175, 131, 0.9);
  box-shadow: 0 0 0.1rem 0.05rem rgba(0, 175, 131, 0.9);
  overflow: visible; // allow dropdowns to overflow
  font-family: 'HONOR Sans CN', sans-serif;
}

// ---- Column cell within header ----
.game-table__header-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0.72rem;
  padding: 0 0.2rem;
  gap: 0.1rem;
  cursor: default;

  &--sortable {
    cursor: pointer;
  }

  // Subtle divider between columns (skip first)
  & + & {
    // border-left: 1px solid rgba(255, 255, 255, 0.25);
  }
}

.game-table__header-label {
  font-size: 0.36rem;
  // font-weight: 700;
  color: #fff;
  white-space: nowrap;
  line-height: 1;
}

// ---- Sort icons (stacked up/down) ----
.game-table__sort-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  line-height: 1;
}

.game-table__sort-icon {
  font-size: 0.22rem;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1;

  &--active {
    color: #fff;
  }
}

// ---- Select dropdown arrow ----
.game-table__select-arrow {
  font-size: 0.28rem;
  color: rgba(255, 255, 255, 0.85);
  transition: transform 0.2s;

  &--open {
    transform: rotate(180deg);
  }
}

// ---- Dropdown panel ----
.game-table__dropdown {
  position: absolute;
  top: calc(100% + 0.12rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  min-width: 100%;
  border-radius: 0.24rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(0.16rem);
  -webkit-backdrop-filter: blur(0.16rem);
}

.game-table__dropdown-item {
  padding: 0.24rem 0.4rem;
  font-size: 0.36rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  text-align: center;
  cursor: pointer;
  font-family: 'HONOR Sans CN', sans-serif;
  transition: background 0.15s;

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

// ---- Dropdown transition ----
.gt-dropdown-enter-active,
.gt-dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.gt-dropdown-enter-from,
.gt-dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-0.08rem);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { showGameToast } from '@/components/Toast'

export interface FilterTabOption {
  name: string
  title: string
  disabled?: boolean
  disabledToast?: string
  [key: string]: unknown
}

/**
 * activeBg 激活背景风格：
 *   - 'pill'    (默认) Figma 绿色圆角胶囊，纯 CSS 实现
 *   - 'ghost'   白色半透明胶囊（浅色描边风格）
 *   - 'underline' 底部白色横线指示器
 */
export type FilterTabActiveBg = 'pill' | 'default'

interface Props {
  modelValue: string
  tabs: FilterTabOption[]
  activeBg?: FilterTabActiveBg
}

const props = withDefaults(defineProps<Props>(), {
  activeBg: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const wrapperClass = computed(() => [
  'filter-tabbar',
  `filter-tabbar--${props.activeBg}`,
])

function handleClick(name: string): void {
  const targetTab = props.tabs.find((tab) => tab.name === name)
  if (targetTab?.disabled) {
    if (typeof targetTab.disabledToast === 'string' && targetTab.disabledToast.trim()) {
      showGameToast(targetTab.disabledToast.trim())
    }
    return
  }

  if (name !== props.modelValue) {
    emit('update:modelValue', name)
  }
}
</script>

<script lang="ts">
export default { name: 'FilterTabbar' }
</script>

<template>
  <div :class="wrapperClass">
    <button
      v-for="(tab, index) in props.tabs"
      :key="tab.name"
      :class="[
        'filter-tab__item',
        {
          'filter-tab__item--active': tab.name === props.modelValue,
          'filter-tab__item--disabled': tab.disabled === true,
        },
      ]"
      type="button"
      :aria-disabled="tab.disabled === true"
      @click="handleClick(tab.name)"
    >
      <div class="inner-content">
        <slot
          name="tab"
          :tab="tab"
          :active="tab.name === props.modelValue"
          :index="index"
        >
          <span class="filter-tab__text">{{ tab.title }}</span>
        </slot>
      </div>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

/* ---- 容器：全宽，等分每个 tab ---- */
.filter-tabbar {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: 1.35rem;
  background: rgba($color: #FFFFFF, $alpha: 0.2);
  border-radius: 0.67rem;
  margin: 0.45rem;
  font-family:'HONOR Sans CN';

  @include theme-light {
    background: #e3e3e3;
  }
}

/* ---- 每个 tab 按钮：flex-1 等宽 ---- */
.filter-tab__item {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.35rem;
  border-radius: 1rem;
  border: none;
  background: none;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.18s, border-color 0.18s;
  position: relative;
  overflow: hidden;
}

.filter-tab__item--disabled {
  opacity: 0.56;
}

.filter-tab__text {
  font-size: 0.4rem;
  font-weight: 400;
  line-height: 1;
  color: rgba(255, 255, 255, 1);
  transition: color 0.18s;
  position: relative;
  z-index: 1;

  @include theme-light {
    color: #000;
  }
}
.filter-tab__item--active {
  background: rgba($color: #FFFFFF, $alpha: 0.17);
  border: 0.8px solid #ffffff;

  .filter-tab__text {
    font-weight: 700;
  }

  @include theme-light {
    background: var(--c-brand);
    border-color: #fff;

    .filter-tab__text {
      color: #fff;
    }
  }
}
/* ========================================
   风格一：pill（默认）—— Figma 绿色圆角胶囊
   ======================================== */
.filter-tabbar--pill .filter-tab__item--active {
  /* 覆盖通用激活态：pill 需要双环结构，不使用原白底。 */
  background: transparent;
  border: none;
  overflow: visible;
//   border: 0.8px solid #fff;
  box-shadow:
  0 0 0.1rem 0.05rem rgba(var(--c-brand-rgb), .9) inset,
    inset  1px  1px 0px  0px rgba(255, 255, 255, 0.85),
  inset  3px  3px 0px -2px rgba(255, 255, 255, 0.30),
    inset -1px -1px 0px  0px rgba(255, 255, 255, 0.85),
  inset -3px -3px 0px -2px rgba(255, 255, 255, 0.30);
.inner-content{
    width: 100%;
    height: 1rem;
    line-height: 1rem;
    border-radius: 0.65rem;
    // border: 1px solid red;
    background-color: rgba(var(--c-brand-rgb), .9);
    box-shadow: 0 0 0.1rem 0.05rem rgba(var(--c-brand-rgb), .9);
}
  .filter-tab__text {
    color: #fff;
    font-weight: 700;
    z-index: 3;
  }

  @include theme-light {
    box-shadow:
      0 0 0.1rem 0.05rem rgba(var(--c-brand-rgb), 0.9) inset,
      inset 1px 1px 0 0 rgba(255, 255, 255, 0.85),
      inset -1px -1px 0 0 rgba(255, 255, 255, 0.85);
  }
}
</style>

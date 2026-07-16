<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

interface Props {
  tabs: string[]
  modelValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const tabRefs = ref<Array<HTMLElement | null>>([])
const indicatorStyle = ref<{ width: string; transform: string; opacity: number }>({
  width: '0px',
  transform: 'translateX(0px)',
  opacity: 0,
})

function updateIndicator(): void {
  const el = tabRefs.value[props.modelValue]
  if (!el) return
  const bar = el.parentElement
  if (!bar) return
  const tabRect = el.getBoundingClientRect()
  const barRect = bar.getBoundingClientRect()
  indicatorStyle.value = {
    width: `${tabRect.width}px`,
    transform: `translateX(${tabRect.left - barRect.left}px)`,
    opacity: 1,
  }
}

function setTabRef(index: number, el: Element | null): void {
  tabRefs.value[index] = el as HTMLElement | null
}

onMounted(() => {
  void nextTick(updateIndicator)
})

watch(
  () => props.modelValue,
  () => {
    void nextTick(updateIndicator)
  },
)
</script>

<template>
  <div class="seg">
    <span
      class="seg__indicator"
      :style="indicatorStyle"
    ></span>
    <button
      v-for="(t, i) in tabs"
      :key="i"
      :ref="(el) => setTabRef(i, el as Element | null)"
      class="seg__tab"
      :class="{ 'seg__tab--active': modelValue === i }"
      @click="emit('update:modelValue', i)"
    >
      <span class="seg__label">{{ t }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.seg {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.98rem;
  padding: 0 0.59rem;
  height: 0.84rem;
}

.seg__indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 1.56px;
  background: #eaeaea;
  border-radius: 1px;
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s;
  pointer-events: none;

  @include theme-light {
    background: var(--c-brand);
  }
}

.seg__tab {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  height: 100%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.seg__label {
  font-family: var(--wallet-font-cn);
  font-size: 0.46rem;
  line-height: 0.95;
  color: #fff;
  font-weight: 500;
  opacity: 0.7;
  transition: opacity 0.25s ease;

  @include theme-light {
    color: #000;
  }
}

.seg__tab--active .seg__label {
  opacity: 1;
  font-weight: 700;

  @include theme-light {
    color: var(--c-brand);
  }
}
</style>

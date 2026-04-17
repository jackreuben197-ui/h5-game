<script setup lang="ts">
import { computed, getCurrentInstance, useSlots } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
})

const emit = defineEmits<{
  back: [event: MouseEvent]
}>()

const slots = useSlots()
const router = useRouter()
const instance = getCurrentInstance()

// 根据插槽自动判断 3 种模式：
// 1) 仅文字；2) 文字+右侧插槽；3) 全部自定义插槽。
const headerMode = computed<'title' | 'title-right' | 'full-slot'>(() => {
  if (slots.default) return 'full-slot'
  if (slots.right) return 'title-right'
  return 'title'
})

function handleBack(event: MouseEvent): void {
  // 若父组件有监听 @back，则交由父组件处理；否则默认执行路由返回。
  const vnodeProps = instance?.vnode.props ?? null
  const hasBackListener =
    !!vnodeProps &&
    Object.keys(vnodeProps).some((key) => key === 'onBack' || key.startsWith('onBackOnce'))

  if (hasBackListener) {
    emit('back', event)
    return
  }

  router.back()
}
</script>

<template>
  <div class="page-back-header">
    <button
      class="back-trigger"
      type="button"
      @click="handleBack"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="back-icon"
        viewBox="0 0 7 12"
        fill="none"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M6.31419 0.26268C6.66443 0.61292 6.66443 1.18077 6.31419 1.53101L2.16518 5.68002L6.31419 9.82903C6.66443 10.1793 6.66443 10.7471 6.31419 11.0974C5.96395 11.4476 5.39609 11.4476 5.04585 11.0974L0.26268 6.31419C-0.08756 5.96395 -0.08756 5.3961 0.26268 5.04586L5.04585 0.26268C5.39609 -0.08756 5.96395 -0.08756 6.31419 0.26268Z"
          fill="white"
        />
      </svg>
      <span
        v-if="headerMode !== 'full-slot' && props.title"
        class="title"
      >
        {{ props.title }}
      </span>
    </button>

    <div
      v-if="headerMode === 'full-slot'"
      class="full-slot-wrap"
    >
      <slot />
    </div>

    <div
      v-else-if="headerMode === 'title-right'"
      class="right-slot-wrap"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-back-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.26rem;
  position: relative;
  z-index: 1;
  min-height: 1.1733rem;
  padding: 0.5rem 0.44rem 0.2rem;
}

.back-trigger {
  min-width: 0;
  border: 0;
  color: #fff;
  background: transparent;
  display: inline-flex;
  align-items: center;
  padding:0 0.25rem;
  gap: 0.4rem;
}

.back-icon {
  font-size: 0.5rem;
  width: 0.18rem;
  height: 0.31rem;
  color: rgba(255, 255, 255, 0.95);
}

.title {
  font-size: 0.65rem;
  line-height: 120%;
  text-shadow: 0 0.22rem 0.5rem rgba(0, 0, 0, 0.35);
}

.right-slot-wrap {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
}

.full-slot-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
</style>

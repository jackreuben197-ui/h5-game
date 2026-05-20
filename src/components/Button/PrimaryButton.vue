<script setup lang="ts">
interface Props {
  text: string
  disabled?: boolean
  /** 是否显示内嵌高光边框阴影，默认 true */
  shadow?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  shadow: true,
  loading: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function handleClick(event: MouseEvent): void {
  if (props.disabled) return
  emit('click', event)
}
</script>

<template>
  <button
    :class="['primary-btn', { 'primary-btn--disabled': props.disabled, 'primary-btn--no-shadow': !props.shadow }]"
    type="button"
    :disabled="props.disabled"
    @click="handleClick"
  >
    <span v-if="props.loading" class="primary-btn__spinner"></span>
    <span class="primary-btn__text">{{ props.text }}</span>
  </button>
</template>

<style scoped lang="scss">
.primary-btn {
  width: 100%;
  height: 1.47rem;
  border: none;
  border-radius: 1.08rem;
  background: linear-gradient(157deg, #55F329 0%, #3EAD06 100%);
  color: #fff;
  font-size: 0.5rem;
  font-weight: 500;
  font-family: 'HONOR Sans CN', sans-serif;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 内嵌高光边框效果 */
  box-shadow:
    inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5);

  &.primary-btn--no-shadow {
    box-shadow: none;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.34px;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
      rgba(255, 255, 255, 0.5) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &:active:not(:disabled) {
    opacity: 0.92;
    transform: scale(0.985);
  }
}

.primary-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-btn__text {
  position: relative;
  z-index: 1;
}

.primary-btn__spinner {
  position: relative;
  z-index: 1;
  width: 0.48rem;
  height: 0.48rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  margin-right: 0.24rem;
  animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

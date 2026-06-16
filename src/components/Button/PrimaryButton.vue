<script setup lang="ts">
interface Props {
  text: string
  disabled?: boolean
  /** 是否显示内嵌高光边框阴影，默认 true */
  shadow?: boolean
  loading?: boolean
  /** 玻璃拟态风格（用于深色背景，如 MTT 详情页底部） */
  glass?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  shadow: true,
  loading: false,
  glass: false,
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
    :class="[
      'primary-btn',
      {
        'primary-btn--disabled': props.disabled,
        'primary-btn--no-shadow': !props.shadow,
        'primary-btn--glass': props.glass,
      },
    ]"
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
  background: linear-gradient(157deg, #55f329 0%, #3ead06 100%);
  color: #fff;
  font-size: 0.5rem;
  font-weight: 500;
  font-family: 'HONOR Sans CN', sans-serif;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;


  &:active:not(:disabled) {
    opacity: 0.92;
    transform: scale(0.985);
  }

  &.primary-btn--glass {
    background: linear-gradient(
      126.81deg,
      rgba(255, 255, 255, 0.1) 21.1%,
      rgba(230, 230, 230, 0.1) 71.4%
    );
    backdrop-filter: blur(0.0133rem);
    box-shadow: none;
    border-radius: 1.004rem;
    height: auto;
    padding: 0.4003rem 0;

    &::before {
      content: none;
    }

    .primary-btn__text {
      font-size: 0.4815rem;
      line-height: 1.2;
      color: #fbfbfb;
    }
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

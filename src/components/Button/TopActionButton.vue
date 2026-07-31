<script setup lang="ts">
interface Props {
  name: string
  icon?: string
  iconAlt?: string
  large?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 统一透传点击事件，业务层自行处理具体逻辑。
function handleClick(event: MouseEvent): void {
  emit('click', event)
}
</script>

<template>
  <button
    :class="['action-btn', { 'action-btn--with-icon': Boolean(props.icon || $slots.icon), 'action-btn--large': props.large }]"
    type="button"
    @click="handleClick"
  >
    <span class="action-label">
      {{ props.name }}
    </span>
    <slot name="icon">
      <img
        v-if="props.icon"
        class="action-icon"
        :src="props.icon"
        :alt="props.iconAlt || 'icon'"
      />
    </slot>
  </button>
</template>

<style scoped lang="scss">
.action-btn {
  display: flex;
  height: 21.909px;
  padding: 2.401px 8px;
  justify-content: center;
  align-items: center;
  gap: 6px;
  border-radius: 15.006px;
  background: #FFF;
  border: none;
  white-space: nowrap;
}

.action-label {
  color: rgba(0, 0, 0, 1);
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: "HONOR Sans CN";
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 10.084px */
}

.action-btn--large {
  height: 0.912rem;
  padding: 0.096rem 0.332rem;
  border-radius: 0.624rem;
  gap: 0.25rem;

  .action-label {
    font-size: 0.416rem;
  }

  .action-icon {
    width: 0.468rem;
    height: 0.468rem;
  }
}

.action-icon {
  width: 0.300rem;
  height: 0.300rem;
  object-fit: contain;
}
</style>

<style lang="scss">
:root[data-theme='light'] .action-btn {
  .action-icon {
    filter: invert(52%) sepia(68%) saturate(1758%) hue-rotate(131deg) brightness(95%) contrast(97%);
  }
}
</style>

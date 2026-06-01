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
    :class="['action-btn', { 'action-btn--with-icon': Boolean(props.icon), 'action-btn--large': props.large }]"
    type="button"
    @click="handleClick"
  >
    <span class="action-label">
      {{ props.name }}
    </span>
    <img
      v-if="props.icon"
      class="action-icon"
      :src="props.icon"
      :alt="props.iconAlt || 'icon'"
    />
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
  width: 2.19rem;
  height: 0.82rem;
  border-radius: 0.60rem;
  font-size: 0.315rem;
  padding: 0 0.21rem;

  .action-icon {
    width: 0.559rem;
    height: 0.512rem;
  }
}

.action-icon {
  width: 0.300rem;
  height: 0.300rem;
  object-fit: contain;
}
</style>

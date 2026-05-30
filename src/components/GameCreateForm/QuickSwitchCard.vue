<script setup lang="ts">
import { computed } from 'vue'
import FieldTip from './FieldTip.vue'

interface Props {
  label: string
  tip?: string
  modelValue: boolean | number
  disabled?: boolean
  activeValue?: boolean | number
  inactiveValue?: boolean | number
  /** 右上角装饰图标路径 */
  badge?: string
}

const props = withDefaults(defineProps<Props>(), {
  tip: '',
  disabled: false,
  activeValue: true,
  inactiveValue: false,
  badge: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | number]
  change: [value: boolean | number]
}>()

function onChange(value: boolean | number) {
  emit('update:modelValue', value)
  emit('change', value)
}

const isActive = computed(() => props.modelValue === props.activeValue)
</script>

<template>
  <div class="quick-switch-card">
    <img v-if="badge" :src="badge" class="quick-switch-card__badge" alt="" />
    <div class="quick-switch-card__head">
      <span class="quick-switch-card__label">{{ label }}</span>
      <FieldTip :tip="tip" />
    </div>
    <div class="quick-switch-card__foot">
      <span class="quick-switch-card__status">{{ isActive ? '已开启' : '未开启' }}</span>
      <VanSwitch
        :model-value="modelValue"
        :disabled="disabled"
        :active-value="activeValue"
        :inactive-value="inactiveValue"
        inactive-color="rgba(255, 255, 255, 0.17)"
        class="quick-switch-card__switch"
        @update:model-value="onChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-switch-card {
  position: relative;
  width: 100%;
  height: 1.82rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0.45rem;
  outline: 0.5px solid transparent;
  backdrop-filter: blur(12.16px);
  padding: 0.24rem 0.18rem 0.24rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.quick-switch-card__badge {
  position: absolute;
  right: 0rem;
  top: 0rem;
  width: auto;
  height: 0.8rem;
  margin-right: 0.1rem;
  margin-top: 0.1rem;
  object-fit: contain;
  pointer-events: none;
}

.quick-switch-card__head {
  display: flex;
  align-items: center;
  gap: 0.06rem;
}

.quick-switch-card__label {
  font-size: 0.32rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
  line-height: 1.4;
}

.quick-switch-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-switch-card__status {
  font-size: 0.24rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 600;
  color: #fff;
  line-height: 1;
}

.quick-switch-card__switch {
  scale: 1.3;
  margin-right: 0.2rem;
  --van-switch-size: 0.48rem;
  --van-switch-width: 0.9rem;
  --van-switch-height: 0.44rem;
  --van-switch-node-size: 0.36rem;
  --van-switch-on-background: #78E490;
  --van-switch-off-background: rgba(255, 255, 255, 0.3);

  :deep(.van-switch__node) {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
}
</style>

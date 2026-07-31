<script setup lang="ts">
import { computed } from 'vue'
import FieldTip from './FieldTip.vue'
import { t } from '@/i18n'

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
      <span class="quick-switch-card__status">{{ isActive ? t('6digit_password_opened') : t('UIMine_AccountNotOpen') }}</span>
      <VanSwitch
        :model-value="modelValue"
        :disabled="disabled"
        :active-value="activeValue"
        :inactive-value="inactiveValue"
        class="quick-switch-card__switch"
        @update:model-value="onChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

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

  @include theme-light {
    background: rgba(134, 134, 134, 0.14);
    backdrop-filter: none;
  }
}

.quick-switch-card__badge {
  position: absolute;
  right: 0rem;
  top: 0rem;
  width: 0.84rem;
  height: 0.9rem;
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

  @include theme-light {
    color: var(--c-text);
  }
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

  @include theme-light {
    color: var(--c-text);
  }
}

.quick-switch-card__switch {
  scale: 1.3;
  margin-right: 0.2rem;
  --van-switch-size: 0.48rem;
  --van-switch-width: 0.9rem;
  --van-switch-height: 0.44rem;
  --van-switch-node-size: 0.36rem;
  --van-switch-on-background: var(--c-brand);
  --van-switch-off-background: rgba(255, 255, 255, 0.3);

  @include theme-light {
    --van-switch-off-background: rgba(134, 134, 134, 0.34);
  }

  :deep(.van-switch__node) {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
}
</style>

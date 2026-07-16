<script setup lang="ts">
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { useTheme } from '@/composables/useTheme'

interface Props {
  tip?: string
}

withDefaults(defineProps<Props>(), {
  tip: '',
})

const { isDark } = useTheme()
</script>

<template>
  <VanPopover
    v-if="tip"
    class="field-tip-popover"
    trigger="click"
    placement="top-start"
    :theme="isDark ? 'dark' : 'light'"
  >
    <template #reference>
      <AppSvgIcon class="field-tip-trigger" name="info" title="tip" />
    </template>
    <div class="field-tip-content">{{ tip }}</div>
  </VanPopover>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.field-tip-popover {
  display: inline-flex;
  align-items: center;
  line-height: 0;
}

.field-tip-trigger {
  display: block;
  width: 0.35rem;
  height: 0.35rem;
  margin: 0;
  flex-shrink: 0;
  vertical-align: middle;
  cursor: pointer;
  color: #fff;

  @include theme-light {
    color: rgba(0, 0, 0, 0.5);
  }
}

.field-tip-content {
  max-width: 80vw;
  font-size: 0.28rem;
  padding:0.2rem 0.2rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.van-popup{
  transform: translateX(-0.4rem);
}
</style>

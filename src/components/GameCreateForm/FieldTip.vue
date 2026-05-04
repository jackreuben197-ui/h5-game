<script setup lang="ts">
import icTip from '@/assets/icons/ic_tip.svg'

interface Props {
  tip?: string
}

withDefaults(defineProps<Props>(), {
  tip: '',
})
</script>

<template>
  <VanPopover
    v-if="tip"
    class="field-tip-popover"
    trigger="click"
    placement="top-start"
    theme="dark"
  >
    <template #reference>
      <img
        class="field-tip-trigger"
        :src="icTip"
        alt="tip"
      />
    </template>
    <div class="field-tip-content">{{ tip }}</div>
  </VanPopover>
</template>

<style scoped lang="scss">
.field-tip-trigger {
  width: 0.35rem;
  height: 0.35rem;
  margin-top: 0.15rem;
  cursor: pointer;
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

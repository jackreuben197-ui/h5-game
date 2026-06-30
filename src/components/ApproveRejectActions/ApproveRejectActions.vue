<script setup lang="ts">
import { computed } from 'vue'
import { getLocale } from '@/i18n'

const props = withDefaults(
  defineProps<{
    approveText?: string
    rejectText?: string
  }>(),
  {
    approveText: '',
    rejectText: '',
  },
)

defineEmits<{
  approve: []
  reject: []
}>()

const approveLabel = computed(
  () => props.approveText || (getLocale() === 'en' ? 'Approve' : '同意'),
)
const rejectLabel = computed(() => props.rejectText || (getLocale() === 'en' ? 'Reject' : '拒绝'))
</script>

<template>
  <div class="approve-reject">
    <button class="ar-btn" type="button" @click="$emit('approve')">
      <span class="ar-icon ar-icon--approve">✓</span>
      <span class="ar-label">{{ approveLabel }}</span>
    </button>
    <button class="ar-btn" type="button" @click="$emit('reject')">
      <span class="ar-icon ar-icon--reject">✕</span>
      <span class="ar-label">{{ rejectLabel }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.approve-reject {
  display: flex;
  gap: 0.32rem;
  width: 100%;
}

.ar-btn {
  position: relative;
  flex: 1 0 0;
  min-width: 0;
  height: 1.47rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.04);
  border-radius: 1.08rem;
  padding: 0.13rem 0.19rem;
  display: flex;
  align-items: center;
  gap: 0.17rem;
  overflow: hidden;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
}

.ar-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(230, 230, 230, 0.137);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  pointer-events: none;
  z-index: 0;
}

.ar-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.0255rem;
  background: linear-gradient(
    180deg,
    rgba(242, 242, 242, 0.4) 0%,
    rgba(255, 255, 255, 0) 50%,
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
  z-index: 1;
}

.ar-icon {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  width: 1.02rem;
  height: 1.02rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.42rem;
  line-height: 1;
}

.ar-icon--approve {
  background-image: linear-gradient(180deg, #78e490 0%, #6cd283 100%);
}

.ar-icon--reject {
  background-image: linear-gradient(180deg, #fa2b4b 0%, #df2340 100%);
}

.ar-label {
  position: relative;
  z-index: 2;
  flex: 1 0 0;
  min-width: 0;
  text-align: center;
  color: #fff;
  font-size: 0.42rem;
  line-height: 1.2;
}
</style>

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
      class="action-icon action-icon--dark"
      :src="props.icon"
      :alt="props.iconAlt || 'icon'"
    />
    <span
      v-if="props.icon"
      class="action-icon action-icon--light"
      :style="{ '--action-icon-url': `url(${props.icon})` }"
      aria-hidden="true"
    ></span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.action-btn {
  width: 1.5644rem;
  height: 0.5856rem;
  padding: 0 0.15rem;
  border-radius: 0.4267rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(0.35rem) saturate(1.02);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.225rem;
  border: none;
  line-height: 0.2rem;
  box-shadow:
  /* 左上高光 */
  inset  1px  1px 0px  0px rgba(255, 255, 255, 0.85),
  inset  3px  3px 0px -2px rgba(255, 255, 255, 0.30),
  /* 右下高光 */
  inset -1px -1px 0px  0px rgba(255, 255, 255, 0.85),
  inset -3px -3px 0px -2px rgba(255, 255, 255, 0.30),
  /* 左下暗部 */
  inset  1px -1px 0px  0px rgba(200, 157, 149, 1),
  inset  3px -3px 0px -2px rgba(200, 157, 149, 1),
  /* 右上暗部 */
  inset -1px  1px 0px  0px rgba(200, 157, 149, 1),
  inset -3px  3px 0px -2px rgba(200, 157, 149, 1),
  /* 整体内阴影 */
  inset  0    0   2px      rgba(0, 0, 0, 0.80);

  @include theme-light {
    color: #000;
    background: #fff;
    backdrop-filter: none;
    box-shadow: none;
  }
}

.action-btn--with-icon {
  justify-content: space-between;
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
  width: 0.399rem;
  height: 0.366rem;
  flex-shrink: 0;
  object-fit: contain;
}

.action-icon--light {
  display: none;

  @include theme-light {
    display: block;
    background: var(--c-brand);
    -webkit-mask: var(--action-icon-url) center / contain no-repeat;
    mask: var(--action-icon-url) center / contain no-repeat;
  }
}

.action-icon--dark {
  @include theme-light {
    display: none;
  }
}
</style>

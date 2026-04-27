<script setup lang="ts">
import { useAttrs } from 'vue'
import toastBg from '@/assets/images/component_dialog_bg.png'

defineOptions({ name: 'GameToast', inheritAttrs: false })
const attrs = useAttrs()

withDefaults(
  defineProps<{
    /** v-model:show */
    show: boolean
    message?: string | number
    /** 显示时长(ms)，0 表示不自动关闭 */
    duration?: number
    /** 是否显示遮罩 */
    overlay?: boolean
    /** 点击时关闭 */
    closeOnClick?: boolean
    /** 点击遮罩关闭 */
    closeOnClickOverlay?: boolean
    /** 是否禁止背景点击 */
    forbidClick?: boolean
    /** 展示位置 */
    position?: 'top' | 'middle' | 'bottom'
  }>(),
  {
    duration: 2000,
    overlay: false,
    closeOnClick: false,
    closeOnClickOverlay: false,
    forbidClick: false,
    position: 'middle',
  },
)

const emit = defineEmits<{
  'update:show': [value: boolean]
  close: []
}>()
</script>

<template>
  <van-toast
    :show="show"
    :duration="duration"
    :overlay="overlay"
    :overlay-style="{ backgroundColor: 'rgba(12, 12, 12, 0.6)' }"
    :close-on-click="closeOnClick"
    :close-on-click-overlay="closeOnClickOverlay"
    :forbid-click="forbidClick"
    :position="position"
    class="game-toast"
    v-bind="attrs"
    @update:show="emit('update:show', $event)"
    @close="emit('close')"
  >
    <template #default>
      <div class="game-toast__card" :style="{ backgroundImage: `url(${toastBg})` }">
        <slot>
          <span class="game-toast__message">{{ message }}</span>
        </slot>
      </div>
    </template>
  </van-toast>
</template>

<style lang="scss">
/* 清除 van-toast 自身的视觉样式，由 game-toast__card 完全接管 */
.game-toast.van-toast {
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  min-width: unset !important;
  max-width: unset !important;
  width: 8.45rem !important;
  box-shadow: none !important;

  .van-toast__text,
  .van-toast__icon {
    display: none !important;
  }
}
</style>

<style scoped lang="scss">
.game-toast__card {
  width: 8.45rem;
  min-height: 1.6rem;
  border-radius: 0.9rem;
  overflow: hidden;
  background-size: 100% auto;
  background-position: top center;
  background-repeat: no-repeat;
  box-shadow:
    inset 2.12px 4.24px 17.23px rgba(242, 242, 242, 0.9),
    inset  0.5px  0.5px 0px  0px rgba(255, 255, 255, 0.85),
    inset  2px    2px   0px -2px rgba(255, 255, 255, 0.30),
    inset -0.5px -0.5px 0px  0px rgba(255, 255, 255, 0.85),
    inset -2px   -2px   0px -2px rgba(255, 255, 255, 0.30);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 0.4rem;
  box-sizing: border-box;
}

.game-toast__message {
  font-size: 0.43rem;
  font-weight: 400;
  color: #fff;
  text-align: center;
  line-height: 1.5;
  font-family: 'HONOR Sans CN', sans-serif;
  word-break: break-word;
}
</style>

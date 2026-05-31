<script setup lang="ts">
import { useAttrs } from 'vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import dialogBg from '@/assets/images/component_dialog_bg.png'
import { t } from '@/i18n'

/**
 * 二次封装 van-dialog，UI 定制版：
 * - 背景图：component_dialog_bg.png，按内容高度裁切（top 对齐，不拉伸）
 * - 内阴影：x2.12 y4.24 blur17.23 rgba(242,242,242,0.9)
 * - 确认按钮：PrimaryButton；取消按钮：黑色半透明 + blur
 * - 字体全白，按钮无分割线
 */

// 透传所有未声明的 attrs/listeners 给 van-dialog
defineOptions({ name: 'GameDialog', inheritAttrs: false })
const attrs = useAttrs()

withDefaults(
  defineProps<{
    /** v-model:show */
    show: boolean
    title?: string
    message?: string
    /** 是否显示取消按钮 */
    showCancelButton?: boolean
    showConfirmButton?: boolean
    cancelButtonText?: string
    confirmButtonText?: string
    confirmButtonDisabled?: boolean
    /** 关闭前回调，return false 阻止关闭 */
    beforeClose?: (action: string) => boolean | Promise<boolean>
  }>(),
  {
    showCancelButton: false,
    showConfirmButton: true,
    cancelButtonText: t('adaptation10013'),
    confirmButtonText: t('adaptation10012'),
    confirmButtonDisabled: false,
  },
)

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: []
  cancel: []
  close: []
}>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>

<template>
  <!--
    使用 van-dialog 的底层弹出层能力（overlay、teleport、lockScroll 等），
    但完全自定义 default slot 内容，替换其内部 UI。
    所有透传属性走 v-bind="attrs"。
  -->
  <van-dialog
    :show="show"
    :show-confirm-button="false"
    :show-cancel-button="false"
    :before-close="beforeClose"
    :overlay-style="{ backgroundColor: 'rgba(12, 12, 12, 0.6)' }"
    class="game-dialog"
    v-bind="attrs"
    @update:show="emit('update:show', $event)"
    @close="emit('close')"
  >
    <!-- 完全自定义 dialog 内部内容 -->
    <template #default>
      <div class="game-dialog__card">
        <!-- Background Overlay Layers matching Figma -->
        <div class="game-dialog__card-bg-gradient"></div>
        <div
          class="game-dialog__card-bg-texture"
          :style="{ backgroundImage: `url(${dialogBg})` }"
        ></div>
        <div class="game-dialog__card-bg-shadow"></div>

        <!-- Title -->
        <div v-if="title || $slots.title" class="game-dialog__title">
          <slot name="title">{{ title }}</slot>
        </div>

        <!-- Message / body -->
        <div v-if="message || $slots.default" class="game-dialog__body">
          <slot>
            <span class="game-dialog__message">{{ message }}</span>
          </slot>
        </div>

        <!-- Footer buttons -->
        <div class="game-dialog__footer">
          <button
            v-if="showCancelButton"
            class="game-dialog__cancel-btn"
            type="button"
            @click="onCancel"
          >
            {{ cancelButtonText }}
          </button>

          <PrimaryButton
            v-if="showConfirmButton"
            class="game-dialog__confirm-btn"
            style="height: 1.43rem; font-size: 0.42rem"
            :shadow="false"
            :text="confirmButtonText"
            :disabled="confirmButtonDisabled"
            @click="onConfirm"
          />
        </div>
      </div>
    </template>
  </van-dialog>
</template>

<style lang="scss">
/* 覆盖 van-dialog 本体的背景 / 圆角 / padding，让我们的 card 完全接管 */
.game-dialog.van-dialog {
  background: transparent !important;
  border-radius: 0 !important;
  padding: 0 !important;
  overflow: visible !important;
  width: 9rem;

  .van-dialog__content {
    padding: 0 !important;
  }
}
</style>

<style scoped lang="scss">
.game-dialog__card {
  position: relative;
  min-height: 2rem;
  border-radius: 0.485rem;
  border: 0.956px solid rgba(242, 242, 242, 0.4);
  box-shadow: 3.446px 4.308px 6.893px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  box-sizing: border-box;
  gap: 0.32rem;
}

.game-dialog__card-bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: linear-gradient(
    102.679deg,
    rgba(142, 142, 142, 0.3) 2.93%,
    rgba(103, 103, 103, 0.4) 43.62%,
    rgba(73, 73, 73, 0.5) 89.79%
  );
  mix-blend-mode: hard-light;
  z-index: 0;
  pointer-events: none;
}

.game-dialog__card-bg-texture {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-size: 100% auto;
  background-position: center center;
  background-repeat: no-repeat;
  filter: blur(10px) brightness(0.6);
  transform: scale(1.05);
  z-index: 0;
  pointer-events: none;
}

.game-dialog__title {
  position: relative;
  z-index: 1;
  font-size: 0.58rem;
  font-weight: 500;
  color: #f9f9f9;
  text-align: center;
  line-height: 1.3;
  font-family: 'HONOR Sans CN', sans-serif;
}

.game-dialog__body {
  position: relative;
  z-index: 1;
  flex: 1;
  max-height: 12rem;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  font-size: 0.42rem;
  color: #fff;
  text-align: center;
  line-height: 1.6;
  font-family: 'HONOR Sans CN', sans-serif;

  &::-webkit-scrollbar {
    display: none;
  }
}

.game-dialog__message {
  display: block;
}

.game-dialog__footer {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.24rem;
}

.game-dialog__cancel-btn {
  flex: 1;
  height: 1.43rem;
  border: none;
  border-radius: 0.825rem;
  background: rgba(146, 146, 146, 0.4);
  backdrop-filter: blur(2.667rem);
  -webkit-backdrop-filter: blur(2.667rem);
  color: #f9f9f9;
  font-size: 0.439rem;
  font-weight: 500;
  font-family: 'PingFang SC', 'HONOR Sans CN', sans-serif;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.34px;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
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
  }

  &:active {
    opacity: 0.8;
  }
}

// 确认按钮：占满剩余空间
.game-dialog__confirm-btn {
  flex: 1;
}
</style>

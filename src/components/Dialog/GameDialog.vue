<script setup lang="ts">
import {
  Comment,
  Fragment,
  Text,
  computed,
  useAttrs,
  useSlots,
  type StyleValue,
  type VNode,
} from 'vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import dialogBg from '@/assets/images/component_dialog_bg.png'
import icModalClose from '@/assets/icons/modal_close.svg'
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
const slots = useSlots()

const props = withDefaults(
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
    showFooter?: boolean
    /** 是否显示卡片 box-shadow（含面板模式 ::after 的内阴影），默认 true */
    showBoxShawdow?: boolean
    dialogWidth?: string
    cardMinHeight?: string
    bodyMaxHeight?: string
    cardStyle?: StyleValue
    bodyStyle?: StyleValue
    bgImage?: string
    /** 卡片底色加深（仅用于个别需要高对比可读性的弹窗，如 MTT 报名） */
    darkBackdrop?: boolean
    /** 是否显示右上角关闭按钮 */
    showCloseButton?: boolean
    /** 关闭前回调，return false 阻止关闭 */
    beforeClose?: (action: string) => boolean | Promise<boolean>
  }>(),
  {
    title: '',
    message: '',
    showCancelButton: false,
    showConfirmButton: true,
    cancelButtonText: t('adaptation10013'),
    confirmButtonText: t('adaptation10012'),
    confirmButtonDisabled: false,
    showFooter: true,
    showBoxShawdow: true,
    dialogWidth: '9rem',
    cardMinHeight: '2rem',
    bodyMaxHeight: '12rem',
    cardStyle: undefined,
    bodyStyle: undefined,
    bgImage: undefined,
    darkBackdrop: false,
    showCloseButton: false,
    beforeClose: undefined,
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

async function onCloseButton() {
  if (props.beforeClose) {
    const allow = await props.beforeClose('close')
    if (allow === false) {
      return
    }
  }
  emit('update:show', false)
  emit('close')
}

function hasRenderableContent(nodes: VNode[] | undefined): boolean {
  if (!nodes || nodes.length === 0) {
    return false
  }

  return nodes.some((node) => {
    if (node.type === Comment) {
      return false
    }

    if (node.type === Text) {
      return String(node.children ?? '').trim().length > 0
    }

    if (node.type === Fragment) {
      return Array.isArray(node.children) && hasRenderableContent(node.children as VNode[])
    }

    return true
  })
}

const hasTitleSlotContent = computed(() => hasRenderableContent(slots.title?.()))
const hasDefaultSlotContent = computed(() => hasRenderableContent(slots.default?.()))
const hasFooterSlotContent = computed(() => hasRenderableContent(slots.footer?.()))

const dialogStyle = computed<StyleValue>(() => ({
  '--game-dialog-width': props.dialogWidth,
}))

const cardStyles = computed<StyleValue>(() => [
  {
    backgroundImage: `url(${props.bgImage ?? dialogBg})`,
    '--game-dialog-card-min-height': props.cardMinHeight,
  },
  props.cardStyle,
])

const bodyStyles = computed<StyleValue>(() => [
  {
    '--game-dialog-body-max-height': props.bodyMaxHeight,
  },
  props.bodyStyle,
])
</script>

<template>
  <!--
    使用 van-dialog 的底层弹出层能力（overlay、teleport、lockScroll 等），
    但完全自定义 default slot 内容，替换其内部 UI。
    所有透传属性走 v-bind="attrs"。
  -->
  <van-dialog
    data-app-overlay
    :show="show"
    :show-confirm-button="false"
    :show-cancel-button="false"
    :before-close="beforeClose"
    :overlay-style="{ backgroundColor: 'rgba(12, 12, 12, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }"
    class="game-dialog"
    :style="dialogStyle"
    v-bind="attrs"
    @update:show="emit('update:show', $event)"
    @close="emit('close')"
  >
    <!-- 完全自定义 dialog 内部内容 -->
    <template #default>
      <div class="game-dialog__card" :class="{ 'game-dialog__card--dark': darkBackdrop }">
        <!-- Background Overlay Layers matching Figma -->
        <div class="game-dialog__card-bg-gradient"></div>
        <div
          class="game-dialog__card-bg-texture"
          :style="{ backgroundImage: `url(${props.bgImage ?? dialogBg})` }"
        ></div>
        <div class="game-dialog__card-bg-shadow"></div>

        <!-- Close button -->
        <button
          v-if="showCloseButton || $slots.close"
          class="game-dialog__close-btn"
          type="button"
          aria-label="Close"
          @click="onCloseButton"
        >
          <slot name="close">
            <img :src="icModalClose" alt="" />
          </slot>
        </button>

        <!-- Title -->
        <div v-if="title || hasTitleSlotContent" class="game-dialog__title">
          <slot name="title">{{ title }}</slot>
        </div>

        <!-- Message / body -->
        <div v-if="message || hasDefaultSlotContent" class="game-dialog__body" :style="bodyStyles">
          <slot>
            <span class="game-dialog__message">{{ message }}</span>
          </slot>
        </div>

        <!-- Footer buttons -->
        <div
          v-if="showFooter && (showCancelButton || showConfirmButton || hasFooterSlotContent)"
          class="game-dialog__footer"
        >
          <slot name="footer"></slot>

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
            glass
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
  width: var(--game-dialog-width, 9rem);

  .van-dialog__content {
    padding: 0 !important;
  }
}
</style>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.game-dialog__card {
  position: relative;
  min-height: 2rem;
  border-radius: 0.485rem;
  border: 0.956px solid rgba(242, 242, 242, 0.04);
  box-shadow: 3.446px 4.308px 6.893px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  background-size: 100% auto;
  background-position: top center;
  background-repeat: no-repeat;
  box-shadow:
    inset 2.12px 4.24px 17.23px rgba(242, 242, 242, 0.1),
    /* 左上高光 */ inset 0.5px 0.5px 0px 0px rgba(255, 255, 255, 0.45),
    inset 2px 2px 0px -2px rgba(255, 255, 255, 0.3),
    /* 右下高光 */ inset -0.5px -0.5px 0px 0px rgba(255, 255, 255, 0.45),
    inset -2px -2px 0px -2px rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  box-sizing: border-box;
  gap: 0.32rem;

  @include theme-light-own {
    @include light-panel($radius: 0.485rem);
    background-image: none !important;
  }
}

.game-dialog__card-bg-gradient,
.game-dialog__card-bg-shadow {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: none !important;
  backdrop-filter: blur(0.18rem);
  -webkit-backdrop-filter: blur(0.18rem);
  pointer-events: none;

  @include theme-light-own {
    display: none !important;
  }
}

.game-dialog__card-bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: linear-gradient(
    102.679deg,
    rgba(142, 142, 142, 0.1) 2.93%,
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
  background: rgba(8, 8, 8, 0.25);
  box-shadow:
    inset 2.12px 4.24px 17.23px rgba(242, 242, 242, 0.9),
    inset 0.5px 0.5px 0 0 rgba(255, 255, 255, 0.85),
    inset 2px 2px 0 -2px rgba(255, 255, 255, 0.3),
    inset -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.85),
    inset -2px -2px 0 -2px rgba(255, 255, 255, 0.3);
  pointer-events: none;

  @include theme-light-own {
    display: none !important;
  }
}

.game-dialog__close-btn {
  position: absolute;
  top: 0.15rem;
  right: 0.15rem;
  z-index: 20;
  width: 1.2rem;
  height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  img {
    width: 0.7rem;
    height: 0.7rem;
    pointer-events: none;
    user-select: none;
    display: block;
  }

  &:hover {
    opacity: 0.85;
  }

  &:active {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

.game-dialog__title {
  position: relative;
  z-index: 2;
  font-size: 0.58rem;
  font-weight: 500;
  color: #f9f9f9;
  text-align: center;
  line-height: 1.3;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light-own {
    color: #ffffff !important;
  }
}

.game-dialog__body {
  position: relative;
  z-index: 1;
  flex: 1;
  max-height: var(--game-dialog-body-max-height, 12rem);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  font-size: 0.42rem;
  color: #fff;
  text-align: center;
  line-height: 1.6;
  font-family: 'HONOR Sans CN', sans-serif;

  @include theme-light-own {
    color: #ffffff !important;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}

.game-panel-dialog .game-dialog__body {
  max-height: none;
}

.game-panel-dialog .game-dialog__card {
  background-image: none !important;
  background-color: transparent;
}

.game-panel-dialog .game-dialog__card-bg-texture {
  background-image: none !important;
}

.game-dialog__message {
  display: block;

  @include theme-light-own {
    color: #ffffff !important;
  }
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

.game-dialog__confirm-btn {
  flex: 1 0 0;
  height: 1.43rem !important;
  border-radius: 0.825rem !important;
  padding: 0 !important;
  background: var(--c-brand, #05c297) !important;
  border: none !important;

  :deep(.primary-btn__text) {
    color: #ffffff !important;
    font-size: 0.439rem !important;
  }
}
</style>

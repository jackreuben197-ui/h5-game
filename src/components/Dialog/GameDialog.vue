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
import tableBg from '@/assets/images/table_bg.webp'
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
    dialogWidth?: string
    cardMinHeight?: string
    bodyMaxHeight?: string
    cardStyle?: StyleValue
    bodyStyle?: StyleValue
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
    dialogWidth: '9rem',
    cardMinHeight: '2rem',
    bodyMaxHeight: '12rem',
    cardStyle: undefined,
    bodyStyle: undefined,
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
    backgroundImage: `url(${dialogBg})`,
    '--game-dialog-table-bg': `url(${tableBg})`,
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
    :show="show"
    :show-confirm-button="false"
    :show-cancel-button="false"
    :before-close="beforeClose"
    :overlay-style="{ backgroundColor: 'rgba(12, 12, 12, 0.6)' }"
    class="game-dialog"
    :style="dialogStyle"
    v-bind="attrs"
    @update:show="emit('update:show', $event)"
    @close="emit('close')"
  >
    <!-- 完全自定义 dialog 内部内容 -->
    <template #default>
      <div class="game-dialog__card" :style="cardStyles">
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
  width: var(--game-dialog-width, 9rem);

  .van-dialog__content {
    padding: 0 !important;
  }
}
</style>

<style scoped lang="scss">
.game-dialog__card {
  position: relative;
  isolation: isolate;
  min-height: var(--game-dialog-card-min-height, 2rem);
  border-radius: 0.97rem;
  overflow: hidden;
  background-size: 100% auto;
  background-position: top center;
  background-repeat: no-repeat;
  box-shadow:
    inset 2.12px 4.24px 17.23px rgba(242, 242, 242, 0.9),
    /* 左上高光 */ inset 0.5px 0.5px 0px 0px rgba(255, 255, 255, 0.85),
    inset 2px 2px 0px -2px rgba(255, 255, 255, 0.3),
    /* 右下高光 */ inset -0.5px -0.5px 0px 0px rgba(255, 255, 255, 0.85),
    inset -2px -2px 0px -2px rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  box-sizing: border-box;
  gap: 0.32rem;
}

.game-dialog__card > * {
  position: relative;
  z-index: 2;
}

.game-panel-dialog .game-dialog__card {
  background-color: transparent;
}

.game-panel-dialog .game-dialog__card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: var(--game-dialog-table-bg);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(14px) brightness(0.8);
  transform: scale(1.08);
  opacity: 0.85;
  pointer-events: none;
}

.game-panel-dialog .game-dialog__card::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  background: rgba(8, 8, 8, 0.25);
  box-shadow:
    inset 2.12px 4.24px 17.23px rgba(242, 242, 242, 0.9),
    inset 0.5px 0.5px 0 0 rgba(255, 255, 255, 0.85),
    inset 2px 2px 0 -2px rgba(255, 255, 255, 0.3),
    inset -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.85),
    inset -2px -2px 0 -2px rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.game-dialog__title {
  font-size: 0.58rem;
  font-weight: 500;
  color: #f9f9f9;
  text-align: center;
  line-height: 1.3;
  font-family: 'HONOR Sans CN', sans-serif;
}

.game-dialog__body {
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

  &::-webkit-scrollbar {
    display: none;
  }
}

.game-panel-dialog .game-dialog__body {
  max-height: none;
}

.game-panel-dialog--h5-bg .game-dialog__card {
  background-image: none !important;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
  overflow: visible;
}

.game-panel-dialog--h5-bg .game-dialog__body {
  max-height: none;
}

.game-dialog__message {
  display: block;
}

.game-dialog__footer {
  display: flex;
  gap: 0.24rem;
  // 无分割线，独立按钮并排
}

// 取消按钮：黑色30%透明 + blur
.game-dialog__cancel-btn {
  flex: 1;
  height: 1.43rem;
  border: none;
  border-radius: 1.08rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(0.05rem);
  -webkit-backdrop-filter: blur(0.05rem);
  color: #fff;
  font-size: 0.42rem;
  font-weight: 500;
  font-family: 'HONOR Sans CN', sans-serif;
  cursor: pointer;

  &:active {
    opacity: 0.8;
  }
}

// 确认按钮：占满剩余空间
.game-dialog__confirm-btn {
  flex: 1;
}
</style>

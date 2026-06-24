<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast, showToast } from 'vant'
import { t } from '@/i18n'
import {
  canPromptInstall,
  isIosSafari,
  isStandaloneDisplay,
  showAddToHomeScreenPrompt,
} from '@/utils/environment'

const props = defineProps<{
  panelProps?: Record<string, unknown>
  emitPanelEvent: (event: string, payload?: unknown) => void
  closePanel: (reason?: string, payload?: unknown) => void
}>()

// ==================== 类型定义（对齐 /api/misc/h5/display 返回结构） ====================
interface DownloadAppData {
  id?: number
  name?: string
  icon_url?: string
  title?: string
  download_url?: string
  status?: number
  publish_time?: string
}

interface PopupNoticeItem {
  id?: number
  title: string
  content: string
  weight?: number
  status?: number
  publish_time?: string
}

interface FindUsData {
  id?: number
  title?: string
  content?: string
  link_list?: string[]
  status?: number
  publish_time?: string
}

interface NotificationPanelData {
  download_app?: DownloadAppData
  popup_notices?: PopupNoticeItem[]
  find_us?: FindUsData
}

// ==================== 工具函数 ====================
function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw)
}

function isPopupNoticeItem(raw: unknown): raw is PopupNoticeItem {
  if (!isRecord(raw)) return false
  return typeof raw.title === 'string' && typeof raw.content === 'string'
}

// ==================== 解析外部传入的数据 ====================
const resolvedData = computed<NotificationPanelData>(() => {
  const raw = props.panelProps
  if (!isRecord(raw)) return {}
  return {
    download_app: isRecord(raw.download_app) ? (raw.download_app as DownloadAppData) : undefined,
    popup_notices: Array.isArray(raw.popup_notices)
      ? raw.popup_notices.filter(isPopupNoticeItem)
      : undefined,
    find_us: isRecord(raw.find_us) ? (raw.find_us as FindUsData) : undefined,
  }
})

const downloadAppData = computed<DownloadAppData>(() => ({
  ...resolvedData.value.download_app,
}))

const popupNoticeList = computed<PopupNoticeItem[]>(() => {
  const incoming = resolvedData.value.popup_notices
  return Array.isArray(incoming) && incoming.length ? incoming : []
})

const findUsData = computed<FindUsData & { link_list: string[] }>(() => {
  const incoming = resolvedData.value.find_us
  const linkList = Array.isArray(incoming?.link_list)
    ? incoming.link_list.filter((item): item is string => typeof item === 'string')
    : []
  return {
    ...incoming,
    link_list: linkList,
  }
})

// ==================== 状态 ====================
const MAX_STEP = 3
const currentStep = ref(1)
const popupNoticeIndex = ref(0)

const currentPopupNotice = computed<PopupNoticeItem | null>(() => {
  const items = popupNoticeList.value
  if (!items.length) return null
  const index = Math.max(0, Math.min(popupNoticeIndex.value, items.length - 1))
  return items[index] ?? null
})

// ==================== 关闭逻辑：三步递进 ====================
function onClose(): void {
  if (currentStep.value < MAX_STEP) {
    currentStep.value++
    // 进入步骤2时重置索引，确保从第一条开始展示
    if (currentStep.value === 2) {
      popupNoticeIndex.value = 0
    }
    return
  }
  props.closePanel('close')
}

// ==================== 步骤2切换 ====================
function selectPopupNoticeTab(index: number): void {
  popupNoticeIndex.value = index
}

function prevPopupNotice(): void {
  if (popupNoticeIndex.value > 0) {
    popupNoticeIndex.value--
  }
}

function nextPopupNotice(): void {
  if (popupNoticeIndex.value < popupNoticeList.value.length - 1) {
    popupNoticeIndex.value++
  }
}

// ==================== 复制 ====================
async function writeToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  // 降级方案：使用 textarea + execCommand
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  try {
    const ok = (document as any).execCommand('copy')
    if (!ok) throw new Error('execCommand copy failed')
  } finally {
    document.body.removeChild(textarea)
  }
}

async function copyUrl(url: string): Promise<void> {
  if (!url) {
    showFailToast('复制内容为空')
    return
  }
  try {
    await writeToClipboard(url)
    showSuccessToast('已复制')
    props.emitPanelEvent('copyUrl', url)
  } catch {
    showFailToast('复制失败，请手动复制')
  }
}

async function copyAllUrls(): Promise<void> {
  const links = findUsData.value.link_list
  if (!links.length) {
    showFailToast('复制内容为空')
    return
  }
  try {
    await writeToClipboard(links.join('\n'))
    showSuccessToast('全部已复制')
    props.emitPanelEvent('copyAllUrls', links)
  } catch {
    showFailToast('复制失败，请手动复制')
  }
}

// ==================== 步骤1/3 操作 ====================
function onDownload(): void {
  const url = downloadAppData.value.download_url
  props.emitPanelEvent('primaryAction', currentStep.value)
  if (url) {
    window.open(url, '_blank')
  }
}

async function onSecondaryAction(): Promise<void> {
  props.emitPanelEvent('secondaryAction', currentStep.value)

  if (isStandaloneDisplay()) {
    showSuccessToast('已添加到桌面')
    return
  }

  if (canPromptInstall()) {
    const result = await showAddToHomeScreenPrompt()
    if (result === 'accepted') {
      showSuccessToast('已添加到桌面')
      return
    }
    if (result === 'dismissed') return
  }

  showToast(
    isIosSafari()
      ? '请点击底部分享按钮，选择"添加到主屏幕"'
      : '请在浏览器菜单中选择"添加到主屏幕"',
  )
}
</script>

<template>
  <div class="notification-panel">
    <!-- 右上角关闭按钮：前两次点击切换下一步，第三次才真正关闭 -->
    <button class="notification-panel__close" type="button" @click="onClose">
      <img src="@/assets/icons/modal_close.svg" alt="" />
    </button>

    <!-- ========== 步骤1：下载APP ========== -->
    <div v-if="currentStep === 1" class="notification-panel__step">
      <div class="notification-panel__card">
        <div class="notification-panel__app-row">
          <div class="notification-panel__app-info">
            <img
              v-if="downloadAppData.icon_url"
              class="notification-panel__app-icon"
              :src="downloadAppData.icon_url"
              alt="icon"
            />
            <span class="notification-panel__app-name">{{ downloadAppData.name }}</span>
          </div>
          <div class="notification-panel__app-title">{{ downloadAppData.title }}</div>
        </div>
        <div class="notification-panel__actions">
          <button
            class="notification-panel__btn notification-panel__btn--secondary"
            type="button"
            @click="onSecondaryAction"
          >
            <img src="@/assets/icons/icon_layer.svg" alt="" />
            <span>添加桌面快捷方式</span>
          </button>
          <button
            class="notification-panel__btn notification-panel__btn--primary"
            type="button"
            @click="onDownload"
          >
            <img src="@/assets/icons/icon_download.svg" alt="" />
            <span>下载APP</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 步骤2：富文本活动详情（可tab/箭头切换） ========== -->
    <div v-if="currentStep === 2" class="notification-panel__step">
      <h3 class="notification-panel__title">{{ currentPopupNotice?.title ?? '活动详情' }}</h3>

      <div class="notification-panel__carousel">
        <button
          class="notification-panel__arrow notification-panel__arrow--left"
          type="button"
          :disabled="popupNoticeIndex <= 0"
          @click="prevPopupNotice"
        >
          <img src="@/assets/icons/wallet/ic_arrow_left.svg" alt="" />
        </button>

        <div class="notification-panel__content-box">
          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="currentPopupNotice"
            class="notification-panel__rich-text"
            v-html="currentPopupNotice.content"
          ></div>
          <!-- eslint-enable vue/no-v-html -->
          <div v-else class="notification-panel__empty">暂无内容</div>
        </div>

        <button
          class="notification-panel__arrow notification-panel__arrow--right"
          type="button"
          :disabled="popupNoticeIndex >= popupNoticeList.length - 1"
          @click="nextPopupNotice"
        >
          <img src="@/assets/icons/wallet/ic_arrow_left.svg" alt="" />
        </button>
      </div>

      <div class="notification-panel__tabs">
        <button
          v-for="(item, index) in popupNoticeList"
          :key="index"
          type="button"
          class="notification-panel__tab"
          :class="{ active: popupNoticeIndex === index }"
          @click="selectPopupNoticeTab(index)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            :fill="popupNoticeIndex === index ? '#05E7AE' : 'white'"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M11.3133 4.64623C11.4071 4.55259 11.5341 4.5 11.6666 4.5C11.7991 4.5 11.9262 4.55259 12.02 4.64623L12.0213 4.64756L12.0233 4.64889L12.028 4.65356L12.0413 4.66689L12.0826 4.71289C12.116 4.75089 12.1626 4.80489 12.2166 4.87356C12.8326 5.67421 13.1666 6.65604 13.1666 7.66623C13.1666 8.67641 12.8326 9.65825 12.2166 10.4589C12.1608 10.5301 12.1021 10.5991 12.0406 10.6656L12.0273 10.6789L12.0233 10.6836L12.0213 10.6849L12.0206 10.6856L11.6806 10.3469L12.0206 10.6869C11.9268 10.7807 11.7996 10.8334 11.667 10.8334C11.5343 10.8334 11.4071 10.7807 11.3133 10.6869C11.2195 10.5931 11.1668 10.4659 11.1668 10.3332C11.1668 10.2006 11.2195 10.0734 11.3133 9.97956L11.3126 9.98023L11.3113 9.98089L11.3146 9.97756L11.3366 9.95356C11.358 9.93045 11.3889 9.89334 11.4293 9.84223C11.8511 9.29165 12.1038 8.63041 12.1568 7.93889C12.2099 7.24737 12.0609 6.55533 11.728 5.94689C11.6411 5.78676 11.5412 5.63403 11.4293 5.49023C11.3931 5.44344 11.3549 5.39829 11.3146 5.35489L11.3113 5.35156C11.2184 5.2576 11.1664 5.13065 11.1668 4.99848C11.1671 4.86631 11.2198 4.73966 11.3133 4.64623Z"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M13.3133 2.64747C13.4071 2.55384 13.5342 2.50124 13.6667 2.50124C13.7992 2.50124 13.9262 2.55384 14.02 2.64747L14.022 2.6488L14.024 2.6508L14.03 2.65747C14.0589 2.68597 14.0865 2.71578 14.1127 2.7468C14.1653 2.80614 14.238 2.89214 14.3233 3.00347C14.4947 3.22547 14.7193 3.55214 14.9427 3.9768C15.3893 4.82614 15.8333 6.07214 15.8333 7.66747C15.8333 9.2628 15.3893 10.5088 14.9427 11.3588C14.7647 11.7005 14.5575 12.0262 14.3233 12.3321C14.2312 12.4519 14.1333 12.5672 14.03 12.6775L14.0233 12.6841L14.022 12.6861L14.0207 12.6868L13.6667 12.3341L14.02 12.6875C13.9257 12.7786 13.7995 12.8291 13.6684 12.828C13.5373 12.8269 13.4118 12.7744 13.3191 12.6817C13.2263 12.5891 13.1737 12.4637 13.1725 12.3326C13.1713 12.2015 13.2216 12.0751 13.3127 11.9808L13.322 11.9715L13.364 11.9248C13.4035 11.8812 13.4591 11.8137 13.5307 11.7221C13.672 11.5381 13.864 11.2601 14.0573 10.8928C14.444 10.1595 14.8333 9.07214 14.8333 7.66747C14.8333 6.2628 14.444 5.17547 14.0573 4.44214C13.9055 4.15129 13.7294 3.87385 13.5307 3.6128C13.4645 3.5269 13.3949 3.44372 13.322 3.36347L13.3127 3.35414C13.219 3.26039 13.1664 3.1333 13.1664 3.0008C13.1664 2.8683 13.2197 2.74122 13.3133 2.64747ZM8.02466 2.2648C8.79999 1.75347 9.83332 2.31014 9.83332 3.2388V12.7628C9.83332 13.6921 8.79999 14.2481 8.02466 13.7368L4.02466 11.1001C3.9976 11.0821 3.96585 11.0724 3.93332 11.0721H1.99999C1.51376 11.0721 1.04744 10.879 0.703627 10.5352C0.359811 10.1913 0.166656 9.72503 0.166656 9.2388V6.7628C0.166656 6.52205 0.214077 6.28365 0.306211 6.06122C0.398344 5.83879 0.533387 5.63668 0.703627 5.46644C0.873868 5.2962 1.07597 5.16116 1.2984 5.06902C1.52083 4.97689 1.75923 4.92947 1.99999 4.92947H3.93332C3.96601 4.92958 3.998 4.92007 4.02532 4.90214L8.02466 2.2648Z"
            />
          </svg>
          <span>{{ item.title }}</span>
        </button>
      </div>
    </div>

    <!-- ========== 步骤3：备用地址（USDT 充值/收藏网址） ========== -->
    <div v-if="currentStep === 3" class="notification-panel__step">
      <h3 class="notification-panel__title">{{ findUsData.title }}</h3>

      <div v-if="findUsData.content" class="notification-panel__url-tip">
        {{ findUsData.content }}
      </div>
      <div class="notification-panel__url-card">
        <div class="notification-panel__url-actions">
          <div class="notification-panel__url-btn--secondary" @click="onSecondaryAction">
            <img src="@/assets/icons/icon_earth.svg" alt="" />
            <span>保存网址</span>
          </div>

          <button
            class="notification-panel__url-btn notification-panel__url-btn--primary"
            type="button"
            @click="copyAllUrls"
          >
            <img src="@/assets/icons/icon_copy.svg" alt="" />
            <span>{{ t('sd_X7o0UdXC') + t('UIMatch_GtO8YEdb') }}</span>
          </button>
        </div>
        <div class="notification-panel__url-tip2">
          <img src="@/assets/icons/icon_tag.svg" alt="" />
          <span>建议将以下网址 保存至浏览器书签或手机备忘录,以便要时快速</span>
        </div>
        <div class="notification-panel__url-list">
          <div
            v-for="(link, index) in findUsData.link_list"
            :key="index"
            class="notification-panel__url-item"
          >
            <span class="notification-panel__url-label">{{ link }}</span>
            <div class="notification-panel__copy-btn" type="button" @click="copyUrl(link)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="#05E7AE"
              >
                <path
                  d="M13.9507 4.716C14.4089 5.1746 14.6665 5.79634 14.6667 6.44467V12.222C14.6667 12.8704 14.4091 13.4922 13.9506 13.9506C13.4922 14.4091 12.8704 14.6667 12.222 14.6667H6.44467C5.7963 14.6667 5.17449 14.4091 4.71603 13.9506C4.25756 13.4922 4 12.8704 4 12.222V6.44467C4 6.42111 4.00111 6.39845 4.00333 6.37667C4.01986 5.74035 4.28438 5.13568 4.74048 4.69166C5.19658 4.24764 5.80813 3.99944 6.44467 4H12.222C12.8707 4 13.492 4.25733 13.9507 4.716Z"
                  fill="#05E7AE"
                />
                <path
                  d="M11.5827 2.34136C11.6253 2.41788 11.6523 2.50203 11.6623 2.589C11.6724 2.67598 11.6652 2.76408 11.6412 2.84827C11.6171 2.93246 11.5768 3.0111 11.5224 3.07969C11.4679 3.14828 11.4006 3.20548 11.324 3.24803C11.2475 3.29058 11.1634 3.31764 11.0764 3.32767C10.9894 3.3377 10.9013 3.33049 10.8171 3.30647C10.7329 3.28246 10.6543 3.24209 10.5857 3.18768C10.5171 3.13327 10.4599 3.06588 10.4174 2.98936C10.27 2.72403 10.1894 2.66536 10 2.66536H3.33337C2.96804 2.66536 2.66671 2.9667 2.66671 3.33203V9.99736C2.66671 10.2374 2.79604 10.4587 3.00471 10.5774C3.08079 10.6207 3.14759 10.6786 3.20129 10.7477C3.25499 10.8169 3.29455 10.896 3.3177 10.9804C3.34086 11.0648 3.34715 11.153 3.33623 11.2399C3.3253 11.3267 3.29738 11.4106 3.25404 11.4867C3.2107 11.5628 3.15281 11.6296 3.08366 11.6833C3.0145 11.737 2.93545 11.7765 2.85101 11.7997C2.76657 11.8228 2.6784 11.8291 2.59153 11.8182C2.50466 11.8073 2.42079 11.7794 2.34471 11.736C2.03778 11.5615 1.78253 11.3088 1.6049 11.0037C1.42727 10.6985 1.33359 10.3518 1.33337 9.9987V3.33203C1.33337 2.2307 2.23204 1.33203 3.33337 1.33203H10C10.7294 1.33203 11.2187 1.68736 11.5827 2.34136Z"
                  fill="#05E7AE"
                />
              </svg>
              <span>{{ t('sd_X7o0UdXC') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notification-panel {
  position: relative;
  width: 100%;
  // min-height: 4.5rem;
  padding: 0;
  color: #f9f9f9;
  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  box-sizing: border-box;
}

/* ---- 关闭按钮 ---- */
.notification-panel__close {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  width: 0.71rem;
  height: 0.71rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.36);
  background-blend-mode: hard-light;

  cursor: pointer;
  backdrop-filter: blur(0.12rem);
  -webkit-backdrop-filter: blur(0.12rem);

  &:active {
    opacity: 0.85;
  }
  img {
    width: 0.7rem;
  }
}

/* ---- 步骤容器 ---- */
.notification-panel__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* ---- 步骤标题 ---- */
.notification-panel__title {
  margin: 0;
  font-size: 0.56rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
  line-height: 1.4;
  letter-spacing: 0.02rem;
}

/* ---- 步骤1：卡片 ---- */
.notification-panel__card {
  width: 100%;
  padding: 0.5rem 0 0;
  border-radius: 0.32rem;
  box-sizing: border-box;
}

.notification-panel__app-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.notification-panel__app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.12rem;
  flex-shrink: 0;
}

.notification-panel__app-icon {
  width: 1.306rem;
  height: 1.306rem;
  border-radius: 0.34rem;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.08);
}

.notification-panel__app-name {
  font-size: 0.29rem;
  text-align: center;
  max-width: 2.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-panel__app-title {
  flex: 1;
  font-size: 0.373rem;
  font-weight: 500;
  line-height: 1.5;
  color: #fff;
  text-align: left;
  word-break: break-word;
}

.notification-panel__actions {
  display: flex;
  gap: 0.2rem;
}

.notification-panel__btn {
  flex: 1;
  height: 1.43rem;
  border: none;
  border-radius: 1.05rem;
  font-size: 0.34rem;
  font-weight: 500;
  color: #f9f9f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 0.64rem;
    height: 0.64rem;
  }
  &--secondary {
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(0.05rem);
  }

  &--primary {
    background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
  }

  &:active {
    opacity: 0.9;
  }
}

/* ---- 步骤2：轮播 + 富文本 ---- */
.notification-panel__carousel {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.12rem;
  margin-bottom: 0.48rem;
}

.notification-panel__arrow {
  width: 0.54rem;
  height: 0.54rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  flex-shrink: 0;
  border: none;
  padding: 0;
  background: rgba($color: #ffffff, $alpha: 0.14);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.64rem;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.2s;
  img {
    width: 0.3rem;
    height: 0.3rem;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    color: #05e7ae;
  }
}
.notification-panel__arrow--right {
  img {
    transform: rotate(-180deg);
  }
}

.notification-panel__content-box {
  flex: 1;
  margin-top: 0.5rem;
  min-height: 3.6rem;
  max-height: 8.7rem;
  overflow-y: auto;
  padding: 0.24rem;
  border-radius: 0.4rem;
  background: rgba(0, 0, 0, 0.17);
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.notification-panel__rich-text {
  font-size: 0.4rem;
  line-height: 1.7;
  color: #f9f9f9;
  text-align: left;
  word-break: break-word;

  :deep(p) {
    margin: 0 0 0.16rem;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.12rem;
  }

  :deep(a) {
    color: #05e7ae;
  }
}

.notification-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.34rem;
  color: rgba(255, 255, 255, 0.5);
}

.notification-panel__tabs {
  display: flex;
  gap: 0.12rem;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 100%;
  margin-bottom: 0.1rem;
}

.notification-panel__tab {
  height: 0.9rem;
  padding: 0 0.28rem;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.11);
  color: #f9f9f9;
  font-size: 0.4rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
  svg {
    margin-right: 0.2rem;
  }
  &.active {
    background: rgba(5, 231, 174, 0.24);
    color: #fff;
  }

  &:active {
    opacity: 0.85;
  }
}

/* ---- 步骤3：URL 卡片 ---- */
.notification-panel__url-card {
  width: 100%;
  padding: 0.43rem 0.43rem 0.2rem;
  border-radius: 0.426rem;
  margin-top: 0.19rem;
  background: rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
}

.notification-panel__url-tip,
.notification-panel__url-tip2 {
  width: 100%;
  padding: 0.28rem;
  border-radius: 0.426rem;
  margin-top: 0.48rem;
  background: rgba(0, 0, 0, 0.17);
  box-sizing: border-box;
  padding: 0.53rem;
  font-size: 0.426rem;
  line-height: 1.2;
  font-weight: 400;
  color: #f9f9f9;
}

.notification-panel__url-tip2 {
  margin: 0.24rem 0 0.12rem;
  padding: 0.11rem 0.22rem;
  display: flex;
  font-size: 0.293rem;
  text-align: left;
  background: rgba(0, 0, 0, 0.14);
  img {
    margin-right: 0.1rem;
  }
}

.notification-panel__url-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.16rem;
  margin-bottom: 0.24rem;
}

.notification-panel__url-btn {
  height: 0.54rem;
  border: none;
  border-radius: 0.36rem;
  font-size: 0.346rem;
  font-weight: 500;
  color: #f9f9f9;
  font-size: 0.346rem;
  display: flex;
  &--secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0.5rem;
    img {
      width: 0.426rem;
      height: 0.426rem;
      margin-right: 0.2rem;
    }
  }

  &--primary {
    align-items: center;
    justify-content: center;
    img {
      width: 0.373rem;
      height: 0.373rem;
    }
    background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
  }

  &:active {
    opacity: 0.9;
  }
}

.notification-panel__url-list {
  display: flex;
  flex-direction: column;
  gap: 0rem;
  max-height: 4.5rem;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.notification-panel__url-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0rem;
  padding: 0.03rem 0;
}

.notification-panel__url-label {
  min-width: 0;
  font-size: 0.373rem;
  color: #05e7ae;
  word-break: break-all;
}

.notification-panel__copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 0.56rem;
  border: none;
  color: #f9f9f9;
  font-size: 0.3rem;
  flex-shrink: 0;
  padding: 0 0.1rem;
  span {
    margin-left: 0.05rem;
  }
}
</style>

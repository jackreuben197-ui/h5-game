<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import { postOrgClubJackpotTemplateDelApi, postOrgClubJackpotTemplateListApi } from '@/api/org'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import iconArrowRight from '@/assets/icons/ic_arrow_rightt.svg'
import iconEdit from '@/assets/icons/ic_jackpot_edit.svg'
import iconDelete from '@/assets/icons/icon_delete.svg'
import cardBgUrl from '@/assets/icons/ic_jackpot_card_bg.png'
import iconTag from '@/assets/icons/ic_card_jackpot.svg'
import { t } from '@/i18n'

interface JackpotTemplateItem {
  id: string
  name: string
  jpAmount: string
  gameTags: string[]
}

const router = useRouter()
const loading = ref(false)
const loadingMore = ref(false)
const templates = ref<JackpotTemplateItem[]>([])
const listOffset = ref(0)
const hasMore = ref(true)
const pageRef = ref<HTMLElement | null>(null)
const PAGE_SIZE = 10

// ---- delete dialog state ----
const showDeleteDialog = ref(false)
const deletingItem = ref<JackpotTemplateItem | null>(null)
const deleting = ref(false)

const hasItems = computed(() => templates.value.length > 0)

onMounted(() => {
  void fetchJackpotTemplates(true)
})

async function fetchJackpotTemplates(reset = false): Promise<void> {
  if (loading.value || loadingMore.value) {
    return
  }

  if (!reset && !hasMore.value) {
    return
  }

  if (reset) {
    loading.value = true
    listOffset.value = 0
    hasMore.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const currentOffset = reset ? 0 : listOffset.value
    const response = await postOrgClubJackpotTemplateListApi({
      limit: PAGE_SIZE,
      offset: currentOffset,
    })

    if (Number(response.code) !== 0) {
      const message =
        typeof response.msg === 'string'
          ? response.msg
          : t('UIClub_Load') + ' Jackpot ' + t('UIClub_Fail5')
      throw new Error(message)
    }

    const rawItems = Array.isArray(response.data?.items) ? response.data.items : []
    const mappedItems = rawItems.map((raw, index) => toJackpotItem(raw, currentOffset + index))

    if (reset) {
      templates.value = mappedItems
    } else {
      templates.value = [...templates.value, ...mappedItems]
    }

    listOffset.value = currentOffset + rawItems.length
    hasMore.value = rawItems.length >= PAGE_SIZE
  } catch (error) {
    if (reset) {
      templates.value = []
      hasMore.value = false
    }
    const message =
      error instanceof Error ? error.message : t('UIClub_Load') + ' Jackpot ' + t('UIClub_Fail5')
    showFailToast(message)
  } finally {
    if (reset) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

function loadNextPage(): void {
  if (!loading.value && !loadingMore.value && hasMore.value) {
    void fetchJackpotTemplates(false)
  }
}

function onPageScroll(event: Event): void {
  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }

  const remain = target.scrollHeight - (target.scrollTop + target.clientHeight)
  if (remain <= 80) {
    loadNextPage()
  }
}

function toJackpotItem(raw: unknown, index: number): JackpotTemplateItem {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const id = normalizeValue(source.jackpot_id ?? source.id ?? index + 1)
  const name = normalizeValue(source.name) || `Jackpot ${index + 1}`

  const amountRaw =
    source.jp_amount ??
    source.jackpot_amount ??
    source.current_amount ??
    source.amount ??
    source.gold ??
    0

  const gameTags: string[] = []
  if (toSafeNumber(source.nlh_switch) === 1) gameTags.push('NLH')
  if (toSafeNumber(source.plo_switch) === 1) gameTags.push('PLO')
  if (toSafeNumber(source.six_plus_switch) === 1) gameTags.push('6+')
  if (toSafeNumber(source.bombpot_switch) === 1) gameTags.push('BOMB')
  if (toSafeNumber(source.aof_switch) === 1) gameTags.push('AOF')

  return {
    id,
    name,
    jpAmount: formatAmount(amountRaw),
    gameTags: gameTags.length ? gameTags : ['NLH', 'PLO', '6+'],
  }
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function formatAmount(value: unknown): string {
  const amount = toSafeNumber(value)
  const amountYuan = amount / 100
  return amountYuan > 0 ? amountYuan.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0'
}

function onEdit(item: JackpotTemplateItem): void {
  void router.push(`/club/jackpot/create?id=${encodeURIComponent(item.id)}`)
}

function onDelete(item: JackpotTemplateItem): void {
  deletingItem.value = item
  showDeleteDialog.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deletingItem.value) return

  deleting.value = true
  try {
    const response = await postOrgClubJackpotTemplateDelApi({
      jackpot_id: Number(deletingItem.value.id),
    })

    if (Number(response.code) !== 0) {
      const message = typeof response.msg === 'string' ? response.msg : t('UIClub_DeleteFail')
      throw new Error(message)
    }

    showSuccessToast(t('UIClub_DeleteSuccess'))
    showDeleteDialog.value = false
    deletingItem.value = null

    // 重新拉取列表
    void fetchJackpotTemplates(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_DeleteFail')
    showFailToast(message)
  } finally {
    deleting.value = false
  }
}

function cancelDelete(): void {
  showDeleteDialog.value = false
  deletingItem.value = null
}

function goCreateJackpot(): void {
  void router.push('/club/jackpot/create')
}

function goPoolReward(): void {
  void router.push('/club/jackpot/pool-reward')
}
</script>

<template>
  <div ref="pageRef" class="page-shell club-jackpot-page" @scroll="onPageScroll">
    <HeaderBack :title="'Jackpot'" :extra-padding="true">
      <template #right>
        <button type="button" class="pool-trigger" :aria-label="t('UIClub_Jackpot3')" @click="goPoolReward">
          <span>{{ t('UIClub_Jackpot3') }}</span>
          <img class="trigger-arrow" :src="iconArrowRight" alt="" aria-hidden="true" />
        </button>
      </template>
    </HeaderBack>

    <section class="jackpot-body">
      <ul v-if="hasItems" class="jackpot-list">
        <li v-for="item in templates" :key="item.id" class="jackpot-card">
          <div
            class="card-bg"
            :style="{ backgroundImage: `url(${cardBgUrl})` }"
            aria-hidden="true"
          ></div>
          <div class="jackpot-badge" aria-hidden="true"><span>JACKPOT</span></div>

          <div class="jackpot-info">
            <p class="game-name">{{ item.name }}</p>
            <div class="tag-rows">
              <div class="tag-row">
                <span v-for="tag in item.gameTags.slice(0, 2)" :key="tag" class="tag-item">
                  <img class="tag-icon" :src="iconTag" alt="" aria-hidden="true" />{{ tag }}
                </span>
              </div>
              <div v-if="item.gameTags.length > 2" class="tag-row">
                <span v-for="tag in item.gameTags.slice(2)" :key="`r2-${tag}`" class="tag-item">
                  <img class="tag-icon" :src="iconTag" alt="" aria-hidden="true" />{{ tag }}
                </span>
              </div>
            </div>
          </div>

          <div class="jackpot-right">
            <div class="jp-badge">JP {{ item.jpAmount }}</div>
            <div class="action-row">
              <button type="button" class="action-btn" aria-label="编辑" @click.stop="onEdit(item)">
                <img class="action-icon" :src="iconEdit" alt="" aria-hidden="true" />
                <span class="action-label">编辑</span>
              </button>
              <button
                type="button"
                class="action-btn"
                aria-label="删除"
                @click.stop="onDelete(item)"
              >
                <img class="action-icon" :src="iconDelete" alt="" aria-hidden="true" />
                <span class="action-label">删除</span>
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div v-else class="jackpot-empty" :class="{ 'jackpot-empty--loading': loading }">
        <AppSvgIcon name="empty-data" class="empty-icon" />
        <p>{{ loading ? '加载中...' : '暂无数据' }}</p>
      </div>

      <p v-if="hasItems && loadingMore" class="list-loading-more">加载更多...</p>
      <p v-else-if="hasItems && !hasMore" class="list-loading-more">没有更多了</p>
    </section>

    <div class="footer-action">
      <button type="button" class="create-btn" @click="goCreateJackpot">
        Create Jackpot Table
      </button>
    </div>

    <!-- 删除确认弹窗 (Figma node-id=1451-5725, 1rem=37.5px) -->
    <teleport to="body">
      <transition name="dialog-fade">
        <div v-if="showDeleteDialog" class="delete-dialog-overlay" @click.self="cancelDelete">
          <div class="delete-dialog-card">
            <p class="delete-dialog-title">确认要删除这个模板吗？</p>

            <div class="delete-dialog-actions">
              <button
                type="button"
                class="delete-btn delete-btn--cancel"
                :disabled="deleting"
                @click="cancelDelete"
              >
                Cancel
              </button>
              <button
                type="button"
                class="delete-btn delete-btn--confirm"
                :disabled="deleting"
                @click="confirmDelete"
              >
                {{ deleting ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-jackpot-page {
  position: relative;
  height: 100dvh;
  padding-bottom: calc(2.2rem + env(safe-area-inset-bottom));
  overflow-x: hidden;
  overflow-y: auto;
  background-image: url('@/assets/images/main_bg.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light-own {
    // Семантические переменные глобально остаются тёмными, поэтому светлые значения
    // задаём локально — на них написаны все блоки theme-light-own ниже.
    --c-text: rgba(0, 0, 0, 1);
    --c-text-muted: rgba(0, 0, 0, 0.62);
    --c-surface: rgba(255, 255, 255, 1);
    --c-divider: rgba(0, 0, 0, 0.12);
    --c-border: rgba(0, 0, 0, 0.18);
    --c-brand: #05c297;
    --c-brand-rgb: 5, 194, 151;

    background-image: url('@/assets/images/main_bg_light.webp');

    // Шапка страницы (HeaderBack) на светлом фоне — тёмным.
    :deep(.back-trigger),
    :deep(.back-icon) {
      color: var(--c-text);
    }

    :deep(.title) {
      text-shadow: none;
    }
  }
}

.page-overlay {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(36.5px);
  background: rgba(0, 0, 0, 0.2);
  mix-blend-mode: luminosity;
  pointer-events: none;
  z-index: 0;

  @include theme-light-own {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    mix-blend-mode: normal;
  }
}

:deep(.page-back-header) {
  position: relative;
  z-index: 2;
  padding-top: calc(var(--app-top-padding) + var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.2rem);
  min-height: 1.9rem;
}

.pool-trigger {
  border: 0;
  min-height: 1.139rem;
  border-radius: 0.684rem;
  padding: 0.226rem 0.312rem 0.226rem 0.555rem;
  font-size: 0.583rem;
  font-weight: 500;
  color: #fff;
  background: rgba(255, 255, 255, 0.21);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.062rem;
  cursor: pointer;
  line-height: 1.2;

  @include theme-light-own {
    color: #fff;
    background: var(--c-brand);
  }
}

.trigger-arrow {
  width: 0.39rem;
  height: 0.39rem;
  object-fit: contain;
  flex-shrink: 0;
  margin-right: 0.0267rem;
  margin-left: 0.1rem;
  margin-top: 0.05rem;
}

.jackpot-body {
  position: relative;
  z-index: 2;
  margin: 0.4267rem auto 0;
  padding: 0 0.4267rem;
}

.jackpot-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4223rem;
}

.jackpot-card {
  position: relative;
  height: 2.2765rem;
  max-width: 9.1216rem;
}

/* Pill-shaped card background */
.card-bg {
  position: absolute;
  left: 0.2533rem;
  top: 0.0253rem;
  right: 0;
  height: 2.2551rem;
  border-radius: 2.0848rem;
  background-color: rgba(170, 170, 170, 0.1);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  overflow: hidden;

  @include theme-light-own {
    background:
      radial-gradient(
        70% 110% at 44% 45%,
        rgba(123, 105, 255, 0.38) 0%,
        rgba(71, 64, 244, 0.12) 58%,
        rgba(5, 13, 231, 0) 100%
      ),
      rgba(5, 13, 231, 0.6);
    border-color: #fff;
    box-shadow:
      inset 0.04rem 0.04rem 0.14rem rgba(255, 255, 255, 0.32),
      inset -0.04rem -0.04rem 0.12rem rgba(51, 43, 190, 0.2);
  }
}

.card-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0.0149rem rgba(255, 255, 255, 0.5),
    inset 0 0 0.08rem rgba(255, 255, 255, 0.22);
  pointer-events: none;
}

/* JACKPOT circle badge */
.jackpot-badge {
  position: absolute;
  left: -0.028rem;
  top: 0.4053rem;
  width: 1.4888rem;
  height: 1.4888rem;
  border-radius: 1.7372rem;
  border: 0.0253rem solid rgba(242, 242, 242, 0.4);
  background: #3a95dc;
  backdrop-filter: blur(10.5px);
  box-shadow: 0.0913rem 0.1141rem 0.0913rem rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;

  @include theme-light-own {
    background: linear-gradient(140deg, #cf56ef 2%, #8b3de6 49%, #5737ef 100%);
    box-shadow:
      0.0913rem 0.1141rem 0.0913rem rgba(0, 0, 0, 0.25),
      inset 0.02rem 0.02rem 0.08rem rgba(255, 255, 255, 0.24);
  }

  span {
    font-size: 0.229rem;
    font-weight: 700;
    color: #fff;
    text-align: center;
    line-height: 1.1;
    letter-spacing: 0.01em;
  }
}

/* Game name + tags */
.jackpot-info {
  position: absolute;
  left: 1.64rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  max-width: 3.89rem;
}

.game-name {
  margin: 0;
  font-size: 0.354rem;
  font-weight: 700;
  color: #f9f9f9;
  line-height: 0.83;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-rows {
  margin-top: 0.1493rem;
  display: flex;
  flex-direction: column;
  gap: 0.0267rem;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 0.2933rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.1333rem;
  font-size: 0.2933rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.0117rem;
  line-height: normal;
}

.tag-icon {
  display: inline-block;
  flex-shrink: 0;
  width: 0.24rem;
  height: 0.2667rem;
  object-fit: contain;
}

/* Right section: JP badge + action buttons */
.jackpot-right {
  position: absolute;
  left: 6.5067rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.874rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.0394rem;
  z-index: 2;
}

.jp-badge {
  width: 1.84rem;
  height: 0.4755rem;
  border-radius: 0.2232rem;
  background: linear-gradient(180deg, #69beff, #3a95dc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.2951rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.0059rem;
  white-space: nowrap;
  margin-right: 0.8rem;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 0.2025rem;

  margin-right: 0.8rem;
  margin-top: 0.1rem;
}

.action-btn {
  width: 0.6218rem;
  height: 0.6218rem;
  border-radius: 0.4223rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  background: rgba(170, 170, 170, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.05rem 0 0.02rem;
  gap: 0.01rem;
  cursor: pointer;
}

.action-icon {
  width: 0.24rem;
  height: 0.24rem;
  object-fit: contain;
  flex-shrink: 0;
}

.action-label {
  font-size: 0.1706rem;
  color: #fff;
  line-height: 1.2;
  font-weight: 600;
}

/* Empty state */
.jackpot-empty {
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.jackpot-empty--loading {
  opacity: 0.8;
}

.empty-icon {
  width: 1.248rem;
  height: 1.56rem;
  object-fit: contain;
}

.jackpot-empty p {
  margin: 0.24rem 0 0;
  font-size: 0.3734rem;
  color: rgba(225, 234, 248, 0.88);
  text-align: center;

  @include theme-light-own {
    color: var(--c-text);
  }
}

.list-loading-more {
  margin: 0.42rem 0 0;
  text-align: center;
  color: rgba(225, 234, 248, 0.88);
  font-size: 0.32rem;

  @include theme-light-own {
    color: var(--c-text-muted);
  }
}

/* Fixed footer */
.footer-action {
  position: fixed;
  bottom: calc(0.6933rem + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 1.0667rem);
  max-width: 9.1216rem;
  z-index: 6;
}

.create-btn {
  width: 100%;
  height: 1.4716rem;
  border: 0.0267rem solid rgba(255, 255, 255, 0.15);
  border-radius: 1.082rem;
  font-size: 0.4175rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: #78e490;
  background: linear-gradient(125.587deg, rgba(255, 255, 255, 0.1) 21.106%, rgba(230, 230, 230, 0.1) 71.429%);
  backdrop-filter: blur(0.5px);
  cursor: pointer;

  @include theme-light-own {
    border-color: rgba(242, 242, 242, 0.8);
    background: var(--c-brand);
    backdrop-filter: none;
    color: rgba(249, 249, 249, 0.95);
  }

  &:active {
    opacity: 0.92;
    transform: scale(0.985);
  }
}

/* ===== 删除确认弹窗 (Figma node-id=1451-5725, 1rem=37.5px) ===== */

/* Overlay: 全屏 60% 黑色 + 背景模糊 */
.delete-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(0.4043rem); // 15.16px
  display: flex;
  align-items: center;
  justify-content: center;

  @include theme-light-own {
    background: rgba(12, 12, 12, 0.58);
  }
}

/* Card: 317.03×150.06px → 8.454×4.002rem, corner 36.39px → 0.97rem */
.delete-dialog-card {
  width: 8.454rem; // 317.03px
  border-radius: 0.9704rem; // 36.39px
  padding: 0.792rem 0.4107rem 0.3573rem; // top=29.7, h=15.4, bottom=13.4
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5099rem; // 19.12px
  overflow: hidden;

  /* 渐变背景: grey 从浅到深, opacity 0.2 */
  background: linear-gradient(
    135deg,
    rgba(142, 142, 142, 0.2) 0%,
    rgba(103, 103, 103, 0.2) 46.8%,
    rgba(73, 73, 73, 0.2) 100%
  );

  /* 渐变描边: 白色, 透明度从 0.4→0→0.5 */
  border: 0.0267rem solid transparent;
  background-origin: border-box;
  background-clip: padding-box, border-box;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.0267rem;
    background: linear-gradient(
      120deg,
      rgba(242, 242, 242, 0.4) 0%,
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

  /* 内阴影: 白色上高光 */
  box-shadow:
    inset 0.0566rem 0.1132rem 0.4596rem rgba(242, 242, 242, 0.9),
    inset 0 0 0.2292rem rgba(203, 110, 125, 0.25),
    inset 0 0 0.2292rem rgba(0, 0, 0, 0.6),
    0.0919rem 0.1149rem 0.1838rem rgba(0, 0, 0, 0.25);
}

/* Title: 16px → 0.4267rem, HONOR Sans CN Regular, white, line-height 124% */
.delete-dialog-title {
  margin: 0;
  font-size: 0.4267rem; // 16px
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 400;
  color: #fff;
  text-align: center;
  line-height: 1.24;
}

/* Button row: HORIZONTAL, CENTER, gap 9.5px → 0.253rem */
.delete-dialog-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2533rem; // 9.5px
}

/* Shared button base: 138.37×53.84px → 3.690×1.436rem, corner 39.59px → 1.056rem */
.delete-btn {
  width: 3.69rem; // 138.37px
  height: 1.4358rem; // 53.84px
  border-radius: 1.0557rem; // 39.59px (pill)
  border: 0;
  font-size: 0.4rem; // 15px
  font-family: 'Afacad', sans-serif;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Cancel: black 30% + glass blur */
.delete-btn--cancel {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(0.0197rem); // 0.74px
}

/* Delete: green gradient #05E7AE → #027A5C + stroke */
.delete-btn--confirm {
  border: 0.0267rem solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(157.77deg, rgba(85, 243, 41, 1) 7.55%, rgba(62, 173, 6, 1) 71.92%);
  backdrop-filter: blur(0.0591rem); // 2.22px

  @include theme-light-own {
    border-color: transparent;
    background: var(--c-brand);
  }
}

/* Fade transition */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import mttBannerSm from '@/assets/images/mtt_banner_sm.png'
import mttBannerMd from '@/assets/images/mtt_banner_md.png'
import mttBannerLg from '@/assets/images/mtt_banner_lg.png'

// MTT 卡片支持三种尺寸：
//   sm  - 1行3张，紧凑小卡
//   md  - 1行2张，中等卡片
//   lg  - 1行1张，全宽大卡

export type MttCardSize = 'sm' | 'md' | 'lg'

/** 按钮状态 */
export type MttActionType = 'register' | 'join' | 'late' | 'inProgress' | 'full'

export interface MttItem {
  id: string | number
  /** 赛事封面图 url，不传时按 size 回退到默认 banner。 */
  coverImage?: string
  /** 游戏/赛事图标 url（md/lg 尺寸底部展示） */
  gameIcon?: string
  /** 赛事名称 */
  title: string
  /** 报名费（分）。 */
  applyFeePool: number
  /** 奖池（分）。 */
  prizePool: number
  /** 开赛时间展示文案。 */
  startTime: string
  /** 当前报名人数 */
  registeredCount: number
  /** 最大人数 */
  maxCount: number
  /** 奖池类型。 */
  prizeType: number
  /** 重购次数。 */
  rebuyTimes: number
  /** addon 开始盲注级别。 */
  addonBeginBl: number
  /** addon 结束盲注级别。 */
  addonEndBl: number
  /** 防作弊类型（3=视频）。 */
  antiCheatType: number
  /** 按钮动作 */
  actionType?: MttActionType
  /** 按钮文字（不传则由 actionType 推导） */
  actionLabel?: string
  /** 顶部状态提示文字，如 "最晚报名 18:45" / "延迟报名 18:45" / "报名中" */
  statusLabel?: string
  /** 状态标签颜色主题：warning（黄）| success（绿）| danger（红）| default（暗） */
  statusTheme?: 'warning' | 'success' | 'danger' | 'default'
}

interface Props {
  item: MttItem
  size?: MttCardSize
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const emit = defineEmits<{
  action: [item: MttItem]
  click: [item: MttItem]
}>()

/**
 * 不同尺寸卡片对应的默认封面图。
 * 规则：lg -> mtt_banner_lg，md -> mtt_banner_md，sm -> mtt_banner_sm
 */
function resolveDefaultCoverBySize(size: MttCardSize): string {
  if (size === 'lg') return mttBannerLg
  if (size === 'sm') return mttBannerSm
  return mttBannerMd
}

/**
 * 实际用于展示的封面：
 * 1. 业务传了 coverImage 就用业务图；
 * 2. 未传时按卡片尺寸回退到默认 banner。
 */
const coverImageSrc = computed<string>(() => {
  const customCover = props.item.coverImage?.trim()
  if (customCover) return customCover
  return resolveDefaultCoverBySize(props.size)
})

const isActionDisabled = computed<boolean>(() => (props.item.actionType ?? 'register') === 'full')
const showGuaranteeTag = computed<boolean>(
  () => props.item.prizeType === 1 || props.item.prizeType === 3,
)
const showRebuyTag = computed<boolean>(() => props.item.rebuyTimes > 0)
const showAddonTag = computed<boolean>(
  () => props.item.addonBeginBl > 0 && props.item.addonEndBl > 0,
)
const showVideoIcon = computed<boolean>(() => props.item.antiCheatType === 3)

function resolveActionLabel(): string {
  if (props.item.actionLabel) return props.item.actionLabel
  const map: Record<MttActionType, string> = {
    register: t('MTT-Apply'),
    join: t('mtt_btn_enter'),
    late: t('mtt_btn_delay'),
    inProgress: t('mtt_btn_waiting_start'),
    full: t('mtt_btn_sign_up_deadline'),
  }
  return map[props.item.actionType ?? 'register'] ?? t('MTT-Apply')
}

function resolveActionClass(): string {
  const type = props.item.actionType ?? 'register'
  if (type === 'full') return 'action-btn--disabled'
  if (type === 'inProgress') return 'action-btn--progress'
  if (type === 'late') return 'action-btn--late'
  if (type === 'join') return 'action-btn--join'
  return 'action-btn--register'
}

function resolveStatusClass(): string {
  const theme = props.item.statusTheme ?? 'default'
  return `status-tag--${theme}`
}

function handleAction(e: Event): void {
  e.stopPropagation()
  if (isActionDisabled.value) {
    return
  }
  emit('action', props.item)
}

function handleClick(): void {
  emit('click', props.item)
}

// 分值转金额展示（按现有业务约定 /100）。
function formatCentAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return '0'
  }
  return `${value / 100}`
}
</script>

<template>
  <!-- ====== SM：1行3张 ====== -->
  <article v-if="size === 'sm'" class="mtt-card mtt-card--sm" @click="handleClick">
    <div class="mtt-card__cover-wrap">
      <img
        class="mtt-card__cover"
        :src="coverImageSrc"
        :alt="item.title"
        loading="lazy"
      />
    </div>
    <div class="mtt-card__footer">
      <div class="mtt-card__info">
        <span class="mtt-card__title">{{ item.title }}</span>
        <span class="mtt-card__count">
          <span class="count-dot"></span>
          {{ item.registeredCount }}/{{ item.maxCount }}
        </span>
      </div>
      <button
        class="action-btn"
        :class="resolveActionClass()"
        :disabled="isActionDisabled"
        @click="handleAction"
      >
        {{ resolveActionLabel() }}
      </button>
    </div>
  </article>

  <!-- ====== MD：1行2张 ====== -->
  <article v-else-if="size === 'md'" class="mtt-card mtt-card--md" @click="handleClick">
    <div class="mtt-card__cover-wrap">
      <img
        class="mtt-card__cover"
        :src="coverImageSrc"
        :alt="item.title"
        loading="lazy"
      />
      <!-- 顶部状态标签 -->
      <div v-if="item.statusLabel" class="status-tag" :class="resolveStatusClass()">
        {{ item.statusLabel }}
      </div>
    </div>
    <div class="mtt-card__footer">
      <div class="mtt-card__icon-wrap">
        <img
          class="mtt-card__game-icon"
          src="@/assets/icons/icon_mtt_avatar.png"
          alt="game"
        />
      </div>
      <div class="mtt-card__info">
        <span class="mtt-card__title">{{ item.title }}</span>
        <span class="mtt-card__count">
          <span class="count-dot"></span>
          {{ item.registeredCount }}/{{ item.maxCount }}
        </span>
      </div>
      <button
        class="action-btn"
        :class="resolveActionClass()"
        :disabled="isActionDisabled"
        @click="handleAction"
      >
        {{ resolveActionLabel() }}
      </button>
    </div>
  </article>

  <!-- ====== LG：1行1张（全宽） ====== -->
  <article v-else class="mtt-card mtt-card--lg" @click="handleClick">
    <div class="mtt-card__cover-wrap">
      <img
        class="mtt-card__cover"
        :src="coverImageSrc"
        :alt="item.title"
        loading="lazy"
      />
      <!-- 顶部状态标签 -->
      <div v-if="item.statusLabel" class="status-tag" :class="resolveStatusClass()">
        {{ item.statusLabel }}
      </div>
    </div>
    <div class="mtt-card__footer">
      <div class="mtt-card__icon-wrap">
        <img
          class="mtt-card__game-icon"
          src="@/assets/icons/icon_mtt_avatar.png"
          alt="game"
        />
      </div>
      <div class="mtt-card__info">
        <span class="mtt-card__title">{{ item.title }}</span>
        <div class="mtt-card__count mt-6">
          <img class="mtt-card-info-icon" src="@/assets/icons/icon_ticket.png" alt="" />
          <span>{{ formatCentAmount(item.applyFeePool) }}</span>
          <img class=" ml-4 mtt-card-info-icon" src="@/assets/icons/icon_star.png" alt="" />
          <span>{{ formatCentAmount(item.prizePool) }}</span>
        </div>
        <div class="mtt-card__count">
          <img class="mtt-card-info-icon" src="@/assets/icons/icon_time.png" alt="" />
          <span>{{ item.startTime }}</span>
          <span class="ml-4 count-dot"></span>
          <span> {{ item.registeredCount }}/{{ item.maxCount }}</span>
        </div>
        <div class="mtt-card__count">
          <span v-if="showGuaranteeTag" class="mtt-card-prize-type">{{ t('UIMatchGuaranteedTag') }}</span>
          <span v-if="showAddonTag" class="ml-4 mtt-rebuy">A</span>
          <span v-if="showRebuyTag" class="ml-4 mtt-addon">R</span>
          <img
            v-if="showVideoIcon"
            class="mtt-card-info-icon ml-3"
            src="@/assets/icons/icon_video.png"
            alt=""
          />
        </div>
      </div>
      <button
        class="action-btn"
        :class="resolveActionClass()"
        :disabled="isActionDisabled"
        @click="handleAction"
      >
        {{ resolveActionLabel() }}
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
/* ===========================
   公共基础样式
   =========================== */
.mtt-card {
  position: relative;
  border-radius: 0.386rem;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
  flex-shrink: 0;
  min-width: 0;

  &:active {
    opacity: 0.88;
  }
}

.mtt-card__cover-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.mtt-card__cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

/* 底部信息栏 */
.mtt-card__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.12rem;
  background: rgba(0, 0, 0, 0.43);
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
  padding: 0.12rem 0.2rem;
}

.mtt-card__icon-wrap {
  flex-shrink: 0;
  width: 0.97rem;
  height: 0.97rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mtt-card__game-icon {
  width: 0.97rem;
  height: 0.97rem;
  object-fit: contain;
}

.mtt-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.04rem;
}

.mtt-card__title {
  font-size: 0.32rem;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.mtt-card__count {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
  font-size: 0.24rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1;
}

/* 保底赛标签：左右半圆胶囊背景（白色 25% 透明） */
.mtt-card-prize-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.14rem;
  min-height: 0.34rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 0.21rem;
  line-height: 1;
}

/* A / R 标签：1px 圆形描边 */
.mtt-addon,
.mtt-rebuy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.34rem;
  height: 0.34rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  color: #fff;
  font-size: 0.21rem;
  line-height: 1;
}

.count-dot {
  display: inline-block;
  width: 0.3rem;
  height: 0.3rem;
  background: url('@/assets/icons/icon_people.png') no-repeat center / contain;
}

/* 顶部状态标签 */
.status-tag {
  position: absolute;
  top: 0.22rem;
  right: 0.5rem;
  // transform: translateX(-100%);
  white-space: nowrap;
  font-size: 0.32rem;
  font-weight: 400;
  color: #fff;
  padding: 0.1rem 0.28rem;
  border-radius: 0.5rem;

  &--default {
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
  }

  &--warning {
    background: rgba(255, 255, 255, 0.12);
    color: #ff132b;
  }

  &--success {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(85, 243, 41, 1);
  }

  &--danger {
    background: rgba(255, 19, 43, 0.8);
    color: #fff;
  }
}

/* 操作按钮 */
.action-btn {
  flex-shrink: 0;
  border: none;
  outline: none;
  cursor: pointer;
  font-weight: 700;
  color: #fff;
  border-radius: 0.5067rem;
  padding: 0 0.18rem;
  line-height: 1;
  // white-space: nowrap;

  &--register {
    background: #05c297;
  }

  &--join,
  &--progress,
  &--late {
    background: #ffd900;
    color: rgba(0, 0, 0, 0.85);
  }

  &--disabled {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.65);
    cursor: not-allowed;
  }
}

/* ===========================
   SM - 1行3张
   =========================== */
.mtt-card--sm {
  border-radius: 0.507rem;

  .mtt-card__cover-wrap {
    height: 3.66rem;
  }

  .mtt-card__cover {
    border-radius: 0.507rem;
  }

  .mtt-card__footer {
    padding: 0.12rem 0.16rem 0.12rem 0.3rem;
    border-bottom-left-radius: 0.507rem;
    border-bottom-right-radius: 0.507rem;
  }

  .mtt-card__info {
    width: 100%;
  }

  .mtt-card__title {
    font-size: 0.213rem;
  }

  .mtt-card__count {
    font-size: 0.16rem;
    gap: 0.06rem;
  }

  .action-btn {
    font-size: 0.2rem;
    height: 0.44rem;
    padding: 0 0.16rem;
    min-width: 0.9rem;
    max-width: 1.4rem;
  }
}

/* ===========================
   MD - 1行2张
   =========================== */
.mtt-card--md {
  border-radius: 0.773rem;
  height: 5.5rem;

  .mtt-card__cover-wrap {
    height: 5.5rem;
  }

  .mtt-card__cover {
    border-radius: 0.773rem;
  }

  .mtt-card__footer {
    padding: 0.12rem 0.2rem  0.2rem 0.3rem;
    border-bottom-left-radius: 0.773rem;
    border-bottom-right-radius: 0.773rem;
  }

  .mtt-card__title {
    font-size: 0.326rem;
  }

  .mtt-card__count {
    font-size: 0.24rem;
  }

  .action-btn {
    font-size: 0.3rem;
    height: 0.667rem;
    padding: 0 0.1rem;
    max-width: 1.4rem;
    min-width: 1rem;
  }
}

/* ===========================
   LG - 全宽1张
   =========================== */
.mtt-card--lg {
  border-radius: 0.757rem;
  .mtt-card__info{
    margin-left:0.2rem;
  }

  .mtt-card__cover-wrap {
    height: 5.2rem;
  }

  .mtt-card__cover {
    border-radius: 0.757rem;
  }

  .mtt-card__footer {
    padding: 0.2rem 0.3rem  0.3rem 0.3rem;
    border-bottom-left-radius: 0.757rem;
    border-bottom-right-radius: 0.757rem;
  }
  .mtt-card-info-icon{
    width: 0.24rem;
    height: 0.24rem;
    margin-right: 0.05rem;
  }

  .mtt-card__icon-wrap {
    width: 0.95rem;
    height: 0.95rem;
  }

  .mtt-card__title {
    font-size: 0.32rem;
  }

  .mtt-card__count {
    font-size: 0.234rem;
  }

  .action-btn {
    font-size: 0.293rem;
    height: 0.657rem;
    padding: 0 0.32rem;
    min-width: 2rem;
    max-width: 3rem;
  }
}

</style>

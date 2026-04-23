<script setup lang="ts">
import { computed } from 'vue'
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
  /** 当前报名人数 */
  registeredCount: number
  /** 最大人数 */
  maxCount: number
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

function resolveActionLabel(): string {
  if (props.item.actionLabel) return props.item.actionLabel
  const map: Record<MttActionType, string> = {
    register: '报名',
    join: '加入',
    late: '延迟报名',
    inProgress: '报名中',
    full: '已满',
  }
  return map[props.item.actionType ?? 'register'] ?? '报名'
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
  emit('action', props.item)
}

function handleClick(): void {
  emit('click', props.item)
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
      <button class="action-btn" :class="resolveActionClass()" @click="handleAction">
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
          v-if="item.gameIcon"
          class="mtt-card__game-icon"
          :src="item.gameIcon"
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
      <button class="action-btn" :class="resolveActionClass()" @click="handleAction">
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
          v-if="item.gameIcon"
          class="mtt-card__game-icon"
          :src="item.gameIcon"
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
      <button class="action-btn" :class="resolveActionClass()" @click="handleAction">
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
  background: rgba(237, 237, 237, 0.24);
  backdrop-filter: blur(4px);
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
  padding: 0.12rem 0.2rem;
}

.mtt-card__icon-wrap {
  flex-shrink: 0;
  width: 0.533rem;
  height: 0.533rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mtt-card__game-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
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

.count-dot {
  display: inline-block;
  width: 0.14rem;
  height: 0.14rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

/* 顶部状态标签 */
.status-tag {
  position: absolute;
  top: 0.22rem;
  left: 50%;
  transform: translateX(-50%);
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
    color: #05e7ae;
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
  border-radius: 0.5rem;
  padding: 0 0.18rem;
  line-height: 1;
  white-space: nowrap;

  &--register {
    background: rgba(5, 231, 174, 0.8);
  }

  &--join {
    background: rgba(231, 174, 5, 0.8);
  }

  &--progress {
    background: rgba(5, 231, 174, 0.8);
  }

  &--late {
    background: rgba(255, 19, 43, 0.8);
  }

  &--disabled {
    background: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
  }
}

/* ===========================
   SM - 1行3张
   =========================== */
.mtt-card--sm {
  border-radius: 0.507rem;

  .mtt-card__cover-wrap {
    height: 2.88rem;
  }

  .mtt-card__cover {
    border-radius: 0.507rem;
  }

  .mtt-card__footer {
    padding: 0.1rem 0.16rem 0.13rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.06rem;
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

  .count-dot {
    width: 0.1rem;
    height: 0.1rem;
  }

  .action-btn {
    align-self: flex-end;
    font-size: 0.2rem;
    height: 0.44rem;
    padding: 0 0.16rem;
  }
}

/* ===========================
   MD - 1行2张
   =========================== */
.mtt-card--md {
  border-radius: 0.773rem;

  .mtt-card__cover-wrap {
    height: 4.4rem;
  }

  .mtt-card__cover {
    border-radius: 0.773rem;
  }

  .mtt-card__footer {
    padding: 0.16rem 0.24rem 0.22rem;
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
    padding: 0 0.22rem;
  }
}

/* ===========================
   LG - 全宽1张
   =========================== */
.mtt-card--lg {
  border-radius: 0.757rem;

  .mtt-card__cover-wrap {
    height: 5.2rem;
  }

  .mtt-card__cover {
    border-radius: 0.757rem;
  }

  .mtt-card__footer {
    padding: 0.2rem 0.4rem 0.28rem;
    border-bottom-left-radius: 0.757rem;
    border-bottom-right-radius: 0.757rem;
  }

  .mtt-card__icon-wrap {
    width: 0.667rem;
    height: 0.667rem;
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
  }
}
</style>

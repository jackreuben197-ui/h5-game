<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Code, subscribeH5WsCode } from '@/bridge/ws/messageCenter'
import { decodeUserOrderAudit } from '@/bridge/ws/orderAuditNotify'
import { dispatchRechargeOrderSucceeded } from '@/features/rechargeReward/channel'
import { createMockRechargeRewardNotification } from '@/features/rechargeReward/mock'
import {
  isSuccessfulRechargeOrder,
  shouldShowRechargeReward,
  type RechargeRewardItem,
  type RechargeRewardNotification,
} from '@/features/rechargeReward/model'
import { getLocale } from '@/i18n'
import { useTextI18n } from '@/i18n/useTextI18n'
import PopupCloseButton from '@/views/wallet/components/PopupCloseButton.vue'
import { useGameStore } from '@/stores/game'
import {
  multiLanguageTemplateVersion,
  resolveTemplateTextByKey,
} from '@/utils/multiLanguageTemplate'

const SEEN_ORDER_STORAGE_PREFIX = 'h5_recharge_reward_seen_v1'
const MAX_SEEN_ORDERS = 100

const { t } = useTextI18n()
const gameStore = useGameStore()
const current = ref<RechargeRewardNotification | null>(null)
const queue: RechargeRewardNotification[] = []
const memorySeenOrders = new Set<string>()
let stopOrderAuditListener: (() => void) | null = null

function storageKey(): string {
  return `${SEEN_ORDER_STORAGE_PREFIX}:${gameStore.loginUserId || 'unknown'}`
}

function readSeenOrders(): string[] {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(storageKey()) || '[]') as unknown
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && Boolean(item))
      : []
  } catch {
    return []
  }
}

function rememberOrder(orderNo: string): boolean {
  // Order numbers are globally unique. Keep the in-memory guard independent of the user-store
  // hydration timing so the same push cannot reappear if loginUserId becomes available later.
  if (memorySeenOrders.has(orderNo)) return false

  const seenOrders = readSeenOrders()
  if (seenOrders.includes(orderNo)) {
    memorySeenOrders.add(orderNo)
    return false
  }

  memorySeenOrders.add(orderNo)

  try {
    window.sessionStorage.setItem(
      storageKey(),
      JSON.stringify([...seenOrders, orderNo].slice(-MAX_SEEN_ORDERS)),
    )
  } catch {
    // sessionStorage can be disabled in embedded browsers; the in-memory queue still prevents overlap.
  }
  return true
}

function isH5Visible(): boolean {
  if (window.__H5_VISIBLE__ === false) return false
  if (document.documentElement.hasAttribute('data-cocos-active')) return false
  return document.getElementById('app')?.style.display !== 'none'
}

function showNext(): void {
  if (current.value || !isH5Visible()) return
  current.value = queue.shift() || null
}

function dismiss(): void {
  current.value = null
  showNext()
}

function discardPending(): void {
  current.value = null
  queue.splice(0, queue.length)
}

function onH5VisibilityChange(event: Event): void {
  const visible = Boolean((event as CustomEvent<{ visible?: boolean }>).detail?.visible)
  if (!visible) discardPending()
}

function displayRewardName(reward: RechargeRewardItem): string {
  // propName may be a template key such as PROP2023.... The template map is restored from
  // public_cache/multi_language_template; reading its version keeps an already-open popup in sync
  // when the asynchronous IndexedDB restore completes.
  void multiLanguageTemplateVersion.value
  const templateName = resolveTemplateTextByKey(reward.propName, getLocale())
  if (templateName) return templateName

  const translated = t(reward.propName)
  return translated === reward.propName ? reward.propName : translated
}

function enqueueNotification(notification: RechargeRewardNotification | null): void {
  if (!shouldShowRechargeReward(notification)) return

  // Mark the order consumed before checking visibility. Messages received at the table are intentionally
  // discarded and must not become a deferred popup after returning to H5.
  if (!rememberOrder(notification.orderNo)) return
  if (!isH5Visible()) return

  queue.push(notification)
  showNext()
}

function handleOrderAudit(notification: RechargeRewardNotification | null): void {
  if (!isSuccessfulRechargeOrder(notification)) return

  // Let the wallet remove its payment/countdown popup first. The reward popup is mounted on the
  // next Vue update so the two full-screen overlays are never displayed together.
  dispatchRechargeOrderSucceeded(notification)
  void nextTick(() => enqueueNotification(notification))
}

function onOrderAudit(rawBuffer: ArrayBufferLike): void {
  handleOrderAudit(decodeUserOrderAudit(rawBuffer))
}

onMounted(() => {
  stopOrderAuditListener = subscribeH5WsCode(Code.MSG_S_USER_ORDER_AUDIT, (message) => {
    onOrderAudit(message.rawBuffer)
  })
  window.addEventListener('h5:visibility-change', onH5VisibilityChange)

  // if (import.meta.env.DEV) {
  //   handleOrderAudit(createMockRechargeRewardNotification())
  // }
})

onBeforeUnmount(() => {
  stopOrderAuditListener?.()
  stopOrderAuditListener = null
  window.removeEventListener('h5:visibility-change', onH5VisibilityChange)
  discardPending()
})
</script>

<template>
  <div v-if="current" class="reward-overlay" role="presentation">
    <section
      class="reward-card"
      role="dialog"
      aria-modal="true"
      :aria-label="t('UIRechargeReward_ReceivedTitle')"
    >
      <div class="reward-card__inner">
        <PopupCloseButton absolute @close="dismiss" />

        <div class="reward-card__success" aria-hidden="true">
          <svg viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="19" />
            <path d="m27 36 6 6 13-14" />
            <path d="M36 5v8M36 59v8M5 36h8M59 36h8M14 14l6 6M52 52l6 6M58 14l-6 6M20 52l-6 6" />
          </svg>
        </div>

        <h2 class="reward-card__title">{{ t('UIRechargeReward_ReceivedTitle') }}</h2>
        <p class="reward-card__description">
          {{ t('UIRechargeReward_ReceivedDescription') }}
        </p>

        <div class="reward-card__list">
          <div
            v-for="reward in current.rewards"
            :key="`${reward.propId}-${reward.propName}`"
            class="reward-card__item"
          >
            <img
              v-if="reward.propIcon"
              class="reward-card__item-image"
              :src="reward.propIcon"
              alt=""
            />
            <svg v-else class="reward-card__ticket" viewBox="0 0 48 36" aria-hidden="true">
              <path
                d="M4 7.5A3.5 3.5 0 0 1 7.5 4h33A3.5 3.5 0 0 1 44 7.5v5.1a5.6 5.6 0 0 0 0 10.8v5.1a3.5 3.5 0 0 1-3.5 3.5h-33A3.5 3.5 0 0 1 4 28.5v-5.1a5.6 5.6 0 0 0 0-10.8Z"
              />
              <path d="M24 11.5l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7Z" />
            </svg>
            <div class="reward-card__item-copy">
              <p>
                <span>{{ displayRewardName(reward) }}</span>
                <strong>×{{ reward.quantity }}</strong>
              </p>
              <small v-if="reward.propValue > 0">
                （{{ t('UIRechargeReward_Value', reward.propValue) }}）
              </small>
            </div>
          </div>
        </div>

        <button class="reward-card__confirm" type="button" @click="dismiss">
          {{ t('UIRechargeReward_Confirm') }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.reward-overlay {
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(20px, 7vw, 28px);
  background: rgba(23, 23, 23, 0.7);

  @include theme-light-own {
    background: rgba(12, 12, 12, 0.6);
  }
}

.reward-card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 324px;
  max-width: calc(100vw - 24px);
  padding: 22px 16px 16px;
  flex-direction: column;
  align-items: center;
  border: 0.96px solid rgba(242, 242, 242, 0.4);
  border-radius: clamp(24px, 8vw, 32px);
  box-shadow:
    3.4px 4.3px 6.9px rgba(0, 0, 0, 0.25),
    0 0 8.6px #000 inset,
    2.1px 4.25px 17.2px rgba(242, 242, 242, 0.9) inset;
  overflow: hidden;
  background-image: url('@/assets/images/wallet/bg_sharp.webp');
  background-size: cover;
  background-position: center;

  @include theme-light-own {
    @include light-panel;

    background-image: none !important;
  }
}

.reward-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(0, 0, 0, 0.5);
  box-shadow:
    0.0919rem 0.1149rem 0.1838rem 0 rgba(0, 0, 0, 0.25),
    0 0 0.2298rem 0 #000 inset,
    0.0566rem 0.1132rem 0.4596rem 0 rgba(242, 242, 242, 0.9) inset;
  backdrop-filter: blur(7.58px);
  -webkit-backdrop-filter: blur(7.58px);
  pointer-events: none;
  z-index: 1;

  @include theme-light-own {
    background: rgba(135, 134, 134, 0.032) !important;
    backdrop-filter: blur(0.58px) !important;
    -webkit-backdrop-filter: blur(0.58px) !important;
  }
}

.reward-card::before {
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
}

.reward-card__inner {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.reward-card__success {
  width: 68px;
  height: 68px;
  margin: 0 auto 4px;
  color: #ffd665;
}

.reward-card__success svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
}

.reward-card__success circle {
  fill: rgba(255, 214, 101, 0.14);
  stroke-width: 5;
}

.reward-card__success path:first-of-type {
  stroke-width: 5;
}

.reward-card__success path:last-of-type {
  stroke-width: 3;
}

.reward-card__title {
  margin: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(230, 230, 230, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.2px;
}

.reward-card__description {
  margin: 0 4px 8px;
  color: rgba(255, 255, 255, 0.72);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 13px;
  line-height: 1.5;
}

.reward-card__list {
  display: flex;
  width: 100%;
  max-height: min(230px, 32vh);
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 14px 16px;
  text-align: left;
  border: 0.5px solid rgba(242, 242, 242, 0.18);
  border-radius: 18px;
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.1) 21.11%, rgba(230, 230, 230, 0.1) 71.43%);

  @include theme-light-own {
    border-color: rgba(242, 242, 242, 0.1);
    background: linear-gradient(97deg, #1f1f1f 21.11%, #191919 71.43%);
  }
}

.reward-card__item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.reward-card__item + .reward-card__item::before {
  content: '+';
  flex: 0 0 9px;
  margin-left: -10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 700;
}

.reward-card__ticket,
.reward-card__item-image {
  flex: 0 0 48px;
  width: 48px;
  height: 36px;
  object-fit: contain;
}

.reward-card__ticket {
  fill: none;
  stroke: #ffdc69;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.reward-card__ticket path:last-child {
  fill: rgba(255, 220, 105, 0.24);
  stroke-width: 1.5;
}

.reward-card__item-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: baseline;
  gap: 5px;
}

.reward-card__item-copy p {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  color: var(--c-text, #fff);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 14px;
}

.reward-card__item-copy p span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reward-card__item-copy strong {
  flex: 0 0 auto;
  color: #ffe26f;
  font-size: 16px;
}

.reward-card__item-copy small {
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
}

.reward-card__confirm {
  position: relative;
  display: flex;
  width: 100%;
  height: 48px;
  margin-top: 8px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 39.59px;
  color: rgba(120, 228, 144, 1);
  font-family: var(--wallet-font-cn, 'HONOR Sans CN');
  font-size: 0.42rem;
  font-weight: 500;
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.1) 21.11%, rgba(230, 230, 230, 0.1) 71.43%);
  box-shadow:
    inset 1px 1px 0 0 rgba(242, 242, 242, 0.8),
    inset -1px -1px 0 0 rgba(255, 255, 255, 0.5);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    opacity 0.15s,
    transform 0.15s;

  &:active {
    opacity: 0.92;
    transform: scale(0.985);
  }

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

  @include theme-light-own {
    color: rgba(249, 249, 249, 0.95);
    background: var(--c-brand);
    box-shadow: none;

    &::before {
      display: none;
    }
  }
}

@media (max-height: 560px) {
  .reward-card {
    padding-top: 14px;
  }

  .reward-card__success {
    width: 52px;
    height: 52px;
  }

  .reward-card__list {
    max-height: 145px;
  }
}
</style>

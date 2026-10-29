<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { Code, subscribeH5WsCode } from '@/bridge/ws/messageCenter'
import { decodeTribeActivityReward } from '@/bridge/ws/tribeActivityRewardNotify'
import { useTribeRewardStore } from '@/stores/tribeReward'
import {
  enqueueReward,
  hideRewardQueue,
  rewardReceiptSourceKey,
  showNextReward,
  type RewardReceiptQueue,
} from '@/features/tribeReward/notification'
import { decodeUserOrderAudit } from '@/bridge/ws/orderAuditNotify'
import { dispatchRechargeOrderSucceeded } from '@/features/rechargeReward/channel'
import {
  isSuccessfulRechargeOrder,
  shouldShowRechargeReward,
  type RechargeRewardItem,
  type RechargeRewardNotification,
} from '@/features/rechargeReward/model'
import { useTextI18n } from '@/i18n/useTextI18n'
import { rewardItemName } from '@/features/rechargeReward/display'
import rewardCoin from '@/assets/icons/wallet/ic_coins.png'
import { useGameStore } from '@/stores/game'

const SEEN_ORDER_STORAGE_PREFIX = 'h5_recharge_reward_seen_v1'
const MAX_SEEN_ORDERS = 100

const { t } = useTextI18n()
const gameStore = useGameStore()
const rewards = useTribeRewardStore()
const receipts = reactive<RewardReceiptQueue>({ current: null, pending: [] })
const current = computed(() => receipts.current)
const memorySeenOrders = new Set<string>()
let stopOrderAuditListener: (() => void) | null = null
let stopActivityRewardListener: (() => void) | null = null

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
  showNextReward(receipts, isH5Visible())
}

function dismiss(): void {
  receipts.current = null
  showNext()
}

function discardPending(): void {
  receipts.current = null
  receipts.pending = []
}

function onH5VisibilityChange(event: Event): void {
  const visible = Boolean((event as CustomEvent<{ visible?: boolean }>).detail?.visible)
  if (visible) void nextTick(showNext)
  else hideRewardQueue(receipts)
}

watch(
  () => [gameStore.loginUserId, gameStore.isRealUser] as const,
  ([userId, real], [previousUserId]) => {
    if (!real || (previousUserId && previousUserId !== userId)) discardPending()
  },
)

function displayRewardName(reward: RechargeRewardItem): string {
  // propName may be a template key such as PROP2023.... The template map is restored from
  // public_cache/multi_language_template; reading its version keeps an already-open popup in sync
  // when the asynchronous IndexedDB restore completes.
  return rewardItemName(reward.propName, reward.multiLanguage)
}

function enqueueNotification(notification: RechargeRewardNotification | null): void {
  if (!shouldShowRechargeReward(notification)) return
  enqueueReward(
    receipts,
    {
      ...notification,
      rewardGold: notification.rewardGold ?? 0,
      source: 'recharge',
    },
    rememberOrder,
    isH5Visible(),
  )
}

function onActivityReward(rawBuffer: ArrayBufferLike): void {
  if (!gameStore.isRealUser) return
  const notification = decodeTribeActivityReward(rawBuffer)
  if (!notification) return
  if (enqueueReward(receipts, notification, rememberOrder, isH5Visible())) {
    rewards.invalidate(notification.tribeId, notification.clubId)
  }
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
  stopActivityRewardListener = subscribeH5WsCode(Code.MSG_S_TRIBE_ACTIVITY_REWARD, (message) => {
    onActivityReward(message.rawBuffer)
  })
  window.addEventListener('h5:visibility-change', onH5VisibilityChange)
})

onBeforeUnmount(() => {
  stopOrderAuditListener?.()
  stopOrderAuditListener = null
  stopActivityRewardListener?.()
  stopActivityRewardListener = null
  window.removeEventListener('h5:visibility-change', onH5VisibilityChange)
  discardPending()
})
</script>

<template>
  <div v-if="current" class="reward-popup-mask" role="presentation">
    <section
      class="reward-popup"
      role="dialog"
      aria-modal="true"
      :aria-label="t('UIRechargeReward_ReceivedTitle')"
    >
      <button
        class="reward-popup__close"
        type="button"
        :aria-label="t('UIRechargeReward_Confirm')"
        @click="dismiss"
      >
        ×
      </button>

      <div class="reward-popup__success" aria-hidden="true">
        <svg viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="19" />
          <path d="m27 36 6 6 13-14" />
          <path d="M36 5v8M36 59v8M5 36h8M59 36h8M14 14l6 6M52 52l6 6M58 14l-6 6M20 52l-6 6" />
        </svg>
      </div>

      <h2 class="reward-popup__title">{{ t('UIRechargeReward_ReceivedTitle') }}</h2>
      <p class="reward-popup__description">
        {{
          t(
            current.rewardGold
              ? current.rewards.length
                ? 'UIRechargeReward_CombinedDescription'
                : 'UIRechargeReward_CoinsDescription'
              : 'UIRechargeReward_ReceivedDescription',
            t(rewardReceiptSourceKey(current)),
          )
        }}
      </p>

      <div class="reward-popup__list">
        <div v-if="current.rewardGold" class="reward-popup__item">
          <img class="reward-popup__coin-image" :src="rewardCoin" alt="" />
          <div class="reward-popup__item-copy">
            <p>
              <span>{{ t('UIChannelC_AllianceCoin') }}</span>
              <strong>+{{ current.rewardGold }}</strong>
            </p>
          </div>
        </div>
        <div
          v-for="reward in current.rewards"
          :key="`${reward.propId}-${reward.propName}`"
          class="reward-popup__item"
        >
          <img
            v-if="reward.propIcon"
            class="reward-popup__item-image"
            :src="reward.propIcon"
            alt=""
          />
          <svg v-else class="reward-popup__ticket" viewBox="0 0 48 36" aria-hidden="true">
            <path
              d="M4 7.5A3.5 3.5 0 0 1 7.5 4h33A3.5 3.5 0 0 1 44 7.5v5.1a5.6 5.6 0 0 0 0 10.8v5.1a3.5 3.5 0 0 1-3.5 3.5h-33A3.5 3.5 0 0 1 4 28.5v-5.1a5.6 5.6 0 0 0 0-10.8Z"
            />
            <path d="M24 11.5l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7Z" />
          </svg>
          <div class="reward-popup__item-copy">
            <p>
              <span>{{ displayRewardName(reward) }}</span>
              <strong>×{{ reward.quantity }}</strong>
            </p>
            <small v-if="reward.propValue > 0">
              （{{ t('UIRechargeReward_Value', reward.propValue) }}x{{ reward.quantity }}）
            </small>
          </div>
        </div>
      </div>

      <button class="reward-popup__confirm" type="button" @click="dismiss">
        {{ t('UIRechargeReward_Confirm') }}
      </button>
    </section>
  </div>
</template>

<style scoped lang="scss">
.reward-popup-mask {
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(5, 5, 8, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.reward-popup {
  position: relative;
  width: min(330px, calc(100vw - 40px));
  padding: 25px 20px 20px;
  color: #fff;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 8%, rgba(255, 202, 94, 0.16), transparent 32%),
    linear-gradient(150deg, rgba(115, 65, 94, 0.97), rgba(74, 49, 84, 0.98));
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.4),
    inset 0 1px rgba(255, 255, 255, 0.2);
}

.reward-popup__close {
  position: absolute;
  top: 10px;
  right: 14px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
  place-items: center;
  border: 0;
  background: transparent;
}

.reward-popup__success {
  width: 68px;
  height: 68px;
  margin: 0 auto 4px;
  color: #ffd665;
}

.reward-popup__success svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
}

.reward-popup__success circle {
  fill: rgba(255, 214, 101, 0.14);
  stroke-width: 5;
}

.reward-popup__success path:first-of-type {
  stroke-width: 5;
}

.reward-popup__success path:last-of-type {
  stroke-width: 3;
}

.reward-popup__title {
  margin: 0;
  font-family: var(--wallet-font-cn);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
}

.reward-popup__description {
  margin: 7px 4px 17px;
  color: rgba(255, 255, 255, 0.76);
  font-family: var(--wallet-font-cn);
  font-size: 13px;
  line-height: 1.5;
}

.reward-popup__list {
  display: flex;
  max-height: min(230px, 32vh);
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 14px 16px;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.1);
}

.reward-popup__item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.reward-popup__item + .reward-popup__item::before {
  content: '+';
  flex: 0 0 9px;
  margin-left: -10px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 16px;
  font-weight: 700;
}

.reward-popup__ticket,
.reward-popup__item-image {
  flex: 0 0 48px;
  width: 48px;
  height: 36px;
  object-fit: contain;
}

.reward-popup__coin-image {
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.reward-popup__ticket {
  fill: none;
  stroke: #ffdc69;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.reward-popup__ticket path:last-child {
  fill: rgba(255, 220, 105, 0.24);
  stroke-width: 1.5;
}

.reward-popup__item-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}

.reward-popup__item-copy p {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  margin: 0;
  font-family: var(--wallet-font-cn);
  font-size: 14px;
}

.reward-popup__item-copy p span {
  overflow-wrap: anywhere;
  white-space: normal;
}

.reward-popup__item-copy strong {
  flex: 0 0 auto;
  color: #ffe26f;
  font-size: 16px;
}

.reward-popup__item-copy small {
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.62);
  font-size: 11px;
}

.reward-popup__confirm {
  width: 100%;
  height: 48px;
  margin-top: 15px;
  color: #fff;
  font-family: var(--wallet-font-cn);
  font-size: 15px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 24px;
  background: linear-gradient(90deg, #20dfbd, #00a978);
  box-shadow: 0 7px 20px rgba(0, 169, 120, 0.24);
}

@media (max-height: 560px) {
  .reward-popup {
    padding-top: 16px;
  }

  .reward-popup__success {
    width: 52px;
    height: 52px;
  }

  .reward-popup__list {
    max-height: 145px;
  }
}
</style>

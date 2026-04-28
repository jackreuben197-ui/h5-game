<script setup lang="ts">
import { computed, ref } from 'vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import iconTicket from '@/assets/icons/icon_ticket.png'
import iconChips from '@/assets/icons/icon_chips.png'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import iconRefresh2 from '@/assets/icons/icon_refresh2.png'
import type { RoomcenterMttDetails } from '@/api/models/roomcenter'
import { t } from '@/i18n'

function fmtMoney(n: number | undefined | null): string {
  if (n == null) return '-'
  return n.toLocaleString()
}

const props = defineProps<{
  show: boolean
  mtt?: RoomcenterMttDetails
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: [payload: { ticket: boolean; ratio: number; useFree: boolean; clubId?: number }]
}>()

// 1X / 2X ratio
const ratio = ref<1 | 2>(1)

// Selected club
const selectedClubId = ref<number | undefined>(undefined)

// Use free times
const useFree = ref(false)

// Buyin type: ticket or chips
const buyinType = ref<'ticket' | 'chips'>('ticket')

// Mock club list - TODO: replace with real API data
const clubs = ref<{ id: number; name: string, gold:number }[]>([
  { id: 1, name: 'CLUB1', gold: 9999 },
  { id: 2, name: 'CLUB2', gold: 19999 },
  { id: 3, name: 'CLUB3', gold: 29999 },
  { id: 4, name: 'CLUB4', gold: 39999 },
])

/** Buyin text label for chips option */
const buyinChipsLabel = computed(() => {
  if (!props.mtt) return ''
  const ante = Number(props.mtt.ante ?? 0)
  const sb = Number(props.mtt.sb ?? 0)
  const bb = Number(props.mtt.bb ?? 0)
  return `${fmtMoney(ante)}+${fmtMoney(sb)}+${fmtMoney(bb)}`
})

/** Wallet balance - selected club's gold / 100 */
const walletBalance = computed(() => {
  if (selectedClubId.value == null) {
    // 未选俱乐部时取第一个
    const first = clubs.value[0]
    return first ? first.gold / 100 : 0
  }
  const club = clubs.value.find(c => c.id === selectedClubId.value)
  return club ? club.gold / 100 : 0
})

/** Original price (full: pool + service + hunter) */
const originalPrice = computed(() => {
  if (!props.mtt) return 0
  const pool = Number(props.mtt.apply_fee_pool ?? 0)
  const svc = Number(props.mtt.apply_fee_service ?? 0)
  const hunter = Number(props.mtt.apply_fee_hunter ?? 0)
  return (pool + svc + hunter) * ratio.value
})

/** Discount price (pool + service, no hunter) */
const discountPrice = computed(() => {
  if (!props.mtt) return 0
  const pool = Number(props.mtt.apply_fee_pool ?? 0)
  const svc = Number(props.mtt.apply_fee_service ?? 0)
  return (pool + svc) * ratio.value
})

/** Has discount (hunter fee > 0 means original is higher than discount) */
const hasDiscount = computed(() => {
  if (!props.mtt) return false
  return Number(props.mtt.apply_fee_hunter ?? 0) > 0
})

function toggleRatio(r: 1 | 2) {
  ratio.value = r
}

function selectClub(id: number) {
  selectedClubId.value = selectedClubId.value === id ? undefined : id
}

function handleConfirm() {
  emit('confirm', {
    ticket: buyinType.value === 'ticket',
    ratio: ratio.value,
    useFree: useFree.value,
    clubId: selectedClubId.value,
  })
}
</script>

<template>
  <GameDialog
    :show="show"
    :title="t('UIMTTSignDialogBuyTitle')"
    :confirm-button-text="t('UICowboy_JoinGame')"
    :close-on-click-overlay="true"
    @confirm="handleConfirm"
    @update:show="emit('update:show', $event)"
  >
    <div class="buyin-modal">
      <!-- Buyin options card -->
      <div class="buyin-options">
        <!-- Ticket option -->
        <div
          :class="['buyin-option-row', { 'buyin-option-row--active': buyinType === 'ticket' }]"
          @click="buyinType = 'ticket'"
        >
          <div class="buyin-option-label">
            <img class="buyin-option-icon" :src="iconTicket" alt="" />
            <span class="buyin-option-text">门票</span>
          </div>
          <div class="buyin-option-actions">
            <div class="ratio-toggle">
              <button
                :class="['ratio-btn', { 'ratio-btn--active': ratio === 1 }]"
                @click.stop="toggleRatio(1)"
              >
                1X
              </button>
              <button
                :class="['ratio-btn', { 'ratio-btn--active': ratio === 2 }]"
                @click.stop="toggleRatio(2)"
              >
                2X
              </button>
            </div>
            <span
              :class="['radio-circle', { 'radio-circle--checked': buyinType === 'ticket' }]"
              @click.stop="buyinType = 'ticket'"
            ></span>
          </div>
        </div>

        <!-- Chips option -->
        <div
          :class="['buyin-option-row', { 'buyin-option-row--active': buyinType === 'chips' }]"
          @click="buyinType = 'chips'"
        >
          <div class="buyin-option-label">
            <img class="buyin-option-icon" :src="iconChips" alt="" />
            <span class="buyin-option-text">{{ buyinChipsLabel }}</span>
          </div>
          <div class="buyin-option-actions">
            <div class="ratio-toggle">
              <button
                :class="['ratio-btn', { 'ratio-btn--active': ratio === 1 }]"
                @click.stop="toggleRatio(1)"
              >
                1X
              </button>
              <button
                :class="['ratio-btn', { 'ratio-btn--active': ratio === 2 }]"
                @click.stop="toggleRatio(2)"
              >
                2X
              </button>
            </div>
            <span
              :class="['radio-circle', { 'radio-circle--checked': buyinType === 'chips' }]"
              @click.stop="buyinType = 'chips'"
            ></span>
          </div>
        </div>
      </div>

      <!-- Club selection -->
      <div v-if="clubs.length > 0" class="club-section">
        <div class="club-title">{{ t('UIMatchSelectClubBuyin') }}</div>
        <div class="club-list">
          <div
            v-for="club in clubs"
            :key="club.id"
            class="club-item"
            @click="selectClub(club.id)"
          >
            <span class="club-name">{{ club.name }}</span>
            <span
              :class="['radio-circle', { 'radio-circle--checked': selectedClubId === club.id }]"
            ></span>
          </div>
        </div>
      </div>

      <!-- Wallet & Cost info -->
      <div class="cost-section">
        <div class="cost-balance">
          <div class="cost-balance-row">
            <img class="cost-icon" :src="iconChips" alt="" />
            <span class="cost-balance-num">{{ fmtMoney(walletBalance) }}</span>
            <img class="cost-refresh" :src="iconRefresh2" alt="" />
          </div>
          <div class="cost-detail">
            <span class="cost-label">{{ t('UITexasJLF') }}</span>
            <span class="cost-item">
              <img class="cost-item-icon" :src="iconDiamond" alt="" />
              <span
                v-if="hasDiscount"
                class="cost-item-value cost-item-value--original"
              >
                {{ fmtMoney(originalPrice) }}
              </span>
              <span class="cost-item-value">{{ fmtMoney(hasDiscount ? discountPrice : originalPrice) }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </GameDialog>
</template>

<style scoped lang="scss">
.buyin-modal {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.buyin-options {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.62rem;
  padding: 0.32rem 0.38rem;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.buyin-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 0.67rem;
  cursor: pointer;
}

.buyin-option-label {
  display: flex;
  align-items: center;
  gap: 0.13rem;
}

.buyin-option-icon {
  width: 0.48rem;
  height: 0.48rem;
}

.buyin-option-text {
  font-size: 0.35rem;
  font-weight: 700;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

.buyin-option-actions {
  display: flex;
  align-items: center;
  gap: 0.32rem;
}

.ratio-toggle {
  display: flex;
  gap: 0.13rem;
}

.ratio-btn {
  width: 1.12rem;
  height: 0.67rem;
  border-radius: 1.06rem;
  border: none;
  font-size: 0.32rem;
  font-weight: 500;
  font-family: 'Afacad', sans-serif;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  cursor: pointer;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.013rem;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
      rgba(255, 255, 255, 0.5) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &--active {
    background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
  }
}

.club-section {
  display: flex;
  flex-direction: column;
  gap: 0.13rem;
}

.club-title {
  font-size: 0.35rem;
  font-weight: 500;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

.club-list {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.62rem;
  padding: 0.32rem 0.38rem;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  max-height: 2.8rem;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.club-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 0.51rem;
  cursor: pointer;
}

.club-name {
  font-size: 0.35rem;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

.cost-section {
  display: flex;
  justify-content: flex-end;
}

.cost-balance {
  display: flex;
  flex-direction: column;
  gap: 0.13rem;
}

.cost-balance-row {
  display: flex;
  align-items: center;
  gap: 0.13rem;
}

.cost-icon {
  width: 0.4rem;
  height: 0.4rem;
}

.cost-balance-num {
  font-size: 0.4rem;
  font-weight: 800;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

.cost-refresh {
  width: 0.4rem;
  height: 0.4rem;
  cursor: pointer;
}

.cost-detail {
  display: flex;
  align-items: center;
  gap: 0.13rem;
}

.cost-label {
  font-size: 0.34rem;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

.cost-item {
  display: flex;
  align-items: center;
  gap: 0.05rem;
}

.cost-item-icon {
  width: 0.34rem;
  height: 0.34rem;
}

.cost-item-value {
  font-size: 0.34rem;
  font-weight: 800;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;

  &--original {
    font-weight: 400;
    text-decoration: line-through;
    opacity: 0.5;
  }
}

.buyin-confirm-btn {
  height: 1.43rem;
  font-size: 0.42rem;
  border-radius: 1.06rem;
}
</style>

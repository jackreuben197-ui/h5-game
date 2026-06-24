<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import iconChips from '@/assets/icons/wallet/ic_coins.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import {
  postOrgClubUserWalletRelationGrantApi,
  postOrgClubUserWalletRelationListApi,
} from '@/api/org'
import type { OrgClubUserWalletRelationListUserData } from '@/api/models/org'
import { useUserInfoStore } from '@/stores/userInfo'

const userInfoStore = useUserInfoStore()

const keypadOpen = ref(false)
const amount = ref('')
const relations = ref<OrgClubUserWalletRelationListUserData[]>([])
const selectedUserIds = ref<number[]>([])
const loading = ref(false)
const submitting = ref(false)

const currentClubId = computed(() => {
  const club = userInfoStore.currentClub ?? userInfoStore.clubList[0]
  return Number(club?.club_id ?? 0)
})

const maxAmount = computed(() => {
  return Math.max(0, Number(userInfoStore.userInfo?.user?.gold ?? 0))
})

const displayMaxAmount = computed(() => maxAmount.value.toLocaleString())

const displayAmount = computed(() => {
  const raw = Number(amount.value || 0)
  return raw > 0 ? raw.toLocaleString() : '0'
})

const canSubmit = computed(() => {
  const n = Number(amount.value)
  return n > 0 && selectedUserIds.value.length > 0 && !submitting.value
})

function isSelected(userId: number): boolean {
  return selectedUserIds.value.includes(userId)
}

function toggleUser(userId: number): void {
  if (isSelected(userId)) {
    selectedUserIds.value = selectedUserIds.value.filter((id) => id !== userId)
    return
  }
  selectedUserIds.value = [...selectedUserIds.value, userId]
}

function onAmountSubmit(value: number): void {
  amount.value = String(value)
  keypadOpen.value = false
}

async function loadRelations(): Promise<void> {
  loading.value = true
  try {
    const res = await postOrgClubUserWalletRelationListApi({
      limit: 50,
      offset: 0,
      club_id: currentClubId.value || undefined,
    })

    if (res.code !== 0) {
      showFailToast(res.message || '获取玩家列表失败')
      relations.value = []
      return
    }

    relations.value = res.data?.data ?? []
  } catch {
    showFailToast('获取玩家列表失败')
    relations.value = []
  } finally {
    loading.value = false
  }
}

async function submitGift(): Promise<void> {
  const n = Number(amount.value)
  if (!n || n <= 0) {
    showFailToast('请输入赠送金额')
    return
  }

  if (!selectedUserIds.value.length) {
    showFailToast('请选择赠送玩家')
    return
  }

  if (n > maxAmount.value) {
    showFailToast('赠送金额超过余额')
    return
  }

  submitting.value = true
  try {
    const amountInCent = Math.round(n * 100)
    const res = await postOrgClubUserWalletRelationGrantApi({
      user_ids: selectedUserIds.value,
      amount: amountInCent,
      gold_type: 1,
    })

    if (res.code !== 0) {
      showFailToast(res.message || '赠送失败')
      return
    }

    showSuccessToast('赠送成功')
    amount.value = ''
    selectedUserIds.value = []
    await loadRelations()
  } catch {
    showFailToast('赠送失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void loadRelations()
})
</script>

<template>
  <div class="gift-page" :style="{ backgroundImage: `url(${mainBgUrl})` }">
    <HeaderBack title="赠送" extra-padding />

    <div class="gift-content">
      <p class="max-amount">最大赠送金额: {{ displayMaxAmount }}</p>

      <button class="amount-input" @click="keypadOpen = true">
        <img :src="iconChips" alt="chips" class="amount-input__icon" />
        <span class="amount-input__value">{{ displayAmount }}</span>
      </button>

      <div class="player-list">
        <div v-if="loading" class="list-state">加载中...</div>
        <div v-else-if="!relations.length" class="list-state">暂无可赠送玩家</div>
        <template v-else>
          <button
            v-for="item in relations"
            :key="item.user_id"
            class="player-item"
            @click="toggleUser(item.user_id)"
          >
            <div class="player-item__main">
              <img :src="item.avatar || ''" alt="avatar" class="player-item__avatar" />
              <div class="player-item__meta">
                <p class="player-item__name">{{ item.nickname || '-' }}</p>
                <p class="player-item__id">ID {{ item.random_id }}</p>
              </div>
            </div>
            <span
              :class="[
                'player-item__check',
                { 'player-item__check--on': isSelected(item.user_id) },
              ]"
            >
              <span v-if="isSelected(item.user_id)">✓</span>
            </span>
          </button>
        </template>
      </div>

      <button class="submit-btn" :disabled="!canSubmit" @click="submitGift">
        {{ submitting ? '提交中...' : 'OK' }}
      </button>
    </div>

    <NumericKeypad
      :open="keypadOpen"
      :show-input-area="true"
      title="赠送金额"
      confirm-text="确定"
      :min="1"
      :max="Math.max(maxAmount, 1)"
      :initial-value="amount"
      @close="keypadOpen = false"
      @submit="onAmountSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.gift-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #fff;
}

.gift-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.36rem 0.64rem calc(env(safe-area-inset-bottom) + 0.5rem);
}

.max-amount {
  margin: 0 0 0.2rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.36rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.94);
}

.amount-input {
  border: none;
  width: 100%;
  height: 1.66rem;
  border-radius: 0.84rem;
  padding: 0 0.42rem;
  display: flex;
  align-items: center;
  gap: 0.24rem;
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
}

.amount-input__icon {
  width: 0.8rem;
  height: 0.8rem;
  object-fit: contain;
}

.amount-input__value {
  font-family: 'Afacad', sans-serif;
  font-weight: 500;
  font-size: 0.72rem;
  line-height: 1;
}

.player-list {
  margin-top: 0.42rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
}

.player-list::-webkit-scrollbar {
  width: 0;
}

.list-state {
  padding: 0.4rem 0;
  text-align: center;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.32rem;
  color: rgba(255, 255, 255, 0.78);
}

.player-item {
  border: none;
  width: 100%;
  min-height: 1.38rem;
  padding: 0.2rem 0.34rem;
  border-radius: 0.9rem;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}

.player-item__main {
  display: flex;
  align-items: center;
  gap: 0.24rem;
}

.player-item__avatar {
  width: 0.94rem;
  height: 0.94rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.player-item__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.08rem;
}

.player-item__name {
  margin: 0;
  font-family: 'HONOR Sans CN', sans-serif;
  font-size: 0.46rem;
  font-weight: 500;
  line-height: 1.1;
}

.player-item__id {
  margin: 0;
  font-family: var(--wallet-font-num);
  font-size: 0.25rem;
  color: rgba(255, 255, 255, 0.74);
  line-height: 1;
}

.player-item__check {
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 50%;
  border: 0.03rem solid rgba(255, 255, 255, 0.55);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.3rem;
  font-weight: 700;
  flex-shrink: 0;
}

.player-item__check--on {
  border-color: rgba(85, 243, 41, 1);
  background: rgba(85, 243, 41, 1);
  color: #052319;
}

.submit-btn {
  margin-top: 0.28rem;
  width: 100%;
  height: 1.44rem;
  border: 0;
  border-radius: 1.04rem;
  font-family: 'Afacad', sans-serif;
  font-size: 0.5rem;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(120deg, rgba(85, 243, 41, 1) 0%, #029d75 100%);
}

.submit-btn:disabled {
  opacity: 0.45;
}
</style>

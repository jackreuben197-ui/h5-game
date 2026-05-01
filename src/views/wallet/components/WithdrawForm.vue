<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import icRoundedArrowRight from '@/assets/icons/wallet/ic_rounded_arrow_right.svg'
import icDropdown from '@/assets/icons/wallet/ic_dropdown.svg'
import sharpBgUrl from '@/assets/images/wallet/bg_sharp.webp'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import { t } from '@/i18n'
import { postOnlineWithdrawTypeListApi } from '@/api/config'
import { postTiquGoldApi } from '@/api/order'
import type { OnlineWithdrawTypeItem } from '@/api/models/config'
import { useUserInfoStore } from '@/stores/userInfo'

const userInfoStore = useUserInfoStore()
const availableUc = computed(() => userInfoStore.userInfo?.user?.gold ?? 0)

const withdrawTypes = ref<OnlineWithdrawTypeItem[]>([])
const selectedTypeIndex = ref(0)
const selectedType = computed(() => withdrawTypes.value[selectedTypeIndex.value] ?? null)

const recipient = ref('')
const remark = ref('')
const amount = ref('')
const submitting = ref(false)

const editPopupOpen = ref(false)
const editRecipient = ref('')
const editRemark = ref('')
const editTypeIndex = ref(0)

onMounted(async () => {
  const res = await postOnlineWithdrawTypeListApi()
  withdrawTypes.value = res.data?.list ?? []
  if (withdrawTypes.value.length > 0) {
    recipient.value = withdrawTypes.value[0].name ?? ''
  }
})

function openEditPopup(): void {
  editRecipient.value = recipient.value
  editRemark.value = remark.value
  editTypeIndex.value = selectedTypeIndex.value
  editPopupOpen.value = true
}

function cycleType(): void {
  if (withdrawTypes.value.length === 0) return
  editTypeIndex.value = (editTypeIndex.value + 1) % withdrawTypes.value.length
  editRecipient.value = withdrawTypes.value[editTypeIndex.value].name ?? ''
}

function confirmEdit(): void {
  selectedTypeIndex.value = editTypeIndex.value
  recipient.value = editRecipient.value
  remark.value = editRemark.value
  editPopupOpen.value = false
}

async function handleSubmit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    await postTiquGoldApi({
      amount: Number(amount.value),
      gold_type: 1,
      pay_id: selectedType.value?.id,
      description: remark.value,
    })
    showToast(t('Wallet_SubmitWithdraw'))
    amount.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="wf">
    <div class="wf__card">
      <div class="wf__field">
        <div class="wf__label">{{ $txt('Wallet_RecipientLabel') }}</div>
        <div class="wf__row">
          <div class="wf__input wf__input--select">
            <span class="wf__input-text">{{ recipient || 'USDT' }}</span>
          </div>
          <button
            class="wf__pill"
            @click="openEditPopup"
          >
            <span>{{ $txt('Wallet_GoEdit') }}</span>
            <img
              :src="icRoundedArrowRight"
              alt=""
              class="wf__pill-icon"
            />
          </button>
        </div>
      </div>

      <div class="wf__field">
        <div class="wf__label">{{ $txt('Wallet_RemarkLabel') }}</div>
        <div class="wf__input">
          <input
            v-model="remark"
            type="text"
            class="wf__input-native"
            placeholder="**************"
          />
        </div>
      </div>
    </div>

    <div class="wf__card">
      <div class="wf__balance">
        <span class="wf__balance-label">{{ t('Wallet_AvailableUc', String(availableUc)) }}</span>
      </div>

      <div class="wf__input">
        <input
          v-model="amount"
          type="text"
          inputmode="numeric"
          class="wf__input-native wf__input-native--center"
          :placeholder="$txt('Wallet_InputPlaceholder')"
        />
      </div>
      <div class="wf__rate">{{ selectedType ? `1USDT=${selectedType.rate ?? 1}UC` : t('Wallet_Rate') }}</div>
    </div>

    <PrimaryButton
      :text="$txt('Wallet_SubmitWithdraw')"
      :disabled="submitting"
      @click="handleSubmit"
    />
  </div>

  <Teleport to="body">
    <Transition name="wf-sheet">
      <div
        v-if="editPopupOpen"
        class="wf__overlay"
        :style="{ backgroundImage: `url(${sharpBgUrl})` }"
        @click.self="editPopupOpen = false"
      >
        <div
          class="wf__sheet"
          :style="{ backgroundImage: `url(${sharpBgUrl})` }"
        >
          <div class="wf__sheet-title">{{ $txt('Wallet_OrdersTitle') }}</div>

          <div class="wf__sheet-field">
            <div class="wf__sheet-label">{{ $txt('Wallet_RecipientLabel') }}:</div>
            <div class="wf__sheet-input">
              <span class="wf__sheet-input-text">{{ editRecipient || 'USDT' }}</span>
              <button class="wf__sheet-dropdown" @click="cycleType">
                <img :src="icDropdown" alt="" class="wf__sheet-dropdown-icon" />
              </button>
            </div>
          </div>

          <div class="wf__sheet-field">
            <div class="wf__sheet-label">{{ $txt('Wallet_RemarkLabel') }}:</div>
            <div class="wf__sheet-input">
              <input
                v-model="editRemark"
                type="text"
                class="wf__sheet-input-native"
                :placeholder="$txt('Wallet_RemarkPlaceholder')"
              />
            </div>
          </div>

          <PrimaryButton
            :text="$txt('Save')"
            @click="confirmEdit"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.wf {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  width: 100%;
}

.wf__card {
  position: relative;
  padding: 0.55rem 0.42rem;
  background: rgba(0, 0, 0, 0.01);
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  border: 0.18px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  overflow: hidden;
  z-index: 1;
}

.wf__card::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(16.6px);
  -webkit-backdrop-filter: blur(16.6px);
  background-image: linear-gradient(
    110.6deg,
    rgba(249, 249, 249, 0.18) 12%,
    rgba(249, 249, 249, 0.24) 33%,
    rgba(147, 147, 147, 0.3) 85%
  );
  mix-blend-mode: hard-light;
  pointer-events: none;
  border-radius: inherit;
  z-index: 0;
}

.wf__card > * {
  position: relative;
  z-index: 1;
}

.wf__card:first-child {
  margin-top: -20px;
}

.wf__field {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.wf__label {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.285rem;
  color: #f9f9f9;
  padding-left: 0.1rem;
}

.wf__row {
  display: flex;
  gap: 0.13rem;
  align-items: center;
}

.wf__input {
  flex: 1;
  min-width: 0;
  background: rgba(0, 0, 0, 0.26);
  border-radius: 0.6rem;
  padding: 0.36rem 0.28rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.2rem;
}

.wf__input--select {
  cursor: pointer;
}

.wf__input-text {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.4;
}

.wf__input-native {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  color: #fff;
  text-align: center;
}

.wf__input-native::placeholder {
  color: rgba(255, 255, 255, 0.65);
}

.wf__pill {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.19rem 0.19rem 0.19rem 0.33rem;
  background: rgba(255, 255, 255, 0.2);
  border: 0.4px solid rgba(242, 242, 242, 0.4);
  border-radius: 1.37rem;
  box-shadow: 0.8px 1px 1.6px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.wf__pill span {
  font-family: var(--wallet-font-num);
  font-weight: 510;
  font-size: 0.32rem;
  color: #fff;
  line-height: 1.4;
}

.wf__pill-icon {
  width: 0.38rem;
  height: 0.38rem;
}

.wf__balance {
  display: flex;
  justify-content: center;
  padding: 0.26rem 0.4rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.8rem;
}

.wf__balance-label {
  font-family: var(--wallet-font-cn);
  font-weight: 600;
  font-size: 0.415rem;
  color: #fff;
  line-height: 1.4;
}

.wf__input-native--center {
  text-align: center;
}

.wf__rate {
  text-align: center;
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.29rem;
  color: #fff;
  line-height: 1.2;
}

.wf__overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    backdrop-filter: blur(34px);
    -webkit-backdrop-filter: blur(34px);
    background: rgba(12, 12, 12, 0.60);
  }
}

.wf__sheet {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 0.32rem 0.455rem calc(env(safe-area-inset-bottom) + 0.64rem);
  border-radius: 0.96rem 0.96rem 0 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(0, 0, 0, 0.70);
    backdrop-filter: blur(7.6px);
    -webkit-backdrop-filter: blur(7.6px);
    pointer-events: none;
    z-index: 0;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 0.027rem 0 0;
    background: linear-gradient(180deg, rgba(242, 242, 242, 0.40) 0%, rgba(255, 255, 255, 0) 40%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
  }

  & > * {
    position: relative;
    z-index: 3;
  }
}

.wf__sheet-title {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.453rem;
  color: #fff;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 0.08rem;
}

.wf__sheet-field {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
}

.wf__sheet-label {
  font-family: var(--wallet-font-cn);
  font-weight: 400;
  font-size: 0.285rem;
  color: #f9f9f9;
  padding-left: 0.1rem;
}

.wf__sheet-row {
  display: flex;
  align-items: center;
  gap: 0.21rem;
}

.wf__sheet-input {
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.20);
  border-radius: 0.6rem;
  padding: 0.36rem 0.4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 1.2rem;
}

.wf__sheet-input-text {
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  color: rgba(255, 255, 255, 0.65);
}

.wf__sheet-input-native {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--wallet-font-cn);
  font-weight: 500;
  font-size: 0.4rem;
  color: #fff;

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }
}

.wf__sheet-dropdown {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  .wf__sheet-dropdown-icon {
    width: 0.427rem;
    height: 0.427rem;
  }
}

.wf-sheet-enter-active,
.wf-sheet-leave-active {
  transition: opacity 0.25s ease;

  .wf__sheet {
    transition: transform 0.25s ease;
  }
}

.wf-sheet-enter-from,
.wf-sheet-leave-to {
  opacity: 0;

  .wf__sheet {
    transform: translateY(100%);
  }
}
</style>

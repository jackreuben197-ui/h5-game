<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import { postOrgChangeClubDataApi } from '@/api/org'
import { useAppConfigStore } from '@/stores/appConfig'
import { useUserInfoStore } from '@/stores/userInfo'
import { showFailToast, showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const router = useRouter()
const userInfoStore = useUserInfoStore()
const appConfigStore = useAppConfigStore()

const nameInput = ref(String(userInfoStore.currentClub?.club_name || '').trim())
const isSubmitting = ref(false)

const maxNameLength = 10

interface UpdateClubNameConfig {
  interval: number
  first_free: number
  price: number
}

function parseUpdateClubNameConfig(raw: unknown): UpdateClubNameConfig {
  if (typeof raw !== 'string' || !raw.trim()) {
    return {
      interval: 0,
      first_free: 2,
      price: 0,
    }
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const interval = Number(parsed.interval ?? 0)
    const firstFree = Number(parsed.first_free ?? 2)
    const price = Number(parsed.price ?? 0)

    return {
      interval: Number.isFinite(interval) && interval > 0 ? Math.floor(interval) : 0,
      first_free: firstFree === 1 ? 1 : 2,
      price: Number.isFinite(price) && price > 0 ? Math.floor(price) : 0,
    }
  } catch {
    return {
      interval: 0,
      first_free: 2,
      price: 0,
    }
  }
}

const renameRule = computed(() => {
  return parseUpdateClubNameConfig(appConfigStore.globalConfig?.update_club_name_config)
})

const isFirstUpdateName = computed(() => {
  return Number(userInfoStore.currentClub?.first_update_name ?? 2) === 1
})

const renameCost = computed(() => {
  if (renameRule.value.first_free === 1 && isFirstUpdateName.value) {
    return 0
  }
  return renameRule.value.price
})

const diamondBalance = computed(() => {
  const value = Number(userInfoStore.userInfo?.user?.diamonds ?? 0)
  return Number.isFinite(value) && value > 0 ? value : 0
})

const hasEnoughDiamond = computed(() => {
  return diamondBalance.value >= renameCost.value
})

const remainingIntervalHours = computed(() => {
  const intervalHours = renameRule.value.interval
  if (intervalHours <= 0) {
    return 0
  }

  const lastUpdateTime = String(userInfoStore.currentClub?.last_update_name_time || '').trim()
  if (!lastUpdateTime) {
    return 0
  }

  const lastUpdateMs = Date.parse(lastUpdateTime)
  if (!Number.isFinite(lastUpdateMs) || lastUpdateMs <= 0) {
    return 0
  }

  const remainMs = lastUpdateMs + intervalHours * 60 * 60 * 1000 - Date.now()
  if (remainMs <= 0) {
    return 0
  }

  return Math.ceil(remainMs / (60 * 60 * 1000))
})

const canUpdateByInterval = computed(() => {
  return remainingIntervalHours.value <= 0
})

const renameHintText = computed(() => {
  const price = renameRule.value.price
  const firstFreeText = renameRule.value.first_free === 1 ? '首次修改免费' : '首次修改不免费'
  const costText = `后续每次消耗${price}钻石`
  const intervalText =
    renameRule.value.interval > 0 ? `，每次间隔${renameRule.value.interval}小时` : ''
  return `*${firstFreeText}，${costText}${intervalText}`
})

const nameLength = computed(() => {
  return nameInput.value.trim().length
})

const canConfirm = computed(() => {
  return nameLength.value > 0 && !isSubmitting.value && canUpdateByInterval.value
})

function goRecharge(): void {
  void router.push('/mine/shop')
}

async function onConfirm(): Promise<void> {
  if (!canConfirm.value) {
    if (!canUpdateByInterval.value) {
      showFailToast(`请在${remainingIntervalHours.value}小时后再修改`)
    }
    return
  }

  if (!hasEnoughDiamond.value) {
    showFailToast('钻石余额不足，请前往充值')
    goRecharge()
    return
  }

  const clubId = Number(userInfoStore.currentClub?.club_id)
  if (!clubId) {
    showFailToast('未找到俱乐部信息')
    return
  }

  isSubmitting.value = true

  try {
    const response = await postOrgChangeClubDataApi({
      club_id: clubId,
      club_name: nameInput.value.trim(),
    })

    if (response.code !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : '修改名称失败')
    }

    userInfoStore.syncCurrentClubFields({
      club_name: nameInput.value.trim(),
      first_update_name: 2,
      last_update_name_time: new Date().toISOString(),
    })

    showSuccessToast('修改成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : '修改名称失败'
    showFailToast(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page-shell club-edit-name-bg" :style="backgroundStyle">
    <div class="club-edit-name">
      <HeaderBack :title="'修改名称'" />

      <section class="editor-block">
        <div class="hint-row">
          <p class="hint-text">{{ renameHintText }}</p>
          <span class="count-text">{{ nameLength }}/{{ maxNameLength }}</span>
        </div>

        <div class="name-shell">
          <input
            v-model.trim="nameInput"
            type="text"
            :maxlength="maxNameLength"
            placeholder="Name here"
            autocomplete="off"
          />
        </div>

        <div class="wallet-row">
          <div class="wallet-info">
            <img :src="imgDiamond" alt="钻石" />
            <span class="wallet-label">钻石余额:</span>
            <span class="wallet-value">{{ diamondBalance }}</span>
          </div>
          <button type="button" class="recharge-btn" @click="goRecharge">去充值</button>
        </div>
      </section>

      <section class="footer-actions">
        <p class="cost-line" aria-label="改名消耗说明">
          <span>消费</span>
          <img :src="imgDiamond" alt="钻石" />
          <span class="cost-value">{{ renameCost }}</span>
        </p>

        <p v-if="!canUpdateByInterval" class="interval-line">
          距离下次可修改还需 {{ remainingIntervalHours }} 小时
        </p>

        <button
          type="button"
          class="confirm-btn"
          :class="{ 'confirm-btn--disabled': !canConfirm }"
          :disabled="!canConfirm"
          @click="onConfirm"
        >
          {{ isSubmitting ? '提交中...' : '确定' }}
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-edit-name-bg {
  position: relative;
  height: 100dvh;
  background-size: cover;
}

.club-edit-name {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  gap: 0.18rem;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
  padding-bottom: calc(0.2rem + env(safe-area-inset-bottom));
}

.editor-block {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  padding-top: 0.06rem;
}

.hint-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.12rem;
}

.hint-text {
  margin: 0;
  font-size: 0.35rem;
  line-height: 1.35;
  color: #f3f3f3;
  font-weight: 500;
}

.count-text {
  font-size: 0.32rem;
  line-height: 1;
  color: rgba(243, 243, 243, 0.95);
  white-space: nowrap;
}

.name-shell {
  min-height: 1.66rem;
  border: 0.01rem solid rgba(249, 249, 249, 0.58);
  border-radius: 1.48rem;
  padding: 0 0.56rem;
  background:
    radial-gradient(90% 120% at 6% 50%, rgba(255, 201, 161, 0.45), rgba(255, 201, 161, 0)),
    radial-gradient(85% 120% at 64% 48%, rgba(186, 78, 157, 0.36), rgba(186, 78, 157, 0)),
    rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(0.3rem);
  display: flex;
  align-items: center;
}

input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.39rem;
  line-height: 1.4;
  font-weight: 500;
  color: #f9f9f9;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.71);
}

.wallet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.16rem;
}

.wallet-info {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;
  min-width: 0;
}

.wallet-info img {
  width: 0.4rem;
  height: 0.32rem;
  object-fit: contain;
}

.wallet-label {
  font-size: 0.36rem;
  line-height: 1;
  color: #f9f9f9;
}

.wallet-value {
  font-size: 0.36rem;
  line-height: 1;
  font-weight: 700;
  color: #05e7ae;
}

.recharge-btn {
  border: 0;
  padding: 0 0.27rem;
  min-height: 0.3rem;
  border-radius: 0.72rem;
  font-size: 0.3rem;
  line-height: 1;
  color: #f1f1f1;
  background: rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(0.08rem);
}

.footer-actions {
  margin-top: auto;
  padding: 0 0.06rem;
  padding-bottom: 0.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.16rem;
}

.cost-line {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.36rem;
  line-height: 1;
  color: #f9f9f9;
}

.cost-line img {
  width: 0.4rem;
  height: 0.32rem;
  object-fit: contain;
}

.cost-value {
  color: #05e7ae;
  font-weight: 700;
}

.interval-line {
  margin: 0;
  font-size: 0.3rem;
  line-height: 1.3;
  color: rgba(255, 235, 189, 0.95);
}

.confirm-btn {
  width: 100%;
  min-height: 1.44rem;
  border: 0;
  border-radius: 1.06rem;
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
  color: #f9f9f9;
  font-size: 0.51rem;
  font-weight: 500;
  box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.2);
  transition: opacity 0.2s ease;
}

.confirm-btn--disabled {
  opacity: 0.56;
}

@media (max-width: 340px) {
  .hint-text,
  .count-text {
    font-size: 0.28rem;
  }

  .confirm-btn {
    font-size: 0.44rem;
  }
}
</style>

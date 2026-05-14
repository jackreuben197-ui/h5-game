<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import { postOrgChangeClubDataApi } from '@/api/org'
import { useUserInfoStore } from '@/stores/userInfo'
import { showFailToast, showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const router = useRouter()
const userInfoStore = useUserInfoStore()

const nameInput = ref(String(userInfoStore.currentClub?.club_name || '').trim())
const isSubmitting = ref(false)

const maxNameLength = 10
const diamondBalance = computed(() => Number(userInfoStore.currentClub?.user_gold || 0))
const renameCost = 12345

const nameLength = computed(() => {
  return nameInput.value.trim().length
})

const canConfirm = computed(() => {
  return nameLength.value > 0 && !isSubmitting.value
})

function goRecharge(): void {
  void router.push('/recharge')
}

async function onConfirm(): Promise<void> {
  if (!canConfirm.value) {
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

    if (userInfoStore.currentClub) {
      userInfoStore.setCurrentClub({
        ...userInfoStore.currentClub,
        club_name: nameInput.value.trim(),
      })
    }

    showSuccessToast('修改成功')
    await router.push('/club/detail')
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
    <div class="bg-blur bg-blur--pink" aria-hidden="true"></div>
    <div class="bg-blur bg-blur--cyan" aria-hidden="true"></div>

    <div class="club-edit-name">
      <HeaderBack :title="'修改名称'" />

      <section class="editor-block">
        <div class="hint-row">
          <p class="hint-text">*首次更改昵称免费,之后每次消耗0钻石</p>
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

.bg-blur {
  position: absolute;
  border-radius: 999px;
  filter: blur(1rem);
  opacity: 0.54;
  pointer-events: none;
}

.bg-blur--pink {
  width: 2.7rem;
  height: 2.7rem;
  left: -0.9rem;
  top: 4.1rem;
  background: rgba(224, 52, 127, 0.52);
}

.bg-blur--cyan {
  width: 3rem;
  height: 3rem;
  right: -1.1rem;
  bottom: 1.2rem;
  background: rgba(42, 222, 255, 0.55);
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

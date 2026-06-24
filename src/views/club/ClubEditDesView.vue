<script setup lang="ts">
import { computed, ref } from 'vue'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { postOrgClubModifyClubDescApi } from '@/api/org'
import { useUserInfoStore } from '@/stores/userInfo'
import { showFailToast, showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { t } from '@/i18n'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const userInfoStore = useUserInfoStore()

const intro = ref(String(userInfoStore.currentClub?.desc || '').trim())
const isSubmitting = ref(false)

const canConfirm = computed(() => {
  return intro.value.trim().length > 0 && !isSubmitting.value
})

async function onConfirm(): Promise<void> {
  if (!canConfirm.value) {
    return
  }

  const clubId = Number(userInfoStore.currentClub?.club_id)
  if (!clubId) {
    showFailToast(t('UIClub_NotFoundClub'))
    return
  }

  isSubmitting.value = true

  try {
    const response = await postOrgClubModifyClubDescApi({
      club_id: clubId,
      desc: intro.value.trim(),
    })

    if (response.code !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : t('UIClub_DescriFail'))
    }

    if (userInfoStore.currentClub) {
      userInfoStore.syncCurrentClubDesc(intro.value.trim())
    }

    showSuccessToast(t('adaptation10079'))
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_DescriFail')
    showFailToast(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page-shell club-edit-des-bg" :style="backgroundStyle">
    <HeaderBack :title="'编辑简介'" />

    <div class="club-edit-des">
      <section class="editor-block">
        <label class="field-label" for="club-intro-edit-input">
          {{ t('UIClub_Creat_ZizEgnjo') }}
        </label>
        <div class="field-shell">
          <textarea
            id="club-intro-edit-input"
            v-model.trim="intro"
            maxlength="300"
            :placeholder="t('UIClub_PleaseDescri')"
          ></textarea>
        </div>
      </section>

      <section class="footer-actions">
        <button
          type="button"
          class="confirm-btn"
          :class="{ 'confirm-btn--disabled': !canConfirm }"
          :disabled="!canConfirm"
          @click="onConfirm"
        >
          {{ isSubmitting ? t('UIClub_Submitting') + '...' : t('CommitOK') }}
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-edit-des-bg {
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

.club-edit-des {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  gap: 0.22rem;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
}

.top-bar {
  min-height: 0.7rem;
  display: flex;
  align-items: center;
  padding-left: 0.32rem;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #f9f9f9;
  display: inline-flex;
  align-items: center;
  gap: 0.16rem;
  padding: 0;
}

.back-icon {
  width: 0.18rem;
  height: 0.18rem;
  border-left: 0.03rem solid rgba(249, 249, 249, 0.95);
  border-bottom: 0.03rem solid rgba(249, 249, 249, 0.95);
  transform: rotate(45deg);
}

.back-title {
  font-size: 0.65rem;
  line-height: 1.2;
  font-weight: 500;
}

.editor-block {
  display: flex;
  flex-direction: column;
  gap: 0.43rem;
  padding-top: 0.06rem;
}

.field-label {
  font-size: 0.48rem;
  line-height: 1.4;
  font-weight: 500;
  color: #f7f7f7;
}

.field-shell {
  min-height: 6.32rem;
  border: 0.01rem solid rgba(249, 249, 249, 0.58);
  border-radius: 0.72rem;
  padding: 0.54rem 0.54rem;
  background:
    radial-gradient(90% 70% at 14% 20%, rgba(255, 199, 160, 0.46), rgba(255, 199, 160, 0)),
    radial-gradient(82% 74% at 64% 49%, rgba(185, 76, 157, 0.4), rgba(185, 76, 157, 0)),
    radial-gradient(82% 78% at 86% 75%, rgba(121, 146, 206, 0.38), rgba(121, 146, 206, 0)),
    rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(0.3rem);
  overflow: hidden;
}

textarea {
  width: 100%;
  min-height: 5.78rem;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.39rem;
  line-height: 1.4;
  font-weight: 500;
  color: #f9f9f9;
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.71);
}

.footer-actions {
  margin-top: 1rem;
  padding: 0 0.06rem;
  padding-bottom: 0.1rem;
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
  .back-title {
    font-size: 0.54rem;
  }

  .field-label {
    font-size: 0.4rem;
  }

  .confirm-btn {
    font-size: 0.44rem;
  }
}
</style>

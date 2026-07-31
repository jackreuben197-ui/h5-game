<script setup lang="ts">
import { computed, ref } from 'vue'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
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
        <PrimaryButton
          :text="t('CommitOK')"
          :loading="isSubmitting"
          :disabled="!canConfirm"
          @click="onConfirm"
        />
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
  padding-top: calc(var(--app-top-padding) + var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.2rem);
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
  // min-height: 6.32rem;
  // border-radius: 0.72rem;
  // padding: 0.5405rem;
  // background: linear-gradient(99.84deg, rgba(255, 255, 255, 0.1) 21.1%, rgba(230, 230, 230, 0.1) 71.4%);
  // backdrop-filter: blur(0.004rem);
  margin-top: 0.18rem;
  width: 100%;
  height: 6.3rem;
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  color: #fff;
  font-size: 0.42rem;
  padding: 0.34rem;
  resize: none;
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

.footer-actions :deep(.primary-btn) {
  background: linear-gradient(
    97deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  ) !important;
}

@media (max-width: 340px) {
  .back-title {
    font-size: 0.54rem;
  }

  .field-label {
    font-size: 0.4rem;
  }
}
</style>

<style lang="scss">
:root[data-theme='light'] .club-edit-des-bg {
  background-image: url('@/assets/images/main_bg_light.webp') !important;

  .back-trigger,
  .back-icon {
    color: rgba(15, 8, 8, 0.85);
  }

  .title {
    color: rgba(15, 8, 8, 0.85);
    text-shadow: none;
  }

  .field-label {
    color: rgba(15, 8, 8, 0.85);
    font-weight: 600;
  }

  .field-shell {
    background: rgba(255, 255, 255, 1);
    border: 0.0213rem solid rgba(0, 0, 0, 0.08);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  textarea {
    color: rgba(15, 8, 8, 0.85);

    &::placeholder {
      color: rgba(15, 8, 8, 0.45);
    }
  }

  .footer-actions .primary-btn {
    background: #05c297 !important;
    border-color: transparent;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    color: #fbfbfb;
  }
}
</style>

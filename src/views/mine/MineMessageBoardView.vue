<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { postMiscReportFeedbackQuestIonApi } from '@/api/misc'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t } from '@/i18n'

const title = computed(() => t('PageMineMessageBoard'))

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const content = ref('')
const submitting = ref(false)

async function submitMessage(): Promise<void> {
  const description = content.value.trim()
  if (!description) {
    showFailToast(t('UIClub_Please3'))
    return
  }

  submitting.value = true
  try {
    const response = await postMiscReportFeedbackQuestIonApi({
      title: 'H5' + t('UIClub_Text60'),
      description,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('Uiwithdrawfailed'))
    }
    showSuccessToast(t('Uiwithdrawsuccessfully'))
    content.value = ''
  } catch (error) {
    const message = error instanceof Error ? error.message : t('Uiwithdrawfailed')
    showFailToast(message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-shell mine-glass-page board-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <p class="tip">{{ t('UIClub_Of3') }}</p>

      <textarea
        v-model="content"
        class="board-input"
        maxlength="1000"
        :placeholder="t('UIClub_Of2')"
      ></textarea>

      <button class="submit-btn" type="button" :disabled="submitting" @click="submitMessage">
        {{ submitting ? t('UIClub_Submitting') + '...' : t('sr_r9ccGtey') }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  height: 100dvh;
  color: #f3f3f3;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.board-page {
  display: flex;
  flex-direction: column;
  // padding-top: calc(env(safe-area-inset-top) + 0.46rem);
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.7rem);
}

.content-wrap {
  padding: 0 0.45rem;
}

.tip {
  margin: 0.24rem 0 0;
  font-size: 0.31rem;
}

.board-input {
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

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
}

.submit-btn {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 1rem);
  left: 0.45rem;
  right: 0.45rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.1);
  border-radius: 0.8rem;
  height: 1.12rem;
  color: #fff;
  font-size: 0.5rem;
  background: rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  width: auto;
}
</style>

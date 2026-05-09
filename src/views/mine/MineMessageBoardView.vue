<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { postMiscReportFeedbackQuestIonApi } from '@/api/misc'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const title = computed(() => '留言板')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const content = ref('')
const submitting = ref(false)

async function submitMessage(): Promise<void> {
  const description = content.value.trim()
  if (!description) {
    showFailToast('请先填写反馈内容')
    return
  }

  submitting.value = true
  try {
    const response = await postMiscReportFeedbackQuestIonApi({
      title: 'H5游戏反馈',
      description,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '提交失败')
    }
    showSuccessToast('提交成功')
    content.value = ''
  } catch (error) {
    const message = error instanceof Error ? error.message : '提交失败'
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
      <p class="tip">请在此处留言您的反馈</p>

      <textarea
        v-model="content"
        class="board-input"
        maxlength="1000"
        placeholder="在此输入您的反馈"
      ></textarea>

      <button
        class="submit-btn"
        type="button"
        :disabled="submitting"
        @click="submitMessage"
      >
        {{ submitting ? '提交中...' : '提交' }}
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
  padding-top: calc(env(safe-area-inset-top) + 0.46rem);
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
  border-radius: 0.54rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.35);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(0.3rem);
  color: #fff;
  font-size: 0.42rem;
  padding: 0.34rem;
  resize: none;
}

.submit-btn {
  margin-top: 1rem;
  border: 0;
  border-radius: 0.56rem;
  height: 1.12rem;
  color: #fbfbfb;
  font-size: 0.5rem;
  background: linear-gradient(165deg, #05e7ae 8%, #027a5c 72%);
  width: 100%;
}
</style>

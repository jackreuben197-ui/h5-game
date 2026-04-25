<script setup lang="ts">
import { ref } from 'vue'
import { showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()
const content = ref('')

function goBack(): void {
  void router.push('/mine')
}

function submitMessage(): void {
  showSuccessToast('提交成功')
  content.value = ''
}
</script>

<template>
  <div class="mine-glass-page board-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>留言板</h1>
      <div class="placeholder" />
    </header>

    <p class="tip">请此处留言您的反馈</p>

    <textarea
      v-model="content"
      class="board-input"
      maxlength="250"
      placeholder="Type here"
    />

    <button class="submit-btn" type="button" @click="submitMessage">Submit Report</button>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  min-height: 100dvh;
  color: #f3f3f3;
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.6) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 25% 85%, rgba(206, 107, 160, 0.6) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.58) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
}

.board-page {
  display: flex;
  flex-direction: column;
  padding: calc(env(safe-area-inset-top) + 0.46rem) 0.45rem calc(env(safe-area-inset-bottom) + 0.7rem);
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-size: 0.66rem;
    font-weight: 500;
  }
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
}

.placeholder {
  width: 0.72rem;
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
  margin-top: auto;
  border: 0;
  border-radius: 0.56rem;
  height: 1.12rem;
  color: #fbfbfb;
  font-size: 0.5rem;
  background: linear-gradient(165deg, #05e7ae 8%, #027a5c 72%);
}
</style>

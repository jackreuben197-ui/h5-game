<script setup lang="ts">
import { computed, ref } from 'vue'
import { showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const router = useRouter()

const title = computed(() => '留言板')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
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
  <div class="mine-glass-page board-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <p class="tip">请此处留言您的反馈</p>

      <textarea
        v-model="content"
        class="board-input"
        maxlength="250"
        placeholder="Type here"
      ></textarea>

      <button class="submit-btn" type="button" @click="submitMessage">Submit Report</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mine-glass-page {
  min-height: 100dvh;
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
  margin-top: auto;
  border: 0;
  border-radius: 0.56rem;
  height: 1.12rem;
  color: #fbfbfb;
  font-size: 0.5rem;
  background: linear-gradient(165deg, #05e7ae 8%, #027a5c 72%);
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()

const reason = ref('')
const selectedPreset = ref('异常操作')

const presetList = ['异常操作', '安全保护触发']

const reasonCount = computed(() => reason.value.length)

function goBack(): void {
  void router.push('/mine/club-record/hand')
}

function submitReport(): void {
  showSuccessToast('举报提交成功')
  void router.back()
}
</script>

<template>
  <div class="record-report-page">
    <header class="page-head">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>Result</h1>
      <div class="placeholder" />
    </header>

    <section class="glass-card option-card">
      <button
        v-for="item in presetList"
        :key="item"
        type="button"
        class="option-row"
        @click="selectedPreset = item"
      >
        <span>{{ item }}</span>
        <span class="check" :class="{ active: selectedPreset === item }">✔</span>
      </button>
    </section>

    <section class="glass-card input-card">
      <div class="input-title">请输入举报原因 {{ reasonCount }}/100</div>
      <textarea
        v-model="reason"
        class="reason-input"
        maxlength="100"
        placeholder="请详细描述问题..."
      />
    </section>

    <VanButton round type="primary" class="submit-btn" @click="submitReport">提交</VanButton>
  </div>
</template>

<style scoped lang="scss">
.record-report-page {
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.46rem) 0.45rem 2.2rem;
  color: #f9f9f9;
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.6) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 25% 85%, rgba(206, 107, 160, 0.6) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.58) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
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

.glass-card {
  border-radius: 0.42rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.04rem);
}

.option-card {
  margin-top: 0.38rem;
  overflow: hidden;
}

.option-row {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  padding: 0.28rem 0.42rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.39rem;
  border-bottom: 0.02rem solid rgba(255, 255, 255, 0.16);

  &:last-child {
    border-bottom: 0;
  }
}

.check {
  opacity: 0.3;

  &.active {
    opacity: 1;
    color: #6be89d;
  }
}

.input-card {
  margin-top: 0.28rem;
  padding: 0.28rem 0.38rem;
}

.input-title {
  font-size: 0.31rem;
  color: rgba(255, 255, 255, 0.82);
}

.reason-input {
  width: 100%;
  border: 0;
  outline: none;
  resize: none;
  margin-top: 0.24rem;
  min-height: 2.6rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.24rem;
  color: #fff;
  font-size: 0.34rem;
  line-height: 1.4;
  padding: 0.22rem;
}

.submit-btn {
  position: fixed;
  left: 0.54rem;
  right: 0.54rem;
  bottom: calc(env(safe-area-inset-bottom) + 0.36rem);
  height: 0.96rem;
  font-size: 0.38rem;
  font-weight: 700;
}
</style>

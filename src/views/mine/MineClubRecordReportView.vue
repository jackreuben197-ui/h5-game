<script setup lang="ts">
import { computed, ref } from 'vue'
import { showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const title = computed(() => 'Result')

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
  <div class="record-report-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
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
        ></textarea>
      </section>

      <VanButton
        round
        type="primary"
        class="submit-btn"
        @click="submitReport"
      >
        提交
      </VanButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.record-report-page {
  position: relative;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.52rem) 0 2.2rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  position: relative;
  padding: 0 0.49rem;
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

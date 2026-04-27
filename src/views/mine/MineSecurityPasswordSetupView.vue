<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import mainBgUrl from '@/assets/images/main_bg.webp'

type SetupPhase = 'first' | 'confirm'
type OverlayType = 'none' | 'loading' | 'success'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const phase = ref<SetupPhase>('first')
const digits = ref('')
const firstInput = ref('')
const overlayType = ref<OverlayType>('none')

const titleText = computed(() => (phase.value === 'first' ? '设置6位数字密码' : '设置密码'))
const subtitleText = computed(() => (phase.value === 'first' ? '第一次输入' : '再次输入以键认'))
const showSubmit = computed(() => phase.value === 'confirm')
const canSubmit = computed(() => digits.value.length === 6)

const keyRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
]

function closePage(): void {
  router.back()
}

function handleKey(key: string): void {
  if (overlayType.value !== 'none') {
    return
  }

  if (key === 'C') {
    digits.value = ''
    return
  }

  if (key === '⌫') {
    digits.value = digits.value.slice(0, -1)
    return
  }

  if (digits.value.length >= 6) {
    return
  }

  digits.value += key

  if (phase.value === 'first' && digits.value.length === 6) {
    firstInput.value = digits.value
    phase.value = 'confirm'
    digits.value = ''
  }
}

function handleSubmit(): void {
  if (!canSubmit.value) {
    return
  }

  overlayType.value = 'loading'
  window.setTimeout(() => {
    overlayType.value = 'success'
  }, 700)
}

function closeOverlay(): void {
  if (overlayType.value === 'success') {
    void router.replace('/mine/settings/account?security=on')
    return
  }
  overlayType.value = 'none'
}
</script>

<template>
  <div class="security-password-page">
    <button class="close-btn" type="button" @click="closePage">×</button>

    <section class="password-panel">
      <h1>{{ titleText }}</h1>
      <p>{{ subtitleText }}</p>
      <div class="dot-row">
        <span v-for="idx in 6" :key="idx" class="dot-cell">
          <span v-if="idx <= digits.length" class="digit">6</span>
        </span>
      </div>
      <button
        v-if="showSubmit"
        class="submit-btn"
        :class="{ active: canSubmit }"
        type="button"
        @click="handleSubmit"
      >
        完成
      </button>
    </section>

    <section class="keyboard-wrap">
      <div v-for="(row, rowIdx) in keyRows" :key="rowIdx" class="key-row">
        <button
          v-for="key in row"
          :key="key"
          type="button"
          class="key"
          :class="{ clear: key === 'C', erase: key === '⌫' }"
          @click="handleKey(key)"
        >
          <span v-if="key !== '⌫'">{{ key }}</span>
          <span v-else class="erase-icon">⌫</span>
        </button>
      </div>
    </section>

    <div v-if="overlayType !== 'none'" class="overlay-mask">
      <div class="overlay-card">
        <div v-if="overlayType === 'loading'" class="loader"></div>
        <div v-else class="success-icon">✓</div>
        <p>{{ overlayType === 'loading' ? '请稍后' : '已开启' }}</p>
        <button
          v-if="overlayType === 'success'"
          class="overlay-confirm"
          type="button"
          @click="closeOverlay"
        >
          知道了
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.security-password-page {
  min-height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.42rem);
  position: relative;
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.62) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 26% 84%, rgba(206, 107, 160, 0.58) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.56) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
}

.close-btn {
  margin-left: 0.4rem;
  width: 1.024rem;
  height: 1.024rem;
  border: 0.0133rem solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.72rem;
  line-height: 1;
}

.password-panel {
  margin-top: 3.3rem;
  text-align: center;
  color: #fff;

  h1 {
    margin: 0;
    font-size: 0.7246rem;
    font-weight: 600;
    line-height: 1.2;
  }

  p {
    margin: 0.16rem 0 0;
    font-size: 0.4026rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.2;
  }
}

.dot-row {
  margin-top: 0.785rem;
  display: flex;
  justify-content: center;
  gap: 0.1549rem;
}

.dot-cell {
  width: 1.0748rem;
  height: 1.0748rem;
  border-radius: 1.0064rem;
  border: 0.0133rem solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.digit {
  font-size: 0.7616rem;
  font-weight: 500;
}

.submit-btn {
  margin-top: 0.8533rem;
  width: 8.9809rem;
  height: 1.4376rem;
  border: 0;
  border-radius: 1.2684rem;
  background: rgba(0, 0, 0, 0.25);
  color: #f9f9f9;
  font-size: 0.674rem;
}

.submit-btn.active {
  background: linear-gradient(168deg, #05e7ae 7.55%, #027a5c 71.92%);
}

.keyboard-wrap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0.8446rem 0.8446rem 0 0;
  background: rgba(0, 0, 0, 0.37);
  padding: 0.6426rem 0.5321rem 0.5472rem;
  display: flex;
  flex-direction: column;
  gap: 0.206rem;
}

.key-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.1526rem;
}

.key {
  height: 1.354rem;
  border: 0.0133rem solid rgba(255, 255, 255, 0.3);
  border-radius: 0.3775rem;
  background: rgba(255, 255, 255, 0.23);
  color: #fff;
  font-size: 0.6105rem;
  font-weight: 600;
}

.key.clear,
.key.erase {
  background: rgba(4, 209, 157, 0.24);
  border-radius: 1.6064rem;
}

.erase-icon {
  font-size: 0.56rem;
}

.overlay-mask {
  position: absolute;
  inset: 0;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-card {
  width: 4.2136rem;
  min-height: 3.1rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.4);
  border-radius: 0.9703rem;
  background: linear-gradient(121deg, rgba(142, 142, 142, 0.3) 2.9%, rgba(103, 103, 103, 0.4) 43.6%, rgba(73, 73, 73, 0.5) 89.8%);
  box-shadow: inset 0 0 0.2298rem rgba(0, 0, 0, 1), inset 0.0566rem 0.1132rem 0.4596rem rgba(242, 242, 242, 0.9);
  backdrop-filter: blur(0.2rem);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.8187rem 0.4106rem 0.6038rem;

  p {
    margin: 0.16rem 0 0;
    font-size: 0.3623rem;
    line-height: 1.3;
  }
}

.loader {
  width: 0.92rem;
  height: 0.92rem;
  border-radius: 50%;
  border: 0.08rem solid rgba(255, 255, 255, 0.35);
  border-top-color: rgba(255, 255, 255, 0.95);
  animation: spin 0.9s linear infinite;
}

.success-icon {
  width: 0.92rem;
  height: 0.92rem;
  border: 0.06rem solid #fff;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.54rem;
}

.overlay-confirm {
  margin-top: 0.4rem;
  width: 100%;
  height: 1.2rem;
  border: 0;
  border-radius: 1.1rem;
  background: linear-gradient(166deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-size: 0.6rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

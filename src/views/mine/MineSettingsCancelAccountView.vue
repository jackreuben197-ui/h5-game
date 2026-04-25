<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tab = computed<'phone' | 'email'>(() => (route.query.tab === 'email' ? 'email' : 'phone'))
const isPhone = computed(() => tab.value === 'phone')

const phone = ref('')
const email = ref('')
const otp = ref('')
const password = ref('')
const showPassword = ref(false)
const otpCountdown = ref(0)
const showConfirm = ref(false)

let otpTimer: number | null = null

function goBack(): void {
  router.back()
}

function switchTab(nextTab: 'phone' | 'email'): void {
  if (nextTab === tab.value) {
    return
  }

  void router.replace({
    path: '/mine/settings/cancel-account',
    query: { tab: nextTab },
  })
}

function requestOtp(): void {
  if (otpCountdown.value > 0) {
    return
  }

  otpCountdown.value = 50
  if (otpTimer !== null) {
    window.clearInterval(otpTimer)
  }

  otpTimer = window.setInterval(() => {
    if (otpCountdown.value <= 1) {
      otpCountdown.value = 0
      if (otpTimer !== null) {
        window.clearInterval(otpTimer)
        otpTimer = null
      }
      return
    }
    otpCountdown.value -= 1
  }, 1000)
}

function onSubmit(): void {
  showConfirm.value = true
}

function cancelDialog(): void {
  showConfirm.value = false
}

function confirmDialog(): void {
  showConfirm.value = false
  void router.replace('/mine/settings')
}

onBeforeUnmount(() => {
  if (otpTimer !== null) {
    window.clearInterval(otpTimer)
  }
})
</script>

<template>
  <div class="cancel-account-page">
    <header class="page-header">
      <button class="back-btn" type="button" @click="goBack">‹</button>
      <h1>注销账号</h1>
      <div class="header-placeholder" />
    </header>

    <section class="tab-switch">
      <button class="tab-btn" :class="{ active: isPhone }" type="button" @click="switchTab('phone')">手机</button>
      <button class="tab-btn" :class="{ active: !isPhone }" type="button" @click="switchTab('email')">邮箱</button>
    </section>

    <section class="form-stack">
      <div class="form-row">
        <span class="row-icon" :class="isPhone ? 'icon-phone' : 'icon-mail'" />
        <div class="row-main">
          <template v-if="isPhone">
            <span class="prefix">+11</span>
            <input
              v-model.trim="phone"
              class="input-field"
              type="tel"
              inputmode="numeric"
              placeholder="请输入手机号码"
            />
          </template>
          <template v-else>
            <input
              v-model.trim="email"
              class="input-field"
              type="email"
              inputmode="email"
              placeholder="请输入邮箱"
            />
          </template>
          <button class="otp-btn" :class="{ countdown: otpCountdown > 0 }" type="button" @click="requestOtp">
            {{ otpCountdown > 0 ? `${otpCountdown}s` : 'GET OTP' }}
          </button>
        </div>
      </div>

      <div class="form-row">
        <span class="row-icon icon-lock" />
        <div class="row-main single">
          <input v-model.trim="otp" class="input-field" type="text" inputmode="numeric" placeholder="输入验证码" />
        </div>
      </div>

      <div class="form-row">
        <span class="row-icon icon-key" />
        <div class="row-main single">
          <input
            v-model="password"
            class="input-field"
            :type="showPassword ? 'text' : 'password'"
            placeholder="输入登录密码"
          />
          <button class="eye" type="button" @click="showPassword = !showPassword" />
        </div>
      </div>
    </section>

    <button class="submit-btn" type="button" @click="onSubmit">注销账号</button>

    <div v-if="showConfirm" class="dialog-mask">
      <section class="dialog-card">
        <p class="dialog-title">确认要注销当前账号吗？</p>
        <p class="dialog-desc">注销后账号信息将无法恢复，请谨慎操作。</p>
        <div class="dialog-actions">
          <button class="dialog-btn ghost" type="button" @click="cancelDialog">取消</button>
          <button class="dialog-btn primary" type="button" @click="confirmDialog">确认注销</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cancel-account-page {
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 0.48rem) 0.4533rem 0.8rem;
  color: #f9f9f9;
  background:
    radial-gradient(60% 42% at 20% 10%, rgba(226, 163, 133, 0.62) 0%, rgba(226, 163, 133, 0) 100%),
    radial-gradient(55% 45% at 26% 84%, rgba(206, 107, 160, 0.58) 0%, rgba(206, 107, 160, 0) 100%),
    radial-gradient(45% 38% at 88% 84%, rgba(0, 183, 212, 0.56) 0%, rgba(0, 183, 212, 0) 100%),
    linear-gradient(160deg, #b58eb1 0%, #8d668d 54%, #6f5988 100%);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
    font-family: var(--font-family-SF);
    font-size: 0.6424rem;
    font-weight: 400;
    line-height: 1.2;
    color: #fff;
  }
}

.back-btn,
.header-placeholder {
  width: 0.72rem;
  height: 0.72rem;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 0.72rem;
  line-height: 1;
}

.tab-switch {
  margin-top: 0.62rem;
  display: flex;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.17);
  overflow: hidden;
  height: 1.4443rem;
}

.tab-btn {
  flex: 1;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.84);
  font-family: var(--font-family-sans);
  font-size: 0.4152rem;
}

.tab-btn.active {
  color: #fff;
  font-weight: 600;
  border: 0.0133rem solid rgba(255, 255, 255, 0.7);
  border-radius: 1.3844rem;
  background: linear-gradient(158deg, #05e7ae 7.55%, #027a5c 71.92%);
}

.form-stack {
  margin-top: 0.2933rem;
  display: flex;
  flex-direction: column;
  gap: 0.2933rem;
}

.form-row {
  height: 1.4376rem;
  border-radius: 1.6913rem;
  background: rgba(0, 0, 0, 0.22);
  display: flex;
  align-items: center;
  padding-left: 0.4144rem;
}

.row-icon {
  width: 0.5333rem;
  height: 0.5333rem;
  border-radius: 0.08rem;
  position: relative;
  margin-right: 0.4133rem;
}

.icon-phone::before {
  content: '';
  position: absolute;
  inset: 0.04rem 0.1rem;
  border: 0.04rem solid rgba(255, 255, 255, 0.95);
  border-radius: 0.1rem;
}

.icon-mail::before {
  content: '';
  position: absolute;
  inset: 0.08rem;
  border: 0.04rem solid rgba(255, 255, 255, 0.95);
  border-radius: 0.06rem;
}

.icon-mail::after {
  content: '';
  position: absolute;
  left: 0.13rem;
  right: 0.13rem;
  top: 0.16rem;
  height: 0.04rem;
  background: rgba(255, 255, 255, 0.95);
  transform: rotate(32deg);
}

.icon-lock::before {
  content: '';
  position: absolute;
  left: 0.1rem;
  right: 0.1rem;
  bottom: 0.06rem;
  height: 0.24rem;
  border: 0.04rem solid rgba(255, 255, 255, 0.95);
  border-radius: 0.06rem;
}

.icon-lock::after {
  content: '';
  position: absolute;
  left: 0.16rem;
  right: 0.16rem;
  top: 0.04rem;
  height: 0.24rem;
  border: 0.04rem solid rgba(255, 255, 255, 0.95);
  border-bottom: 0;
  border-radius: 0.2rem 0.2rem 0 0;
}

.icon-key::before,
.icon-key::after {
  content: '';
  position: absolute;
}

.icon-key::before {
  width: 0.2rem;
  height: 0.2rem;
  border: 0.04rem solid rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  left: 0.02rem;
  top: 0.12rem;
}

.icon-key::after {
  left: 0.22rem;
  right: 0.04rem;
  top: 0.19rem;
  height: 0.06rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0.04rem;
}

.row-main {
  height: 100%;
  flex: 1;
  border-radius: 1.6913rem;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  padding: 0 0.1963rem 0 0.4176rem;
  gap: 0.24rem;
}

.row-main.single {
  justify-content: space-between;
  padding-right: 0.3733rem;
}

.prefix {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 1.2684rem;
  min-width: 1.4667rem;
  height: 0.8889rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #111;
  font-family: var(--font-family-sans);
  font-size: 0.3383rem;
}

.input-field {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #111;
  font-family: var(--font-family-sans);
  font-size: 0.3805rem;
  line-height: 1.2;
}

.input-field::placeholder {
  color: rgba(0, 0, 0, 0.38);
}

.input-field:focus {
  outline: none;
}

.otp-btn {
  margin-left: auto;
  height: 0.8889rem;
  border: 0;
  border-radius: 1.2684rem;
  padding: 0 0.3067rem;
  min-width: 1.9467rem;
  background: linear-gradient(152deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-family: var(--font-family-sans);
  font-size: 0.3383rem;
}

.otp-btn.countdown {
  background: rgba(0, 0, 0, 0.12);
  color: #ff132b;
}

.eye {
  width: 0.5669rem;
  height: 0.5443rem;
  border: 0;
  background: transparent;
  position: relative;
}

.eye::before {
  content: '';
  position: absolute;
  inset: 0.11rem 0.08rem;
  border: 0.04rem solid rgba(0, 0, 0, 0.54);
  border-radius: 50%;
}

.submit-btn {
  margin-top: 0.48rem;
  width: 100%;
  height: 1.4376rem;
  border: 0;
  border-radius: 1.2684rem;
  background: linear-gradient(167deg, rgba(220, 72, 93, 0.88) 0%, rgba(153, 40, 58, 0.88) 100%);
  color: #fff;
  font-size: 0.48rem;
  font-family: var(--font-family-sans);
  font-weight: 600;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(12, 12, 12, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem;
}

.dialog-card {
  width: 8.2rem;
  border-radius: 0.48rem;
  border: 0.0133rem solid rgba(255, 255, 255, 0.34);
  background: linear-gradient(121deg, rgba(142, 142, 142, 0.3) 2.9%, rgba(103, 103, 103, 0.4) 43.6%, rgba(73, 73, 73, 0.5) 89.8%);
  backdrop-filter: blur(0.2rem);
  box-shadow: inset 0 0 0.2rem rgba(0, 0, 0, 0.5);
  padding: 0.56rem;
  color: #fff;
}

.dialog-title {
  margin: 0;
  font-size: 0.46rem;
  font-weight: 600;
  text-align: center;
}

.dialog-desc {
  margin: 0.24rem 0 0;
  font-size: 0.34rem;
  color: rgba(255, 255, 255, 0.86);
  text-align: center;
  line-height: 1.4;
}

.dialog-actions {
  margin-top: 0.52rem;
  display: flex;
  gap: 0.22rem;
}

.dialog-btn {
  flex: 1;
  height: 1.12rem;
  border-radius: 1rem;
  font-size: 0.4rem;
  border: 0;
}

.dialog-btn.ghost {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.dialog-btn.primary {
  background: linear-gradient(166deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
}
</style>

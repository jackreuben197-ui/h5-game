<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const router = useRouter()

const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()

function readFirstString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

const userRecord = computed<Record<string, unknown>>(() => {
  const user = userInfoStore.userInfo?.user
  return user && typeof user === 'object' ? (user as Record<string, unknown>) : {}
})

const rootRecord = computed<Record<string, unknown>>(() => {
  const root = userInfoStore.userInfo
  return root && typeof root === 'object' ? (root as Record<string, unknown>) : {}
})

const phone = computed(() => {
  const fromUser = readFirstString(userRecord.value, [
    'phone',
    'mobile',
    'mobile_phone',
    'phone_number',
    'bind_phone',
    'tel',
  ])
  if (fromUser) {
    return fromUser
  }

  const fromRoot = readFirstString(rootRecord.value, ['phone', 'mobile', 'bind_phone'])
  if (fromRoot) {
    return fromRoot
  }

  const account = gameStore.loginAccount.trim()
  if (account && !account.includes('@')) {
    return account
  }

  return ''
})

const email = computed(() => {
  const fromUser = readFirstString(userRecord.value, ['email', 'mail', 'bind_email', 'email_address'])
  if (fromUser) {
    return fromUser
  }

  const fromRoot = readFirstString(rootRecord.value, ['email', 'mail', 'bind_email'])
  if (fromRoot) {
    return fromRoot
  }

  const account = gameStore.loginAccount.trim()
  if (account.includes('@')) {
    return account
  }

  return ''
})

const isPhone = computed(() => Boolean(phone.value))
const isEmail = computed(() => !phone.value && Boolean(email.value))
const firstContactPlaceholder = computed(() => (isPhone.value ? '0000000000' : 'Enter your Mail Id'))
const firstContactValue = computed(() => phone.value)
const pageTitle = computed(() => (isPhone.value ? 'Security code verification' : '注销账户'))
const otpButtonText = computed(() => (otpCountdown.value > 0 ? `${otpCountdown.value}s` : 'GET OTP'))
const zoneCode = computed(() => {
  const fromUser = readFirstString(userRecord.value, ['area', 'area_code', 'country_code'])
  const pure = fromUser.replace(/[^\d]/g, '')
  return pure || '11'
})

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const otp = ref('')
const emailDraft = ref('')
const otpCountdown = ref(0)
const showConfirm = ref(false)

const emailFieldValue = computed({
  get: () => email.value || emailDraft.value,
  set: (value: string) => {
    emailDraft.value = value.trim()
  },
})

let otpTimer: number | null = null

function goBack(): void {
  router.back()
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
  <div class="cancel-account-page" :style="backgroundStyle">
    <HeaderBack :title="pageTitle" />

    <div class="content-wrap">
      <section class="form-stack">
        <div class="form-label">Passcode</div>
        <div class="form-row">
          <span class="row-icon" :class="isPhone ? 'icon-phone' : 'icon-mail'"></span>
          <div class="row-main">
            <template v-if="isPhone">
              <span class="prefix">+{{ zoneCode }}</span>
              <input
                :value="firstContactValue"
                class="input-field"
                type="tel"
                inputmode="numeric"
                :placeholder="firstContactPlaceholder"
                readonly
              />
            </template>
            <template v-else>
              <input
                v-model.trim="emailFieldValue"
                class="input-field"
                type="email"
                inputmode="email"
                :placeholder="firstContactPlaceholder"
                :readonly="isEmail"
              />
            </template>
            <button
              class="otp-btn"
              :class="{ countdown: otpCountdown > 0 }"
              type="button"
              @click="requestOtp"
            >
              {{ otpButtonText }}
            </button>
          </div>
        </div>

        <div class="form-label">Passcode</div>
        <div class="form-row">
          <span class="row-icon icon-lock"></span>
          <div class="row-main single">
            <input
              v-model.trim="otp"
              class="input-field"
              type="text"
              inputmode="numeric"
              placeholder="Enter Passcode"
            />
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
  </div>
</template>

<style scoped lang="scss">
.cancel-account-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding-top: calc(env(safe-area-inset-top) + 0.48rem);
  padding-bottom: calc(env(safe-area-inset-bottom) + 1.0667rem);
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.4533rem;
}

.form-stack {
  margin-top: 0.3552rem;
  display: flex;
  flex-direction: column;
  gap: 0.2133rem;
}

.form-label {
  font-family: var(--font-family-sans);
  font-size: 0.36rem;
  line-height: 0.48rem;
  color: rgba(255, 255, 255, 0.92);
  margin-top: 0.1333rem;
}

.form-row {
  height: 1.4376rem;
  border-radius: 1.6913rem;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(0.5566rem);
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
  justify-content: flex-start;
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

.submit-btn {
  margin-top: auto;
  min-height: 1.4376rem;
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

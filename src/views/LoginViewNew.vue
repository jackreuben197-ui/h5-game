<script setup lang="ts">
import { md5 } from 'js-md5'
import { computed, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showLoadingToast, showSuccessToast, closeToast } from 'vant'
import { loginApi, postUserSendCodeApi, postUserRegisterApi, postUserModifyPasswordApi } from '@/api/user'
import { useGameStore } from '@/stores/game'
import { t } from '@/i18n'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import icPhone from '@/assets/icons/ic_phone.svg'
import icLock from '@/assets/icons/ic_lock.svg'
import icKey from '@/assets/icons/ic_key.svg'
import icEye from '@/assets/icons/ic_eye.svg'
import icGlobe from '@/assets/icons/ic_globe.svg'

type PageMode = 'login' | 'register' | 'forgot'
type ContactType = 'phone' | 'email'

const router = useRouter()
const gameStore = useGameStore()

// ---------- State ----------
const pageMode = ref<PageMode>('login')
const contactType = ref<ContactType>('phone')
const form = reactive({
  phone: '',
  email: '',
  area: '55',
  code: '',
  password: '',
})
const showPassword = ref(false)
const agreed = ref(false)

// OTP countdown
const otpCountdown = ref(0)
let otpTimer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (otpTimer) clearInterval(otpTimer)
})

// ---------- Computed ----------
const contactValue = computed(() =>
  contactType.value === 'phone' ? form.phone : form.email,
)

const contactPlaceholder = computed(() =>
  contactType.value === 'phone' ? t('UILogin_InputMoblie') : t('UILogin_InputEmail'),
)

const canSubmit = computed(() => {
  if (!contactValue.value.trim()) return false
  if (pageMode.value === 'login') {
    return !!form.password.trim()
  }
  // register & forgot need code + password
  if (!form.code.trim()) return false
  if (!form.password.trim()) return false
  if (pageMode.value === 'register' && !agreed.value) return false
  return true
})

const submitText = computed(() => {
  if (pageMode.value === 'register') return t('UILogin_Register')
  if (pageMode.value === 'forgot') return t('UILogin_RetrievePWD')
  return t('UILogin_BtnLogin')
})

const otpBtnText = computed(() => {
  if (otpCountdown.value > 0) return `${otpCountdown.value}s`
  return t('UILogin_GetCode')
})

const isPhone = computed(() => contactType.value === 'phone')

const contactModel = computed({
  get: () => contactType.value === 'phone' ? form.phone : form.email,
  set: (val: string) => {
    if (contactType.value === 'phone') {
      form.phone = val
    } else {
      form.email = val
    }
  },
})

// ---------- Actions ----------
function switchContact(type: ContactType) {
  contactType.value = type
}

function goMode(mode: PageMode) {
  pageMode.value = mode
}

function goBack() {
  if (pageMode.value !== 'login') {
    pageMode.value = 'login'
  } else if (window.history.length <= 1) {
    router.replace('/')
  } else {
    router.back()
  }
}

function togglePassword() {
  showPassword.value = !showPassword.value
}

async function sendOtp() {
  if (otpCountdown.value > 0) return
  const target = contactValue.value.trim()
  if (!target) {
    showFailToast(contactType.value === 'phone' ? t('UILogin_1001') : t('UILogin_InputEmail'))
    return
  }

  try {
    const payload: Record<string, string> = {}
    if (contactType.value === 'phone') {
      payload.phone = target
      payload.area = form.area.trim() || '55'
    } else {
      payload.email = target
    }
    await postUserSendCodeApi(payload)
    startOtpCountdown()
    showSuccessToast(t('UILogin_1007'))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed'
    showFailToast(message)
  }
}

function startOtpCountdown() {
  otpCountdown.value = 60
  otpTimer = setInterval(() => {
    otpCountdown.value--
    if (otpCountdown.value <= 0) {
      if (otpTimer) clearInterval(otpTimer)
      otpTimer = null
    }
  }, 1000)
}

async function handleSubmit() {
  if (!canSubmit.value) return
  const target = contactValue.value.trim()

  showLoadingToast({ message: '...', forbidClick: true, duration: 0 })

  try {
    if (pageMode.value === 'login') {
      await handleLogin(target)
    } else if (pageMode.value === 'register') {
      await handleRegister(target)
    } else {
      await handleForgot(target)
    }
  } catch (error) {
    closeToast()
    const message = error instanceof Error ? error.message : 'Failed'
    showFailToast(message)
  }
}

async function handleLogin(target: string) {
  const res = await loginApi({
    phone: contactType.value === 'phone' ? target : '',
    password: md5(form.password.trim()),
    area: form.area.trim() || '55',
  })
  gameStore.setSessionToken(res.token)
  gameStore.setLoginUser({
    account: target,
    nickname: target,
    userId: '',
  })
  closeToast()
  showSuccessToast(t('UILogin_BtnLogin'))
  await router.replace({ name: 'lobby' })
}

async function handleRegister(target: string) {
  const payload: Record<string, unknown> = {
    password: md5(form.password.trim()),
    code: form.code.trim(),
    platform: 5, // Web
  }
  if (contactType.value === 'phone') {
    payload.phone = target
    payload.area = form.area.trim() || '55'
  } else {
    payload.email = target
  }
  await postUserRegisterApi(payload)
  closeToast()
  showSuccessToast(t('UILogin_1003'))
  // Auto switch to login after registration
  pageMode.value = 'login'
}

async function handleForgot(target: string) {
  const payload: Record<string, unknown> = {
    password: md5(form.password.trim()),
    code: form.code.trim(),
  }
  if (contactType.value === 'phone') {
    payload.phone = target
    payload.area = form.area.trim() || '55'
  } else {
    payload.email = target
  }
  await postUserModifyPasswordApi(payload)
  closeToast()
  showSuccessToast(t('UILogin_1009'))
  pageMode.value = 'login'
}
</script>

<template>
  <div class="login-page">
    <!-- Background -->
    <!-- <img class="login-bg" :src="bgLogin" alt="" /> -->

    <!-- Status bar area -->
    <div class="status-bar">
      <span></span>
      <button class="lang-btn" @click="() => {}">
        <img :src="icGlobe" alt="" />
        <span class="lang-text">EN</span>
      </button>
    </div>

    <!-- Content card -->
    <div class="login-card">
      <!-- Contact type tabs: phone / email -->
      <div class="tab-row">
        <button
          :class="['tab-item', { 'tab-item--active': contactType === 'phone' }]"
          @click="switchContact('phone')"
        >
          {{ t('UIloginPhone_logintext') }}
        </button>
        <button
          :class="['tab-item', { 'tab-item--active': contactType === 'email' }]"
          @click="switchContact('email')"
        >
          {{ t('UIloginEmail_logintext') }}
        </button>
      </div>

      <!-- Form fields -->
      <div class="form-fields">
        <!-- Phone / Email input -->
        <div :class="['input-row', { 'input-row--filled': !!contactModel.trim() }]">
          <div class="input-icon-wrap">
            <img class="input-icon" :src="icPhone" alt="" />
          </div>
          <div class="input-inner">
            <!-- Area code selector (phone mode only) -->
            <button v-if="isPhone" class="area-code-btn" @click="() => {}">
              <span>+{{ form.area }}</span>
              <svg
                width="9"
                height="5"
                viewBox="0 0 9 5"
                fill="none"
              >
                <path
                  d="M0 0.44C0 0.55 0.04 0.67 0.13 0.75L4.19 4.87C4.36 5.04 4.64 5.04 4.81 4.87L8.87 0.75C9.04 0.58 9.04 0.30 8.87 0.13C8.70 -0.04 8.43 -0.04 8.26 0.13L4.50 3.93L0.74 0.13C0.57 -0.04 0.30 -0.04 0.13 0.13C0.04 0.22 0 0.33 0 0.44Z"
                  fill="black"
                  fill-opacity="0.54"
                />
              </svg>
            </button>
            <input
              v-model="contactModel"
              class="input-field"
              type="text"
              :placeholder="contactPlaceholder"
              autocomplete="off"
            />
            <!-- OTP button -->
            <button
              v-if="pageMode !== 'login'"
              :class="['otp-btn', { 'otp-btn--disabled': otpCountdown > 0 }]"
              :disabled="otpCountdown > 0"
              @click="sendOtp"
            >
              {{ otpBtnText }}
            </button>
          </div>
        </div>

        <!-- OTP code input (register & forgot only) -->
        <div v-if="pageMode !== 'login'" :class="['input-row', { 'input-row--filled': !!form.code.trim() }]">
          <div class="input-icon-wrap">
            <img class="input-icon" :src="icKey" alt="" />
          </div>
          <div class="input-inner input-inner--plain">
            <input
              v-model="form.code"
              class="input-field"
              type="text"
              :placeholder="t('UILogin_Code')"
              autocomplete="off"
            />
          </div>
        </div>

        <!-- Password input -->
        <div :class="['input-row', { 'input-row--filled': !!form.password.trim() }]">
          <div class="input-icon-wrap">
            <img class="input-icon" :src="icLock" alt="" />
          </div>
          <div class="input-inner input-inner--plain">
            <input
              v-model="form.password"
              class="input-field"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="pageMode === 'forgot' ? t('UILogin_NewPW') : t('UILogin_InputPW')"
              autocomplete="off"
            />
            <button class="eye-btn" @click="togglePassword">
              <img :src="icEye" alt="" :style="{ opacity: showPassword ? 1 : 0.4 }" />
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom area -->
      <div class="bottom-area">
        <!-- Action links row -->
        <div class="action-links">
          <button
            v-if="pageMode === 'login'"
            class="link-btn"
            @click="goMode('forgot')"
          >
            {{ t('UILogin_Forget') }}
          </button>
          <span v-else></span>
          <button
            class="link-btn link-btn--right"
            @click="goMode(pageMode === 'login' ? 'register' : 'login')"
          >
            {{ pageMode === 'login' ? t('UILogin_Register') : t('UILogin_BtnLogin') }}
          </button>
        </div>

        <!-- Agreement checkbox (register only) -->
        <div v-if="pageMode === 'register'" class="agreement-row">
          <span
            :class="['checkbox', { 'checkbox--checked': agreed }]"
            @click="agreed = !agreed"
          ></span>
          <span class="agreement-text" @click="agreed = !agreed">
            {{ t('UILogin_ReadOK') }}
          </span>
        </div>

        <!-- Submit button -->
        <PrimaryButton
          :text="submitText"
          :disabled="!canSubmit"
          @click="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  background: url(@/assets/images/main_bg.webp) no-repeat center/cover;
  min-height: 100vh;
  // position: relative;
}

/* Status bar */
.status-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.36rem 0.36rem 0;
  height: 1.33rem;
}

.back-btn {
  width: 0.76rem;
  height: 0.76rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 0.76rem;
    height: 0.76rem;
  }
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 0.13rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0.13rem;

  img {
    width: 0.64rem;
    height: 0.67rem;
  }
}

.lang-text {
  font-size: 0.42rem;
  font-weight: 500;
  color: #fff;
  font-family: 'HONOR Sans CN', sans-serif;
}

/* Card */
.login-card {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 0.53rem 0.45rem 0;
  margin-top: 2.93rem;
}

/* Tabs */
.tab-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.53rem;
  margin-bottom: 0.69rem;
}

.tab-item {
  border: 0;
  background: transparent;
  font-size: 0.45rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.13rem 0;
  position: relative;

  &--active {
    color: #fff;
    font-weight: 700;

    &::after {
      content: '';
      position: absolute;
      bottom: -0.07rem;
      left: 0;
      right: 0;
      height: 0.033rem;
      background: #fff;
    }
  }
}

/* Form */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.input-row {
  display: flex;
  align-items: center;
  height: 1.44rem;
  // Outer pill: green background
  background: rgba(255, 255, 255, 0.15);
  border-radius: 1.69rem;
  padding-left: 0.41rem;
  position: relative;
  transition: background 0.2s;

  // When input has content, outer background turns green
  &--filled {
    background: rgba(5, 231, 174, 0.65);
  }
}

.input-icon-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.56rem;
  height: 0.56rem;
  z-index: 2;
}

.input-icon {
  width: 0.53rem;
  height: 0.53rem;
}

.input-inner {
  flex: 1;
  height: 100%;
  // Inner pill: white semi-transparent
  background: rgba(255, 255, 255, 0.80);
  border-radius: 1.69rem;
  display: flex;
  align-items: center;
  margin-left: 0.16rem;
  padding-right: 0.21rem;
  min-width: 0;

  &--plain {
    padding-right: 0.53rem;
  }
}

.area-code-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.11rem;
  height: 0.91rem;
  padding: 0 0.27rem;
  margin-left: 0.41rem;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 1.27rem;
  border: 0;
  cursor: pointer;

  span {
    font-size: 0.34rem;
    font-weight: 500;
    font-family: 'Afacad', sans-serif;
    color: #000;
  }

  svg {
    width: 0.24rem;
    height: 0.13rem;
  }
}

.input-field {
  flex: 1;
  height: 100%;
  border: 0;
  background: transparent;
  outline: none;
  font-size: 0.38rem;
  font-weight: 500;
  font-family: 'Afacad', sans-serif;
  color: #000;
  padding-left: 0.53rem;
  min-width: 0;

  &::placeholder {
    color: rgba(0, 0, 0, 0.38);
  }
}

.otp-btn {
  flex-shrink: 0;
  height: 0.91rem;
  padding: 0 0.27rem;
  background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);
  border-radius: 1.27rem;
  border: 0;
  cursor: pointer;
  font-size: 0.34rem;
  font-weight: 500;
  font-family: 'Afacad', sans-serif;
  color: #fff;
  white-space: nowrap;

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.eye-btn {
  flex-shrink: 0;
  width: 0.59rem;
  height: 0.59rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 0.59rem;
    height: 0.56rem;
  }
}

/* Bottom area */
.bottom-area {
  margin-top: 0.69rem;
  display: flex;
  flex-direction: column;
  gap: 0.27rem;
}

.action-links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.05rem;
}

.link-btn {
  border: 0;
  background: transparent;
  font-size: 0.41rem;
  font-weight: 500;
  font-family: 'PingFang SC', 'HONOR Sans CN', sans-serif;
  color: #f9f9f9;
  cursor: pointer;
  padding: 0.13rem 0.21rem;

  &--right {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 0.42rem;
  }
}

/* Agreement */
.agreement-row {
  display: flex;
  align-items: center;
  gap: 0.13rem;
  padding: 0 0.13rem;
}

.checkbox {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: rgba(249, 249, 249, 0.2);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &--checked {
    background: linear-gradient(157deg, #05e7ae 0%, #027a5c 100%);

    &::after {
      content: '';
      width: 0.21rem;
      height: 0.11rem;
      border-left: 0.053rem solid #fff;
      border-bottom: 0.053rem solid #fff;
      transform: rotate(-45deg);
      margin-top: -0.05rem;
    }
  }
}

.agreement-text {
  font-size: 0.27rem;
  font-weight: 500;
  color: #fff;
  font-family: 'PingFang SC', 'HONOR Sans CN', sans-serif;
}
</style>

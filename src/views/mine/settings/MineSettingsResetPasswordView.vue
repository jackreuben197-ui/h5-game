<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postUserModifyPasswordApi, postUserSendCodeApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t } from '@/i18n'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const route = useRoute()

const tab = computed<'phone' | 'email'>(() => {
  return route.query.tab === 'email' ? 'email' : 'phone'
})

const isPhone = computed(() => tab.value === 'phone')
const otpCountdown = ref(0)
const acceptedPolicy = ref(false)
const showPassword = ref(false)
const requestingOtp = ref(false)
const submitting = ref(false)

const phoneNumber = ref('')
const email = ref('')
const otp = ref('')
const password = ref('')
let otpTimer: number | null = null

const isFilledPreview = computed(() => otpCountdown.value > 0)

const headerTitle = computed(() => {
  if (isPhone.value) {
    return isFilledPreview.value ? 'Forgot Password' : t('tc_n53zSvpD')
  }
  return 'Forgot Password'
})

const submitText = computed(() => (isPhone.value ? t('UIMinePwFinish') : t('UILogin_TitleRegister')))

const formRowClass = computed(() => ({
  filled: isFilledPreview.value,
}))

function switchTab(nextTab: 'phone' | 'email'): void {
  if (nextTab === tab.value) {
    return
  }
  void router.replace({
    path: '/mine/settings/account/reset-password',
    query: { tab: nextTab },
  })
}

function requestOtp(): void {
  if (otpCountdown.value > 0 || requestingOtp.value) {
    return
  }

  const phone = phoneNumber.value.trim()
  const mail = email.value.trim()
  if (isPhone.value && !phone) {
    showFailToast(t('UILogin_InputMoblie'))
    return
  }
  if (!isPhone.value && !mail) {
    showFailToast(t('UILogin_InputEmail'))
    return
  }

  requestingOtp.value = true
  const payload = isPhone.value
    ? { phone, area: '11' }
    : ({ email: mail } as unknown as { phone: string; area: string })

  void postUserSendCodeApi(payload)
    .then((response) => {
      if (response.code !== 0) {
        throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_CodeFail3'))
      }

      showSuccessToast(t('adaptation10133'))
      otpCountdown.value = 60
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
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : t('UIClub_CodeFail3')
      showFailToast(message)
    })
    .finally(() => {
      requestingOtp.value = false
    })
}

async function submitReset(): Promise<void> {
  const phone = phoneNumber.value.trim()
  const mail = email.value.trim()
  const code = otp.value.trim()
  const nextPassword = password.value.trim()

  if (isPhone.value && !phone) {
    showFailToast(t('UILogin_InputMoblie'))
    return
  }
  if (!isPhone.value && !mail) {
    showFailToast(t('UILogin_InputEmail'))
    return
  }
  if (!code) {
    showFailToast(t('UILogin_Code'))
    return
  }
  if (!nextPassword) {
    showFailToast(t('UIClub_PleaseCode'))
    return
  }
  if (!acceptedPolicy.value) {
    showFailToast(t('UIClub_Please4'))
    return
  }

  submitting.value = true
  try {
    const response = await postUserModifyPasswordApi({
      phone: isPhone.value ? phone : undefined,
      email: isPhone.value ? undefined : mail,
      area: isPhone.value ? '11' : undefined,
      code,
      password: nextPassword,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_CodeFail4'))
    }

    showSuccessToast(t('UIClub_CodeSuccess2'))
    void router.replace('/mine/settings/account')
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_CodeFail4')
    showFailToast(message)
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  if (otpTimer !== null) {
    window.clearInterval(otpTimer)
  }
})
</script>

<template>
  <div class="page-shell reset-password-page" :style="backgroundStyle">
    <HeaderBack :title="headerTitle" />

    <div class="content-wrap">
      <section class="tab-switch">
        <button
          class="tab-btn"
          :class="{ active: isPhone }"
          type="button"
          @click="switchTab('phone')"
        >
          {{ t('UISetting_SecurityBindTelItem') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: !isPhone }"
          type="button"
          @click="switchTab('email')"
        >
          {{ t('UISetting_SecurityBindEmailItem') }}
        </button>
      </section>

      <section class="form-stack">
        <div class="form-row" :class="formRowClass">
          <span class="row-icon" :class="isPhone ? 'icon-phone' : 'icon-mail'"></span>
          <div class="row-main">
            <template v-if="isPhone">
              <span class="prefix">+11</span>
              <input
                v-model.trim="phoneNumber"
                class="input-field"
                type="tel"
                inputmode="numeric"
                placeholder="0000000000"
              />
            </template>
            <template v-else>
              <input
                v-model.trim="email"
                class="input-field"
                type="email"
                inputmode="email"
                placeholder="电子邮箱"
              />
            </template>
            <button
              class="otp-btn"
              :class="{ countdown: isFilledPreview }"
              type="button"
              :disabled="requestingOtp || submitting"
              @click="requestOtp"
            >
              {{ isFilledPreview ? `${otpCountdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>

        <div class="form-row" :class="formRowClass">
          <span class="row-icon icon-lock"></span>
          <div class="row-main single">
            <input
              v-model.trim="otp"
              class="input-field"
              type="text"
              inputmode="numeric"
              placeholder="输入验证码"
            />
          </div>
        </div>

        <div class="form-row" :class="formRowClass">
          <span class="row-icon icon-key"></span>
          <div class="row-main single">
            <input
              v-model="password"
              class="input-field"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入密码"
            />
            <button class="eye" type="button" @click="showPassword = !showPassword"></button>
          </div>
        </div>
      </section>

      <label class="policy-row">
        <span
          class="policy-check"
          :class="{ checked: acceptedPolicy }"
          @click="acceptedPolicy = !acceptedPolicy"
        ></span>
        <span class="policy-text">
          By Signing up, you agree to our
          <span class="policy-link">《Terms & Privacy Policy》.</span>
        </span>
      </label>

      <button class="submit-btn" type="button" :disabled="submitting" @click="submitReset">
        {{ submitting ? '提交中...' : submitText }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reset-password-page {
  height: 100dvh;
  // padding-top: calc(env(safe-area-inset-top) + 0.48rem);
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.4533rem;
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
  line-height: 1.2;
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

.form-row.filled {
  background: rgba(5, 231, 174, 0.65);
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
  // min-width: 1.4667rem;
  height: 0.8889rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #111;
  font-family: var(--font-family-sans);
  font-size: 0.3383rem;
  font-weight: 500;
}

.value {
  font-family: var(--font-family-sans);
  font-size: 0.3805rem;
  line-height: 1.2;
  color: #111;
}

.value.empty {
  color: rgba(0, 0, 0, 0.38);
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
  // min-width: 1.9467rem;
  background: linear-gradient(152deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-family: var(--font-family-sans);
  font-size: 0.3383rem;
  font-weight: 500;
}

.otp-btn.countdown {
  background: rgba(0, 0, 0, 0.12);
  color: #ff132b;
}

.otp-btn:disabled {
  opacity: 0.72;
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

.policy-row {
  margin-top: 0.254rem;
  display: flex;
  align-items: center;
  gap: 0.2537rem;
}

.policy-check {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  border: 0.0133rem solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.2);
}

.policy-check.checked {
  background: #05e7ae;
}

.policy-text {
  color: #fff;
  font-size: 0.2706rem;
  font-family: var(--font-family-sans);
  line-height: 1.2;
}

.policy-link {
  color: #05e7ae;
  text-decoration: underline;
}

.submit-btn {
  margin-top: 0.254rem;
  width: 100%;
  height: 1.4376rem;
  border: 0;
  border-radius: 1.2684rem;
  background: linear-gradient(167deg, rgba(135, 111, 72, 0.88) 0%, rgba(72, 102, 135, 0.88) 100%);
  color: #fff;
  font-size: 0.6754rem;
  font-family: var(--font-family-sans);
  font-weight: 500;
}

.submit-btn:disabled {
  opacity: 0.72;
}
</style>

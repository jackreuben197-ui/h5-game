<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { /* useRoute, */ useRouter } from 'vue-router'
import { postUserModifyPasswordApi, postUserSendCodeApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import icMail from '@/assets/icons/ic_mail.svg'
import icLock from '@/assets/icons/ic_lock_new.svg'
import icKey from '@/assets/icons/ic_key.svg'
import icEye from '@/assets/icons/ic_eye.svg'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

// const route = useRoute()
// const tab = computed<'phone' | 'email'>(() => route.query.tab === 'email' ? 'email' : 'phone')
// const isPhone = computed(() => tab.value === 'phone')
// const formRowClass = computed(() => ({ filled: isFilledPreview.value }))
// const phoneNumber = ref('')

const otpCountdown = ref(0)
// const acceptedPolicy = ref(false)
const showPassword = ref(false)
const requestingOtp = ref(false)
const submitting = ref(false)

const email = ref('')
const otp = ref('')
const password = ref('')
let otpTimer: number | null = null

const isFilledPreview = computed(() => otpCountdown.value > 0)
// const headerTitle = computed(() => isPhone.value ? (isFilledPreview.value ? 'Forgot Password' : '修改密码') : 'Forgot Password')
// const submitText = computed(() => isPhone.value ? '完成' : '注册')
const headerTitle = computed(() => 'Forgot Password')
const submitText = computed(() => '注册')

// function switchTab(nextTab: 'phone' | 'email'): void {
//   if (nextTab === tab.value) return
//   void router.replace({ path: '/mine/settings/account/reset-password', query: { tab: nextTab } })
// }

function requestOtp(): void {
  if (otpCountdown.value > 0 || requestingOtp.value) {
    return
  }

  const mail = email.value.trim()
  if (!mail) {
    showFailToast('请输入邮箱')
    return
  }

  requestingOtp.value = true
  void postUserSendCodeApi({ email: mail } as unknown as { phone: string; area: string })
    .then((response) => {
      if (response.code !== 0) {
        throw new Error(typeof response.msg === 'string' ? response.msg : '验证码发送失败')
      }

      showSuccessToast('验证码已发送')
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
      const message = error instanceof Error ? error.message : '验证码发送失败'
      showFailToast(message)
    })
    .finally(() => {
      requestingOtp.value = false
    })
}

async function submitReset(): Promise<void> {
  const mail = email.value.trim()
  const code = otp.value.trim()
  const nextPassword = password.value.trim()

  if (!mail) {
    showFailToast('请输入邮箱')
    return
  }
  if (!code) {
    showFailToast('请输入验证码')
    return
  }
  if (!nextPassword) {
    showFailToast('请输入新密码')
    return
  }
  // if (!acceptedPolicy.value) {
  //   showFailToast('请先勾选协议')
  //   return
  // }

  submitting.value = true
  try {
    const response = await postUserModifyPasswordApi({
      email: mail,
      code,
      password: nextPassword,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '重置密码失败')
    }

    showSuccessToast('密码重置成功')
    void router.replace('/mine/settings/account')
  } catch (error) {
    const message = error instanceof Error ? error.message : '重置密码失败'
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
      <!-- TODO: phone tab — uncomment when phone reset is ready
      <section class="tab-switch">
        <button class="tab-btn" :class="{ active: isPhone }" type="button" @click="switchTab('phone')">手机</button>
        <button class="tab-btn" :class="{ active: !isPhone }" type="button" @click="switchTab('email')">邮箱</button>
      </section>
      -->

      <section class="form-stack">
        <div class="form-row">
          <img class="row-icon" :src="icMail" alt="" aria-hidden="true" />
          <div class="row-main">
            <input
              v-model.trim="email"
              class="input-field"
              type="email"
              inputmode="email"
              placeholder="电子邮箱"
            />
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

        <div class="form-row">
          <img class="row-icon" :src="icLock" alt="" aria-hidden="true" />
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

        <div class="form-row">
          <img class="row-icon" :src="icKey" alt="" aria-hidden="true" />
          <div class="row-main single">
            <input
              v-model="password"
              class="input-field"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入密码"
            />
            <button class="eye" type="button" @click="showPassword = !showPassword">
              <img :src="icEye" alt="" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <!-- <label class="policy-row">
        <img
          class="policy-check"
          :src="acceptedPolicy ? icCheckbox : icUncheckbox"
          alt=""
          aria-hidden="true"
          @click="acceptedPolicy = !acceptedPolicy"
        />
        <span class="policy-text">
          By Signing up, you agree to our
          <span class="policy-link">《Terms & Privacy Policy》.</span>
        </span>
      </label> -->

      <button class="submit-btn" type="button" :disabled="submitting" @click="submitReset">
        {{ submitting ? '提交中...' : submitText }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reset-password-page {
  height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.48rem);
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
  object-fit: contain;
  margin-right: 0.4133rem;
  flex-shrink: 0;
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
  background: #55606c;
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
  width: 0.5333rem;
  height: 0.5333rem;
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
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
  object-fit: contain;
  flex-shrink: 0;
}

.policy-text {
  color: #fff;
  font-size: 0.2706rem;
  font-family: var(--font-family-sans);
  line-height: 1.2;
}

.policy-link {
  color: #2cb1e4;
  text-decoration: underline;
}

.submit-btn {
  margin-top: 0.8rem;
  width: 100%;
  height: 1.4376rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.2);
  border-radius: 1.2684rem;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  box-shadow:
    inset 1px 1px 0px rgba(255, 255, 255, 0.15),
    inset -1px -1px 0px rgba(255, 255, 255, 0.05);
  color: #f9f9f9;
  font-size: 0.42rem;
  font-family: var(--font-family-sans);
  font-weight: 500;
}

.submit-btn:disabled {
  opacity: 0.72;
}
</style>

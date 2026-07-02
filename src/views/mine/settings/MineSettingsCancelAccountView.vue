<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import { postUserDeleteApi, postUserDeleteCodeApi } from '@/api/user'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import mainBgUrl from '@/assets/images/main_bg.webp'
import icMail from '@/assets/icons/ic_mail.svg'
import icLock from '@/assets/icons/ic_lock_new.svg'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { t } from '@/i18n'

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
  const fromUser = readFirstString(userRecord.value, ['phone'])
  if (fromUser) {
    return fromUser
  }

  const fromRoot = readFirstString(rootRecord.value, ['phone'])
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
  const fromUser = readFirstString(userRecord.value, ['email'])
  if (fromUser) {
    return fromUser
  }

  const fromRoot = readFirstString(rootRecord.value, ['email'])
  if (fromRoot) {
    return fromRoot
  }

  const account = gameStore.loginAccount.trim()
  if (account.includes('@')) {
    return account
  }

  return ''
})

const isPhone = computed(() => Boolean(phone.value) && /^\d+$/.test(phone.value))
const isEmail = computed(() => !phone.value && Boolean(email.value))
const firstContactPlaceholder = computed(() =>
  isPhone.value ? '0000000000' : 'Enter your Mail Id',
)
const firstContactValue = computed(() => phone.value)
const pageTitle = computed(() => (isPhone.value ? "6" + t('UIClub_Code8') : t('UIMine_DeleteAccount')))
const otpButtonText = computed(() =>
  otpCountdown.value > 0 ? `${otpCountdown.value}s` : t('UILogin_GetCode'),
)
const zoneCode = computed(() => {
  const fromUser = readFirstString(userRecord.value, ['area'])
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
const requestingOtp = ref(false)
const deleting = ref(false)

const emailFieldValue = computed({
  get: () => email.value || emailDraft.value,
  set: (value: string) => {
    emailDraft.value = value.trim()
  },
})

let otpTimer: number | null = null

async function requestOtp(): Promise<void> {
  if (otpCountdown.value > 0 || requestingOtp.value) {
    return
  }

  const account = isPhone.value ? firstContactValue.value : emailFieldValue.value.trim()
  if (!account) {
    showFailToast(t('UIClub_No9') + "，" + t('UIClub_Text71'))
    return
  }

  requestingOtp.value = true
  try {
    const response = await postUserDeleteCodeApi({
      area: zoneCode.value,
      phone: phone.value,
      email: email.value,
      lang: 0,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_CodeFail3'))
    }
    showSuccessToast(t('adaptation10133'))
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_CodeFail3')
    showFailToast(message)
    requestingOtp.value = false
    return
  }

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
  requestingOtp.value = false
}

function onSubmit(): void {
  showConfirm.value = true
}

function cancelDialog(): void {
  showConfirm.value = false
}

async function confirmDialog(): Promise<void> {
  showConfirm.value = false
  const code = otp.value.trim()
  const account = isPhone.value ? firstContactValue.value : emailFieldValue.value.trim()
  if (!account) {
    showFailToast(t('UIClub_No9') + "，" + t('UIClub_Text71'))
    return
  }
  if (!code) {
    showFailToast(t('UILogin_Code'))
    return
  }

  deleting.value = true
  try {
    const response = await postUserDeleteApi({
      area: zoneCode.value,
      phone: phone.value,
      email: email.value,
      code,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_ApplySubmitFail'))
    }
    showSuccessToast(t('UIClub_DoneSubmitApply2'))
    void router.replace('/mine/settings')
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_ApplySubmitFail')
    showFailToast(message)
  } finally {
    deleting.value = false
  }
}

onBeforeUnmount(() => {
  if (otpTimer !== null) {
    window.clearInterval(otpTimer)
  }
})
</script>

<template>
  <div class="page-shell cancel-account-page" :style="backgroundStyle">
    <HeaderBack :title="pageTitle" />

    <div class="content-wrap">
      <section class="form-stack">
        <div class="form-row">
          <img class="row-icon" :src="icMail" alt="" aria-hidden="true" />
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
              :disabled="requestingOtp || deleting"
              @click="requestOtp"
            >
              {{ otpButtonText }}
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
              placeholder="Enter Passcode"
            />
          </div>
        </div>
      </section>
    </div>

    <div class="bottom-bar">
      <button class="submit-btn" type="button" :disabled="deleting" @click="onSubmit">
        注销账号
      </button>
    </div>

    <div v-if="showConfirm" class="dialog-mask">
        <section class="dialog-card">
          <p class="dialog-title">确认要注销当前账号吗？</p>
          <p class="dialog-desc">注销后账号信息将无法恢复，请谨慎操作。</p>
          <div class="dialog-actions">
            <button class="dialog-btn ghost" type="button" @click="cancelDialog">取消</button>
            <button
              class="dialog-btn primary"
              type="button"
              :disabled="deleting"
              @click="confirmDialog"
            >
              确认注销
            </button>
          </div>
        </section>
      </div>
  </div>
</template>

<style scoped lang="scss">
.cancel-account-page {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  // padding-top: calc(env(safe-area-inset-top) + 0.48rem);
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
  justify-content: flex-start;
  padding-right: 0.3733rem;
}

.prefix {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 1.2684rem;
  // min-width: 0.5667rem;
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
  // min-width: 1.9467rem;
  background: #55606c;
  color: #fff;
  font-family: var(--font-family-sans);
  font-size: 0.3383rem;
}

.otp-btn.countdown {
  background: rgba(0, 0, 0, 0.12);
  color: #ff132b;
}

.otp-btn:disabled {
  opacity: 0.72;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.4rem 0.4533rem calc(env(safe-area-inset-bottom) + 1rem);
}

.submit-btn {
  width: 100%;
  height: 1.4376rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.02);
  border-radius: 1.2684rem;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(2.5px);
  -webkit-backdrop-filter: blur(2.5px);
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
  border-radius: 0.8rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.04);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow:
    inset 1px 1px 0px rgba(255, 255, 255, 0.12),
    inset -1px -1px 0px rgba(255, 255, 255, 0.04);
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
  border: 0.02rem solid rgba(249, 249, 249, 0.02);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  box-shadow: inset 1px 1px 0px rgba(255, 255, 255, 0.12);
  color: #fff;
}

.dialog-btn.primary {
  border: 0.02rem solid rgba(249, 249, 249, 0.02);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  box-shadow: inset 1px 1px 0px rgba(255, 255, 255, 0.12);
  color: #78E490;
}
</style>

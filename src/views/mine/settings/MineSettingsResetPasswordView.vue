<script setup lang="ts">
import { md5 } from 'js-md5'
import { computed, onBeforeUnmount, ref } from 'vue'
import { Loading, showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import {
  postUserModifyPasswordApi,
  postUserSendCodeApi,
  postUserSendEmailCodeApi,
} from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import icPhone from '@/assets/icons/ic_phone.svg'
import icLock from '@/assets/icons/ic_lock.svg'
import icKey from '@/assets/icons/ic_key.svg'
import icEye from '@/assets/icons/ic_eye.svg'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import StorageKey from '@/constants/storageKey'
import { getLocale, t } from '@/i18n'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import { localStore } from '@/utils/localStore'

type ContactType = 'phone' | 'email'

const LOGIN_ACCOUNT_TYPE_KEY = 'LAST_LOGIN_ACCOUNT_TYPE'
const LOGIN_EMAIL_KEY = 'USER_Email'
const LOGIN_TYPE_EMAIL = 2

const router = useRouter()
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()

const backgroundStyle = computed(() => ({
  '--reset-password-bg-dark': `url(${mainBgUrl})`,
  '--reset-password-bg-light': `url(${mainBgLightUrl})`,
}))

const otpCountdown = ref(0)
const acceptedPolicy = ref(false)
const showPassword = ref(false)
const requestingOtp = ref(false)
const submitting = ref(false)
const otp = ref('')
const password = ref('')
let otpTimer: number | null = null

const user = computed(() => userInfoStore.userInfo?.user)
const savedLoginType = Number(localStore.getItem<number | string>(LOGIN_ACCOUNT_TYPE_KEY, 1))

const phoneNumber = computed(() =>
  String(
    user.value?.phone ||
      localStore.getItem<string>(StorageKey.KEY_PHONE, '') ||
      (gameStore.loginAccount.includes('@') ? '' : gameStore.loginAccount),
  ).trim(),
)

const email = computed(() =>
  String(
    user.value?.email ||
      localStore.getItem<string>(LOGIN_EMAIL_KEY, '') ||
      (gameStore.loginAccount.includes('@') ? gameStore.loginAccount : ''),
  ).trim(),
)

const areaCode = computed(() =>
  String(user.value?.area || localStore.getItem<string>(StorageKey.KEY_PHONE_FIRST, '55') || '55')
    .trim()
    .replace(/^\+/, ''),
)

const contactType = computed<ContactType>(() => {
  const prefersEmail = savedLoginType === LOGIN_TYPE_EMAIL || gameStore.loginAccount.includes('@')
  if (prefersEmail && email.value) {
    return 'email'
  }
  if (!prefersEmail && phoneNumber.value) {
    return 'phone'
  }
  return email.value && !phoneNumber.value ? 'email' : 'phone'
})

const isPhone = computed(() => contactType.value === 'phone')
const accountValue = computed(() => (isPhone.value ? phoneNumber.value : email.value))
const otpButtonText = computed(() =>
  otpCountdown.value > 0 ? `${otpCountdown.value}s` : t('UILogin_GetCode'),
)
const canSubmit = computed(
  () =>
    Boolean(accountValue.value) &&
    Boolean(otp.value.trim()) &&
    password.value.trim().length >= 6 &&
    acceptedPolicy.value,
)

function localeToServerLang(): number {
  const locale = getLocale()
  if (locale === 'en') return 1
  if (locale === 'zh') return 2
  if (locale === 'pt') return 3
  return 0
}

// function openAgreement(): void {
//   void router.push('/mine/settings/doc/agreement')
// }

function startOtpCountdown(): void {
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
}

async function requestOtp(): Promise<void> {
  if (otpCountdown.value > 0 || requestingOtp.value || submitting.value) {
    return
  }
  if (!accountValue.value) {
    showFailToast(t('UIClub_No9') + '，' + t('UIClub_Text71'))
    return
  }

  requestingOtp.value = true
  try {
    const response = isPhone.value
      ? await postUserSendCodeApi({
          phone: phoneNumber.value,
          area: areaCode.value,
        })
      : await postUserSendEmailCodeApi({
          email: email.value,
          lang: localeToServerLang(),
        })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_CodeFail3'))
    }
    startOtpCountdown()
    showSuccessToast(t('adaptation10133'))
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_CodeFail3')
    showFailToast(message)
  } finally {
    requestingOtp.value = false
  }
}

async function submitReset(): Promise<void> {
  const code = otp.value.trim()
  const nextPassword = password.value.trim()

  if (!accountValue.value) {
    showFailToast(t('UIClub_No9') + '，' + t('UIClub_Text71'))
    return
  }
  if (!code) {
    showFailToast(t('UILogin_Code'))
    return
  }
  if (nextPassword.length < 6) {
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
      phone: isPhone.value ? phoneNumber.value : undefined,
      email: isPhone.value ? undefined : email.value,
      area: isPhone.value ? areaCode.value : undefined,
      code,
      password: md5(nextPassword),
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
    <HeaderBack :title="t('tc_n53zSvpD')" extra-padding />

    <main class="content-wrap">
      <section class="tab-switch" aria-label="account type">
        <button class="tab-btn" :class="{ active: isPhone }" type="button" disabled>
          {{ t('UISetting_SecurityBindTelItem') }}
        </button>
        <button class="tab-btn" :class="{ active: !isPhone }" type="button" disabled>
          {{ t('UISetting_SecurityBindEmailItem') }}
        </button>
      </section>

      <section class="form-stack">
        <div class="form-row" :class="{ filled: Boolean(accountValue) }">
          <span class="row-icon">
            <img :src="icPhone" alt="" />
          </span>
          <div class="row-main account-row-main">
            <span v-if="isPhone" class="prefix">+{{ areaCode }}</span>
            <span class="account-value" :class="{ empty: !accountValue }">
              {{ accountValue || (isPhone ? t('UILogin_InputMoblie') : t('UILogin_InputEmail')) }}
            </span>
            <button
              class="otp-btn"
              :class="{ countdown: otpCountdown > 0 }"
              type="button"
              :disabled="otpCountdown > 0 || requestingOtp || submitting"
              @click="requestOtp"
            >
              <Loading v-if="requestingOtp" size="20px" />
              <span v-else>{{ otpButtonText }}</span>
            </button>
          </div>
        </div>

        <div class="form-row" :class="{ filled: Boolean(otp.trim()) }">
          <span class="row-icon">
            <img :src="icLock" alt="" />
          </span>
          <div class="row-main">
            <input
              v-model.trim="otp"
              class="input-field"
              type="text"
              inputmode="numeric"
              :placeholder="t('UILogin_Code')"
              autocomplete="one-time-code"
            />
          </div>
        </div>

        <div class="form-row" :class="{ filled: Boolean(password.trim()) }">
          <span class="row-icon">
            <img :src="icKey" alt="" />
          </span>
          <div class="row-main password-row-main">
            <input
              v-model="password"
              class="input-field password-input"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('UILogin_NewPW')"
              autocomplete="new-password"
            />
            <button class="eye-btn" type="button" @click="showPassword = !showPassword">
              <img :src="icEye" alt="" :class="{ visible: showPassword }" />
            </button>
          </div>
        </div>
      </section>

      <!-- <div class="agreement-row">
        <span
          :class="['radio-circle', { 'radio-circle--checked': acceptedPolicy }]"
          @click="acceptedPolicy = !acceptedPolicy"
        ></span>
        <span class="agreement-text agreement-text--link" @click="openAgreement">
          {{ t('UILogin_ReadOK') }}
        </span>
      </div> -->

      <button
        class="submit-btn"
        type="button"
        :disabled="!canSubmit || submitting"
        @click="submitReset"
      >
        {{ submitting ? t('UIClub_Submitting') : t('UIMinePwFinish') }}
      </button>
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.reset-password-page {
  min-height: 100dvh;
  padding: 0 0 0.8rem;
  color: #f9f9f9;
  background-color: var(--c-page);
  background-image: var(--reset-password-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--reset-password-bg-light);
  }
}

.content-wrap {
  padding: 0 0.4533rem;
}

.tab-switch {
  height: 1.4443rem;
  margin-top: 0.28rem;
  display: flex;
  overflow: hidden;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.17);

  @include theme-light {
    background: #e3e3e3;
  }
}

.tab-btn {
  flex: 1;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.84);
  font-family: 'HONOR Sans CN', var(--font-family-sans);
  font-size: 0.4152rem;
  line-height: 1.2;
  opacity: 1;

  @include theme-light {
    color: rgba(0, 0, 0, 0.38);
  }
}

.tab-btn:not(.active) {
  color: rgba(255, 255, 255, 0.42);
  cursor: not-allowed;

  @include theme-light {
    color: rgba(0, 0, 0, 0.38);
  }
}

.tab-btn.active {
  border: 0.0133rem solid rgba(255, 255, 255, 0.7);
  border-radius: 1.3844rem;
  background: linear-gradient(158deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-weight: 600;

  @include theme-light {
    background: var(--c-brand);
    color: #fff;
  }
}

.form-stack {
  margin-top: 0.439rem;
  display: flex;
  flex-direction: column;
  gap: 0.2933rem;
}

.form-row {
  height: 1.4376rem;
  padding-left: 0.4144rem;
  border-radius: 1.6913rem;
  background: rgba(0, 0, 0, 0.22);
  display: flex;
  align-items: center;
  transition: background 0.2s ease;

  @include theme-light {
    background: rgba(0, 0, 0, 0.43);
  }
}

.form-row.filled {
  background: var(--c-brand);

  @include theme-light {
    background: var(--c-brand);
  }
}

.row-icon {
  width: 0.5333rem;
  height: 0.56rem;
  margin-right: 0.16rem;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  img {
    width: 0.5333rem;
    height: 0.56rem;
    object-fit: contain;
  }
}

.row-main {
  min-width: 0;
  height: 100%;
  flex: 1;
  padding: 0 0.3733rem 0 0.5243rem;
  border-radius: 1.6913rem;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
}

.account-row-main {
  padding: 0 0.1963rem 0 0.4176rem;
  gap: 0.22rem;
}

.password-row-main {
  padding-right: 0.3733rem;
}

.prefix {
  min-width: 1.7rem;
  height: 0.8889rem;
  padding: 0 0.25rem;
  flex: none;
  border-radius: 1.2684rem;
  background: rgba(0, 0, 0, 0.12);
  color: #111;
  font-family: 'Afacad', var(--font-family-sans);
  font-size: 0.3383rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.account-value,
.input-field {
  color: #111;
  font-family: 'Afacad', var(--font-family-sans);
  font-size: 0.3805rem;
  font-weight: 500;
  line-height: 1.2;
}

.account-value {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.empty {
    color: rgba(0, 0, 0, 0.38);
  }
}

.password-input[type='password']:not(:placeholder-shown) {
  font-size: 0.54rem;
  letter-spacing: 0.035rem;
}

.input-field {
  min-width: 0;
  height: 100%;
  flex: 1;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;

  &::placeholder {
    color: rgba(0, 0, 0, 0.38);
  }
}

.otp-btn {
  min-width: 2.12rem;
  height: 0.8889rem;
  padding: 0 0.27rem;
  flex: none;
  border: 0;
  border-radius: 1.2684rem;
  background: linear-gradient(152deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-family: 'Afacad', var(--font-family-sans);
  font-size: 0.3383rem;
  font-weight: 500;
  white-space: nowrap;

  @include theme-light {
    background: var(--c-brand);
  }

  &.countdown {
    background: rgba(0, 0, 0, 0.12);
    color: var(--c-profit);
  }

  &:disabled {
    opacity: 1;
  }
}

.eye-btn {
  width: 0.59rem;
  height: 0.59rem;
  padding: 0;
  flex: none;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  img {
    width: 0.5669rem;
    height: 0.5443rem;
    opacity: 0.5;

    &.visible {
      opacity: 1;
    }
  }
}

.agreement-row {
  margin-top: 0.439rem;
  padding: 0 0.13rem;
  display: flex;
  align-items: center;
  gap: 0.13rem;
}

.agreement-row .radio-circle {
  width: 0.35rem;
  height: 0.35rem;
  flex: none;

  &.radio-circle--checked::after {
    width: 0.22rem;
    height: 0.22rem;
  }

  @include theme-light {
    border-color: var(--c-brand);
    box-shadow: none;
  }
}

.agreement-text {
  color: #fff;
  font-family: 'PingFang SC', 'HONOR Sans CN', var(--font-family-sans);
  font-size: 0.27rem;
  font-weight: 500;
  line-height: 1.2;

  @include theme-light {
    color: #000;
  }
}

.agreement-text--link {
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  height: 1.4376rem;
  margin-top: 0.2537rem;
  border: 0;
  border-radius: 1.2684rem;
  background: linear-gradient(168deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #f9f9f9;
  font-family: 'PingFang SC', 'HONOR Sans CN', var(--font-family-sans);
  font-size: 0.535rem;
  font-weight: 500;

  @include theme-light {
    background: var(--c-brand);
  }

  &:disabled {
    opacity: 1;
  }
}
</style>

<script setup lang="ts">
import { md5 } from 'js-md5'
import { computed, onUnmounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import {
  getUserClubApi,
  getUserInfoApi,
  loginApi,
  loginV2Api,
  postUserCheckEmailApi,
  postUserModifyPasswordApi,
  postUserQuickRegisterApi,
  postUserRegisterApi,
  postUserSendEmailCodeApi,
} from '@/api/user'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import { useGameStore } from '@/stores/game'
import LoginSession from '@/session/loginSession'
import { SUPPORTED_LOCALES_OPTIONS, getLocale, setLocale, t, type LocaleCode } from '@/i18n'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import icPhone from '@/assets/icons/ic_phone.svg'
import icArrowDrop from '@/assets/icons/ic_arrow_drop.svg'
import icLock from '@/assets/icons/ic_lock.svg'
import icKey from '@/assets/icons/ic_key.svg'
import icEye from '@/assets/icons/ic_eye.svg'
import icGlobe from '@/assets/icons/ic_globe.svg'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import imgTextLogo from '@/assets/images/img_text_logo.png'
import imgFishLogo from '@/assets/images/img_fish_logo.png'
import { showGameToast } from '@/components/Toast'
import { Loading } from 'vant'
import { DEBUG_ACCOUNTS, type DebugAccount } from '@/constants/debugAccounts'

type PageMode = 'login' | 'register' | 'forgot'
type ContactType = 'account' | 'email'

const LOGIN_ACCOUNT_TYPE_KEY = 'LAST_LOGIN_ACCOUNT_TYPE'
const LOGIN_EMAIL_KEY = 'USER_Email'
const LOGIN_PHONE_PASSWORD_KEY = 'USER_USERPASSWORD'
const LOGIN_EMAIL_PASSWORD_KEY = 'USER_USEREMAILPASSWORD'
const LOGIN_TYPE_PHONE = 1
const LOGIN_TYPE_EMAIL = 2
const LOGIN_PAGE_STATE_CACHE_KEY = 'LOGIN_VIEW_NEW_STATE_V1'
const LOGIN_PHONE_AREA_SELECTION_KEY = 'LOGIN_PHONE_AREA_SELECTED_V1'

const router = useRouter()
const gameStore = useGameStore()

// ---------- State ----------
const pageMode = ref<PageMode>('login')
const contactType = ref<ContactType>('account')
const form = reactive({
  account: '',
  email: '',
  area: '55',
  code: '',
  password: '',
})
const currentLang = ref<LocaleCode>(getLocale())
const showPassword = ref(false)
// const agreed = ref(false)
const showLanguageModal = ref(false)
// const showProtocolConfifm = ref(false)
const showDebugAccountDialog = ref(false)
// const pendingAgreementSubmit = ref(false)
const loading = ref(false)
const errorText = ref('')
const errorVisible = ref(false)
let errorTimer: ReturnType<typeof setTimeout> | null = null

function showError(text: string) {
  if (errorTimer) clearTimeout(errorTimer)
  errorText.value = text
  errorVisible.value = true
  errorTimer = setTimeout(() => {
    errorVisible.value = false
  }, 3000)
}

const handleSelectLang = (lang: string) => {
  const matched = SUPPORTED_LOCALES_OPTIONS.find((item) => item.value === lang)?.value
  const next = (matched || getLocale()) as LocaleCode
  setLocale(next)
  currentLang.value = next
  showLanguageModal.value = false
}

// OTP countdown
const otpCountdown = ref(0)
const otpSending = ref(false)
let otpTimer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (otpTimer) clearInterval(otpTimer)
  if (errorTimer) clearTimeout(errorTimer)
})

onBeforeRouteLeave((to) => {
  if (to.path === '/protocol' || to.path === '/login/phone-area') {
    savePageState()
  }
})

// 在首帧渲染前同步恢复输入态，避免从空值到有值造成背景闪动。
hydrateFormFromLocal()
restorePageState()
consumePhoneAreaSelection()

// ---------- Computed ----------
const contactValue = computed(() => (contactType.value === 'account' ? form.account : form.email))

// const agreementPrefix = computed(() => {
//   const full = t('UILogin_ReadOK')
//   const idx = full.indexOf('《')
//   return idx > -1 ? full.slice(0, idx) : full
// })
// const agreementProtocol = computed(() => {
//   const full = t('UILogin_ReadOK')
//   const idx = full.indexOf('《')
//   return idx > -1 ? full.slice(idx) : ''
// })

const contactPlaceholder = computed(() =>
  contactType.value === 'account'
    ? t('UILogin_Account', 'Please enter account ID')
    : t('UILogin_InputEmail'),
)

// const needAgreement = computed(() => pageMode.value !== 'forgot')

const canSubmit = computed(() => {
  if (!contactValue.value.trim()) return false
  if (form.password.trim().length < 6) return false
  if (pageMode.value === 'login') return true
  if (contactType.value === 'email') {
    if (!form.code.trim()) return false
    if (form.code.trim().length !== 4) return false
  }
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

const isAccount = computed(() => contactType.value === 'account')

const contactModel = computed({
  get: () => (contactType.value === 'account' ? form.account : form.email),
  set: (val: string) => {
    if (contactType.value === 'account') {
      form.account = val
    } else {
      form.email = val
    }
  },
})

const quickDebugAccounts = computed(() => DEBUG_ACCOUNTS.slice(0, 20))

// ---------- Actions ----------
function switchContact(type: ContactType) {
  if (contactType.value === type) return
  resetOtpCountdown()
  form.code = ''
  localStore.setItem(
    LOGIN_ACCOUNT_TYPE_KEY,
    type === 'account' ? LOGIN_TYPE_PHONE : LOGIN_TYPE_EMAIL,
  )
  if (pageMode.value === 'login') {
    form.password = readSavedPassword(type)
  } else {
    form.password = ''
  }
  contactType.value = type
}

function goMode(mode: PageMode) {
  if (pageMode.value === mode) return
  resetOtpCountdown()
  form.code = ''
  pageMode.value = mode
}

function togglePassword() {
  showPassword.value = !showPassword.value
}

async function sendOtp() {
  if (otpCountdown.value > 0 || otpSending.value) return
  const target = contactValue.value.trim()
  if (!validateContactOnly(target)) {
    return
  }

  otpSending.value = true
  try {
    if (contactType.value === 'account') {
      showGameToast(t('UILogin_1010', 'Account login does not support OTP verification'))
      return
    } else {
      const check = await postUserCheckEmailApi({ email: target })

      if (pageMode.value === 'forgot' && check.code === 0) {
        showError(t('UILogin_EmaliNoRegister'))
        return
      }
      if (pageMode.value === 'register' && check.code !== 0) {
        throw new Error(check.message || `error: ${check.code}`)
      }

      const result = await postUserSendEmailCodeApi({
        lang: localeToServerLang(currentLang.value),
        email: target,
      })
      if (result.code !== 0) {
        throw new Error(result.message || `error: ${result.code}`)
      }
    }
    startOtpCountdown()
    showGameToast(t('UILogin_1007'))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed'
    console.log('sendOtp error', message)
    message
  } finally {
    otpSending.value = false
  }
}

function startOtpCountdown() {
  if (otpTimer) clearInterval(otpTimer)
  otpCountdown.value = 60
  otpTimer = setInterval(() => {
    otpCountdown.value--
    if (otpCountdown.value <= 0) {
      if (otpTimer) clearInterval(otpTimer)
      otpTimer = null
    }
  }, 1000)
}

function resetOtpCountdown() {
  otpCountdown.value = 0
  if (otpTimer) {
    clearInterval(otpTimer)
    otpTimer = null
  }
}

async function handleSubmit() {
  if (loading.value) return
  if (!canSubmit.value) return
  // if (needAgreement.value && !agreed.value) {
  //   pendingAgreementSubmit.value = true
  //   showProtocolConfifm.value = true
  //   return
  // }
  await runSubmitFlow()
}

async function runSubmitFlow() {
  const target = contactValue.value.trim()
  if (!validateBeforeSubmit(target)) return
  loading.value = true
  try {
    if (pageMode.value === 'login') {
      await handleLogin(target)
    } else if (pageMode.value === 'register') {
      await handleRegister(target)
    } else {
      await handleForgot(target)
    }
  } catch (error) {
    console.log('[login-new] handleSubmit error:', error)
    const message = error instanceof Error ? error.message : t('UILogin_LoginFailed')
    showError(message)
  } finally {
    loading.value = false
    // pendingAgreementSubmit.value = false
  }
}

// function goProtocolPage(): void {
//   savePageState()
//   void router.push('/protocol')
// }

function goPhoneAreaPage(): void {
  // Area code removed for account mode
  return
}

// function onAgreementIndicatorClick(): void {
//   agreed.value = !agreed.value
// }

// function onAgreementTextClick(): void {
//   goProtocolPage()
// }

// function onProtocolConfirm(): void {
//   agreed.value = true
//   showProtocolConfifm.value = false
//   if (pendingAgreementSubmit.value) {
//     void runSubmitFlow()
//   }
// }

// function onProtocolCancel(): void {
//   pendingAgreementSubmit.value = false
//   showProtocolConfifm.value = false
// }

function openDebugAccountDialog(): void {
  showDebugAccountDialog.value = true
}

function applyDebugAccount(account: DebugAccount): void {
  pageMode.value = 'login'
  contactType.value = 'account'
  form.account = account.account
  form.password = account.password
  form.area = '55'
  // agreed.value = true
  showDebugAccountDialog.value = false
}

async function handleLogin(target: string) {
  let res
  if (contactType.value === 'account') {
    res = await loginApi({
      qk_account: target,
      password: md5(form.password.trim()),
      device_id: 'ios',
      platform: 5,
      system_language: 'en-US',
    })
  } else {
    res = await loginV2Api({
      email: target,
      password: md5(form.password.trim()),
    })
  }
  const token = String(res.token || '').trim()
  if (!token) {
    throw new Error('登录接口返回缺少 token')
  }

  gameStore.setSessionToken(token)
  gameStore.setLoginUser({
    account: target,
    nickname: target,
    userId: '',
  })
  persistLoginDraft()
  const expireAt = Number((res as Record<string, unknown>).expire_at || 0)
  if (Number.isFinite(expireAt) && expireAt > 0) {
    localStore.setItem(StorageKey.TOKEN_EXPIREAT, expireAt)
  }

  try {
    await LoginSession.SyncWS()
    const userInfo = await getUserInfoApi()
    void getUserClubApi().catch((error) => {
      console.warn('[login-new] sync club failed:', error)
    })

    const user = userInfo.user as Record<string, unknown>
    const userId = String(user.p_u_id ?? user.pUid ?? user.userid ?? user.un_id ?? '')
    const nickname = String(user.nickname ?? target)
    gameStore.setLoginUser({
      account: target,
      nickname,
      userId,
    })
  } catch (error) {
    LoginSession.ClearWS()
    gameStore.clearLogin()
    throw error
  }
  await router.replace({ name: 'lobby' })
}

async function handleRegister(target: string) {
  const password = md5(form.password.trim())
  let res
  if (contactType.value === 'account') {
    res = await postUserQuickRegisterApi(
      { qk_account: target, password, code: '1111', system_language: 'en-US', device_id: 'ios', platform: 5 },
      { suppressBusinessToast: true },
    )
  } else {
    res = await postUserRegisterApi(
      { email: target, password, code: form.code.trim(), platform: 5 },
      { suppressBusinessToast: true },
    )
  }
  if (res.code !== 0) {
    throw new Error(res.message || `error: ${res.code}`)
  }
  await handleLogin(target)
}

async function handleForgot(target: string) {
  const payload: Record<string, unknown> = {
    password: md5(form.password.trim()),
    code: form.code.trim(),
  }
  if (contactType.value === 'account') {
    showGameToast('Account password recovery is disabled.')
    return
  } else {
    payload.email = target
  }
  const res = await postUserModifyPasswordApi(payload)
  if (res.code !== 0) {
    throw new Error(res.message || `error: ${res.code}`)
  }
  showGameToast(t('UILogin_1009'))
  pageMode.value = 'login'
  resetOtpCountdown()
}

function validateContactOnly(target: string): boolean {
  if (!target) {
    showGameToast(contactType.value === 'account' ? t('UILogin_Account', 'Please enter account name') : t('UILogin_InputEmail'))
    return false
  }
  if (contactType.value === 'account' && target.length <= 3) {
    showGameToast(t('UILogin_Account', 'Please enter account name'))
    return false
  }
  if (contactType.value === 'email' && !isEmail(target)) {
    showError(t('UILogin_InputEmail'))
    return false
  }
  return true
}

function validateBeforeSubmit(target: string): boolean {
  if (!validateContactOnly(target)) return false
  if (form.password.trim().length < 6) {
    showError(t('UILogin_1002'))
    return false
  }
  if (pageMode.value !== 'login' && contactType.value === 'email') {
    const code = form.code.trim()
    if (!code) {
      showError(t('UILogin_1008'))
      return false
    }
    if (code.length !== 4) {
      showError(t('error1001'))
      return false
    }
  }
  return true
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeArea(): string {
  const safe = form.area.trim().replace('+', '')
  return safe || '55'
}

function readSavedPassword(type: ContactType): string {
  if (type === 'account') {
    return readLocalString(LOGIN_PHONE_PASSWORD_KEY)
  }
  return readLocalString(LOGIN_EMAIL_PASSWORD_KEY)
}

function readLocalString(key: string, fallback = ''): string {
  const value = localStore.getItem<string>(key, fallback)
  return typeof value === 'string' ? value : fallback
}

function hydrateFormFromLocal() {
  const storedType = Number(
    localStore.getItem<number | string>(LOGIN_ACCOUNT_TYPE_KEY, LOGIN_TYPE_PHONE),
  )
  contactType.value = storedType === LOGIN_TYPE_EMAIL ? 'email' : 'account'
  form.area = readLocalString(StorageKey.KEY_PHONE_FIRST, '55') || '55'
  form.account = readLocalString(StorageKey.KEY_PHONE, gameStore.loginAccount || '')
  form.email = readLocalString(LOGIN_EMAIL_KEY)
  form.password = readSavedPassword(contactType.value)
}

function persistLoginDraft() {
  const password = form.password.trim()
  localStore.setItem(
    LOGIN_ACCOUNT_TYPE_KEY,
    contactType.value === 'account' ? LOGIN_TYPE_PHONE : LOGIN_TYPE_EMAIL,
  )
  if (contactType.value === 'account') {
    localStore.setItem(StorageKey.KEY_PHONE, form.account.trim())
    localStore.setItem(StorageKey.KEY_PHONE_FIRST, normalizeArea())
    localStore.setItem(LOGIN_PHONE_PASSWORD_KEY, password)
    return
  }
  localStore.setItem(LOGIN_EMAIL_KEY, form.email.trim())
  localStore.setItem(LOGIN_EMAIL_PASSWORD_KEY, password)
}

function localeToServerLang(locale: string): number {
  if (locale === 'en') return 1
  if (locale === 'zh') return 2
  if (locale === 'pt') return 3
  return 0
}

interface LoginPageStateSnapshot {
  pageMode: PageMode
  contactType: ContactType
  form: {
    account: string
    email: string
    area: string
    code: string
    password: string
  }
  currentLang: LocaleCode
  showPassword: boolean
  // agreed: boolean
  showLanguageModal: boolean
  // showProtocolConfifm: boolean
  showDebugAccountDialog: boolean
  // pendingAgreementSubmit: boolean
}

function savePageState(): void {
  if (typeof window === 'undefined') return
  const snapshot: LoginPageStateSnapshot = {
    pageMode: pageMode.value,
    contactType: contactType.value,
    form: {
      account: form.account,
      email: form.email,
      area: form.area,
      code: form.code,
      password: form.password,
    },
    currentLang: currentLang.value,
    showPassword: showPassword.value,
    // agreed: agreed.value,
    showLanguageModal: showLanguageModal.value,
    // showProtocolConfifm: showProtocolConfifm.value,
    showDebugAccountDialog: showDebugAccountDialog.value,
    // pendingAgreementSubmit: pendingAgreementSubmit.value,
  }
  window.sessionStorage.setItem(LOGIN_PAGE_STATE_CACHE_KEY, JSON.stringify(snapshot))
}

function restorePageState(): void {
  if (typeof window === 'undefined') return
  const raw = window.sessionStorage.getItem(LOGIN_PAGE_STATE_CACHE_KEY)
  if (!raw) return
  window.sessionStorage.removeItem(LOGIN_PAGE_STATE_CACHE_KEY)

  try {
    const parsed = JSON.parse(raw) as Partial<LoginPageStateSnapshot>
    pageMode.value =
      parsed.pageMode === 'register' || parsed.pageMode === 'forgot' ? parsed.pageMode : 'login'
    contactType.value = parsed.contactType === 'email' ? 'email' : 'account'
    form.account = String(parsed.form?.account || form.account)
    form.email = String(parsed.form?.email || form.email)
    form.area = String(parsed.form?.area || form.area)
    form.code = String(parsed.form?.code || '')
    form.password = String(parsed.form?.password || form.password)
    currentLang.value = parsed.currentLang || currentLang.value
    showPassword.value = Boolean(parsed.showPassword)
    // agreed.value = Boolean(parsed.agreed)
    showLanguageModal.value = Boolean(parsed.showLanguageModal)
    // showProtocolConfifm.value = Boolean(parsed.showProtocolConfifm)
    showDebugAccountDialog.value = Boolean(parsed.showDebugAccountDialog)
    // pendingAgreementSubmit.value = Boolean(parsed.pendingAgreementSubmit)
  } catch {
    // ignore parse errors
  }
}

function consumePhoneAreaSelection(): void {
  if (typeof window === 'undefined') return
  const selected = window.sessionStorage.getItem(LOGIN_PHONE_AREA_SELECTION_KEY)
  if (!selected) return
  window.sessionStorage.removeItem(LOGIN_PHONE_AREA_SELECTION_KEY)
  const normalized = String(selected).trim().replace('+', '')
  if (!normalized) return
  form.area = normalized
  localStore.setItem(StorageKey.KEY_PHONE_FIRST, normalized)
}
</script>

<template>
  <div class="login-page">
    <!-- Background -->
    <!-- <img class="login-bg" :src="bgLogin" alt="" /> -->

    <!-- Status bar area -->
    <div class="status-bar">
      <!-- <span class="debug-trigger" @click="openDebugAccountDialog">DEV</span> -->
      <button class="lang-btn" @click="showLanguageModal = true">
        <img :src="icGlobe" alt="" />
        <span class="lang-text">{{ currentLang.toUpperCase() }}</span>
      </button>
    </div>

    <!-- Logo hero -->
    <div class="logo-hero">
      <img class="logo-hero__fish" :src="imgFishLogo" alt="" />
      <div class="logo-hero__text">
        <p class="logo-hero__title">小鱼视频真人竞技</p>
        <p class="logo-hero__subtitle">xypk.com</p>
      </div>
    </div>

    <!-- Content card -->
    <div class="login-card">
      <!-- Form panel with dark background -->
      <div class="form-panel">
        <!-- Contact type tabs: phone / email -->
        <div class="tab-row">
          <button
            :class="['tab-item', { 'tab-item--active': contactType === 'account' }]"
            @click="switchContact('account')"
          >
            {{ pageMode === 'register' ? t('UIloginPhone_Registertext') : t('UIloginPhone_logintext') }}
          </button>
          <button
            :class="['tab-item', { 'tab-item--active': contactType === 'email' }]"
            @click="switchContact('email')"
          >
            {{ pageMode === 'register' ? t('UIloginEmail_Registertext') : t('UIloginEmail_logintext') }}
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
              <!-- Area code selector (phone mode only) - removed for Account ID login -->
              <input
                v-model="contactModel"
                class="input-field"
                type="text"
                :placeholder="contactPlaceholder"
                autocomplete="off"
              />
              <!-- OTP button -->
              <button
                v-if="pageMode !== 'login' && contactType === 'email'"
                :class="['otp-btn', { 'otp-btn--disabled': otpCountdown > 0 || otpSending }]"
                :disabled="otpCountdown > 0 || otpSending"
                @click.prevent="sendOtp"
              >
                <Loading v-if="otpSending" size="20px" />
                <span v-else>{{ otpBtnText }}</span>
              </button>
            </div>
          </div>

          <!-- OTP code input (email register & forgot only) -->
          <div
            v-if="pageMode !== 'login' && contactType === 'email'"
            :class="['input-row', { 'input-row--filled': !!form.code.trim() }]"
          >
            <div class="input-icon-wrap">
              <img class="input-icon" :src="icLock" alt="" />
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
              <img class="input-icon" :src="icKey" alt="" />
            </div>
            <div class="input-inner input-inner--plain">
              <input
                v-model="form.password"
                class="input-field"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="pageMode === 'forgot' ? t('UILogin_NewPW') : t('UILogin_InputPW')"
                autocomplete="off"
              />
              <button class="eye-btn" @click.prevent="togglePassword">
                <img :src="icEye" alt="" />
              </button>
            </div>
          </div>
        </div>

        <!-- Error snackbar -->
        <Transition name="snackbar">
          <div v-if="errorVisible" class="error-snackbar">{{ errorText }}</div>
        </Transition>

        <!-- Bottom area -->
        <div class="bottom-area">
          <!-- Action links row -->
          <div class="action-links">
            <!-- <button v-if="pageMode === 'login'" class="link-btn" @click="goMode('forgot')">
              {{ t('UILogin_Forget') }}
            </button> -->
            <span></span>
            <button
              class="link-btn link-btn--right"
              @click="goMode(pageMode === 'login' ? 'register' : 'login')"
            >
              {{ pageMode === 'login' ? t('UILogin_Register') : t('UILogin_BtnLogin') }}
            </button>
          </div>

          <!-- Agreement checkbox (register only) -->
          <!-- <div v-if="needAgreement" class="agreement-row">
            <img
              class="agreement-checkbox-icon"
              :src="agreed ? icCheckbox : icUncheckbox"
              alt=""
              @click="onAgreementIndicatorClick"
            />
            <span class="agreement-text">{{ agreementPrefix }}</span>
            <span class="agreement-text agreement-text--protocol" @click="onAgreementTextClick">{{
              agreementProtocol
            }}</span>
          </div> -->

          <!-- Submit button -->
          <PrimaryButton
            :text="submitText"
            :disabled="!canSubmit"
            :loading="loading"
            @click="handleSubmit"
          />
          <img :src="imgTextLogo" class="text-logo" alt="" />
        </div>
      </div>
    </div>
  </div>
  <GameDialog
    v-model:show="showLanguageModal"
    :show-confirm-button="false"
    :close-on-click-overlay="true"
    :card-style="{ paddingTop: '0.06rem', paddingBottom: '0.04rem' }"
    :body-style="{ textAlign: 'left' }"
  >
    <div
      v-for="lang in SUPPORTED_LOCALES_OPTIONS"
      :key="lang.value"
      class="language-item"
      @click="handleSelectLang(lang.value)"
    >
      <span>{{ lang.label }}</span>
      <img
        class="lang-radio-icon"
        :src="lang.value === currentLang ? icCheckbox : icUncheckbox"
        alt=""
      />
    </div>
  </GameDialog>
  <GameDialog
    v-model:show="showDebugAccountDialog"
    :title="'测试账号'"
    :show-confirm-button="false"
    :close-on-click-overlay="true"
  >
    <div
      v-for="item in quickDebugAccounts"
      :key="item.account"
      class="debug-account-item"
      @click="applyDebugAccount(item)"
    >
      <span>{{ item.account }}</span>
      <span class="ml-5">{{ item.nickname }}</span>
    </div>
  </GameDialog>
  <!-- <GameDialog
    v-model:show="showProtocolConfifm"
    :title="t('UILoginConfirmTitle')"
    :close-on-click-overlay="true"
    :show-cancel-button="true"
    :confirm-button-text="t('adaptation20085')"
    :cancel-button-text="t('UIPrivacyDisagree')"
    @confirm="onProtocolConfirm"
    @cancel="onProtocolCancel"
  >
    <div>
      <span>{{ t('UILoginConfirmContent') }}</span>
      <span class="text-primary ml-2 protocol-link" @click="goProtocolPage">
        {{ t('UIMine_Setting_UserSecret') }}
      </span>
    </div>
  </GameDialog> -->
</template>

<style scoped lang="scss">
.login-page {
  background: url(@/assets/images/main_bg.webp) no-repeat center/cover;
  min-height: 100vh;
  position: relative;
}

/* Status bar */
.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 0.47rem 0.5rem 0;
  height: 1.33rem;
}

.debug-trigger {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.34rem;
  font-family: 'PingFang SC', sans-serif;
  line-height: 0.9rem;
  min-width: 1rem;
  cursor: pointer;
}

.language-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 1rem;
  margin: 0;
  padding: 0.6rem 0.2rem;
  box-sizing: border-box;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0.2rem;
    right: 0.2rem;
    height: 0.2px;
    background: rgba(255, 255, 255, 0.1);
  }

  &:last-child::after {
    display: none;
  }

  .radio-circle {
    width: 0.42rem;
    height: 0.42rem;
    &--checked {
      &::after {
        width: 0.26rem;
        height: 0.26rem;
      }
    }
  }

  .debug-account-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 1.1rem;
    border-bottom: 0.2px solid rgba(255, 255, 255, 0.2);
    padding: 0 0.08rem;
    cursor: pointer;
  }
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
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
}

/* Logo hero */
.logo-hero {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 72vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
}

.logo-hero__fish {
  width: 5.2rem;
  object-fit: contain;
}

.logo-hero__text {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
}

.logo-hero__title {
  font-family: 'PingFang SC', sans-serif;
  font-weight: 600;
  font-size: 0.54rem;
  color: #fff;
  margin: 0;
}

.logo-hero__subtitle {
  font-family: 'PingFang SC', sans-serif;
  font-weight: 700;
  font-size: 0.35rem;
  color: #fff;
  margin: 0;
}

/* Card */
.login-card {
  position: absolute;
  width: 100%;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.form-panel {
  background: transparent;
  padding: 0.4rem 0.46rem 0.53rem;
  height: 72vh;
  display: flex;
  flex-direction: column;
}

/* Tabs */
.tab-row {
  display: flex;
  align-items: center;
  gap: 0.53rem;
  margin-bottom: 0.69rem;
}

.tab-item {
  flex: 1;
  height: 0.96rem;
  background: linear-gradient(
    197.83deg,
    rgba(128, 128, 128, 0.52) 20.7%,
    rgba(71, 71, 71, 0.52) 73.7%
  );
  border: none;
  border-radius: 0.674rem;
  backdrop-filter: blur(0.533rem);
  -webkit-backdrop-filter: blur(0.533rem);
  box-shadow:
    inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5),
    0.045rem 0.053rem 0.105rem rgba(0, 0, 0, 0.25);
  font-size: 0.405rem;
  font-family: 'PingFang SC', sans-serif;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  padding: 0 0.72rem;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.34px;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
      rgba(255, 255, 255, 0.5) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &--active {
    background: linear-gradient(165.14deg, rgb(255, 81, 108) 7.5%, rgb(223, 35, 64) 71.9%);
    border-radius: 9rem;
    backdrop-filter: blur(2.102rem);
    -webkit-backdrop-filter: blur(2.102rem);
    box-shadow:
      inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
      inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5),
      0.364rem 0.252rem 0.476rem rgba(110, 2, 2, 0.27);
    font-weight: 500;
  }
}

/* Form */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.59rem;
}

.input-row {
  display: flex;
  align-items: center;
  height: 1.44rem;
  // Outer pill: green background
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1.69rem;
  padding-left: 0.41rem;
  position: relative;
  transition: background 0.2s;

  // When input has content, outer background turns green
  &--filled {
    background: rgba(85, 243, 41, 1);
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
  background: rgba(255, 255, 255, 0.8);
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
  padding: 0 0.3rem;
  margin-left: 0.41rem;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 1.27rem;
  border: 0;
  cursor: pointer;

  span {
    font-size: 0.33rem;
    margin: 0 0.1rem;
    font-weight: 500;
    font-family: 'PingFang SC', sans-serif;
    color: #000;
  }

  img {
    width: 0.24rem;
    height: 0.13rem;
    margin-left: 0.05rem;
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
  font-family: 'PingFang SC', sans-serif;
  color: #000;
  padding-left: 0.5rem;
  min-width: 0;

  &::placeholder {
    color: rgba(0, 0, 0, 0.38);
  }
}

.otp-btn {
  flex-shrink: 0;
  height: 0.91rem;
  padding: 0 0.27rem;
  min-width: 2rem;
  background: linear-gradient(157deg, #55f329 0%, #3ead06 100%);
  border-radius: 1.27rem;
  border: 0;
  cursor: pointer;
  font-size: 0.34rem;
  font-weight: 500;
  font-family: 'PingFang SC', sans-serif;
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
  margin-top: 0.6rem;
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
  border: none;
  font-size: 0.405rem;
  font-weight: 500;
  font-family: 'PingFang SC', sans-serif;
  color: #fff;
  cursor: pointer;
  height: 0.96rem;
  padding: 0 0.48rem;
  text-align: center;
  border-radius: 1.08rem;
  white-space: nowrap;
  background: linear-gradient(157deg, #ff4d6a 0%, #d41e3c 100%);
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.34px;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
      rgba(255, 255, 255, 0.5) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &:active {
    opacity: 0.92;
    transform: scale(0.985);
  }
}

.link-btn--right {
  background: linear-gradient(157deg, #7fcfff 0%, #4a8fe0 100%);
}

/* Agreement */
.agreement-row {
  display: flex;
  align-items: center;
  gap: 0.13rem;
  padding: 0 0.13rem;
}
.radio-circle {
  width: 0.35rem;
  height: 0.35rem;
  &--checked {
    &::after {
      width: 0.22rem;
      height: 0.22rem;
    }
  }
}

.lang-radio-icon {
  width: 0.48rem;
  height: 0.48rem;
  flex-shrink: 0;
}

.agreement-text {
  font-size: 0.27rem;
  font-weight: 500;
  color: #e6e6e6;
  font-family: 'PingFang SC', sans-serif;
}

.agreement-text--link {
  cursor: pointer;
}

.agreement-checkbox-icon {
  width: 0.48rem;
  height: 0.48rem;
  flex-shrink: 0;
  cursor: pointer;
}

.agreement-text--protocol {
  color: #4a90e2;
  cursor: pointer;
}

.protocol-link {
  cursor: pointer;
  color: #4a90e2;
}
.primary-btn {
  height: 1.44rem;
}

.text-logo {
  display: block;
  width: 2.6rem;
  margin: 0 auto 0;
}

/* Error snackbar */
.error-snackbar {
  background: rgba(250, 43, 75, 0.14);
  border: none;
  border-radius: 0.422rem;
  padding: 0.152rem 0.355rem;
  font-size: 0.236rem;
  font-weight: 500;
  font-family: 'PingFang SC', sans-serif;
  color: #fff;
  text-align: center;
  margin-top: 0.27rem;
  position: relative;
  box-shadow:
    inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.34px;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
      rgba(255, 255, 255, 0.5) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.snackbar-enter-active,
.snackbar-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.snackbar-enter-from,
.snackbar-leave-to {
  opacity: 0;
  transform: translateY(-0.16rem);
}
</style>

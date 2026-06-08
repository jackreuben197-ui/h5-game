<script setup lang="ts">
import { md5 } from 'js-md5'
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  loginV2Api,
  postUserCheckEmailApi,
  postUserCheckPhoneApi,
  postUserModifyPasswordApi,
  postUserRegisterApi,
  postUserSendCodeApi,
  postUserSendEmailCodeApi,
} from '@/api/user'
import StorageKey from '@/constants/storageKey'
import { localStore } from '@/utils/localStore'
import { useGameStore } from '@/stores/game'
import { useLoginModalStore } from '@/stores/loginModal'
import { syncPostAuthData } from '@/session/postAuthSync'
import { SUPPORTED_LOCALES_OPTIONS, getLocale, setLocale, t, type LocaleCode } from '@/i18n'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import icPhone from '@/assets/icons/ic_phone.svg'
import icArrowDrop from '@/assets/icons/ic_arrow_drop.svg'
import icLock from '@/assets/icons/ic_lock.svg'
import icKey from '@/assets/icons/ic_key.svg'
import icEye from '@/assets/icons/ic_eye.svg'
import icGlobe from '@/assets/icons/ic_globe.svg'
import { showGameToast } from '@/components/Toast'
import { Loading } from 'vant'
import { DEBUG_ACCOUNTS, type DebugAccount } from '@/constants/debugAccounts'
import {
  resolveInviteCode,
  resolveTraceHash,
  shouldOpenRegisterMode,
  resolveAgentInviteCode,
  clearAgentInviteCodeCache,
} from '@/utils/channelPackage'
import ProtocolView from './components/ProtocolView.vue'
import LoginPhoneAreaView from './components/LoginPhoneAreaView.vue'

type PageMode = 'login' | 'register' | 'forgot'
type ContactType = 'phone' | 'email'

const LOGIN_ACCOUNT_TYPE_KEY = 'LAST_LOGIN_ACCOUNT_TYPE'
const LOGIN_EMAIL_KEY = 'USER_Email'
const LOGIN_PHONE_PASSWORD_KEY = 'USER_USERPASSWORD'
const LOGIN_EMAIL_PASSWORD_KEY = 'USER_USEREMAILPASSWORD'
const LOGIN_TYPE_PHONE = 1
const LOGIN_TYPE_EMAIL = 2

const PROTOCOL_TYPE_AGREEMENT = 3

// 登录成功后：当前在 guest 假页时切到对应真页；在真页时原地不动。
const GUEST_TO_REAL_ROUTE: Record<string, string> = {
  'guest-home': 'lobby',
  'guest-club': 'club',
  'guest-friendsTable': 'friendsTable',
  'guest-message': 'message',
  'guest-mine': 'mine',
}

const router = useRouter()
const gameStore = useGameStore()
const loginModalStore = useLoginModalStore()

const pageMode = ref<PageMode>('login')
const contactType = ref<ContactType>('phone')
const form = reactive({
  phone: '',
  email: '',
  area: '55',
  code: '',
  password: '',
})
const currentLang = ref<LocaleCode>(getLocale())
const showPassword = ref(false)
const agreed = ref(false)
const showLanguageModal = ref(false)
const showProtocolConfifm = ref(false)
const showDebugAccountDialog = ref(false)
const showProtocolPanel = ref(false)
const showPhoneAreaPanel = ref(false)
const pendingAgreementSubmit = ref(false)
const loading = ref(false)
const inviteCodeFromChannel = ref('')
const traceHashFromChannel = ref('')

const handleSelectLang = (lang: string) => {
  const matched = SUPPORTED_LOCALES_OPTIONS.find((item) => item.value === lang)?.value
  const next = (matched || getLocale()) as LocaleCode
  setLocale(next)
  currentLang.value = next
  showLanguageModal.value = false
}

const otpCountdown = ref(0)
const otpSending = ref(false)
let otpTimer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (otpTimer) clearInterval(otpTimer)
})

hydrateFormFromLocal()
applyChannelInviteContext()

watch(
  () => loginModalStore.visible,
  (visible) => {
    if (!visible) {
      showProtocolPanel.value = false
      showPhoneAreaPanel.value = false
      showLanguageModal.value = false
      showProtocolConfifm.value = false
      showDebugAccountDialog.value = false
      pendingAgreementSubmit.value = false
      // 关闭未登录态弹窗（含点击遮罩关闭）时清空残留的跳转目标，避免下次登录被错误带跳。
      loginModalStore.pendingRedirect = ''
      return
    }
    // 每次打开同步一次最新缓存（避免外部修改导致状态过期）。
    currentLang.value = getLocale()
    hydrateFormFromLocal()
  },
)

const contactValue = computed(() => (contactType.value === 'phone' ? form.phone : form.email))

const contactPlaceholder = computed(() =>
  contactType.value === 'phone' ? t('UILogin_InputMoblie') : t('UILogin_InputEmail'),
)

const needAgreement = computed(() => pageMode.value !== 'forgot')

const canSubmit = computed(() => {
  if (!contactValue.value.trim()) return false
  if (form.password.trim().length < 6) return false
  if (pageMode.value === 'login') return true
  if (!form.code.trim()) return false
  if (form.code.trim().length !== 4) return false
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
  get: () => (contactType.value === 'phone' ? form.phone : form.email),
  set: (val: string) => {
    if (contactType.value === 'phone') {
      form.phone = val
    } else {
      form.email = val
    }
  },
})

const quickDebugAccounts = computed(() => DEBUG_ACCOUNTS.slice(0, 20))

function switchContact(type: ContactType) {
  if (contactType.value === type) return
  resetOtpCountdown()
  form.code = ''
  localStore.setItem(LOGIN_ACCOUNT_TYPE_KEY, type === 'phone' ? LOGIN_TYPE_PHONE : LOGIN_TYPE_EMAIL)
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
    if (contactType.value === 'phone') {
      const check = await postUserCheckPhoneApi(
        {
          phone: target,
          area: normalizeArea(),
        },
        pageMode.value === 'forgot' ? { suppressBusinessCodes: [90005] } : {},
      )

      if (pageMode.value === 'forgot' && check.code === 0) {
        showGameToast(t('UILogin_1010'))
        return
      }
      if (pageMode.value === 'register' && check.code !== 0) {
        throw new Error(check.message || `error: ${check.code}`)
      }

      const result = await postUserSendCodeApi({
        phone: target,
        area: normalizeArea(),
      })
      if (result.code !== 0) {
        throw new Error(result.message || `error: ${result.code}`)
      }
    } else {
      const check = await postUserCheckEmailApi({ email: target })

      if (pageMode.value === 'forgot' && check.code === 0) {
        showGameToast(t('UILogin_EmaliNoRegister'))
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
  if (needAgreement.value && !agreed.value) {
    pendingAgreementSubmit.value = true
    showProtocolConfifm.value = true
    return
  }
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
    console.log('[login-modal] handleSubmit error:', error)
  } finally {
    loading.value = false
    pendingAgreementSubmit.value = false
  }
}

function openProtocolPanel(): void {
  showProtocolPanel.value = true
}

function openPhoneAreaPanel(): void {
  if (contactType.value !== 'phone') {
    return
  }
  showPhoneAreaPanel.value = true
}

function onProtocolPanelBack(): void {
  showProtocolPanel.value = false
}

function onPhoneAreaPanelBack(): void {
  showPhoneAreaPanel.value = false
}

function onPhoneAreaSelected(code: string): void {
  const normalized = String(code || '')
    .trim()
    .replace('+', '')
  if (normalized) {
    form.area = normalized
    localStore.setItem(StorageKey.KEY_PHONE_FIRST, normalized)
  }
  showPhoneAreaPanel.value = false
}

function onAgreementIndicatorClick(): void {
  agreed.value = !agreed.value
}

function onAgreementTextClick(): void {
  openProtocolPanel()
}

function onProtocolConfirm(): void {
  agreed.value = true
  showProtocolConfifm.value = false
  if (pendingAgreementSubmit.value) {
    void runSubmitFlow()
  }
}

function onProtocolCancel(): void {
  pendingAgreementSubmit.value = false
  showProtocolConfifm.value = false
}

function openDebugAccountDialog(): void {
  showDebugAccountDialog.value = true
}

function applyDebugAccount(account: DebugAccount): void {
  pageMode.value = 'login'
  contactType.value = 'phone'
  form.phone = account.account
  form.password = account.password
  form.area = '55'
  agreed.value = true
  showDebugAccountDialog.value = false
}

async function handleLogin(target: string) {
  const effectiveInviteCode = resolveAgentInviteCode() || inviteCodeFromChannel.value

  const res = await loginV2Api({
    phone: contactType.value === 'phone' ? target : undefined,
    email: contactType.value === 'email' ? target : undefined,
    password: md5(form.password.trim()),
    area: contactType.value === 'phone' ? normalizeArea() : undefined,
    invite_code: effectiveInviteCode || undefined,
    trace_hash: traceHashFromChannel.value || undefined,
  })
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

  // 把首页无关的拉取（userInfo/club/全局配置/收费配置/多语言模板/WS）统一收口到登录后处理。
  syncPostAuthData()

  // 优先跳转到登录前记录的目标路径（如点击钱包 tab 触发登录的场景）。
  const pendingRedirect = loginModalStore.consumePendingRedirect()
  if (pendingRedirect) {
    await router.replace(pendingRedirect)
  } else {
    // 假页 → 真页切换；非 guest 路由（如 /wallet）保持原页。
    const currentName = router.currentRoute.value.name
    const realRouteName =
      typeof currentName === 'string' ? GUEST_TO_REAL_ROUTE[currentName] : undefined
    if (realRouteName) {
      await router.replace({ name: realRouteName })
    }
  }
  loginModalStore.close()
  // 登录成功后清除本地缓存的代理邀请码
  clearAgentInviteCodeCache()
}

async function handleRegister(target: string) {
  const effectiveInviteCode = resolveAgentInviteCode() || inviteCodeFromChannel.value

  const payload: Record<string, string | number> = {
    password: md5(form.password.trim()),
    code: form.code.trim(),
    platform: 5,
  }

  if (effectiveInviteCode) {
    payload.invite_code = effectiveInviteCode
  }

  if (traceHashFromChannel.value) {
    payload.trace_hash = traceHashFromChannel.value
  }

  if (contactType.value === 'phone') {
    payload.phone = target
    payload.area = form.area.trim() || '55'
  } else {
    payload.email = target
  }
  const res = await postUserRegisterApi(payload)
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
  if (contactType.value === 'phone') {
    payload.phone = target
    payload.area = form.area.trim() || '55'
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
    showGameToast(contactType.value === 'phone' ? t('UILogin_1001') : t('UILogin_InputEmail'))
    return false
  }
  if (contactType.value === 'phone' && target.length <= 6) {
    showGameToast(t('adaptation10128'))
    return false
  }
  if (contactType.value === 'email' && !isEmail(target)) {
    showGameToast(t('UILogin_InputEmail'))
    return false
  }
  return true
}

function validateBeforeSubmit(target: string): boolean {
  if (!validateContactOnly(target)) return false
  if (form.password.trim().length < 6) {
    showGameToast(t('UILogin_1002'))
    return false
  }
  if (pageMode.value !== 'login') {
    const code = form.code.trim()
    if (!code) {
      showGameToast(t('UILogin_1008'))
      return false
    }
    if (code.length !== 4) {
      showGameToast(t('error1001'))
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
  if (type === 'phone') {
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
  contactType.value = storedType === LOGIN_TYPE_EMAIL ? 'email' : 'phone'
  form.area = readLocalString(StorageKey.KEY_PHONE_FIRST, '55') || '55'
  form.phone = readLocalString(StorageKey.KEY_PHONE, gameStore.loginAccount || '')
  form.email = readLocalString(LOGIN_EMAIL_KEY)
  form.password = readSavedPassword(contactType.value)
}

function persistLoginDraft() {
  const password = form.password.trim()
  localStore.setItem(
    LOGIN_ACCOUNT_TYPE_KEY,
    contactType.value === 'phone' ? LOGIN_TYPE_PHONE : LOGIN_TYPE_EMAIL,
  )
  if (contactType.value === 'phone') {
    localStore.setItem(StorageKey.KEY_PHONE, form.phone.trim())
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

function applyChannelInviteContext(): void {
  inviteCodeFromChannel.value = resolveInviteCode()
  traceHashFromChannel.value = resolveTraceHash()

  if (shouldOpenRegisterMode() && pageMode.value === 'login') {
    pageMode.value = 'register'
  }
}
</script>

<template>
  <GameDialog
    v-model:show="loginModalStore.visible"
    :show-footer="false"
    :show-confirm-button="false"
    :close-on-click-overlay="true"
    dialog-width="9rem"
    body-max-height="14rem"
  >
    <template #title>
      <div v-if="false" class="login-title-row">
        <button class="lang-btn" @click="showLanguageModal = true">
          <img :src="icGlobe" alt="" />
          <span class="lang-text">{{ currentLang.toUpperCase() }}</span>
        </button>
      </div>
    </template>
    <span class="debug-trigger" @click="openDebugAccountDialog">DEV</span>
    <div class="login-form">
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

      <div class="form-fields">
        <div :class="['input-row', { 'input-row--filled': !!contactModel.trim() }]">
          <div class="input-icon-wrap">
            <img class="input-icon" :src="icPhone" alt="" />
          </div>
          <div class="input-inner">
            <button
              v-if="isPhone"
              type="button"
              class="area-code-btn"
              @click.prevent="openPhoneAreaPanel"
            >
              <span>+{{ form.area }}</span>
              <img class="area-code-icon" :src="icArrowDrop" alt="" />
            </button>
            <input
              v-model="contactModel"
              class="input-field"
              :class="{ 'input-field-phone': isPhone }"
              type="text"
              :placeholder="contactPlaceholder"
              autocomplete="off"
            />
            <button
              v-if="pageMode !== 'login'"
              :class="['otp-btn', { 'otp-btn--disabled': otpCountdown > 0 || otpSending }]"
              :disabled="otpCountdown > 0 || otpSending"
              @click.prevent="sendOtp"
            >
              <Loading v-if="otpSending" size="20px" />
              <span v-else>{{ otpBtnText }}</span>
            </button>
          </div>
        </div>

        <div
          v-if="pageMode !== 'login'"
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
              <img :src="icEye" alt="" :style="{ opacity: showPassword ? 1 : 0.4 }" />
            </button>
          </div>
        </div>
      </div>

      <div class="bottom-area">
        <div class="action-links">
          <button v-if="pageMode === 'login'" class="link-btn" @click="goMode('forgot')">
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

        <div v-if="needAgreement" class="agreement-row">
          <span
            :class="['radio-circle', { 'radio-circle--checked': agreed }]"
            @click="onAgreementIndicatorClick"
          ></span>
          <span class="agreement-text agreement-text--link" @click="onAgreementTextClick">
            {{ t('UILogin_ReadOK') }}
          </span>
        </div>

        <PrimaryButton
          :text="submitText"
          :disabled="!canSubmit"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </div>
  </GameDialog>

  <Teleport to="body">
    <div v-if="showPhoneAreaPanel" class="login-fullscreen-panel">
      <LoginPhoneAreaView
        :current-code="form.area"
        @back="onPhoneAreaPanelBack"
        @select="onPhoneAreaSelected"
      />
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="showProtocolPanel" class="login-fullscreen-panel">
      <ProtocolView :type="PROTOCOL_TYPE_AGREEMENT" @back="onProtocolPanelBack" />
    </div>
  </Teleport>

  <GameDialog
    v-model:show="showLanguageModal"
    :show-confirm-button="false"
    :close-on-click-overlay="true"
  >
    <div
      v-for="lang in SUPPORTED_LOCALES_OPTIONS"
      :key="lang.value"
      class="language-item"
      @click="handleSelectLang(lang.value)"
    >
      <span>{{ lang.label }}</span>
      <span
        :class="['radio-circle', { 'radio-circle--checked': lang.value == currentLang }]"
      ></span>
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

  <GameDialog
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
      <span class="text-primary ml-2 protocol-link" @click="onAgreementTextClick">
        {{ t('UIMine_Setting_UserSecret') }}
      </span>
    </div>
  </GameDialog>
</template>

<style scoped lang="scss">
.login-fullscreen-panel {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: #000;
}

.login-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.1rem;
}

.debug-trigger {
  position: absolute;
  left: 0;
  top: 0.3rem;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.34rem;
  font-family: 'Afacad', sans-serif;
  // line-height: 0.9rem;
  // min-width: 1rem;
  cursor: pointer;
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
    width: 0.5rem;
    height: 0.52rem;
  }
}

.lang-text {
  font-size: 0.4rem;
  font-weight: 500;
  color: #fff;
}

.language-item {
  align-items: center;
  justify-content: space-between;
  height: 1.2rem;
  margin: 0 0.1rem 0;
  border-bottom: 0.2px solid rgba(255, 255, 255, 0.2);
  display: flex;
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

.login-form {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.tab-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.53rem;
  margin-bottom: 0.5rem;
}

.tab-item {
  border: 0;
  background: transparent;
  font-size: 0.45rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.13rem 0 0;
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

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.59rem;
}

.input-row {
  display: flex;
  align-items: center;
  height: 1.44rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1.69rem;
  padding-left: 0.41rem;
  position: relative;
  transition: background 0.2s;

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
  padding: 0 0.2rem;
  margin-left: 0.25rem;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 1.27rem;
  border: 0;
  cursor: pointer;

  span {
    font-size: 0.33rem;
    margin: 0 0.1rem;
    font-weight: 500;
    font-family: 'Afacad', sans-serif;
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
  font-family: 'Afacad', sans-serif;
  color: #000;
  padding-left: 0.5rem;
  min-width: 0;

  &::placeholder {
    color: rgba(0, 0, 0, 0.38);
  }
}
.input-field-phone {
  padding-left: 0.1rem;
}

.otp-btn {
  flex-shrink: 0;
  height: 0.91rem;
  padding: 0 0.27rem;
  min-width: 2rem;
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
  border: 0;
  background: transparent;
  font-size: 0.41rem;
  font-weight: 500;
  min-width: 2.5rem;
  font-family: 'PingFang SC', 'HONOR Sans CN', sans-serif;
  color: #f9f9f9;
  cursor: pointer;
  padding: 0.08rem 0.1rem;

  text-align: center;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 0.42rem;
}

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

.agreement-text {
  font-size: 0.27rem;
  font-weight: 500;
  color: #fff;
  font-family: 'PingFang SC', 'HONOR Sans CN', sans-serif;
}

.agreement-text--link {
  cursor: pointer;
}

.protocol-link {
  cursor: pointer;
}

.primary-btn {
  height: 1.44rem;
}
</style>

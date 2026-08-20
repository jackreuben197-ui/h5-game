<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Loading, showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postUserDeleteApi, postUserDeleteCodeApi } from '@/api/user'
import icLock from '@/assets/icons/ic_lock.svg'
import icMail from '@/assets/icons/ic_mail.svg'
import icPhone from '@/assets/icons/ic_phone.svg'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
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
  '--cancel-account-bg-dark': `url(${mainBgUrl})`,
  '--cancel-account-bg-light': `url(${mainBgLightUrl})`,
}))

const otp = ref('')
const otpCountdown = ref(0)
const showConfirm = ref(false)
const requestingOtp = ref(false)
const deleting = ref(false)
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
const accountPlaceholder = computed(() =>
  isPhone.value ? t('UILogin_InputMoblie') : t('UILogin_InputEmail'),
)
const otpButtonText = computed(() =>
  otpCountdown.value > 0 ? `${otpCountdown.value}s` : t('UILogin_GetCode'),
)

function localeToServerLang(): number {
  const locale = getLocale()
  if (locale === 'en') return 1
  if (locale === 'zh') return 2
  if (locale === 'pt') return 3
  return 0
}

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
  if (otpCountdown.value > 0 || requestingOtp.value || deleting.value) {
    return
  }
  if (!accountValue.value) {
    showFailToast(t('UIClub_No9') + '，' + t('UIClub_Text71'))
    return
  }

  requestingOtp.value = true
  try {
    const response = await postUserDeleteCodeApi({
      area: isPhone.value ? areaCode.value : undefined,
      phone: isPhone.value ? phoneNumber.value : undefined,
      email: isPhone.value ? undefined : email.value,
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

function onSubmit(): void {
  if (!accountValue.value) {
    showFailToast(t('UIClub_No9') + '，' + t('UIClub_Text71'))
    return
  }
  if (!otp.value.trim()) {
    showFailToast(t('UILogin_Code'))
    return
  }
  showConfirm.value = true
}

function cancelDialog(): void {
  showConfirm.value = false
}

async function confirmDialog(): Promise<void> {
  showConfirm.value = false
  deleting.value = true
  try {
    const response = await postUserDeleteApi({
      area: isPhone.value ? areaCode.value : undefined,
      phone: isPhone.value ? phoneNumber.value : undefined,
      email: isPhone.value ? undefined : email.value,
      code: otp.value.trim(),
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
    <HeaderBack :title="t('UIMine_DeleteAccount')" extra-padding />

    <main class="content-wrap">
      <section class="form-stack">
        <div class="field-group">
          <div class="form-label">{{ t('UIGuild_Fund_Acount') }}</div>
          <div class="form-row" :class="{ filled: Boolean(accountValue) }">
            <span class="row-icon">
              <img :src="isPhone ? icPhone : icMail" alt="" />
            </span>
            <div class="row-main account-row-main">
              <span v-if="isPhone" class="prefix">+{{ areaCode }}</span>
              <span class="account-value" :class="{ empty: !accountValue }">
                {{ accountValue || accountPlaceholder }}
              </span>
              <button
                class="otp-btn"
                :class="{ countdown: otpCountdown > 0 }"
                type="button"
                :disabled="otpCountdown > 0 || requestingOtp || deleting"
                @click="requestOtp"
              >
                <Loading v-if="requestingOtp" size="20px" />
                <span v-else>{{ otpButtonText }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="field-group">
          <div class="form-label">Passcode</div>
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
        </div>
      </section>

      <button class="submit-btn" type="button" :disabled="deleting" @click="onSubmit">
        {{ deleting ? t('UIClub_Submitting') : t('CommitOK') }}
      </button>
    </main>

    <div v-if="showConfirm" class="dialog-mask" @click.self="cancelDialog">
      <section class="dialog-card">
        <p class="dialog-title">{{ t('UIClub_ConfirmCurrentNo') }}？</p>
        <p class="dialog-desc">{{ t('UIClub_NoNo') }}，{{ t('UIClub_Text98') }}。</p>
        <div class="dialog-actions">
          <button class="dialog-btn ghost" type="button" @click="cancelDialog">
            {{ t('adaptation10013') }}
          </button>
          <button class="dialog-btn primary" type="button" @click="confirmDialog">
            {{ t('UIClub_Confirm3') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.cancel-account-page {
  height: 100dvh;
  min-height: 100dvh;
  padding: 0 0 calc(env(safe-area-inset-bottom) + 0.4rem);
  display: flex;
  flex-direction: column;
  color: #f9f9f9;
  background-color: var(--c-page);
  background-image: var(--cancel-account-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--cancel-account-bg-light);
  }
}

.content-wrap {
  min-height: 0;
  flex: 1;
  padding: 0 0.4533rem;
  display: flex;
  flex-direction: column;
}

.form-stack {
  margin-top: 0.3552rem;
  display: flex;
  flex-direction: column;
  gap: 0.439rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.2133rem;
}

.form-label {
  color: rgba(255, 255, 255, 0.92);
  font-family: 'PingFang SC', 'HONOR Sans CN', var(--font-family-sans);
  font-size: 0.3467rem;
  font-weight: 500;
  line-height: 1.4;

  @include theme-light {
    color: #000;
  }
}

.form-row {
  height: 1.4376rem;
  padding-left: 0.4144rem;
  border-radius: 1.6913rem;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.2783rem);
  display: flex;
  align-items: center;

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

.submit-btn {
  width: calc(100% - 0.2133rem);
  height: 1.4376rem;
  margin: auto 0.1067rem 0;
  flex: none;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.2684rem;
  background: linear-gradient(168deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-family: 'HONOR Sans CN', var(--font-family-sans);
  font-size: 0.5066rem;
  font-weight: 500;

  @include theme-light {
    background: var(--c-brand);
  }

  &:disabled {
    opacity: 1;
  }
}

.dialog-mask {
  position: fixed;
  z-index: 20;
  inset: 0;
  padding: 0.6rem;
  background: rgba(12, 12, 12, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-card {
  width: 8.2rem;
  padding: 0.56rem;
  border: 0.0133rem solid rgba(255, 255, 255, 0.34);
  border-radius: 0.48rem;
  background: linear-gradient(
    121deg,
    rgba(142, 142, 142, 0.3) 2.9%,
    rgba(103, 103, 103, 0.4) 43.6%,
    rgba(73, 73, 73, 0.5) 89.8%
  );
  backdrop-filter: blur(0.2rem);
  box-shadow: inset 0 0 0.2rem rgba(0, 0, 0, 0.5);
  color: #fff;

  @include theme-light {
    border-color: rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 0.16rem 0.6rem rgba(0, 0, 0, 0.16);
    color: #000;
  }
}

.dialog-title {
  margin: 0;
  font-size: 0.46rem;
  font-weight: 600;
  text-align: center;
}

.dialog-desc {
  margin: 0.24rem 0 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.34rem;
  line-height: 1.4;
  text-align: center;

  @include theme-light {
    color: rgba(0, 0, 0, 0.56);
  }
}

.dialog-actions {
  margin-top: 0.52rem;
  display: flex;
  gap: 0.22rem;
}

.dialog-btn {
  height: 1.12rem;
  flex: 1;
  border: 0;
  border-radius: 1rem;
  font-size: 0.4rem;
}

.dialog-btn.ghost {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;

  @include theme-light {
    background: rgba(0, 0, 0, 0.08);
    color: #000;
  }
}

.dialog-btn.primary {
  background: var(--c-brand);
  color: #fff;
}
</style>

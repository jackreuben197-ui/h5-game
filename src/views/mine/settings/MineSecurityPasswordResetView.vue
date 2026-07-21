<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postUserModifyQuickInfoApi, postUserVerifyPasswordApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import { t } from '@/i18n'
import { useUserInfoStore } from '@/stores/userInfo'

type OverlayType = 'none' | 'loading' | 'error-soft' | 'error-hard'

const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()

const backgroundStyle = computed(() => ({
  '--password-bg-dark': `url(${mainBgUrl})`,
  '--password-bg-light': `url(${mainBgLightUrl})`,
}))
const digits = ref('')
const keypadKey = ref(0)
const overlayType = ref<OverlayType>('none')
const failedAttempts = ref(0)
const submitting = ref(false)

const isCloseMode = computed(() => route.query.mode === 'close')
const titleText = computed(() =>
  isCloseMode.value ? t('UISwitchClose') + '6' + t('UIClub_Code5') : t('Change_6digit_password'),
)
const canSubmit = computed(() => digits.value.length === 6)

const modalText = computed(() => {
  if (overlayType.value === 'error-hard') {
    return (
      t('UIClub_Code2') +
      '5' +
      t('UIHappyShop_Time') +
      ',' +
      t('UIClub_No8') +
      ',' +
      t('UIClub_Text67')
    )
  }
  return (
    t('UIClub_Code3') +
    ',' +
    t('UIClub_Can3') +
    Math.max(0, 5 - failedAttempts.value) +
    t('UIHappyShop_Time') +
    ',' +
    t('UIClub_Text68')
  )
})

function closePage(): void {
  router.back()
}

function handleKeyPress(payload: { value: string }): void {
  if (overlayType.value !== 'none') {
    return
  }
  digits.value = payload.value
}

async function submitReset(): Promise<void> {
  if (!canSubmit.value) {
    return
  }

  overlayType.value = 'loading'
  submitting.value = true
  try {
    const response = await postUserVerifyPasswordApi({
      user_pwd_type: 2,
      password: digits.value,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_CodeFail'))
    }

    const verify = Boolean(response.data?.verify)
    if (!verify) {
      failedAttempts.value = Number(response.data?.failed_count ?? failedAttempts.value + 1)
      overlayType.value = failedAttempts.value >= 5 ? 'error-hard' : 'error-soft'
      return
    }

    if (isCloseMode.value) {
      const closeResponse = await postUserModifyQuickInfoApi({
        user_pwd_type: 2,
        switch_status: 2,
        password: digits.value,
      })
      if (closeResponse.code !== 0) {
        throw new Error(
          typeof closeResponse.msg === 'string' ? closeResponse.msg : t('UIClub_CodeFail2'),
        )
      }
      userInfoStore.syncUserFields({ digital_switch: 2 })
      showSuccessToast(t('UIMineSixCloseHas'))
      overlayType.value = 'none'
      void router.replace('/mine/settings/account')
      return
    }

    showSuccessToast(t('UIClub_Success4') + '，' + t('UIClub_Code4'))
    overlayType.value = 'none'
    void router.replace('/mine/settings/account/security-password/setup?reset=1')
  } catch (error) {
    overlayType.value = 'none'
    const message = error instanceof Error ? error.message : t('UIClub_CodeFail')
    showFailToast(message)
  } finally {
    submitting.value = false
  }
}

function closeOverlay(): void {
  overlayType.value = 'none'
  digits.value = ''
  keypadKey.value += 1
}
</script>

<template>
  <div class="page-shell security-password-page" :style="backgroundStyle">
    <button class="close-btn" type="button" :aria-label="t('Wallet_Cancel')" @click="closePage">
      <span></span>
    </button>

    <section class="password-panel">
      <h1>{{ titleText }}</h1>
      <p>{{ t('UIClub_Code') }},{{ t('UIClub_Text65') }}</p>
      <div class="dot-row">
        <span v-for="idx in 6" :key="idx" class="dot-cell">
          <span v-if="idx <= digits.length" class="digit">{{ digits[idx - 1] }}</span>
        </span>
      </div>
      <button
        class="submit-btn"
        :class="{ active: canSubmit }"
        type="button"
        :disabled="!canSubmit || submitting"
        @click="submitReset"
      >
        {{ t('UIMinePwFinish') }}
      </button>
    </section>

    <NumericKeypad
      :key="keypadKey"
      open
      :max-length="6"
      allow-leading-zero
      :show-mask="false"
      :show-background="false"
      :show-actions="false"
      allow-page-interaction
      @key-press="handleKeyPress"
    />

    <div v-if="overlayType !== 'none'" class="overlay-mask">
      <div class="overlay-card" :class="{ wide: overlayType !== 'loading' }">
        <div v-if="overlayType === 'loading'" class="loader"></div>
        <p v-if="overlayType === 'loading'">{{ t('UIClub_Text66') }}</p>
        <template v-else>
          <p class="multiline">{{ modalText }}</p>
          <button class="overlay-confirm" type="button" @click="closeOverlay">
            {{ t('adaptation10024') }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.security-password-page {
  height: 100dvh;
  position: relative;
  overflow: hidden;
  color: #fff;
  background-color: var(--c-page);
  background-image: var(--password-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--password-bg-light);
  }
}

.close-btn {
  position: absolute;
  z-index: 2;
  top: calc(env(safe-area-inset-top) + 0.48rem);
  left: 0.3733rem;
  width: 1.024rem;
  height: 1.024rem;
  padding: 0;
  border: 0.0133rem solid rgba(255, 255, 255, 0.32);
  border-radius: 50%;
  background: rgba(87, 174, 255, 0.2);

  span::before,
  span::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.42rem;
    height: 0.0533rem;
    border-radius: 999px;
    background: #fff;
  }

  span::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  span::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
}

.password-panel {
  padding-top: 5.78rem;
  text-align: center;
  color: inherit;

  h1 {
    margin: 0;
    font-size: 0.7246rem;
    font-weight: 600;
    line-height: 1.2;
  }

  p {
    margin: 0.16rem 0 0;
    font-size: 0.4026rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.2;

    @include theme-light {
      color: rgba(0, 0, 0, 0.8);
    }
  }
}

.dot-row {
  margin-top: 0.785rem;
  display: flex;
  justify-content: center;
  gap: 0.1549rem;
}

.dot-cell {
  width: 1.0748rem;
  height: 1.0748rem;
  border-radius: 1.0064rem;
  border: 0.0133rem solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @include theme-light {
    border-color: rgba(239, 40, 70, 0.25);
    background: rgba(0, 0, 0, 0.13);
  }
}

.digit {
  font-size: 0.7616rem;
  font-weight: 500;
}

.submit-btn {
  margin-top: 0.8533rem;
  width: 8.9809rem;
  height: 1.4376rem;
  border: 0;
  border-radius: 1.2684rem;
  background: rgba(0, 0, 0, 0.25);
  color: #f9f9f9;
  font-size: 0.674rem;
}

.submit-btn.active {
  background: linear-gradient(168deg, #05e7ae 7.55%, #027a5c 71.92%);

  @include theme-light {
    background: var(--c-brand);
  }
}

.overlay-mask {
  position: absolute;
  z-index: 300;
  inset: 0;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-card {
  width: 4.2136rem;
  min-height: 3.1rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.4);
  border-radius: 0.9703rem;
  background: linear-gradient(
    121deg,
    rgba(142, 142, 142, 0.3) 2.9%,
    rgba(103, 103, 103, 0.4) 43.6%,
    rgba(73, 73, 73, 0.5) 89.8%
  );
  box-shadow:
    inset 0 0 0.2298rem rgba(0, 0, 0, 1),
    inset 0.0566rem 0.1132rem 0.4596rem rgba(242, 242, 242, 0.9);
  backdrop-filter: blur(0.2rem);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.8187rem 0.4106rem 0.6038rem;

  p {
    margin: 0.16rem 0 0;
    font-size: 0.3623rem;
    line-height: 1.3;
    text-align: center;
  }
}

.overlay-card.wide {
  width: 8.2528rem;
}

.multiline {
  width: 6.98rem;
}

.loader {
  width: 0.92rem;
  height: 0.92rem;
  border-radius: 50%;
  border: 0.08rem solid rgba(255, 255, 255, 0.35);
  border-top-color: rgba(255, 255, 255, 0.95);
  animation: spin 0.9s linear infinite;
}

.overlay-confirm {
  margin-top: 0.42rem;
  width: 7.4267rem;
  height: 1.474rem;
  border: 0;
  border-radius: 1.0846rem;
  background: linear-gradient(166deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-size: 0.6rem;

  @include theme-light {
    background: var(--c-brand);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { postUserModifyQuickInfoApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import { t } from '@/i18n'
import { useUserInfoStore } from '@/stores/userInfo'

type SetupPhase = 'first' | 'confirm'
type OverlayType = 'none' | 'loading' | 'success'

const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()

const backgroundStyle = computed(() => ({
  '--password-bg-dark': `url(${mainBgUrl})`,
  '--password-bg-light': `url(${mainBgLightUrl})`,
}))
const phase = ref<SetupPhase>('first')
const digits = ref('')
const firstInput = ref('')
const keypadKey = ref(0)
const overlayType = ref<OverlayType>('none')
const submitting = ref(false)
const isReset = computed(() => route.query.reset === '1')

const titleText = computed(() =>
  phase.value === 'first'
    ? isReset.value
      ? t('Change_6digit_password')
      : t('UIMine_SettingSixPassword')
    : t('UIClub_Code6'),
)
const subtitleText = computed(() =>
  phase.value === 'first' ? t('6digit_password_firstInput') : t('UIClub_Again3'),
)
const showSubmit = computed(() => phase.value === 'confirm')
const canSubmit = computed(() => digits.value.length === 6)

function closePage(): void {
  router.back()
}

function handleKeyPress(payload: { value: string }): void {
  if (overlayType.value !== 'none') {
    return
  }

  digits.value = payload.value

  if (phase.value === 'first' && digits.value.length === 6) {
    firstInput.value = digits.value
    phase.value = 'confirm'
    digits.value = ''
    keypadKey.value += 1
  }
}

async function handleSubmit(): Promise<void> {
  if (!canSubmit.value) {
    return
  }

  if (digits.value !== firstInput.value) {
    showFailToast(t('UIClub_Text69') + '，' + t('UIClub_Text70'))
    phase.value = 'first'
    digits.value = ''
    firstInput.value = ''
    keypadKey.value += 1
    return
  }

  overlayType.value = 'loading'
  submitting.value = true
  try {
    const response = await postUserModifyQuickInfoApi({
      user_pwd_type: 2,
      switch_status: 1,
      password: digits.value,
    })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_CodeFail2'))
    }
    userInfoStore.syncUserFields({ digital_switch: 1 })
    overlayType.value = 'success'
    // showSuccessToast(t('UIClub_CodeSuccess'))
    setTimeout(() => {
      closeOverlay()
    }, 2000)
  } catch (error) {
    overlayType.value = 'none'
    const message = error instanceof Error ? error.message : t('UIClub_CodeFail2')
    showFailToast(message)
  } finally {
    submitting.value = false
  }
}

function closeOverlay(): void {
  if (overlayType.value === 'success') {
    void router.replace('/mine/settings/account')
    return
  }
  overlayType.value = 'none'
}
</script>

<template>
  <div class="page-shell security-password-page" :style="backgroundStyle">
    <button class="close-btn" type="button" :aria-label="t('Wallet_Cancel')" @click="closePage">
      <span></span>
    </button>

    <section class="password-panel">
      <h1>{{ titleText }}</h1>
      <p>{{ subtitleText }}</p>
      <div class="dot-row">
        <span v-for="idx in 6" :key="idx" class="dot-cell">
          <span v-if="idx <= digits.length" class="digit">{{ digits[idx - 1] }}</span>
        </span>
      </div>
      <button
        v-if="showSubmit"
        class="submit-btn"
        :class="{ active: canSubmit }"
        type="button"
        :disabled="!canSubmit || submitting"
        @click="handleSubmit"
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
      <div class="overlay-card">
        <div v-if="overlayType === 'loading'" class="loader"></div>
        <div v-else class="success-icon">✓</div>
        <p>
          {{
            overlayType === 'loading'
              ? t('UIClub_Text66')
              : isReset
                ? t('adaptation10079')
                : t('6digit_password_opened')
          }}
        </p>
        <!-- <button
          v-if="overlayType === 'success'"
          class="overlay-confirm"
          type="button"
          @click="closeOverlay"
        >
          {{ t('adaptation10024') }}
        </button> -->
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
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.22);

  span::before,
  span::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.42rem;
    height: 0.0533rem;
    border-radius: 999px;
    background: #f3f3f3;
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
  }
}

.loader {
  width: 0.92rem;
  height: 0.92rem;
  border-radius: 50%;
  border: 0.08rem solid rgba(255, 255, 255, 0.35);
  border-top-color: rgba(255, 255, 255, 0.95);
  animation: spin 0.9s linear infinite;
}

.success-icon {
  width: 0.92rem;
  height: 0.92rem;
  border: 0.06rem solid #fff;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.54rem;
}

.overlay-confirm {
  margin-top: 0.4rem;
  width: 100%;
  height: 1.2rem;
  border: 0;
  border-radius: 1.1rem;
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

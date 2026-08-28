<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postUserModifyQuickInfoApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import icDeleteKeyboard from '@/assets/icons/ic_delete_keyboard.svg'
import btnClose from '@/assets/icons/btn_close.png'
import { t } from '@/i18n'

type SetupPhase = 'first' | 'confirm'
type OverlayType = 'none' | 'loading' | 'success'

const router = useRouter()

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const phase = ref<SetupPhase>('first')
const digits = ref('')
const firstInput = ref('')
const overlayType = ref<OverlayType>('none')
const submitting = ref(false)

const titleText = computed(() =>
  phase.value === 'first' ? t('UIMine_btn_setting') + '6' + t('UIClub_Code5') : t('UIClub_Code6'),
)
const subtitleText = computed(() =>
  phase.value === 'first' ? t('6digit_password_firstInput') : t('UIClub_Again3'),
)
const showSubmit = computed(() => phase.value === 'confirm')
const canSubmit = computed(() => digits.value.length === 6)

const keyRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
]

function closePage(): void {
  router.back()
}

function handleKey(key: string): void {
  if (overlayType.value !== 'none') {
    return
  }

  if (key === 'C') {
    digits.value = ''
    return
  }

  if (key === '⌫') {
    digits.value = digits.value.slice(0, -1)
    return
  }

  if (digits.value.length >= 6) {
    return
  }

  digits.value += key

  if (phase.value === 'first' && digits.value.length === 6) {
    firstInput.value = digits.value
    phase.value = 'confirm'
    digits.value = ''
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
    overlayType.value = 'success'
    showSuccessToast(t('UIClub_CodeSuccess'))
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
    void router.replace('/mine/settings/account?security=on')
    return
  }
  overlayType.value = 'none'
}
</script>

<template>
  <div class="page-shell security-password-page" :style="backgroundStyle">
    <img class="close-btn" :src="btnClose" alt="" aria-hidden="true" @click="closePage" />

    <section class="password-panel">
      <h1>{{ titleText }}</h1>
      <p>{{ subtitleText }}</p>
      <div class="dot-row">
        <span v-for="idx in 6" :key="idx" class="dot-cell">
          <span v-if="idx <= digits.length" class="digit">6</span>
        </span>
      </div>
      <button
        v-if="showSubmit"
        class="submit-btn"
        :class="{ active: canSubmit }"
        type="button"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ t('UIMinePwFinish') }}
      </button>
    </section>

    <section class="keyboard-wrap">
      <div v-for="(row, rowIdx) in keyRows" :key="rowIdx" class="key-row">
        <button
          v-for="key in row"
          :key="key"
          type="button"
          class="key"
          :class="{ clear: key === 'C', erase: key === '⌫' }"
          @click="handleKey(key)"
        >
          <span v-if="key !== '⌫'">{{ key }}</span>
          <img v-else class="erase-icon" :src="icDeleteKeyboard" alt="" aria-hidden="true" />
        </button>
      </div>
    </section>

    <div v-if="overlayType !== 'none'" class="overlay-mask">
      <div class="overlay-card">
        <div v-if="overlayType === 'loading'" class="loader"></div>
        <div v-else class="success-icon">✓</div>
        <p>{{ overlayType === 'loading' ? t('UIClub_Text66') : t('6digit_password_opened') }}</p>
        <button
          v-if="overlayType === 'success'"
          class="overlay-confirm"
          type="button"
          @click="closeOverlay"
        >
          {{ t('adaptation10024') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
#app > .security-password-page {
  height: 100dvh;
  padding-top: calc(var(--app-viewport-safe-area-top, env(safe-area-inset-top)) + 0.42rem);
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.close-btn {
  margin-left: 0.4rem;
  width: 1.0748rem;
  height: 1.0748rem;
  object-fit: contain;
  cursor: pointer;
}

.password-panel {
  margin-top: 3.3rem;
  text-align: center;
  color: #fff;

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
  border: 0.02rem solid rgba(249, 249, 249, 0.04);
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(1.5px);
  -webkit-backdrop-filter: blur(1.5px);
  box-shadow: inset 1px 1px 0px rgba(255, 255, 255, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.digit {
  font-size: 0.7616rem;
  font-weight: 500;
}

.submit-btn {
  margin-top: 0.8533rem;
  width: 8.9809rem;
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
}

.submit-btn.active {
  background: rgba(245, 45, 45, 0.2);
  border-color: rgba(245, 45, 45, 0.3);
}

.keyboard-wrap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0.8446rem 0.8446rem 0 0;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 0.02rem solid rgba(249, 249, 249, 0.14);
  padding: 0.6426rem 0.5321rem 0.5472rem;
  display: flex;
  flex-direction: column;
  gap: 0.206rem;
}

.key-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.1526rem;
}

.key {
  height: 1.354rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.14);
  border-radius: 0.3775rem;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  box-shadow: inset 1px 1px 0px rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.6105rem;
  font-weight: 600;
}

.key.clear,
.key.erase {
  background: rgba(245, 45, 45, 0.2);
  border-color: rgba(245, 45, 45, 0.3);
  border-radius: 1.6064rem;
}

.erase-icon {
  width: 0.56rem;
  height: 0.56rem;
  object-fit: contain;
}

.overlay-mask {
  position: absolute;
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
  background: linear-gradient(121deg, rgba(142, 142, 142, 0.3) 2.9%, rgba(103, 103, 103, 0.4) 43.6%, rgba(73, 73, 73, 0.5) 89.8%);
  box-shadow: inset 0 0 0.2298rem rgba(0, 0, 0, 1), inset 0.0566rem 0.1132rem 0.4596rem rgba(242, 242, 242, 0.9);
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
  background: rgba(245, 45, 45, 0.2);
  border: 0.02rem solid rgba(245, 45, 45, 0.3);
  color: #fff;
  font-size: 0.6rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

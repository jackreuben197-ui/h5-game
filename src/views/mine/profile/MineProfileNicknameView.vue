<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postUserCheckNicknameApi, postUserModifyInfoApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useAppConfigStore } from '@/stores/appConfig'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import { resolveDiamondPriceValue } from '@/utils/diamondPriceConfig'
import { t } from '@/i18n'

const router = useRouter()

const title = computed(() => t('UIMine_UserInfoSettingNick_title'))

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--nickname-bg-dark': `url(${mainBgUrl})`,
  '--nickname-bg-light': `url(${mainBgLightUrl})`,
}))
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()
const appConfigStore = useAppConfigStore()

const inputName = ref('')
const submitting = ref(false)

function readNickname(): string {
  const user = userInfoStore.userInfo?.user
  if (!user || typeof user !== 'object') {
    return gameStore.loginNickname || ''
  }

  const record = user as Record<string, unknown>
  const candidates = [record.nick_name, record.nickname]
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) {
      return item.trim()
    }
  }

  return gameStore.loginNickname || ''
}

function readDiamond(): number {
  const user = userInfoStore.userInfo?.user
  if (user && typeof user === 'object') {
    const record = user as Record<string, unknown>
    const value = Number(record.diamonds ?? record.diamond ?? 0)
    if (Number.isFinite(value) && value >= 0) {
      return value
    }
  }
  return 0
}

const displayUser = computed(() => ({
  nickname: readNickname(),
  diamond: readDiamond(),
}))

const nicknameCost = computed(() => {
  return resolveDiamondPriceValue(appConfigStore.globalConfig?.user_modify_name_price, {
    original: 0,
    current: 0,
  })
})

inputName.value = String(displayUser.value.nickname || '')

function validateNickname(value: string): string | null {
  if (!value) {
    return t('UIMine_SetNick_InputTips')
  }
  if (value.length < 2) {
    return t('UIClub_Text62') + '2' + t('UIClub_Text63')
  }
  if (value.length > 20) {
    return t('UIClub_Text64') + '20' + t('UIClub_Text63')
  }
  return null
}

async function onSave(): Promise<void> {
  const nextNickname = inputName.value.trim()
  const error = validateNickname(nextNickname)
  if (error) {
    showFailToast(error)
    return
  }

  if (nextNickname === displayUser.value.nickname) {
    showSuccessToast(t('UIClub_Not2'))
    router.back()
    return
  }

  submitting.value = true
  try {
    const checkRes = await postUserCheckNicknameApi({ nickname: nextNickname })
    if (checkRes.code !== 0) {
      throw new Error(typeof checkRes.msg === 'string' ? checkRes.msg : t('UIClub_Can2'))
    }

    const modifyRes = await postUserModifyInfoApi({ nick_name: nextNickname })
    if (modifyRes.code !== 0) {
      throw new Error(typeof modifyRes.msg === 'string' ? modifyRes.msg : t('UIClub_SaveFail4'))
    }

    const userInfo = userInfoStore.userInfo
    if (
      userInfo &&
      typeof userInfo === 'object' &&
      userInfo.user &&
      typeof userInfo.user === 'object'
    ) {
      const nextUserInfo = {
        ...userInfo,
        user: {
          ...(userInfo.user as Record<string, unknown>),
          nick_name: nextNickname,
          nickname: nextNickname,
        },
      }
      userInfoStore.setUserInfo(nextUserInfo)
    }
    gameStore.loginNickname = nextNickname

    showSuccessToast(t('UIClub_DoneSave3'))
    router.back()
  } catch (requestError) {
    const message = requestError instanceof Error ? requestError.message : t('UIClub_SaveFail4')
    showFailToast(message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-shell nickname-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="nickname-content">
        <input
          v-model="inputName"
          class="name-input"
          type="text"
          maxlength="20"
          :placeholder="t('UIMine_SetNick_InputTips')"
        />
        <p class="input-hint">{{ t('UIMine_SetNick_InputTips') }}</p>

        <div class="cost-row">
          <span class="label">{{ t('UIClub_FundRecharge_9jO4mlS6') }}</span>
          <img class="diamond" :src="iconDiamond" alt="diamond" />
          <span class="origin">{{ nicknameCost.original }}</span>
          <span class="current">{{ nicknameCost.current }}</span>
        </div>

        <div class="cost-row balance-row">
          <span class="label">{{ t('UIMineAllDiamond') }}</span>
          <img class="diamond" :src="iconDiamond" alt="diamond" />
          <span class="balance">{{ displayUser.diamond }}</span>
        </div>
      </section>

      <div class="save-wrap">
        <button class="save-btn" type="button" :disabled="submitting" @click="onSave">
          {{ submitting ? t('UIClub_Save3') + '...' : t('Save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.nickname-page {
  height: 100dvh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  color: #f9f9f9;
  background-color: var(--c-page);
  background-image: var(--nickname-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--nickname-bg-light);
  }
}

.content-wrap {
  min-height: 0;
  flex: 1;
  padding: 0 0.48rem;
  margin-top: 0.6228rem;
  display: flex;
  flex-direction: column;
}

.name-input {
  width: 9.0613rem;
  height: 1.6638rem;
  border-radius: 1.4759rem;
  border: 0.0082rem solid rgba(249, 249, 249, 0.6);
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(0.8232rem);
  color: rgba(255, 255, 255, 0.92);
  font-family: 'PingFang SC', var(--font-family-sans);
  font-size: 0.3885rem;
  line-height: 1.4;
  padding: 0 0.52rem;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.71);
  }

  @include theme-light {
    border-color: rgba(249, 249, 249, 0.6);
    background: #dadada;
    color: rgba(0, 0, 0, 0.71);

    &::placeholder {
      color: rgba(0, 0, 0, 0.38);
    }
  }
}

.input-hint {
  margin: 0.2133rem 0 0;
  color: #fbfbfb;
  font-family: 'PingFang SC', var(--font-family-sans);
  font-size: 0.3467rem;
  line-height: 1.4;

  @include theme-light {
    color: #000;
  }
}

.cost-row {
  margin-top: 0.3413rem;
  display: flex;
  align-items: center;
  gap: 0.1532rem;
  color: #fff;
  font-family: 'Afacad', var(--font-family-sans);
  font-size: 0.3574rem;
  line-height: 1.4;

  @include theme-light {
    color: #000;
  }
}

.balance-row {
  margin-top: 0.1098rem;
}

.label {
  opacity: 0.96;
}

.diamond {
  width: 0.4267rem;
  height: 0.3467rem;
  object-fit: contain;
}

.origin {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: line-through;
  text-decoration-thickness: 0.0267rem;
  text-decoration-color: rgba(255, 255, 255, 0.75);

  @include theme-light {
    color: rgba(0, 0, 0, 0.75);
    text-decoration-color: rgba(0, 0, 0, 0.75);
  }
}

.current,
.balance {
  color: #fff;
  font-weight: 600;

  @include theme-light {
    color: #000;
  }
}

.info {
  width: 0.3467rem;
  height: 0.3467rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: #9a6075;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.2667rem;
  font-weight: 600;
  line-height: 1;

  @include theme-light {
    background: rgba(0, 0, 0, 0.48);
    color: #fff;
  }
}

.save-wrap {
  margin-top: auto;
  padding: 0 0.1067rem calc(env(safe-area-inset-bottom) + 1.0667rem);
}

.save-btn {
  width: 100%;
  height: 1.4349rem;
  border-radius: 1.0557rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  color: #fbfbfb;
  font-family: 'PingFang SC', var(--font-family-sans);
  font-size: 0.5063rem;
  font-weight: 500;
  line-height: 1.2;
  background: linear-gradient(168.34deg, #05e7ae 7.55%, #027a5c 71.92%);

  @include theme-light {
    background: var(--c-brand);
  }

  &:disabled {
    opacity: 0.72;
  }
}
</style>

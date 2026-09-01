<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'

import { useRouter } from 'vue-router'
import { postUserModifyInfoApi } from '@/api/user'
import { postOssUploadImageApi } from '@/api/oss'
import mainBgUrl from '@/assets/images/main_bg.webp'
import cardBg3 from '@/assets/images/card_bg3.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import defaultAvatar from '@/assets/images/default_avatar.png'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import ProfileCard from '@/components/ProfileCard/ProfileCard.vue'
import { t } from '@/i18n'

const router = useRouter()

const title = computed(() => t('UIMine_UserInfoSetting_title'))

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()

const nickname = ref('')
const selectedGender = ref<'male' | 'female'>('male')
const showAvatarPopup = ref(false)
const showGenderPopup = ref(false)
const popupGender = ref<'male' | 'female'>('male')
const savingGender = ref(false)
const avatarSource = ref<'camera' | 'gallery'>('gallery')
const galleryInputRef = ref<HTMLInputElement | null>(null)
const cameraInputRef = ref<HTMLInputElement | null>(null)

function readDisplayNickname(): string {
  const user = userInfoStore.userInfo?.user
  if (user && typeof user === 'object') {
    const record = user as Record<string, unknown>
    const nickname = record.nick_name ?? record.nickname
    if (typeof nickname === 'string' && nickname.trim()) {
      return nickname.trim()
    }
  }
  return gameStore.loginNickname || 'Carter Torff'
}

function readDisplayUserId(): string {
  const user = userInfoStore.userInfo?.user
  if (user && typeof user === 'object') {
    const record = user as Record<string, unknown>
    const id = record.un_id ?? record.user_id
    if (id !== undefined && id !== null) {
      return String(id)
    }
  }
  return gameStore.loginUserId || '8677650585'
}

function readDisplayAvatar(): string {
  const user = userInfoStore.userInfo?.user
  if (user && typeof user === 'object') {
    const record = user as Record<string, unknown>
    if (typeof record.avatar === 'string' && record.avatar) {
      return record.avatar
    }
  }
  return defaultAvatar
}

const displayUser = computed(() => ({
  nickname: readDisplayNickname(),
  userId: readDisplayUserId(),
  avatar: readDisplayAvatar(),
}))

nickname.value = String(displayUser.value.nickname || '')

function goNicknamePage(): void {
  void router.push('/mine/profile/nickname')
}

function openAvatarPopup(): void {
  showAvatarPopup.value = true
}

async function selectGender(gender: 'male' | 'female'): Promise<void> {
  if (selectedGender.value === gender) return
  popupGender.value = gender
  await onConfirmGender()
}

function openGenderPopup(): void {
  popupGender.value = selectedGender.value
  showGenderPopup.value = true
}

function closeAvatarPopup(): void {
  showAvatarPopup.value = false
}

function onAvatarAction(action: 'album' | 'camera'): void {
  avatarSource.value = action === 'camera' ? 'camera' : 'gallery'
  const targetInput = avatarSource.value === 'camera' ? cameraInputRef.value : galleryInputRef.value
  showAvatarPopup.value = false
  targetInput?.click()
}

function resolveUploadedAvatarUrl(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw.trim()
  }
  if (!raw || typeof raw !== 'object') {
    return ''
  }

  const data = raw as Record<string, unknown>
  const candidates = [data.url, data.file_url, data.path, data.data]
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) {
      return item.trim()
    }
  }
  return ''
}

async function onAvatarFileChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) {
    return
  }

  try {
    const formData = new FormData()
    formData.append('file', file)

    const uploadRes = await postOssUploadImageApi(
      formData as unknown as Parameters<typeof postOssUploadImageApi>[0],
    )
    if (uploadRes.code !== 0) {
      throw new Error(typeof uploadRes.msg === 'string' ? uploadRes.msg : t('UIClub_AvatarFail'))
    }

    const avatarUrl = resolveUploadedAvatarUrl(uploadRes.data)
    if (!avatarUrl) {
      throw new Error(t('UIClub_AvatarFail'))
    }

    const modifyRes = await postUserModifyInfoApi({ avatar: avatarUrl })
    if (modifyRes.code !== 0) {
      throw new Error(
        typeof modifyRes.msg === 'string' ? modifyRes.msg : t('UIClub_AvatarSaveFail'),
      )
    }

    const userInfo = userInfoStore.userInfo
    if (
      userInfo &&
      typeof userInfo === 'object' &&
      userInfo.user &&
      typeof userInfo.user === 'object'
    ) {
      userInfoStore.setUserInfo({
        ...userInfo,
        user: {
          ...userInfo.user,
          avatar: avatarUrl,
        },
      })
    }

    showSuccessToast(t('UIClub_AvatarDoneUpdate'))
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_AvatarUpdateFail')
    showFailToast(message)
  } finally {
    if (target) {
      target.value = ''
    }
  }
}

async function onConfirmGender(): Promise<void> {
  const nextGender = popupGender.value
  const sex = nextGender === 'male' ? 1 : 2

  savingGender.value = true
  try {
    const response = await postUserModifyInfoApi({ sex })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_UpdateFail2'))
    }
    selectedGender.value = nextGender
    const userInfo = userInfoStore.userInfo
    if (
      userInfo &&
      typeof userInfo === 'object' &&
      userInfo.user &&
      typeof userInfo.user === 'object'
    ) {
      userInfoStore.setUserInfo({
        ...userInfo,
        user: {
          ...userInfo.user,
          sex,
          nickname: displayUser.value.nickname,
        },
      })
    }
    showGenderPopup.value = false
    showSuccessToast(t('UIClub_DoneUpdate2'))
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_UpdateFail2')
    showFailToast(message)
  } finally {
    savingGender.value = false
  }
}

</script>

<template>
  <div class="page-shell profile-edit-page" :style="backgroundStyle">
    <input
      ref="galleryInputRef"
      class="avatar-file-input"
      type="file"
      accept="image/*"
      @change="onAvatarFileChange"
    />
    <input
      ref="cameraInputRef"
      class="avatar-file-input"
      type="file"
      accept="image/*"
      capture="environment"
      @change="onAvatarFileChange"
    />

    <HeaderBack :title="title" />

    <div class="content-wrap">
      <ProfileCard
        :avatar="String(displayUser.avatar)"
        :nickname="displayUser.nickname"
        :user-id="displayUser.userId"
        :editable="true"
        :bg-image="cardBg3"
        @avatar-click="openAvatarPopup"
      />

      <section class="field-group">
        <button class="glass-input" type="button" @click="goNicknamePage">
          {{ nickname || t('UIMine_UserInfoSettingNick_InputName') }}
        </button>
        <p class="input-hint">{{ t('UIMine_UserInfoSettingNick_InputName') }}</p>
      </section>

      <section class="gender-select">
        <button class="gender-option" type="button" @click="selectGender('male')">
          <img class="radio-icon" :src="selectedGender === 'male' ? icCheckbox : icUncheckbox" alt="" />
          <span>{{ t('UIMine_UserInfoSetting_Male') }}</span>
        </button>
        <button class="gender-option" type="button" @click="selectGender('female')">
          <img class="radio-icon" :src="selectedGender === 'female' ? icCheckbox : icUncheckbox" alt="" />
          <span>{{ t('UIMine_UserInfoSetting_Female') }}</span>
        </button>
      </section>

      <VanPopup
        v-model:show="showAvatarPopup"
        round
        position="bottom"
        class="sheet-popup"
        :overlay-style="{ background: 'rgba(12,12,12,0.6)' }"
      >
        <div class="sheet-body">
          <button class="sheet-row" type="button" @click="onAvatarAction('album')">
            {{ t('UIMine_UserInfoSetting_album') }}
          </button>
          <div class="sheet-divider"></div>
          <button class="sheet-row" type="button" @click="onAvatarAction('camera')">
            {{ t('UIClub_Text61') }}
          </button>
          <button class="sheet-confirm" type="button" @click="closeAvatarPopup">
            {{ t('adaptation10013') }}
          </button>
        </div>
      </VanPopup>

    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-edit-page {
  position: relative;
  height: 100dvh;
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;


.avatar-file-input {
  display: none;
}
}

.content-wrap {
  position: relative;
  z-index: 1;
  padding: 0 0.48rem;
}


.field-group {
  margin-top: 0.918rem;
}

.glass-input {
  width: 9.0613rem;
  height: 1.6638rem;
  border-radius: 1.4759rem;
  border: none;
  background: #FFFFFF1A;
  backdrop-filter: blur(0.8232rem);
  color: rgba(255, 255, 255, 0.71);
  font-family: 'PingFang SC', var(--font-family-sans);
  font-size: 0.3885rem;
  line-height: 1.4;
  text-align: left;
  padding: 0 0.5539rem;
}

.input-hint {
  margin: 0.2133rem 0 0;
  color: #fbfbfb;
  font-family: 'PingFang SC', var(--font-family-sans);
  font-size: 0.3467rem;
  line-height: 1.4;
}

.gender-select {
  margin-top: 0.6228rem;
  display: flex;
  align-items: center;
  gap: 0.4387rem;
}

.gender-option {
  border: 0;
  background: transparent;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 0.1182rem;
  font-family: var(--font-family-SF);
  font-size: 0.4387rem;
  line-height: 1.25;
}

.radio-icon {
  width: 0.56rem;
  height: 0.56rem;
  flex-shrink: 0;
}

:deep(.sheet-popup) {
  background: transparent;
}

.sheet-body {
  position: relative;
  overflow: hidden;
  width: 100%;
  border-top-left-radius: 0.8445rem;
  border-top-right-radius: 0.8445rem;
  padding: 0.6426rem 0.5321rem calc(0.7872rem + env(safe-area-inset-bottom));
  background: linear-gradient(164deg, rgba(62, 62, 62, 0.92) 5.88%, rgba(23, 23, 23, 0.95) 94.12%);
  backdrop-filter: blur(1.9rem);
  -webkit-backdrop-filter: blur(1.9rem);
}

.sheet-row {
  width: 100%;
  border: 0;
  background: transparent;
  color: #f9f9f9;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.5493rem;
  line-height: 1.333;
  min-height: 0.9867rem;
  transition: opacity 0.15s ease;

  &:active {
    opacity: 0.55;
  }
}

.sheet-divider {
  width: 100%;
  height: 0.0133rem;
  background: rgba(249, 249, 249, 0.22);
  margin: 0.08rem 0;
}

.gender-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3467rem;
}

.sheet-confirm {
  margin-top: 0.3467rem;
  width: 100%;
  border: none;
  border-radius: 1.082rem;
  height: 1.4716rem;
  color: #f9f9f9;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.5493rem;
  line-height: 1.2;
  background: linear-gradient(124.88deg, rgba(255, 255, 255, 0.1) 21.1%, rgba(230, 230, 230, 0.1) 71.4%);
  border: 0.0133rem solid rgba(249, 249, 249, 0.12);
  transition: opacity 0.15s ease;

  &:active {
    opacity: 0.6;
  }

  &:disabled {
    opacity: 0.72;
  }
}
</style>

<style lang="scss">
:root[data-theme='light'] .profile-edit-page {
  color: rgba(15, 8, 8, 0.85);
  background-image: url('@/assets/images/main_bg_light.webp') !important;

  .back-trigger,
  .back-icon {
    color: rgba(15, 8, 8, 0.85);
  }

  .title {
    text-shadow: none;
  }

  .glass-input {
    background: rgba(255, 255, 255, 1);
    border: 0.0213rem solid rgba(0, 0, 0, 0.08);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    color: rgba(15, 8, 8, 0.85);
  }

  .input-hint {
    color: rgba(15, 8, 8, 0.85);
  }

  .gender-option {
    color: rgba(15, 8, 8, 0.85);
  }

  .sheet-body {
    background-image: none !important;
    background-color: rgba(249, 249, 249, 0.94);
  }

  .sheet-row {
    color: #000000;
  }

  .sheet-divider {
    background: rgba(0, 0, 0, 0.18);
  }

  .sheet-confirm {
    background: #05c297;
    border-color: transparent;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    color: #f9f9f9;
  }
}
</style>

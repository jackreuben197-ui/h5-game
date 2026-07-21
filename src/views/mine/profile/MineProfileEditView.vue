<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postUserModifyInfoApi } from '@/api/user'
import { postOssUploadImageApi } from '@/api/oss'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import defaultAvatar from '@/assets/images/default_avatar.png'
import { t } from '@/i18n'

const router = useRouter()

const title = computed(() => t('UIMine_UserInfoSetting_title'))

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--profile-edit-bg-dark': `url(${mainBgUrl})`,
  '--profile-edit-bg-light': `url(${mainBgLightUrl})`,
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
  return gameStore.loginNickname || ''
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
  return gameStore.loginUserId || ''
}

function readDisplayGender(): 'male' | 'female' {
  const user = userInfoStore.userInfo?.user
  if (user && typeof user === 'object') {
    const sex = Number((user as Record<string, unknown>).sex)
    if (sex === 2) {
      return 'female'
    }
  }
  return 'male'
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
selectedGender.value = readDisplayGender()

function goNicknamePage(): void {
  void router.push('/mine/profile/nickname')
}

function openAvatarPopup(): void {
  showAvatarPopup.value = true
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
      <section class="profile-card">
        <div class="profile-card__inner">
          <button class="avatar-wrap" type="button" @click="openAvatarPopup">
            <img :src="String(displayUser.avatar)" alt="avatar" />
            <span class="edit-chip">{{ t('UIGuild_EditorTemplate') }}</span>
          </button>

          <div class="user-box">
            <div class="user-name">{{ displayUser.nickname }}</div>
            <div class="user-id-row">
              <span class="id-tag">ID</span>
              <span class="id-value">{{ displayUser.userId }}</span>
              <span class="gender-mark" aria-hidden="true">
                {{ selectedGender === 'male' ? '♂' : '♀' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="field-group">
        <button class="glass-input" type="button" @click="goNicknamePage">
          {{ nickname || t('UIMine_UserInfoSettingNick_InputName') }}
        </button>
        <p class="input-hint">{{ t('UIMine_UserInfoSettingNick_InputName') }}</p>
      </section>

      <section class="gender-select" @click="openGenderPopup">
        <button class="gender-option" type="button">
          <span class="radio" :class="{ active: selectedGender === 'male' }"></span>
          <span>{{ t('UIMine_UserInfoSetting_Male') }}</span>
        </button>
        <button class="gender-option" type="button">
          <span class="radio" :class="{ active: selectedGender === 'female' }"></span>
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

      <VanPopup
        v-model:show="showGenderPopup"
        round
        position="bottom"
        class="sheet-popup"
        :overlay-style="{ background: 'rgba(12,12,12,0.6)' }"
      >
        <div class="sheet-body">
          <button class="sheet-row gender-row" type="button" @click="popupGender = 'male'">
            <span class="radio" :class="{ active: popupGender === 'male' }"></span>
            <span>{{ t('UIMine_UserInfoSetting_Male') }}</span>
          </button>
          <div class="sheet-divider"></div>
          <button class="sheet-row gender-row" type="button" @click="popupGender = 'female'">
            <span class="radio" :class="{ active: popupGender === 'female' }"></span>
            <span>{{ t('UIMine_UserInfoSetting_Female') }}</span>
          </button>
          <button class="sheet-confirm" type="button" @click="onConfirmGender">
            {{ t('Save') }}
          </button>
        </div>
      </VanPopup>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.profile-edit-page {
  height: 100dvh;
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-color: var(--c-page);
  background-image: var(--profile-edit-bg-dark);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @include theme-light {
    color: #000;
    background-image: var(--profile-edit-bg-light);
  }
}

.content-wrap {
  padding: 0 0.48rem;
}

.avatar-file-input {
  display: none;
}

.profile-card {
  margin-top: 0.9499rem;
  margin-right: auto;
  margin-left: auto;
  width: 8.7467rem;
  min-height: 3.7867rem;
  border-radius: 1.0418rem;
  padding: 0.0267rem;
  background: linear-gradient(
    150deg,
    rgba(255, 255, 255, 0.92) 0%,
    rgba(255, 255, 255, 0.25) 40%,
    rgba(255, 255, 255, 0.75) 100%
  );

  @include theme-light {
    padding: 0.0267rem;
    border: 0.0133rem solid rgba(255, 255, 255, 0.8);
    background: rgba(76, 88, 98, 0.32);
    box-shadow:
      inset 0 0.16rem 0.58rem rgba(255, 255, 255, 0.42),
      inset 0 -0.18rem 0.56rem rgba(0, 0, 0, 0.18),
      0 0.06rem 0.14rem rgba(0, 0, 0, 0.12);
  }
}

.profile-card__inner {
  min-height: 3.7333rem;
  border-radius: 0.98rem;
  padding: 0.6187rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(0.4rem);
  background:
    radial-gradient(
      70% 100% at 20% 30%,
      rgba(159, 62, 26, 0.72) 0%,
      rgba(159, 62, 26, 0.3) 58%,
      rgba(159, 62, 26, 0) 100%
    ),
    radial-gradient(
      80% 130% at 78% 45%,
      rgba(125, 2, 57, 0.72) 0%,
      rgba(125, 2, 57, 0.3) 60%,
      rgba(125, 2, 57, 0) 100%
    ),
    rgba(0, 0, 0, 0.24);
  border: 0.0267rem solid rgba(255, 255, 255, 0.3);

  @include theme-light {
    border-color: rgba(255, 255, 255, 0.34);
    background: rgba(107, 116, 124, 0.18);
    box-shadow: inset 0 0 0.52rem rgba(255, 255, 255, 0.24);
  }
}

.avatar-wrap {
  border: 0;
  background: transparent;
  width: 2.336rem;
  position: relative;
  padding: 0;

  img {
    display: block;
    width: 2.336rem;
    height: 2.336rem;
    border-radius: 50%;
    object-fit: cover;
  }
}

.edit-chip {
  position: absolute;
  left: 50%;
  bottom: -0.16rem;
  transform: translateX(-50%);
  min-width: 0.96rem;
  height: 0.4664rem;
  border-radius: 0.533rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  color: #fbfbfb;
  font-size: 0.2664rem;
  line-height: 0.4664rem;
  text-align: center;
  background: linear-gradient(143deg, #05e7ae 7.55%, #027a5c 71.92%);

  @include theme-light {
    background: var(--c-brand);
  }
}

.user-box {
  display: flex;
  flex-direction: column;
  gap: 0.172rem;
}

.user-name {
  margin: 0;
  font-family: var(--font-family-SF);
  font-size: 0.5972rem;
  line-height: 1;
  font-weight: 700;

  @include theme-light {
    color: #000;
  }
}

.user-id-row {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}

.id-tag {
  min-width: 0.528rem;
  height: 0.374rem;
  padding: 0 0.133rem;
  border-radius: 0.1121rem;
  background: rgba(255, 255, 255, 0.4);
  font-family: var(--font-family-SF);
  font-size: 0.2155rem;
  line-height: 0.374rem;
  text-align: center;

  @include theme-light {
    background: rgba(79, 79, 79, 0.4);
    color: #fff;
  }
}

.id-value {
  font-family: var(--font-family-SF);
  font-size: 0.256rem;
  line-height: 1;

  @include theme-light {
    color: #000;
  }
}

.gender-mark {
  font-size: 0.2933rem;
  line-height: 1;
  color: var(--c-brand);
}

.field-group {
  margin-top: 0.918rem;
}

.glass-input {
  width: 9.0613rem;
  height: 1.6638rem;
  border-radius: 1.4759rem;
  border: 0.0082rem solid rgba(249, 249, 249, 0.6);
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(0.8232rem);
  color: rgba(255, 255, 255, 0.71);
  font-family: 'PingFang SC', var(--font-family-sans);
  font-size: 0.3885rem;
  line-height: 1.4;
  text-align: left;
  padding: 0 0.5539rem;

  @include theme-light {
    border-color: rgba(249, 249, 249, 0.6);
    background: #dadada;
    color: rgba(0, 0, 0, 0.71);
    backdrop-filter: blur(0.8232rem);
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

  @include theme-light {
    color: #000;
  }
}

.radio {
  width: 0.56rem;
  height: 0.56rem;
  border-radius: 50%;
  border: 0.0267rem solid rgba(249, 249, 249, 0.6);
  background: rgba(255, 255, 255, 0.18);
  position: relative;

  @include theme-light {
    border-color: rgba(0, 0, 0, 0.08);
    background: #d0d0d0;
  }

  &.active::after {
    content: '';
    position: absolute;
    inset: 0.1rem;
    border-radius: 50%;
    background: #26f8e6;

    @include theme-light {
      background: var(--c-brand);
    }
  }

  &.active {
    @include theme-light {
      border-color: var(--c-brand);
      background: transparent;
    }
  }
}

:deep(.sheet-popup) {
  background: transparent;
}

.sheet-body {
  width: 10rem;
  border-top-left-radius: 0.8445rem;
  border-top-right-radius: 0.8445rem;
  padding: 0.6426rem 0.5321rem 0.7872rem;
  background: rgba(177, 126, 152, 0.94);
  backdrop-filter: blur(0.9733rem);

  @include theme-light {
    background: #fff;
    color: #000;
  }
}

.sheet-row {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.5493rem;
  line-height: 1.333;
  min-height: 0.9867rem;

  @include theme-light {
    color: #000;
  }
}

.sheet-divider {
  width: 100%;
  height: 0.0267rem;
  background: rgba(249, 249, 249, 0.2);
  margin: 0.08rem 0;

  @include theme-light {
    background: rgba(0, 0, 0, 0.16);
  }
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
  border: 0.0358rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.082rem;
  height: 1.4716rem;
  color: #fff;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.5493rem;
  line-height: 1.2;
  background: linear-gradient(168.09deg, #05e7ae 7.55%, #027a5c 71.92%);

  @include theme-light {
    background: var(--c-brand);
  }

  &:disabled {
    opacity: 0.72;
  }
}
</style>

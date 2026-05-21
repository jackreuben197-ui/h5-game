<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'

import { useRouter } from 'vue-router'
import { postUserModifyInfoApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg2.jpg'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import defaultAvatar from '@/assets/images/default_avatar.png'
import icCheckbox from '@/assets/icons/ic_checkbox.png'
import icUncheckbox from '@/assets/icons/ic_uncheckbox.png'
import ProfileCard from '@/components/ProfileCard/ProfileCard.vue'

const router = useRouter()

const title = computed(() => 'Personal Details')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()

const nickname = ref('')
const selectedGender = ref<'male' | 'female'>('male')
const showAvatarPopup = ref(false)

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
  const sex = gender === 'male' ? 1 : 2
  try {
    const response = await postUserModifyInfoApi({ sex })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '性别更新失败')
    }
    selectedGender.value = gender
    const userInfo = userInfoStore.userInfo
    if (userInfo?.user && typeof userInfo.user === 'object') {
      userInfoStore.setUserInfo({
        ...userInfo,
        user: { ...(userInfo.user), sex, nickname: displayUser.value.nickname },
      })
    }
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '性别更新失败')
  }
}

function onAvatarAction(action: 'album' | 'camera'): void {
  showAvatarPopup.value = false
  showSuccessToast(action === 'album' ? '已选择相册' : '已选择相机')
}

</script>

<template>
  <div class="page-shell profile-edit-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <ProfileCard
        :avatar="String(displayUser.avatar)"
        :nickname="displayUser.nickname"
        :user-id="displayUser.userId"
        :editable="true"
        @avatar-click="openAvatarPopup"
      />

      <section class="field-group">
        <button class="glass-input" type="button" @click="goNicknamePage">
          {{ nickname || 'Name here' }}
        </button>
        <p class="input-hint">Enter your Account Name</p>
      </section>

      <section class="gender-select">
        <button class="gender-option" type="button" @click="selectGender('male')">
          <img class="radio-icon" :src="selectedGender === 'male' ? icCheckbox : icUncheckbox" alt="" />
          <span>Male</span>
        </button>
        <button class="gender-option" type="button" @click="selectGender('female')">
          <img class="radio-icon" :src="selectedGender === 'female' ? icCheckbox : icUncheckbox" alt="" />
          <span>Female</span>
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
          <button class="sheet-row" type="button" @click="onAvatarAction('album')">相册</button>
          <div class="sheet-divider"></div>
          <button class="sheet-row" type="button" @click="onAvatarAction('camera')">相机</button>
          <button class="sheet-confirm" type="button" @click="onAvatarAction('album')">加入</button>
        </div>
      </VanPopup>

    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-edit-page {
  position: relative;
  height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.4598rem);
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.7);
    mix-blend-mode: luminosity;
    backdrop-filter: blur(1.5px);
    -webkit-backdrop-filter: blur(1.5px);
    pointer-events: none;
    z-index: 0;
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
  border: 0.0082rem solid rgba(249, 249, 249, 0.6);
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
  width: 10rem;
  border-top-left-radius: 0.8445rem;
  border-top-right-radius: 0.8445rem;
  padding: 0.6426rem 0.5321rem 0.7872rem;
  background: #0000000D;
  backdrop-filter: blur(0.9733rem);
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
}

.sheet-divider {
  width: 100%;
  height: 0.0267rem;
  background: rgba(249, 249, 249, 0.2);
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
  border: 0.0358rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.082rem;
  height: 1.4716rem;
  color: #fff;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.5493rem;
  line-height: 1.2;
  background: linear-gradient(168.09deg, #05e7ae 7.55%, #027a5c 71.92%);

  &:disabled {
    opacity: 0.72;
  }
}
</style>

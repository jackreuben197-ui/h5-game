<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postUserModifyInfoApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import defaultAvatar from '@/assets/images/default_avatar.png'

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
const showGenderPopup = ref(false)
const popupGender = ref<'male' | 'female'>('male')
const savingGender = ref(false)

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

function goBack(): void {
  router.back()
}

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

function onAvatarAction(action: 'album' | 'camera'): void {
  showAvatarPopup.value = false
  showSuccessToast(action === 'album' ? '已选择相册' : '已选择相机')
}

async function onConfirmGender(): Promise<void> {
  const nextGender = popupGender.value
  const sex = nextGender === 'male' ? 1 : 2

  savingGender.value = true
  try {
    const response = await postUserModifyInfoApi({ sex })
    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '性别更新失败')
    }

    selectedGender.value = nextGender
    const userInfo = userInfoStore.userInfo
    if (userInfo && typeof userInfo === 'object' && userInfo.user && typeof userInfo.user === 'object') {
      userInfoStore.setUserInfo({
        ...userInfo,
        user: {
          ...(userInfo.user as Record<string, unknown>),
          sex,
        },
      })
    }

    showGenderPopup.value = false
    showSuccessToast('性别已更新')
  } catch (error) {
    const message = error instanceof Error ? error.message : '性别更新失败'
    showFailToast(message)
  } finally {
    savingGender.value = false
  }
}
</script>

<template>
  <div class="profile-edit-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="profile-card">
        <div class="profile-card__inner">
          <button class="avatar-wrap" type="button" @click="openAvatarPopup">
            <img :src="String(displayUser.avatar)" alt="avatar" />
            <span class="edit-chip">Edit</span>
          </button>

          <div class="user-box">
            <div class="user-name">{{ displayUser.nickname }}</div>
            <div class="user-id-row">
              <span class="id-tag">ID</span>
              <span class="id-value">{{ displayUser.userId }}</span>
              <span class="id-copy" aria-hidden="true">◌</span>
            </div>
          </div>
        </div>
      </section>

      <section class="field-group">
        <button class="glass-input" type="button" @click="goNicknamePage">
          {{ nickname || 'Name here' }}
        </button>
        <p class="input-hint">Enter your Account Name</p>
      </section>

      <section class="gender-select" @click="openGenderPopup">
        <button class="gender-option" type="button">
          <span class="radio" :class="{ active: selectedGender === 'male' }"></span>
          <span>Male</span>
        </button>
        <button class="gender-option" type="button">
          <span class="radio" :class="{ active: selectedGender === 'female' }"></span>
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
            <span>男</span>
          </button>
          <div class="sheet-divider"></div>
          <button class="sheet-row gender-row" type="button" @click="popupGender = 'female'">
            <span class="radio" :class="{ active: popupGender === 'female' }"></span>
            <span>女</span>
          </button>
          <button class="sheet-confirm" type="button" @click="onConfirmGender">赠送</button>
        </div>
      </VanPopup>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-edit-page {
  min-height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.4598rem);
  padding-bottom: 0.8rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.48rem;
}

.profile-card {
  margin-top: 0.9499rem;
  width: 8.7467rem;
  min-height: 3.7867rem;
  border-radius: 1.0418rem;
  padding: 0.0267rem;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.25) 40%, rgba(255, 255, 255, 0.75) 100%);
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
    radial-gradient(70% 100% at 20% 30%, rgba(159, 62, 26, 0.72) 0%, rgba(159, 62, 26, 0.3) 58%, rgba(159, 62, 26, 0) 100%),
    radial-gradient(80% 130% at 78% 45%, rgba(125, 2, 57, 0.72) 0%, rgba(125, 2, 57, 0.3) 60%, rgba(125, 2, 57, 0) 100%),
    rgba(0, 0, 0, 0.24);
  border: 0.0267rem solid rgba(255, 255, 255, 0.3);
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
}

.id-value {
  font-family: var(--font-family-SF);
  font-size: 0.256rem;
  line-height: 1;
}

.id-copy {
  font-size: 0.2933rem;
  line-height: 1;
  opacity: 0.8;
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

.radio {
  width: 0.56rem;
  height: 0.56rem;
  border-radius: 50%;
  border: 0.0267rem solid rgba(249, 249, 249, 0.6);
  background: rgba(255, 255, 255, 0.18);
  position: relative;

  &.active::after {
    content: '';
    position: absolute;
    inset: 0.1rem;
    border-radius: 50%;
    background: #26f8e6;
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

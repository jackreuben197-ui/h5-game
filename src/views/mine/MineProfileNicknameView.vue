<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postUserCheckNicknameApi, postUserModifyInfoApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import iconDiamond from '@/assets/icons/icon_diamond.png'

const router = useRouter()

const title = computed(() => 'Nickname')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()

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
  return 500
}

const displayUser = computed(() => ({
  nickname: readNickname(),
  diamond: readDiamond(),
}))

inputName.value = String(displayUser.value.nickname || '')

function validateNickname(value: string): string | null {
  if (!value) {
    return '请输入昵称'
  }
  if (value.length < 2) {
    return '昵称至少2个字符'
  }
  if (value.length > 20) {
    return '昵称最多20个字符'
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
    showSuccessToast('昵称未发生变化')
    router.back()
    return
  }

  submitting.value = true
  try {
    const checkRes = await postUserCheckNicknameApi({ nickname: nextNickname })
    if (checkRes.code !== 0) {
      throw new Error(typeof checkRes.msg === 'string' ? checkRes.msg : '昵称不可用')
    }

    const modifyRes = await postUserModifyInfoApi({ nick_name: nextNickname })
    if (modifyRes.code !== 0) {
      throw new Error(typeof modifyRes.msg === 'string' ? modifyRes.msg : '昵称保存失败')
    }

    const userInfo = userInfoStore.userInfo
    if (userInfo && typeof userInfo === 'object' && userInfo.user && typeof userInfo.user === 'object') {
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

    showSuccessToast('昵称已保存')
    router.back()
  } catch (requestError) {
    const message = requestError instanceof Error ? requestError.message : '昵称保存失败'
    showFailToast(message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="nickname-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="nickname-content">
        <input
          v-model="inputName"
          class="name-input"
          type="text"
          maxlength="20"
          placeholder="Name here"
        />
        <p class="input-hint">Enter your Account Name</p>

        <div class="cost-row">
          <span class="label">Cost</span>
          <img class="diamond" :src="iconDiamond" alt="diamond" />
          <span class="origin">500</span>
          <span class="current">100</span>
          <span class="info">!</span>
        </div>

        <div class="cost-row balance-row">
          <span class="label">Diamond Balance</span>
          <img class="diamond" :src="iconDiamond" alt="diamond" />
          <span class="balance">{{ displayUser.diamond }}</span>
        </div>
      </section>

      <div class="save-wrap">
        <button
          class="save-btn"
          type="button"
          :disabled="submitting"
          @click="onSave"
        >
          {{ submitting ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.nickname-page {
  min-height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.4598rem);
  padding-bottom: 1.04rem;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-wrap {
  padding: 0 0.48rem;
  margin-top: 0.6228rem;
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

  &::placeholder {
    color: rgba(255, 255, 255, 0.71);
  }
}

.input-hint {
  margin: 0.2133rem 0 0;
  color: #fbfbfb;
  font-family: 'PingFang SC', var(--font-family-sans);
  font-size: 0.3467rem;
  line-height: 1.4;
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
}

.current,
.balance {
  color: #fff;
  font-weight: 600;
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
}

.save-wrap {
  margin-top: auto;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.08rem);
}

.save-btn {
  width: 8.9046rem;
  height: 1.4349rem;
  border-radius: 1.0557rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  color: #fbfbfb;
  font-family: 'PingFang SC', var(--font-family-sans);
  font-size: 0.5063rem;
  font-weight: 500;
  line-height: 1.2;
  background: linear-gradient(168.34deg, #05e7ae 7.55%, #027a5c 71.92%);

  &:disabled {
    opacity: 0.72;
  }
}
</style>

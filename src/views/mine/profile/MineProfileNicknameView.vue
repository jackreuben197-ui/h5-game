<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { postUserCheckNicknameApi, postUserModifyInfoApi } from '@/api/user'
import mainBgUrl from '@/assets/images/main_bg.webp'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useAppConfigStore } from '@/stores/appConfig'
import { useGameStore } from '@/stores/game'
import { useUserInfoStore } from '@/stores/userInfo'
import iconDiamond from '@/assets/icons/icon_diamond.png'
import icInfo from '@/assets/icons/ic_info.svg'
import { resolveDiamondPriceValue } from '@/utils/diamondPriceConfig'

const router = useRouter()

const title = computed(() => '修改昵称')

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
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
  return 500
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
  <div class="page-shell nickname-page" :style="backgroundStyle">
    <HeaderBack :title="title" />

    <div class="content-wrap">
      <section class="nickname-content">
        <input
          v-model="inputName"
          class="name-input"
          type="text"
          maxlength="20"
          placeholder="请输入昵称"
        />
        <p class="input-hint">请输入昵称</p>

        <div class="cost-row">
          <span class="label">消耗</span>
          <img class="diamond" :src="iconDiamond" alt="diamond" />
          <span class="origin">{{ nicknameCost.original }}</span>
          <span class="current">{{ nicknameCost.current }}</span>
          <img class="info-icon" :src="icInfo" alt="info" />
        </div>

        <div class="cost-row balance-row">
          <span class="label">钻石余额</span>
          <img class="diamond" :src="iconDiamond" alt="diamond" />
          <span class="balance">{{ displayUser.diamond }}</span>
        </div>
      </section>

      <div class="save-wrap">
        <button class="save-btn" type="button" :disabled="submitting" @click="onSave">
          {{ submitting ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.nickname-page {
  height: 100dvh;
  padding-top: calc(env(safe-area-inset-top) + 0.4598rem);
  padding-bottom: 0;
  color: #f9f9f9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
}

.content-wrap {
  padding: 0 0.48rem;
  margin-top: 0.6228rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.name-input {
  width: 9.0613rem;
  height: 1.6638rem;
  border-radius: 1.4759rem;
  border: none;
  background: linear-gradient(123.3deg, rgba(255, 255, 255, 0.1) 21.1%, rgba(230, 230, 230, 0.1) 71.4%);
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
  color: #c1c1c1;
  text-decoration: line-through;
  text-decoration-thickness: 0.0267rem;
  text-decoration-color: #c1c1c1;
}

.current,
.balance {
  color: #fff;
  font-weight: 600;
}

.info-icon {
  width: 0.3632rem;
  height: 0.3632rem;
  flex-shrink: 0;
}

.save-wrap {
  margin-top: auto;
  padding-bottom: calc(env(safe-area-inset-bottom) + 1.08rem);
  display: flex;
  justify-content: center;
}

.save-btn {
  width: 8.9046rem;
  height: 1.4349rem;
  border-radius: 1.0557rem;
  border: 0.0133rem solid rgba(255, 255, 255, 0.2);
  color: #fbfbfb;
  font-family: 'PingFang SC', var(--font-family-sans);
  font-size: 0.5063rem;
  font-weight: 500;
  line-height: 1.2;
  background: linear-gradient(126.8deg, rgba(255, 255, 255, 0.1) 21.1%, rgba(230, 230, 230, 0.1) 71.4%);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  &:disabled {
    opacity: 0.72;
  }
}
</style>

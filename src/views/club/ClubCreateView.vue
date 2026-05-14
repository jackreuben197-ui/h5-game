<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import imgClubCover from '@/assets/images/club_cover_avatar.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { postOrgClubCreateApi, postOrgClubCreateIsFirstApi } from '@/api/org'
import type { OrgClubCreateRequest } from '@/api/models/org'
import { useAppConfigStore } from '@/stores/appConfig'
import { postOssUploadImageApi } from '@/api/oss'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const router = useRouter()
const appConfig = useAppConfigStore()

const clubName = ref('')
const clubIntro = ref('')
const isSubmitting = ref(false)
const avatarSheetVisible = ref(false)
const avatarSource = ref<'camera' | 'gallery'>('gallery')
const galleryInputRef = ref<HTMLInputElement | null>(null)
const cameraInputRef = ref<HTMLInputElement | null>(null)
const avatarPreviewUrl = ref('')
const isFirstCreate = ref(false)

interface ClubCreatePriceConfig {
  raw_price: number
  pay_price: number
  discount: number
  start_date: string
  end_date: string
  start_time: number
  end_time: number
  status: number
}

const clubCreatePriceConfig = computed<ClubCreatePriceConfig | null>(() => {
  const raw = appConfig.globalConfig?.create_club_price
  if (!raw || typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as ClubCreatePriceConfig
  } catch {
    return null
  }
})

const createCostOriginal = computed<number>(() => {
  if (isFirstCreate.value) return 0
  const config = clubCreatePriceConfig.value
  if (!config) return 500
  const now = Math.floor(Date.now() / 1000)
  if (now >= config.start_time && now <= config.end_time) {
    return config.raw_price
  }
  return config.raw_price
})

const createCostCurrent = computed<number>(() => {
  if (isFirstCreate.value) return 0
  const config = clubCreatePriceConfig.value
  if (!config) return 100
  const now = Math.floor(Date.now() / 1000)
  if (now >= config.start_time && now <= config.end_time) {
    return config.pay_price
  }
  return config.raw_price
})

const canCreate = computed(() => {
  return clubName.value.trim().length > 0 && !isSubmitting.value
})

const avatarImage = computed(() => avatarPreviewUrl.value || imgClubCover)

function chooseAvatar(): void {
  avatarSheetVisible.value = true
}

function closeAvatarSheet(): void {
  avatarSheetVisible.value = false
}

function selectAvatarSource(source: 'camera' | 'gallery'): void {
  avatarSource.value = source
  triggerAvatarPicker()
}

function triggerAvatarPicker(): void {
  const targetInput = avatarSource.value === 'camera' ? cameraInputRef.value : galleryInputRef.value
  if (!targetInput) {
    return
  }
  closeAvatarSheet()
  targetInput.click()
}

async function updateAvatarFile(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) {
    return
  }

  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }

  try {
    const formData = new FormData()
    formData.append('file', file)

    const result = await postOssUploadImageApi(
      formData as unknown as Parameters<typeof postOssUploadImageApi>[0],
    )

    if (result?.data) {
      avatarPreviewUrl.value = result.data as unknown as string
    } else {
      showToast('头像上传失败')
    }
  } catch {
    showToast('头像上传失败')
  } finally {
    if (target) {
      target.value = ''
    }
  }
}

onMounted(async () => {
  try {
    const result = await postOrgClubCreateIsFirstApi()
    if (result?.code === 0) {
      isFirstCreate.value = result.is_first === 1
    }
  } catch {
    // ignore
  }
})

onUnmounted(() => {
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }
})

async function onCreateClub(): Promise<void> {
  if (!canCreate.value) {
    return
  }

  isSubmitting.value = true

  try {
    const payload: OrgClubCreateRequest = {
      club_name: clubName.value.trim(),
      desc: clubIntro.value.trim(),
      more_contact: '',
      logo: avatarPreviewUrl.value,
    }

    const result = await postOrgClubCreateApi(payload)

    if (result?.code === 0) {
      showToast('俱乐部创建成功')
      setTimeout(() => {
        router.push('/club')
      }, 3000)
    } else {
      showToast(result?.msg ?? '创建失败，请重试')
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '创建失败，请重试'
    showToast(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page-shell club-create-bg" :style="backgroundStyle">
    <input
      ref="galleryInputRef"
      class="avatar-file-input"
      type="file"
      accept="image/*"
      @change="updateAvatarFile"
    />
    <input
      ref="cameraInputRef"
      class="avatar-file-input"
      type="file"
      accept="image/*"
      capture="environment"
      @change="updateAvatarFile"
    />

    <div class="club-create">
      <HeaderBack :title="'创建俱乐部'" />

      <section class="avatar-card">
        <button
          type="button"
          class="avatar-trigger"
          aria-label="选择俱乐部头像"
          @click="chooseAvatar"
        >
          <img class="avatar-image" :src="avatarImage" alt="俱乐部头像" />
          <span class="add-badge" aria-hidden="true">+</span>
        </button>
      </section>

      <section class="form-card">
        <label class="field-block" for="club-name-input">
          <span class="field-label">俱乐部名称</span>
          <div class="field-shell field-shell--single">
            <input
              id="club-name-input"
              v-model.trim="clubName"
              type="text"
              maxlength="30"
              placeholder="请输入俱乐部名称"
              autocomplete="off"
            />
          </div>
        </label>

        <label class="field-block" for="club-intro-input">
          <span class="field-label">俱乐部简介</span>
          <div class="field-shell field-shell--multi">
            <textarea
              id="club-intro-input"
              v-model.trim="clubIntro"
              maxlength="300"
              placeholder="请输入简介"
            ></textarea>
          </div>
        </label>
      </section>

      <section class="footer-actions">
        <button
          type="button"
          class="create-btn"
          :class="{ 'create-btn--disabled': !canCreate }"
          :disabled="!canCreate"
          @click="onCreateClub"
        >
          {{ isSubmitting ? '创建中...' : '创建' }}
        </button>

        <p class="cost-line" aria-label="创建费用说明">
          <span>共计</span>
          <img :src="imgDiamond" alt="钻石" />
          <span class="cost-original">{{ createCostOriginal }}</span>
          <span class="cost-current">{{ createCostCurrent }}</span>
        </p>
      </section>
    </div>

    <div v-if="avatarSheetVisible" class="avatar-sheet-mask" @click="closeAvatarSheet">
      <div class="avatar-sheet" role="dialog" aria-label="选择头像来源" @click.stop>
        <button
          type="button"
          class="avatar-sheet-option"
          :class="{ 'avatar-sheet-option--active': avatarSource === 'camera' }"
          @click="selectAvatarSource('camera')"
        >
          拍照
        </button>
        <div class="avatar-sheet-divider" aria-hidden="true"></div>
        <button
          type="button"
          class="avatar-sheet-option"
          :class="{ 'avatar-sheet-option--active': avatarSource === 'gallery' }"
          @click="selectAvatarSource('gallery')"
        >
          相册
        </button>
        <!-- <button type="button" class="avatar-sheet-confirm" @click="triggerAvatarPicker">
          确认
        </button> -->
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.club-create-bg {
  height: 100dvh;
  background-size: cover;
}

.avatar-file-input {
  position: fixed;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.club-create {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.40524rem;
  padding-bottom: calc(0.2rem + env(safe-area-inset-bottom));
}

.top-bar {
  min-height: 0.72215rem;
  padding-left: 0.32rem;
}

.back-btn {
  border: 0;
  background: transparent;
  color: #f9f9f9;
  display: inline-flex;
  align-items: center;
  gap: 0.16rem;
  padding: 0;
}

.back-icon {
  width: 0.18rem;
  height: 0.18rem;
  border-left: 0.03rem solid rgba(249, 249, 249, 0.95);
  border-bottom: 0.03rem solid rgba(249, 249, 249, 0.95);
  transform: rotate(45deg);
}

.back-title {
  font-size: 0.49799rem;
  line-height: 1;
  font-weight: 500;
}

.avatar-card {
  margin: 0.2703rem 0.4561rem 0;
  padding: 0.1267rem 0.5828rem;
  min-height: 3.2433rem;
  border-radius: 1.0557rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.158rem);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.avatar-trigger {
  position: relative;
  border: 0;
  padding: 0;
  background: transparent;
  width: 1.7834rem;
  height: 1.7941rem;
  border-radius: 50%;
  overflow: visible;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 0.0107rem solid rgba(255, 255, 255, 0.38);
}

.add-badge {
  position: absolute;
  right: -0.047rem;
  bottom: -0.049rem;
  width: 0.7267rem;
  height: 0.7267rem;
  border-radius: 50%;
  background: linear-gradient(165deg, #05e7ae 10%, #027a5c 75%);
  color: #fff;
  font-size: 0.64rem;
  line-height: 0.7267rem;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 0.0267rem 0.1067rem rgba(0, 0, 0, 0.2);
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 0.4307rem;
  flex: 1;
  min-height: 0;
  padding: 0.4307rem 0.4561rem 0;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 0.4307rem;
}

.field-label {
  font-size: 0.48rem;
  line-height: 1.4;
  font-weight: 500;
  color: #fbfbfb;
}

.field-shell {
  border: 0.0083rem solid rgba(249, 249, 249, 0.6);
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(0.8232rem);
  overflow: hidden;
}

.field-shell--single {
  height: 1.6638rem;
  display: flex;
  align-items: center;
  padding: 0 0.554rem;
  border-radius: 1.4759rem;
}

.field-shell--multi {
  min-height: 6.3176rem;
  border-radius: 0.72rem;
  padding: 0.5405rem;
  background:
    radial-gradient(95% 82% at 15% 30%, rgba(255, 193, 158, 0.42), rgba(255, 193, 158, 0)),
    radial-gradient(82% 78% at 60% 54%, rgba(185, 70, 151, 0.34), rgba(185, 70, 151, 0)),
    radial-gradient(66% 66% at 92% 56%, rgba(54, 208, 255, 0.34), rgba(54, 208, 255, 0)),
    rgba(255, 255, 255, 0.18);
}

input,
textarea {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #fbfbfb;
  font-size: 0.3885rem;
  font-weight: 500;
  line-height: 1.4;
  font-family: inherit;
}

textarea {
  resize: none;
  min-height: 5.776rem;
}

input::placeholder,
textarea::placeholder {
  color: rgba(255, 255, 255, 0.71);
}

.footer-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2872rem;
  padding: 0.2872rem 0 0;
}

.create-btn {
  width: 8.9046rem;
  min-height: 1.4349rem;
  border: 0;
  border-radius: 1.0557rem;
  color: #fbfbfb;
  font-size: 0.5063rem;
  font-weight: 500;
  line-height: 1.2;
  background: linear-gradient(168.34deg, #05e7ae 7.55%, #027a5c 71.92%);
  box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.18);
  transition: opacity 0.2s ease;
}

.create-btn--disabled {
  opacity: 0.56;
}

.cost-line {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.1538rem;
  font-size: 0.359rem;
  line-height: 1.4;
  color: #fbfbfb;
}

.cost-line img {
  width: 0.4rem;
  height: 0.3209rem;
  object-fit: contain;
}

.cost-original {
  position: relative;
  opacity: 0.86;
  text-decoration: line-through;
  text-decoration-color: rgba(255, 255, 255, 0.65);
}

.cost-current {
  color: #05e7ae;
  font-weight: 700;
}

.avatar-sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: flex-end;
}

.avatar-sheet {
  width: min(100%, var(--app-max-width));
  margin: 0 auto;
  padding: 0.6426rem 0.5321rem calc(0.7872rem + env(safe-area-inset-bottom));
  border-top-left-radius: 0.8446rem;
  border-top-right-radius: 0.8446rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.9733rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.34rem;
  color: #f9f9f9;
}

.avatar-sheet-option {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 0.5493rem;
  line-height: 0.7324rem;
  font-weight: 500;
  text-align: center;
  opacity: 0.92;
  transition: opacity 0.18s ease;
}

.avatar-sheet-option--active {
  opacity: 1;
}

.avatar-sheet-divider {
  width: 100%;
  height: 0.01rem;
  background: rgba(249, 249, 249, 0.28);
}

.avatar-sheet-confirm {
  margin-top: 0.08rem;
  width: 8.9358rem;
  height: 1.4716rem;
  border: 0.0134rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.082rem;
  background: linear-gradient(168.09deg, #05e7ae 7.55%, #027a5c 71.92%);
  color: #fff;
  font-size: 0.5063rem;
  line-height: 1.2;
  font-weight: 500;
}

@media (max-width: 340px) {
  .top-bar {
    padding-left: 0.56rem;
    padding-right: 0.56rem;
  }

  .avatar-card {
    margin-left: 0.32rem;
    margin-right: 0.32rem;
  }

  .form-card {
    padding-left: 0.32rem;
    padding-right: 0.32rem;
  }

  .form-card {
    padding-top: 0.32rem;
  }

  .back-title {
    font-size: 0.54rem;
  }

  .field-label {
    font-size: 0.4rem;
  }

  .create-btn {
    width: 100%;
    font-size: 0.44rem;
  }
}
</style>

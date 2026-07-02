<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import ImageUploadSheet from '@/components/ImageUploadSheet/ImageUploadSheet.vue'
import imgClubCover from '@/assets/images/default_club_avatar.svg'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgAvatarAdd from '@/assets/icons/avatar_add_badge.svg'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { postOrgClubCreateApi, postOrgClubCreateIsFirstApi } from '@/api/org'
import type { OrgClubCreateRequest } from '@/api/models/org'
import { useAppConfigStore } from '@/stores/appConfig'
import { useUserInfoStore } from '@/stores/userInfo'
import { resolveDiamondPriceValue } from '@/utils/diamondPriceConfig'
import { t } from '@/i18n'
// 主容器背景图：全页面共用一张底图。

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const router = useRouter()
const appConfig = useAppConfigStore()
const userInfoStore = useUserInfoStore()

const userDisplayId = computed(() => userInfoStore.userInfo?.random_num ?? '--')

const clubName = ref('')
const clubIntro = ref('')
const isSubmitting = ref(false)
const avatarPreviewUrl = ref('')
const isFirstCreate = ref(false)

const createCost = computed(() => {
  if (isFirstCreate.value) {
    return { original: 0, current: 0 }
  }
  return resolveDiamondPriceValue(appConfig.globalConfig?.create_club_price, {
    original: 500,
    current: 100,
  })
})

const createCostOriginal = computed<number>(() => createCost.value.original)
const createCostCurrent = computed<number>(() => createCost.value.current)

const canCreate = computed(() => {
  return clubName.value.trim().length > 0 && !isSubmitting.value
})

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
      showToast(t('UIClub_ClubSuccess'))
      setTimeout(() => {
        router.push('/club')
      }, 3000)
    } else {
      showToast(result?.msg ?? t('UIClub_Fail') + "，" + t('UIClub_Text4'))
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : t('UIClub_Fail') + "，" + t('UIClub_Text4')
    showToast(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page-shell club-create-bg" :style="backgroundStyle">
    <div class="club-create">
      <HeaderBack :title="'创建俱乐部'" />

      <section class="avatar-card">
        <ImageUploadSheet v-model="avatarPreviewUrl">
          <template #default="{ open, imageUrl }">
            <button type="button" class="avatar-trigger" :aria-label="t('UIClub_ClubAvatar')" @click="open">
              <img class="avatar-image" :src="imageUrl || imgClubCover" :alt="t('UIClub_ClubAvatar2')" />
              <img class="add-badge" :src="imgAvatarAdd" alt="" aria-hidden="true" />
            </button>
          </template>
        </ImageUploadSheet>

        <div class="card-info">
          <p class="club-name-preview">
            {{ clubName }}
          </p>
          <!-- <div class="club-id-badge">
            <div class="id-label">
              <span>ID</span>
            </div>
            <span class="id-value">{{ userDisplayId }}</span>
          </div> -->
        </div>
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
  </div>
</template>

<style scoped lang="scss">
.club-create-bg {
  height: 100dvh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
  position: relative;
  margin: 0.2703rem 0.4561rem 0;
  display: flex;
  height: 121.622px;
  padding: 4.751px 21.854px;
  align-items: center;
  gap: 23.754px;
  flex-shrink: 0;
  align-self: stretch;
  border-radius: 39.59px;
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.10) 21.11%, rgba(230, 230, 230, 0.10) 71.43%);
  backdrop-filter: blur(0.15836147964000702px);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 39.59px;
    padding: 1px;
    background: linear-gradient(97deg, rgba(255, 255, 255, 0.10) 21.11%, rgba(230, 230, 230, 0.10) 71.43%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.avatar-trigger {
  position: relative;
  border: 0;
  padding: 0;
  background: transparent;
  width: 66.878px;
  height: 67.279px;
  border-radius: 120px;
  overflow: visible;
  display: block;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 120px;
  object-fit: cover;
  border: 0.0107rem solid rgba(255, 255, 255, 0.38);
}

.add-badge {
  position: absolute;
  left: 43.91px;
  top: 42.55px;
  width: 27.252px;
  height: 27.252px;
  border-radius: 50%;
  display: block;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 12.669px;
  align-items: flex-start;
  flex-shrink: 0;
  z-index: 1;
}

.club-name-preview {
  margin: 0;
  word-break: break-word;
  font-family: 'HONOR Sans CN', 'PingFang SC', sans-serif;
  font-weight: bold;
  font-size: 22.445px;
  line-height: 1.2;
  color: #ffffff;
  max-width: 180px;
}

.club-id-badge {
  display: flex;
  gap: 2.457px;
  align-items: center;
  height: 11.483px;
}

.id-label {
  background: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.808px 4.914px;
  border-radius: 4.212px;
  flex-shrink: 0;

  span {
    font-family: 'SF Pro', 'PingFang SC', sans-serif;
    font-weight: 600;
    font-size: 8.098px;
    line-height: 1;
    color: #ffffff;
  }
}

.id-value {
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-weight: 600;
  font-size: 9.623px;
  line-height: 1;
  color: #ffffff;
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
  display: flex;
  height: 62.394px;
  padding-left: 20.27px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 6.73px;
  align-self: stretch;
  border-radius: 54px;
  border: none;
  background: rgba(34, 34, 34, 0.30);
  background-blend-mode: soft-light;
  backdrop-filter: blur(30.120716094970703px);
}

.field-shell--multi {
  min-height: 5rem;
  border-radius: 0.72rem;
  padding: 0.5405rem;
  border: none;
  background: rgba(34, 34, 34, 0.30);
  background-blend-mode: soft-light;
  backdrop-filter: blur(30.120716094970703px);
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
  min-height: 5rem;
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
  height: 53.807px;
  border: none;
  border-radius: 1.08rem;
 background: linear-gradient(97deg, rgba(255, 255, 255, 0.10) 21.11%, rgba(230, 230, 230, 0.10) 71.43%);
  color: #fff;
  font-size: 0.5rem;
  font-weight: 500;
  font-family: 'HONOR Sans CN', sans-serif;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 内嵌高光边框效果 */
  box-shadow:
    inset 1px 1px 0px 0px rgba(242, 242, 242, 0.8),
    inset -1px -1px 0px 0px rgba(255, 255, 255, 0.5);

  &.primary-btn--no-shadow {
    box-shadow: none;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.34px;
    background: linear-gradient(
      135deg,
      rgba(242, 242, 242, 0.8) 0%,
      rgba(255, 255, 255, 0) 44.5%,
      rgba(255, 255, 255, 0.5) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &:active:not(:disabled) {
    opacity: 0.92;
    transform: scale(0.985);
  }
}

.create-btn--disabled {
  background: linear-gradient(126.814deg, rgba(255, 255, 255, 0.1) 21.106%, rgba(230, 230, 230, 0.1) 71.429%) !important;
  backdrop-filter: blur(0.5px);
  box-shadow: none;
  opacity: 1;
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
  text-decoration: none;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    left: -10%;
    right: -10%;
    top: 50%;
    height: 3px;
    background: #a0a0a0;
    border-radius: 99px;
    transform: translateY(-50%) rotate(15deg);
    transform-origin: center;
    pointer-events: none;
  }
}

.cost-current {
  color: rgba(250, 43, 75, 1);
  font-weight: 700;
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

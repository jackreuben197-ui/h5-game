<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import ImageUploadSheet from '@/components/ImageUploadSheet/ImageUploadSheet.vue'
import imgClubCover from '@/assets/images/default_avatar.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { postOrgClubCreateApi, postOrgClubCreateIsFirstApi } from '@/api/org'
import type { OrgClubCreateRequest } from '@/api/models/org'
import { useAppConfigStore } from '@/stores/appConfig'
import { resolveDiamondPriceValue } from '@/utils/diamondPriceConfig'
import { t } from '@/i18n'
// 主容器背景图：全页面共用一张底图。

const backgroundStyle = computed(() => ({
  '--club-create-bg-dark': `url(${mainBgUrl})`,
  '--club-create-bg-light': `url(${mainBgLightUrl})`,
}))

const router = useRouter()
const appConfig = useAppConfigStore()

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
      <HeaderBack :title="t('club_2')" extra-padding />

      <section class="avatar-card">
        <ImageUploadSheet v-model="avatarPreviewUrl">
          <template #default="{ open, imageUrl }">
            <button type="button" class="avatar-trigger" :aria-label="t('UIClub_ClubAvatar')" @click="open">
              <img class="avatar-image" :src="imageUrl || imgClubCover" :alt="t('UIClub_ClubAvatar2')" />
              <span class="add-badge" aria-hidden="true">+</span>
            </button>
          </template>
        </ImageUploadSheet>
      </section>

      <section class="form-card">
        <label class="field-block" for="club-name-input">
          <span class="field-label">{{ t('UIClub_Creat_2LvGNmS7') }}</span>
          <div class="field-shell field-shell--single">
            <input
              id="club-name-input"
              v-model.trim="clubName"
              type="text"
              maxlength="30"
              :placeholder="t('adaptation10081')"
              autocomplete="off"
            />
          </div>
        </label>

        <label class="field-block" for="club-intro-input">
          <span class="field-label">{{ t('UIClub_Creat_ZizEgnjo') }}</span>
          <div class="field-shell field-shell--multi">
            <textarea
              id="club-intro-input"
              v-model.trim="clubIntro"
              maxlength="300"
              :placeholder="t('UIClub_PleaseDescri')"
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
          {{ isSubmitting ? t('UIClub_Text99') + "..." : t('UIGuild_CreateDes') }}
        </button>

        <p class="cost-line" :aria-label="t('UIClub_Text100')">
          <span>{{ t('UIClub_Text101') }}</span>
          <img :src="imgDiamond" :alt="t('UIMine_VIP_diamond')" />
          <span class="cost-original">{{ createCostOriginal }}</span>
          <span class="cost-current">{{ createCostCurrent }}</span>
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-create-bg {
  height: 100dvh;
  padding-left: 0;
  padding-right: 0;
  background-size: cover;
  background-image: var(--club-create-bg-dark);

  @include theme-light {
    color: #222;
    background-color: #f3f4f6;
    background-image: var(--club-create-bg-light);
  }
}

.club-create {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  // gap: 0.40524rem;
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

  @include theme-light {
    background: #fff;
    backdrop-filter: none;
  }
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

  @include theme-light {
    background: var(--c-brand);
    box-shadow: none;
  }
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 0.4307rem;
  flex: 1;
  min-height: 0;
  padding: 0.3rem 0.4561rem 0;
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

  @include theme-light {
    color: #111;
  }
}

.field-shell {
  border: 0.0083rem solid rgba(249, 249, 249, 0.6);
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(0.8232rem);
  overflow: hidden;

  @include theme-light {
    border-color: transparent;
    background: #d9d9d9;
    backdrop-filter: none;
  }
}

.field-shell--single {
  height: 1.6638rem;
  display: flex;
  align-items: center;
  padding: 0 0.554rem;
  border-radius: 1.4759rem;
}

.field-shell--multi {
  min-height: 6rem;
  border-radius: 0.72rem;
  padding: 0.4rem;
  background: radial-gradient(95% 82% at 15% 30%, rgba(255, 193, 158, 0.42), rgba(255, 193, 158, 0)),
    radial-gradient(82% 78% at 60% 54%, rgba(185, 70, 151, 0.34), rgba(185, 70, 151, 0)),
    radial-gradient(66% 66% at 92% 56%, rgba(54, 208, 255, 0.34), rgba(54, 208, 255, 0)),
    rgba(255, 255, 255, 0.18);

  @include theme-light {
    background: #d9d9d9;
  }
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

  @include theme-light {
    color: #222;
  }
}

textarea {
  resize: none;
  min-height: 5rem;
}

input::placeholder,
textarea::placeholder {
  color: rgba(255, 255, 255, 0.71);

  @include theme-light {
    color: rgba(34, 34, 34, 0.78);
  }
}

.footer-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2872rem;
  padding: 1.5rem 0 0;
}

.create-btn {
  width: 8.9rem;
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

  @include theme-light {
    background: var(--c-brand);
    box-shadow: none;
  }
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

  @include theme-light {
    color: #111;
  }
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

  @include theme-light {
    text-decoration-color: rgba(34, 34, 34, 0.68);
  }
}

.cost-current {
  color: var(--c-brand);
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

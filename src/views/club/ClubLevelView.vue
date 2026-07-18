<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import {
  postOrgClubLevelBenefitApi,
  postOrgClubLevelInfoApi,
  postOrgClubUpLevelApi,
} from '@/api/org'
import type { OrgClubLevelBenefitRecord } from '@/api/models/org'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgMedal from '@/assets/images/club_medal.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatDateTime } from '@/utils/time'
import { t } from '@/i18n'

const backgroundStyle = computed(() => ({
  '--club-level-bg-dark': `url(${mainBgUrl})`,
  '--club-level-bg-light': `url(${mainBgLightUrl})`,
}))

const userInfoStore = useUserInfoStore()
const showUpgradeConfirm = ref(false)
const loading = ref(false)
const upgrading = ref(false)
const currentLevel = ref(1)
const levelExpireTime = ref('--')
const currentLimitType = ref(2)
const levelBenefits = ref<OrgClubLevelBenefitRecord[]>([])
const selectedBenefitIndex = ref(0)

const selectedBenefit = computed(() => levelBenefits.value[selectedBenefitIndex.value])
const targetLevel = computed(() => Number(selectedBenefit.value?.club_level || currentLevel.value))
const upgradeCost = computed(() => Number(selectedBenefit.value?.level_count || 0))
const memberLimit = computed(() => Number(selectedBenefit.value?.user_num || 0))
const levelDuration = computed(() => Number(selectedBenefit.value?.level_duration || 0))
const isPermanent = computed(() => Number(selectedBenefit.value?.limit_type) === 1)
const sliderMax = computed(() => Math.max(0, levelBenefits.value.length - 1))
const levelLabel = computed(() => `LEVEL ${currentLevel.value || 1}`)
const diamondBalance = computed(() => {
  const value = Number(userInfoStore.userInfo?.user?.diamonds || 0)
  return Number.isFinite(value) ? Math.max(0, value) : 0
})
const canUpgrade = computed(
  () =>
    levelBenefits.value.length > 0 &&
    targetLevel.value > currentLevel.value &&
    !loading.value &&
    !upgrading.value,
)
const levelDesc = computed(() => `成员上限人数临时提升至${memberLimit.value}人`)
const durationText = computed(() => (isPermanent.value ? '永久' : `${levelDuration.value}天`))
const expiryText = computed(() =>
  currentLimitType.value === 1 ? '永久' : levelExpireTime.value || '--',
)
const confirmText = computed(
  () =>
    `确认消耗${upgradeCost.value}钻石升级至 Level ${targetLevel.value}（${durationText.value}）吗？`,
)

function dotStyle(index: number): Record<string, string> {
  const max = sliderMax.value
  return { left: `${max > 0 ? (index / max) * 100 : 0}%` }
}

function openUpgradeConfirm(): void {
  if (!canUpgrade.value) {
    showFailToast(t('UIClub_CurrentDoneCanLevel'))
    return
  }
  showUpgradeConfirm.value = true
}

function closeUpgradeConfirm(): void {
  if (upgrading.value) return
  showUpgradeConfirm.value = false
}

function formatExpireTime(value: unknown): string {
  if (value === undefined || value === null || String(value).trim() === '') return '--'
  const normalized =
    typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value
  const formatted = formatDateTime(normalized, 'DD/MM/YYYY HH:mm')
  return formatted === '--:--' ? '--' : formatted
}

async function confirmUpgrade(): Promise<void> {
  if (upgrading.value) return

  const clubId = Number(userInfoStore.currentClub?.club_id)
  if (!clubId) {
    showFailToast(t('UIClub_NotFoundClub'))
    return
  }

  const chargedDiamond = upgradeCost.value
  const upgradedLevel = targetLevel.value
  upgrading.value = true
  try {
    const response = await postOrgClubUpLevelApi({ club_id: clubId, level: upgradedLevel })
    if (response.code !== 0) {
      const fallback = response.msg ?? response.message
      throw new Error(typeof fallback === 'string' ? fallback : t('UIClub_Fail6'))
    }

    userInfoStore.syncUserDiamond(diamondBalance.value - chargedDiamond)
    userInfoStore.syncCurrentClubFields({ level: upgradedLevel })
    showUpgradeConfirm.value = false
    showSuccessToast(t('error0'))
    await loadLevelData()
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : t('UIClub_Fail6'))
  } finally {
    upgrading.value = false
  }
}

async function loadLevelData(): Promise<void> {
  const clubId = Number(userInfoStore.currentClub?.club_id)
  if (!clubId) {
    showFailToast(t('UIClub_NotFoundClub'))
    return
  }

  loading.value = true
  try {
    const [infoRes, benefitRes] = await Promise.all([
      postOrgClubLevelInfoApi({ club_id: clubId }),
      postOrgClubLevelBenefitApi({}),
    ])

    if (infoRes.code !== 0 || benefitRes.code !== 0) {
      const message = infoRes.msg ?? benefitRes.msg ?? t('UIClub_FetchClubLevelFail')
      throw new Error(typeof message === 'string' ? message : t('UIClub_FetchClubLevelFail'))
    }

    const info = infoRes.data?.data
    currentLevel.value = Math.max(1, Number(info?.level || 1))
    levelExpireTime.value = formatExpireTime(info?.up_level_time)
    currentLimitType.value = Number(info?.limit_type || 2)

    levelBenefits.value = (benefitRes.data?.data || [])
      .filter((item) => Number(item.club_level) > 0)
      .sort((left, right) => Number(left.club_level) - Number(right.club_level))

    const currentIndex = levelBenefits.value.findIndex(
      (item) => Number(item.club_level) === currentLevel.value,
    )
    const nearestIndex = levelBenefits.value.findIndex(
      (item) => Number(item.club_level) >= currentLevel.value,
    )
    selectedBenefitIndex.value =
      currentIndex >= 0
        ? currentIndex
        : nearestIndex >= 0
          ? nearestIndex
          : Math.max(0, levelBenefits.value.length - 1)
  } catch (error) {
    console.error('loadLevelData error', error)
    showFailToast(error instanceof Error ? error.message : t('UIClub_FetchClubLevelFail'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadLevelData()
})
</script>

<template>
  <div class="page-shell club-level-page" :style="backgroundStyle">
    <div class="club-level-bg" aria-hidden="true"></div>
    <div class="club-level-content">
      <HeaderBack title="俱乐部等级">
        <template #right>
          <div class="club-level-diamond">
            <img :src="imgDiamond" :alt="t('UIMine_VIP_diamond')" />
            <span>{{ diamondBalance }}</span>
          </div>
        </template>
      </HeaderBack>

      <main v-loading="loading" class="club-level-main">
        <section class="club-medal">
          <img class="club-medal__coin-bg" :src="imgMedal" alt="勋章" />
          <div class="club-medal__level-pill">{{ levelLabel }}</div>
        </section>

        <section class="club-upgrade-card">
          <p class="club-upgrade-card__date">有效日期至：{{ expiryText }}</p>

          <div class="club-upgrade-progress" aria-label="选择俱乐部等级">
            <VanSlider
              v-model="selectedBenefitIndex"
              :min="0"
              :max="sliderMax"
              :step="1"
              :disabled="levelBenefits.length <= 1"
            />
            <span
              v-for="(_, index) in levelBenefits"
              :key="index"
              class="club-upgrade-progress__dot"
              :style="dotStyle(index)"
            ></span>
          </div>

          <div class="club-upgrade-cost">
            <p>升级至{{ targetLevel }}级俱乐部需消耗钻石</p>
            <div class="club-upgrade-cost__value">
              <span class="club-upgrade-cost__badge">
                <AppSvgIcon name="club-level-badge" />
                <i>{{ targetLevel }}</i>
              </span>
              <span>{{ upgradeCost }}</span>
              <img :src="imgDiamond" alt="钻石" />
            </div>
          </div>

          <div class="club-upgrade-card__details">
            <p>{{ levelDesc }}</p>
            <p>
              有效期：<strong>{{ durationText }}</strong>
            </p>
          </div>
        </section>
      </main>

      <footer class="club-level-footer">
        <PrimaryButton
          text="升级俱乐部等级"
          :disabled="!canUpgrade"
          :loading="loading || upgrading"
          @click="openUpgradeConfirm"
        />
      </footer>

      <div v-if="showUpgradeConfirm" class="club-level-mask" @click="closeUpgradeConfirm">
        <section class="club-level-confirm" @click.stop>
          <p>{{ confirmText }}</p>
          <div class="club-level-confirm__actions">
            <button
              type="button"
              class="club-level-confirm__cancel"
              :disabled="upgrading"
              @click="closeUpgradeConfirm"
            >
              取消
            </button>
            <button
              type="button"
              class="club-level-confirm__ok"
              :disabled="upgrading"
              @click="confirmUpgrade"
            >
              <span v-if="upgrading" class="club-level-confirm__spinner"></span>
              {{ upgrading ? '升级中...' : '确定' }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-level-page {
  position: relative;
  height: 100dvh;
  overflow: hidden;
  color: #f9f9f9;
  background-image: var(--club-level-bg-dark);
  background-size: cover;
  background-position: center;

  @include theme-light {
    color: var(--c-text);
    background-color: #f3f4f6;
    background-image: var(--club-level-bg-light);
  }
}

.club-level-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.club-level-bg::before,
.club-level-bg::after {
  content: '';
  position: absolute;
  width: 4.8rem;
  height: 4.8rem;
  border-radius: 50%;
  background: var(--c-brand);
  filter: blur(1.7rem);
  opacity: 0.16;
}

.club-level-bg::before {
  left: -3.3rem;
  top: -2.4rem;
}

.club-level-bg::after {
  right: -3.6rem;
  top: -0.8rem;
}

.club-level-content {
  position: relative;
  z-index: 1;
  height: 100%;
}

.club-level-diamond {
  min-height: 0.84rem;
  padding: 0.06rem 0.18rem;
  border-radius: 0.94rem;
  background: #f9f9f9;
  color: #453e3e;
  display: inline-flex;
  align-items: center;
  gap: 0.136rem;
  font-size: 0.48rem;
  font-weight: 600;

  @include theme-light {
    color: #fff;
    background: var(--c-brand);
  }
}

.club-level-diamond img {
  width: 0.52rem;
  height: 0.42rem;
  object-fit: contain;
}

.club-level-main {
  padding: 0.78rem 0.56rem 3.3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.club-medal {
  position: relative;
  width: 5.87rem;
  height: 5.33rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.club-medal__coin-bg {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.club-medal__level-pill {
  position: absolute;
  bottom: 1.8rem;
  min-width: 4.53rem;
  height: 1.183rem;
  box-sizing: border-box;
  border-radius: 4.22rem;
  color: #fff;
  font-size: 0.666rem;
  font-weight: 800;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.24rem;
  text-transform: uppercase;
  text-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.2);
}

.club-upgrade-card {
  margin-top: 0.22rem;
  width: 100%;
  max-width: 8.94rem;
  min-height: 4.73rem;
  box-sizing: border-box;
  border-radius: 1.11rem;
  padding: 0.46rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.17rem);

  @include theme-light {
    background: #fff;
    box-shadow: 0 0.08rem 0.36rem rgba(62, 84, 108, 0.06);
  }
}

.club-upgrade-card__date {
  margin: 0;
  text-align: center;
  font-size: 0.373rem;
  line-height: 1.35;
  color: rgba(249, 249, 249, 0.9);

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }
}

.club-upgrade-progress {
  position: relative;
  margin: 0.42rem 0.1rem 0;
  height: 0.74rem;
  display: flex;
  align-items: center;
  --level-slider-inactive: rgba(255, 255, 255, 0.45);
  --level-slider-button: rgba(198, 176, 186, 0.9);
  --level-slider-button-border: rgba(255, 255, 255, 0.5);
  --level-slider-button-filter: blur(100px) saturate(1.5);

  @include theme-light {
    --level-slider-inactive: rgba(125, 125, 125, 0.5);
    --level-slider-button: rgba(49, 49, 49, 0.08);
    --level-slider-button-border: transparent;
    --level-slider-button-filter: blur(10px) saturate(3.5);
  }
}

.club-upgrade-progress :deep(.van-slider) {
  width: 100%;
  height: 0.124rem;
  background: var(--level-slider-inactive);
  --van-slider-active-background: var(--c-brand);
  --van-slider-inactive-background: var(--level-slider-inactive);
}

.club-upgrade-progress :deep(.van-slider__button) {
  width: 0.726rem;
  height: 0.726rem;
  border: 0.01rem solid var(--level-slider-button-border);
  background: var(--level-slider-button);
  backdrop-filter: var(--level-slider-button-filter);
  -webkit-backdrop-filter: var(--level-slider-button-filter);
  box-shadow: none;
}

.club-upgrade-progress__dot {
  position: absolute;
  z-index: 1;
  top: 50%;
  width: 0.124rem;
  height: 0.124rem;
  border-radius: 50%;
  background: #d9d9d9;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.club-upgrade-cost {
  margin-top: 0.14rem;
  min-height: 1.18rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
}

.club-upgrade-cost p {
  margin: 0;
  font-size: 0.321rem;
  line-height: 1.35;
  color: rgba(249, 249, 249, 0.72);

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }
}

.club-upgrade-cost__value {
  display: inline-flex;
  align-items: center;
  gap: 0.136rem;
  font-size: 0.543rem;
  line-height: 1;
  font-weight: 600;
}

.club-upgrade-cost__value > img {
  width: 0.533rem;
  height: 0.427rem;
  object-fit: contain;
}

.club-upgrade-cost__badge {
  position: relative;
  width: 0.64rem;
  height: 0.64rem;
  color: var(--c-brand);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.club-upgrade-cost__badge .app-svg-icon {
  width: 100%;
  height: 100%;
}

.club-upgrade-cost__badge i {
  position: absolute;
  color: #fff;
  font-style: normal;
  font-size: 0.314rem;
  line-height: 1;
  font-weight: 600;
}

.club-upgrade-card__details {
  padding: 0 0.29rem;
  color: rgba(249, 249, 249, 0.74);

  @include theme-light {
    color: rgba(0, 0, 0, 0.7);
  }
}

.club-upgrade-card__details p {
  margin: 0;
  font-size: 0.321rem;
  line-height: 1.4;
}

.club-upgrade-card__details strong {
  color: inherit;
  font-weight: 600;
}

.club-level-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 0.64rem calc(env(safe-area-inset-bottom) + 0.6rem);
  z-index: 3;
}

.club-level-mask {
  position: fixed;
  inset: 0;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  z-index: 10;
}

.club-level-confirm {
  width: min(8.25rem, 100%);
  padding: 0.82rem 0.42rem 0.55rem;
  border-radius: 0.97rem;
  border: 0.025rem solid rgba(242, 242, 242, 0.4);
  background: linear-gradient(121deg, rgba(142, 142, 142, 0.2), rgba(73, 73, 73, 0.38));
  backdrop-filter: blur(0.2rem);
  color: #f9f9f9;

  @include theme-light {
    color: var(--c-text);
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.92);
  }
}

.club-level-confirm p {
  margin: 0;
  text-align: center;
  font-size: 0.362rem;
  line-height: 1.3;
}

.club-level-confirm__actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.253rem;
}

.club-level-confirm__actions button {
  flex: 1;
  min-width: 0;
  height: 1.436rem;
  border: 0;
  border-radius: 1.056rem;
  color: #fff;
  font-size: 0.4rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
}

.club-level-confirm__actions button:disabled {
  opacity: 0.68;
}

.club-level-confirm__cancel {
  background: rgba(0, 0, 0, 0.34);
}

.club-level-confirm__ok {
  background: var(--c-brand);
}

.club-level-confirm__spinner {
  width: 0.42rem;
  height: 0.42rem;
  border: 0.045rem solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: club-level-spin 0.65s linear infinite;
}

@keyframes club-level-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-height: 720px) {
  .club-level-main {
    padding-top: 0.35rem;
  }

  .club-medal {
    width: 4.95rem;
    height: 4.5rem;
  }

  .club-medal__level-pill {
    bottom: 0.86rem;
    min-width: 3.82rem;
    height: 1rem;
    font-size: 0.56rem;
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { postOrgClubLevelCostApi, postOrgClubLevelInfoApi, postOrgClubUpLevelApi } from '@/api/org'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgMedal from '@/assets/images/club_medal.png'
import imgLevelThumb from '@/assets/images/club_level_thumb.svg'
import imgLevelBadge from '@/assets/images/club_level_badge.svg'
import imgRankBadge from '@/assets/icons/club_rank_badge.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.webp'
import { useUserInfoStore } from '@/stores/userInfo'
import { showFailToast, showSuccessToast } from 'vant'
import { t, tJoin } from '@/i18n'

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--club-level-bg-dark': `url(${mainBgUrl})`,
  '--club-level-bg-light': `url(${mainBgLightUrl})`,
}))

const userInfoStore = useUserInfoStore()
const showUpgradeConfirm = ref(false)
const loading = ref(false)
const currentLevel = ref(1)
const targetLevel = ref(2)
const upgradeCost = ref(0)
const levelExpireTime = ref('--')
const levelDuration = ref(30)
const memberLimit = ref(200)

function openUpgradeConfirm(): void {
  if (!targetLevel.value || targetLevel.value <= currentLevel.value) {
    showFailToast(t('UIClub_CurrentDoneCanLevel'))
    return
  }
  showUpgradeConfirm.value = true
}

function closeUpgradeConfirm(): void {
  showUpgradeConfirm.value = false
}

async function confirmUpgrade(): Promise<void> {
  const clubId = Number(userInfoStore.currentClub?.club_id)
  if (!clubId) {
    showFailToast(t('UIClub_NotFoundClub'))
    return
  }

  loading.value = true
  try {
    const response = await postOrgClubUpLevelApi({
      club_id: clubId,
      level: targetLevel.value,
    })

    if (response.code !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : t('UIClub_Fail6'))
    }

    showUpgradeConfirm.value = false
    showSuccessToast(t('UIClub_DoneSubmitApply'))
    await loadLevelData()
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_Fail6')
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

const progressActiveDots = computed(() => {
  const lv = Number(currentLevel.value)
  if (!Number.isFinite(lv)) {
    return 1
  }
  return Math.max(1, Math.min(9, lv + 1))
})

const progressPercent = computed(() => {
  return (progressActiveDots.value - 1) * 12.5
})

const levelLabel = computed(() => `LEVEL ${currentLevel.value || 1}`)

const levelDesc = computed(() => {
  return tJoin(t('UIClub_MemberPeople'), memberLimit.value, t('Common_People'))
})

const diamondBalance = computed(() => Number(userInfoStore.currentClub?.user_gold || 0))

const confirmText = computed(() => {
  const cost = tJoin(t('UIClub_Confirm'), upgradeCost.value, t('UICommunityFundDiamondBuyType'))
  const duration = tJoin(levelDuration.value, t('UIHappyShop_ActivityShopDay'))
  return `${cost} Level ${targetLevel.value} (${duration})?`
})

async function loadLevelData(): Promise<void> {
  const clubId = Number(userInfoStore.currentClub?.club_id)
  if (!clubId) {
    showFailToast(t('UIClub_NotFoundClub'))
    return
  }

  loading.value = true
  try {
    const [infoRes, costRes] = await Promise.all([
      postOrgClubLevelInfoApi({ club_id: clubId }),
      postOrgClubLevelCostApi({ club_id: clubId }),
    ])

    if (infoRes.code === 0) {
      const info = infoRes.data?.data
      currentLevel.value = Number(info?.level || 1)
      levelExpireTime.value = info?.up_level_time || '--'
      levelDuration.value = Number(info?.limit_type === 1 ? 0 : levelDuration.value)
    }

    if (costRes.code === 0) {
      const data = costRes.data as Record<string, unknown> | undefined
      targetLevel.value = Number(data?.target_level || currentLevel.value + 1)
      upgradeCost.value = Number(data?.level_count || data?.cost || 0)
      memberLimit.value = Number(data?.user_num || memberLimit.value)
      levelDuration.value = Number(data?.level_duration || levelDuration.value)
    }
  } catch (error) {
    console.error('loadLevelData error', error)
    showFailToast(t('UIClub_FetchClubLevelFail'))
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
    <div class="club-members">
      <HeaderBack :title="t('UIGuid_Level')">
        <template #right>
          <div class="club-level-diamond">
            <img :src="imgDiamond" :alt="t('UIMine_VIP_diamond')" />
            <span>{{ diamondBalance }}</span>
          </div>
        </template>
      </HeaderBack>

      <main v-loading="loading" class="club-level-main">
        <section class="club-medal">
          <div><img class="club-medal__coin-bg" :src="imgMedal" :alt="t('UIClub_Text105')" /></div>
          <!-- <div class="club-medal__level-pill">{{ levelLabel }}</div> -->
        </section>

        <section class="club-upgrade-card">
          <p class="club-upgrade-card__date">
            <span>{{ t('UIClub_Text106') }}：</span
            ><span class="club-upgrade-card__date--value">{{ levelExpireTime }}</span>
          </p>

          <div class="club-upgrade-progress" aria-label="升级进度">
            <div
              class="club-upgrade-progress__line"
              :style="{ right: `${100 - progressPercent}%` }"
            ></div>
            <div
              class="club-upgrade-progress__line club-upgrade-progress__line--rest"
              :style="{ left: `${progressPercent}%` }"
            ></div>
            <span
              v-for="idx in 9"
              :key="idx"
              class="club-upgrade-progress__dot"
              :class="{ 'club-upgrade-progress__dot--active': idx <= progressActiveDots }"
            ></span>
            <img
              class="club-upgrade-progress__thumb"
              :src="imgLevelThumb"
              alt=""
              aria-hidden="true"
              :style="{ left: `${progressPercent}%` }"
            />
          </div>

          <div class="club-upgrade-cost">
            <p>{{ tJoin(t('UIClub_Text107'), targetLevel, t('UIClub_Club5')) }}</p>
            <div class="club-upgrade-cost__value">
              <span class="club-upgrade-cost__badge">
                <img :src="imgLevelBadge" alt="" aria-hidden="true" />
                <i>{{ targetLevel }}</i>
              </span>
              <span class="club-upgrade-cost__amount">{{ upgradeCost }}</span>
              <img :src="imgDiamond" :alt="t('UIMine_VIP_diamond')" />
            </div>
          </div>

          <div class="club-upgrade-card__desc">
            <p>{{ levelDesc }}</p>
            <p>
              <span>{{ t('UIMineLimitTime') }}：</span
              ><span class="club-upgrade-card__desc--value">{{ tJoin(levelDuration, t('UIHappyShop_ActivityShopDay')) }}</span>
            </p>
          </div>
        </section>
      </main>

      <footer class="club-level-footer">
        <button type="button" class="club-upgrade-btn" @click="openUpgradeConfirm">
          Upgrade Level
        </button>
      </footer>

      <div v-if="showUpgradeConfirm" class="club-level-mask" @click="closeUpgradeConfirm">
        <section class="club-level-confirm" @click.stop>
          <p>{{ confirmText }}</p>
          <div class="club-level-confirm__actions">
            <button type="button" class="club-level-confirm__cancel" @click="closeUpgradeConfirm">
              取消
            </button>
            <button type="button" class="club-level-confirm__ok" @click="confirmUpgrade">
              确定
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
  background-size: cover;

  @include theme-light-own {
    background-image: url('@/assets/images/main_bg_light.webp') !important;
    color: #000000;

    .club-level-bg {
      display: none;
    }

    :deep(.back-trigger),
    :deep(.back-icon) {
      color: #000;
    }

    :deep(.title) {
      color: #000;
      text-shadow: none;
    }

    .club-level-diamond {
      background: #ffffff !important;
      color: #000000;
      box-shadow: 0 0.04rem 0.12rem rgba(0, 0, 0, 0.06);
    }

    .club-upgrade-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      color: #000000;
    }

    .club-upgrade-card__date,
    .club-upgrade-card__desc,
    .club-upgrade-cost p {
      color: rgba(0, 0, 0, 0.65);
    }

    .club-upgrade-card__date--value,
    .club-upgrade-card__desc--value {
      color: #000000;
    }

    .club-upgrade-cost__amount {
      color: var(--primary-button, #05c297);
    }

    .club-upgrade-progress__line {
      background: var(--primary-button, #05c297);
    }

    .club-upgrade-progress__line--rest {
      background: rgba(0, 0, 0, 0.2);
    }

    .club-upgrade-progress__dot {
      background: rgba(0, 0, 0, 0.2);

      &--active {
        background: var(--primary-button, #05c297);
      }
    }

    .club-upgrade-btn {
      background: var(--primary-button, #05c297) !important;
      border: none !important;
      color: #ffffff !important;
      box-shadow: none !important;
    }

    .club-level-confirm {
      background: #ffffff;
      color: #000000;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);

      p {
        color: #000000;
      }
    }

    .club-level-confirm__cancel {
      background: rgba(0, 0, 0, 0.06);
      color: #222222;
    }

    .club-level-confirm__actions .club-level-confirm__ok {
      background: var(--c-brand, #05c297);
      color: #ffffff;
      border: none;
    }
  }
}

.club-level-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.club-level-bg img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-level-bg__overlay {
  mix-blend-mode: screen;
  opacity: 0.82;
}

.club-level-header {
  position: relative;
  z-index: 2;
  padding: calc(var(--app-top-padding) + var(--app-content-safe-area-top, env(safe-area-inset-top)) + 0.18rem) 0.64rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.club-level-back {
  border: 0;
  background: transparent;
  padding: 0;
  color: #f9f9f9;
  display: inline-flex;
  align-items: center;
  gap: 0.16rem;
  font-size: 0.64rem;
  line-height: 1.2;
  font-weight: 500;
}

.club-level-back__icon {
  width: 0.22rem;
  height: 0.22rem;
  border-left: 0.032rem solid rgba(249, 249, 249, 0.95);
  border-bottom: 0.032rem solid rgba(249, 249, 249, 0.95);
  transform: rotate(45deg);
}

.club-level-diamond {
  min-height: 0.84rem;
  padding: 0.06rem 0.18rem;
  border-radius: 0.94144rem;
  background: #f9f9f9;
  color: #453e3e;
  display: inline-flex;
  align-items: center;
  gap: 0.136rem;
  font-size: 0.48rem;
  font-weight: 600;
}

.club-level-diamond img {
  width: 0.52rem;
  height: 0.42rem;
  object-fit: contain;
}

.club-level-main {
  position: relative;
  z-index: 2;
  padding: 1.1rem 0.56rem 3.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.club-medal {
  position: relative;
  width: 5.86667rem;
  height: 5.33333rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.club-medal__coin {
  position: relative;
  width: 4.20571rem;
  height: 4.20571rem;
}

.club-medal__coin-bg {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.club-medal__ribbon {
  position: absolute;
  width: 3.15429rem;
  height: 1.65195rem;
  bottom: 0.4rem;
  object-fit: contain;
  opacity: 0.95;
}

.club-medal__level-pill {
  position: absolute;
  bottom: 1.02rem;
  min-width: 4.52792rem;
  height: 1.18344rem;
  border-radius: 4.22123rem;
  color: #fff;
  font-size: 0.6656rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  text-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.2);
}

.club-medal__star {
  position: absolute;
  object-fit: contain;
}

.club-medal__star--main {
  width: 1.22667rem;
  height: 1.2rem;
  left: 50%;
  top: 1.18rem;
  transform: translateX(-50%);
}

.club-medal__star--left {
  width: 1.01349rem;
  height: 1.01349rem;
  left: 0.88rem;
  top: 1.34rem;
  transform: rotate(-10deg);
}

.club-medal__star--right {
  width: 1.01349rem;
  height: 1.01349rem;
  right: 0.88rem;
  top: 1.34rem;
  transform: rotate(10deg);
}

.club-upgrade-card {
  margin-top: 0.56rem;
  width: 100%;
  max-width: 8.94056rem;
  border-radius: 1.11rem;
  padding: 0.463rem;
  display: flex;
  flex-direction: column;
  gap: 0.419rem;
  background: linear-gradient(
    101.276deg,
    rgba(255, 255, 255, 0.1) 21.1%,
    rgba(230, 230, 230, 0.1) 71.4%
  );
  backdrop-filter: blur(0.166px);
}

.club-upgrade-card__date {
  margin: 0;
  text-align: center;
  font-size: 0.37317rem;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.7);
}

.club-upgrade-card__date--value {
  font-weight: 500;
  color: #fff;
}

.club-upgrade-progress {
  position: relative;
  height: 0.74rem;
}

.club-upgrade-progress__line {
  position: absolute;
  left: 0;
  right: 50%;
  top: 50%;
  height: 0.12403rem;
  border-radius: 0.61851rem;
  background: #78e490;
  transform: translateY(-50%);
}

.club-upgrade-progress__line--rest {
  left: 50%;
  right: 0;
  background: rgba(255, 255, 255, 0.5);
}

.club-upgrade-progress__dot {
  position: absolute;
  top: 50%;
  width: 0.12403rem;
  height: 0.12403rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
}

.club-upgrade-progress__dot--active {
  background: #78e490;
}

.club-upgrade-progress__dot:nth-of-type(3) {
  left: 0%;
}

.club-upgrade-progress__dot:nth-of-type(4) {
  left: 12.5%;
}

.club-upgrade-progress__dot:nth-of-type(5) {
  left: 25%;
}

.club-upgrade-progress__dot:nth-of-type(6) {
  left: 37.5%;
}

.club-upgrade-progress__dot:nth-of-type(7) {
  left: 50%;
}

.club-upgrade-progress__dot:nth-of-type(8) {
  left: 62.5%;
}

.club-upgrade-progress__dot:nth-of-type(9) {
  left: 75%;
}

.club-upgrade-progress__dot:nth-of-type(10) {
  left: 87.5%;
}

.club-upgrade-progress__dot:nth-of-type(11) {
  left: 100%;
}

.club-upgrade-progress__thumb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.72635rem;
  height: 0.72635rem;
  object-fit: contain;
  transform: translate(-50%, -50%);
}

.club-upgrade-cost {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.04rem;
}

.club-upgrade-cost p {
  margin: 0;
  font-size: 0.32083rem;
  line-height: 1.35;
  color: rgba(249, 249, 249, 0.72);
}

.club-upgrade-cost__value {
  display: inline-flex;
  align-items: center;
  gap: 0.13587rem;
  font-size: 0.54344rem;
  line-height: 1;
  font-weight: 600;
}

.club-upgrade-cost__amount {
  color: #78e490;
}

.club-upgrade-cost__value > img {
  width: 0.53333rem;
  height: 0.42667rem;
  object-fit: contain;
}

.club-upgrade-cost__badge {
  position: relative;
  width: 0.64rem;
  height: 0.64rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.club-upgrade-cost__badge img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.club-upgrade-cost__badge i {
  position: absolute;
  font-style: normal;
  font-size: 0.31411rem;
  line-height: 1;
  font-weight: 600;
}

.club-upgrade-card__desc {
  padding: 0 0.288rem;
  font-size: 0.32083rem;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.7);
}

.club-upgrade-card__desc p {
  margin: 0;
}

.club-upgrade-card__desc--value {
  font-weight: 500;
  color: #fff;
}

.club-level-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 0.64rem calc(env(safe-area-inset-bottom) + 0.6rem);
  z-index: 3;
}

.club-upgrade-btn {
  width: 100%;
  height: 1.47157rem;
  border: 0.03584rem solid rgba(242, 242, 242, 0.4);
  border-radius: 1.08203rem;
  background: linear-gradient(
    124.811deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  );
  backdrop-filter: blur(0.526px);
  color: #fff;
  font-size: 0.73822rem;
  font-weight: 500;
  line-height: 1.2;
  transition: opacity 0.2s ease;
}

.club-upgrade-btn:active {
  opacity: 0.8;
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
  width: min(8.25283rem, 100%);
  padding: 0.82rem 0.42rem 0.55rem;
  border-radius: 0.97035rem;
  border: 0.0255rem solid rgba(242, 242, 242, 0.4);
  background: linear-gradient(121deg, rgba(142, 142, 142, 0.2) 3%, rgba(73, 73, 73, 0.38) 89%);
  backdrop-filter: blur(0.20216rem);
  box-shadow:
    0 0 0.22981rem rgba(0, 0, 0, 0.85) inset,
    0.05672rem 0.11344rem 0.45908rem rgba(242, 242, 242, 0.5) inset;
  color: #f9f9f9;
}

.club-level-confirm p {
  margin: 0;
  text-align: center;
  font-size: 0.36232rem;
  line-height: 1.3;
}

.club-level-confirm__actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.25339rem;
}

.club-level-confirm__actions button {
  flex: 1;
  min-width: 0;
  height: 1.43581rem;
  border-radius: 1.05574rem;
  font-size: 0.4rem;
  font-weight: 500;
  color: #fff;
  border: 0;
}

.club-level-confirm__cancel {
  background: rgba(0, 0, 0, 0.34);
}

.club-level-confirm__actions .club-level-confirm__ok {
  border: 0.01333rem solid rgba(242, 242, 242, 0.4);
  background: linear-gradient(
    106.392deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  );
  backdrop-filter: blur(0.16230463981628418px);
  color: #78e490;
  transition: opacity 0.2s ease;
}

.club-level-confirm__actions .club-level-confirm__ok:active {
  opacity: 0.8;
  color: #78e490;
}

@media (max-width: 340px) {
  .club-level-diamond {
    font-size: 0.42rem;
  }

  .club-medal {
    transform: scale(0.9);
  }

  .club-upgrade-btn {
    font-size: 0.62rem;
  }
}
</style>

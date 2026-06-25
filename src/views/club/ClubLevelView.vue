<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { postOrgClubLevelCostApi, postOrgClubLevelInfoApi, postOrgClubUpLevelApi } from '@/api/org'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgMedal from '@/assets/images/club_medal.png'
import imgRankBadge from '@/assets/icons/club_rank_badge.png'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { useUserInfoStore } from '@/stores/userInfo'
import { showFailToast, showSuccessToast } from 'vant'
import { t } from '@/i18n'

// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
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

const levelLabel = computed(() => `LEVEL ${currentLevel.value || 1}`)

const levelDesc = computed(() => {
  return t('UIClub_MemberPeople') + (memberLimit.value) + t('Common_People')
})

const diamondBalance = computed(() => Number(userInfoStore.currentClub?.user_gold || 0))

const confirmText = computed(() => {
  return t('UIClub_Confirm') + (upgradeCost.value) + t('UICommunityFundDiamondBuyType') + "Level " + (targetLevel.value) + "(" + (levelDuration.value) + t('UIHappyShop_ActivityShopDay') + ")?"
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
      <HeaderBack :title="'俱乐部等级'">
        <template #right>
          <div class="club-level-diamond">
            <img :src="imgDiamond" :alt="t('UIMine_VIP_diamond')" />
            <span>{{ diamondBalance }}</span>
          </div>
        </template>
      </HeaderBack>

      <main v-loading="loading" class="club-level-main">
        <section class="club-medal">
          <div><img class="club-medal__coin-bg" :src="imgMedal" alt="勋章" /></div>
          <div class="club-medal__level-pill">{{ levelLabel }}</div>
        </section>

        <section class="club-upgrade-card">
          <p class="club-upgrade-card__date">有效日期至：{{ levelExpireTime }}</p>

          <div class="club-upgrade-progress" aria-label="升级进度">
            <div class="club-upgrade-progress__line"></div>
            <div class="club-upgrade-progress__line club-upgrade-progress__line--rest"></div>
            <span
              v-for="idx in 9"
              :key="idx"
              class="club-upgrade-progress__dot"
              :class="{ 'club-upgrade-progress__dot--active': idx <= progressActiveDots }"
            ></span>
            <span class="club-upgrade-progress__thumb"></span>
          </div>

          <div class="club-upgrade-cost">
            <p>升级至{{ targetLevel }}级俱乐部需消耗钻石</p>
            <div class="club-upgrade-cost__value">
              <span class="club-upgrade-cost__badge">
                <img :src="imgRankBadge" alt="" aria-hidden="true" />
                <i>{{ targetLevel }}</i>
              </span>
              <span>{{ upgradeCost }}</span>
              <img :src="imgDiamond" alt="钻石" />
            </div>
          </div>

          <p class="club-upgrade-card__desc">{{ levelDesc }}</p>
          <p class="club-upgrade-card__desc">有效期：{{ levelDuration }}天</p>
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
.club-level-page {
  position: relative;
  height: 100dvh;
  background-size: cover;
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
  padding: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.18rem) 0.64rem 0;
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
  border-radius: 1.10968rem;
  padding: 0.46163rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16667rem);
}

.club-upgrade-card__date {
  margin: 0;
  text-align: center;
  font-size: 0.37317rem;
  line-height: 1.35;
  color: rgba(249, 249, 249, 0.9);
}

.club-upgrade-progress {
  position: relative;
  margin-top: 0.4rem;
  height: 0.74rem;
}

.club-upgrade-progress__line {
  position: absolute;
  left: 0;
  right: 50%;
  top: 50%;
  height: 0.12403rem;
  border-radius: 0.61851rem;
  background: #05e7ae;
  transform: translateY(-50%);
}

.club-upgrade-progress__line--rest {
  left: 50%;
  right: 0;
  background: rgba(255, 255, 255, 0.45);
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
  background: #05e7ae;
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
  border-radius: 50%;
  background: radial-gradient(circle at 32% 28%, #dae0e2, #8d97a5 74%);
  box-shadow: 0 0.05333rem 0.10667rem rgba(0, 0, 0, 0.22);
  transform: translate(-50%, -50%);
}

.club-upgrade-cost {
  margin-top: 0.22rem;
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
  margin: 0;
  font-size: 0.32083rem;
  line-height: 1.35;
  color: rgba(249, 249, 249, 0.74);
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
  border: 0.03584rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.08203rem;
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
  color: #fff;
  font-size: 0.73822rem;
  font-weight: 500;
  line-height: 1.2;
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

.club-level-confirm__ok {
  border: 0.01333rem solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(153deg, #05e7ae 8%, #027a5c 72%);
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

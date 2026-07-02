<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FilterTabOption } from '@/components/Tabbar/FilterTabbar.vue'
import serviceIcon from '@/assets/icons/icon_server.png'
import walletIcon from '@/assets/icons/icon_wallet.png'
import { useMttListStore } from '@/stores/mttList'
import { useUserInfoStore } from '@/stores/userInfo'
import { t } from '@/i18n'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import { showFailToast } from 'vant'

type MttTabName = 'all' | 'poker' | 'mahjong'

const activeTab = ref<MttTabName>('all')
const mttListStore = useMttListStore()
const userInfoStore = useUserInfoStore()
const router = useRouter()

const selectedClubId = computed(() => toSafeInt(userInfoStore.currentClub?.club_id))
const selectedTribeId = computed(() =>
  toSafeInt((userInfoStore.currentClub as Record<string, unknown> | null)?.tribe_id),
)

const mttTabs = computed<FilterTabOption[]>(() => [
  { name: 'all', title: resolveLabel('UIMatch_GtO8YEdb', '全部') },
  { name: 'poker', title: resolveLabel('UIHomePokerArea', '扑克赛事') },
])

onMounted(() => {
  // 与首页共用同一个 MTT 数据源：先读缓存秒开，再静默刷新。
  mttListStore.bootstrapMttList()
})

function toSafeInt(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return 0
  }
  return Math.floor(num)
}

function resolveLabel(key: string, fallback: string): string {
  const translated = t(key)
  if (translated && translated !== key) {
    return translated
  }
  return fallback
}

function handleBack() {
  router.push('/home')
}

function handleOpenCustomerService() {
  const clubId = selectedClubId.value
  if (clubId <= 0) {
    showFailToast('当前俱乐部信息无效')
    return
  }

  openGlobalCustomerServiceChat({
    imServiceType: 1,
    clubId,
    tribeId: selectedTribeId.value,
  })
}
</script>

<template>
  <div class="mtt-list-page themeType2" @back="handleBack">
    <div class="bg-overlay"></div>

    <HeaderBack :title="t('UIHomeMttArea')" extra-padding>
      <template #right>
        <div class="action-wrap">
          <TopActionButton
            :name="t('UIGuildFund_RechargeText')"
            :icon="walletIcon"
            icon-alt="wallet"
            @click="router.push('/wallet')"
          />
          <TopActionButton
            v-if="userInfoStore.currentClub?.support_im_rid"
            :name="t('UIMineMain01')"
            :icon="serviceIcon"
            icon-alt="service"
            @click="handleOpenCustomerService"
          />
        </div>
      </template>
    </HeaderBack>
    <FilterTabbar v-model="activeTab" :tabs="mttTabs" />
    <MttContent :active-tab="activeTab" />
  </div>
</template>

<style scoped lang="scss">
.mtt-list-page {
  position: relative;
  min-height: 100dvh;
  color: #fff;
  overflow: hidden;
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 15% 92%, rgba(255, 173, 212, 0.32), transparent 34%),
    radial-gradient(circle at 88% 84%, rgba(102, 227, 255, 0.28), transparent 34%),
    radial-gradient(circle at 50% 56%, rgba(255, 255, 255, 0.12), transparent 48%);
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 0.26rem;
  margin-right: 0.25rem;
}

.mtt-content {
  position: relative;
  z-index: 1;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding: 0.34rem 0.38rem 2.2rem;
  backdrop-filter: blur(0.3533rem) saturate(1.04);
}

/* ---- 分组 ---- */
.mtt-group {
  margin-bottom: 0.48rem;
  padding: 0 0.4rem;
}

.mtt-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 0.32rem;
}

.mtt-group__title {
  font-size: 0.4893rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.mtt-group__title--empty {
  min-height: 0.5866rem;
}

/* 收起热区与“查看全部”保持同宽，避免收起时点击区域变窄。 */
.mtt-group__toggle {
  display: inline-flex;
  justify-content: flex-end;
  width: 4em;
  font-size: 0.32rem;
  font-weight: 500;
  color: #ececec;
  cursor: pointer;
  text-align: right;
  line-height: 0.6rem;
}

/* ---- 网格布局 ---- */
.mtt-grid {
  width: 100%;
}

/* 3列 */
.mtt-grid--sm {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.26rem;
}

/* 2列 */
.mtt-grid--md {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.26rem;
}

/* 1列 */
.mtt-grid--lg {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

/* ---- 空状态 ---- */
.empty-wrap {
  margin-top: 1.4933rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2133rem;
  font-size: 0.3467rem;
  color: rgba(255, 255, 255, 0.82);
}
</style>

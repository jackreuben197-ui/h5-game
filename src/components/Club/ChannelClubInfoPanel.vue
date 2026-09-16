<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getUserClubApi } from '@/api/user'
import { openGlobalCustomerServiceChat } from '@/components/GlobalCustomerServiceChat/channel'
import AppSvgIcon from '@/components/Icon/AppSvgIcon.vue'
import { showGameToast } from '@/components/Toast'
import { t } from '@/i18n'
import { requireRealUser } from '@/session/realUserGate'
import { useAppConfigStore } from '@/stores/appConfig'
import { useGameStore } from '@/stores/game'
import { type ClubInfo, useUserInfoStore } from '@/stores/userInfo'
import { isChannelPackageHost } from '@/utils/channelPackage'

const router = useRouter()
const appConfigStore = useAppConfigStore()
const gameStore = useGameStore()
const userInfoStore = useUserInfoStore()
const isChannelPackage = isChannelPackageHost()

const loading = ref(false)
const balanceVisible = ref(true)

const currentClub = computed<ClubInfo | null>(() =>
  userInfoStore.currentClub ||
  userInfoStore.clubList[0] ||
  (isChannelPackage ? userInfoStore.channelDefaultClub : null),
)
const selectedClubId = computed(() => toSafeInt(currentClub.value?.club_id))
const selectedTribeId = computed(() =>
  toSafeInt((currentClub.value as Record<string, unknown> | null)?.tribe_id),
)
const clubNameText = computed(
  () => toSafeString(currentClub.value?.club_name) || t('UILobby_Menu_menu_btn_club'),
)
const clubGoldText = computed(() =>
  gameStore.isRealUser ? toSafeNumber(currentClub.value?.user_gold) / 100 : 0,
)

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function toSafeInt(value: unknown): number {
  return Math.floor(toSafeNumber(value))
}

function toggleBalance(): void {
  if (!requireRealUser(toggleBalance)) return
  balanceVisible.value = !balanceVisible.value
}

async function refreshBalance(): Promise<void> {
  if (!requireRealUser(refreshBalance)) return
  try {
    loading.value = true
    await getUserClubApi()
  } catch (error) {
    showGameToast(error instanceof Error ? error.message : t('UIHome_Fail'))
  } finally {
    loading.value = false
  }
}

function goToRecharge(): void {
  if (!requireRealUser(goToRecharge)) return
  void router.push('/wallet')
}

function handleOpenEmail(): void {
  const email = toSafeString(appConfigStore.globalConfig?.support_email)
  window.open(`mailto:${email}`, '_blank')
}

function handleOpenTelegram(): void {
  const raw = toSafeString(appConfigStore.globalConfig?.official_contact_address)
  let telegramUrl = ''
  try {
    telegramUrl = toSafeString((JSON.parse(raw) as Record<string, unknown>)?.telegram)
  } catch (error) {
    console.warn('[channel-club-info] parse official_contact_address failed:', error)
  }
  window.open(telegramUrl, '_blank')
}

function handleOpenCustomerService(): void {
  if (selectedClubId.value <= 0) {
    showGameToast(t('UIClub_CurrentClubNo'))
    return
  }

  openGlobalCustomerServiceChat({
    imServiceType: 1,
    clubId: selectedClubId.value,
    tribeId: selectedTribeId.value,
  })
}
</script>

<template>
  <div class="club-panel">
    <div class="club-left">
      <div class="club-service-row">
        <span class="service-label">{{ clubNameText }}</span>
        <img
          class="icon-sm icon-eye"
          src="@/assets/icons/icon_eye_open.svg"
          :alt="t('UIHome_Text') + '/' + t('UIHome_Text2')"
          @click="toggleBalance"
        />
      </div>
      <div class="club-balance-row">
        <img
          class="icon-sm"
          src="@/assets/icons/icon_chips.png"
          :alt="t('UIClub_CreateRoom31')"
        />
        <span v-if="loading" class="balance-amount">
          <van-loading size="16" />
        </span>
        <span v-else class="balance-amount">
          {{ balanceVisible ? clubGoldText : '****' }}
        </span>
        <svg
          class="icon-sm icon-refresh"
          xmlns="http://www.w3.org/2000/svg"
          width="19"
          height="19"
          viewBox="0 0 19 19"
          fill="none"
          @click="refreshBalance"
        >
          <path
            d="M9.22333 18.4467C4.12929 18.4467 0 14.3174 0 9.22333C0 4.12929 4.12929 0 9.22333 0C14.3174 0 18.4467 4.12929 18.4467 9.22333C18.4467 14.3174 14.3174 18.4467 9.22333 18.4467ZM13.669 13.9051C14.7823 12.8498 15.4836 11.4326 15.6471 9.90734C15.8106 8.38207 15.4257 6.84842 14.5613 5.58114C13.6969 4.31385 12.4095 3.39575 10.9298 2.9913C9.45006 2.58685 7.87467 2.72248 6.48585 3.37389L7.38512 4.99259C8.08695 4.68756 8.85365 4.56198 9.61612 4.62715C10.3786 4.69233 11.1128 4.94622 11.7527 5.36594C12.3926 5.78566 12.918 6.35802 13.2815 7.03142C13.645 7.70481 13.8352 8.45808 13.835 9.22333H11.068L13.669 13.9051ZM11.9608 15.0728L11.0615 13.4541C10.3597 13.7591 9.59301 13.8847 8.83055 13.8195C8.06808 13.7543 7.33382 13.5004 6.69394 13.0807C6.05407 12.661 5.5287 12.0886 5.16519 11.4152C4.80168 10.7418 4.61145 9.98858 4.61167 9.22333H7.37866L4.77769 4.54157C3.66433 5.59684 2.96308 7.01406 2.79958 8.53933C2.63608 10.0646 3.021 11.5982 3.88539 12.8655C4.74978 14.1328 6.03715 15.0509 7.51688 15.4554C8.9966 15.8598 10.572 15.7242 11.9608 15.0728Z"
            fill="#ABABAB"
          />
        </svg>
        <button class="recharge-btn" type="button" @click="goToRecharge">
          {{ t('OpCodeString_RECHARGE') }}
        </button>
      </div>
    </div>

    <div class="club-right">
      <div class="contact-item" @click="handleOpenTelegram">
        <AppSvgIcon class="contact-icon" name="telegram" title="Telegram" />
        <span class="contact-label">@game</span>
      </div>
      <div class="contact-item" @click="handleOpenEmail">
        <AppSvgIcon
          class="contact-icon"
          name="contact-user"
          :title="t('UISetting_SecurityBindEmailItem')"
        />
        <span class="contact-label">{{ $txt('UISetting_SecurityBindEmailItem') }}</span>
      </div>
      <div v-if="currentClub?.support_im_rid" class="contact-item" @click="handleOpenCustomerService">
        <AppSvgIcon class="contact-icon" name="customer-service" :title="'IM' + t('UIMineMain01')" />
        <span class="contact-label">{{ $txt('UIMineMain01') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-panel {
  display: flex;
  align-items: center;
  min-height: 1.54rem;
  padding: 0.1rem 0.6rem;
  gap: 0;
  box-sizing: border-box;
  border: 0.302px solid rgba(0, 0, 0, 0.16);
  border-radius: 1rem;
  background: #fff;
  box-shadow:
    inset 1px 1px 0 0 rgba(255, 255, 255, 0.35),
    inset -1px -1px 0 0 rgba(255, 255, 255, 0.35);
}

.club-left {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.12rem;
}

.club-service-row,
.club-balance-row {
  display: flex;
  align-items: center;
  gap: 0.12rem;
}

.service-label {
  color: #000;
  font-size: 0.3rem;
}

.icon-sm {
  width: 0.4rem;
  height: 0.4rem;
  flex-shrink: 0;
}

.icon-eye {
  width: 0.453rem;
  height: 0.347rem;
}

.icon-eye,
.icon-refresh {
  margin-right: 0.1rem;
  cursor: pointer;
}

.balance-amount {
  min-width: 0.5rem;
  color: #000;
  font-size: 0.38rem;
  font-weight: 500;
  text-align: center;
}

.recharge-btn {
  width: 1.3rem;
  padding: 0.06rem 0;
  border: none;
  border-radius: 1rem;
  color: #000;
  background: #e7e7e7;
  font-size: 0.28rem;
  white-space: nowrap;
  cursor: pointer;
}

.club-right {
  display: flex;
  align-items: center;
  gap: 0.28rem;
}

.contact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.contact-icon {
  width: 0.8rem;
  height: 0.8rem;
  box-sizing: border-box;
  border-radius: 50%;
  color: #0ca7ef;
  background: #f7f8fa;

  @include theme-light {
    color: #000;
  }
}

.contact-label {
  max-width: 1rem;
  overflow: hidden;
  color: #000;
  font-size: 0.2rem;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

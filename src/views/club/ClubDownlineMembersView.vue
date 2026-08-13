<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  postClubAgentUserListApi,
  postOrgClubAgentCreditBalanceApi,
  postOrgClubAgentCreditLimitApi,
  postOrgClubAgentInviTationApi,
} from '@/api/org'
import { postUserAgencyGoldGrantApi, postUserAgencySendDiamondsApi } from '@/api/user'
import type { ClubAgentUserListRecord } from '@/api/models/org'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_credit_chip.png'
import imgSearch from '@/assets/icons/club_search.svg'
import imgInfo from '@/assets/icons/tips.svg'
import { extractInvitationLink } from '@/utils/clubInvitation'
import { saveQrCodeImage } from '@/utils/qrcode'
import { formatUC } from '@/utils/roomVisibility'
import { showFailToast, showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { t } from '@/i18n'
import FundKeypad from '@/components/KeyBoard/FundKeypad.vue'
import { useTheme } from '@/composables/useTheme'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--downline-bg-dark': `url(${mainBgUrl})`,
  '--downline-bg-light': `url(${mainBgLightUrl})`,
}))

type FundAssetTab = 'coin' | 'quota' | 'diamond'
type QuotaEditField = 'disposable' | 'review'
type QuotaAdjustMode = 'increase' | 'decrease'

interface DownlineMemberItem {
  id: number
  name: string
  uid: string
  avatar: string
  uc: number
  disposableCredit: number
  reviewCredit: number
  diamond: number
}

const userInfoStore = useUserInfoStore()
const { isDark } = useTheme()

const loading = ref(false)
const keyword = ref('')
const members = ref<DownlineMemberItem[]>([])
const total = ref(0)
const invitationLink = ref('')
const showFundSheet = ref(false)
const activeMember = ref<DownlineMemberItem | null>(null)
const fundAssetTab = ref<FundAssetTab>('coin')
const fundAmountInput = ref('')
const quotaEditField = ref<QuotaEditField | null>(null)
const quotaAdjustMode = ref<QuotaAdjustMode>('increase')
const quotaInput = ref('')
const disposableQuota = ref(0)
const reviewQuota = ref(0)
const submittingFund = ref(false)

const totalText = computed(() => {
  const current = members.value.length
  const max = total.value || current
  return `${current}/${max}`
})

const invitationPreview = computed(() => invitationLink.value || t('UIClub_NotFetch'))
const shouldShowCoinFundTab = computed(
  () =>
    toSafeNumber(userInfoStore.currentClub?.tribe_id) > 0 &&
    toSafeNumber(userInfoStore.currentClub?.agent_uc_switch) === 1,
)
const availableFundAssetTabs = computed<FundAssetTab[]>(() => {
  const tabs: FundAssetTab[] = []
  if (shouldShowCoinFundTab.value) {
    tabs.push('coin')
  }
  tabs.push('quota')
  tabs.push('diamond')
  return tabs
})
const agentCoinBalance = computed(() => toSafeNumber(userInfoStore.currentClub?.user_gold))
const agentDiamondBalance = computed(() => toSafeNumber(userInfoStore.userInfo?.user?.diamonds))
const agentDisposableQuotaBalance = computed(() =>
  toSafeNumber(userInfoStore.currentClub?.user_credit),
)

const currentFundBalanceText = computed(() => {
  if (!activeMember.value) {
    return '--'
  }

  if (fundAssetTab.value === 'diamond') {
    return String(activeMember.value.diamond)
  }

  return formatUC(activeMember.value.uc)
})

const currentInputText = computed(() => {
  if (fundAssetTab.value === 'quota' && quotaEditField.value) {
    return quotaInput.value || t('UIClub_Please2')
  }

  return fundAmountInput.value || t('UIGuildMemberOperationGiveNumber')
})

function toSafeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function mapMember(record: ClubAgentUserListRecord): DownlineMemberItem {
  const id = toSafeNumber(record.user_id)
  return {
    id,
    name: String(record.remark_name || record.nick_name || t('UIClub_Info_Members') + (id || '--')),
    uid: String(record.random_num || '--'),
    avatar: String(record.avatar || imgAvatar),
    uc: toSafeNumber(record.gold),
    disposableCredit: toSafeNumber(record.club_gold_credit),
    reviewCredit: toSafeNumber(record.club_gold_credit_limit),
    diamond: toSafeNumber(record.diamonds),
  }
}

function patchMemberOnList(member: DownlineMemberItem): void {
  const index = members.value.findIndex((item) => item.id === member.id)
  if (index < 0) {
    return
  }

  const next = [...members.value]
  next[index] = member
  members.value = next
}

function pickDefaultFundAssetTab(): FundAssetTab {
  return availableFundAssetTabs.value[0] || 'quota'
}

async function loadMembers() {
  loading.value = true
  try {
    const response = await postClubAgentUserListApi({
      club_random_id: userInfoStore.currentClub?.random_id,
      club_id: userInfoStore.currentClub?.club_id,
      sort_type: 4,
      order_type: 2,
      search: keyword.value.trim(),
      offset: 0,
      limit: 20,
      simple: true,
      return_diamonds: true,
    })

    if (response.code !== 0 || !response.data) {
      showFailToast(response.msg || t('UIClub_FetchDownliFail'))
      members.value = []
      total.value = 0
      return
    }

    const records = Array.isArray(response.data.data) ? response.data.data : []
    members.value = records.map(mapMember)
    total.value = Number(response.data.total ?? records.length)
  } catch (error) {
    console.error('loadMembers error', error)
    showFailToast(t('UIClub_FetchDownliFail'))
    members.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadInvitationLink() {
  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id) {
    invitationLink.value = ''
    return
  }

  const cached = userInfoStore.getClubAgentInvitation(currentClub.random_id)
  if (cached) {
    invitationLink.value = cached
    return
  }

  try {
    const rawUserId = currentClub.user_id ?? userInfoStore.userInfo?.user?.id
    const userId = Number(rawUserId)

    const response = await postOrgClubAgentInviTationApi({
      club_id: currentClub.club_id,
      user_id: Number.isFinite(userId) ? userId : undefined,
    })

    if (response.code !== 0) {
      invitationLink.value = ''
      return
    }

    const link = extractInvitationLink(response.data)
    let finalLink = link

    invitationLink.value = finalLink
    if (finalLink) {
      userInfoStore.setClubAgentInvitation(currentClub.random_id, finalLink)
    }
  } catch (error) {
    console.error('loadInvitationLink error', error)
    invitationLink.value = ''
  }
}

function onSearch() {
  void loadMembers()
}

function openFundSheet(member: DownlineMemberItem): void {
  activeMember.value = member
  showFundSheet.value = true
  fundAssetTab.value = pickDefaultFundAssetTab()
  fundAmountInput.value = ''
  quotaInput.value = ''
  quotaEditField.value = null
  quotaAdjustMode.value = 'increase'
  disposableQuota.value = member.disposableCredit
  reviewQuota.value = member.reviewCredit
}

function closeFundSheet(): void {
  showFundSheet.value = false
  quotaEditField.value = null
}

function switchFundAsset(tab: FundAssetTab): void {
  if (!availableFundAssetTabs.value.includes(tab)) {
    return
  }

  fundAssetTab.value = tab

  if (tab !== 'quota') {
    quotaEditField.value = null
    quotaInput.value = ''
    quotaAdjustMode.value = 'increase'
  }
}

function editQuota(field: QuotaEditField): void {
  quotaEditField.value = field
  quotaInput.value = ''
  quotaAdjustMode.value = 'increase'
}

function onKeypadPress(key: string): void {
  const isQuotaEditing = fundAssetTab.value === 'quota' && quotaEditField.value
  const target = isQuotaEditing ? quotaInput : fundAmountInput

  if (key === 'C') {
    target.value = ''
    return
  }

  if (key === 'DEL') {
    target.value = target.value.slice(0, -1)
    return
  }

  if (target.value.length >= 9) {
    return
  }

  target.value += key
}

async function submitQuotaUpdate(options: {
  field: QuotaEditField
  amount: number
  adjustMode: QuotaAdjustMode
}): Promise<void> {
  const member = activeMember.value
  if (!member?.id) {
    showFailToast(t('UIClub_NotFoundMember'))
    return
  }

  const signedAmount =
    options.adjustMode === 'decrease' ? -Math.abs(options.amount) : Math.abs(options.amount)
  const payload = {
    user_id: member.id,
    gold_type: 3,
    amount: signedAmount * 100,
    is_reset: false,
  }

  const response =
    options.field === 'disposable'
      ? await postOrgClubAgentCreditBalanceApi(payload)
      : await postOrgClubAgentCreditLimitApi(payload)

  if (response.code !== 0) {
    throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_Fail2'))
  }
}

async function onFundConfirm(): Promise<void> {
  if (submittingFund.value) {
    return
  }

  const member = activeMember.value
  if (!member?.id) {
    showFailToast(t('UIClub_NotFoundMember'))
    return
  }

  if (fundAssetTab.value === 'quota') {
    if (!quotaEditField.value || !quotaInput.value) {
      showFailToast(t('UIClub_PleaseOf'))
      return
    }

    const amount = Number.parseInt(quotaInput.value, 10)
    if (Number.isNaN(amount) || amount <= 0) {
      showFailToast(t('UIClub_PleaseOf'))
      return
    }

    if (quotaAdjustMode.value === 'increase') {
      const required = amount * 100
      const available = agentDisposableQuotaBalance.value
      if (required > available) {
        showFailToast(t('UIClub_Text5'))
        return
      }
    }

    submittingFund.value = true
    try {
      await submitQuotaUpdate({
        field: quotaEditField.value,
        amount,
        adjustMode: quotaAdjustMode.value,
      })

      const delta = quotaAdjustMode.value === 'increase' ? amount * 100 : -amount * 100
      if (quotaEditField.value === 'disposable') {
        disposableQuota.value = Math.max(0, disposableQuota.value + delta)
        member.disposableCredit = disposableQuota.value
        const nextAgentCredit = Math.max(0, agentDisposableQuotaBalance.value - delta)
        userInfoStore.syncCurrentClubFields({ user_credit: nextAgentCredit })
      } else {
        reviewQuota.value = reviewQuota.value + delta
        member.reviewCredit = reviewQuota.value
        member.disposableCredit += delta
        const nextAgentCredit = Math.max(0, agentDisposableQuotaBalance.value - delta)
        userInfoStore.syncCurrentClubFields({ user_credit: nextAgentCredit })
      }

      patchMemberOnList({ ...member })
      quotaInput.value = ''
      quotaEditField.value = null
      showSuccessToast(t('UIClub_Success'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('UIClub_Fail2')
      showFailToast(message)
    } finally {
      submittingFund.value = false
    }
    return
  }

  const amount = Number.parseInt(fundAmountInput.value, 10)
  if (Number.isNaN(amount) || amount <= 0) {
    showFailToast(t('UIClub_PleaseOf2'))
    return
  }

  if (fundAssetTab.value === 'coin' && amount * 100 > agentCoinBalance.value) {
    showFailToast(t('UIClub_UnionCoin'))
    return
  }

  if (fundAssetTab.value === 'diamond' && amount > agentDiamondBalance.value) {
    showFailToast(t('UIClub_Text6'))
    return
  }

  submittingFund.value = true
  try {
    let response: { code?: number; msg?: string } = {}

    if (fundAssetTab.value === 'diamond') {
      response = await postUserAgencySendDiamondsApi(
        {
          user_id: member.id,
          amount,
        },
        userInfoStore.currentClub?.club_id,
      )
    } else {
      response = await postUserAgencyGoldGrantApi(
        {
          user_id: member.id,
          amount: amount * 100,
          op_type: 1,
        },
        userInfoStore.currentClub?.club_id,
      )
    }

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : t('UIClub_GiveFail'))
    }

    if (fundAssetTab.value === 'diamond') {
      member.diamond += amount
      const nextDiamond = Math.max(0, agentDiamondBalance.value - amount)
      userInfoStore.syncCurrentClubFields({ diamonds: nextDiamond })
    } else {
      member.uc += amount * 100
      const nextCoin = Math.max(0, agentCoinBalance.value - amount * 100)
      userInfoStore.syncCurrentClubFields({ user_gold: nextCoin })
    }

    patchMemberOnList({ ...member })
    showSuccessToast(t('UIClub_SendPropsSucceed'))
    closeFundSheet()
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_GiveFail')
    showFailToast(message)
  } finally {
    submittingFund.value = false
  }
}

async function onSaveQrCode() {
  if (!invitationLink.value) {
    showFailToast(t('UIClub_Text7'))
    return
  }

  try {
    await saveQrCodeImage(invitationLink.value, {
      fileName: `club-invite-${userInfoStore.currentClub?.random_id || Date.now()}.png`,
    })
    showSuccessToast(t('UIClub_CodeDoneSave'))
  } catch (error) {
    console.error('onSaveQrCode error', error)
    showFailToast(error instanceof Error ? error.message : t('UIClub_SaveCodeFail'))
  }
}

onMounted(async () => {
  await Promise.all([loadMembers(), loadInvitationLink()])
})
</script>

<template>
  <div class="page-shell downline-page downline-desktop-page" :style="backgroundStyle">
    <HeaderBack :title="t('UIGuild_MemberDetails_VipOffLine')" />

    <div v-loading="loading" class="content">
      <div class="invite-row">
        <div class="invite-title-wrap">
          <span>{{ t('UIClub_InviteLink') }}</span>
          <VanPopover
            trigger="click"
            placement="bottom-start"
            :theme="isDark ? 'dark' : 'light'"
          >
            <template #reference>
              <button
                type="button"
                class="invite-info-trigger"
                :aria-label="t('UIClub_DownlineInviteLinkTip')"
              >
                <img :src="imgInfo" alt="" aria-hidden="true" />
              </button>
            </template>
            <div class="invite-info-content">{{ t('UIClub_DownlineInviteLinkTip') }}</div>
          </VanPopover>
        </div>
        <button type="button" class="qr-btn" @click="onSaveQrCode">{{ t('UIMine_PromotersBecome_rTPhmznj') }}</button>
      </div>

      <p class="invite-link" :title="invitationLink">{{ invitationPreview }}</p>

      <div class="search-box">
        <img class="search-icon" :src="imgSearch" alt="" aria-hidden="true" />
        <input
          v-model="keyword"
          type="text"
          class="search-input"
          :placeholder="t('UIClub_Player')"
          @keyup.enter="onSearch"
        />
      </div>

      <div class="total-row">
        <span class="total-title">{{ t('UIClub_Member') }}</span>
        <span class="total-value">{{ totalText }}</span>
      </div>

      <div class="members-wrap">
        <div v-for="member in members" :key="member.id" class="member-card">
          <div class="member-head">
            <img class="member-avatar" :src="member.avatar" :alt="(member.name) + t('UIMine_UserInfoSetting_btn_head')" />
            <div class="member-head-main">
              <p class="member-name">{{ member.name }}</p>
              <div class="member-id-row">
                <span class="member-id-tag">ID</span>
                <span class="member-id">{{ member.uid }}</span>
              </div>
            </div>
          </div>

          <div class="member-assets" @click="openFundSheet(member)">
            <p class="asset-item">
              <img :src="imgChips" alt="uc" />
              <span class="asset-label">UC</span>
              <strong class="asset-value">{{ formatUC(member.uc) }}</strong>
            </p>
            <p class="asset-item">
              <img :src="imgBalance" alt="credit" />
              <span class="asset-label">{{ t('UIClubTalbe_CreditAmount') }}</span>
              <strong class="asset-value">
                {{ formatUC(member.disposableCredit) }}/{{ formatUC(member.reviewCredit) }}
              </strong>
            </p>
            <p class="asset-item">
              <img :src="imgDiamond" alt="diamond" />
              <span class="asset-label">{{ t('UIMine_VIP_diamond') }}</span>
              <strong class="asset-value">{{ member.diamond }}</strong>
            </p>
          </div>
        </div>

        <div v-if="!members.length && !loading" class="empty-box">{{ t('UIClub_NoDownli') }}</div>
      </div>

      <div v-if="showFundSheet" class="fund-sheet-mask" @click="closeFundSheet"></div>

      <section v-if="showFundSheet && activeMember" class="fund-sheet" @click.stop>
        <div class="fund-tabs" role="tablist" :aria-label="t('UIClub_Fund')">
          <button
            v-if="shouldShowCoinFundTab"
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'coin' }"
            @click="switchFundAsset('coin')"
          >
            {{ t('UIClubCreditLimit1') }}
          </button>
          <button
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'quota' }"
            @click="switchFundAsset('quota')"
          >
            {{ t('UIClubTalbe_CreditAmount') }}
          </button>
          <button
            type="button"
            class="fund-tab"
            :class="{ 'fund-tab--active': fundAssetTab === 'diamond' }"
            @click="switchFundAsset('diamond')"
          >
            {{ t('UIMine_VIP_diamond') }}
          </button>
        </div>

        <div v-if="fundAssetTab === 'quota'" class="quota-body">
          <div class="sheet-row sheet-row--top">
            <p class="sheet-label">{{ t('user_name') }}</p>
            <p class="sheet-username">
              <span>{{ activeMember.name }}</span>
              <span class="sheet-id-tag">ID</span>
              <span>{{ activeMember.uid }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <div class="quota-group-label">
              <p>{{ t('OpCodeString_CREDITBRINGOUT') }}</p>
              <p>{{ formatUC(disposableQuota) }}</p>
            </div>
            <div class="quota-actions">
              <button
                type="button"
                class="quota-action quota-action--primary"
                @click="editQuota('disposable')"
              >
                {{ t('UIClub_FundDetail_5iSXE2Uj') }}
              </button>
            </div>
          </div>

          <section v-if="quotaEditField === 'disposable'" class="quota-editor">
            <div class="quota-mode-row">
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'increase' }"
                @click="quotaAdjustMode = 'increase'"
              >
                {{ t('UICredit_AddAmount') }}
              </button>
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'decrease' }"
                @click="quotaAdjustMode = 'decrease'"
              >
                {{ t('UICredit_SubAmount') }}
              </button>
            </div>
            <div class="quota-input-pill">{{ currentInputText }}</div>
          </section>

          <div class="sheet-row">
            <div class="quota-group-label">
              <p>{{ t('OpCodeString_CREDITGRANT') }}</p>
              <p>{{ formatUC(reviewQuota) }}</p>
            </div>
            <div class="quota-actions">
              <button
                type="button"
                class="quota-action quota-action--primary"
                @click="editQuota('review')"
              >
                {{ t('UIClub_FundDetail_5iSXE2Uj') }}
              </button>
            </div>
          </div>

          <section v-if="quotaEditField === 'review'" class="quota-editor">
            <div class="quota-mode-row">
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'increase' }"
                @click="quotaAdjustMode = 'increase'"
              >
                {{ t('UICredit_AddAmount') }}
              </button>
              <button
                type="button"
                class="quota-mode"
                :class="{ 'quota-mode--active': quotaAdjustMode === 'decrease' }"
                @click="quotaAdjustMode = 'decrease'"
              >
                {{ t('UICredit_SubAmount') }}
              </button>
            </div>
            <div class="quota-input-pill">{{ currentInputText }}</div>
          </section>
        </div>

        <div v-else class="sheet-meta">
          <div class="sheet-row sheet-row--top">
            <p class="sheet-label">{{ t('user_name') }}</p>
            <p class="sheet-username">
              <span>{{ activeMember.name }}</span>
              <span class="sheet-id-tag">ID</span>
              <span>{{ activeMember.uid }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <p class="sheet-label">{{ t('UIClub_CreateRoom31') }}</p>
            <p class="sheet-balance">
              <img
                :src="fundAssetTab === 'diamond' ? imgDiamond : imgChips"
                alt=""
                aria-hidden="true"
              />
              <span>{{ currentFundBalanceText }}</span>
            </p>
          </div>

          <div class="sheet-row">
            <p class="sheet-label">{{ t('UIClub_SendItem_number') }}</p>
            <p class="sheet-balance">
              <img
                :src="fundAssetTab === 'diamond' ? imgDiamond : imgChips"
                alt=""
                aria-hidden="true"
              />
              <span :class="{ 'sheet-placeholder': !fundAmountInput }">{{ currentInputText }}</span>
            </p>
          </div>
        </div>

        <FundKeypad @press="onKeypadPress" />

        <div class="sheet-footer-actions">
          <button type="button" class="sheet-footer-btn" @click="closeFundSheet">{{ t('adaptation10013') }}</button>
          <button
            type="button"
            class="sheet-footer-btn sheet-footer-btn--confirm"
            @click="onFundConfirm"
          >
            {{ t('UIClub_FundDetail_5iSXE2Uj') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.downline-page {
  position: relative;
  height: 100dvh;
  background-size: cover;
  color: #fff;
  background-image: var(--downline-bg-dark);

  @include theme-light {
    color: #111;
    background-image: var(--downline-bg-light);
  }
}

.page-backdrop {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.content {
  position: relative;
  z-index: 1;
  padding: 0.1733rem 0.48rem calc(0.48rem + env(safe-area-inset-bottom));
}

.invite-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.04rem;
  font-size: 0.4052rem;
}

.invite-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}

.invite-info-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.42rem;
  height: 0.42rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.invite-info-trigger img {
  width: 0.36rem;
  height: 0.36rem;
  object-fit: contain;
}

.invite-info-content {
  max-width: 6.4rem;
  padding: 0.2rem 0.24rem;
  font-size: 0.28rem;
  line-height: 1.45;
  white-space: normal;
  word-break: break-word;
}

.qr-btn {
  border: 0;
  min-width: 2.1333rem;
  height: 0.6667rem;
  border-radius: 1rem;
  padding: 0 0.2933rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.8);
  color: #fff;
  font-size: 0.32rem;
  background: linear-gradient(159deg, #05e7ae 8%, #027a5c 72%);

  @include theme-light {
    border-color: transparent;
    background: var(--c-brand);
  }
}

.invite-link {
  margin: 0.1067rem 0 0.24rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.2667rem;
  line-height: 1.35;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

  @include theme-light {
    color: rgba(17, 17, 17, 0.58);
  }
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.2297rem;
  height: 1.0683rem;
  padding: 0 0.2133rem 0 0.4533rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);

  @include theme-light {
    background: #dadada;
  }
}

.search-icon {
  width: 0.5856rem;
  height: 0.5741rem;
  object-fit: contain;
}

.search-input {
  flex: 1;
  height: 100%;
  border: 0;
  outline: none;
  border-radius: 9999px;
  padding: 0;
  background: transparent;
  color: #fff;
  font-size: 0.4134rem;
  line-height: 1.4;

  @include theme-light {
    color: #111;
  }
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.88);

  @include theme-light {
    color: rgba(17, 17, 17, 0.72);
  }
}

.total-row {
  margin-top: 0.24rem;
  display: flex;
  align-items: baseline;
  gap: 0.1869rem;
}

.total-title {
  color: #fff;
  font-size: 0.3799rem;
  line-height: 1.2;
  font-weight: 700;

  @include theme-light {
    color: #111;
  }
}

.total-value {
  color: #fff;
  font-size: 0.4267rem;
  line-height: 1.2;
  font-weight: 500;

  @include theme-light {
    color: #111;
  }
}

.members-wrap {
  margin-top: 0.2667rem;
  display: flex;
  flex-direction: column;
  gap: 0.2667rem;
  padding-bottom: calc(0.42rem + env(safe-area-inset-bottom));
}

.member-card {
  border-radius: 1.0557rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);
  padding: 0.24rem 0.36rem;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;

  @include theme-light {
    background: #fff;
    box-shadow: 0 0.04rem rgba(0, 0, 0, 0.04);
  }
}

.member-head {
  display: flex;
  align-items: center;
  gap: 0.24rem;
}

.member-avatar {
  width: 1.0375rem;
  height: 1.0424rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.member-head-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.18rem;
}

.member-name {
  margin: 0;
  font-size: 0.3052rem;
  line-height: 1;
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-id-row {
  display: inline-flex;
  align-items: center;
  gap: 0.0655rem;
  margin: 0;
}

.member-id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.4637rem;
  height: 0.2676rem;
  padding: 0 0.0535rem;
  border-radius: 0.1123rem;
  background: rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: 0.216rem;
  line-height: 1;

  @include theme-light {
    background: rgba(79, 79, 79, 0.4);
  }
}

.member-id {
  font-size: 0.2566rem;
  color: rgba(255, 255, 255, 0.94);
  line-height: 1;

  @include theme-light {
    color: rgba(17, 17, 17, 0.88);
  }
}

.member-assets {
  border-radius: 1.44rem;
  background: linear-gradient(
      112deg,
      rgba(160, 40, 76, 0.58) 1%,
      rgba(86, 87, 128, 0.28) 42%,
      rgba(10, 96, 139, 0.62) 100%
    ),
    rgba(34, 34, 34, 0.66);
  backdrop-filter: blur(0.8rem);
  padding: 0.16rem 0.32rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.18rem;
  min-height: 0.9rem;
  cursor: pointer;

  @include theme-light {
    background: rgba(208, 208, 208, 0.66);
  }
}

.asset-item {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.0533rem;
  justify-content: center;
  min-width: 0;
  color: #f3f6ff;
  font-size: 0.24rem;

  @include theme-light {
    color: #111;
  }
}

.asset-item img {
  width: 0.32rem;
  height: 0.32rem;
  object-fit: contain;
  flex-shrink: 0;
}

.asset-label {
  display: inline-flex;
  align-items: center;
  opacity: 0.72;
  font-size: 0.235rem;
  line-height: 1;
  flex: 0 0 auto;
}

.asset-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
  font-size: 0.248rem;
  line-height: 1;
  font-weight: 600;

  @include theme-light {
    color: #111;
  }
}

.empty-box {
  border-radius: 0.7229rem;
  background: rgba(0, 0, 0, 0.26);
  padding: 0.5333rem 0.32rem;
  text-align: center;
  font-size: 0.3467rem;
  color: rgba(255, 255, 255, 0.72);

  @include theme-light {
    color: rgba(17, 17, 17, 0.6);
    background: #fff;
  }
}

.fund-sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(12, 12, 12, 0.6);
  z-index: 40;
}

.fund-sheet {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(100%, 10rem);
  border-radius: 0.84459rem 0.84459rem 0 0;
  padding: 0.64257rem 0.53209rem calc(0.5472rem + env(safe-area-inset-bottom));
  background: linear-gradient(
    90deg,
    rgba(0, 8, 20, 0.95) 0%,
    rgba(5, 5, 5, 0.95) 52%,
    rgba(0, 8, 20, 0.95) 100%
  );
  box-shadow: 0 -0.16rem 0.53rem rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 0.43373rem;
  z-index: 41;
}

.fund-tabs {
  display: flex;
  justify-content: center;
  gap: 1.28514rem;
}

.fund-tab {
  border: 0;
  background: transparent;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.37951rem;
  padding: 0;
  line-height: 0.95;
}

.fund-tab--active {
  color: #f9f9f9;
  border-bottom: 0.034rem solid #f9f9f9;
}

.sheet-meta,
.quota-body {
  display: flex;
  flex-direction: column;
  gap: 0.337rem;
}

.sheet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
}

.sheet-row--top {
  margin-top: 0.05rem;
}

.sheet-label {
  margin: 0;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.432rem;
}

.sheet-username,
.sheet-balance {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  color: #f9f9f9;
  font-size: 0.434rem;
  font-weight: 500;
}

.sheet-id-tag {
  min-width: 0.72rem;
  height: 0.56rem;
  border-radius: 0.204rem;
  padding: 0 0.238rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
  font-size: 0.393rem;
}

.sheet-balance img {
  width: 0.533rem;
  height: 0.533rem;
  object-fit: contain;
}

.sheet-placeholder {
  color: rgba(249, 249, 249, 0.85);
}

.quota-group-label {
  margin: 0;
  color: rgba(249, 249, 249, 0.7);
  font-size: 0.432rem;
  line-height: 1.35;
}

.quota-group-label p {
  margin: 0;
}

.quota-actions {
  display: inline-flex;
  gap: 0.225rem;
}

.quota-action {
  min-width: 1.895rem;
  height: 0.851rem;
  border: 0;
  border-radius: 4.016rem;
  padding: 0 0.422rem;
  background: rgba(6, 6, 6, 0.45);
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.322rem;
}

.quota-action--primary {
  background: rgba(var(--c-brand-rgb), 0.4);
  color: #fff;
}

.quota-editor {
  border-radius: 0.44053rem;
  padding: 0.56rem;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.33467rem;
}

.quota-mode-row {
  display: flex;
  align-items: center;
  gap: 0.26667rem;
}

.quota-mode {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.317rem;
  display: inline-flex;
  align-items: center;
  gap: 0.079rem;
}

.quota-mode::before {
  content: '';
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  border: 0.03rem solid rgba(255, 255, 255, 0.5);
  box-sizing: border-box;
}

.quota-mode--active {
  color: #fff;
}

.quota-mode--active::before {
  border-color: rgba(95, 247, 209, 0.92);
  box-shadow: inset 0 0 0 0.1rem rgba(95, 247, 209, 0.85);

  @include theme-light {
    border-color: var(--c-brand);
    box-shadow: inset 0 0 0 0.1rem var(--c-brand);
  }
}

.quota-input-pill {
  min-height: 0.88rem;
  border-radius: 0.68472rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.24rem 0.34667rem;
  display: flex;
  align-items: center;
  color: rgba(249, 249, 249, 0.95);
  font-size: 0.325rem;
}

.sheet-footer-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25291rem;
}

.sheet-footer-btn {
  min-height: 1.4372rem;
  border: 0;
  border-radius: 1.05761rem;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 0.4rem;
}

.sheet-footer-btn--confirm {
  border: 0.013rem solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(156deg, #05e7ae 8%, #027a5c 72%);

  @include theme-light {
    border-color: transparent;
    background: var(--c-brand);
  }
}

@media (max-width: 360px) {
  .content {
    padding-left: 0.32rem;
    padding-right: 0.32rem;
  }

  .asset-item {
    font-size: 0.22rem;
  }
}
</style>

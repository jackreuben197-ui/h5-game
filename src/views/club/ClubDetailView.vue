<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  postOrgClubSearchByIdApi,
  postOrgChangeClubDataApi,
  postOrgClubDisbandApi,
  postOrgClubCloneApplyApi,
  postOrgJoinTripApi,
  postOrgTribeInfoByClubApi,
  postOrgClubApplyTribeListApi,
  postOrgClubCancleJoinTribeApi,
  postOrgMemberListApi,
  postOrgClubUserInfoApi,
} from '@/api/org'
import type {
  OrgChangeClubDataRequest,
  OrgClubData,
  OrgClubSearchByIdResponseData,
} from '@/api/models/org'
import imgClubCover from '@/assets/images/default_avatar.png'
import imgBalance from '@/assets/icons/icon_credit_chip.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgQuickSafety from '@/assets/images/club_quick_activity.png'
import imgQuickRanking from '@/assets/images/club_quick_room_history.png'
import imgQuickFund from '@/assets/images/club_quick_fund.png'
import imgInviteCover from '@/assets/images/club_invite_cover.png'
import imgSearch from '@/assets/icons/club_search.svg'
import imgModalClose from '@/assets/icons/modal_close.svg'
import ImageUploadSheet from '@/components/ImageUploadSheet/ImageUploadSheet.vue'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import {
  buildChannelAgentInviteUrl,
  buildChannelClubInviteUrl,
  buildChannelRegisterUrl,
  isChannelPackageHost,
} from '@/utils/channelPackage'
import { generateQrCodeUrl } from '@/utils/qrcode'
import { formatUC } from '@/utils/roomVisibility'
import { showFailToast, showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import mainBgLightUrl from '@/assets/images/main_bg_light.png'
import { t } from '@/i18n'
import { useInviteShareExport } from '@/composables/useInviteShareExport'
import { postOssUploadImageApi } from '@/api/oss'
import { isTelegramMiniAppEnv } from '@/utils/environment'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  '--club-detail-bg-dark': `url(${mainBgUrl})`,
  '--club-detail-bg-light': `url(${mainBgLightUrl})`,
}))

interface QuickActionItem {
  id: number
  title: string
  cover: string
}

type SettingItemKind = 'text' | 'arrow' | 'switch' | 'level' | 'founder' | 'copy' | 'tribe'

interface SettingItem {
  id: number
  label: string
  kind: SettingItemKind
  value?: string
  switchKey?: 'allowSearch' | 'joinWithoutApproval'
}

const router = useRouter()
const userInfoStore = useUserInfoStore()

const imgInviteQr = ref('')
const agentInviteCode = ref('')
const agentShareNickname = ref('')
const agentShareRandomId = ref('')

const loading = ref(false)
const clubDetail = ref<OrgClubSearchByIdResponseData | null>(null)
const authoritativeMemberTotal = ref<number | null>(null)

// 用户等级：0 普通，1 会长，2 副会长，3 管理员，4 代理。
const userLevel = computed(() =>
  Number(clubDetail.value?.user_level ?? userInfoStore.currentClub?.user_level ?? 0),
)
const isFounder = computed(() => userLevel.value === 1)
const isVicePresident = computed(() => userLevel.value === 2)
const isAdmin = computed(() => userLevel.value === 3)
const isAgent = computed(() => userLevel.value === 4)
const canManageClub = computed(() => isFounder.value || isVicePresident.value || isAdmin.value)

const displayClub = computed(() => clubDetail.value ?? userInfoStore.currentClub)
const clubMemberCount = computed(
  () => authoritativeMemberTotal.value ?? toSafeNumber(displayClub.value?.club_members),
)
const cachedClub = computed(() => userInfoStore.currentClub)
const currentClubGold = computed(() => Number(cachedClub.value?.user_gold ?? 0))
const currentClubCredit = computed(() => Number(cachedClub.value?.user_credit ?? 0))
const isChannelPackage = isChannelPackageHost()

const quickActions = computed<QuickActionItem[]>(() => {
  if (canManageClub.value) {
    return [
      { id: 1, title: t('UIClub_Info_Activity'), cover: imgQuickSafety },
      { id: 2, title: t('UIClubTable_TableRecords'), cover: imgQuickRanking },
      { id: 3, title: t('UIClub_Info_Fue61o7s'), cover: imgQuickFund },
    ]
  }

  return []
})

const settings = computed<SettingItem[]>(() => {
  const list: SettingItem[] = [
    {
      id: 1,
      label: t('UIGuid_Founder'),
      kind: 'founder',
      value: displayClub.value?.club_creator_nickname || '--',
    },
    { id: 2, label: t('UIClub_Invite'), kind: 'arrow' },
    {
      id: 3,
      label: t('UIClub_Info_rUC1C7lI'),
      kind: 'tribe',
      value: displayClub.value?.tribe_name || '--',
    },
  ]

  if (isFounder.value) {
    list.push(
      {
        id: 4,
        label: t('UIGuild_Level'),
        kind: 'level',
        value: `LV. ${displayClub.value?.level || 0}`,
      },
      { id: 5, label: t('UIClub_AllowOthersSearchClub'), kind: 'switch', switchKey: 'allowSearch' },
      { id: 6, label: t('UIGuild_Approve'), kind: 'switch', switchKey: 'joinWithoutApproval' },
    )
  }

  list.push({
    id: 7,
    label: t('UIClub_CreateTime'),
    kind: 'text',
    value: formatDate(displayClub.value?.create_time),
  })

  if (canManageClub.value) {
    list.push({ id: 8, label: t('UIClubCopy'), kind: 'copy' })
  }

  if (isAgent.value) {
    list.push({ id: 9, label: t('UIGuild_MemberDetails_VipOffLine'), kind: 'arrow' })
  }

  return list
})

const allowSearch = ref(true)
const joinWithoutApproval = ref(false)
const showInvitePopup = ref(false)
const showCopyPopup = ref(false)
const showTribeSearchPopup = ref(false)
const showTribeApplyPopup = ref(false)
const showCancelTribeApplyPopup = ref(false)
const showDeleteClubPopup = ref(false)
const savingClubLogo = ref(false)
const tribeApplySubmitting = ref(false)
const tribeApplyStatusLoading = ref(false)
const cancelTribeApplyLoading = ref(false)
const deletingClub = ref(false)
const tribeApplyId = ref<number | null>(null)
const tribeApplying = ref(false)
const tribeApplyIdInput = ref('')
const tribeApplyContactInput = ref('')
const tribeIdKeypadOpen = ref(false)
const searchedTribe = ref<{ randomId: number; name: string; logo: string } | null>(null)
const clubAvatarUrl = ref('')
const inviteModalRef = ref<HTMLElement | null>(null)
const inviteShareImage = ref('')
const savingInviteShare = ref(false)
let inviteShareGenerationId = 0
let telegramInviteShareUrl = ''
let inviteLongPressTimer: number | null = null
let inviteTouchStart: { x: number; y: number } | null = null
const { exporting: generatingInviteShare, generateImage: generateInviteShare } =
  useInviteShareExport({
    target: inviteModalRef,
    onError: (error) => {
      console.error('generateInviteShare error', error)
      showFailToast(t('UIClub_SaveFail2'))
    },
  })

const clubName = computed(() => displayClub.value?.club_name || t('UIClub_Creat_2LvGNmS7'))
const clubAlias = computed(() => displayClub.value?.tribe_name || 'XXXX')
const clubId = computed(() => String(displayClub.value?.random_id || '--'))
const shareAgentNickname = computed(() =>
  String(agentShareNickname.value || userInfoStore.userInfo?.user?.nickname || '--'),
)
const shareAgentId = computed(() =>
  String(agentShareRandomId.value || userInfoStore.userInfo?.user?.un_id || '--'),
)
const tribeName = computed(() => String(displayClub.value?.tribe_name || '').trim())
const hasTribe = computed(() => tribeName.value.length > 0)

function formatDate(value?: string): string {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function getCurrentClubId(): number {
  return Number(displayClub.value?.club_id || 0)
}

function resetTribeApplyForm(): void {
  tribeApplyIdInput.value = ''
  tribeApplyContactInput.value = ''
  searchedTribe.value = null
  tribeIdKeypadOpen.value = false
}

function closeTribeSearchPopup(): void {
  showTribeSearchPopup.value = false
  tribeIdKeypadOpen.value = false
}

watch(showTribeSearchPopup, (visible) => {
  if (!visible) {
    tribeIdKeypadOpen.value = false
  }
})

function closeTribeApplyPopup(): void {
  showTribeApplyPopup.value = false
}

function closeCancelTribeApplyPopup(): void {
  showCancelTribeApplyPopup.value = false
}

function closeDeleteClubPopup(): void {
  if (deletingClub.value) {
    return
  }
  showDeleteClubPopup.value = false
}

function openTribeIdKeypad(): void {
  tribeIdKeypadOpen.value = true
}

function onTribeIdKeypadClose(): void {
  tribeIdKeypadOpen.value = false
}

function onTribeIdKeypadSubmit(): void {
  tribeIdKeypadOpen.value = false
}

function onTribeIdKeypadKeyPress(payload: {
  key: string
  action: 'digit' | 'clear' | 'backspace' | 'decimal'
  value: string
  accepted: boolean
}): void {
  if (!payload.accepted && payload.action === 'digit') {
    return
  }
  tribeApplyIdInput.value = payload.value.replace(/\D+/g, '').slice(0, 10)
}

function onTribeContactInput(event: Event): void {
  const target = event.target as HTMLInputElement | null
  tribeApplyContactInput.value = (target?.value || '').slice(0, 40)
}

async function fetchClubTribeApplyStatus(): Promise<void> {
  if (!isFounder.value) {
    return
  }
  if (hasTribe.value) {
    tribeApplying.value = false
    tribeApplyId.value = null
    return
  }

  const clubId = getCurrentClubId()
  if (!clubId) {
    tribeApplying.value = false
    tribeApplyId.value = null
    return
  }

  tribeApplyStatusLoading.value = true
  try {
    const response = await postOrgClubApplyTribeListApi({
      club_id: clubId,
      limit: 1,
      offset: 0,
    })

    if (Number(response.code) !== 0) {
      tribeApplying.value = false
      tribeApplyId.value = null
      return
    }

    const list = Array.isArray(response.data?.list) ? response.data.list : []
    const first = list[0] as Record<string, unknown> | undefined
    const applyId = toSafeNumber(first?.apply_id ?? first?.id)
    tribeApplying.value = list.length > 0 && applyId > 0
    tribeApplyId.value = applyId > 0 ? applyId : null
  } catch (error) {
    console.error('fetchClubTribeApplyStatus error', error)
    tribeApplying.value = false
    tribeApplyId.value = null
  } finally {
    tribeApplyStatusLoading.value = false
  }
}

function openTribeApplyPopup(): void {
  resetTribeApplyForm()
  showTribeSearchPopup.value = true
}

function onTribeAction(): void {
  if (!isFounder.value) {
    return
  }
  if (hasTribe.value) {
    return
  }

  if (tribeApplying.value) {
    showCancelTribeApplyPopup.value = true
    return
  }

  openTribeApplyPopup()
}

async function submitTribeApply(): Promise<void> {
  if (tribeApplySubmitting.value) {
    return
  }

  const clubId = getCurrentClubId()
  if (!clubId) {
    showFailToast(t('UIClub_ClubInfoError'))
    return
  }

  const tribeRandomId = Number(tribeApplyIdInput.value)
  if (!Number.isFinite(tribeRandomId) || tribeRandomId <= 0) {
    showFailToast(t('UIClub_PleaseUnion') + 'ID')
    return
  }

  tribeApplySubmitting.value = true
  try {
    const response = await postOrgTribeInfoByClubApi({
      club_id: clubId,
      tribe_random_id: tribeRandomId,
    })

    const tribeBase = response.data?.tribe_base
    const foundRandomId = Number(tribeBase?.random_id || 0)
    const foundName = String(tribeBase?.name || '').trim()
    if (Number(response.code) !== 0 || !foundRandomId || !foundName) {
      showFailToast(t('UIClub_NotFoundUnion'))
      return
    }

    const relation = Number(response.data?.club_relation || 1)
    if (relation === 2) {
      showFailToast(t('UIClub_CurrentClubDoneApplyUnion'))
      await fetchClubTribeApplyStatus()
      closeTribeSearchPopup()
      return
    }

    if (relation === 3) {
      showFailToast(t('UIClub_CurrentClubDoneJoinUnion'))
      closeTribeSearchPopup()
      return
    }

    searchedTribe.value = {
      randomId: foundRandomId,
      name: foundName,
      logo: String(tribeBase?.logo || '').trim(),
    }
    closeTribeSearchPopup()
    showTribeApplyPopup.value = true
  } catch (error) {
    console.error('submitTribeApply search tribe error', error)
    showFailToast(t('UIClub_NotFoundUnion'))
  } finally {
    tribeApplySubmitting.value = false
  }
}

async function confirmTribeApply(): Promise<void> {
  if (tribeApplySubmitting.value) {
    return
  }

  const clubId = getCurrentClubId()
  if (!clubId) {
    showFailToast(t('UIClub_ClubInfoError'))
    return
  }

  const tribeRandomId = Number(searchedTribe.value?.randomId || 0)
  if (!Number.isFinite(tribeRandomId) || tribeRandomId <= 0) {
    showFailToast(t('UIClub_UnionInfoError'))
    return
  }

  const contact = tribeApplyContactInput.value.trim()
  if (!contact) {
    showFailToast(t('UIClub_Please'))
    return
  }

  tribeApplySubmitting.value = true
  try {
    const response = await postOrgJoinTripApi({
      club_id: clubId,
      tribe_random_id: tribeRandomId,
      contact,
    })

    if (Number(response.code) !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : t('UIClub_ApplyJoinFail'))
    }

    const successMessage = (response.msg ?? response.message) as unknown
    showSuccessToast(
      typeof successMessage === 'string' ? successMessage : t('UIClub_ApplyDoneSubmit'),
    )
    closeTribeApplyPopup()
    resetTribeApplyForm()
    await fetchClubTribeApplyStatus()
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_ApplyJoinFail')
    showFailToast(message)
  } finally {
    tribeApplySubmitting.value = false
  }
}

async function cancelTribeApply(): Promise<void> {
  if (cancelTribeApplyLoading.value) {
    return
  }

  const applyId = Number(tribeApplyId.value)
  if (!Number.isFinite(applyId) || applyId <= 0) {
    showFailToast(t('UIClub_NotFoundCanCancelOfApply'))
    return
  }

  cancelTribeApplyLoading.value = true
  try {
    const response = await postOrgClubCancleJoinTribeApi({ apply_id: applyId })
    if (Number(response.code) !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : t('UIClub_CancelApplyFail'))
    }

    const successMessage = (response.msg ?? response.message) as unknown
    showSuccessToast(
      typeof successMessage === 'string' ? successMessage : t('UIClub_DoneCancelApply'),
    )
    closeCancelTribeApplyPopup()
    await fetchClubTribeApplyStatus()
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_CancelApplyFail')
    showFailToast(message)
  } finally {
    cancelTribeApplyLoading.value = false
  }
}

function updateSwitchesByClubData(data: OrgClubData | null): void {
  allowSearch.value = Number(data?.search_switch ?? 0) === 1
  joinWithoutApproval.value = Number(data?.auto_audit_switch ?? 0) === 1
}

function syncCurrentClubFields(fields: Partial<OrgClubData>): void {
  if (displayClub.value) {
    clubDetail.value = {
      ...displayClub.value,
      ...fields,
    }
  }

  userInfoStore.syncCurrentClubFields(fields)

  if (typeof fields.logo === 'string') {
    clubAvatarUrl.value = fields.logo
  }
}

async function fetchClubMemberTotal(): Promise<void> {
  const currentClub = displayClub.value
  if (!currentClub?.club_id && !currentClub?.random_id) {
    return
  }

  try {
    const response = await postOrgMemberListApi({
      club_id: currentClub.club_id,
      club_random_id: currentClub.random_id,
      search: '',
      sort_type: 8,
      order_type: 2,
      gold_type: 1,
      simple: false,
      hide_slave: true,
      limit: 1,
      offset: 0,
    })
    const total = Number(response.data?.total)
    if (response.code === 0 && Number.isFinite(total) && total >= 0) {
      authoritativeMemberTotal.value = total
      syncCurrentClubFields({ club_members: total })
    }
  } catch (error) {
    // 人数接口失败时继续使用俱乐部详情中的缓存值，不影响详情页加载。
    console.error('fetchClubMemberTotal error', error)
  }
}

async function submitClubDataPatch(payload: Partial<OrgChangeClubDataRequest>): Promise<void> {
  if (!isFounder.value) {
    throw new Error(t('UIClub_FounderCan'))
  }

  const clubId = Number(displayClub.value?.club_id)
  if (!clubId) {
    throw new Error(t('UIClub_ClubInfoError'))
  }

  const response = await postOrgChangeClubDataApi({
    club_id: clubId,
    ...payload,
  })

  if (response.code !== 0) {
    const fallback = (response.msg ?? response.message) as unknown
    throw new Error(typeof fallback === 'string' ? fallback : t('UIClub_UpdateFail'))
  }

  syncCurrentClubFields(payload as Partial<OrgClubData>)
}

async function refreshClubDetail(): Promise<void> {
  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id) {
    showFailToast(t('UIClub_NotFoundClub'))
    void router.replace('/club/list')
    return
  }
  clubDetail.value = currentClub
  clubAvatarUrl.value = currentClub.logo || ''
  updateSwitchesByClubData(currentClub)
  await Promise.all([fetchClubTribeApplyStatus(), fetchClubMemberTotal()])

  loading.value = true
  try {
    const response = await postOrgClubSearchByIdApi({
      club_random_id: currentClub.random_id,
    })

    if (response.code !== 0 || !response.data) {
      showFailToast(response.msg || t('UIClub_FetchClubDetailFail'))
      return
    }

    clubDetail.value = response.data
    userInfoStore.setCurrentClub(response.data)
    // setCurrentClub 只切换 currentClubId，不会把详情接口的新字段写回 clubList。
    // 显式同步后，基金页读取到的 upper_limit 才会与详情页一致。
    syncCurrentClubFields(response.data)
    if (authoritativeMemberTotal.value !== null) {
      syncCurrentClubFields({ club_members: authoritativeMemberTotal.value })
    }
    clubAvatarUrl.value = response.data.logo || ''
    updateSwitchesByClubData(response.data)
    await fetchClubTribeApplyStatus()
  } catch (error) {
    console.error('refreshClubDetail error', error)
    showFailToast(t('UIClub_FetchClubDetailFail'))
  } finally {
    loading.value = false
  }
}

function goEditDescription(): void {
  if (!isFounder.value) {
    showFailToast(t('UIClub_FounderCan'))
    return
  }

  void router.push('/club/edit-description')
}

function goEditName(): void {
  if (!isFounder.value) {
    showFailToast(t('UIClub_FounderCan'))
    return
  }

  void router.push('/club/edit-name')
}

function onQuickAction(actionId: number): void {
  if (actionId === 1) {
    showFailToast(t('UIClub_InDeve'))
    return
  }

  if (actionId === 2) {
    void router.push('/club/room/history')
    return
  }

  if (actionId === 3) {
    void router.push('/club/members')
    return
  }

  if (actionId === 4) {
    void router.push('/club/downline-members')
  }
}

function onSettingClick(item: SettingItem): void {
  if (item.kind === 'switch' || item.kind === 'text' || item.kind === 'founder') {
    return
  }

  if (item.kind === 'tribe') {
    onTribeAction()
    return
  }

  if (item.label === t('UIClub_Invite')) {
    inviteShareImage.value = ''
    showInvitePopup.value = true
    return
  }

  if (item.label === t('UIClubCopy')) {
    if (!canManageClub.value) {
      showFailToast(t('UIClub_No'))
      return
    }

    showCopyPopup.value = true
    return
  }

  if (item.label === t('UIGuild_MemberDetails_VipOffLine')) {
    void router.push('/club/downline-members')
    return
  }

  if (item.kind === 'level') {
    void router.push('/club/level')
    return
  }
}

function toggleSwitch(key: 'allowSearch' | 'joinWithoutApproval'): void {
  void updateClubSwitch(key)
}

async function updateClubSwitch(key: 'allowSearch' | 'joinWithoutApproval'): Promise<void> {
  if (!isFounder.value) {
    showFailToast(t('UIClub_FounderCan'))
    return
  }

  const clubId = Number(displayClub.value?.club_id)
  if (!clubId) {
    showFailToast(t('UIClub_ClubInfoError'))
    return
  }

  const nextAllowSearch = key === 'allowSearch' ? !allowSearch.value : allowSearch.value
  const nextAutoAudit =
    key === 'joinWithoutApproval' ? !joinWithoutApproval.value : joinWithoutApproval.value

  if (key === 'allowSearch') {
    allowSearch.value = nextAllowSearch
  } else {
    joinWithoutApproval.value = nextAutoAudit
  }

  try {
    await submitClubDataPatch({
      search_switch: nextAllowSearch ? 1 : 2,
      auto_audit_switch: nextAutoAudit ? 1 : 2,
    })
  } catch (error) {
    if (key === 'allowSearch') {
      allowSearch.value = !nextAllowSearch
    } else {
      joinWithoutApproval.value = !nextAutoAudit
    }
    const message = error instanceof Error ? error.message : t('UIClub_UpdateFail')
    showFailToast(message)
  }
}

function onClubAvatarUploadError(message: string): void {
  showFailToast(message || t('UIClub_Upload'))
}

async function onClubAvatarUploaded(url: string): Promise<void> {
  if (!isFounder.value) {
    showFailToast(t('UIClub_FounderCan'))
    return
  }

  const nextLogo = (url || '').trim()
  if (!nextLogo) {
    showFailToast(t('UIClub_Upload'))
    return
  }

  const previousLogo = displayClub.value?.logo || ''
  clubAvatarUrl.value = nextLogo
  savingClubLogo.value = true

  try {
    await submitClubDataPatch({ logo: nextLogo })
    showSuccessToast(t('UIClub_ClubAvatarDoneUpdate'))
  } catch (error) {
    clubAvatarUrl.value = previousLogo
    const message = error instanceof Error ? error.message : t('UIClub_UpdateFail')
    showFailToast(message)
  } finally {
    savingClubLogo.value = false
  }
}

function closeInvitePopup(): void {
  clearInviteLongPressTimer()
  inviteShareGenerationId += 1
  inviteShareImage.value = ''
  telegramInviteShareUrl = ''
  showInvitePopup.value = false
}

function closeCopyPopup(): void {
  showCopyPopup.value = false
}

async function prepareInviteShareImage(): Promise<void> {
  if (
    !showInvitePopup.value ||
    !imgInviteQr.value ||
    inviteShareImage.value ||
    generatingInviteShare.value
  ) {
    return
  }

  const generationId = ++inviteShareGenerationId
  const imageUrl = await generateInviteShare()
  if (generationId === inviteShareGenerationId && showInvitePopup.value && imageUrl) {
    inviteShareImage.value = imageUrl
  }
}

function resolveUploadedImageUrl(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim()
  if (!raw || typeof raw !== 'object') return ''

  const data = raw as Record<string, unknown>
  const candidates = [data.url, data.file_url, data.fileUrl, data.path, data.data]
  for (const candidate of candidates) {
    const resolved = resolveUploadedImageUrl(candidate)
    if (resolved) return resolved
  }
  return ''
}

async function uploadInviteShareImage(fileName: string): Promise<string> {
  if (telegramInviteShareUrl) return telegramInviteShareUrl

  const response = await fetch(inviteShareImage.value)
  const blob = await response.blob()
  const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' })
  const formData = new FormData()
  formData.append('file', file, fileName)
  const uploadResponse = await postOssUploadImageApi(
    formData as unknown as Parameters<typeof postOssUploadImageApi>[0],
  )
  if (uploadResponse.code !== 0) {
    throw new Error(uploadResponse.message || t('UIClub_SaveFail2'))
  }

  const uploadedUrl = resolveUploadedImageUrl(uploadResponse.data)
  if (!uploadedUrl) throw new Error(t('UIClub_SaveFail2'))
  const absoluteUrl = new URL(uploadedUrl, window.location.href).href
  if (!absoluteUrl.startsWith('https://')) throw new Error(t('UIClub_SaveFail2'))
  telegramInviteShareUrl = absoluteUrl
  return absoluteUrl
}

async function requestTelegramInviteDownload(fileName: string): Promise<void> {
  const webApp = window.Telegram?.WebApp
  if (!webApp || typeof webApp.downloadFile !== 'function') {
    throw new Error(t('UIClub_SaveFail2'))
  }
  const downloadFile = webApp.downloadFile.bind(webApp)

  const url = await uploadInviteShareImage(fileName)
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, 30000)
    try {
      downloadFile({ url, file_name: fileName }, (accepted) => {
        window.clearTimeout(timeout)
        if (accepted) showSuccessToast(t('UIClub_DoneSave'))
        resolve()
      })
    } catch (error) {
      window.clearTimeout(timeout)
      reject(error)
    }
  })
}

async function downloadInviteShareImage(): Promise<void> {
  if (!inviteShareImage.value) return

  const fileName = `club-invite-${displayClub.value?.random_id || Date.now()}.jpg`
  if (isTelegramMiniAppEnv()) {
    if (savingInviteShare.value) return
    savingInviteShare.value = true
    try {
      await requestTelegramInviteDownload(fileName)
    } catch (error) {
      console.error('telegram invite image download failed', error)
      showFailToast(error instanceof Error ? error.message : t('UIClub_SaveFail2'))
    } finally {
      savingInviteShare.value = false
    }
    return
  }

  const link = document.createElement('a')
  link.href = inviteShareImage.value
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  showSuccessToast(t('UIClub_DoneSave'))
}

function clearInviteLongPressTimer(): void {
  if (inviteLongPressTimer !== null) {
    window.clearTimeout(inviteLongPressTimer)
    inviteLongPressTimer = null
  }
  inviteTouchStart = null
}

function onInviteShareTouchStart(event: TouchEvent): void {
  if (!isTelegramMiniAppEnv() || event.touches.length !== 1) return
  clearInviteLongPressTimer()
  const touch = event.touches[0]
  inviteTouchStart = { x: touch.clientX, y: touch.clientY }
  inviteLongPressTimer = window.setTimeout(() => {
    inviteLongPressTimer = null
    inviteTouchStart = null
    void downloadInviteShareImage()
  }, 650)
}

function onInviteShareTouchMove(event: TouchEvent): void {
  const touch = event.touches[0]
  if (!touch || !inviteTouchStart) return
  if (
    Math.abs(touch.clientX - inviteTouchStart.x) > 10 ||
    Math.abs(touch.clientY - inviteTouchStart.y) > 10
  ) {
    clearInviteLongPressTimer()
  }
}

watch(
  [showInvitePopup, imgInviteQr],
  () => {
    void prepareInviteShareImage()
  },
  { flush: 'post' },
)

async function submitCopyRequest(): Promise<void> {
  if (!isFounder.value) {
    showFailToast(t('UIClub_FounderCan2'))
    return
  }

  try {
    const response = await postOrgClubCloneApplyApi({
      club_id: displayClub.value?.club_id,
    })

    if (response.code !== 0) {
      const fallback = t('ClubCopy_' + response.code) ?? response.msg
      throw new Error(typeof fallback === 'string' ? fallback : t('UIReplicationFailed'))
    }
    showSuccessToast(t('UIClub_DoneSubmitCopyApply'))
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIReplicationFailed')
    showFailToast(message)
  }
  closeCopyPopup()
}

function onDeleteClub(): void {
  if (!isFounder.value) {
    showFailToast(t('UIClub_FounderCan2'))
    return
  }

  showDeleteClubPopup.value = true
}

async function confirmDeleteClub(): Promise<void> {
  if (deletingClub.value) {
    return
  }

  deletingClub.value = true
  try {
    const response = await postOrgClubDisbandApi({})

    if (response.code !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : t('UIClub_DeleteFail'))
    }
    showSuccessToast(t('UIClub_DoneDeleteClub'))
    showDeleteClubPopup.value = false
    setTimeout(() => {
      void router.replace('/club')
    }, 1000)
  } catch (error) {
    const message = error instanceof Error ? error.message : t('UIClub_DeleteFail')
    showFailToast(message)
  } finally {
    deletingClub.value = false
  }
}

async function generateInviteQrCode(): Promise<void> {
  const clubInviteCode = String(displayClub.value?.invitation_code || '').trim()
  const finalLink = isAgent.value
    ? buildChannelAgentInviteUrl(agentInviteCode.value, clubInviteCode)
    : isChannelPackage
      ? buildChannelClubInviteUrl(clubInviteCode)
      : buildChannelRegisterUrl({ inviteCode: clubInviteCode })

  if (!finalLink || !clubInviteCode || (isAgent.value && !agentInviteCode.value)) {
    imgInviteQr.value = ''
    return
  }

  try {
    imgInviteQr.value = await generateQrCodeUrl(finalLink, { size: 720, margin: 2 })
  } catch (error) {
    console.error('generateInviteQrCode error', error)
  }
}

async function fetchAgentInviteCode(): Promise<void> {
  agentInviteCode.value = ''
  agentShareNickname.value = ''
  agentShareRandomId.value = ''
  if (!isAgent.value) {
    return
  }

  const currentClub = displayClub.value
  const clubId = Number(currentClub?.club_id || 0)
  const userId = Number(currentClub?.user_id ?? userInfoStore.userInfo?.user?.id ?? 0)
  if (!clubId) {
    return
  }

  try {
    const response = await postOrgClubUserInfoApi({
      club_id: clubId,
      user_id: Number.isFinite(userId) && userId > 0 ? userId : undefined,
    })

    if (Number(response.code) !== 0 || !response.data) {
      console.error('fetchAgentInviteCode API error', response.msg)
      return
    }

    agentInviteCode.value = String(
      response.data.invite_code || response.data.invitation_code || '',
    ).trim()
    agentShareNickname.value = String(response.data.user_info?.nickname || '').trim()
    agentShareRandomId.value = String(response.data.user_info?.random_id || '').trim()
  } catch (error) {
    console.error('fetchAgentInviteCode error', error)
  }
}

onMounted(async () => {
  await refreshClubDetail()
  await fetchAgentInviteCode()
  await generateInviteQrCode()
})
</script>

<template>
  <div
    class="page-shell room-list-page club-management-page club-detail-bg"
    :style="backgroundStyle"
  >
    <div class="room-list-stage club-management-stage">
      <HeaderBack :title="t('UIClub_ClubManager')" />

      <div v-loading="loading" class="club-detail">
        <section class="club-header-card">
          <div class="club-header-main">
            <ImageUploadSheet
              v-if="isFounder"
              v-model="clubAvatarUrl"
              @update:model-value="onClubAvatarUploaded"
              @error="onClubAvatarUploadError"
            >
              <template #default="{ open, imageUrl, uploading }">
                <button
                  type="button"
                  class="club-avatar-trigger"
                  :disabled="savingClubLogo || uploading"
                  :aria-label="t('UIClub_ClubAvatar3')"
                  @click="open"
                >
                  <img
                    class="club-avatar"
                    :src="imageUrl || imgClubCover"
                    :alt="t('UIClub_ClubAvatar2')"
                  />
                  <span class="club-avatar-edit" aria-hidden="true">+</span>
                </button>
              </template>
            </ImageUploadSheet>
            <img
              v-else
              class="club-avatar"
              :src="displayClub?.logo || imgClubCover"
              :alt="t('UIClub_ClubAvatar2')"
            />

            <div class="club-summary">
              <button type="button" class="club-name-edit">
                <h1 class="club-name">
                  {{ displayClub?.club_name || t('UIClub_Creat_2LvGNmS7') }}
                </h1>
                <span
                  v-if="isFounder"
                  class="name-edit-icon"
                  aria-hidden="true"
                  @click="goEditName"
                ></span>
              </button>
              <p class="club-id-row">
                <span class="id-tag">ID</span>
                <span class="id-text">{{ displayClub?.random_id || '--' }}</span>
              </p>

              <p class="metric-line">
                <img :src="imgChips" alt="" aria-hidden="true" />
                <span>{{ formatUC(currentClubGold) }}</span>
              </p>
              <p class="metric-line">
                <img :src="imgBalance" alt="" aria-hidden="true" />
                <span>{{ formatUC(currentClubCredit) }}</span>
              </p>
            </div>
          </div>

          <div class="club-size-pill" :aria-label="t('UIGuild_Member')">
            <span class="size-text"> {{ clubMemberCount }}/{{ displayClub?.upper_limit }} </span>
            <svg
              class="club-size-icon"
              viewBox="0 0 17 13"
              role="img"
              :aria-label="t('UIClub_Info_abuZSLsS')"
            >
              <path
                d="M8.5 0c1.525 0 2.763 1.306 2.763 2.914S10.025 5.828 8.5 5.828 5.738 4.522 5.738 2.914 6.975 0 8.5 0ZM2.55 2.017c1.057 0 1.913.902 1.913 2.017S3.607 6.052 2.55 6.052.638 5.15.638 4.034s.855-2.017 1.912-2.017ZM0 11.207c0-1.981 1.522-3.586 3.4-3.586.34 0 .67.053.98.151-.874 1.031-1.405 2.392-1.405 3.883v.448c0 .32.064.622.178.897H.85a.87.87 0 0 1-.85-.897v-.896ZM13.847 13c.114-.275.178-.578.178-.897v-.448c0-1.49-.531-2.852-1.405-3.883.31-.098.64-.151.98-.151 1.878 0 3.4 1.605 3.4 3.586v.896a.87.87 0 0 1-.85.897h-2.303Zm-1.31-8.966c0-1.115.856-2.017 1.913-2.017s1.913.902 1.913 2.017-.856 2.018-1.913 2.018-1.913-.902-1.913-2.018ZM4.25 11.655c0-2.477 1.902-4.483 4.25-4.483s4.25 2.006 4.25 4.483v.448a.87.87 0 0 1-.85.897H5.1a.87.87 0 0 1-.85-.897v-.448Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </section>

        <section v-if="quickActions.length > 0" class="quick-actions">
          <button
            v-for="item in quickActions"
            :key="item.id"
            type="button"
            class="quick-card"
            @click="onQuickAction(item.id)"
          >
            <span class="quick-image-wrap">
              <img :src="item.cover" :alt="item.title" />
            </span>
            <span class="quick-title">{{ item.title }}</span>
          </button>
        </section>

        <section class="intro-card">
          <span>{{ t('UIClub_Creat_ZizEgnjo') }}</span>
          <button
            v-if="isFounder"
            type="button"
            class="intro-edit"
            :aria-label="t('UIClub_EditClubDescri')"
            @click="goEditDescription"
          >
            <span class="edit-pen"></span>
          </button>
        </section>

        <section class="settings-card">
          <button
            v-for="item in settings"
            :key="item.id"
            type="button"
            class="settings-row"
            :class="[
              `settings-row--${item.kind}`,
              {
                'settings-row--clickable':
                  item.kind === 'arrow' ||
                  item.kind === 'level' ||
                  item.kind === 'copy' ||
                  (item.kind === 'tribe' && (!hasTribe || tribeApplying)),
              },
            ]"
            @click="onSettingClick(item)"
          >
            <div class="label-wrap">
              <span>{{ item.label }}</span>
              <span v-if="item.kind === 'copy'" class="info-dot">i</span>
            </div>

            <div class="right-wrap">
              <template v-if="item.kind === 'founder'">
                <span class="muted-text">{{ item.value }}</span>
                <img
                  class="mini-avatar"
                  :src="displayClub?.club_creator_avatar || imgClubCover"
                  :alt="t('UIClub_FounderAvatar')"
                />
              </template>

              <template v-else-if="item.kind === 'text'">
                <span class="muted-text">{{ item.value }}</span>
              </template>

              <template v-else-if="item.kind === 'tribe'">
                <template v-if="hasTribe">
                  <span class="muted-text">{{ item.value }}</span>
                </template>
                <template v-else>
                  <button
                    v-if="isFounder"
                    type="button"
                    class="tribe-apply-btn"
                    :class="{ 'tribe-apply-btn--pending': tribeApplying }"
                    :disabled="tribeApplyStatusLoading"
                    @click.stop="onTribeAction"
                  >
                    {{ tribeApplying ? t('UIApplying') : t('UIGuild_ApplyJoin') }}
                  </button>
                  <span v-else class="muted-text">--</span>
                </template>
              </template>

              <template v-else-if="item.kind === 'level'">
                <span class="level-pill">{{ item.value }}</span>
                <span class="chevron" aria-hidden="true"></span>
              </template>

              <template v-else-if="item.kind === 'switch' && item.switchKey">
                <button
                  type="button"
                  class="switch"
                  :class="{
                    'switch--on':
                      item.switchKey === 'allowSearch' ? allowSearch : joinWithoutApproval,
                  }"
                  :aria-label="item.label"
                  @click.stop="toggleSwitch(item.switchKey)"
                >
                  <span class="switch-knob"></span>
                </button>
              </template>

              <template v-else>
                <span class="chevron" aria-hidden="true"></span>
              </template>
            </div>
          </button>
        </section>

        <section v-if="isFounder" class="danger-zone">
          <button type="button" class="danger-btn" @click="onDeleteClub">
            {{ t('UIClub_DeleteClub') }}
          </button>
        </section>
      </div>
    </div>

    <GameDialog
      v-model:show="showInvitePopup"
      class="invite-game-dialog"
      :show-footer="false"
      :show-confirm-button="false"
      :close-on-click-overlay="true"
      dialog-width="9.1rem"
      body-max-height="16rem"
    >
      <template #title>
        <header class="invite-modal__head">
          <h3>{{ t('UIClub_InviteLink') }}</h3>
          <button
            type="button"
            class="invite-modal__close"
            data-invite-export-ignore
            :aria-label="t('UIBackDialog_ticketsbtnClose')"
            @click="closeInvitePopup"
          >
            <img :src="imgModalClose" alt="" aria-hidden="true" />
          </button>
        </header>
      </template>

      <section class="invite-modal">
        <div ref="inviteModalRef" class="invite-modal__capture">
          <div class="invite-modal__body">
            <p class="invite-modal__subtitle">{{ t('UIClub_Of4') }}</p>
            <div class="invite-modal__cover-wrap">
              <img class="invite-modal__cover" :src="imgInviteCover" :alt="t('UIClub_Text102')" />
            </div>
            <div class="invite-modal__identity">
              <template v-if="isAgent">
                <div class="invite-modal__agent-info">
                  <p class="invite-modal__agent-name">{{ shareAgentNickname }}</p>
                  <p class="invite-modal__agent-id-row">
                    <span class="invite-modal__id-tag">ID</span>
                    <span>{{ shareAgentId }}</span>
                  </p>
                  <!-- <p class="invite-modal__club-name">{{ clubName }}</p> -->
                </div>
              </template>
              <template v-else>
                <p class="invite-modal__club-name">{{ clubName }}</p>
                <p class="invite-modal__club-alias">{{ clubAlias }}</p>
                <p class="invite-modal__id-row">
                  <span class="invite-modal__id-tag">ID</span>
                  <span>{{ clubId }}</span>
                </p>
              </template>
            </div>
          </div>

          <div class="invite-modal__qr-section">
            <div class="invite-modal__qr-wrap">
              <img
                v-if="imgInviteQr"
                class="invite-modal__qr"
                :src="imgInviteQr"
                :alt="t('UIClub_CodeJoinClub')"
              />
              <div v-else class="invite-modal__qr-placeholder" :aria-label="t('UIClub_Code9')">
                <span></span>
              </div>
            </div>
            <p class="invite-modal__qr-tip">
              {{ t('UIClub_CodeJoin') }}，{{ t('UIClub_Text103') }}
            </p>
          </div>
          <img
            v-if="inviteShareImage"
            class="invite-share-save-target"
            data-invite-export-ignore
            data-allow-native-menu="true"
            :src="inviteShareImage"
            :alt="t('UIClub_Text102')"
            @touchstart="onInviteShareTouchStart"
            @touchmove="onInviteShareTouchMove"
            @touchend="clearInviteLongPressTimer"
            @touchcancel="clearInviteLongPressTimer"
          />
        </div>
        <button
          type="button"
          class="modal-primary-btn"
          data-invite-export-ignore
          :disabled="generatingInviteShare || savingInviteShare || !inviteShareImage"
          @click="downloadInviteShareImage"
        >
          {{
            generatingInviteShare || savingInviteShare
              ? t('UIClub_Save3') + '...'
              : t('UIClub_Save4')
          }}
        </button>
        <p class="invite-modal__save-tip" data-invite-export-ignore>
          {{ t('UIClub_LongPressSaveToAlbum') }}
        </p>
      </section>
    </GameDialog>

    <div v-if="showCopyPopup" class="club-modal-mask" @click="closeCopyPopup">
      <section class="copy-modal" @click.stop>
        <p>{{ t('UIClub_ApplyCopyClub') }}，{{ t('UIClub_SubmitApply') }}</p>
        <div class="copy-modal__actions">
          <button type="button" class="modal-secondary-btn" @click="closeCopyPopup">
            {{ t('adaptation10013') }}
          </button>
          <button type="button" class="modal-primary-btn" @click="submitCopyRequest">
            {{ t('CommitOK') }}
          </button>
        </div>
      </section>
    </div>

    <GameDialog
      v-model:show="showTribeSearchPopup"
      :title="t('UIClub_SearchUnion')"
      dialog-width="8.8rem"
      :show-cancel-button="true"
      :close-on-click-overlay="true"
      :cancel-button-text="t('adaptation10013')"
      :confirm-button-text="tribeApplySubmitting ? t('UIClub_Search') : t('UI_Recharge_confirm')"
      :confirm-button-disabled="tribeApplySubmitting"
      @confirm="submitTribeApply"
      @cancel="closeTribeSearchPopup"
    >
      <div class="tribe-search-shell" :aria-label="t('UIClub_UnionSearch')">
        <label class="tribe-search-trigger" for="tribe-id-input">
          <img class="tribe-search-icon" :src="imgSearch" alt="" />
          <input
            id="tribe-id-input"
            class="tribe-search-input"
            :value="tribeApplyIdInput"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            readonly
            :placeholder="t('UIClub_PleaseUnion') + 'ID'"
            @focus="openTribeIdKeypad"
            @click="openTribeIdKeypad"
          />
        </label>
      </div>
    </GameDialog>

    <GameDialog
      v-model:show="showTribeApplyPopup"
      dialog-width="8.454rem"
      :show-cancel-button="true"
      :close-on-click-overlay="true"
      :cancel-button-text="t('adaptation10013')"
      :confirm-button-text="tribeApplySubmitting ? t('UIClub_Submitting') : t('UIClub_RoomJoin')"
      :confirm-button-disabled="tribeApplySubmitting"
      @confirm="confirmTribeApply"
      @cancel="closeTribeApplyPopup"
    >
      <div class="join-modal-card">
        <img
          class="join-modal-logo"
          :src="searchedTribe?.logo || imgClubCover"
          :alt="t('UIClub_UnionAvatar')"
        />
        <h3 class="join-modal-name">
          {{ searchedTribe?.name || t('UIClub_TribeCreat_0HvQpjkd') }}
        </h3>
        <p class="join-modal-id-row">
          <span class="join-modal-id-tag">ID</span>
          <span>{{ searchedTribe?.randomId || '--' }}</span>
        </p>

        <div class="tribe-contact-shell tribe-contact-shell--modal">
          <input
            class="tribe-contact-input"
            :value="tribeApplyContactInput"
            type="text"
            autocomplete="off"
            maxlength="40"
            :placeholder="t('UIClub_Please')"
            @input="onTribeContactInput"
          />
        </div>
      </div>
    </GameDialog>

    <div
      v-if="showCancelTribeApplyPopup"
      class="club-modal-mask"
      @click="closeCancelTribeApplyPopup"
    >
      <section class="copy-modal" @click.stop>
        <p>{{ t('UIClub_CurrentApply') }}，{{ t('UIClub_CancelApply') }}？</p>
        <div class="copy-modal__actions">
          <button type="button" class="modal-secondary-btn" @click="closeCancelTribeApplyPopup">
            {{ t('UIHappyShop_Return') }}
          </button>
          <button
            type="button"
            class="modal-primary-btn"
            :disabled="cancelTribeApplyLoading"
            @click="cancelTribeApply"
          >
            {{
              cancelTribeApplyLoading ? t('UIClub_Cancel') + '...' : t('UIGuild_CancleApplyJoin')
            }}
          </button>
        </div>
      </section>
    </div>
    <GameDialog
      v-model:show="showDeleteClubPopup"
      :title="t('UIMine_Setting114')"
      :show-cancel-button="true"
      :close-on-click-overlay="true"
      :confirm-button-text="t('UIClub_ConfirmDelete')"
      :cancel-button-text="t('adaptation10013')"
      @confirm="confirmDeleteClub"
      @cancel="closeDeleteClubPopup"
    >
      <div class="logout-confirm-text">
        {{ t('UIClub_DeleteClubNo') }}，{{ t('UIClub_ConfirmDelete2') }}？
      </div>
    </GameDialog>

    <NumericKeypad
      :open="tribeIdKeypadOpen"
      :min="0"
      :max="9999999999"
      :max-length="10"
      :initial-value="tribeApplyIdInput"
      :show-input-area="true"
      :allow-leading-zero="true"
      :title="t('UIClub_Info_rUC1C7lI') + 'ID'"
      :confirm-text="t('CommitOK')"
      @close="onTribeIdKeypadClose"
      @submit="onTribeIdKeypadSubmit"
      @key-press="onTribeIdKeypadKeyPress"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.club-detail-bg {
  height: 100dvh;
  background-image: var(--club-detail-bg-dark);
  background-size: cover;

  @include theme-light {
    color: var(--c-text);
    background-color: var(--c-page);
    background-image: var(--club-detail-bg-light);
  }
}

.club-detail {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.40524rem;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
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

.club-header-card {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0;
  min-height: 3.08434rem;
  padding: 0.12048rem 0.55422rem;
  border-radius: 1.00402rem;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.2rem);

  @include theme-light {
    background: var(--c-surface);
    backdrop-filter: none;
  }
}

.club-header-main {
  display: inline-flex;
  align-items: center;
  gap: 0.28112rem;
  bottom: 0.5rem;
  position: relative;
}

.club-avatar {
  width: 1.96787rem;
  height: 1.97968rem;
  border-radius: 999px;
  object-fit: cover;
  border: 0;
}

.club-avatar-trigger {
  position: relative;
  width: 1.96787rem;
  height: 1.97968rem;
  border: 0;
  border-radius: 999px;
  padding: 0;
  background: transparent;
}

.club-avatar-edit {
  position: absolute;
  right: -0.03rem;
  bottom: -0.03rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: linear-gradient(165deg, #05e7ae 10%, #027a5c 75%);
  color: #fff;
  font-size: 0.45rem;
  line-height: 0.5rem;
  text-align: center;

  @include theme-light {
    background: var(--c-brand);
    box-shadow: none;
  }
}

.club-summary {
  display: flex;
  flex-direction: column;
  min-height: 1.99325rem;
}

.club-name-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  max-width: 100%;
}

.club-name {
  margin: 0;
  color: #f9f9f9;
  font-size: 0.5692rem;
  line-height: 1;
  font-weight: 700;

  @include theme-light {
    color: var(--c-text);
  }
}

.name-edit-icon {
  position: relative;
  width: 0.6rem;
  height: 0.6rem;
  flex: 0 0 auto;
}

.name-edit-icon::before {
  content: '';
  position: absolute;
  left: 0.09rem;
  top: 0.18rem;
  width: 0.42rem;
  height: 0.18rem;
  border: 0.06rem solid rgba(249, 249, 249, 0.92);
  border-radius: 0.09rem;
  transform: rotate(-38deg);

  @include theme-light {
    border-color: rgba(34, 34, 34, 0.86);
  }
}

.club-id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.06231rem;
}

.id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.48924rem;
  height: 0.27575rem;
  border-radius: 0.10682rem;
  font-size: 0.20537rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.28);

  @include theme-light {
    color: #fff;
    background: rgba(79, 79, 79, 0.4);
  }
}

.id-text {
  font-size: 0.24404rem;
  color: rgba(249, 249, 249, 0.95);

  @include theme-light {
    color: var(--c-text);
  }
}

.metric-line {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.11365rem;
  color: #f9f9f9;
  font-size: 0.3553rem;
  line-height: 1.2;
  font-weight: 600;

  @include theme-light {
    color: var(--c-text);
  }
}

.metric-line img {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
}

.club-size-pill {
  flex: 0 0 auto;
  min-height: 0.82731rem;
  padding: 0 0.28112rem;
  border-radius: 0.72289rem;
  display: inline-flex;
  align-items: center;
  gap: 0.05622rem;
  background: rgba(255, 255, 255, 0.2);
  right: 0.5rem;
  bottom: 0.3rem;
  position: absolute;

  @include theme-light {
    background: rgba(164, 164, 164, 0.2);
  }
}

.size-text {
  color: #f9f9f9;
  font-size: 0.4739rem;
  line-height: 1;
  font-weight: 500;

  @include theme-light {
    color: var(--c-text);
  }
}

.club-size-icon {
  width: 0.46rem;
  height: 0.36rem;
  margin-left: 0.1rem;
  color: #fff;

  @include theme-light {
    color: #050505;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.29333rem;
}

.quick-card {
  border: 0;
  padding: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.16027rem;
  color: #f9f9f9;

  @include theme-light {
    color: var(--c-text);
  }
}

.quick-image-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 0.75252rem;
  border: 0.02667rem solid rgba(255, 255, 255, 0.6);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.26);

  @include theme-light {
    border-color: rgba(255, 255, 255, 0.78);
    background: rgba(93, 93, 93, 0.17);
    backdrop-filter: blur(0.254rem);
    -webkit-backdrop-filter: blur(0.254rem);
  }
}

.quick-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quick-title {
  font-size: 0.304rem;
  line-height: 1;
  text-align: center;
}

.intro-card {
  min-height: 1.51964rem;
  padding: 0.34538rem 0.41767rem 0.34538rem 0.55422rem;
  border-radius: 0.72289rem;
  background: rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(0.12rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(249, 249, 249, 0.96);
  font-size: 0.40524rem;

  @include theme-light {
    color: var(--c-text);
    background: #dadada;
    backdrop-filter: none;
  }
}

.intro-edit {
  border: 0;
  width: 0.67539rem;
  height: 0.67539rem;
  border-radius: 50%;
  background: linear-gradient(145deg, #15ddb2, #00ca98);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  @include theme-light {
    background: var(--c-brand);
    box-shadow: none;
  }
}

.edit-pen {
  position: relative;
  width: 0.6rem;
  height: 0.6rem;
}

.edit-pen::before {
  content: '';
  position: absolute;
  left: 0.1rem;
  top: 0.2rem;
  width: 0.42rem;
  height: 0.18rem;
  border: 0.06rem solid #fff;
  border-radius: 0.1rem;
  transform: rotate(-38deg);
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: 0.28916rem;
  padding: 0.34538rem 0.41767rem;
  border-radius: 0.72289rem;
  background:
    radial-gradient(80% 100% at 100% 100%, rgba(51, 169, 206, 0.26), rgba(51, 169, 206, 0)),
    rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(0.15rem);

  @include theme-light {
    background: var(--c-surface);
    backdrop-filter: none;
  }
}

.settings-row {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  min-height: 0.53333rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0;
  color: #f1f1f1;
  font-size: 0.40524rem;

  @include theme-light {
    color: var(--c-text);
  }
}

.tribe-apply-btn {
  border: 0;
  min-height: 0.58rem;
  padding: 0 0.24rem;
  border-radius: 999px;
  color: #fff;
  font-size: 0.28rem;
  font-weight: 500;
  background: linear-gradient(153deg, #05e7ae 8%, #027a5c 72%);

  @include theme-light {
    background: var(--c-brand);
    box-shadow: none;
  }
}

.tribe-apply-btn--pending {
  background: rgba(255, 255, 255, 0.22);

  @include theme-light {
    color: var(--c-text-muted);
    background: rgba(164, 164, 164, 0.2);
  }
}

.tribe-apply-btn:disabled {
  opacity: 0.7;
}

.label-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;
  min-width: 0;
  text-align: left;
}

.right-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.08rem;
}

.muted-text {
  color: rgba(228, 228, 228, 0.7);
  font-size: 0.40524rem;

  @include theme-light {
    color: var(--c-text-muted);
  }
}

.mini-avatar {
  width: 0.71rem;
  height: 0.71rem;
  border-radius: 999px;
  object-fit: cover;
}

.chevron {
  width: 0.26656rem;
  height: 0.26656rem;
  border-top: 0.02rem solid rgba(237, 237, 237, 0.85);
  border-right: 0.02rem solid rgba(237, 237, 237, 0.85);
  transform: rotate(45deg);

  @include theme-light {
    border-color: rgba(0, 0, 0, 0.82);
  }
}

.level-pill {
  display: inline-flex;
  align-items: center;
  min-height: 0.48614rem;
  padding: 0 0.1246rem;
  border-radius: 999px;
  font-size: 0.27857rem;
  font-weight: 700;
  color: #f9f9f9;
  background: linear-gradient(152deg, #05e7ae 8%, #027a5c 72%);

  @include theme-light {
    color: #f9f9f9;
    background: var(--c-brand);
    box-shadow: none;
  }
}

.switch {
  width: 1.756rem;
  height: 0.82747rem;
  border: 0;
  padding: 0.04rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  display: inline-flex;
  align-items: center;

  @include theme-light {
    background: rgba(134, 134, 134, 0.34);
  }
}

.switch--on {
  justify-content: flex-end;
  background: var(--c-brand);

  @include theme-light {
    background: var(--c-brand);
  }
}

.switch:not(.switch--on) {
  justify-content: flex-start;
}

.switch-knob {
  width: 0.667rem;
  height: 0.667rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.info-dot {
  width: 0.3592rem;
  height: 0.3592rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.24);
  color: #fff;
  font-size: 0.22613rem;
  line-height: 0.3592rem;
  text-align: center;

  @include theme-light {
    color: #fff;
    background: rgba(34, 34, 34, 0.58);
  }
}

.danger-zone {
  margin-top: 0.40524rem;
  padding: 0 0.34108rem 0.24rem;
}

.danger-btn {
  width: 100%;
  min-height: 1.43581rem;
  border: 0;
  border-radius: 1.05574rem;
  color: #f9f9f9;
  font-size: 0.5066rem;
  font-weight: 500;
  background: linear-gradient(90deg, rgba(73, 29, 86, 0.8), rgba(19, 95, 125, 0.84));

  @include theme-light {
    color: #fff;
    background: var(--c-brand);
    box-shadow: none;
  }
}

.club-modal-mask {
  position: fixed;
  inset: 0;
  padding: 0.4rem;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 80;

  @include theme-light {
    background: var(--c-overlay);
  }
}

.copy-modal {
  width: min(9.1rem, 100%);
  border-radius: 0.97035rem;
  border: 0.0255rem solid rgba(242, 242, 242, 0.4);
  background: linear-gradient(121deg, rgba(0, 0, 0, 0.2) 3%, rgba(0, 0, 0, 0.38) 89%);
  backdrop-filter: blur(1.20216rem);
  box-shadow:
    0 0 0.22981rem rgba(0, 0, 0, 0.85) inset,
    0.05672rem 0.11344rem 0.45908rem rgba(242, 242, 242, 0.5) inset,
    0.09192rem 0.11491rem 0.18384rem rgba(0, 0, 0, 0.28);
  color: #f9f9f9;
}

.join-modal-card {
  min-height: 5.02rem;
  border-radius: 0.834rem;
  border: 0.026rem solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  padding: 0.5rem 0.42rem;
}

.join-modal-logo {
  width: 1.893rem;
  height: 1.813rem;
  object-fit: cover;
  border-radius: 0.26rem;
}

.join-modal-name {
  margin: 0;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.597rem;
  font-weight: 700;
  line-height: 1.2;
  color: #fff;
  text-align: center;
}

.join-modal-id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: 'SF Pro', 'PingFang SC', sans-serif;
  font-size: 0.256rem;
  font-weight: 600;
  color: #fff;
}

.join-modal-id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.445rem;
  height: 0.316rem;
  border-radius: 0.075rem;
  background: rgba(255, 255, 255, 0.25);
  font-size: 0.216rem;
}

.tribe-search-shell {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 1.2rem;
  border-radius: 1rem;
  padding: 0.12rem 0.28rem;
  border: 0.013rem solid rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.12);
}

.tribe-search-trigger {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.tribe-search-icon {
  width: 0.56rem;
  height: 0.55rem;
}

.tribe-search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 0.38rem;
}

.tribe-search-input::placeholder {
  color: rgba(255, 255, 255, 0.88);
}

.tribe-contact-shell {
  min-height: 1.06rem;
  border-radius: 0.56rem;
  border: 0.013rem solid rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.12);
  padding: 0 0.32rem;
  display: flex;
  align-items: center;
}

.tribe-contact-shell--modal {
  width: 100%;
  margin-top: 0.06rem;
}

.tribe-contact-input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 0.34rem;
}

.tribe-contact-input::placeholder {
  color: rgba(255, 255, 255, 0.72);
}

.invite-modal {
  position: relative;
  width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.invite-modal__capture {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4831rem;
  width: 100%;
  padding: 0;
  background: transparent;
}

.invite-share-save-target {
  position: absolute;
  z-index: 3;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.001;
  -webkit-touch-callout: default !important;
  -webkit-user-select: auto;
  user-select: auto;
  -webkit-user-drag: auto;
}

.invite-modal__save-tip {
  margin: 0.08rem 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.3rem;
  line-height: 1.4;
  text-align: center;

  @include theme-light {
    color: rgba(255, 255, 255, 0.78);
  }
}

:global(.invite-share-export) {
  min-height: 0 !important;
  overflow: hidden !important;
  border: 0 !important;
  background: #242424 !important;
  background-image: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  transform: none !important;
}

:global(.invite-share-export::before),
:global(.invite-share-export::after) {
  display: none !important;
}

:global(.invite-share-export *),
:global(.invite-share-export *::before),
:global(.invite-share-export *::after) {
  animation: none !important;
  transition: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

:global(.invite-share-export .game-dialog__body) {
  max-height: none !important;
  overflow: visible !important;
}

:global(.invite-share-export .invite-modal__head h3) {
  padding-left: 0 !important;
}

:global(.invite-game-dialog .game-dialog__card) {
  padding: 0.4187rem 0.4106rem 0.6038rem;
  gap: 0.4831rem;
}

:global(.invite-game-dialog .game-dialog__body) {
  max-height: none !important;
  overflow: visible !important;
}

.invite-modal__head {
  width: 100%;
  display: grid;
  grid-template-columns: 1.0241rem 1fr 1.0241rem;
  align-items: center;
}

.invite-modal__head h3 {
  grid-column: 2;
  margin: 0;
  text-align: center;
  font-size: 0.41866rem;
  font-weight: 500;
  line-height: 1.4;
  padding: 0;
}

.invite-modal__close {
  grid-column: 3;
  width: 1.0241rem;
  height: 1.0241rem;
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.invite-modal__close img {
  width: 0.66rem;
  height: 0.66rem;
  object-fit: contain;
}

.invite-modal__body {
  padding: 0.3462rem 0.4187rem 0.1771rem;
  border-radius: 0.72464rem;
  background: linear-gradient(100deg, rgba(255, 255, 255, 0.08), rgba(230, 230, 230, 0.12));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3382rem;
}

.invite-modal__subtitle {
  margin: 0;
  font-size: 0.35565rem;
  line-height: 1.35;
}

.invite-modal__cover-wrap {
  width: 100%;
  height: 2.3752rem;
  border-radius: 0.58rem;
  overflow: hidden;
  border: 0.01778rem solid rgba(255, 255, 255, 0.14);
  margin-top: 0;
}

.invite-modal__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.invite-modal__club-name {
  margin: 0;
  font-size: 0.35565rem;
  line-height: 1.35;
}

.invite-modal__agent-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.06rem;
  margin: 0;
}

.invite-modal__agent-name {
  margin: 0;
  font-size: 0.4rem;
  line-height: 1.25;
  font-weight: 700;
}

.invite-modal__agent-id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.09333rem;
  font-size: 0.32293rem;
  line-height: 1;
  font-weight: 600;
}

.invite-modal__identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 0;
}

.invite-modal__club-alias {
  margin: 0;
  font-size: 0.48309rem;
  line-height: 1.2;
  font-weight: 700;
}

.invite-modal__id-row {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.09333rem;
  font-size: 0.32293rem;
  line-height: 1;
  font-weight: 600;
}

.invite-modal__id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.46rem;
  height: 0.3rem;
  padding: 0 0.12rem;
  border-radius: 0.13rem;
  background: rgba(255, 255, 255, 0.3);
  font-size: 0.23111rem;
  color: #444;
  font-weight: 600;
}

.invite-modal__qr-wrap {
  position: relative;
  width: 3.33333rem;
  height: 3.33333rem;
  margin: 0 auto;
  border-radius: 0.30747rem;
  background: #fff;
  padding: 0.10667rem;
  border: 0.10067rem solid var(--c-brand);
  overflow: hidden;

  @include theme-light {
    border-color: var(--c-brand);
  }
}

.invite-modal__qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.0966rem;
  width: 100%;
  background: transparent;
}

.invite-modal__qr {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.invite-modal__qr-placeholder {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 0.12rem;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(35, 35, 35, 0.08) 50%, transparent 50%) 0 0 / 0.28rem 0.28rem,
    linear-gradient(rgba(35, 35, 35, 0.08) 50%, transparent 50%) 0 0 / 0.28rem 0.28rem,
    #fff;
}

.invite-modal__qr-placeholder span {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0.58rem;
  height: 0.58rem;
  margin: -0.29rem 0 0 -0.29rem;
  border: 0.055rem solid rgba(105, 190, 255, 0.26);
  border-top-color: var(--c-brand);
  border-radius: 50%;
  animation: invite-qr-loading 0.8s linear infinite;
}

.invite-modal__qr-heart {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0.9888rem;
  height: 0.9888rem;
  border-radius: 50%;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.invite-modal__qr-heart img {
  width: 0.64rem;
  height: 0.64rem;
  object-fit: contain;
}

.invite-modal__qr-tip {
  margin: 0;
  text-align: center;
  font-size: 0.314rem;
  font-weight: 500;
  line-height: 1.3;
  background: transparent;
}

.modal-primary-btn,
.modal-secondary-btn {
  width: 100%;
  min-height: 1.43581rem;
  border: 0;
  border-radius: 1.05574rem;
  font-size: 0.4rem;
  font-weight: 500;
  color: #fff;
  line-height: 1.2;
  padding: 0.2rem 0.4rem;
}

.modal-primary-btn {
  border: 0.01333rem solid rgba(242, 242, 242, 0.8);
  background: linear-gradient(153deg, #05e7ae 8%, #027a5c 72%);
  box-shadow: inset 0 -0.16rem 0.3rem rgba(0, 0, 0, 0.14);

  @include theme-light {
    border-color: transparent;
    background: var(--c-brand);
    box-shadow: none;
  }
}

.modal-primary-btn:disabled {
  opacity: 0.72;
}

@keyframes invite-qr-loading {
  to {
    transform: rotate(360deg);
  }
}

.copy-modal {
  width: min(8.25283rem, 100%);
  padding: 0.82rem 0.42rem 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.copy-modal p {
  margin: 0;
  text-align: center;
  font-size: 0.36232rem;
  line-height: 1.3;
}

.copy-modal__actions {
  display: flex;
  gap: 0.25339rem;
}

.copy-modal__actions > button {
  flex: 1;
  min-width: 0;
}

.modal-secondary-btn {
  background: rgba(0, 0, 0, 0.34);
  box-shadow: inset 0 -0.2rem 0.24rem rgba(0, 0, 0, 0.24);

  @include theme-light {
    color: var(--c-text);
    background: rgba(34, 34, 34, 0.08);
    box-shadow: none;
  }
}

@media (max-width: 340px) {
  .invite-modal,
  .copy-modal {
    padding-left: 0.3rem;
    padding-right: 0.3rem;
  }

  .invite-modal__head h3 {
    font-size: 0.36rem;
  }

  .copy-modal p {
    font-size: 0.32rem;
  }

  .modal-primary-btn,
  .modal-secondary-btn {
    font-size: 0.35rem;
  }

  .club-name {
    font-size: 0.38rem;
  }

  .size-text {
    font-size: 0.31rem;
  }

  .settings-row {
    font-size: 0.3rem;
  }

  .muted-text {
    font-size: 0.3rem;
  }

  .danger-btn {
    font-size: 0.4rem;
  }
}
</style>

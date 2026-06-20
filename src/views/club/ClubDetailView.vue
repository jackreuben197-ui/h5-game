<script setup lang="ts">
import html2canvas from 'html2canvas'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  postOrgClubSearchByIdApi,
  postOrgChangeClubDataApi,
  postOrgClubAgentInviTationApi,
  postOrgClubInviTationApi,
  postOrgClubDisbandApi,
  postOrgClubCloneApplyApi,
  postOrgJoinTripApi,
  postOrgTribeInfoByClubApi,
  postOrgClubApplyTribeListApi,
  postOrgClubCancleJoinTribeApi,
} from '@/api/org'
import type {
  OrgChangeClubDataRequest,
  OrgClubData,
  OrgClubSearchByIdResponseData,
} from '@/api/models/org'
import imgClubCover from '@/assets/images/default_avatar_for_club.png'
import imgBalance from '@/assets/icons/icon_balance.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgPeople from '@/assets/icons/member_icon_redesigned.svg'
import imgQuickSafety from '@/assets/images/club_quick_activity.png'
import imgQuickRanking from '@/assets/images/club_quick_room_history.png'
import imgQuickFund from '@/assets/images/club_quick_fund.png'
import imgInviteCover from '@/assets/images/club_invite_cover.png'
import imgInviteSubtract from '@/assets/images/club_invite_subtract.svg'
import imgInviteHeart from '@/assets/icons/club_invite_heart.png'
import imgSearch from '@/assets/icons/club_search.svg'
import imgModalClose from '@/assets/icons/modal_close.svg'
import imgAvatarAdd from '@/assets/icons/avatar_add_badge.svg'
// import ImageUploadSheet from '@/components/ImageUploadSheet/ImageUploadSheet.vue'
import NumericKeypad from '@/components/KeyBoard/NumericKeypad.vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { extractInvitationCode, extractInvitationLink } from '@/utils/clubInvitation'
import {
  buildChannelClubInviteUrl,
  buildChannelRegisterUrl,
  isChannelPackageHost,
} from '@/utils/channelPackage'
import { generateQrCodeUrl } from '@/utils/qrcode'
import { formatUC } from '@/utils/roomVisibility'
import { showFailToast, showSuccessToast } from 'vant'
import mainBgUrl from '@/assets/images/main_bg.webp'
import { t } from '@/i18n'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
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

const loading = ref(false)
const clubDetail = ref<OrgClubSearchByIdResponseData | null>(null)

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
const cachedClub = computed(() => userInfoStore.currentClub)
const currentClubGold = computed(() => Number(cachedClub.value?.user_gold ?? 0))
const currentClubCredit = computed(() => Number(cachedClub.value?.user_credit ?? 0))
const isChannelPackage = isChannelPackageHost()

const quickActions = computed<QuickActionItem[]>(() => {
  if (canManageClub.value) {
    return [
      { id: 1, title: '活动管理', cover: imgQuickSafety },
      { id: 2, title: '牌局管理', cover: imgQuickRanking },
      { id: 3, title: '基金管理', cover: imgQuickFund },
    ]
  }

  return []
})

const settings = computed<SettingItem[]>(() => {
  const list: SettingItem[] = [
    {
      id: 1,
      label: '创始人',
      kind: 'founder',
      value: displayClub.value?.club_creator_nickname || '--',
    },
    { id: 2, label: '邀请分享', kind: 'arrow' },
    { id: 3, label: '联盟', kind: 'tribe', value: displayClub.value?.tribe_name || '--' },
  ]

  if (isFounder.value) {
    list.push(
      {
        id: 4,
        label: '当前俱乐部等级',
        kind: 'level',
        value: `LV. ${displayClub.value?.level || 0}`,
      },
      { id: 5, label: '允许其他人搜索俱乐部', kind: 'switch', switchKey: 'allowSearch' },
      { id: 6, label: '入会无需审批', kind: 'switch', switchKey: 'joinWithoutApproval' },
    )
  }

  list.push({
    id: 7,
    label: '创建时间',
    kind: 'text',
    value: formatDate(displayClub.value?.create_time),
  })

  if (canManageClub.value) {
    list.push({ id: 8, label: '复制俱乐部', kind: 'copy' })
  }

  if (isAgent.value) {
    list.push({ id: 9, label: '下线成员', kind: 'arrow' })
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
const savingInviteShare = ref(false)
const savingInviteQr = ref(false)
const savingClubLogo = ref(false)
const tribeApplySubmitting = ref(false)
const tribeApplyStatusLoading = ref(false)
const cancelTribeApplyLoading = ref(false)
const tribeApplyId = ref<number | null>(null)
const tribeApplying = ref(false)
const tribeApplyIdInput = ref('')
const tribeApplyContactInput = ref('')
const tribeIdKeypadOpen = ref(false)
const searchedTribe = ref<{ randomId: number; name: string; logo: string } | null>(null)
const clubAvatarUrl = ref('')
const inviteModalRef = ref<HTMLElement | null>(null)

const clubName = computed(() => displayClub.value?.club_name || '俱乐部名称')
const clubAlias = computed(() => displayClub.value?.tribe_name || 'XXXX')
const clubId = computed(() => String(displayClub.value?.random_id || '--'))
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

  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function formatCount(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return '0'
  }

  return Math.floor(num).toLocaleString('en-US')
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

function closeTribeApplyPopup(): void {
  showTribeApplyPopup.value = false
}

function closeCancelTribeApplyPopup(): void {
  showCancelTribeApplyPopup.value = false
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
    showFailToast('俱乐部信息异常')
    return
  }

  const tribeRandomId = Number(tribeApplyIdInput.value)
  if (!Number.isFinite(tribeRandomId) || tribeRandomId <= 0) {
    showFailToast('请输入联盟ID')
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
      showFailToast('找不到联盟')
      return
    }

    const relation = Number(response.data?.club_relation || 1)
    if (relation === 2) {
      showFailToast('当前俱乐部已申请该联盟')
      await fetchClubTribeApplyStatus()
      closeTribeSearchPopup()
      return
    }

    if (relation === 3) {
      showFailToast('当前俱乐部已加入该联盟')
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
    showFailToast('找不到联盟')
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
    showFailToast('俱乐部信息异常')
    return
  }

  const tribeRandomId = Number(searchedTribe.value?.randomId || 0)
  if (!Number.isFinite(tribeRandomId) || tribeRandomId <= 0) {
    showFailToast('联盟信息异常')
    return
  }

  const contact = tribeApplyContactInput.value.trim()
  if (!contact) {
    showFailToast('请输入联系方式')
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
      throw new Error(typeof fallback === 'string' ? fallback : '申请加入失败')
    }

    const successMessage = (response.msg ?? response.message) as unknown
    showSuccessToast(typeof successMessage === 'string' ? successMessage : '申请已提交')
    closeTribeApplyPopup()
    resetTribeApplyForm()
    await fetchClubTribeApplyStatus()
  } catch (error) {
    const message = error instanceof Error ? error.message : '申请加入失败'
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
    showFailToast('未找到可取消的申请')
    return
  }

  cancelTribeApplyLoading.value = true
  try {
    const response = await postOrgClubCancleJoinTribeApi({ apply_id: applyId })
    if (Number(response.code) !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : '取消申请失败')
    }

    const successMessage = (response.msg ?? response.message) as unknown
    showSuccessToast(typeof successMessage === 'string' ? successMessage : '已取消申请')
    closeCancelTribeApplyPopup()
    await fetchClubTribeApplyStatus()
  } catch (error) {
    const message = error instanceof Error ? error.message : '取消申请失败'
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

async function submitClubDataPatch(payload: Partial<OrgChangeClubDataRequest>): Promise<void> {
  if (!isFounder.value) {
    throw new Error('仅创始人可修改')
  }

  const clubId = Number(displayClub.value?.club_id)
  if (!clubId) {
    throw new Error('俱乐部信息异常')
  }

  const response = await postOrgChangeClubDataApi({
    club_id: clubId,
    ...payload,
  })

  if (response.code !== 0) {
    const fallback = (response.msg ?? response.message) as unknown
    throw new Error(typeof fallback === 'string' ? fallback : '更新失败')
  }

  syncCurrentClubFields(payload as Partial<OrgClubData>)
}

async function refreshClubDetail(): Promise<void> {
  const currentClub = userInfoStore.currentClub
  if (!currentClub?.random_id) {
    showFailToast('未找到俱乐部信息')
    void router.replace('/club/list')
    return
  }
  clubDetail.value = currentClub
  clubAvatarUrl.value = currentClub.logo || ''
  updateSwitchesByClubData(currentClub)
  await fetchClubTribeApplyStatus()

  loading.value = true
  try {
    const response = await postOrgClubSearchByIdApi({
      club_random_id: currentClub.random_id,
    })

    if (response.code !== 0 || !response.data) {
      showFailToast(response.msg || '获取俱乐部详情失败')
      return
    }

    clubDetail.value = response.data
    userInfoStore.setCurrentClub(response.data)
    // userInfoStore.syncCurrentClubFields(response.data)
    clubAvatarUrl.value = response.data.logo || ''
    updateSwitchesByClubData(response.data)
    await fetchClubTribeApplyStatus()
  } catch (error) {
    console.error('refreshClubDetail error', error)
    showFailToast('获取俱乐部详情失败')
  } finally {
    loading.value = false
  }
}

function goEditDescription(): void {
  if (!isFounder.value) {
    showFailToast('仅创始人可修改')
    return
  }

  void router.push('/club/edit-description')
}

function goEditName(): void {
  if (!isFounder.value) {
    showFailToast('仅创始人可修改')
    return
  }

  void router.push('/club/edit-name')
}

function onQuickAction(actionId: number): void {
  if (actionId === 1) {
    showFailToast('功能开发中')
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

  if (item.label === '邀请分享') {
    showInvitePopup.value = true
    return
  }

  if (item.label === '复制俱乐部') {
    if (!canManageClub.value) {
      showFailToast('暂无权限')
      return
    }

    showCopyPopup.value = true
    return
  }

  if (item.label === '下线成员') {
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
    showFailToast('仅创始人可修改')
    return
  }

  const clubId = Number(displayClub.value?.club_id)
  if (!clubId) {
    showFailToast('俱乐部信息异常')
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
    const message = error instanceof Error ? error.message : '更新失败'
    showFailToast(message)
  }
}

async function updateClubLogo(newLogoUrl: string): Promise<void> {
  if (!isFounder.value) {
    showFailToast('仅创始人可修改')
    return
  }
  const clubId = Number(displayClub.value?.club_id)
  if (!clubId) {
    showFailToast('俱乐部信息异常')
    return
  }
  loading.value = true
  try {
    const response = await postOrgChangeClubDataApi({
      club_id: clubId,
      logo: newLogoUrl,
    })
    if (response.code !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : '更新失败')
    }
    if (displayClub.value) {
      const merged = {
        ...displayClub.value,
        logo: newLogoUrl,
      }
      clubDetail.value = merged
      userInfoStore.setCurrentClub(merged)
    }
    showSuccessToast('修改头像成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败'
    showFailToast(message)
  } finally {
    loading.value = false
  }
}

function closeInvitePopup(): void {
  showInvitePopup.value = false
}

function closeCopyPopup(): void {
  showCopyPopup.value = false
}

async function downloadBlob(blob: Blob, fileName: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName
    link.click()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function saveInviteShare(): Promise<void> {
  if (savingInviteShare.value) {
    return
  }

  if (!inviteModalRef.value) {
    showFailToast('分享弹窗未准备好')
    return
  }

  savingInviteShare.value = true
  try {
    await nextTick()
    const actionsEl = document.getElementById('invite-modal-actions')
    if (actionsEl) {
      actionsEl.style.display = 'none'
    }
    const canvas = await html2canvas(inviteModalRef.value, {
      useCORS: true,
      backgroundColor: null,
      logging: false,
      scale: Math.min(window.devicePixelRatio || 1, 3),
    })

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 1)
    })

    if (blob) {
      await downloadBlob(blob, `club-invite-${displayClub.value?.random_id || Date.now()}.jpg`)
    } else {
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/jpeg')
      link.download = `club-invite-${displayClub.value?.random_id || Date.now()}.jpg`
      link.click()
    }

    showSuccessToast('已保存图片')
    closeInvitePopup()
  } catch (error) {
    console.error('saveInviteShare error', error)
    showFailToast('保存图片失败')
  } finally {
    savingInviteShare.value = false
  }
}

async function saveInviteQr(): Promise<void> {
  if (savingInviteQr.value) return
  const qrUrl = imgInviteQr.value
  if (!qrUrl) {
    showFailToast('二维码未生成')
    return
  }
  savingInviteQr.value = true
  try {
    const response = await fetch(qrUrl)
    const blob = await response.blob()
    await downloadBlob(blob, `club-qr-${displayClub.value?.random_id || Date.now()}.png`)
    showSuccessToast('已保存二维码')
  } catch (error) {
    console.error('saveInviteQr error', error)
    showFailToast('保存二维码失败')
  } finally {
    savingInviteQr.value = false
  }
}

async function submitCopyRequest(): Promise<void> {
  if (!isFounder.value) {
    showFailToast('仅创始人可操作')
    return
  }

  try {
    const response = await postOrgClubCloneApplyApi({
      club_id: displayClub.value?.club_id,
    })

    if (response.code !== 0) {
      const fallback = t('ClubCopy_' + response.code) ?? response.msg
      throw new Error(typeof fallback === 'string' ? fallback : '复制失败')
    }
    showSuccessToast('已提交复制申请')
  } catch (error) {
    const message = error instanceof Error ? error.message : '复制失败'
    showFailToast(message)
  }
  closeCopyPopup()
}

async function onDeleteClub(): Promise<void> {
  if (!isFounder.value) {
    showFailToast('仅创始人可操作')
    return
  }

  try {
    const response = await postOrgClubDisbandApi({})

    if (response.code !== 0) {
      const fallback = (response.msg ?? response.message) as unknown
      throw new Error(typeof fallback === 'string' ? fallback : '删除失败')
    }
    showSuccessToast('已删除俱乐部')
    setTimeout(() => {
      void router.replace('/club')
    }, 1000)
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除失败'
    showFailToast(message)
  }
}

async function prefetchAgentInvitationLink(): Promise<void> {
  if (!isAgent.value) {
    return
  }

  const currentClub = displayClub.value
  if (!currentClub?.random_id) {
    return
  }

  const cached = userInfoStore.getClubAgentInvitation(currentClub.random_id)
  if (cached) {
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
      return
    }

    const invitationLink = extractInvitationLink(response.data)
    if (!invitationLink && !isChannelPackage) {
      return
    }

    const finalLink = invitationLink

    if (!finalLink) {
      return
    }

    userInfoStore.setClubAgentInvitation(currentClub.random_id, finalLink)
  } catch (error) {
    console.error('prefetchAgentInvitationLink error', error)
  }
}

async function generateInviteQrCode(): Promise<void> {
  const currentClub = displayClub.value
  if (!currentClub?.club_id) {
    return
  }

  try {
    const response = await postOrgClubInviTationApi({
      club_id: currentClub.club_id,
    })

    if (response.code !== 0) {
      console.error('generateInviteQrCode API error', response.msg)
      return
    }

    const inviteCode = extractInvitationCode(response.data)
    const finalLink = isChannelPackage
      ? buildChannelClubInviteUrl(inviteCode)
      : buildChannelRegisterUrl({ inviteCode })

    if (!finalLink) {
      return
    }

    imgInviteQr.value = await generateQrCodeUrl(finalLink, { size: 720, margin: 2 })
  } catch (error) {
    console.error('generateInviteQrCode error', error)
  }
}

onMounted(async () => {
  await refreshClubDetail()
  await prefetchAgentInvitationLink()
  await generateInviteQrCode()
})
</script>

<template>
  <div class="page-shell club-detail-bg" :style="backgroundStyle">
    <HeaderBack :title="'俱乐部管理'" />

    <div v-loading="loading" class="club-detail">
      <section class="club-header-card">
        <div class="club-header-main">
          <div class="club-avatar-wrap">
            <img class="club-avatar" :src="displayClub?.logo || imgClubCover" alt="俱乐部头像" />
            <ImageUploadSheet
              v-if="isFounder"
              :model-value="displayClub?.logo"
              @update:model-value="updateClubLogo"
            >
              <template #default="{ open }">
                <button
                  type="button"
                  class="avatar-edit-btn"
                  aria-label="修改俱乐部头像"
                  @click="open"
                >
                  <img class="add-badge" :src="imgAvatarAdd" alt="添加" aria-hidden="true" />
                </button>
              </template>
            </ImageUploadSheet>
          </div>

          <div class="club-summary">
            <button type="button" class="club-name-edit" @click="goEditName">
              <h1 class="club-name">{{ displayClub?.club_name || '俱乐部名称' }}</h1>
            </button>
            <div class="club-id-row">
              <span class="id-tag">ID</span>
              <span class="id-text">{{ displayClub?.random_id || '--' }}</span>
            </div>

            <p class="metric-line">
              <img :src="imgChips" alt="" aria-hidden="true" />
              <span>{{ formatCount(displayClub?.user_gold) }}</span>
            </p>
            <p class="metric-line">
              <img :src="imgDiamond" alt="" aria-hidden="true" />
              <span>{{ formatCount(displayClub?.user_credit) }}</span>
            </p>
          </div>
        </div>

        <div class="club-size-pill" aria-label="俱乐部人数">
          <span class="size-text">
            {{ displayClub?.club_members || 0 }}
          </span>
          <div class="size-icon-wrap">
            <img :src="imgPeople" alt="" aria-hidden="true" />
          </div>
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
          <span class="quick-image-wrap" :class="['quick-image-wrap--' + item.id]">
            <img :src="item.cover" :alt="item.title" />
          </span>
          <span class="quick-title">{{ item.title }}</span>
        </button>
      </section>

      <section class="intro-card">
        <span>俱乐部简介</span>
        <button
          v-if="isFounder"
          type="button"
          class="intro-edit"
          aria-label="编辑俱乐部简介"
          @click="goEditDescription"
        >
          <span class="edit-pen">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
            >
              <path
                d="M7.1838 0.371378L6.22515 1.33003L8.80004 3.90492L9.75869 2.94627C10.2539 2.4511 10.2539 1.64892 9.75869 1.15375L8.9783 0.371378C8.48313 -0.123793 7.68095 -0.123793 7.18578 0.371378H7.1838ZM5.77751 1.77766L1.16054 6.39662C0.954552 6.60261 0.80402 6.85811 0.720831 7.13739L0.0196696 9.52015C-0.0298475 9.68851 0.0157082 9.86875 0.138511 9.99156C0.261313 10.1144 0.441555 10.1599 0.607932 10.1124L2.99069 9.41121C3.26997 9.32803 3.52548 9.17749 3.73147 8.9715L8.3524 4.35255L5.77751 1.77766Z"
                fill="white"
              />
            </svg>
          </span>
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
                alt="创始人头像"
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
                  {{ tribeApplying ? '申请中' : '申请加入' }}
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
        <PrimaryButton text="删除俱乐部" class="danger-btn" @click="onDeleteClub" />
      </section>
    </div>

    <div v-if="showInvitePopup" class="club-modal-mask" @click="closeInvitePopup">
      <section ref="inviteModalRef" class="invite-modal" @click.stop>
        <header class="invite-modal__head">
          <h3>邀请链接</h3>
          <button
            type="button"
            class="invite-modal__close"
            aria-label="关闭"
            @click="closeInvitePopup"
          >
            <img :src="imgModalClose" alt="" aria-hidden="true" />
          </button>
        </header>

        <div class="invite-modal__body">
          <p class="invite-modal__subtitle">加入小鱼扑克，开启你的竞技之旅</p>
          <div class="invite-modal__cover-wrap">
            <img class="invite-modal__cover" :src="imgInviteCover" alt="邀请海报" />
            <!-- <img class="invite-modal__cover-subtract" :src="imgInviteSubtract" alt="" aria-hidden="true" /> -->
          </div>
          <div class="invite-modal__club-info">
            <p class="invite-modal__club-name">{{ clubName }}</p>
            <p class="invite-modal__club-alias">{{ clubAlias }}</p>
            <p class="invite-modal__id-row">
              <span class="invite-modal__id-tag">ID</span>
              <span>{{ clubId }}</span>
            </p>
          </div>
        </div>

        <div class="invite-modal__qr-wrap">
          <img class="invite-modal__qr" :src="imgInviteQr" alt="扫码加入俱乐部" />
        </div>
        <p class="invite-modal__qr-tip">扫描二维码，一键开启</p>

        <div id="invite-modal-actions" class="invite-modal__actions">
          <button
            type="button"
            class="invite-modal__btn invite-modal__btn--secondary"
            :disabled="savingInviteQr"
            @click="saveInviteQr"
          >
            {{ savingInviteQr ? '保存中...' : '保存二维码' }}
          </button>
          <button
            type="button"
            class="invite-modal__btn invite-modal__btn--primary"
            :disabled="savingInviteShare"
            @click="saveInviteShare"
          >
            {{ savingInviteShare ? '保存中...' : '保存图片' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="showCopyPopup" class="club-modal-mask" @click="closeCopyPopup">
      <section class="copy-modal" @click.stop>
        <p>申请复制俱乐部需要等待审核，是否现在提交申请</p>
        <div class="copy-modal__actions">
          <button type="button" class="modal-secondary-btn" @click="closeCopyPopup">取消</button>
          <button type="button" class="modal-primary-btn" @click="submitCopyRequest">确定</button>
        </div>
      </section>
    </div>

    <div v-if="showTribeSearchPopup" class="club-modal-mask" @click="closeTribeSearchPopup">
      <section class="tribe-search-modal" @click.stop>
        <div class="tribe-apply-card">
          <h3 class="tribe-apply-title">搜索联盟</h3>

          <div class="tribe-search-shell" aria-label="联盟搜索">
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
                placeholder="请输入联盟ID"
                @focus="openTribeIdKeypad"
                @click="openTribeIdKeypad"
              />
            </label>
          </div>
        </div>

        <div class="join-modal-actions">
          <button
            type="button"
            class="join-modal-btn join-modal-btn--cancel"
            @click="closeTribeSearchPopup"
          >
            取消
          </button>
          <button
            type="button"
            class="join-modal-btn join-modal-btn--confirm"
            :disabled="tribeApplySubmitting"
            @click="submitTribeApply"
          >
            {{ tribeApplySubmitting ? '搜索中' : '确认' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="showTribeApplyPopup" class="club-modal-mask" @click="closeTribeApplyPopup">
      <section class="join-modal" @click.stop>
        <div class="join-modal-card">
          <img class="join-modal-logo" :src="searchedTribe?.logo || imgClubCover" alt="联盟头像" />
          <h3 class="join-modal-name">{{ searchedTribe?.name || '联盟名称' }}</h3>
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
              placeholder="请输入联系方式"
              @input="onTribeContactInput"
            />
          </div>
        </div>

        <div class="join-modal-actions">
          <button
            type="button"
            class="join-modal-btn join-modal-btn--cancel"
            @click="closeTribeApplyPopup"
          >
            取消
          </button>
          <button
            type="button"
            class="join-modal-btn join-modal-btn--confirm"
            :disabled="tribeApplySubmitting"
            @click="confirmTribeApply"
          >
            {{ tribeApplySubmitting ? '提交中' : '加入' }}
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="showCancelTribeApplyPopup"
      class="club-modal-mask"
      @click="closeCancelTribeApplyPopup"
    >
      <section class="copy-modal" @click.stop>
        <p>当前申请正在审核中，是否取消申请？</p>
        <div class="copy-modal__actions">
          <button type="button" class="modal-secondary-btn" @click="closeCancelTribeApplyPopup">
            返回
          </button>
          <button
            type="button"
            class="modal-primary-btn"
            :disabled="cancelTribeApplyLoading"
            @click="cancelTribeApply"
          >
            {{ cancelTribeApplyLoading ? '取消中...' : '取消申请' }}
          </button>
        </div>
      </section>
    </div>

    <NumericKeypad
      :open="tribeIdKeypadOpen"
      :min="0"
      :max="9999999999"
      :max-length="10"
      :initial-value="tribeApplyIdInput"
      :show-input-area="true"
      :allow-leading-zero="true"
      title="联盟ID"
      confirm-text="确定"
      @close="onTribeIdKeypadClose"
      @submit="onTribeIdKeypadSubmit"
      @key-press="onTribeIdKeypadKeyPress"
    />
  </div>
</template>

<style scoped lang="scss">
.club-detail-bg {
  height: 100dvh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
  align-items: center;
  justify-content: space-between;
  min-height: 3.08434rem;
  padding: 0 0.55422rem;
  border-radius: 1.004rem;
  background: linear-gradient(
    109.623deg,
    rgba(255, 255, 255, 0.1) 21.106%,
    rgba(230, 230, 230, 0.1) 71.429%
  );
  backdrop-filter: blur(0.2rem);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 1.004rem;
    padding: 1px;
    background: linear-gradient(
      109.623deg,
      rgba(255, 255, 255, 0.15) 21.106%,
      rgba(230, 230, 230, 0.05) 71.429%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.club-header-main {
  display: flex;
  align-items: center;
  gap: 0.28112rem;
  position: relative;
  z-index: 1;
}

.club-avatar-wrap {
  position: relative;
  width: 1.96787rem;
  height: 1.97968rem;
  flex-shrink: 0;
}

.club-avatar {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
}

.avatar-edit-btn {
  position: absolute;
  left: 1.28rem;
  top: 1.29rem;
  width: 0.69rem;
  height: 0.69rem;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  z-index: 2;
}

.add-badge {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
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
  background: linear-gradient(165deg, rgba(85, 243, 41, 1) 10%, rgba(62, 173, 6, 1) 75%);
  color: #fff;
  font-size: 0.45rem;
  line-height: 0.5rem;
  text-align: center;
}

.club-summary {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.08rem;
}

.club-name-edit {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  max-width: 100%;
  text-align: left;
}

.club-name {
  margin: 0;
  color: #f9f9f9;
  font-size: 0.5692rem;
  line-height: 1.2;
  font-weight: 700;
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
  background: rgba(255, 255, 255, 0.4);
}

.id-text {
  font-size: 0.24404rem;
  color: #fff;
  font-weight: 600;
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
}

.metric-line img {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;
}

.club-size-pill {
  flex-shrink: 0;
  height: 0.82731rem;
  padding-left: 0.28112rem;
  padding-right: 0rem;
  border-radius: 0.72289rem;
  display: inline-flex;
  align-items: center;
  gap: 0.05622rem;
  background: rgba(0, 0, 0, 0.2);
  mix-blend-mode: soft-light;
  position: relative;
  z-index: 1;
  margin-top: 1.3rem;
}

.size-text {
  color: #f9f9f9;
  font-size: 0.4739rem;
  line-height: 1;
  font-weight: 500;
}

.size-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  transform: scaleY(-1) rotate(180deg);
}

.club-size-pill img {
  width: 0.987rem;
  height: 0.851rem;
  object-fit: contain;
  opacity: 0.94;
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
  gap: 0.186rem;
  color: #f9f9f9;
}

.quick-image-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 0.679rem;
  border: 0.0128rem solid rgba(255, 255, 255, 0.4);
  overflow: hidden;
  box-shadow:
    inset 0 0.06rem 0.12rem rgba(255, 255, 255, 0.5),
    inset 0 -0.06rem 0.12rem rgba(0, 0, 0, 0.4);
}

.quick-image-wrap--1 {
  background: linear-gradient(180deg, #51b7ff 0%, #1257a6 100%);
}

.quick-image-wrap--2 {
  background: linear-gradient(180deg, #fa4356 0%, #a60d1e 100%);
}

.quick-image-wrap--3 {
  background: linear-gradient(180deg, #e78c24 0%, #943f07 100%);
}

.quick-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quick-title {
  font-size: 0.295rem;
  line-height: 1.2;
  font-weight: 510;
  text-shadow: 0px 0.0338rem 0.253rem rgba(0, 0, 0, 0.4);
  text-align: center;
}

.intro-card {
  position: relative;
  min-height: 1.51964rem;
  padding: 0.34538rem 0.41767rem 0.34538rem 0.55422rem;
  border-radius: 0.72289rem;
  background: linear-gradient(
    125.866deg,
    rgba(255, 255, 255, 0.1) 21.106%,
    rgba(230, 230, 230, 0.1) 71.429%
  );
  backdrop-filter: blur(0.12rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #f1f1f1;
  font-size: 0.40524rem;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 0.72289rem;
    padding: 1px;
    background: linear-gradient(
      125.866deg,
      rgba(255, 255, 255, 0.15) 21.106%,
      rgba(230, 230, 230, 0.05) 71.429%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.intro-edit {
  border: 0;
  width: 0.67539rem;
  height: 0.67539rem;
  border-radius: 0.435rem;
  background: #fa2b4b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.edit-pen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.28141rem; /* 10.553px */
  height: 0.28141rem; /* 10.553px */
}

.edit-pen svg {
  width: 100%;
  height: 100%;
  display: block;
}

.settings-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.28916rem;
  padding: 0.34538rem 0.41767rem;
  border-radius: 0.72289rem;
  background: linear-gradient(
    99.0166deg,
    rgba(255, 255, 255, 0.1) 21.106%,
    rgba(230, 230, 230, 0.1) 71.429%
  );
  backdrop-filter: blur(0.15rem);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 0.72289rem;
    padding: 1px;
    background: linear-gradient(
      99.0166deg,
      rgba(255, 255, 255, 0.15) 21.106%,
      rgba(230, 230, 230, 0.05) 71.429%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
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
}

.tribe-apply-btn {
  border: 0;
  min-height: 0.58rem;
  padding: 0 0.24rem;
  border-radius: 999px;
  color: #fff;
  font-size: 0.28rem;
  font-weight: 500;
  background: #fa2b4b;
}

.tribe-apply-btn--pending {
  background: rgba(255, 255, 255, 0.22);
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
  color: rgba(228, 228, 228, 0.5);
  font-size: 0.40524rem;
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
}

.level-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.083rem 0.2492rem;
  border-radius: 999px;
  font-size: 0.27857rem;
  font-weight: 700;
  color: #f9f9f9;
  background: #fa2b4b;
}

.switch {
  width: 1.756rem;
  height: 0.82747rem;
  border: 0;
  padding: 0.04rem;
  border-radius: 999px;
  background: #c1c1c1;
  display: inline-flex;
  align-items: center;
}

.switch--on {
  justify-content: flex-end;
  background: #fa2b4b;
}

.switch:not(.switch--on) {
  justify-content: flex-start;
  background: #c1c1c1;
}

.switch-knob {
  width: 0.667rem;
  height: 0.667rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0.02rem 0.04rem rgba(0, 0, 0, 0.22);
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
}

.danger-zone {
  margin-top: 0.40524rem;
  // padding: 0 0.55422rem 0.6rem;
}

.danger-btn {
  background: linear-gradient(
    97deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  ) !important;
  // color: #fa2b4b !important;
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.8;
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
}

.invite-modal,
.copy-modal {
  width: min(9.1rem, 100%);
  border-radius: 0.97035rem;
  border: 0.0255rem solid rgba(242, 242, 242, 0.4);
  background: linear-gradient(121deg, rgba(0, 0, 0, 0.2) 3%, rgba(0, 0, 0, 0.38) 89%);
  backdrop-filter: blur(0.20216rem);
  box-shadow:
    0 0 0.22981rem rgba(0, 0, 0, 0.85) inset,
    0.05672rem 0.11344rem 0.45908rem rgba(242, 242, 242, 0.5) inset,
    0.09192rem 0.11491rem 0.18384rem rgba(0, 0, 0, 0.28);
  color: #f9f9f9;
}

.tribe-search-modal {
  width: min(8.8rem, 100%);
  border-radius: 0.97035rem;
  border: 0.0255rem solid rgba(242, 242, 242, 0.4);
  background: linear-gradient(121deg, rgba(0, 0, 0, 0.2) 3%, rgba(0, 0, 0, 0.38) 89%);
  backdrop-filter: blur(1.20216rem);
  box-shadow:
    0 0 0.22981rem rgba(0, 0, 0, 0.85) inset,
    0.05672rem 0.11344rem 0.45908rem rgba(242, 242, 242, 0.5) inset,
    0.09192rem 0.11491rem 0.18384rem rgba(0, 0, 0, 0.28);
  color: #f9f9f9;
  padding: 0.42rem;
}

.join-modal {
  width: min(8.454rem, 100%);
  max-width: 100%;
  padding: 0.42rem;
  border-radius: 0.97rem;
  border: 0.025rem solid rgba(255, 255, 255, 0.38);
  background:
    linear-gradient(126deg, rgba(142, 142, 142, 0.6) 0%, rgba(72, 72, 72, 0.92) 100%),
    rgba(30, 30, 30, 0.65);
  box-shadow:
    0.09rem 0.11rem 0.18rem rgba(0, 0, 0, 0.25),
    inset 0.05rem 0.1rem 0.4rem rgba(242, 242, 242, 0.25),
    inset 0 0 0.23rem rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(0.4rem);
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

.join-modal-actions {
  margin-top: 0.48rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
}

.join-modal-btn {
  flex: 1;
  min-height: 1.436rem;
  border-radius: 1.055rem;
  border: 0;
  color: #fff;
  font-family: 'Afacad', 'PingFang SC', sans-serif;
  font-size: 0.4rem;
  font-weight: 500;
}

.join-modal-btn--cancel {
  background: rgba(0, 0, 0, 0.3);
}

.join-modal-btn--confirm {
  background: linear-gradient(180deg, rgba(85, 243, 41, 1) 0%, rgba(62, 173, 6, 1) 100%);
  border: 0.013rem solid rgba(255, 255, 255, 0.5);
}

.join-modal-btn:disabled {
  opacity: 0.72;
}

.tribe-apply-card {
  border-radius: 0.834rem;
  border: 0.026rem solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  padding: 0.42rem;
}

.tribe-apply-title {
  margin: 0;
  text-align: center;
  font-size: 0.52rem;
  line-height: 1.2;
  font-weight: 600;
}

.tribe-search-shell {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 1.2rem;
  border-radius: 1rem;
  padding: 0.12rem 0.28rem;
  background: linear-gradient(
    98deg,
    rgba(133, 73, 115, 0.96) 0%,
    rgba(177, 69, 87, 0.96) 44%,
    rgba(178, 76, 51, 0.96) 72%,
    rgba(141, 59, 84, 0.96) 100%
  );
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
  padding: 0.42rem 0.42rem 0.62rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.invite-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.invite-modal__head h3 {
  margin: 0;
  flex: 1;
  text-align: center;
  font-size: 0.41866rem;
  font-weight: 500;
  line-height: 1.4;
  padding-left: 0.48rem;
}

.invite-modal__close {
  width: 0.96rem;
  height: 0.96rem;
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
  padding: 0.347rem 0.42rem 0.178rem;
  border-radius: 0.72464rem;
  background: linear-gradient(
    100.095deg,
    rgba(255, 255, 255, 0.1) 21.1%,
    rgba(230, 230, 230, 0.1) 71.4%
  );
  backdrop-filter: blur(0.151px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3394rem;
}

.invite-modal__subtitle {
  margin: 0;
  font-size: 0.35565rem;
  line-height: 1.35;
}

.invite-modal__cover-wrap {
  width: 100%;
  height: 2.383rem;
  border-radius: 0.726rem;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.invite-modal__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.invite-modal__cover-subtract {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.invite-modal__club-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.invite-modal__club-name {
  margin: 0;
  font-size: 0.35565rem;
  line-height: 1.35;
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
  margin: 0.04rem auto 0;
  border-radius: 0.30747rem;
  background: #fff;
  padding: 0.10667rem;
  border: 0.10067rem solid #00b184;
  overflow: hidden;
}

.invite-modal__qr {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.invite-modal__qr-tip {
  margin: 0;
  text-align: center;
  font-size: 0.314rem;
  font-weight: 500;
  line-height: 1.3;
}

.invite-modal__actions {
  display: flex;
  gap: 0.22rem;
  width: 100%;
}

.invite-modal__btn {
  flex: 1;
  border-radius: 3.345rem;
  font-size: 0.42rem;
  font-weight: 500;
  color: #fff;
  line-height: 1.2;
  padding: 0.4014rem 0.3rem;
}

.invite-modal__btn--secondary {
  background: transparent;
  border: 0.01333rem solid rgba(242, 242, 242, 0.6);
}

.invite-modal__btn--primary {
  background: linear-gradient(
    108.128deg,
    rgba(255, 255, 255, 0.1) 21.1%,
    rgba(230, 230, 230, 0.1) 71.4%
  );
  backdrop-filter: blur(0.5px);
  border: 0.01333rem solid rgba(242, 242, 242, 0.3);
  color: #78e490;
}

.invite-modal__btn:disabled {
  opacity: 0.72;
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
  background: linear-gradient(
    97deg,
    rgba(255, 255, 255, 0.1) 21.11%,
    rgba(230, 230, 230, 0.1) 71.43%
  );
  backdrop-filter: blur(0.16230463981628418px);
  box-shadow: inset 0 -0.16rem 0.3rem rgba(0, 0, 0, 0.14);
}

.modal-primary-btn:disabled {
  opacity: 0.72;
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

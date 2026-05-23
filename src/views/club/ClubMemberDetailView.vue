<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import {
  postDeleleUserApi,
  postLockUserApi,
  postOrgClubAdminPermissionSwitchApi,
  postOrgClubUserInfoApi,
  postOrgClubUserRemaRksApi,
  postOrgClubUserRoleChangeApi,
  postOrgMemberListApi,
  postUnlockUserApi,
} from '@/api/org'
import { postStatsClubDataStatsUserDetailApi } from '@/api/stats'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_balance.png'
import type { OrgClubUserInfoData, OrgMemberListRecord } from '@/api/models/org'
import type { StatsClubDataStatsUserDetailTotalData } from '@/api/models/stats'
import { useUserInfoStore } from '@/stores/userInfo'
import { formatUC } from '@/utils/roomVisibility'
import { getMemberRouteContext, type MemberIdentity } from './clubMemberRoute'
import mainBgUrl from '@/assets/images/main_bg.webp'

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()

const context = computed(() => getMemberRouteContext(route))

type DataGameType = 'all' | 'texas' | 'mahjong' | 'mini'
type DataRangeType = 'today' | 'week' | 'month'
type RoleOption = Exclude<MemberIdentity, 'founder'>
type AdminPermissionKey =
  | 'create_room'
  | 'club_manage'
  | 'member_manage'
  | 'fund_manage'
  | 'get_data'

interface AdminPermissionItem {
  key: AdminPermissionKey
  label: string
  enabled: boolean
}

const ROLE_LABEL_MAP: Record<MemberIdentity, string> = {
  founder: '创始人',
  admin: '管理员',
  agent: '代理',
  player: '成员',
}

const ROLE_LEVEL_MAP: Record<RoleOption, number> = {
  admin: 3,
  agent: 4,
  player: 0,
}

const gameType = ref<DataGameType>('all')
const rangeType = ref<DataRangeType>('today')
const aliasInput = ref('')
const descInput = ref('')
const selectedIdentity = ref<MemberIdentity>(context.value.identity)
const showRolePopup = ref(false)
const popupRole = ref<RoleOption>('player')
const updatingRole = ref(false)
const loadingStats = ref(false)
const statsData = ref<StatsClubDataStatsUserDetailTotalData>({})
const statsByGameType = ref<
  Partial<Record<DataGameType, StatsClubDataStatsUserDetailTotalData | undefined>>
>({})
const loadingMemberProfile = ref(false)
const savingRemark = ref(false)
const processingMemberAction = ref(false)
const savingAdminPermission = ref(false)
const memberProfile = ref<OrgClubUserInfoData | null>(null)
const agentList = ref<OrgMemberListRecord[]>([])

const currentLoginUserLevel = computed(() => Number(userInfoStore.currentClub?.user_level ?? 0))
const currentClubId = computed(() => Number(userInfoStore.currentClub?.club_id ?? 0))
const currentClubRandomId = computed(() => Number(userInfoStore.currentClub?.random_id ?? 0))

const canEditRole = computed(() => {
  return (
    (currentLoginUserLevel.value === 1 ||
      currentLoginUserLevel.value === 2 ||
      currentLoginUserLevel.value === 3) &&
    context.value.identity !== 'founder'
  )
})

const editableRoleOptions = computed<RoleOption[]>(() => {
  if (currentLoginUserLevel.value === 1) {
    return ['admin', 'agent', 'player']
  }

  if (currentLoginUserLevel.value === 2 || currentLoginUserLevel.value === 3) {
    return ['agent', 'player']
  }

  return []
})

const roleLabel = computed(() => ROLE_LABEL_MAP[selectedIdentity.value])
const badgeLabel = computed(() => ROLE_LABEL_MAP[selectedIdentity.value])

const currentAgentId = computed(() => toSafeNumber(memberProfile.value?.agent_user_id))
const currentAgent = computed(() => {
  if (!currentAgentId.value) {
    return null
  }
  return agentList.value.find((item) => toSafeNumber(item.user_id) === currentAgentId.value) || null
})

const currentAgentDisplayName = computed(() => {
  if (!currentAgent.value) {
    return ''
  }
  return String(currentAgent.value.remark_name || currentAgent.value.nick_name || '已绑定代理')
})

const currentAgentDisplayUid = computed(() => {
  if (!currentAgent.value) {
    return ''
  }
  const uid = currentAgent.value.random_num
  return uid !== undefined && uid !== null ? String(uid) : ''
})

const currentAgentAvatar = computed(() => {
  const avatar = currentAgent.value?.avatar
  if (typeof avatar === 'string' && avatar.trim()) {
    return avatar
  }

  return imgAvatar
})

const isMemberFrozen = computed(() => toSafeNumber(memberProfile.value?.freeze_status) > 0)

const statRows = computed(() => [
  { label: '总局数', value: formatCount(statsData.value.game_num) },
  { label: '总手数', value: formatCount(statsData.value.hand_num) },
  { label: '发放UC', value: formatAmount(statsData.value.grant_gold_amount) },
  { label: '回收UC', value: formatAmount(statsData.value.recover_gold_amount) },
  { label: '赢', value: formatAmount(statsData.value.profit) },
  { label: '保险', value: formatAmount(statsData.value.insurance) },
  { label: '服务费', value: formatAmount(statsData.value.fee) },
])

const adminPermissions = ref<AdminPermissionItem[]>([
  { key: 'create_room', label: '创建牌桌', enabled: false },
  { key: 'club_manage', label: '俱乐部管理', enabled: false },
  { key: 'member_manage', label: '会员管理', enabled: false },
  { key: 'fund_manage', label: '基金管理', enabled: false },
  { key: 'get_data', label: '查看数据', enabled: false },
])

const showAgentActions = computed(() => selectedIdentity.value === 'agent')
const showAdminPermissions = computed(
  () => selectedIdentity.value === 'admin' && userInfoStore.currentClub?.user_level === 1,
)
const showBindRow = computed(() => selectedIdentity.value === 'player' && !currentAgentId.value)
const showUnbindRow = computed(
  () => selectedIdentity.value === 'player' && currentAgentId.value > 0,
)
const showBottomAction = computed(() => selectedIdentity.value !== 'founder')

const displayName = computed(() => {
  const userInfo = memberProfile.value?.user_info as Record<string, unknown> | undefined
  const source =
    userInfo?.nickname ||
    userInfo?.nick_name ||
    context.value.name ||
    memberProfile.value?.remark_name ||
    ''
  return String(source || '成员')
})

const displayUid = computed(() => {
  const userInfo = memberProfile.value?.user_info as Record<string, unknown> | undefined
  const raw = userInfo?.random_id || context.value.uid
  return String(raw || '--')
})

const displayAvatar = computed(() => {
  const userInfo = memberProfile.value?.user_info as Record<string, unknown> | undefined
  const avatar = userInfo?.avatar
  if (typeof avatar === 'string' && avatar.trim()) {
    return avatar
  }
  return imgAvatar
})

const assetUc = computed(() => {
  const userInfo = memberProfile.value?.user_info as Record<string, unknown> | undefined
  return toSafeNumber(userInfo?.gold)
})

const assetCredit = computed(() => toSafeNumber(memberProfile.value?.club_gold_credit))

const assetDiamond = computed(() => {
  return toSafeNumber(context.value.diamonds)
})

function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') {
      const text = value.trim()
      if (text) {
        return text
      }
    }
  }

  return ''
}

function formatCount(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return '0'
  }

  return Math.floor(num).toLocaleString('en-US')
}

function formatAmount(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return '0'
  }

  return formatUC(num)
}

function getMemberId(): number {
  const raw = Number(context.value.memberId)
  return Number.isFinite(raw) ? raw : 0
}

function mapUserLevelToIdentity(level: unknown): MemberIdentity {
  const userLevel = toSafeNumber(level)
  if (userLevel === 1) {
    return 'founder'
  }
  if (userLevel === 2 || userLevel === 3) {
    return 'admin'
  }
  if (userLevel === 4) {
    return 'agent'
  }
  return 'player'
}

function resolveFilterTimeValue(type: DataRangeType): number {
  if (type === 'today') {
    return 1
  }

  if (type === 'week') {
    return 7
  }

  return 30
}

function resetAdminPermissions(): void {
  adminPermissions.value = adminPermissions.value.map((item) => ({
    ...item,
    enabled: false,
  }))
}

function applyAdminPermissionsInfo(info: Record<string, unknown> | undefined): void {
  adminPermissions.value = adminPermissions.value.map((item) => ({
    ...item,
    enabled: toSafeNumber(info?.[item.key]) === 1,
  }))
}

function buildAdminPermissionPayload(memberId: number): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    club_id: currentClubId.value,
    user_id: memberId,
  }

  for (const item of adminPermissions.value) {
    payload[item.key] = item.enabled ? 1 : 2
  }

  return payload
}

async function fetchAdminPermissions(): Promise<void> {
  const memberId = getMemberId()
  if (!currentClubId.value || !memberId) {
    resetAdminPermissions()
    return
  }

  try {
    const response = await postOrgClubAdminPermissionSwitchApi({
      club_id: currentClubId.value,
      user_id: memberId,
      create_room: 0,
      club_manage: 0,
      member_manage: 0,
      fund_manage: 0,
      get_data: 0,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取管理员权限失败')
    }

    const info = response.data?.info as Record<string, unknown> | undefined
    applyAdminPermissionsInfo(info)
  } catch (error) {
    resetAdminPermissions()
    const message = error instanceof Error ? error.message : '获取管理员权限失败'
    showFailToast(message)
  }
}

function syncStatsByGameType(): void {
  const selected = statsByGameType.value[gameType.value] || statsByGameType.value.all || {}
  statsData.value = selected
}

async function fetchStats(): Promise<void> {
  const memberId = getMemberId()
  if (!memberId) {
    statsByGameType.value = { all: {} }
    syncStatsByGameType()
    return
  }

  loadingStats.value = true
  try {
    const response = await postStatsClubDataStatsUserDetailApi({
      user_id: memberId,
      filter_type: 2,
      filter_time: resolveFilterTimeValue(rangeType.value),
      time_zone: Number(userInfoStore.currentClub?.time_zone ?? 0),
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取统计数据失败')
    }

    const data = response.data || {}
    statsByGameType.value = {
      all: data.stats_all,
      texas: data.stats_nlh,
      mahjong: data.stats_plo,
      mini: data.stats_6,
    }
    syncStatsByGameType()
  } catch (error) {
    statsByGameType.value = { all: {} }
    syncStatsByGameType()
    const message = error instanceof Error ? error.message : '获取统计数据失败'
    showFailToast(message)
  } finally {
    loadingStats.value = false
  }
}

async function fetchMemberProfile(): Promise<void> {
  const memberId = getMemberId()
  if (!memberId || !currentClubId.value) {
    return
  }

  loadingMemberProfile.value = true
  try {
    const queryUid = toSafeNumber(context.value.uid)
    const response = await postOrgClubUserInfoApi({
      club_id: currentClubId.value,
      user_id: memberId,
      user_random_id: queryUid || undefined,
    })

    if (response.code !== 0 || !response.data) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取成员详情失败')
    }

    memberProfile.value = response.data
    selectedIdentity.value = mapUserLevelToIdentity(response.data.user_level)
    const profile = response.data as Record<string, unknown>
    const userInfo = profile.user_info as Record<string, unknown> | undefined

    aliasInput.value = pickString(response.data.remark_name, userInfo?.remark_name)
    descInput.value = pickString(response.data.remark_desc, userInfo?.remark_desc)

    if (showAdminPermissions.value) {
      await fetchAdminPermissions()
    } else {
      resetAdminPermissions()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取成员详情失败'
    showFailToast(message)
  } finally {
    loadingMemberProfile.value = false
  }
}

async function fetchAgentList(): Promise<void> {
  if (!currentClubRandomId.value) {
    agentList.value = []
    return
  }

  try {
    const response = await postOrgMemberListApi({
      club_id: currentClubId.value,
      club_random_id: currentClubRandomId.value,
      user_type: 4,
      sort_type: 8,
      order_type: 2,
      limit: 200,
      offset: 0,
      gold_type: 0,
      simple: true,
      hide_slave: true,
    })

    if (response.code !== 0 || !response.data) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '获取代理列表失败')
    }

    agentList.value = Array.isArray(response.data.data) ? response.data.data : []
  } catch (error) {
    agentList.value = []
    const message = error instanceof Error ? error.message : '获取代理列表失败'
    showFailToast(message)
  }
}

function switchGameType(type: DataGameType): void {
  gameType.value = type
  syncStatsByGameType()
}

function switchRangeType(type: DataRangeType): void {
  if (rangeType.value === type) {
    return
  }

  rangeType.value = type
  void fetchStats()
}

function openRolePopup(): void {
  if (!canEditRole.value || !editableRoleOptions.value.length || updatingRole.value) {
    return
  }

  popupRole.value =
    selectedIdentity.value === 'admin' || selectedIdentity.value === 'agent'
      ? selectedIdentity.value
      : 'player'
  showRolePopup.value = true
}

async function onConfirmRole(): Promise<void> {
  const nextRole = popupRole.value
  showRolePopup.value = false
  if (updatingRole.value || selectedIdentity.value === nextRole) {
    return
  }

  const memberId = getMemberId()
  if (!currentClubId.value || !memberId) {
    showFailToast('缺少俱乐部或成员信息')
    return
  }

  updatingRole.value = true
  try {
    const response = await postOrgClubUserRoleChangeApi({
      club_id: currentClubId.value,
      user_id: memberId,
      user_level: ROLE_LEVEL_MAP[nextRole],
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '修改成员角色失败')
    }

    selectedIdentity.value = nextRole
    showSuccessToast('成员角色修改成功')

    if (nextRole === 'admin') {
      await fetchAdminPermissions()
    } else {
      resetAdminPermissions()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '修改成员角色失败'
    showFailToast(message)
  } finally {
    updatingRole.value = false
  }
}

async function onSaveRemark(): Promise<void> {
  const memberId = getMemberId()
  if (!currentClubId.value || !memberId) {
    showFailToast('缺少俱乐部或成员信息')
    return
  }

  savingRemark.value = true
  try {
    const response = await postOrgClubUserRemaRksApi({
      club_id: currentClubId.value,
      user_id: memberId,
      remark_name: aliasInput.value.trim(),
      remark_desc: descInput.value.trim(),
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '保存备注失败')
    }

    if (memberProfile.value) {
      memberProfile.value = {
        ...memberProfile.value,
        remark_name: aliasInput.value.trim(),
        remark_desc: descInput.value.trim(),
      }
    }
    showSuccessToast('备注已保存')
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存备注失败'
    showFailToast(message)
  } finally {
    savingRemark.value = false
  }
}

function pushWithContext(path: string, extraQuery: Record<string, string> = {}): void {
  void router.push({
    path,
    query: {
      identity: selectedIdentity.value,
      bound: currentAgentId.value > 0 ? '1' : '0',
      name: displayName.value,
      uid: displayUid.value,
      ...extraQuery,
    },
  })
}

function onActionClick(key: string): void {
  const memberId = context.value.memberId

  if (key === 'profit') {
    pushWithContext(`/club/member/${memberId}/agent-profit`)
    return
  }

  if (key === 'offline') {
    pushWithContext(`/club/member/${memberId}/offline-players`)
    return
  }

  if (key === 'vip') {
    pushWithContext(`/club/member/${memberId}/vip-statistics`)
    return
  }

  if (key === 'bind') {
    pushWithContext(`/club/member/${memberId}/bind-agent`)
    return
  }

  if (key === 'unbind') {
    pushWithContext(`/club/member/${memberId}/unbind-agent`, {
      aid: String(currentAgentId.value || ''),
      aname: currentAgentDisplayName.value,
      auid: currentAgentDisplayUid.value,
    })
    return
  }

  if (key === 'records') {
    pushWithContext(`/club/member/${memberId}/vip-statistics`)
  }
}

async function togglePermission(index: number): Promise<void> {
  const memberId = getMemberId()
  if (!currentClubId.value || !memberId || savingAdminPermission.value) {
    return
  }

  const target = adminPermissions.value[index]
  if (!target) {
    return
  }

  const nextEnabled = !target.enabled
  const payload = buildAdminPermissionPayload(memberId)
  payload[target.key] = nextEnabled ? 1 : 2

  savingAdminPermission.value = true
  try {
    const response = await postOrgClubAdminPermissionSwitchApi(payload)

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '保存管理员权限失败')
    }

    adminPermissions.value[index].enabled = nextEnabled
    showSuccessToast('权限已更新')
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存管理员权限失败'
    showFailToast(message)
  } finally {
    savingAdminPermission.value = false
  }
}

async function onKickMember(): Promise<void> {
  const memberId = getMemberId()
  if (!currentClubId.value || !memberId || processingMemberAction.value) {
    return
  }

  processingMemberAction.value = true
  try {
    const response = await postDeleleUserApi({
      club_id: currentClubId.value,
      user_id: memberId,
    })

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '踢出失败')
    }

    showSuccessToast('已踢出成员')
    void router.back()
  } catch (error) {
    const message = error instanceof Error ? error.message : '踢出失败'
    showFailToast(message)
  } finally {
    processingMemberAction.value = false
  }
}

async function onToggleFreeze(): Promise<void> {
  const memberId = getMemberId()
  if (!currentClubId.value || !memberId || processingMemberAction.value) {
    return
  }

  processingMemberAction.value = true
  try {
    let response
    if (isMemberFrozen.value) {
      response = await postUnlockUserApi({
        club_id: currentClubId.value,
        user_id: memberId,
      })
    } else {
      response = await postLockUserApi({
        club_id: currentClubId.value,
        user_id: memberId,
      })
    }

    if (response.code !== 0) {
      throw new Error(typeof response.msg === 'string' ? response.msg : '操作失败')
    }

    showSuccessToast(isMemberFrozen.value ? '已解冻成员' : '已冻结成员')
    await fetchMemberProfile()
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    showFailToast(message)
  } finally {
    processingMemberAction.value = false
  }
}

onMounted(() => {
  void Promise.all([fetchStats(), fetchMemberProfile(), fetchAgentList()])
})
</script>

<template>
  <div class="page-shell member-detail-bg" :style="backgroundStyle">
    <HeaderBack :title="'成员详情'" />
    <div class="member-detail-page">
      <section class="glass-card profile-card">
        <div class="profile-left">
          <img class="avatar" :src="displayAvatar" :alt="`${displayName}头像`" />
          <div>
            <p class="name">{{ displayName }}</p>
            <p class="uid-line"><span>ID</span>{{ displayUid }}</p>
            <p class="badge">{{ badgeLabel }}</p>
          </div>
        </div>
        <div class="asset-stack">
          <p>
            <span>{{ formatAmount(assetUc) }}</span>
            <img :src="imgChips" alt="" />
          </p>
          <p>
            <span>{{ formatAmount(assetCredit) }}</span>
            <img :src="imgBalance" alt="" />
          </p>
          <p>
            <span>{{ formatCount(assetDiamond) }}</span>
            <img :src="imgDiamond" alt="" />
          </p>
        </div>
      </section>

      <section class="glass-card role-card">
        <span>成员角色</span>
        <button
          type="button"
          class="role-trigger"
          :disabled="!canEditRole || !editableRoleOptions.length || updatingRole"
          @click="openRolePopup"
        >
          <span>{{ roleLabel }}</span>
          <span
            v-if="canEditRole && editableRoleOptions.length"
            class="role-arrow"
            aria-hidden="true"
          ></span>
        </button>
      </section>

      <section class="glass-card form-card">
        <label>
          <span>备注</span>
          <input v-model="aliasInput" type="text" placeholder="此处输入" />
        </label>
        <label>
          <span>注释</span>
          <input v-model="descInput" type="text" placeholder="此处输入" />
        </label>
        <button
          type="button"
          class="remark-save-btn"
          :disabled="savingRemark"
          @click="onSaveRemark"
        >
          保存备注
        </button>
      </section>

      <section class="glass-card stat-head-card">
        <div class="stat-head-top">
          <strong>数据统计</strong>
        </div>
        <div class="pill-tabs">
          <button :class="{ active: gameType === 'all' }" @click="switchGameType('all')">
            全部
          </button>
          <button :class="{ active: gameType === 'texas' }" @click="switchGameType('texas')">
            德州
          </button>
          <button :class="{ active: gameType === 'mahjong' }" @click="switchGameType('mahjong')">
            麻将
          </button>
          <button :class="{ active: gameType === 'mini' }" @click="switchGameType('mini')">
            小游戏
          </button>
        </div>
      </section>

      <section class="pill-tabs range-tabs">
        <button :class="{ active: rangeType === 'today' }" @click="switchRangeType('today')">
          今天
        </button>
        <button :class="{ active: rangeType === 'week' }" @click="switchRangeType('week')">
          7天
        </button>
        <button :class="{ active: rangeType === 'month' }" @click="switchRangeType('month')">
          30天
        </button>
      </section>

      <section class="stat-list">
        <p v-if="loadingStats" class="stats-loading">加载中...</p>
        <article v-for="row in statRows" :key="row.label" class="stat-row glass-card">
          <span>{{ row.label }}</span>
          <span>{{ row.value }}</span>
        </article>
      </section>

      <section v-if="showAgentActions" class="glass-card link-list">
        <button class="link-item" @click="onActionClick('offline')">
          下线成员总数 <span class="friend-total">{{ memberProfile?.friend_total }}</span>
          <span class="arrow"></span>
        </button>
        <button class="link-item" @click="onActionClick('vip')">
          代理统计 <span class="arrow"></span>
        </button>
        <button class="link-item" @click="onActionClick('profit')">
          代理收益设置 <span class="arrow"></span>
        </button>
      </section>

      <section v-if="showBindRow" class="glass-card link-list">
        <button class="link-item" @click="onActionClick('bind')">
          未绑定 <span>绑定代理</span>
        </button>
      </section>

      <section v-if="showUnbindRow" class="glass-card bound-row-card">
        <button class="bound-link-item" @click="onActionClick('unbind')">
          <span class="bound-left">
            <img class="bound-agent-avatar" :src="currentAgentAvatar" alt="agent" />
            <span class="bound-agent-info">
              <strong>{{ currentAgentDisplayName || '已绑定代理' }}</strong>
              <span class="bound-agent-id-row">
                <em class="bound-agent-id-tag">ID</em>
                <small>{{ currentAgentDisplayUid || '--' }}</small>
              </span>
            </span>
          </span>
          <span class="bound-right">
            <span class="bound-agent-action">解绑代理</span>
            <span class="bound-agent-arrow" aria-hidden="true"></span>
          </span>
        </button>
      </section>

      <section v-if="showAdminPermissions" class="glass-card switch-list">
        <article v-for="(item, index) in adminPermissions" :key="item.label" class="switch-row">
          <span>{{ item.label }}</span>
          <button
            type="button"
            class="switch"
            :class="{ on: item.enabled }"
            :disabled="savingAdminPermission"
            @click="togglePermission(index)"
          >
            <i></i>
          </button>
        </article>
      </section>

      <footer v-if="showBottomAction" class="bottom-actions">
        <button
          type="button"
          class="btn secondary"
          :disabled="processingMemberAction"
          @click="onKickMember"
        >
          踢出
        </button>
        <button
          type="button"
          class="btn primary"
          :disabled="processingMemberAction"
          @click="onToggleFreeze"
        >
          {{ isMemberFrozen ? '解冻' : '冻结' }}
        </button>
      </footer>
    </div>

    <VanPopup
      v-model:show="showRolePopup"
      round
      position="bottom"
      class="sheet-popup"
      :overlay-style="{ background: 'rgba(12,12,12,0.6)' }"
    >
      <div class="sheet-body">
        <button
          v-for="item in editableRoleOptions"
          :key="item"
          class="sheet-row role-row"
          type="button"
          @click="popupRole = item"
        >
          <span class="radio" :class="{ active: popupRole === item }"></span>
          <span>{{ ROLE_LABEL_MAP[item] }}</span>
        </button>
        <button class="sheet-confirm" type="button" @click="onConfirmRole">确认</button>
      </div>
    </VanPopup>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';

@function figma-rem($px) {
  @return math.div($px, 37.5) * 1rem;
}

.member-detail-bg {
  height: 100dvh;
  background-size: cover;
}

.member-detail-page {
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
  min-height: 100%;
  padding-top: figma-rem(17.244);
}

.glass-card {
  border-radius: figma-rem(17.067);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);
}

.profile-card {
  min-height: figma-rem(131.07);
  padding: figma-rem(4.751) figma-rem(21.854);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-left {
  display: flex;
  align-items: center;
  gap: figma-rem(14.253);
}

.avatar {
  width: figma-rem(65.92);
  height: figma-rem(66.316);
  border-radius: 50%;
  object-fit: cover;
}

.name {
  margin: 0;
  font-size: figma-rem(22.445);
  font-weight: 700;
  color: #fff;
}

.uid-line {
  margin: figma-rem(2) 0;
  display: flex;
  align-items: center;
  gap: figma-rem(2.457);
  color: rgba(255, 255, 255, 0.9);
  font-size: figma-rem(9.623);
}

.uid-line span {
  padding: figma-rem(2.808) figma-rem(4.914);
  border-radius: figma-rem(4.212);
  background: rgba(255, 255, 255, 0.36);
  font-size: figma-rem(8.098);
}

.badge {
  margin: 0;
  font-size: figma-rem(10.5);
  color: #f9f9f9;
}

.asset-stack {
  display: flex;
  flex-direction: column;
  gap: figma-rem(1.584);
  align-items: flex-end;
}

.asset-stack p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: figma-rem(5.07);
  color: #f9f9f9;
  font-size: figma-rem(14.886);
  font-weight: 600;
}

.asset-stack img {
  width: figma-rem(18);
  height: figma-rem(14.44);
}

.role-card {
  min-height: figma-rem(57.01);
  padding: figma-rem(12.952) figma-rem(17.771);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  font-size: figma-rem(15.203);
}

.role-trigger {
  border: 0;
  background: transparent;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: figma-rem(5);
  font-size: figma-rem(15.203);
}

.role-arrow {
  width: figma-rem(6);
  height: figma-rem(6);
  border-right: 1px solid rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.9);
  transform: rotate(45deg);
}

.form-card {
  padding: figma-rem(14.677) figma-rem(20.139);
  display: flex;
  flex-direction: column;
  gap: figma-rem(16.47);
}

.form-card label {
  display: flex;
  flex-direction: column;
  gap: figma-rem(5.741);
  color: #fff;
  font-size: figma-rem(15.203);
  font-weight: 600;
}

.form-card input {
  border: 0;
  border-radius: figma-rem(30);
  min-height: figma-rem(42.124);
  padding: 0 figma-rem(9.568);
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: figma-rem(10.135);
}

.form-card input::placeholder {
  color: rgba(255, 255, 255, 0.72);
}

.remark-save-btn {
  border: 1px solid rgba(242, 242, 242, 0.8);
  border-radius: figma-rem(40.576);
  min-height: figma-rem(42.124);
  color: #fff;
  font-size: figma-rem(14);
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
}

.remark-save-btn:disabled {
  opacity: 0.72;
}

.stat-head-card {
  padding: figma-rem(14.677) figma-rem(20.139);
  display: flex;
  flex-direction: column;
  gap: figma-rem(12.629);
}

.stat-head-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  font-size: figma-rem(15.203);
}

.pill-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: rgba(255, 255, 255, 0.16);
  border-radius: figma-rem(30);
  padding: figma-rem(1.5);
}

.range-tabs {
  grid-template-columns: repeat(3, 1fr);
  min-height: figma-rem(54.16);
}

.pill-tabs button {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: figma-rem(13.574);
  min-height: figma-rem(54.16);
  border-radius: figma-rem(51.915);
}

.pill-tabs button.active {
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: figma-rem(2.534);
}

.stats-loading {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: figma-rem(10.5);
  text-align: right;
}

.stat-row {
  min-height: figma-rem(20.27);
  padding: figma-rem(13.619) figma-rem(16.47);
  border-radius: figma-rem(28.505);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  font-size: figma-rem(11.402);
}

.link-list {
  padding: figma-rem(4);
  display: flex;
  flex-direction: column;
  gap: figma-rem(2);
}

.link-item {
  min-height: figma-rem(42.124);
  border: 0;
  border-radius: figma-rem(30);
  padding: 0 figma-rem(9.568);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: figma-rem(14.569);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bound-row-card {
  border-radius: figma-rem(15.836);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(figma-rem(0.3167));
}

.bound-link-item {
  width: 100%;
  min-height: figma-rem(73.574);
  border: 0;
  border-radius: figma-rem(15.836);
  padding: figma-rem(18.62) figma-rem(16.47) figma-rem(18.62) figma-rem(18.687);
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: figma-rem(9.502);
}

.bound-left {
  display: inline-flex;
  align-items: center;
  gap: figma-rem(8.64);
}

.bound-agent-avatar {
  width: figma-rem(36.118);
  height: figma-rem(36.334);
  border-radius: 50%;
  object-fit: cover;
}

.bound-agent-info {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: figma-rem(4);
}

.bound-agent-info strong {
  font-size: figma-rem(17.742);
  font-weight: 500;
  color: #f3f3f3;
  line-height: figma-rem(19.44);
}

.bound-agent-id-row {
  display: inline-flex;
  align-items: flex-start;
  gap: figma-rem(2.457);
}

.bound-agent-id-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: figma-rem(18.828);
  height: figma-rem(11.616);
  border-radius: figma-rem(4.212);
  padding: figma-rem(2.808) figma-rem(4.914);
  color: #fff;
  font-family: 'SF Pro', var(--font-family-sans);
  font-size: figma-rem(8.098);
  font-style: normal;
  font-weight: 600;
  line-height: 1;
  background: rgba(255, 255, 255, 0.4);
}

.bound-agent-info small {
  font-size: figma-rem(9.623);
  color: rgba(255, 255, 255, 0.7);
  line-height: figma-rem(11.483);
}

.bound-right {
  display: inline-flex;
  align-items: center;
  gap: figma-rem(9.502);
}

.bound-agent-action {
  font-size: figma-rem(13.302);
  font-weight: 500;
  line-height: 1.2;
  color: #fff;
}

.bound-agent-arrow {
  position: relative;
  width: figma-rem(10);
  height: figma-rem(18);
}

.bound-agent-arrow::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: figma-rem(6.2);
  height: figma-rem(6.2);
  border-top: figma-rem(1.15) solid rgba(255, 255, 255, 0.96);
  border-right: figma-rem(1.15) solid rgba(255, 255, 255, 0.96);
  transform: translate(-60%, -50%) rotate(45deg);
}

.friend-total {
  position: absolute;
  right: 0.8rem;
}

.arrow {
  width: figma-rem(7);
  height: figma-rem(7);
  border-top: figma-rem(1.2) solid rgba(255, 255, 255, 0.9);
  border-right: figma-rem(1.2) solid rgba(255, 255, 255, 0.9);
  transform: rotate(45deg);
}

.switch-list {
  padding: figma-rem(6) figma-rem(8);
  display: flex;
  flex-direction: column;
  gap: figma-rem(4);
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  font-size: figma-rem(15.203);
}

.switch {
  width: figma-rem(33);
  height: figma-rem(18.5);
  border: 0;
  border-radius: figma-rem(20);
  background: rgba(255, 255, 255, 0.22);
  padding: figma-rem(1.2);
  display: flex;
  align-items: center;
}

.switch i {
  display: block;
  width: figma-rem(16);
  height: figma-rem(16);
  border-radius: 50%;
  background: #fff;
}

.switch.on {
  justify-content: flex-end;
  background: #25dbc4;
}

.bottom-actions {
  margin-top: figma-rem(7);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: figma-rem(6);
}

.btn {
  border: 0;
  min-height: figma-rem(53.807);
  border-radius: figma-rem(39.59);
  color: #f9f9f9;
  font-size: figma-rem(18.985);
}

.btn.secondary {
  background: rgba(35, 41, 84, 0.58);
}

.btn.primary {
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
}

.btn:disabled {
  opacity: 0.72;
}

:deep(.sheet-popup) {
  background: transparent;
}

.sheet-body {
  width: 10rem;
  border-top-left-radius: 0.8445rem;
  border-top-right-radius: 0.8445rem;
  padding: 0.6426rem 0.5321rem 0.7872rem;
  background: rgba(177, 126, 152, 0.94);
  backdrop-filter: blur(0.9733rem);
}

.sheet-row {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.5493rem;
  line-height: 1.333;
  min-height: 0.9867rem;
}

.role-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3467rem;
}

.radio {
  width: 0.56rem;
  height: 0.56rem;
  border-radius: 50%;
  border: 0.0267rem solid rgba(249, 249, 249, 0.6);
  background: rgba(255, 255, 255, 0.18);
  position: relative;
}

.radio.active::after {
  content: '';
  position: absolute;
  inset: 0.1rem;
  border-radius: 50%;
  background: #26f8e6;
}

.sheet-confirm {
  margin-top: 0.3467rem;
  width: 100%;
  border: 0.0358rem solid rgba(242, 242, 242, 0.8);
  border-radius: 1.082rem;
  height: 1.4716rem;
  color: #fff;
  font-family: 'HONOR Sans CN', 'PingFang SC', var(--font-family-sans);
  font-size: 0.5493rem;
  line-height: 1.2;
  background: linear-gradient(168.09deg, #05e7ae 7.55%, #027a5c 71.92%);
}
</style>

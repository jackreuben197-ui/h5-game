<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_balance.png'
import { getMemberRouteContext } from './clubMemberRoute'

const router = useRouter()
const route = useRoute()

const context = computed(() => getMemberRouteContext(route))

const gameType = ref<'all' | 'texas' | 'mahjong' | 'mini'>('all')
const rangeType = ref<'today' | 'week' | 'month'>('today')
const aliasInput = ref('')
const descInput = ref('')

const detailTitle = computed(() => {
  if (context.value.identity === 'founder' || context.value.identity === 'admin' || context.value.identity === 'agent') {
    return '玩家详情'
  }

  return 'Club Description'
})

const roleLabel = computed(() => {
  if (context.value.identity === 'founder') return '创始人'
  if (context.value.identity === 'admin') return '行政人员'
  if (context.value.identity === 'agent') return '代理人'
  return '成员'
})

const badgeLabel = computed(() => {
  if (context.value.identity === 'founder') return 'Founder'
  if (context.value.identity === 'admin') return 'Admin'
  if (context.value.identity === 'agent') return 'Agent'
  return 'Member'
})

const statRows = [
  { label: 'Number of Games', value: '0' },
  { label: 'Number of Hands', value: '20' },
  { label: 'Issue Alliance Coins', value: '0' },
  { label: 'Recycle Alliance Coins', value: '0' },
  { label: 'win', value: '0' },
  { label: 'Insurance Fee', value: '0' },
  { label: 'Service Fee', value: '0' },
]

const adminPermissions = ref([
  { label: '创建牌桌', enabled: true },
  { label: '俱乐部管理', enabled: true },
  { label: '会员管理', enabled: true },
  { label: '基金管理', enabled: true },
  { label: '查看数据', enabled: true },
])

const showAgentActions = computed(() => context.value.identity === 'agent')
const showAdminPermissions = computed(() => context.value.identity === 'admin')
const showBindRow = computed(() => context.value.identity === 'player' && !context.value.isBoundAgent)
const showUnbindRow = computed(() => context.value.identity === 'player' && context.value.isBoundAgent)
const showBottomAction = computed(() => context.value.identity !== 'founder')

function goBack(): void {
  void router.push('/club/members')
}

function pushWithContext(path: string): void {
  void router.push({
    path,
    query: {
      identity: context.value.identity,
      bound: context.value.isBoundAgent ? '1' : '0',
      name: context.value.name,
      uid: context.value.uid,
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
    pushWithContext(`/club/member/${memberId}/unbind-agent`)
    return
  }

  if (key === 'records') {
    pushWithContext(`/club/member/${memberId}/vip-statistics`)
  }
}

function togglePermission(index: number): void {
  adminPermissions.value[index].enabled = !adminPermissions.value[index].enabled
}
</script>

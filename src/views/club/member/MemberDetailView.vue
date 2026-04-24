<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_balance.png'
import { getMemberRouteContext } from './memberRoute'

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
    pushWithContext(`/club/member/${memberId}/agent-binding`)
    return
  }

  if (key === 'unbind') {
    pushWithContext(`/club/member/${memberId}/agent-binding`)
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

<template>
  <div class="member-detail-bg">
    <div class="page-shell member-detail-page">
      <header class="detail-header">
        <button type="button" class="header-back" @click="goBack">
          <span class="back-icon" aria-hidden="true" />
          <span>{{ detailTitle }}</span>
        </button>
      </header>

      <section class="glass-card profile-card">
        <div class="profile-left">
          <img class="avatar" :src="imgAvatar" :alt="`${context.name}头像`" />
          <div>
            <p class="name">{{ context.name || '俱乐部名称' }}</p>
            <p class="uid-line"><span>ID</span>{{ context.uid }}</p>
            <p class="badge">{{ badgeLabel }}</p>
          </div>
        </div>
        <div class="asset-stack">
          <p><span>20,000</span><img :src="imgChips" alt="" /></p>
          <p><span>20,000</span><img :src="imgBalance" alt="" /></p>
          <p><span>20,000</span><img :src="imgDiamond" alt="" /></p>
        </div>
      </section>

      <section class="glass-card role-card">
        <span>成员角色</span>
        <span>{{ roleLabel }}</span>
      </section>

      <section class="glass-card form-card">
        <label>
          <span>Alias here</span>
          <input v-model="aliasInput" type="text" placeholder="此处输入" />
        </label>
        <label>
          <span>Description</span>
          <input v-model="descInput" type="text" placeholder="此处输入" />
        </label>
      </section>

      <section class="glass-card stat-head-card">
        <div class="stat-head-top">
          <strong>数据统计</strong>
        </div>
        <div class="pill-tabs">
          <button :class="{ active: gameType === 'all' }" @click="gameType = 'all'">全部</button>
          <button :class="{ active: gameType === 'texas' }" @click="gameType = 'texas'">德州</button>
          <button :class="{ active: gameType === 'mahjong' }" @click="gameType = 'mahjong'">麻将</button>
          <button :class="{ active: gameType === 'mini' }" @click="gameType = 'mini'">小游戏</button>
        </div>
      </section>

      <section class="pill-tabs range-tabs">
        <button :class="{ active: rangeType === 'today' }" @click="rangeType = 'today'">今天</button>
        <button :class="{ active: rangeType === 'week' }" @click="rangeType = 'week'">7天</button>
        <button :class="{ active: rangeType === 'month' }" @click="rangeType = 'month'">30天</button>
      </section>

      <section class="stat-list">
        <article v-for="row in statRows" :key="row.label" class="stat-row glass-card">
          <span>{{ row.label }}</span>
          <span>{{ row.value }}</span>
        </article>
      </section>

      <section v-if="showAgentActions" class="glass-card link-list">
        <button class="link-item" @click="onActionClick('offline')">Total Offline Players <span>9999</span></button>
        <button class="link-item" @click="onActionClick('vip')">VIP Statistics <span class="arrow" /></button>
        <button class="link-item" @click="onActionClick('profit')">代理收益设置 <span class="arrow" /></button>
      </section>

      <section v-if="showBindRow" class="glass-card link-list">
        <button class="link-item" @click="onActionClick('bind')">未绑定 <span>绑定代理</span></button>
      </section>

      <section v-if="showUnbindRow" class="glass-card link-list">
        <button class="link-item" @click="onActionClick('unbind')">Player Name <span>解绑代理</span></button>
      </section>

      <section v-if="showAdminPermissions" class="glass-card switch-list">
        <article v-for="(item, index) in adminPermissions" :key="item.label" class="switch-row">
          <span>{{ item.label }}</span>
          <button type="button" class="switch" :class="{ on: item.enabled }" @click="togglePermission(index)">
            <i />
          </button>
        </article>
      </section>

      <footer v-if="showBottomAction" class="bottom-actions">
        <button type="button" class="btn secondary">Delete</button>
        <button type="button" class="btn primary">Freeze</button>
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';

@function figma-rem($px) {
  @return math.div($px, 37.5) * 1rem;
}

.member-detail-bg {
  height: 100dvh;
  min-height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  background:
    radial-gradient(88% 55% at -10% 66%, rgba(245, 222, 165, 0.45), rgba(245, 222, 165, 0) 70%),
    radial-gradient(78% 62% at 38% 92%, rgba(202, 86, 145, 0.6), rgba(202, 86, 145, 0) 70%),
    radial-gradient(85% 70% at 100% 85%, rgba(30, 174, 210, 0.82), rgba(30, 174, 210, 0) 70%),
    linear-gradient(180deg, #bc8b87 0%, #7e5f8f 42%, #187ca3 100%);
}

.member-detail-page {
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
  min-height: 100%;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + #{figma-rem(17.244)});
  padding-bottom: calc(#{figma-rem(13.412)} + env(safe-area-inset-bottom));
}

.detail-header {
  min-height: figma-rem(19.629);
}

.header-back {
  display: inline-flex;
  align-items: center;
  gap: figma-rem(9.606);
  border: 0;
  padding: 0;
  background: transparent;
  color: #f9f9f9;
  font-size: figma-rem(24.388);
  line-height: 1;
}

.back-icon {
  width: figma-rem(6);
  height: figma-rem(6);
  border-left: figma-rem(2) solid rgba(249, 249, 249, 0.95);
  border-bottom: figma-rem(2) solid rgba(249, 249, 249, 0.95);
  transform: rotate(45deg);
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
</style>

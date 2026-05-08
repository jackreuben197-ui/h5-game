<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { getMemberRouteContext } from './clubMemberRoute'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgCard from '@/assets/icons/icon_table.png'

const context = computed(() => getMemberRouteContext(useRoute()))
const gameType = ref<'all' | 'texas' | 'aohaha' | 'short' | 'record'>('all')
const rows = [
  { label: '手数', total: '5000', today: '60,000', week: '400' },
  { label: '服务费', total: '5000', today: '60,000', week: '400' },
  { label: '奖金', total: '5000', today: '60,000', week: '400' },
]
</script>

<template>
  <div class="sub-bg">
    <div class="page-shell sub-page">
      <HeaderBack title="Club Description" />

      <section class="glass profile-card">
        <img :src="imgAvatar" :alt="context.name" />
        <div class="name-wrap">
          <p>俱乐部名称</p>
          <span>ID {{ context.uid }}</span>
          <small>Agent</small>
        </div>
        <div class="coin">15,000 <img :src="imgChips" alt="" /></div>
      </section>

      <section class="offline-head">
        <div>
          <p>Offline Players</p>
          <strong>1234</strong>
        </div>
        <p>offline UC 15,000 <img :src="imgChips" alt="" /></p>
      </section>

      <section class="tabs glass">
        <button :class="{ active: gameType === 'all' }" @click="gameType = 'all'">全部</button>
        <button :class="{ active: gameType === 'texas' }" @click="gameType = 'texas'">德州</button>
        <button :class="{ active: gameType === 'aohaha' }" @click="gameType = 'aohaha'">奥马哈</button>
        <button :class="{ active: gameType === 'short' }" @click="gameType = 'short'">短牌</button>
        <button :class="{ active: gameType === 'record' }" @click="gameType = 'record'">记分牌</button>
      </section>

      <section class="cards">
        <article v-for="row in rows" :key="row.label" class="glass stat-card">
          <div class="left"><img :src="imgCard" alt="" /> {{ row.label }}</div>
          <div class="metric">
            <b>{{ row.total }}</b>
            <span>Total</span>
          </div>
          <div class="metric">
            <b>{{ row.today }}</b>
            <span>Today</span>
          </div>
          <div class="metric">
            <b>{{ row.week }}</b>
            <span>Past 7 days</span>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';

@function figma-rem($px) {
	@return math.div($px, 37.5) * 1rem;
}

.sub-bg {
	height: 100dvh;
	min-height: 100dvh;
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
	overscroll-behavior-y: contain;
	background: linear-gradient(180deg, #10525f 0%, #1f2937 100%);
}

.sub-page {
	min-height: 100%;
	padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + #{figma-rem(17.244)});
	padding-bottom: calc(#{figma-rem(13.412)} + env(safe-area-inset-bottom));
	display: flex;
	flex-direction: column;
	gap: figma-rem(7.282);
}

.header h1 {
	margin: 0;
	color: #fff;
	font-size: figma-rem(24.378);
}

.glass {
	border-radius: figma-rem(39.59);
	background: rgba(0, 0, 0, 0.2);
	backdrop-filter: blur(figma-rem(6));
}

.profile-card {
	min-height: figma-rem(105);
	padding: figma-rem(4.751) figma-rem(21.854);
	display: flex;
	align-items: center;
	gap: figma-rem(14.253);
}

.profile-card img {
	width: figma-rem(65.92);
	height: figma-rem(66.316);
	border-radius: 50%;
}

.name-wrap {
	flex: 1;
}

.name-wrap p {
	margin: 0;
	color: #fff;
	font-size: figma-rem(18.44);
	font-weight: 700;
}

.name-wrap span {
	color: rgba(255, 255, 255, 0.86);
	font-size: figma-rem(9.623);
}

.name-wrap small {
	display: block;
	margin-top: figma-rem(7.601);
	color: #7ed0ff;
	font-size: figma-rem(10.5);
}

.coin {
	color: #f9f9f9;
	display: flex;
	align-items: center;
	gap: figma-rem(5.07);
	font-size: figma-rem(14.886);
	font-weight: 700;
}

.coin img {
	width: figma-rem(18);
	height: figma-rem(14.44);
	border-radius: 0;
}

.offline-head {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	color: #fff;
	font-size: figma-rem(15.203);
}

.offline-head p,
.offline-head strong {
	margin: 0;
}

.offline-head div p {
	font-size: figma-rem(24.388);
}

.offline-head div strong {
	font-size: figma-rem(19.5);
}

.tabs {
	min-height: figma-rem(54.16);
	padding: figma-rem(1.5);
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: figma-rem(2);
}

.tabs button {
	border: 0;
	background: transparent;
	color: #fff;
	border-radius: figma-rem(51.915);
	font-size: figma-rem(13.574);
}

.tabs .active {
	background: rgba(255, 255, 255, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.65);
}

.cards {
	display: flex;
	flex-direction: column;
	gap: figma-rem(2.534);
}

.stat-card {
	min-height: figma-rem(23.121);
	padding: figma-rem(13.619) figma-rem(16.47);
	display: grid;
	grid-template-columns: 1.2fr repeat(3, 1fr);
	align-items: center;
	gap: figma-rem(12);
}

.left {
	color: #fff;
	display: flex;
	align-items: center;
	gap: figma-rem(5.07);
	font-size: figma-rem(11.402);
}

.left img {
	width: figma-rem(22.79);
	height: figma-rem(22.79);
}

.metric {
	display: flex;
	flex-direction: column;
	align-items: center;
	color: #fff;
}

.metric b {
	font-size: figma-rem(15.203);
}

.metric span {
	font-size: figma-rem(11.402);
	opacity: 0.88;
}
</style>

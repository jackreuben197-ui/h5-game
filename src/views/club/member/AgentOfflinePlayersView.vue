<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import imgAvatar from '@/assets/images/default_avatar.png'
import imgChips from '@/assets/icons/icon_chips.png'
import imgDiamond from '@/assets/icons/icon_diamond.png'
import imgBalance from '@/assets/icons/icon_balance.png'

const router = useRouter()
const listMode = ref<'members' | 'edit'>('edit')
const hideCurrentPlayers = ref(false)
const rows = ref([
  { id: '8677650585', name: '成员名字', checked: true },
  { id: '8677650586', name: '成员名字', checked: false },
  { id: '8677650587', name: '成员名字', checked: false },
  { id: '8677650588', name: '成员名字', checked: false },
])

function goBack(): void {
  void router.back()
}

function onSave(): void {
  void router.back()
}
</script>

<template>
  <div class="sub-bg">
    <div class="page-shell sub-page">
      <header class="header">
        <button type="button" class="back" @click="goBack">返回</button>
        <h1>下线成员</h1>
      </header>

      <section class="top-row">
        <div class="invite">邀请链接</div>
        <button class="copy">复制链接</button>
      </section>

      <section class="tabs">
        <button :class="{ active: listMode === 'members' }" @click="listMode = 'members'">成员列表</button>
        <button :class="{ active: listMode === 'edit' }" @click="listMode = 'edit'">编辑下线</button>
      </section>

      <section class="search glass">玩家查询</section>

      <section class="toggle-row">
        <span>邀请链接</span>
        <label>
          隐藏当前下线玩家
          <input v-model="hideCurrentPlayers" type="checkbox" />
        </label>
      </section>

      <section class="cards">
        <article v-for="row in rows" :key="row.id" class="glass card">
          <button class="check" :class="{ on: row.checked }" @click="row.checked = !row.checked"></button>
          <img :src="imgAvatar" :alt="row.name" />
          <div class="meta">
            <p>{{ row.name }}</p>
            <span>ID {{ row.id }}</span>
            <div class="assets">
              <b><img :src="imgChips" alt="" />UC 500</b>
              <b><img :src="imgBalance" alt="" />免审额 1000/1000</b>
              <b><img :src="imgDiamond" alt="" />钻石 500</b>
            </div>
          </div>
        </article>
      </section>

      <button class="save" @click="onSave">保存</button>
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
  background: linear-gradient(180deg, #38414b 0%, #111827 100%);
}

.sub-page {
  min-height: 100%;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + #{figma-rem(17.244)});
  padding-bottom: calc(#{figma-rem(13.412)} + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
}

.header {
  display: flex;
  align-items: center;
  gap: figma-rem(9.602);
}

.header h1 {
  margin: 0;
  color: #fff;
  font-size: figma-rem(24.378);
}

.back {
  border: 0;
  color: #fff;
  background: transparent;
}

.top-row {
  margin-top: figma-rem(2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: figma-rem(14.415);
}

.copy {
  border: 0;
  min-height: figma-rem(42.124);
  border-radius: figma-rem(30);
  padding: 0 figma-rem(12);
  color: #fff;
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
}

.tabs {
  display: flex;
  justify-content: center;
  gap: figma-rem(24.051);
}

.tabs button {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font-size: figma-rem(17.742);
}

.tabs .active {
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.85);
}

.glass {
  border-radius: figma-rem(170.596);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(figma-rem(6));
}

.search {
  min-height: figma-rem(77.882);
  display: flex;
  align-items: center;
  padding: 0 figma-rem(13.613);
  color: rgba(255, 255, 255, 0.86);
  font-size: figma-rem(17.742);
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: figma-rem(10.135);
}

.toggle-row label {
  display: flex;
  align-items: center;
  gap: figma-rem(4);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
}

.card {
  min-height: figma-rem(77.882);
  padding: figma-rem(14.671) figma-rem(13.613);
  display: flex;
  align-items: center;
  gap: figma-rem(8.64);
}

.check {
  width: figma-rem(17);
  height: figma-rem(17);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  background: transparent;
}

.check.on {
  background: #1bead0;
}

.card img {
  width: figma-rem(55.882);
  height: figma-rem(56.218);
  border-radius: 50%;
}

.meta {
  flex: 1;
}

.meta p {
  margin: 0;
  color: #fff;
  font-size: figma-rem(17.742);
  font-weight: 700;
}

.meta span {
  color: rgba(255, 255, 255, 0.85);
  font-size: figma-rem(9.623);
}

.assets {
  margin-top: figma-rem(3);
  border-radius: figma-rem(30);
  background: rgba(17, 70, 110, 0.64);
  min-height: figma-rem(42.124);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  padding: 0 figma-rem(9.568);
  gap: figma-rem(5);
}

.assets b {
  margin: 0;
  font-size: figma-rem(10.135);
  color: #f9f9f9;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: figma-rem(2);
}

.assets img {
  width: figma-rem(11.402);
  height: figma-rem(11.402);
  border-radius: 0;
}

.save {
  margin-top: auto;
  border: 1px solid rgba(242, 242, 242, 0.8);
  min-height: figma-rem(55.184);
  border-radius: figma-rem(40.576);
  color: #fff;
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
  font-size: figma-rem(18.985);
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemberRouteContext } from './memberRoute'
import imgAvatar from '@/assets/images/default_avatar.png'

const route = useRoute()
const router = useRouter()

const context = computed(() => getMemberRouteContext(route))
const focusedKey = ref('service')
const showPad = computed(() => route.query.pad === '1')
const form = ref([
  { key: 'service', label: '服务费分成比例', value: '0' },
  { key: 'insurance', label: '保险分成比例', value: '0' },
  { key: 'mtt', label: 'MTT分成比例', value: '0' },
  { key: 'cowboy', label: '牛仔分成比例', value: '0' },
])

function goBack(): void {
  void router.back()
}

function onSave(): void {
  void router.back()
}

function appendDigit(value: string): void {
  const target = form.value.find((item) => item.key === focusedKey.value)
  if (!target) return
  if (value === 'C') {
    target.value = '0'
    return
  }

  if (value === 'DEL') {
    target.value = target.value.length > 1 ? target.value.slice(0, -1) : '0'
    return
  }

  target.value = target.value === '0' ? value : `${target.value}${value}`
}
</script>

<template>
  <div class="profit-bg">
    <div class="page-shell profit-page">
      <header class="header">
        <button type="button" class="back" @click="goBack">返回</button>
        <h1>代理收益设置</h1>
      </header>

      <section class="glass profile-card">
        <img :src="imgAvatar" :alt="context.name" />
        <div>
          <p class="name">{{ context.name || 'Donny' }}</p>
          <p class="uid"><span>ID</span>{{ context.uid }}</p>
        </div>
      </section>

      <section class="form-list">
        <article v-for="item in form" :key="item.key" class="form-item">
          <p>{{ item.label }}:</p>
          <button type="button" class="glass value" @click="focusedKey = item.key">
            <span>{{ item.value }}</span>
            <span>%</span>
          </button>
        </article>
      </section>

      <section v-if="showPad" class="glass pad">
        <button v-for="key in ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL']" :key="key" @click="appendDigit(key)">
          {{ key === 'DEL' ? '⌫' : key }}
        </button>
      </section>

      <button type="button" class="confirm" @click="onSave">确定</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';

@function figma-rem($px) {
  @return math.div($px, 37.5) * 1rem;
}

.profit-bg {
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

.profit-page {
  min-height: 100%;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + #{figma-rem(17.244)});
  padding-bottom: calc(#{figma-rem(13.412)} + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: figma-rem(24);
}

.header {
  display: flex;
  align-items: center;
  gap: figma-rem(9.606);
}

.header h1 {
  margin: 0;
  font-size: figma-rem(24.388);
  color: #fff;
}

.back {
  border: 0;
  background: transparent;
  color: #fff;
}

.glass {
  border-radius: figma-rem(39.59);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.16rem);
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

.name {
  margin: 0;
  color: #f9f9f9;
  font-size: figma-rem(18.44);
  font-weight: 700;
}

.uid {
  margin: figma-rem(7.601) 0 0;
  display: flex;
  gap: figma-rem(2.457);
  color: #fff;
  font-size: figma-rem(9.623);
}

.uid span {
  border-radius: figma-rem(4.212);
  padding: figma-rem(2.808) figma-rem(4.914);
  background: rgba(255, 255, 255, 0.34);
}

.form-list {
  display: flex;
  flex-direction: column;
  gap: figma-rem(24);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: figma-rem(8);
}

.form-item p {
  margin: 0;
  color: #fff;
  font-size: figma-rem(15);
}

.value {
  border: 1px solid rgba(249, 249, 249, 0.5);
  min-height: figma-rem(62.394);
  padding: 0 figma-rem(20.775);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: figma-rem(14.569);
}

.pad {
  padding: figma-rem(10);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: figma-rem(6);
}

.pad button {
  border: 0;
  min-height: figma-rem(42.124);
  border-radius: figma-rem(30);
  background: rgba(255, 255, 255, 0.18);
  color: #f9f9f9;
  font-size: figma-rem(18.985);
}

.confirm {
  margin-top: figma-rem(12);
  border: 0;
  border-radius: figma-rem(39.59);
  min-height: figma-rem(53.807);
  font-size: figma-rem(18.985);
  color: #fff;
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMemberRouteContext } from './clubMemberRoute'
import imgAvatar from '@/assets/images/default_avatar.png'

const route = useRoute()
const router = useRouter()

const context = computed(() => getMemberRouteContext(route))

function goBack(): void {
  void router.back()
}

function onConfirm(): void {
  void router.push({
    path: `/club/member/${context.value.memberId}`,
    query: {
      identity: 'player',
      bound: '0',
      name: context.value.name,
      uid: context.value.uid,
    },
  })
}
</script>

<template>
  <div class="sub-bg">
    <div class="page-shell sub-page">
      <header class="header">
        <button type="button" class="back" @click="goBack">返回</button>
        <h1>Unbind Agents</h1>
      </header>

      <section class="cards">
        <article class="glass card">
          <img :src="imgAvatar" alt="player" />
          <div>
            <p>Player Name</p>
            <span>ID 12345678</span>
          </div>
          <i class="badge"></i>
        </article>

        <div class="link">🔗</div>

        <article class="glass card">
          <img :src="imgAvatar" alt="agent" />
          <div>
            <p>Player Name</p>
            <span>12345678</span>
          </div>
          <i class="badge"></i>
        </article>
      </section>

      <p class="hint">Do you want to unlink this agent?</p>
      <button type="button" class="confirm" @click="onConfirm">unbind Agents</button>
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
  background:
    radial-gradient(88% 55% at -10% 66%, rgba(245, 222, 165, 0.45), rgba(245, 222, 165, 0) 70%),
    radial-gradient(78% 62% at 38% 92%, rgba(202, 86, 145, 0.6), rgba(202, 86, 145, 0) 70%),
    radial-gradient(85% 70% at 100% 85%, rgba(30, 174, 210, 0.82), rgba(30, 174, 210, 0) 70%),
    linear-gradient(180deg, #bc8b87 0%, #7e5f8f 42%, #187ca3 100%);
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

.cards {
  margin-top: figma-rem(2);
  display: flex;
  flex-direction: column;
  gap: figma-rem(3);
}

.glass {
  border-radius: figma-rem(30);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(figma-rem(6));
}

.card {
  min-height: figma-rem(77.882);
  padding: figma-rem(14.671) figma-rem(13.613);
  display: flex;
  align-items: center;
  gap: figma-rem(8.64);
}

.card img {
  width: figma-rem(55.882);
  height: figma-rem(56.218);
  border-radius: 50%;
}

.card p {
  margin: 0;
  color: #fff;
  font-size: figma-rem(14.415);
  font-weight: 600;
}

.card span {
  color: rgba(255, 255, 255, 0.75);
  font-size: figma-rem(9.623);
}

.badge {
  margin-left: auto;
  width: figma-rem(30);
  height: figma-rem(30);
  border-radius: 50%;
  background: linear-gradient(168deg, #ffd77a 8%, #e8a22f 72%);
}

.link {
  align-self: center;
  color: #fff;
  font-size: figma-rem(32.51);
}

.hint {
  margin: auto auto 0;
  color: rgba(249, 249, 249, 0.86);
  font-size: figma-rem(11.534);
}

.confirm {
  border: 1px solid rgba(242, 242, 242, 0.8);
  border-radius: figma-rem(40.576);
  min-height: figma-rem(55.184);
  color: #fff;
  font-size: figma-rem(18.985);
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
}
</style>

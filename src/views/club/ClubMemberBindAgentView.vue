<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBack from '@/components/HeaderBack/HeaderBack.vue'
import { getMemberRouteContext } from './clubMemberRoute'
import imgAvatar from '@/assets/images/default_avatar.png'

const _router = useRouter()
const route = useRoute()

const context = computed(() => getMemberRouteContext(route))
const rows = ref([
  { id: '12345678', name: 'Player Name', checked: true },
  { id: '12345679', name: 'Player Name', checked: false },
  { id: '12345680', name: 'Player Name', checked: false },
  { id: '12345681', name: 'Player Name', checked: false },
  { id: '12345682', name: 'Player Name', checked: false },
])

function onConfirm(): void {
  const _selected = rows.value.find((row) => row.checked)
  _router.push({
    path: `/club/member/${context.value.memberId}`,
    query: {
      identity: 'player',
      bound: '1',
      name: _selected?.name || context.value.name,
      uid: context.value.uid,
    },
  })
}
</script>

<template>
  <div class="sub-bg">
    <div class="page-shell sub-page">
      <HeaderBack title="Bind Agents" />

      <section class="cards">
        <article
          v-for="row in rows"
          :key="row.id"
          class="glass card"
          @click="rows.forEach((x) => (x.checked = x.id === row.id))"
        >
          <img :src="imgAvatar" :alt="row.name" />
          <div class="meta">
            <p>{{ row.name }}</p>
            <small>ID {{ row.id }}</small>
          </div>
          <button class="dot" :class="{ on: row.checked }"></button>
        </article>
      </section>

      <button type="button" class="confirm" @click="onConfirm">Bind Agents</button>
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
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + #{figma-rem(17.244)});
}

.sub-page {
  min-height: 100%;
  padding-bottom: calc(#{figma-rem(13.412)} + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: figma-rem(7.282);
}

.glass {
  border-radius: figma-rem(170.596);
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

.meta {
  flex: 1;
}

.meta p {
  margin: 0;
  color: #f3f3f3;
  font-size: figma-rem(17.742);
  font-weight: 600;
}

.meta small {
  color: rgba(255, 255, 255, 0.75);
  font-size: figma-rem(9.623);
}

.dot {
  width: figma-rem(17);
  height: figma-rem(17);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.66);
  background: rgba(255, 255, 255, 0.1);
}

.dot.on {
  background: #2ce3d3;
}

.confirm {
  margin-top: auto;
  border: 1px solid rgba(242, 242, 242, 0.8);
  border-radius: figma-rem(40.576);
  min-height: figma-rem(55.184);
  color: #fff;
  font-size: figma-rem(18.985);
  background: linear-gradient(168deg, #05e7ae 8%, #027a5c 72%);
}
</style>

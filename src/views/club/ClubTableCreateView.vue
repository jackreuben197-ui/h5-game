<script setup lang="ts">
import { ref } from 'vue'
import { showFailToast } from 'vant'
import iconNlh from '@/assets/icons/game_type_nlh.png'
import iconPlo from '@/assets/icons/game_type_plo.png'
import iconSixPlus from '@/assets/icons/game_type_6+.png'
import iconAof from '@/assets/icons/table_icon_Aof.png'
import iconMushroom from '@/assets/icons/table_icon_mushroom.png'
import iconSquid from '@/assets/icons/table_icon_squid.png'
import iconCritical from '@/assets/icons/table_icon_critical.png'
import iconMahjong from '@/assets/icons/game_zone_mahjong_mini.png'
import iconCustom from '@/assets/icons/icon_table.png'

interface GameTypeItem {
  key: string
  title: string
  icon: string
}

const selectedKey = ref('')

const gameTypes: GameTypeItem[] = [
  { key: 'nlh', title: '德州', icon: iconNlh },
  { key: 'plo', title: '奥马哈', icon: iconPlo },
  { key: 'six_plus', title: '6+', icon: iconSixPlus },
  { key: 'aof', title: 'AOF', icon: iconAof },
  { key: 'mushroom', title: '蘑菇桌', icon: iconMushroom },
  { key: 'squid', title: '深海桌', icon: iconSquid },
  { key: 'critical', title: '竞技桌', icon: iconCritical },
  { key: 'mahjong', title: '麻将', icon: iconMahjong },
  { key: 'custom', title: '自定义', icon: iconCustom },
]

function onSelect(item: GameTypeItem): void {
  selectedKey.value = item.key
  showFailToast(`${item.title} 创建流程开发中`)
}
</script>

<template>
  <div class="club-table-create-page">
    <HeaderBack :title="'创建牌桌'" />
    <div class="club-table-create-overlay"></div>

    <section class="club-table-create-body">
      <div class="title-wrap">
        <h1>选择游戏类型</h1>
        <div class="title-divider" aria-hidden="true">
          <span></span>
          <span></span>
        </div>
        <p>开始创建</p>
      </div>

      <div class="type-grid">
        <button
          v-for="item in gameTypes"
          :key="item.key"
          type="button"
          class="type-card"
          :class="{ 'type-card--active': selectedKey === item.key }"
          @click="onSelect(item)"
        >
          <img class="type-card-icon" :src="item.icon" :alt="item.title" />
          <span class="type-card-title">{{ item.title }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.club-table-create-page {
  position: relative;
  min-height: 100dvh;
  padding: 0 0.32rem calc(0.44rem + env(safe-area-inset-bottom));
  background: url('@/assets/images/main_bg.webp') center / cover no-repeat;
  overflow-x: hidden;
  overflow-y: auto;
}

.club-table-create-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 16% 86%, rgba(255, 168, 202, 0.3), transparent 35%),
    radial-gradient(circle at 86% 79%, rgba(86, 224, 247, 0.3), transparent 34%),
    rgba(9, 14, 29, 0.35);
}

:deep(.page-back-header) {
  padding-left: 0;
  padding-right: 0;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.2rem);
  padding-bottom: 0;
}

.club-table-create-body {
  position: relative;
  z-index: 2;
  margin-top: 0.86rem;
}

.title-wrap {
  text-align: center;
  color: #fff;
}

.title-wrap h1 {
  margin: 0;
  font-size: 0.508rem;
  font-weight: 500;
  line-height: 1.2;
}

.title-divider {
  margin: 0.2rem auto 0;
  width: 7.245rem;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-divider span {
  width: 1.455rem;
  height: 0.013rem;
  background: rgba(255, 255, 255, 0.42);
}

.title-wrap p {
  margin: 0.14rem 0 0;
  font-size: 0.508rem;
  font-weight: 500;
  line-height: 1.2;
  opacity: 0.92;
}

.type-grid {
  margin-top: 0.93rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 0.37rem;
  row-gap: 0.32rem;
  padding: 0 0.16rem;
}

.type-card {
  min-height: 2.953rem;
  border: 0.01rem solid rgba(255, 255, 255, 0.32);
  border-radius: 0.186rem;
  background: linear-gradient(145deg, rgba(28, 45, 70, 0.68), rgba(13, 24, 42, 0.82));
  backdrop-filter: blur(0.06rem);
  box-shadow:
    inset 0 0 0.12rem rgba(255, 255, 255, 0.1),
    0 0.09rem 0.18rem rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.18rem;
  color: #fff;
  padding: 0.14rem 0.08rem;
}

.type-card--active {
  border-color: rgba(5, 231, 174, 0.9);
  background: linear-gradient(160deg, rgba(20, 72, 85, 0.82), rgba(12, 39, 52, 0.9));
  box-shadow:
    inset 0 0 0.14rem rgba(255, 255, 255, 0.16),
    0 0.1rem 0.22rem rgba(0, 0, 0, 0.32),
    0 0 0.14rem rgba(5, 231, 174, 0.45);
}

.type-card-icon {
  width: 1.54rem;
  height: 1.54rem;
  object-fit: contain;
}

.type-card-title {
  font-size: 0.32rem;
  line-height: 1.2;
  font-weight: 500;
  text-shadow: 0 0.03rem 0.12rem rgba(0, 0, 0, 0.35);
}

@media (max-width: 360px) {
  .type-grid {
    padding: 0;
    column-gap: 0.24rem;
    row-gap: 0.24rem;
  }

  .type-card {
    min-height: 2.68rem;
  }

  .type-card-icon {
    width: 1.34rem;
    height: 1.34rem;
  }
}
</style>

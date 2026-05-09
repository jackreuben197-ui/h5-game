<script setup lang="ts">
import { computed, ref } from 'vue'
import { showFailToast } from 'vant'
import { useRouter } from 'vue-router'
import iconNlh from '@/assets/icons/create_icon_nlh.png'
import iconPlo from '@/assets/icons/create_icon_plo.png'
import iconSixPlus from '@/assets/icons/create_icon_shortdeck.png'
import iconMahjongXueZhan from '@/assets/icons/create_icon_mahjong_xuezhan.png'
import iconMahjongXueLiu from '@/assets/icons/create_icon_mahjong_xueliu.png'
import iconMahjongTuiDaoHu from '@/assets/icons/create_icon_mahjong_tuidaohu.png'
import iconSng from '@/assets/icons/create_icon_sng.png'
import iconMtt from '@/assets/icons/create_icon_mtt.png'
import iconMttMj from '@/assets/icons/create_icon_mtt_mj.png'
import { t } from '@/i18n'
import mainBgUrl from '@/assets/images/main_bg.webp'
// 主容器背景图：全页面共用一张底图。
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${mainBgUrl})`,
}))


interface GameTypeItem {
  key: string
  title: string
  icon: string
}

const selectedKey = ref('')

const gameTypes: GameTypeItem[] = [
  { key: 'nlh', title: '', icon: iconNlh },
  { key: 'plo', title: '', icon: iconPlo },
  { key: 'six_plus', title: '', icon: iconSixPlus },
  { key: 'xuezhan', title: '', icon: iconMahjongXueZhan },
  { key: 'xueliu', title: '', icon: iconMahjongXueLiu },
  { key: 'tuidaohu', title: '', icon: iconMahjongTuiDaoHu },
  { key: 'sng', title: '', icon: iconSng },
  { key: 'mtt', title: '', icon: iconMtt },
  { key: 'mtt_mj', title: '', icon: iconMttMj },
]

function onSelect(item: GameTypeItem): void {
  selectedKey.value = item.key
  showFailToast(`${t(item.title)} 创建流程开发中`)
}
const router = useRouter()
</script>

<template>
  <div class="page-shell club-table-create-page" :style="backgroundStyle">
    <HeaderBack :title="t('创建牌桌')">
      <template #right>
        <TopActionButton
          :name="t('jackpot')"
          icon-alt="wallet"
          @click="router.push('/club/jackpot')"
        />
      </template>
    </HeaderBack>
    <div class="club-table-create-overlay"></div>

    <section class="club-table-create-body">
      <div class="title-wrap">
        <h1>{{ t('选择游戏类型') }}</h1>
        <div class="title-divider" aria-hidden="true">
          <span></span>
          <span></span>
        </div>
        <p>{{ t('开始创建') }}</p>
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
          <div class="type-card-icon-wrap">
            <img class="type-card-icon" :src="item.icon" :alt="item.title" />
          </div>
          <span class="type-card-title">{{ item.title }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.club-table-create-page {
  position: relative;
  height: 100dvh;
  padding: 0 0 calc(0.44rem + env(safe-area-inset-bottom));
  overflow-x: hidden;
  overflow-y: auto;
}

.club-table-create-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.24rem);
  -webkit-backdrop-filter: blur(0.24rem);
}

:deep(.page-back-header) {
  padding-left: 0.36rem;
  padding-right: 0.36rem;
  padding-top: calc(var(--app-top-padding) + env(safe-area-inset-top) + 0.18rem);
  padding-bottom: 0;
}

.club-table-create-body {
  position: relative;
  z-index: 2;
  margin-top: 1.39rem;
}

.title-wrap {
  width: 7.2449rem;
  max-width: calc(100vw - 2.16rem);
  margin: 0 auto;
  text-align: center;
  color: #f9f9f9;
}

.title-wrap h1 {
  margin: 0;
  font-size: 0.5077rem;
  font-weight: 500;
  line-height: 1;
}

.title-divider {
  margin: 0.1369rem auto 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-divider span {
  width: 1.4555rem;
  height: 0.0085rem;
  background: rgba(249, 249, 249, 0.5);
}

.title-wrap p {
  margin: 0.1369rem 0 0;
  font-size: 0.5077rem;
  font-weight: 500;
  line-height: 1;
}

.type-grid {
  width: 9.0258rem;
  max-width: calc(100vw - 0.96rem);
  margin: 0.933rem auto 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 0.3693rem;
  row-gap: 0.33rem;
}

.type-card {
  position: relative;
  height: 2.98rem;
  border-radius: 0.7883rem;
  border: 0.0238rem solid transparent;
  background:
    linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)) padding-box,
    linear-gradient(155deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.08)) border-box;
  box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.22);
  overflow: visible;
  color: #fff;
}

.type-card--active {
  background:
    linear-gradient(rgba(9, 24, 45, 0.72), rgba(9, 24, 45, 0.72)) padding-box,
    linear-gradient(155deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.22)) border-box;
  box-shadow:
    0 0.1rem 0.24rem rgba(0, 0, 0, 0.28),
    0 0 0.14rem rgba(255, 255, 255, 0.22);
}

.type-card-icon-wrap {
  position: absolute;
  left: 50%;
  top: -0.045rem;
  width: 2.897rem;
  height: 3.05rem;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.type-card-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.type-card-title {
  position: absolute;
  left: 50%;
  bottom: 0.14rem;
  transform: translateX(-50%);
  width: 2.1392rem;
  height: 0.7841rem;
  border-radius: 5.2926rem;
  background: rgba(10, 10, 10, 0.19);
  color: #fff;
  font-size: 0.3751rem;
  line-height: 0.7841rem;
  font-weight: 600;
  white-space: nowrap;
  text-align: center;
  text-shadow: 0 0.04rem 0.16rem rgba(0, 0, 0, 0.3);
  padding: 0 0.12rem;
  box-sizing: border-box;
}

@media (max-width: 360px) {
  .club-table-create-body {
    margin-top: 1.18rem;
  }

  .title-wrap {
    max-width: calc(100vw - 1.2rem);
  }

  .type-grid {
    max-width: calc(100vw - 0.56rem);
    column-gap: 0.24rem;
    row-gap: 0.26rem;
  }

  .type-card {
    height: 2.72rem;
    border-radius: 0.56rem;
  }

  .type-card-icon-wrap {
    width: 2.5rem;
    height: 2.62rem;
    top: -0.04rem;
  }

  .type-card-title {
    width: 2.02rem;
    height: 0.72rem;
    line-height: 0.72rem;
    font-size: 0.33rem;
    bottom: 0.12rem;
  }
}
</style>

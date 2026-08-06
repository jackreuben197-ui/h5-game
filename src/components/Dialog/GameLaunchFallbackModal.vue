<script setup lang="ts">
import { computed } from 'vue'
import GameDialog from '@/components/Dialog/GameDialog.vue'
import { useGameLaunchStore } from '@/stores/gameLaunch'

const store = useGameLaunchStore()

const showModal = computed({
  get: () => store.visible,
  set: (val: boolean) => {
    if (!val) {
      store.close()
    }
  },
})

const gameUrl = computed(() => store.url)

function handleLaunched(): void {
  store.close()
}
</script>

<template>
  <GameDialog
    v-model:show="showModal"
    class="game-launch-fallback-dialog"
    title="进入游戏"
    :show-confirm-button="false"
    :show-cancel-button="false"
    :close-on-click-overlay="true"
    dialog-width="8.8rem"
    card-min-height="4.2rem"
  >
    <div class="game-launch-fallback">
      <p class="tip">浏览器拦截了自动打开的新窗口，请点击下方按钮进入游戏。</p>
      <a
        class="launch-link"
        :href="gameUrl"
        target="_blank"
        rel="noopener noreferrer"
        @click="handleLaunched"
      >
        进入游戏
      </a>
      <p class="hint">
        如需免去此步骤，可在 Safari「设置 → Safari → 阻止弹出式窗口」中关闭拦截。
      </p>
    </div>
  </GameDialog>
</template>

<style scoped lang="scss">
.game-launch-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.1rem 0.1rem;
}

.tip {
  margin: 0;
  font-size: 0.373rem;
  line-height: 1.5;
  text-align: center;
  color: var(--c-text, #f9f9f9);
}

.launch-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 1.17rem;
  border-radius: 1.08rem;
  background: linear-gradient(157deg, #55f329 0%, #3ead06 100%);
  color: #fff;
  font-size: 0.45rem;
  font-weight: 500;
  font-family: 'HONOR Sans CN', sans-serif;
  text-decoration: none;
}

.hint {
  margin: 0;
  font-size: 0.32rem;
  line-height: 1.5;
  text-align: center;
  color: var(--c-text-muted, rgba(249, 249, 249, 0.6));
}
</style>

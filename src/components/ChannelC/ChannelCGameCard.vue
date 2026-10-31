<script setup lang="ts">
import { computed } from 'vue'
import type { ExtendGameRecord } from '@/api/casino'
import { t } from '@/i18n'

const props = defineProps<{ game: ExtendGameRecord }>()
defineEmits<{ play: [game: ExtendGameRecord] }>()
const name = computed(() => props.game.game_name || '')
const cover = computed(() => props.game.game_icon || props.game.game_url_p || '')
</script>

<template>
  <article class="c-game-card" @click="$emit('play', game)">
    <img class="c-game-cover" :src="cover" :alt="name" />
    <div class="c-game-details">
      <strong class="c-game-name" :title="name">{{ name }}</strong>
      <button type="button" class="c-game-join" @click.stop="$emit('play', game)">
        <span v-fit-text="{ maxLines: 1, minScale: 0.5 }">{{ t('UIChannelC_JoinShort') }}</span>
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.c-game-card {
  overflow: hidden;
  border-radius: 0.24rem;
  background: #fff;
  cursor: pointer;

  @include theme-dark {
    background: rgba(255, 255, 255, 0.19);
  }
}
.c-game-cover {
  display: block;
  width: 100%;
  aspect-ratio: 183 / 146.25;
  object-fit: cover;
}
.c-game-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.1rem;
  height: 0.685rem;
  padding: 0 0.2055rem 0 0.274rem;
}
.c-game-name {
  min-width: 0;
  overflow: hidden;
  color: #080808;
  font-size: 0.325rem;
  text-overflow: ellipsis;
  white-space: nowrap;

  @include theme-dark {
    color: #fff;
  }
}
.c-game-join {
  flex: none;
  width: 1.0616rem;
  height: 0.565rem;
  padding: 0 0.04rem;
  border: 0;
  border-radius: 0.154rem;
  background: #12c5a5;
  color: #fff;
  font-size: 0.291rem;
  font-weight: 500;
  cursor: pointer;

  span {
    display: block;
    white-space: nowrap;
  }
}
</style>

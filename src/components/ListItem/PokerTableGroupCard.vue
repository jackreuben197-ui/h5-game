<script setup lang="ts">
import { computed } from 'vue'
import iconTable from '@/assets/icons/icon_table.png'
import iconPeople from '@/assets/icons/icon_people.png'
import iconDropDown from '@/assets/icons/icon_drop_down.png'
import type { RoomRecord } from '@/api/models/roomcenter'
import { useTheme } from '@/composables/useTheme'
import { t } from '@/i18n'

interface RoomGroupViewModel {
  groupKey: string
  gameType: number
  pokerType: number
  sb: number
  rooms: RoomRecord[]
  blindText: string
  gameName: string
  iconImage: string
  tableCount: number
  playerCount: number
}

interface Props {
  group: RoomGroupViewModel
  expanded: boolean
  forceLight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  forceLight: false,
})
const { isDark } = useTheme()
const isLightVisual = computed(() => props.forceLight || !isDark.value)

const emit = defineEmits<{
  toggle: [groupKey: string]
  tableClick: [room: RoomRecord]
}>()

// 通过 class 控制展开收起动画。
const expandClass = computed(() => (props.expanded ? 'is-expanded' : 'is-collapsed'))

function toggleGroup(): void {
  emit('toggle', props.group.groupKey)
}

function handleTableClick(room: RoomRecord): void {
  emit('tableClick', room)
}
</script>

<template>
  <section class="group-item" :class="{ 'group-item--force-light': props.forceLight }">
    <div class="group-summary" @click="toggleGroup">
      <div class="summary-left">
        <div class="game-icon-wrap">
          <img class="game-icon-img" :src="group.iconImage" alt="game-type" />
          <span class="icon-tag">
            {{ group.gameName }}
          </span>
        </div>

        <div class="summary-content">
          <p class="blind-text">
            <span class="blind-label">
              {{ t('UIMTT_Howtoplay_blind') }}
            </span>
            <span>
              {{ group.blindText }}
            </span>
          </p>
          <p class="count-text">
            <span>
              <img class="count-icon" :src="iconTable" alt="table" />{{ group.tableCount
              }}{{ t('UIClub_Table2') }}
            </span>
            <span>
              <img class="count-icon" :src="iconPeople" alt="people" />{{ group.playerCount
              }}{{ t('Common_People') }}
            </span>
          </p>
        </div>
      </div>
      <div @click.stop="toggleGroup">
        <img
          v-if="!isLightVisual"
          class="toggle-icon"
          :class="{ 'is-expanded': expanded }"
          :src="iconDropDown"
          alt="toggle"
        />
        <svg
          v-else
          class="toggle-icon"
          :class="{ 'is-expanded': expanded }"
          viewBox="0 0 36 36"
          role="img"
          aria-label="toggle"
        >
          <circle class="toggle-icon-bg" cx="18" cy="18" r="18" />
          <path class="toggle-icon-arrow" d="M11.5 15h13L18 22.2 11.5 15Z" />
        </svg>
      </div>
    </div>

    <div class="table-grid-wrap" :class="expandClass">
      <div class="table-grid-inner">
        <div class="table-grid">
          <PokerTableCard
            v-for="room in group.rooms"
            :key="String(room.rid)"
            :room="room"
            :force-light="props.forceLight"
            @click="handleTableClick"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.group-item {
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.5);
  padding: 0.2667rem 0 0.45rem;

  @include theme-light {
    border-bottom-color: rgba(34, 34, 34, 0.28);
  }
}

.group-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.1rem;
  gap: 0.2667rem;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.game-icon-wrap {
  width: 1.62rem;
  height: 1.71rem;
  border-radius: 0.441rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(0.24rem);
  position: relative;
  overflow: hidden;

  @include theme-light {
    background: rgba(255, 255, 255, 0.48);
    box-shadow:
      0 0.08rem 0.2rem rgba(0, 0, 0, 0.24),
      inset 0 0 0 0.0133rem rgba(34, 34, 34, 0.12);
  }
}

.game-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-tag {
  position: absolute;
  left: 50%;
  bottom: 0.15rem;
  width: 1.2rem;
  height: 0.43rem;
  transform: translateX(-50%);
  border-radius: 999px;
  text-align: center;
  font-size: 0.21rem;
  line-height: 0.38rem;
  font-weight: 400;
  text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  background: rgba(10, 10, 10, 0.29);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  border: 0.0133rem solid rgba(255, 255, 255, 0.34);

  @include theme-light {
    color: #222;
    text-shadow: none;
    background: rgba(255, 255, 255, 0.62);
    border-color: rgba(255, 255, 255, 0.8);
  }
}

.summary-content {
  padding: 0.5rem 0 0;
}

.blind-text {
  margin: 0;
  font-size: 0.35rem;
  line-height: 0.5333rem;
  font-weight: 400;

  @include theme-light {
    color: #111;
  }

  .blind-label {
    margin-right: 0.3rem;
  }
}

.count-text {
  margin: 0.2133rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.32rem;
  font-size: 0.3467rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.86);

  @include theme-light {
    color: #222;
  }
}

.count-text span {
  display: inline-flex;
  align-items: center;
  gap: 0.0533rem;
}

.count-icon {
  width: 0.4rem;
  height: 0.4rem;
  object-fit: contain;

  @include theme-light {
    filter: invert(69%) sepia(77%) saturate(1273%) hue-rotate(180deg) brightness(103%)
      contrast(101%);
  }
}

.toggle-icon {
  width: 0.956rem;
  height: 0.956rem;
  margin-top: 0.4rem;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.toggle-icon-bg {
  fill: #f3f4f6;
}

.toggle-icon-arrow {
  fill: #050505;
}

.toggle-icon.is-expanded {
  transform: rotate(180deg);
}

/* 用 grid-template-rows 做展开收起，避免冗长 JS 过渡钩子。 */
.table-grid-wrap {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-0.2rem);
  transition:
    grid-template-rows 0.45s ease,
    opacity 0.35s ease,
    transform 0.35s ease;
}

.table-grid-wrap.is-expanded {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(0);
}

.table-grid-inner {
  overflow: hidden;
}

.table-grid {
  margin-top: 0.32rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.group-item--force-light {
  border-bottom-color: rgba(34, 34, 34, 0.28);
}

.group-item--force-light .game-icon-wrap {
  background: rgba(255, 255, 255, 0.48);
  box-shadow:
    0 0.08rem 0.2rem rgba(0, 0, 0, 0.24),
    inset 0 0 0 0.0133rem rgba(34, 34, 34, 0.12);
}

.group-item--force-light .icon-tag {
  color: #222;
  text-shadow: none;
  background: rgba(255, 255, 255, 0.62);
  border-color: rgba(255, 255, 255, 0.8);
}

.group-item--force-light .blind-text {
  color: #111;
}

.group-item--force-light .count-text {
  color: #222;
}

.group-item--force-light .count-icon {
  filter: invert(69%) sepia(77%) saturate(1273%) hue-rotate(180deg) brightness(103%) contrast(101%);
}
</style>

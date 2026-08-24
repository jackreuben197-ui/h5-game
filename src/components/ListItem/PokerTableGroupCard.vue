<script setup lang="ts">
import { computed } from 'vue'
import iconTable from '@/assets/icons/icon_table.png'
import iconPeople from '@/assets/icons/icon_people.png'
import iconDropDown from '@/assets/icons/ic_arrow_drop.svg'
import type { RoomRecord } from '@/api/models/roomcenter'
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
          <span class="icon-tag">{{ group.gameName }}</span>
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
              <img class="count-icon" :src="iconTable" alt="table" />{{ group.tableCount }}{{ t('UIClub_Table2') }}
            </span>
            <span>
              <img class="count-icon" :src="iconPeople" alt="people" />{{ group.playerCount }}{{ t('Common_People') }}
            </span>
          </p>
        </div>
      </div>
      <div class="toggle-btn" @click.stop="toggleGroup">
        <img
          class="toggle-icon"
          :class="{ 'is-expanded': expanded }"
          :src="iconDropDown"
          alt="toggle"
        />
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
.group-item {
  position: relative;
  padding: 0.14rem 0.34rem 0.22rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0.427rem;
    right: 0.427rem;
    height: 0.5px;
    background: #e5e4e427;
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
  height: 2rem;
  border-radius: 0.441rem;
  // background: rgba(255, 255, 255, 0.15);
  // backdrop-filter: blur(0.24rem);
  position: relative;
  overflow: hidden;
}

.game-icon-img {
  width: 100%;
  height: auto;
  display: block;
}

.icon-tag {
  position: absolute;
  bottom: 0.34rem;
  left: 0;
  right: 0;
  padding: 0 0.06rem;
  text-align: center;
  font-size: 0.28rem;
  font-weight: 500;
  color: #ffffff;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}


.summary-content {
  padding: 0.1rem 0 0;
}

.blind-text {
  margin: 0;
  font-size: 0.35rem;
  line-height: 0.5333rem;
  font-weight: 400;
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
}

.toggle-btn {
  width: 0.96rem;
  height: 0.96rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toggle-icon {
  width: 0.5rem;
  height: 0.5rem;
  object-fit: contain;
  transition: transform 0.2s ease;
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
  transition: grid-template-rows 0.45s ease, opacity 0.35s ease, transform 0.35s ease;
}

.table-grid-wrap.is-expanded {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(0);
}

.table-grid-inner {
  overflow: hidden;
}

/* 展开后放开裁剪，避免卡片右上角溢出的玩法标识（如鱿鱼角色）被切掉。
   收起/动画过程中仍保持 hidden，以保证折叠动画干净。 */
.table-grid-wrap.is-expanded .table-grid-inner {
  overflow: visible;
}

.table-grid {
  margin-top: 0.22rem;
  margin-bottom: 0.2rem;
  display: grid;
  grid-template-columns: repeat(2, max-content);
  justify-content: start;
  gap: 0.4rem;
}
</style>

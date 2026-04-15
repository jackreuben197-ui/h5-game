<script setup lang="ts">
import { computed } from 'vue'
import iconTable from '@/assets/icons/icon_table.png'
import iconPeople from '@/assets/icons/icon_people.png'
import RoomTableCard from './RoomTableCard.vue'
import type { RoomRecord } from '@/api/room'

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
  themeType: boolean
}

const props = defineProps<Props>()

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
  <section class="group-item">
    <div class="group-summary" @click="toggleGroup">
      <div class="summary-left">
        <div class="game-icon-wrap">
          <img class="game-icon-img" :src="group.iconImage" alt="game-type" />
          <span class="icon-tag">{{ group.gameName }}</span>
        </div>

        <div class="summary-content">
          <p class="blind-text">{{ group.blindText }}</p>
          <p class="count-text">
            <span><img class="count-icon" :src="iconTable" alt="table" /> {{ group.tableCount }}桌</span>
            <span><img class="count-icon" :src="iconPeople" alt="people" /> {{ group.playerCount }}人</span>
          </p>
        </div>
      </div>

      <button type="button" class="toggle-btn" @click.stop="toggleGroup">
        <VanIcon :name="expanded ? 'arrow-up' : 'arrow-down'" />
      </button>
    </div>

    <div class="table-grid-wrap" :class="expandClass">
      <div class="table-grid-inner">
        <div class="table-grid">
          <RoomTableCard
            v-for="room in group.rooms"
            :key="String(room.rid)"
            :room="room"
            :theme-type="themeType"
            @click="handleTableClick"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.group-item {
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.5);
  padding: 0.2667rem 0 0.5rem;
}

.group-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2667rem;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 0.2667rem;
  min-width: 0;
}

.game-icon-wrap {
  width: 1.77rem;
  height: 1.86rem;
  border-radius: 0.3733rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(0.24rem);
  position: relative;
  overflow: hidden;
}

.game-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-tag {
  position: absolute;
  left: 50%;
  bottom: 0.0533rem;
  width: 1.32rem;
  height: 0.47rem;
  transform: translateX(-50%);
  border-radius: 999px;
  text-align: center;
  font-size: 0.22rem;
  line-height: 0.47rem;
  background: rgba(10, 10, 10, 0.19);
  border: 0.0133rem solid rgba(255, 255, 255, 0.34);
}

.blind-text {
  margin: 0;
  font-size: 0.4267rem;
  line-height: 0.5333rem;
  font-weight: 600;
}

.count-text {
  margin: 0.2133rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.32rem;
  font-size: 0.3467rem;
  color: rgba(255, 255, 255, 0.86);
}

.count-text span {
  display: inline-flex;
  align-items: center;
  gap: 0.0533rem;
}

.count-icon {
  width: 0.3rem;
  height: 0.3rem;
  object-fit: contain;
}

.toggle-btn {
  width: 0.9067rem;
  height: 0.9067rem;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(0.2133rem);
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

.table-grid {
  margin-top: 0.32rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.2667rem;
}
</style>

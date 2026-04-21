<script setup lang="ts">
import { computed } from 'vue'
import iconTable from '@/assets/icons/icon_table.png'
import iconPeople from '@/assets/icons/icon_people.png'
import iconDropDown from '@/assets/icons/icon_drop_down.png'
import type { RoomRecord } from '@/api/models/room'
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
    <div
      class="group-summary"
      @click="toggleGroup"
    >
      <div class="summary-left">
        <div class="game-icon-wrap">
          <img
            class="game-icon-img"
            :src="group.iconImage"
            alt="game-type"
          />
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
              <img
                class="count-icon"
                :src="iconTable"
                alt="table"
              />{{ group.tableCount }}桌
            </span>
            <span>
              <img
                class="count-icon"
                :src="iconPeople"
                alt="people"
              />{{
                group.playerCount
              }}人
            </span>
          </p>
        </div>
      </div>
      <div @click.stop="toggleGroup">
        <img
          class="toggle-icon"
          :class="{ 'is-expanded': expanded }"
          :src="iconDropDown"
          alt="toggle"
        />
      </div>
    </div>

    <div
      class="table-grid-wrap"
      :class="expandClass"
    >
      <div class="table-grid-inner">
        <div class="table-grid">
          <PokerTableCard
            v-for="room in group.rooms"
            :key="String(room.rid)"
            :room="room"
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
  padding: 0.2667rem 0 0.45rem;
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
}

.summary-content{
  padding: .5rem 0 0;
}

.blind-text {
  margin: 0;
  font-size: 0.35rem;
  line-height: 0.5333rem;
  font-weight: 400;
  .blind-label{
    margin-right: .3rem;
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

.toggle-icon {
  width: 0.956rem;
  height: 0.956rem;
  margin-top: 0.4rem;
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
</style>

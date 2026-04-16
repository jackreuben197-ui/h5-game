<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import iconPeople from '@/assets/icons/icon_people.png'
import iconTime from '@/assets/icons/icon_time.png'
import iconChips from '@/assets/icons/icon_chips.png'
import nameBg from '@/assets/icons/name_bg.png'
import type { RoomRecord, RoomUser } from '@/api/models/room'

interface Props {
  room: RoomRecord
  themeType: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [room: RoomRecord]
}>()

// 当前牌桌人数。
const roomers = computed(() => {
  const fromCount = Number(props.room.roomers)
  if (Number.isFinite(fromCount) && fromCount > 0) {
    return fromCount
  }
  return Array.isArray(props.room.users) ? props.room.users.length : 0
})

// 座位数，兜底为 9 人桌。
const seatCount = computed(() => {
  const count = Number(props.room.seat_count)
  return Number.isFinite(count) && count > 1 ? count : 9
})

// 把用户分配到对应座位上，未坐人的位置填 null。
const seatUsers = computed(() => {
  const seats: Array<RoomUser | null> = Array.from({ length: seatCount.value }, () => null)
  const users = Array.isArray(props.room.users) ? props.room.users : []

  users.forEach((user) => {
    const seat = Number(user.seat)
    const seatIndex = seat > 0 ? seat - 1 : seats.findIndex((item) => !item)
    if (seatIndex >= 0 && seatIndex < seats.length) {
      seats[seatIndex] = user
    }
  })

  return seats
})

// 开始到现在的时长文案。
const elapsedText = computed(() => {
  const start = new Date(String(props.room.start_time || '')).getTime()
  if (!start || Number.isNaN(start)) {
    return '0m'
  }
  const elapsedSec = Math.max(0, Math.floor((Date.now() - start) / 1000))
  return formatDuration(elapsedSec)
})

// 后端给出的总对局时长文案。
const totalText = computed(() => formatDuration(Number(props.room.play_duration) || 0))

// 买入文案：根据最小倍率和小盲计算。
const bringInText = computed(() => {
  const minRate = Number(props.room.min_rate) || 0
  const sb = Number(props.room.sb) || 0
  const bringInValue = Math.round(((minRate * sb * 2) / 100) * 100) / 100
  if (!bringInValue) {
    return '不限买入'
  }
  return `${bringInValue}买入`
})

// 预设常见人数桌位坐标，保持和旧版一致。
const seatPositionList = computed(() => {
  const seatPosMap: Record<number, Array<{ x: number; y: number }>> = {
    2: [
      { x: 90, y: 50 },
      { x: 10, y: 50 },
    ],
    3: [
      { x: 90, y: 50 },
      { x: 50, y: 82 },
      { x: 50, y: 18 },
    ],
    4: [
      { x: 90, y: 50 },
      { x: 50, y: 82 },
      { x: 10, y: 50 },
      { x: 50, y: 18 },
    ],
    5: [
      { x: 90, y: 50 },
      { x: 50, y: 81 },
      { x: 14, y: 62 },
      { x: 14, y: 38 },
      { x: 50, y: 19 },
    ],
    6: [
      { x: 90, y: 50 },
      { x: 57, y: 76 },
      { x: 43, y: 76 },
      { x: 14, y: 50 },
      { x: 43, y: 24 },
      { x: 57, y: 24 },
    ],
    7: [
      { x: 90, y: 50 },
      { x: 61, y: 76 },
      { x: 39, y: 76 },
      { x: 14, y: 62 },
      { x: 14, y: 38 },
      { x: 39, y: 24 },
      { x: 61, y: 24 },
    ],
    8: [
      { x: 92, y: 50 },
      { x: 67, y: 82 },
      { x: 50, y: 84 },
      { x: 33, y: 82 },
      { x: 9, y: 50 },
      { x: 33, y: 18 },
      { x: 50, y: 16 },
      { x: 67, y: 18 },
    ],
    9: [
      { x: 92, y: 50 },
      { x: 67, y: 82 },
      { x: 50, y: 84 },
      { x: 33, y: 82 },
      { x: 9, y: 63 },
      { x: 9, y: 37 },
      { x: 33, y: 18 },
      { x: 50, y: 16 },
      { x: 67, y: 18 },
    ],
  }

  if (seatPosMap[seatCount.value]) {
    return seatPosMap[seatCount.value]
  }

  // 未覆盖座位数时，用椭圆分布动态计算。
  const points: Array<{ x: number; y: number }> = []
  const radiusX = 40
  const radiusY = 34
  for (let i = 0; i < seatCount.value; i += 1) {
    const angle = ((360 / seatCount.value) * i * Math.PI) / 180
    points.push({
      x: 50 + Math.cos(angle) * radiusX,
      y: 50 + Math.sin(angle) * radiusY,
    })
  }
  return points
})

function handleClick(): void {
  emit('click', props.room)
}

function seatStyle(index: number): CSSProperties {
  const pos = seatPositionList.value[index] || { x: 50, y: 10 }
  return {
    left: `${pos.x}%`,
    top: `${pos.y}%`,
  }
}

function shortName(name?: string): string {
  if (!name) {
    return '空'
  }
  return `${name}`.slice(0, 1)
}

function formatDuration(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds))
  const hour = Math.floor(safeSec / 3600)
  const minute = Math.floor((safeSec % 3600) / 60)
  if (!hour) {
    return `${minute}m`
  }
  if (!minute) {
    return `${hour}h`
  }
  return `${hour}h${minute}m`
}
</script>

<template>
  <article class="table-card" :style="{ '--name-bg': `url(${nameBg})` }" @click="handleClick">
    <div class="table-name" :class="{ themeType1: !props.themeType, themeType2: props.themeType }">
      {{ room.name || 'Poker Game Name' }}
    </div>

    <div class="table-main">
      <div class="seat-area">
        <div class="table-bg" :style="{ backgroundImage: `url(${nameBg})` }">
          <div class="table-center">
            <img class="meta-icon people-center-icon" :src="iconPeople" alt="people" />
            <span>{{ roomers }}/{{ seatCount }}</span>
          </div>
        </div>

        <div
          v-for="(seatUser, idx) in seatUsers"
          :key="`${room.rid}-${idx}`"
          class="seat-avatar"
          :class="{ empty: !seatUser }"
          :style="seatStyle(idx)"
        >
          <img
            v-if="seatUser?.avatar"
            :src="String(seatUser.avatar)"
            alt="avatar"
            loading="lazy"
            decoding="async"
          />
          <span v-else>{{
            shortName(typeof seatUser?.name === 'string' ? seatUser.name : '')
          }}</span>
        </div>
      </div>

      <div class="table-footer">
        <p>
          <img class="meta-icon" :src="iconTime" alt="time" />
          <span>{{ elapsedText }}/{{ totalText }}</span>
        </p>
        <p>
          <img class="meta-icon" :src="iconChips" alt="chips" />
          <span>{{ bringInText }}</span>
        </p>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.table-card {
  position: relative;
  padding-top: 0.36rem;
}

.table-main {
  min-height: 5.28rem;
  border-radius: 0.48rem;
  padding: 0.56rem 0.24rem 0.26rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.14);
  border: 0.0267rem solid rgba(255, 255, 255, 0.24);
  box-shadow: inset 0 0.0267rem 0 rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(0.32rem) saturate(1.02);
  position: relative;
  overflow: hidden;
}

.table-name {
  position: absolute;
  top: 0.36rem;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 78%;
  padding: 0.06rem 0.24rem;
  border-radius: 0.2667rem;
  font-size: 0.4rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  z-index: 4;
}

.table-name.themeType1 {
  background: center / 100% 100% no-repeat;
  background-image: var(--name-bg);
}

.table-name.themeType2 {
  background: rgba(116, 98, 110, 0.12);
  border: 0.0133rem solid rgba(255, 255, 255, 0.44);
  box-shadow:
    inset 0 0.0133rem 0.04rem rgba(255, 255, 255, 0.3),
    0 0.04rem 0.1rem rgba(45, 33, 40, 0.22);
  backdrop-filter: blur(0.08rem) saturate(1.01);
}

.seat-area {
  margin-top: 0.1rem;
  height: 3.18rem;
  position: relative;
}

.table-bg {
  width: 3.62rem;
  height: 1.92rem;
  border-radius: 1rem;
  margin: 0 auto;
  background: center / 100% 100% no-repeat;
  position: relative;
}

.table-center {
  width: 2.04rem;
  height: 0.85rem;
  border-radius: 0.425rem;
  background: rgba(249, 249, 249, 0.1);
  border: 0.0267rem solid rgba(255, 255, 255, 0.24);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.0533rem;
  font-size: 0.52rem;
  backdrop-filter: blur(0.2667rem) saturate(1.04);
}

.seat-avatar {
  width: 0.67rem;
  height: 0.67rem;
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  overflow: hidden;
  border: 0.0267rem solid rgba(255, 255, 255, 0.26);
  box-shadow: 0 0.08rem 0.2133rem rgba(18, 18, 23, 0.2);
  background: rgba(77, 60, 83, 0.68);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.42rem;
  z-index: 2;
}

.seat-avatar.empty {
  background: rgba(86, 76, 94, 0.7);
}

.seat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.table-footer {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.3rem;
}

.table-footer p {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.0533rem;
}

.meta-icon {
  width: 0.42rem;
  height: 0.42rem;
  object-fit: contain;
}

.people-center-icon {
  width: 0.44rem;
  height: 0.44rem;
}
</style>

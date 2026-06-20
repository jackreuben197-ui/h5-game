<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import iconPeople from '@/assets/icons/icon_people.png'
import iconTime from '@/assets/icons/wallet/ic_time.svg'
import iconChips from '@/assets/icons/icon_chips.png'
import iconAof from '@/assets/icons/table_icon_Aof.png'
import iconCritical from '@/assets/icons/table_icon_critical.png'
import iconMushroom from '@/assets/icons/table_icon_mushroom.png'
import iconSquid from '@/assets/icons/table_icon_squid.png'
import type { RoomRecord, RoomUser } from '@/api/models/roomcenter'
import { formatRoomLeftAndTotalByUnity } from '@/utils/time'

interface Props {
  room: RoomRecord
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [room: RoomRecord]
}>()

interface FeatureIconItem {
  key: 'aof' | 'mushroom' | 'squid' | 'critical'
  src: string
  alt: string
}

// 对齐 Unity 判定：只处理 AOF / Mushroom / Squid / Critical 这 4 个玩法标记。
const featureIcons = computed<FeatureIconItem[]>(() => {
  const room = props.room as Record<string, unknown>
  const result: FeatureIconItem[] = []

  if (Number(room.limit_bet_type) === 2) {
    result.push({
      key: 'aof',
      src: iconAof,
      alt: 'aof',
    })
  }

  if (Number(room.mushroom_mode) > 0) {
    result.push({
      key: 'mushroom',
      src: iconMushroom,
      alt: 'mushroom',
    })
  }

  if (Number(room.squid_on) === 1) {
    result.push({
      key: 'squid',
      src: iconSquid,
      alt: 'squid',
    })
  }

  if (Number(room.critical_hit) === 1) {
    result.push({
      key: 'critical',
      src: iconCritical,
      alt: 'critical',
    })
  }
  return result
})

// 当前牌桌人数。
const roomers = computed(() => {
  const fromCount = Number(props.room.roomers)
  const valid = (Number.isFinite(fromCount) && fromCount > 0)
  return Array.isArray(props.room.users) ? props.room.users.length : valid ? fromCount : 0
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

// 对齐客户端：显示“剩余时长/总时长”。
const timeText = computed(() => {
  const totalSeconds = Number(props.room.play_duration) || 0
  return formatRoomLeftAndTotalByUnity(props.room.start_time, totalSeconds)
})

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
      { x: 92, y: 40 },
      { x: 10, y: 40 },
    ],
    3: [
      { x: 92, y: 40 },
      { x: 31, y: 75 },
      { x: 31, y: 4 },
    ],
    4: [
      { x: 92, y: 40 },
      { x: 51, y: 75 },
      { x: 10, y: 40 },
      { x: 51, y: 4 },
    ],
    5: [
      { x: 92, y: 40 },
      { x: 51, y: 75 },
      { x: 10, y: 56 },
      { x: 10, y: 24 },
      { x: 51, y: 4 },
    ],
    6: [
      { x: 92, y: 40 },
      { x: 51, y: 75 },
      { x: 36, y: 75 },
      { x: 10, y: 40 },
      { x: 51, y: 4 },
      { x: 66, y: 4 },
    ],
    7: [
      { x: 92, y: 40 },
      { x: 66, y: 75 },
      { x: 36, y: 75 },
      { x: 10, y: 56 },
      { x: 10, y: 24 },
      { x: 36, y: 4 },
      { x: 66, y: 4 },
    ],
    8: [
      { x: 92, y: 40 },
      { x: 71, y: 75 },
      { x: 51, y: 75 },
      { x: 31, y: 75 },
      { x: 10, y: 40 },
      { x: 31, y: 4 },
      { x: 51, y: 4 },
      { x: 71, y: 4 },
    ],
    9: [
      { x: 92, y: 40 },
      { x: 71, y: 75 },
      { x: 51, y: 75 },
      { x: 31, y: 75 },
      { x: 10, y: 56 },
      { x: 10, y: 24 },
      { x: 31, y: 4 },
      { x: 51, y: 4 },
      { x: 71, y: 4 },
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

</script>

<template>
  <article class="table-card" @click="handleClick">
    <div class="table-name">
      {{ room.name || 'Poker Game Name' }}
    </div>

    <div class="table-main">
      <div
        v-if="featureIcons.length"
        class="feature-icons"
      >
        <img
          v-for="item in featureIcons"
          :key="item.key"
          class="feature-icon"
          :class="'icon-'+item.alt"
          :src="item.src"
          :alt="item.alt"
        />
      </div>

      <div class="seat-area">
        <div class="table-bg">
          <div class="table-center">
            <img class="meta-icon people-center-icon" :src="iconPeople" alt="people" />
            <span> {{ roomers }}/{{ seatCount }} </span>
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
          <span v-else class="seat-name">
            {{ shortName(typeof seatUser?.name === 'string' ? seatUser.name : '') }}
          </span>
        </div>
      </div>

      <div class="table-footer">
        <p>
          <img
            class="meta-icon"
            :src="iconTime"
            alt="time"
          />
          <span>
            {{ timeText }}
          </span>
        </p>
        <p>
          <img class="meta-icon" :src="iconChips" alt="chips" />
          <span>
            {{ bringInText }}
          </span>
        </p>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.table-card {
  position: relative;
  padding-top: 0.15rem;
}

.table-main {
  border-radius: 0.58rem;
  padding: 0.56rem 0.24rem 0.26rem;
  width: 4.4rem;
  height: 4.4rem;
  background: rgba(0, 0, 0, 0.2);
  position: relative;
}

/* 右上角玩法标识：仅显示 AOF / Mushroom / Squid / Critical。 */
.feature-icons {
  position: absolute;
  top: -0.4rem;
  right: -0.1rem;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 0.08rem;
}
.icon-aof{
  margin-right: 0.15rem;
}

.feature-icon {
  width: 0.7rem;
  object-fit: contain;
}

.table-name {
  position: absolute;
  top: 0.15rem;
  left: 50%;
  width: 2.6rem;
  height: 0.47rem;
  transform: translate(-50%, -50%);
  padding: 0.04rem 0.1rem;
  text-align: center;
  font-size: 0.26rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  z-index: 4;
  border-radius: 0.24rem;
  border: 0.02rem solid rgba(249, 249, 249, 0.05);
  background: rgba(170, 170, 170, 0.1);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
}

.seat-area {
  margin-top: 0.1rem;
  height: 2.6rem;
  position: relative;
}

.table-bg {
  width: 3.8rem;
  height: 2.57rem;
  margin: 0.3rem auto 0;
  background: url('@/assets/images/game_list_card_table_bg.png') center / 100% 100% no-repeat;
  position: relative;
}

.table-center {
  width: 1.9rem;
  height: 0.78rem;
  border-radius: 0.425rem;
  background: rgba(249, 249, 249, 0.1);
  position: absolute;
  left: 50%;
  top: 38%;
  padding: 0.09rem 0.17rem;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.0533rem;
  font-size: 0.45rem;
}

.seat-avatar {
  width: 0.6127rem;
  height: 0.6127rem;
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
  background: rgba(0, 0, 0, 0.342);
}

.seat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.seat-name {
  font-size: 0.3rem;
  color: #e5e4e427;
}

.table-footer {
  margin-top: 0.25rem;
  padding: 0 0.05rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.29rem;
}

.table-footer p {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.0533rem;
}

.meta-icon {
  width: 0.33rem;
  height: 0.33rem;
  object-fit: contain;
}

.people-center-icon {
  width: 0.61rem;
  height: 0.61rem;
  margin-right: 0.2rem;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { RoomRecord } from '@/api/models/roomcenter'
import { getOccupiedSeats, getPokerKind } from '@/features/channelC/model'
import { getRoomPlayerCount, formatUC } from '@/utils/roomVisibility'
import nlh from '@/assets/images/table_bg_nlh.png'
// 保留已导入素材的原文件名。
import plo from '@/assets/images/tbale_bg_plo.png'
import shortDeck from '@/assets/images/table_bg_6+.png'
import defaultAvatar from '@/assets/images/default_avatar.png'
import defaultClubLogo from '@/assets/images/club_default_logo.png'
import mushroom from '@/assets/icons/table_icon_mushroom.png'
import squid from '@/assets/icons/table_icon_squid.png'
import critical from '@/assets/icons/table_icon_critical.png'
import aof from '@/assets/icons/table_icon_Aof.png'
import people from '@/assets/channelC/players.svg'
import chips from '@/assets/icons/icon_chips.png'
import { t } from '@/i18n'

const props = defineProps<{ room: RoomRecord; roomLogo?: string; joining?: boolean }>()
defineEmits<{ join: [room: RoomRecord] }>()
const kind = computed(() => getPokerKind(props.room))
const background = computed(() => ({ nlh, plo, short: shortDeck })[kind.value])
const gameName = computed(() => ({ nlh: 'NLH', plo: 'PLO', short: 'SHORT DECK' })[kind.value])
const descriptions = computed(() =>
  [
    { label: 'UITexasRule_RlNZ1ysZ', value: props.room.gameplay_description },
    { label: 'UIChannelC_TableFeature', value: props.room.table_feature },
  ]
    .filter((row) => row.value?.trim())
    .map((row) => `${t(row.label)}: ${t(row.value!.trim())}`),
)
const seats = computed(() => getOccupiedSeats(props.room))
const playerCount = computed(() => getRoomPlayerCount(props.room))
const seatCount = computed(() => Math.max(2, Number(props.room.seat_count) || 8))
const specialModes = computed(() =>
  [
    { show: Number(props.room.mushroom_mode) > 0, label: 'UIMush', icon: mushroom },
    { show: Number(props.room.squid_on) === 1, label: 'UISquid', icon: squid },
    { show: Number(props.room.critical_hit) === 1, label: 'UIHitGamePlayTips1', icon: critical },
    { show: Number(props.room.limit_bet_type) === 2, label: 'AOF', icon: aof },
  ].filter((mode) => mode.show),
)
function fallbackAvatar(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.src !== defaultAvatar) img.src = defaultAvatar
}
</script>

<template>
  <article class="c-poker-card" :aria-label="room.name || t('UITexasReport_Label_AllBarPZ')">
    <div class="c-table-art">
      <img class="c-table-bg" :src="background" alt="" />
      <span class="c-playing"><i></i>{{ t('UIChannelC_Playing', playerCount, seatCount) }}</span>
      <div class="c-table-label" :class="{ 'c-table-label--special': specialModes.length > 0 }">
        <strong>{{ gameName }}</strong>
        <div v-if="specialModes.length" class="c-special-modes">
          <span v-for="mode in specialModes" :key="mode.label">
            <img :src="mode.icon" alt="" />
            <span class="c-mode-name" :title="t(mode.label)">{{ t(mode.label) }}</span>
          </span>
        </div>
      </div>
      <img
        v-for="seat in seats"
        :key="seat.seat"
        class="c-seat-avatar"
        :src="seat.user.avatar || defaultAvatar"
        :alt="t('UIChannelC_SeatPlayer', seat.seat, seat.user.name || '')"
        :data-seat="seat.seat"
        :style="{ left: `${seat.x}%`, top: `${seat.y}%` }"
        @error="fallbackAvatar"
      />
    </div>
    <div v-if="descriptions.length" class="c-room-description">
      <p v-for="description in descriptions" :key="description" :title="description">
        {{ description }}
      </p>
    </div>
    <div class="c-room-details">
      <img
        class="c-club-avatar"
        :src="roomLogo || defaultClubLogo"
        :alt="t('UIClub_Info')"
        @error="($event.target as HTMLImageElement).src = defaultClubLogo"
      />
      <div class="c-room-meta">
        <strong :title="room.name">{{ room.name || t('UITexasReport_Label_AllBarPZ') }}</strong>
        <div class="c-stakes">
          <span>
            <img :src="chips" :alt="t('adaptation20006')" />{{ formatUC(Number(room.sb) || 0) }}/{{
              formatUC((Number(room.sb) || 0) * 2)
            }}
          </span>
          <span>
            <img :src="people" :alt="t('UIMatchFilter_5MWvUt')" />{{ playerCount }}/{{ seatCount
            }}{{ t('Common_People') }}
          </span>
        </div>
      </div>
      <button type="button" class="c-join" :disabled="joining" @click="$emit('join', room)">
        {{ t(joining ? 'UIChannelC_Joining' : 'UIClub_RoomJoin') }}
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;
.c-poker-card {
  overflow: hidden;
  border: 1px solid rgba(15, 118, 110, 0.13);
  border-radius: 0.23rem;
  background: #ecfcf9;
}

.c-table-art {
  position: relative;
  width: 100%;
  aspect-ratio: 180 / 92.5;
  overflow: hidden;
}

.c-table-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.c-playing {
  position: absolute;
  z-index: 2;
  top: 0.07rem;
  left: 0.12rem;
  display: flex;
  align-items: center;
  gap: 0.06rem;
  border: 1px solid #ffffff33;
  padding: 0.025rem 0.08rem;
  border-radius: 0.15rem;
  background: #000c;
  color: #f3f4f6;
  font-size: 0.225rem;
  line-height: 1.3;
  white-space: nowrap;
}

.c-playing i {
  width: 0.17rem;
  height: 0.17rem;
  border-radius: 50%;
  background: #00e3ae;
}

.c-table-label {
  position: absolute;
  top: 58%;
  left: 17%;
  right: 17%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.025rem;
  font-size: 0.22rem;
  color: #fff;
  text-align: center;
  line-height: 1.15;
  text-shadow: 0 1px 3px #0005;
}
.c-table-label--special {
  top: 52%;
}

.c-table-label strong {
  font-size: 0.22rem;
  letter-spacing: 0.012rem;
}

.c-special-modes {
  display: flex;
  justify-content: center;
  max-width: 100%;
  flex-wrap: nowrap;
  gap: 0.04rem;
  font-size: 0.16rem;
}

.c-special-modes > span {
  display: flex;
  align-items: center;
  gap: 0.03rem;
  min-width: 0;
}
.c-mode-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.c-special-modes img {
  flex: none;
  width: 0.25rem;
  height: 0.25rem;
  object-fit: contain;
}

.c-seat-avatar {
  position: absolute;
  width: 12.7%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0.025rem 0.05rem #0005;
}

.c-room-description {
  padding: 0.08rem 0.18rem;
  color: #093a36;
}

.c-room-description p {
  margin: 0;
  height: 0.487rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.276rem;
  line-height: 0.487rem;
}

.c-room-details {
  display: flex;
  align-items: center;
  gap: 0.09rem;
  height: 0.875rem;
  padding: 0.05rem 0.09rem;
  background: linear-gradient(90deg, #f3f4f6, #e8f7f5);
  color: #17191e;
}

.c-club-avatar {
  flex: none;
  width: 0.75rem;
  height: 0.75rem;
  object-fit: cover;
  border-radius: 50%;
}

.c-room-meta {
  min-width: 0;
  flex: 1;
  line-height: 1.2;
}

.c-room-meta > strong {
  display: block;
  font-size: 0.276rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.c-stakes {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding-top: 0.035rem;
  font-size: 0.195rem;
  white-space: nowrap;
}

.c-stakes span {
  display: flex;
  align-items: center;
  gap: 0.035rem;
  padding: 0.01rem 0.06rem;
  border-radius: 0.2rem;
  background: #fff;
  color: #17191e;
}

.c-stakes img {
  width: 0.18rem;
  height: 0.18rem;
  object-fit: contain;
}

.c-join {
  flex: none;
  width: 1.23rem;
  height: 0.55rem;
  border: 0;
  border-radius: 0.175rem;
  background: #69beff;
  color: #fff;
  font-size: 0.275rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.c-join:disabled {
  opacity: 0.6;
}

.c-room-details {
  @include theme-dark {
    background: transparent;
    color: #f3f4f6;
  }
}
.c-poker-card {
  @include theme-dark {
    background: rgba(255, 255, 255, 0.19);
    border-color: #ffffff20;
  }
}
.c-room-description {
  @include theme-dark {
    color: #fff;
  }
}
</style>

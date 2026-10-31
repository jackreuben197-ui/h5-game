<script setup lang="ts">
import { computed } from 'vue'
import type { RoomRecord } from '@/api/models/roomcenter'
import { getPokerKind } from '@/features/channelC/model'
import { getOccupiedSeats, getRoomBuyIn, getRoomTimeText } from '@/features/channelC/pokerCard'
import { getRoomPlayerCount, formatUC } from '@/utils/roomVisibility'
import { resolveSafariWebAppConfig } from '@/utils/safariWebApp'
import nlh from '@/assets/images/table_bg_nlh.png'
// 保留已导入素材的原文件名。
import plo from '@/assets/images/tbale_bg_plo.png'
import shortDeck from '@/assets/images/table_bg_6+.png'
import defaultAvatar from '@/assets/images/default_avatar.png'
import mushroom from '@/assets/icons/table_icon_mushroom.png'
import squid from '@/assets/icons/table_icon_squid.png'
import critical from '@/assets/icons/table_icon_critical.png'
import aof from '@/assets/icons/table_icon_Aof.png'
import chips from '@/assets/icons/icon_chips.png'
import { t } from '@/i18n'

const props = defineProps<{ room: RoomRecord; now: number; desktopIconUrl?: string; joining?: boolean }>()
defineEmits<{ join: [room: RoomRecord] }>()
const platformIconUrl = resolveSafariWebAppConfig(null).iconUrl
const desktopIcon = computed(
  () => resolveSafariWebAppConfig({ safari_icon_url: props.desktopIconUrl }).iconUrl,
)
const kind = computed(() => getPokerKind(props.room))
const background = computed(() => ({ nlh, plo, short: shortDeck })[kind.value])
const gameName = computed(() => ({ nlh: 'NLH', plo: 'OMAHA', short: 'SHORT DECK' })[kind.value])
const descriptions = computed(() =>
  [
    { label: 'UITexasRule_RlNZ1ysZ', value: props.room.room_intro },
    { label: 'UIChannelC_TableFeature', value: props.room.room_features },
  ]
    .filter((row) => row.value?.trim())
    .map((row) => `${t(row.label)}: ${t(row.value!.trim())}`),
)
const seats = computed(() => getOccupiedSeats(props.room))
const playerCount = computed(() => getRoomPlayerCount(props.room))
const seatCount = computed(() => Math.max(2, Number(props.room.seat_count) || 8))
const timeText = computed(() => getRoomTimeText(props.room, props.now))
const buyIn = computed(() => formatUC(getRoomBuyIn(props.room)))
const specialModes = computed(() =>
  [
    { show: Number(props.room.mushroom_mode) > 0, label: 'OpCodeString_ROOMMUSHFEE', icon: mushroom },
    {
      show: Number(props.room.squid_on) === 1 || Number(props.room.squid_base) > 0,
      label: 'OpCodeString_ROOMSQUIDFEE',
      icon: squid,
    },
    { show: Number(props.room.critical_hit) === 1, label: 'OpCodeString_ROOMCHITFEE', icon: critical },
    { show: Number(props.room.limit_bet_type) === 2, label: 'AOF', icon: aof },
  ].filter((mode) => mode.show),
)
function fallbackAvatar(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.src !== defaultAvatar) img.src = defaultAvatar
}
function fallbackDesktopIcon(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.src !== platformIconUrl) img.src = platformIconUrl
}
</script>

<template>
  <article
    class="c-poker-card"
    :aria-label="room.name || t('UITexasReport_Label_AllBarPZ')"
    :aria-busy="joining"
    @click="!joining && $emit('join', room)"
  >
    <div class="c-table-art">
      <img class="c-table-bg" :src="background" alt="" />
      <span class="c-playing">
        <span>{{ t('UIChannelC_Playing', playerCount, seatCount) }}</span>
      </span>
      <div class="c-table-label">
        <div v-if="specialModes.length" class="c-special-modes">
          <span v-for="mode in specialModes" :key="mode.label">
            <span class="c-mode-name" :title="t(mode.label)">{{ t(mode.label) }}</span>
            <img :src="mode.icon" alt="" />
          </span>
        </div>
        <strong v-else :class="`c-table-name--${kind}`">{{ gameName }}</strong>
        <span class="c-table-time">{{ timeText }}</span>
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
        :src="desktopIcon"
        :alt="t('UIClub_Info')"
        @error="fallbackDesktopIcon"
      />
      <div class="c-room-meta">
        <strong :title="room.name">{{ room.name || t('UITexasReport_Label_AllBarPZ') }}</strong>
        <div class="c-stakes">
          <span class="c-stakes-pill">
            <span class="c-stakes-blind">
              <img class="c-uc-icon" :src="chips" :alt="t('adaptation20006')" />
              <span>
                {{ formatUC(Number(room.sb) || 0) }}/{{ formatUC((Number(room.sb) || 0) * 2) }}
              </span>
            </span>
            <span class="c-stakes-divider" aria-hidden="true"></span>
            <span class="c-buy-in">{{ t('MTT_xq_buy') }} {{ buyIn }}</span>
          </span>
        </div>
      </div>
      <button type="button" class="c-join" :disabled="joining" @click.stop="$emit('join', room)">
        <span v-fit-text="{ maxLines: 1, minScale: 0.5 }" class="c-join-label">
          {{ t(joining ? 'UIChannelC_Joining' : 'UIChannelC_JoinShort') }}
        </span>
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;
.c-poker-card {
  overflow: hidden;
  border: 1px solid rgba(15, 118, 110, 0.13);
  border-radius: 0.2rem;
  background: #ecfcf9;
  cursor: pointer;
}

.c-table-art {
  position: relative;
  width: calc(100% + 2px);
  margin: -1px -1px 0;
  aspect-ratio: 182 / 92.5;
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
  top: 0.048rem;
  left: 0.12rem;
  display: flex;
  align-items: center;
  gap: 0.075rem;
  height: 0.432rem;
  padding: 0 0.1rem;
  border-radius: 0.15rem;
  background: #000c;
  color: #f3f4f6;
  font-size: 0.225rem;
  line-height: normal;
  white-space: nowrap;
}

.c-playing::after {
  @include gradient-stroke(1px, linear-gradient(90deg, #ffffff0a, #fff3));
}

.c-playing::before {
  content: '';
  flex: none;
  width: 0.1748rem;
  height: 0.1748rem;
  border-radius: 50%;
  background: #00f0a0;
}

.c-table-label {
  position: absolute;
  top: 58.8%;
  left: 17%;
  right: 17%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.01rem;
  font-size: 0.205rem;
  color: #fff;
  text-align: center;
  line-height: 1;
  text-shadow: 0 1px 3px #0005;
}
.c-table-label strong {
  font-size: 0.205rem;
  letter-spacing: 0.012rem;
}
.c-table-label .c-table-name--plo {
  color: #c586ff;
  letter-spacing: 0.0225rem;
}
.c-table-label .c-table-name--short {
  color: #e996ca;
}

.c-special-modes {
  display: flex;
  justify-content: center;
  max-width: 100%;
  flex-wrap: nowrap;
  gap: 0.04rem;
  font-size: 0.16rem;
}

.c-table-time {
  font-size: 0.182rem;
  line-height: 1.1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
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
  width: 0.26rem;
  height: 0.26rem;
  object-fit: contain;
}

.c-special-modes > span:only-child {
  font-size: 0.204rem;
  letter-spacing: 0.0225rem;

  img {
    width: 0.308rem;
    height: 0.462rem;
  }
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.103rem;
  min-height: 0.756rem;
  padding: 0.115rem 0.205rem 0.18rem;
  color: #093a36;
}

.c-room-description p {
  margin: 0;
  height: 0.333rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.276rem;
  font-weight: 500;
  line-height: 0.333rem;
}

.c-room-details {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  height: 0.875rem;
  margin: 0 -1px -1px;
  padding: 0.05rem 0.148rem 0.05rem 0.1rem;
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
  color: #000000c9;
  font-size: 0.276rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  @include theme-dark {
    color: #fff;
  }
}

.c-stakes {
  display: flex;
  align-items: center;
  padding-top: 0.035rem;
  font-size: 0.202rem;
  white-space: nowrap;
  min-width: 0;
}

.c-stakes-pill {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  max-width: 100%;
  min-width: 0;
  padding: 0.042rem 0.132rem;
  border-radius: 0.225rem;
  background: #fff;
  color: #000;
  line-height: 1;
}

.c-stakes-blind {
  display: flex;
  align-items: center;
  gap: 0.026rem;
  flex: none;
}

.c-uc-icon {
  width: 0.23rem;
  height: 0.23rem;
  object-fit: contain;
}

.c-stakes-divider {
  flex: none;
  width: 0.5px;
  height: 6px;
  background: rgba(0, 0, 0, 0.61);
}

.c-buy-in {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.c-join {
  flex: none;
  width: 1.298rem;
  height: 0.55rem;
  border: 0;
  border-radius: 0.175rem;
  background: #05c297;
  color: #fff;
  font-size: 0.275rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.c-join-label {
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: 0 0.06rem;
  white-space: nowrap;
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
    border-color: #0f766e21;
  }
}
.c-room-description {
  @include theme-dark {
    color: #fff;
  }
}
</style>

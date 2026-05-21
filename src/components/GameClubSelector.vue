<script setup lang="ts">
import { ref, watch } from 'vue'
import { postOrgClubGetApi } from '@/api/org'
import type { OrgClubData } from '@/api/models/org'
import iconChipRed from '@/assets/icons/icon_chip_red.png'
import { showToast } from 'vant'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm', clubId?: number): void
  (e: 'cancel'): void
}>()

const clubs = ref<OrgClubData[]>([])
const selectedClubId = ref<number | null>(null)
const loading = ref(false)
const hasFetched = ref(false)

const fetchClubs = async () => {
  loading.value = true
  try {
    const res = await postOrgClubGetApi()
    if (res.code === 0 && res.data) {
      clubs.value = res.data
      if (clubs.value.length > 0 && !selectedClubId.value) {
        selectedClubId.value = clubs.value[0].club_id ?? null
      }
    }
  } catch (error) {
    console.error('Failed to fetch user clubs', error)
  } finally {
    loading.value = false
    hasFetched.value = true

    // If no clubs, we could automatically confirm without clubId
    if (clubs.value.length === 0) {
      emit('update:show', false)
      emit('confirm', undefined)
    }
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (!hasFetched.value) {
      fetchClubs()
    } else if (clubs.value.length === 0) {
      emit('update:show', false)
      emit('confirm', undefined)
    }
  }
})

const handleCancel = () => {
  emit('update:show', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('update:show', false)
  emit('confirm', selectedClubId.value ?? undefined)
}

const formatGold = (gold?: number) => {
  if (gold === undefined || gold === null) return '0'
  return (gold / 100).toLocaleString()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div v-if="show && clubs.length > 0" class="popup-overlay" @click.self="handleCancel">
        <div class="wallet-popup-glass">
          <h3 class="popup-title">选择钱包</h3>

          <div class="clubs-grid" v-if="!loading">
            <button
              v-for="club in clubs"
              :key="club.club_id"
              class="club-item"
              :class="{ selected: selectedClubId === club.club_id }"
              type="button"
              @click="selectedClubId = club.club_id ?? null"
            >
              <div class="club-logo-wrapper">
                <img :src="club.logo" alt="logo" class="club-logo" />
              </div>
              <span class="club-name">{{ club.club_name }}</span>
              <div class="club-gold">
                <img :src="iconChipRed" alt="chip" class="chip-icon" />
                <span class="gold-amount">{{ formatGold(club.user_gold) }}</span>
              </div>
            </button>
          </div>
          <div v-else class="loading-state">
             <div class="loader"></div>
          </div>

          <div class="popup-actions">
            <button class="btn-cancel" type="button" @click="handleCancel">取消</button>
            <button class="btn-confirm" type="button" @click="handleConfirm">确认</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wallet-popup-glass {
  display: flex;
  width: 345px;
  padding: 14px 22px;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  border-radius: 32px;
  border: 1.314px solid rgba(242, 242, 242, 0.40);
  background: linear-gradient(107deg, rgba(142, 142, 142, 0.12) 2.93%, rgba(103, 103, 103, 0.16) 43.62%, rgba(73, 73, 73, 0.20) 89.79%);
  background-blend-mode: overlay, normal;
  box-shadow: 3.447px 4.309px 6.894px 0 rgba(0, 0, 0, 0.25), 0 0 8.618px 0 #000 inset, 2.123px 4.245px 17.235px 0 rgba(242, 242, 242, 0.90) inset;
  backdrop-filter: blur(7.5807294845581055px);
  max-width: 90vw;
  box-sizing: border-box;
}

.popup-title {
  width: 100%;
  height: 45.577px;
  background: linear-gradient(129deg, #363636 -7.9%, #171717 80.24%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  margin: 0;
  letter-spacing: 1px;
}

.clubs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 45vh;
  overflow-y: auto;
  padding: 8px 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
}

.loader {
  border: 3px solid rgba(255,255,255,0.1);
  border-top: 3px solid #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.club-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 8px 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.95);
  }

  &.selected {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.15);
  }
}

.club-logo-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%);
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
}

.club-logo {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
}

.club-name {
  color: #fff;
  font-size: 11px;
  margin-top: 8px;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.9;
}

.club-gold {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin-top: 2px;
}

.chip-icon {
  width: 12px;
  height: 12px;
  object-fit: contain;
}

.gold-amount {
  color: #fff;
  font-size: 11px;
  opacity: 0.8;
}

.popup-actions {
  display: flex;
  width: 100%;
  gap: 16px;
  margin-top: 8px;
  padding: 0 10px;
  box-sizing: border-box;
}

.btn-cancel,
.btn-confirm {
  display: flex;
  height: 55.184px;
  padding: 4.869px 0;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1 0 0;
  border-radius: 40.576px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;

  text-align: center;
  font-feature-settings: 'liga' off, 'clig' off;
  font-family: "HONOR Sans CN", sans-serif;
  font-size: 15.658px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;

  &:active {
    opacity: 0.8;
  }
}

.btn-cancel {
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.10) 21.11%, rgba(230, 230, 230, 0.10) 71.43%);
  backdrop-filter: blur(0.162px);
  color: #fff;
}

.btn-confirm {
  background: linear-gradient(97deg, rgba(255, 255, 255, 0.10) 21.11%, rgba(230, 230, 230, 0.10) 71.43%);
  backdrop-filter: blur(0.162px);
  color: #78E490;
}

.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.3s ease;
  .wallet-popup-glass {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
  .wallet-popup-glass {
    transform: scale(0.9) translateY(20px);
  }
}
</style>

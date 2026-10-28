<script setup lang="ts">
import { GameDialog } from '@/components/Dialog'
import { t } from '@/i18n'

export interface ClubNoticeContent {
  title: string
  content: string
  dateText: string
}

defineProps<{
  clubName: string
  notice: ClubNoticeContent | null
  ignoring: boolean
}>()
const show = defineModel<boolean>('show', { required: true })
defineEmits<{ ignore: [] }>()
</script>

<template>
  <GameDialog
    v-model:show="show"
    dialog-width="8.45rem"
    :show-footer="false"
    :close-on-click-overlay="true"
  >
    <div class="club-notice-body">
      <div class="club-notice-club-pill">{{ clubName }}</div>
      <p class="club-notice-title">{{ notice?.title }}</p>
      <p class="club-notice-date">{{ notice?.dateText }}</p>
      <p class="club-notice-content">{{ notice?.content }}</p>
      <button
        class="club-notice-ignore-btn"
        type="button"
        :disabled="ignoring"
        @click="$emit('ignore')"
      >
        {{ t('UIClub_Again4') }}
      </button>
    </div>
  </GameDialog>
</template>

<style scoped lang="scss">
.club-notice-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.16rem;
}
.club-notice-club-pill {
  padding: 0.187rem 0.293rem;
  border-radius: 0.67rem;
  background: #2c2d2d4f;
  color: #f9f9f9;
  font-size: 0.427rem;
  line-height: 1.2;
}
.club-notice-title {
  margin: 0.1rem 0 0;
  color: #fff;
  font-size: 0.427rem;
  line-height: 1.4;
  text-align: center;
  letter-spacing: 0.009rem;
}
.club-notice-date {
  margin: 0;
  color: #ffffffeb;
  font-size: 0.427rem;
  line-height: 1.4;
}
.club-notice-content {
  margin: 0.06rem 0 0;
  width: 100%;
  min-height: 2.1rem;
  color: #fffffff2;
  font-size: 0.4rem;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-wrap;
}
.club-notice-ignore-btn {
  margin-top: 0.06rem;
  border: none;
  border-radius: 0.67rem;
  padding: 0.133rem 0.267rem;
  background: #2c2d2d4f;
  color: #f9f9f9;
  font-size: 0.347rem;
  line-height: 1.2;
}
</style>

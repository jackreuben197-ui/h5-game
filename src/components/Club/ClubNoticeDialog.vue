<script setup lang="ts">
import { computed } from 'vue'
import { GameDialog } from '@/components/Dialog'
import { t } from '@/i18n'

export interface ClubNoticeContent {
  title: string
  content: string
  dateText: string
}

const props = withDefaults(
  defineProps<{
    clubName: string
    notice: ClubNoticeContent | ClubNoticeContent[] | null
    ignoring?: boolean
    showIgnore?: boolean
  }>(),
  {
    ignoring: false,
    showIgnore: true,
  },
)
const displayedNotices = computed(() =>
  Array.isArray(props.notice) ? props.notice : props.notice ? [props.notice] : [],
)
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
      <div v-for="(item, index) in displayedNotices" :key="index" class="club-notice-entry">
        <p class="club-notice-title">{{ item.title }}</p>
        <p class="club-notice-date">{{ item.dateText }}</p>
        <p class="club-notice-content">{{ item.content }}</p>
      </div>
      <button
        v-if="showIgnore"
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
.club-notice-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.16rem;
  width: 100%;
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
  margin-top: 0.3rem;
  width: 100%;
  height: 1.4358rem;
  border: 0.0133rem solid rgba(242, 242, 242, 0.1);
  border-radius: 1.0557rem;
  background: rgba(44, 45, 45, 0.31);
  color: #f9f9f9;
  font-size: 0.4rem;
  font-weight: 500;
  line-height: 1.2;

  &:disabled {
    opacity: 0.5;
  }
}
</style>

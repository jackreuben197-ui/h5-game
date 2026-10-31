<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MttListRecord } from '@/api/models/roomcenter'
import { getMttStage, MTT_ARTWORK_HEIGHT, type CardSize } from '@/features/channelC/model'
import { formatDateTime } from '@/utils/time'
import { formatUC } from '@/utils/roomVisibility'
import { isMttRegistered } from '@/utils/mttRegistration'
import defaultLarge from '@/assets/channelC/mtt-default-large.png'
import defaultMedium from '@/assets/channelC/mtt-default-medium.png'
import defaultSmall from '@/assets/channelC/mtt-default-small.png'
import { getLocale, t } from '@/i18n'
import {
  multiLanguageTemplateVersion,
  resolveTemplateTextByKey,
} from '@/utils/multiLanguageTemplate'

const props = withDefaults(
  defineProps<{ match: MttListRecord; now: number; size?: CardSize; seriesName?: string }>(),
  {
    size: 'medium',
    seriesName: '',
  },
)
defineEmits<{ open: [match: MttListRecord] }>()
const matchName = computed(() => {
  void multiLanguageTemplateVersion.value
  const rawName = props.match.name || ''
  return (
    resolveTemplateTextByKey(rawName, getLocale()) || t(rawName) || `MTT #${props.match.match_id}`
  )
})
const failedCover = ref(false)
watch(
  () => props.match.mtt_banner_url_c,
  () => {
    failedCover.value = false
  },
)
const defaultCover = computed(
  () => ({ large: defaultLarge, medium: defaultMedium, small: defaultSmall })[props.size],
)
const cover = computed(() =>
  failedCover.value
    ? defaultCover.value
    : props.match.mtt_banner_url_c?.trim() || defaultCover.value,
)
const stage = computed(() => getMttStage(props.match, props.now))
const statusText = computed(() =>
  t(
    {
      registered: 'MTT_State_Registered',
      registering: 'MTT-Applying',
      waiting: 'UIChannelC_WaitingRegistration',
      running: 'UIChannelC_Running',
      finished: 'Mtt_Complete',
    }[stage.value],
  ),
)
const formatLabel = computed(() => t(props.seriesName || props.match.tournament_label || ''))
const actionText = computed(() =>
  t(isMttRegistered(props.match) ? 'MTT_State_Registered' : 'MTT-Apply'),
)
</script>

<template>
  <article class="c-mtt-card" @click="$emit('open', match)">
    <div class="c-mtt-art" :style="{ aspectRatio: `180 / ${MTT_ARTWORK_HEIGHT[size]}` }">
      <img class="c-mtt-cover" :src="cover" alt="" @error="failedCover = true" />
      <span class="c-mtt-status"><i :class="stage"></i>{{ statusText }}</span>
      <span v-if="formatLabel" class="c-mtt-format">{{ formatLabel }}</span>
    </div>
    <div class="c-mtt-details">
      <strong class="c-mtt-name" :title="matchName">
        {{ matchName }}
      </strong>
      <p class="c-prize">
        {{ t('UIMTT_zongjiangjin') }}
        <b>
          {{
            Number(formatUC(Number(match.prize_base_pool ?? match.prize_pool) || 0)).toLocaleString(
              'en-US',
            )
          }}
        </b>
      </p>
      <p class="c-mtt-time">
        {{
          t(
            'UIChannelC_StartAndPlayers',
            formatDateTime(match.start_time, 'DD/MM HH:mm'),
            match.participants || 0,
          )
        }}
      </p>
      <button class="c-mtt-action" type="button" @click.stop="$emit('open', match)">
        <span v-fit-text="{ maxLines: 1 }" class="c-mtt-action-label">{{ actionText }}</span>
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;
.c-mtt-card {
  overflow: hidden;
  border-radius: 0.256rem;
  background: #fff;
  color: #17191e;
  cursor: pointer;
}

.c-mtt-art {
  position: relative;
  overflow: hidden;
}

.c-mtt-cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.c-mtt-status,
.c-mtt-format {
  position: absolute;
  top: 0.18rem;
  display: flex;
  align-items: center;
  height: 0.487rem;
  padding: 0 0.18rem;
  border-radius: 0.5rem;
  background: #07102b;
  color: #fff;
  font-size: 0.256rem;
  font-weight: 500;
  line-height: 1;
}

.c-mtt-status {
  left: 0.18rem;
  gap: 0.1rem;
}

.c-mtt-status i {
  width: 0.205rem;
  height: 0.205rem;
  border-radius: 50%;
  background: #00e3ca;
}

.c-mtt-status i.waiting {
  background: #f2b74d;
}

.c-mtt-status i.registered {
  background: #00e3ae;
}

.c-mtt-format {
  right: 0.154rem;
  padding: 0 0.205rem;
}

.c-mtt-details {
  position: relative;
  height: 1.5385rem;
  padding: 0.128rem 0.205rem 0.1rem 0.23rem;
}

.c-mtt-name {
  display: block;
  max-width: calc(100% - 1.45rem);
  height: 0.41rem;
  font-size: 0.308rem;
  line-height: 0.41rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.c-prize {
  margin: 0.025rem 0 0;
  color: #86878e;
  font-size: 0.282rem;
  line-height: 0.46rem;
}

.c-prize b {
  color: #e78632;
  font-size: 0.36rem;
}

.c-mtt-time {
  margin: 0.025rem 0 0;
  color: #86878e;
  font-size: 0.2436rem;
  line-height: 0.333rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.c-mtt-action-label {
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: 0 0.06rem;
  white-space: nowrap;
}
.c-mtt-action {
  position: absolute;
  top: 0.18rem;
  right: 0.205rem;
  width: 1.36rem;
  height: 0.692rem;
  padding: 0;
  border: 0;
  border-radius: 0.205rem;
  background: #02cfbb;
  color: #fff;
  font-size: 0.282rem;
  font-weight: 700;
  cursor: pointer;
}

.c-mtt-card {
  @include theme-dark {
    background: rgba(255, 255, 255, 0.19);
    color: #fff;
  }
}
.c-prize,
.c-mtt-time {
  @include theme-dark {
    color: #fff;
  }
}
.c-prize b {
  @include theme-dark {
    color: #fff;
  }
}
</style>

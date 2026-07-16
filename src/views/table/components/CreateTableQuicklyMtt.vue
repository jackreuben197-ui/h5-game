<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  postOrggetTemplateApi,
  postOrgRoomBatchCreateApi,
  postOrgTemplateDeleteApi,
  postCmsExtRoomUserBatchCreateApi,
} from '@/api/cmsext'
import { GameDialog } from '@/components/Dialog'
import { showGameToast } from '@/components/Toast'
import { useTheme } from '@/composables/useTheme'
import iconPeople from '@/assets/icons/icon_people.png'
import iconDelete from '@/assets/icons/icon_delete.svg'
import iconEdit from '@/assets/icons/icon_edit.svg'
import iconCards from '@/assets/icons/icon_cards.png'

import blueBlur from '@/assets/images/blue_blur.png'
import greenBlur from '@/assets/images/green_blur.png'
import purpleBlur from '@/assets/images/purple_blur.png'

const emit = defineEmits<{
  'edit-template': [roomConfig: Record<string, unknown>]
}>()

const router = useRouter()
const route = useRoute()
const isSubmitting = ref(false)
const { isDark } = useTheme()

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

// ── 模板列表 ──────────────────────────────────────────────

interface TemplateItem {
  id: number
  name: string
  room_config: Record<string, unknown>
  game_play_type: number

  anti_cheat_type: number
  chat_type: number
}

function parseRoomConfig(raw: unknown): Record<string, unknown> {
  if (isPlainObject(raw)) return raw
  if (typeof raw !== 'string') return {}
  try {
    const parsed = JSON.parse(raw)
    return isPlainObject(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function toTemplateItem(raw: Record<string, unknown>): TemplateItem {
  const roomConfig = parseRoomConfig(raw.room_config)
  const mergedConfig = Object.keys(roomConfig).length ? roomConfig : raw
  return {
    id: Math.floor(toNumber(raw.id, toNumber(raw.template_id, toNumber(mergedConfig.id)))),
    name: String(raw.name ?? mergedConfig.name ?? ''),
    room_config: mergedConfig,
    game_play_type: Math.floor(
      toNumber(
        raw.game_play_type,
        toNumber(mergedConfig.game_play_type, toNumber(raw.room_type, 1)),
      ),
    ),
    anti_cheat_type: Math.floor(
      toNumber(raw.anti_cheat_type, toNumber(mergedConfig.anti_cheat_type, 1)),
    ),
    chat_type: Math.floor(toNumber(raw.chat_type, toNumber(mergedConfig.chat_type, 1))),
  }
}

function extractTemplateList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!isPlainObject(raw)) return []
  const candidates: unknown[] = [
    raw.data,
    raw.list,
    raw.records,
    isPlainObject(raw.data) ? raw.data.data : undefined,
    isPlainObject(raw.data) ? raw.data.list : undefined,
    isPlainObject(raw.data) ? raw.data.records : undefined,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }
  return []
}

const templates = ref<TemplateItem[]>([])
const activeTemplateId = ref<number>(0)
const loadingTemplates = ref(false)
const hasInitializedTemplate = ref(false)
const templateContext = reactive({
  gamePlayType: 1,
})

// 客户端用 game_type_arr + poker_type + bombpot 筛选，而不是 game_play_type
function buildGameTypeParams(gamePlayType: number): Record<string, unknown> {
  switch (gamePlayType) {
    case 3: // 6+短牌
      return { game_type_arr: [0, 1, 2, 3], poker_type: [2], bombpot: [0] }
    case 2: // 奥马哈
      return { game_type_arr: [1, 2, 3], poker_type: [0], bombpot: [0] }
    default: // NLH德州
      return { game_type_arr: [0], poker_type: [0], bombpot: [0] }
  }
}

function syncTemplateContextFromTemplate(template: TemplateItem): void {
  templateContext.gamePlayType = Math.floor(
    toNumber(template.game_play_type, toNumber(template.room_config?.game_play_type, 1)),
  )
}

function onSelectTemplate(template: TemplateItem): void {
  activeTemplateId.value = template.id
  syncTemplateContextFromTemplate(template)
}

async function fetchTemplates() {
  loadingTemplates.value = true
  try {
    const gameTypeParams = buildGameTypeParams(currentGamePlayType.value)
    let res
    res = await postOrggetTemplateApi({
      // standard_ext: true,
      limit: 20,
      offset: 0,
      mode: 1,
      // origin_type: currentOriginType.value,
      ...gameTypeParams,
    })
    if (res.code === 0) {
      const listCandidate = extractTemplateList(res.data)
      const list = listCandidate
        .map((item) => (isPlainObject(item) ? toTemplateItem(item) : null))
        .filter((item): item is TemplateItem => Boolean(item) && (item?.id || 0) > 0)
      templates.value = list
      if (!list.length) {
        activeTemplateId.value = 0
        return
      }

      const fallbackTemplate = list[0]
      if (!hasInitializedTemplate.value) {
        // 首次加载时回填默认模板到表单。
        onSelectTemplate(fallbackTemplate)
        hasInitializedTemplate.value = true
      } else {
        // 已初始化后模板变化（比如删除当前模板）只切换选择，不覆盖用户已改配置。
        activeTemplateId.value = fallbackTemplate.id
        syncTemplateContextFromTemplate(fallbackTemplate)
      }
    }
  } catch {
    // ignore
  } finally {
    loadingTemplates.value = false
  }
}

onMounted(() => {
  void fetchTemplates()
})

const currentGamePlayType = computed<number>(() => {
  return Math.floor(toNumber(route.query.game_play_type, 0)) || 1
})

function getGameTypeName(type: number): string {
  switch (type) {
    case 2:
      return '奥马哈'
    case 3:
      return '短牌'
    case 1:
    default:
      return '德州\n扑克'
  }
}

function getGameTypeBg(type: number): string {
  switch (type) {
    case 2:
      return greenBlur
    case 3:
      return purpleBlur
    case 1:
    default:
      return blueBlur
  }
}

function getGameTypeColor(type: number): string {
  switch (type) {
    case 2:
      return '#00B07E'
    case 3:
      return '#AB05E7'
    case 1:
    default:
      return '#4081E8'
  }
}

function getTemplateCardStyle(type: number): Record<string, string> {
  if (isDark.value) {
    return { backgroundImage: `url(${getGameTypeBg(type)})` }
  }

  const lightColors: Record<number, string> = {
    1: 'rgba(5, 92, 231, 0.6)',
    2: 'rgba(0, 176, 126, 0.6)',
    3: 'rgba(171, 5, 231, 0.6)',
  }

  return {
    backgroundImage: 'none',
    backgroundColor: lightColors[type] ?? lightColors[1],
  }
}

async function onCreateFromTemplate(tpl: TemplateItem) {
  onSelectTemplate(tpl)
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    let res

    res = await postOrgRoomBatchCreateApi({
      data: [
        {
          template_id: tpl.id,
          count: 1,
          ante: Number(tpl.room_config?.ante ?? 0),
        },
      ],
    })
    if (res.code === 0) {
      showGameToast('创建成功')
      await router.replace({ name: 'club-index' })
    } else {
      showGameToast((res as unknown as { message?: string }).message || '创建失败')
    }
  } catch {
    showGameToast('创建失败')
  } finally {
    isSubmitting.value = false
  }
}

function onEditTemplate(tpl: TemplateItem) {
  emit('edit-template', { ...tpl.room_config, name: tpl.name })
}

const deleteDialog = reactive<{ show: boolean; template: TemplateItem | null }>({
  show: false,
  template: null,
})

function onDeleteTemplate(tpl: TemplateItem) {
  deleteDialog.template = tpl
  deleteDialog.show = true
}

async function onDeleteConfirm() {
  const tpl = deleteDialog.template
  if (!tpl) return
  deleteDialog.show = false
  const res = await postOrgTemplateDeleteApi({ id: tpl.id })
  if (res.code === 0) {
    showGameToast('删除成功')
    templates.value = templates.value.filter((t) => t.id !== tpl.id)
  } else {
    showGameToast((res as unknown as { message?: string }).message || '删除失败')
  }
}
</script>

<template>
  <div class="quick-create-view">
    <!-- 模板列表 -->
    <div class="template-list">
      <div v-if="loadingTemplates" class="template-list__placeholder">模板加载中...</div>
      <div v-else-if="!templates.length" class="template-list__placeholder">暂无可用模板</div>
      <div
        v-for="item in templates"
        :key="item.id"
        :class="['template-card', { 'template-card--active': activeTemplateId === item.id }]"
        :style="getTemplateCardStyle(item.game_play_type ?? 1)"
        @click="onSelectTemplate(item)"
      >
        <div class="template-card__left">
          <div
            class="template-card__badge"
            :style="{ backgroundColor: getGameTypeColor(item.game_play_type ?? 1) }"
          >
            <span class="template-card__game-name">
              {{ getGameTypeName(item.game_play_type ?? 1) }}
            </span>
          </div>
        </div>
        <div class="template-card__info">
          <div class="template-card__tags">{{ item.name }}</div>
          <div class="template-card__people">
            <img :src="iconPeople" class="template-card__people-icon" alt="" />
            <span>{{ 123 }}</span>
          </div>
        </div>
        <div class="template-card__right">
          <img :src="iconCards" class="template-card__cards" alt="" />
          <div class="template-card__actions">
            <div class="template-card__action-btn" @click.stop="onEditTemplate(item)">
              <img :src="iconEdit" class="template-card__action-icon" alt="" />
              <span>编辑</span>
            </div>
            <div class="template-card__action-btn" @click.stop="onDeleteTemplate(item)">
              <img :src="iconDelete" class="template-card__action-icon" alt="" />
              <span>删除</span>
            </div>
          </div>
        </div>
        <div class="template-card__create-btn">
          <button class="template-card__create" @click.stop="onCreateFromTemplate(item)">
            立即创建
          </button>
        </div>
      </div>
    </div>
  </div>

  <GameDialog
    v-model:show="deleteDialog.show"
    title="确认删除"
    :message="`确定删除模板「${deleteDialog.template?.name ?? ''}」？`"
    :show-cancel-button="true"
    @confirm="onDeleteConfirm"
    @cancel="deleteDialog.show = false"
  />
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

/* 模板列表 */
.template-list {
  min-height: 0;
  width: 100%;
  padding-bottom: 0.08rem;
  // overflow-y: auto;
  display: block;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin-top: 0.5rem;
}

.template-list::-webkit-scrollbar {
  display: none;
}

.template-list__placeholder {
  min-height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.3rem;
  color: rgba(255, 255, 255, 0.7);

  @include theme-light {
    color: var(--c-text-muted);
  }
}

.template-card {
  position: relative;
  display: flex;
  align-items: center;
  height: 2.26rem;
  min-height: 2.26rem;
  margin-bottom: 0.3rem;
  margin-left: 0.3rem;
  border-radius: 2.08rem;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: rgba(64, 129, 232, 0.28);
  padding: 0 0.4rem 0 0.25rem;
  // overflow: hidden;
  border: 0.02rem solid transparent;

  @include theme-light {
    background-image: none;
    border-color: #fff;
    backdrop-filter: blur(4.117px);
    -webkit-backdrop-filter: blur(4.117px);
    box-shadow:
      inset 0 0 0.03rem rgba(255, 255, 255, 0.5),
      inset 0.04rem 0.04rem 0.12rem rgba(255, 255, 255, 0.32);
  }
}

.template-card--active {
  border-color: rgba(255, 255, 255, 0.55);
}

.template-card__left {
  flex-shrink: 0;
  margin-right: 0.2rem;
  transform: translateX(-0.5rem);
}

.template-card__badge {
  width: 1.49rem;
  height: 1.49rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-blend-mode: hard-light;
  box-shadow: 3.4px 4.3px 6.8px rgba(0, 0, 0, 0.25);
  outline: 0.95px solid transparent;
  outline-offset: -0.95px;
  backdrop-filter: blur(10.54px);
}

.template-card__game-name {
  font-size: 0.36rem;
  font-family: 'SF Pro', sans-serif;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.2;
  white-space: pre-line;
}

.template-card__info {
  min-width: 0;
  display: flex;
  width: 2.2rem;
  flex-direction: column;
  transform: translateX(-0.4rem);
}

.template-card__blinds {
  font-size: 0.36rem;
  font-family: 'SF Pro', sans-serif;
  font-weight: 700;
  color: #f9f9f9;
  line-height: 1;
}

.template-card__tags {
  font-size: 0.24rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 300;
  color: #fff;
  line-height: 1;
}

.template-card__people {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  margin-top: 0.1rem;
}

.template-card__people-icon {
  width: 0.4rem;
  height: 0.4rem;
}

.template-card__people span {
  font-size: 0.37rem;
  font-family: 'Afacad', sans-serif;
  font-weight: 600;
  letter-spacing: 0.56px;
  color: #f9f9f9;
  line-height: 1;
}

.template-card__right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  justify-content: space-between;
}

.template-card__cards {
  width: 1.26rem;
  height: 1.15rem;
  object-fit: contain;
}

.template-card__actions {
  display: flex;
  gap: 0.2rem;
  margin-bottom: 0.2rem;
}

.template-card__action-btn {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  background-blend-mode: hard-light;
  // box-shadow: 0px 0px 2.2px 1.47px rgba(242, 241, 241, 0.9) inset, 0.29px 0.29px 2.1px #000 inset,
  //   0px 0px 2.1px #000 inset, 0.84px 1.05px 1.68px rgba(0, 0, 0, 0.25);
  box-shadow:
  /* 左上高光 */ inset 0.5px 0.5px 0px 0px rgba(255, 255, 255, 0.3),
    /* 右下高光 */ inset -0.5px -0.5px 0px 0px rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.template-card__action-icon {
  width: 0.2rem;
  height: 0.2rem;
}

.template-card__action-btn span {
  font-size: 0.18rem;
  font-family: 'Afacad', sans-serif;
  font-weight: 600;
  color: #fff;
  line-height: 1;
  margin-top: 0.02rem;
}
.template-card__create-btn {
  margin-left: 0.6rem;
}

.template-card__create {
  width: 1.88rem;
  height: 0.85rem;
  border: none;
  border-radius: 0.42rem;
  background: rgba(255, 255, 255, 0.2);
  background-blend-mode: hard-light;
  box-shadow:
  /* */ 0 0 0.1rem 0.05rem rgba(255, 255, 255, 0.2) inset,
    /* 左上高光 */ inset 0.5px 0.5px 0px 0px rgba(255, 255, 255, 0.3),
    /* 右下高光 */ inset -0.5px -0.5px 0px 0px rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 0.28rem;
  font-family: 'HONOR Sans CN', sans-serif;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(1.9px);
}
</style>

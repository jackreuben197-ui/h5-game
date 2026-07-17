<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'
import { postOssUploadImageApi } from '@/api/oss'

withDefaults(
  defineProps<{
    modelValue?: string
    accept?: string
  }>(),
  {
    modelValue: '',
    accept: 'image/*',
  },
)

const emit = defineEmits<{
  'update:modelValue': [url: string]
  'upload-start': []
  'upload-end': []
  error: [message: string]
}>()

const sheetVisible = ref(false)
const uploading = ref(false)
const galleryInputRef = ref<HTMLInputElement | null>(null)
const cameraInputRef = ref<HTMLInputElement | null>(null)

function open(): void {
  sheetVisible.value = true
}

function close(): void {
  sheetVisible.value = false
}

function selectSource(source: 'camera' | 'gallery'): void {
  close()
  const input = source === 'camera' ? cameraInputRef.value : galleryInputRef.value
  input?.click()
}

async function handleFileChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) return

  uploading.value = true
  emit('upload-start')

  try {
    const formData = new FormData()
    formData.append('file', file)

    const result = await postOssUploadImageApi(
      formData as unknown as Parameters<typeof postOssUploadImageApi>[0],
    )

    if (result?.data) {
      emit('update:modelValue', result.data as unknown as string)
    } else {
      showToast('图片上传失败')
      emit('error', '图片上传失败')
    }
  } catch {
    showToast('图片上传失败')
    emit('error', '图片上传失败')
  } finally {
    uploading.value = false
    emit('upload-end')
    if (target) target.value = ''
  }
}
</script>

<template>
  <input
    ref="galleryInputRef"
    class="upload-file-input"
    type="file"
    :accept="accept"
    @change="handleFileChange"
  />
  <input
    ref="cameraInputRef"
    class="upload-file-input"
    type="file"
    :accept="accept"
    capture="environment"
    @change="handleFileChange"
  />

  <slot :open="open" :image-url="modelValue" :uploading="uploading"></slot>

  <teleport to="body">
    <div v-if="sheetVisible" class="upload-sheet-mask" @click="close">
      <div class="upload-sheet" role="dialog" aria-label="选择图片来源" @click.stop>
        <button type="button" class="upload-sheet-option" @click="selectSource('camera')">
          拍照
        </button>
        <div class="upload-sheet-divider" aria-hidden="true"></div>
        <button type="button" class="upload-sheet-option" @click="selectSource('gallery')">
          相册
        </button>
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.upload-file-input {
  position: fixed;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.upload-sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(12, 12, 12, 0.6);
  display: flex;
  align-items: flex-end;
}

.upload-sheet {
  width: min(100%, var(--app-max-width));
  margin: 0 auto;
  padding: 0.6426rem 0.5321rem calc(0.7872rem + env(safe-area-inset-bottom));
  border-top-left-radius: 0.8446rem;
  border-top-right-radius: 0.8446rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(0.9733rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.34rem;
  color: #f9f9f9;

  @include theme-light {
    color: var(--c-text);
    background: #fff;
  }
}

.upload-sheet-option {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 0.5493rem;
  line-height: 0.7324rem;
  font-weight: 500;
  text-align: center;
  opacity: 0.92;
  transition: opacity 0.18s ease;

  &:active {
    opacity: 0.6;
  }
}

.upload-sheet-divider {
  width: 100%;
  height: 0.01rem;
  background: rgba(249, 249, 249, 0.28);

  @include theme-light {
    background: rgba(0, 0, 0, 0.16);
  }
}
</style>

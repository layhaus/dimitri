<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  upload: [file: File]
}>()

const dragging = ref(false)
const fileInput = ref<HTMLInputElement>()

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragging.value = true
}

function onDragLeave() {
  dragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) validateAndEmit(file)
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) validateAndEmit(file)
  input.value = ''
}

function validateAndEmit(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const validExts = ['step', 'stp']
  if (!ext || !validExts.includes(ext)) {
    alert(`"${file.name}" is not a STEP file. Please upload a .step or .stp file.`)
    return
  }
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    alert(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 50 MB.`)
    return
  }
  emit('upload', file)
}
</script>

<template>
  <div
    class="file-upload"
    :class="{ 'file-upload--dragging': dragging }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="fileInput?.click()"
  >
    <div class="file-upload__icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </div>
    <p class="file-upload__text">Drop your STEP file here</p>
    <p class="file-upload__hint">or click to browse &middot; .step, .stp &middot; max 50 MB</p>
    <input
      ref="fileInput"
      type="file"
      accept=".step,.stp,.STEP,.STP,application/octet-stream"
      class="file-upload__input"
      @change="onFileSelect"
    />
  </div>
</template>

<style scoped>
.file-upload {
  background: var(--surface-container-lowest);
  border: 1px dashed var(--outline-variant);
  border-radius: var(--radius-md);
  padding: var(--space-12) var(--space-8);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.file-upload:hover {
  border-color: var(--outline);
}

.file-upload--dragging {
  border-color: var(--primary);
  background: rgba(0, 229, 255, 0.03);
  box-shadow: inset 0 0 40px rgba(0, 229, 255, 0.03);
}

.file-upload__icon {
  color: var(--on-surface-variant);
  margin-bottom: var(--space-4);
  transition: color 0.2s ease;
}

.file-upload--dragging .file-upload__icon {
  color: var(--primary);
}

.file-upload__text {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--on-surface);
  margin-bottom: var(--space-2);
  letter-spacing: -0.01em;
}

.file-upload__hint {
  font-size: 0.8125rem;
  color: var(--on-surface-variant);
}

.file-upload__input {
  display: none;
}
</style>

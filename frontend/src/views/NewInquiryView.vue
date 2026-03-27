<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInquiries } from '../composables/useInquiries'
import FileUpload from '../components/FileUpload.vue'

const router = useRouter()
const { createInquiry } = useInquiries()
const uploading = ref(false)
const error = ref('')

async function handleUpload(file: File) {
  uploading.value = true
  error.value = ''

  try {
    await createInquiry(file)
    router.push({ name: 'inquiries' })
  } catch (err: unknown) {
    const e = err as { message?: string; response?: { data?: Record<string, { message: string }> } }
    if (e.response?.data) {
      error.value = Object.values(e.response.data).map(v => v.message).join('. ')
    } else {
      error.value = e.message || 'Upload fehlgeschlagen'
    }
    console.error('Upload error:', err)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="new-inquiry">
    <div class="new-inquiry__header">
      <h1 class="headline-lg">STEP-Datei hochladen</h1>
      <p class="body-md new-inquiry__subtitle">3D-Modell für eine Fertigungsanfrage einreichen</p>
    </div>

    <div v-if="error" class="new-inquiry__error body-md">{{ error }}</div>

    <div v-if="uploading" class="new-inquiry__uploading">
      <div class="upload-progress">
        <div class="upload-progress__bar"></div>
      </div>
      <span class="label-sm">Datei wird hochgeladen...</span>
    </div>

    <FileUpload v-else @upload="handleUpload" />

    <div class="new-inquiry__info">
      <div class="info-card">
        <span class="label-sm">Unterstützte Formate</span>
        <p class="title-md">.STEP / .STP</p>
      </div>
      <div class="info-card">
        <span class="label-sm">Max. Dateigröße</span>
        <p class="title-md">50 MB</p>
      </div>
      <div class="info-card">
        <span class="label-sm">Verarbeitung</span>
        <p class="title-md">Sofort</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.new-inquiry__header {
  margin-bottom: var(--space-10);
}

.new-inquiry__subtitle {
  color: var(--on-surface-variant);
  margin-top: var(--space-2);
}

.new-inquiry__error {
  background: rgba(255, 84, 73, 0.08);
  color: var(--error);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-6);
}

.new-inquiry__uploading {
  background: var(--surface-container-lowest);
  border-radius: var(--radius-md);
  padding: var(--space-12) var(--space-8);
  text-align: center;
}

.upload-progress {
  width: 200px;
  height: 2px;
  background: var(--surface-container-high);
  border-radius: 1px;
  margin: 0 auto var(--space-4);
  overflow: hidden;
}

.upload-progress__bar {
  height: 100%;
  width: 40%;
  background: var(--primary);
  border-radius: 1px;
  animation: progress 1.2s ease-in-out infinite;
}

@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.new-inquiry__info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-8);
}

.info-card {
  background: var(--surface-container-high);
  padding: var(--space-5) var(--space-6);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--primary);
}

.info-card .label-sm {
  display: block;
  margin-bottom: var(--space-2);
}

.info-card .title-md {
  font-family: var(--font-display);
}

@media (max-width: 640px) {
  .new-inquiry__info {
    grid-template-columns: 1fr;
  }
}
</style>

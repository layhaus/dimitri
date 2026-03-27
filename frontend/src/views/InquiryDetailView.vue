<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useInquiries } from '../composables/useInquiries'
import StatusBadge from '../components/StatusBadge.vue'
import StepViewer from '../components/StepViewer.vue'
import type { RecordModel } from 'pocketbase'

const route = useRoute()
const router = useRouter()
const { isAdmin } = useAuth()
const { getInquiry, updateInquiry, deleteInquiry, getFileUrl } = useInquiries()

const inquiry = ref<RecordModel | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const editStatus = ref('')
const editNotes = ref('')

onMounted(async () => {
  try {
    const id = route.params.id as string
    inquiry.value = await getInquiry(id)
    editStatus.value = inquiry.value.status || 'pending'
    editNotes.value = inquiry.value.notes || ''
  } catch {
    error.value = 'Anfrage nicht gefunden'
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  if (!inquiry.value) return
  saving.value = true
  try {
    await updateInquiry(inquiry.value.id, editStatus.value, editNotes.value)
    inquiry.value = await getInquiry(inquiry.value.id)
    editStatus.value = inquiry.value.status || 'pending'
    editNotes.value = inquiry.value.notes || ''
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Speichern fehlgeschlagen'
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!inquiry.value || !confirm('Diese Anfrage löschen?')) return
  await deleteInquiry(inquiry.value.id)
  router.push({ name: 'inquiries' })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="detail">
    <button class="detail__back" @click="router.back()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Zurück
    </button>

    <div v-if="loading" class="detail__loading">
      <span class="label-sm">Laden...</span>
    </div>

    <div v-else-if="error" class="detail__error body-md">{{ error }}</div>

    <template v-else-if="inquiry">
      <div class="detail__header">
        <div>
          <h1 class="headline-md">{{ inquiry.filename || inquiry.file }}</h1>
          <p class="label-sm" style="margin-top: var(--space-2)">
            Eingereicht am {{ formatDate(inquiry.created) }}
            <template v-if="inquiry.expand?.user">
              &middot; {{ inquiry.expand.user.name || inquiry.expand.user.email }}
            </template>
          </p>
        </div>
        <StatusBadge :status="inquiry.status || 'pending'" />
      </div>

      <!-- File card -->
      <div class="detail__card">
        <div class="detail__card-accent"></div>
        <div class="detail__card-icon">
          {{ (inquiry.filename || inquiry.file).split('.').pop()?.toUpperCase() }}
        </div>
        <div class="detail__card-body">
          <span class="label-sm">Datei</span>
          <p class="title-md">{{ inquiry.filename || inquiry.file }}</p>
        </div>
        <a
          :href="getFileUrl(inquiry)"
          target="_blank"
          class="detail__download"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Herunterladen
        </a>
      </div>

      <!-- 3D Model Viewer -->
      <div class="detail__viewer-section">
        <h2 class="title-md" style="margin-bottom: var(--space-4)">3D-Vorschau</h2>
        <StepViewer :file-url="getFileUrl(inquiry)" />
      </div>

      <!-- Admin review section -->
      <div v-if="isAdmin" class="detail__review">
        <h2 class="title-md" style="margin-bottom: var(--space-6)">Prüfung</h2>

        <div class="form-group">
          <label class="label-sm" for="status">Status</label>
          <select
            id="status"
            v-model="editStatus"
            class="form-select"
          >
            <option value="pending">Ausstehend</option>
            <option value="in_review">In Prüfung</option>
            <option value="reviewed">Geprüft</option>
            <option value="rejected">Abgelehnt</option>
          </select>
        </div>

        <div class="form-group">
          <label class="label-sm" for="notes">Anmerkungen</label>
          <textarea
            id="notes"
            v-model="editNotes"
            class="form-textarea"
            rows="4"
            placeholder="Anmerkungen hinzufügen..."
          ></textarea>
        </div>

        <div class="detail__actions">
          <button class="btn-save" :disabled="saving" @click="handleSave">
            {{ saving ? 'Wird gespeichert...' : 'Änderungen speichern' }}
          </button>
          <button class="btn-delete" @click="handleDelete">Löschen</button>
        </div>
      </div>

      <!-- Notes display for non-admin -->
      <div v-else-if="inquiry.notes" class="detail__notes">
        <span class="label-sm">Prüfungsanmerkungen</span>
        <p class="body-md" style="margin-top: var(--space-2)">{{ inquiry.notes }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: var(--space-8);
  transition: color 0.15s ease;
}

.detail__back:hover {
  color: var(--on-surface);
}

.detail__loading {
  text-align: center;
  padding: var(--space-16) 0;
}

.detail__error {
  background: rgba(255, 84, 73, 0.08);
  color: var(--error);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
}

.detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.detail__card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--surface-container-high);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
  margin-bottom: var(--space-8);
}

.detail__card-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--primary);
}

.detail__card-icon {
  width: 48px;
  height: 48px;
  background: var(--surface-container-lowest);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.detail__card-body {
  flex: 1;
  min-width: 0;
}

.detail__card-body .label-sm {
  display: block;
  margin-bottom: var(--space-1);
}

.detail__card-body .title-md {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail__download {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--primary);
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.detail__download:hover {
  background: rgba(0, 229, 255, 0.06);
  text-decoration: none;
}

.detail__review {
  background: var(--surface-container-low);
  padding: var(--space-8);
  border-radius: var(--radius-md);
}

.form-group {
  margin-bottom: var(--space-5);
}

.form-group .label-sm {
  display: block;
  margin-bottom: var(--space-2);
}

.form-select {
  width: 100%;
  font-family: var(--font-body);
  font-size: 0.875rem;
  padding: var(--space-3) 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--outline);
  color: var(--on-surface);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}

.form-select:focus {
  border-bottom-color: var(--primary);
}

.form-select option {
  background: var(--surface-container-high);
  color: var(--on-surface);
}

.form-textarea {
  width: 100%;
  font-family: var(--font-body);
  font-size: 0.875rem;
  padding: var(--space-3);
  background: var(--surface-container-lowest);
  border: none;
  border-bottom: 1px solid var(--outline);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  color: var(--on-surface);
  outline: none;
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  border-bottom-color: var(--primary);
}

.form-textarea::placeholder {
  color: var(--surface-container-highest);
}

.detail__actions {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.btn-save {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  padding: var(--space-2) var(--space-6);
  background: linear-gradient(135deg, var(--primary-container), var(--primary-fixed-dim));
  color: var(--on-primary-fixed);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-save:hover { opacity: 0.9; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-delete {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  padding: var(--space-2) var(--space-4);
  background: none;
  border: none;
  color: var(--error);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-delete:hover { opacity: 0.7; }

.detail__viewer-section {
  margin-bottom: var(--space-8);
}

.detail__notes {
  background: var(--surface-container-low);
  padding: var(--space-6);
  border-radius: var(--radius-md);
}
</style>

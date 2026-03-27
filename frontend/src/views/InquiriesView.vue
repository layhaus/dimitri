<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInquiries } from '../composables/useInquiries'
import InquiryCard from '../components/InquiryCard.vue'

const router = useRouter()
const { inquiries, loading, loadMyInquiries } = useInquiries()
const error = ref('')

onMounted(async () => {
  try {
    await loadMyInquiries()
  } catch (err: unknown) {
    error.value = (err as Error).message || 'Failed to load inquiries'
  }
})
</script>

<template>
  <div class="inquiries-view">
    <div class="inquiries-view__header">
      <div>
        <h1 class="headline-lg">My Inquiries</h1>
        <p class="body-md inquiries-view__subtitle">Your uploaded STEP files</p>
      </div>
      <RouterLink to="/new" class="btn-upload">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Upload STEP
      </RouterLink>
    </div>

    <div v-if="error" class="inquiries-view__error body-md">{{ error }}</div>

    <div v-else-if="loading" class="inquiries-view__loading">
      <span class="label-sm">Loading inquiries...</span>
    </div>

    <div v-else-if="inquiries.length === 0" class="inquiries-view__empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 1rem;">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
      <p class="title-md">No inquiries yet</p>
      <p class="body-md" style="color: var(--on-surface-variant);">Upload a STEP file to create your first inquiry</p>
    </div>

    <div v-else class="inquiries-view__list">
      <InquiryCard
        v-for="inquiry in inquiries"
        :key="inquiry.id"
        :inquiry="inquiry"
        @click="router.push({ name: 'inquiry-detail', params: { id: inquiry.id } })"
      />
    </div>
  </div>
</template>

<style scoped>
.inquiries-view__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-10);
  gap: var(--space-4);
}

.inquiries-view__subtitle {
  color: var(--on-surface-variant);
  margin-top: var(--space-2);
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  padding: var(--space-2) var(--space-4);
  background: linear-gradient(135deg, var(--primary-container), var(--primary-fixed-dim));
  color: var(--on-primary-fixed);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.btn-upload:hover {
  opacity: 0.9;
  text-decoration: none;
}

.inquiries-view__error {
  background: rgba(255, 84, 73, 0.08);
  color: var(--error);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-6);
}

.inquiries-view__loading {
  text-align: center;
  padding: var(--space-16) 0;
}

.inquiries-view__empty {
  text-align: center;
  padding: var(--space-16) var(--space-8);
  background: var(--surface-container-low);
  border-radius: var(--radius-md);
}

.inquiries-view__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>

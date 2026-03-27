<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInquiries } from '../composables/useInquiries'
import InquiryCard from '../components/InquiryCard.vue'

const router = useRouter()
const { inquiries, loading, loadAllInquiries } = useInquiries()

const activeFilter = ref('all')
const error = ref('')
const filters = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_review', label: 'In Review' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'rejected', label: 'Rejected' },
]

async function setFilter(key: string) {
  activeFilter.value = key
  try {
    await loadAllInquiries(key)
  } catch (err: unknown) {
    error.value = (err as Error).message || 'Failed to load inquiries'
  }
}

onMounted(async () => {
  try {
    await loadAllInquiries()
  } catch (err: unknown) {
    error.value = (err as Error).message || 'Failed to load inquiries'
  }
})
</script>

<template>
  <div class="admin-view">
    <div class="admin-view__header">
      <div>
        <h1 class="headline-lg">All Inquiries</h1>
        <p class="body-md admin-view__subtitle">Review and manage all submissions</p>
      </div>
      <span class="label-sm">{{ inquiries.length }} total</span>
    </div>

    <div class="admin-view__filters">
      <button
        v-for="f in filters"
        :key="f.key"
        class="filter-tab"
        :class="{ 'filter-tab--active': activeFilter === f.key }"
        @click="setFilter(f.key)"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="loading" class="admin-view__loading">
      <span class="label-sm">Loading...</span>
    </div>

    <div v-else-if="inquiries.length === 0" class="admin-view__empty">
      <p class="title-md">No inquiries found</p>
      <p class="body-md" style="color: var(--on-surface-variant); margin-top: var(--space-2);">
        {{ activeFilter === 'all' ? 'No submissions yet' : 'No inquiries with this status' }}
      </p>
    </div>

    <div v-else class="admin-view__list">
      <InquiryCard
        v-for="inquiry in inquiries"
        :key="inquiry.id"
        :inquiry="inquiry"
        :show-uploader="true"
        @click="router.push({ name: 'inquiry-detail', params: { id: inquiry.id } })"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-view__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-8);
}

.admin-view__subtitle {
  color: var(--on-surface-variant);
  margin-top: var(--space-2);
}

.admin-view__filters {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
  flex-wrap: wrap;
}

.filter-tab {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  padding: var(--space-2) var(--space-4);
  background: var(--surface-container-high);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-sm);
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-tab:hover {
  color: var(--on-surface);
  border-color: var(--outline);
}

.filter-tab--active {
  color: var(--primary);
  border-color: var(--primary);
  background: rgba(0, 229, 255, 0.06);
}

.admin-view__loading {
  text-align: center;
  padding: var(--space-16) 0;
}

.admin-view__empty {
  text-align: center;
  padding: var(--space-16) var(--space-8);
  background: var(--surface-container-low);
  border-radius: var(--radius-md);
}

.admin-view__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>

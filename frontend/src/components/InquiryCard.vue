<script setup lang="ts">
import type { RecordModel } from 'pocketbase'
import StatusBadge from './StatusBadge.vue'

defineProps<{
  inquiry: RecordModel
  showUploader?: boolean
}>()

defineEmits<{
  click: []
}>()

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'FILE'
}
</script>

<template>
  <div class="inquiry-card" @click="$emit('click')">
    <div class="inquiry-card__accent"></div>
    <div class="inquiry-card__icon">
      {{ getExtension(inquiry.filename || inquiry.file) }}
    </div>
    <div class="inquiry-card__body">
      <div class="inquiry-card__name title-md">{{ inquiry.filename || inquiry.file }}</div>
      <div class="inquiry-card__meta">
        <span class="label-sm">{{ formatDate(inquiry.created) }}</span>
        <span v-if="showUploader && inquiry.expand?.user" class="label-sm">
          {{ inquiry.expand.user.name || inquiry.expand.user.email }}
        </span>
      </div>
    </div>
    <StatusBadge :status="inquiry.status || 'pending'" />
  </div>
</template>

<style scoped>
.inquiry-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  background: var(--surface-container-high);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
  overflow: hidden;
}

.inquiry-card:hover {
  background: var(--surface-container-highest);
}

.inquiry-card__accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--primary);
}

.inquiry-card__icon {
  width: 40px;
  height: 40px;
  background: var(--surface-container-lowest);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.inquiry-card__body {
  flex: 1;
  min-width: 0;
}

.inquiry-card__name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--space-1);
}

.inquiry-card__meta {
  display: flex;
  gap: var(--space-4);
}
</style>

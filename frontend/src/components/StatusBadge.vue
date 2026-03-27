<script setup lang="ts">
defineProps<{
  status: string
}>()

const statusLabels: Record<string, string> = {
  pending: 'Ausstehend',
  in_review: 'In Prüfung',
  reviewed: 'Geprüft',
  rejected: 'Abgelehnt',
}
</script>

<template>
  <span class="status-badge" :class="`status-badge--${status}`">
    {{ statusLabels[status] || status }}
  </span>
</template>

<style scoped>
.status-badge {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.status-badge--pending {
  color: var(--warning);
  background: rgba(255, 171, 0, 0.1);
}

.status-badge--in_review {
  color: var(--primary);
  background: rgba(0, 229, 255, 0.1);
}

.status-badge--reviewed {
  color: var(--success);
  background: rgba(0, 200, 83, 0.1);
}

.status-badge--rejected {
  color: var(--error);
  background: rgba(255, 84, 73, 0.1);
}
</style>

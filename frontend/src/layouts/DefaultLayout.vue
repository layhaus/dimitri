<script setup lang="ts">
import { useAuth } from '../composables/useAuth'
import { useRouter, useRoute } from 'vue-router'

const { user, isAdmin, logout } = useAuth()
const router = useRouter()
const route = useRoute()

function handleLogout() {
  logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__logo">D</div>
        <span class="sidebar__title">Dimitri</span>
      </div>

      <nav class="sidebar__nav">
        <RouterLink
          to="/"
          class="nav-item"
          :class="{ 'nav-item--active': route.name === 'inquiries' }"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          My Inquiries
        </RouterLink>

        <RouterLink
          to="/new"
          class="nav-item"
          :class="{ 'nav-item--active': route.name === 'new-inquiry' }"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload STEP
        </RouterLink>

        <RouterLink
          v-if="isAdmin"
          to="/admin"
          class="nav-item"
          :class="{ 'nav-item--active': route.name === 'admin' }"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          All Inquiries
        </RouterLink>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user">
          <span class="label-sm">{{ user?.email }}</span>
          <span v-if="isAdmin" class="sidebar__badge">Admin</span>
        </div>
        <button class="sidebar__logout" @click="handleLogout">Sign Out</button>
      </div>
    </aside>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--surface-container-low);
  display: flex;
  flex-direction: column;
  padding: var(--space-6) 0;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-6);
  margin-bottom: var(--space-10);
}

.sidebar__logo {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary-container), var(--primary-fixed-dim));
  color: var(--on-primary-fixed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  border-radius: var(--radius-sm);
}

.sidebar__title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--on-surface);
  letter-spacing: -0.02em;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0 var(--space-3);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--on-surface-variant);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-item:hover {
  background: var(--surface-container-high);
  color: var(--on-surface);
  text-decoration: none;
}

.nav-item--active {
  background: var(--surface-container-high);
  color: var(--primary);
}

.nav-item--active svg {
  color: var(--primary);
}

.sidebar__footer {
  padding: var(--space-4) var(--space-6);
  margin-top: auto;
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  overflow: hidden;
}

.sidebar__user .label-sm {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__badge {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--on-primary-fixed);
  background: var(--primary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.sidebar__logout {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
}

.sidebar__logout:hover {
  color: var(--on-surface);
}

.main-content {
  flex: 1;
  padding: var(--space-10) var(--space-12);
  max-width: 960px;
  animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@media (max-width: 768px) {
  .app-shell {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    padding: var(--space-4) 0;
  }
  .sidebar__brand {
    margin-bottom: var(--space-4);
  }
  .sidebar__nav {
    flex-direction: row;
    overflow-x: auto;
  }
  .sidebar__brand {
    padding: 0 var(--space-4);
  }
  .sidebar__footer {
    padding: var(--space-3) var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  .sidebar__user {
    display: none;
  }
  .main-content {
    padding: var(--space-6) var(--space-4);
  }
}
</style>

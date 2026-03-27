import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { layout: 'public' },
    },
    {
      path: '/',
      name: 'inquiries',
      component: () => import('../views/InquiriesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/new',
      name: 'new-inquiry',
      component: () => import('../views/NewInquiryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/inquiry/:id',
      name: 'inquiry-detail',
      component: () => import('../views/InquiryDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach((to) => {
  const { isAuthenticated, isAdmin } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'inquiries' }
  }

  if (to.name === 'login' && isAuthenticated.value) {
    return { name: 'inquiries' }
  }
})

export default router

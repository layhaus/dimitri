<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const { login, register } = useAuth()
const router = useRouter()
const route = useRoute()

const mode = ref<'login' | 'register'>('login')
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    if (mode.value === 'register') {
      if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match'
        return
      }
      await register(name.value, email.value, password.value)
    } else {
      await login(email.value, password.value)
    }
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect.startsWith('/') || redirect.startsWith('#') ? redirect : '/')
  } catch (err: unknown) {
    const e = err as { response?: { data?: Record<string, { message: string }> }; message?: string }
    if (e.response?.data) {
      error.value = Object.values(e.response.data).map(v => v.message).join('. ')
    } else {
      error.value = e.message || 'Authentication failed'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="login__header">
      <div class="login__logo">D</div>
      <h1 class="headline-lg">Dimitri</h1>
      <p class="login__subtitle body-md">Manufacturing inquiry platform</p>
    </div>

    <div class="login__card">
      <div class="login__tabs">
        <button
          class="login__tab"
          :class="{ 'login__tab--active': mode === 'login' }"
          @click="mode = 'login'; error = ''"
        >
          Sign In
        </button>
        <button
          class="login__tab"
          :class="{ 'login__tab--active': mode === 'register' }"
          @click="mode = 'register'; error = ''"
        >
          Create Account
        </button>
      </div>

      <div v-if="error" class="login__error body-md">{{ error }}</div>

      <form @submit.prevent="handleSubmit">
        <div v-if="mode === 'register'" class="form-group">
          <label class="label-sm" for="name">Full Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="form-input"
            placeholder="Your name"
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label class="label-sm" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="you@company.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="label-sm" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Enter password"
            required
            minlength="8"
            :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
          />
        </div>

        <div v-if="mode === 'register'" class="form-group">
          <label class="label-sm" for="confirm">Confirm Password</label>
          <input
            id="confirm"
            v-model="confirmPassword"
            type="password"
            class="form-input"
            placeholder="Confirm password"
            required
            autocomplete="new-password"
          />
        </div>

        <button class="btn-primary" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login {
  text-align: center;
}

.login__header {
  margin-bottom: var(--space-10);
}

.login__logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary-container), var(--primary-fixed-dim));
  color: var(--on-primary-fixed);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.25rem;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-4);
}

.login__header .headline-lg {
  margin-bottom: var(--space-2);
}

.login__subtitle {
  color: var(--on-surface-variant);
}

.login__card {
  background: var(--surface-container-low);
  border-radius: var(--radius-md);
  padding: var(--space-8);
}

.login__tabs {
  display: flex;
  gap: 0;
  background: var(--surface-container-lowest);
  border-radius: var(--radius-sm);
  padding: 2px;
  margin-bottom: var(--space-8);
}

.login__tab {
  flex: 1;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  padding: var(--space-2) var(--space-4);
  border: none;
  background: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.login__tab--active {
  background: var(--surface-container-high);
  color: var(--on-surface);
}

.login__error {
  background: rgba(255, 84, 73, 0.08);
  color: var(--error);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-6);
  text-align: left;
}

.form-group {
  margin-bottom: var(--space-5);
  text-align: left;
}

.form-group .label-sm {
  display: block;
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  font-family: var(--font-body);
  font-size: 0.875rem;
  padding: var(--space-3) 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--outline);
  color: var(--on-surface);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  border-bottom-color: var(--primary);
  box-shadow: 0 1px 0 0 var(--primary);
}

.form-input::placeholder {
  color: var(--surface-container-highest);
}

.btn-primary {
  width: 100%;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 600;
  padding: var(--space-3) var(--space-6);
  background: linear-gradient(135deg, var(--primary-container), var(--primary-fixed-dim));
  color: var(--on-primary-fixed);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-top: var(--space-6);
  transition: opacity 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: var(--on-primary-fixed);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

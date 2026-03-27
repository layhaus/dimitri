import { ref, computed, onMounted, onUnmounted } from 'vue'
import pb from '../pb'
import type { RecordModel } from 'pocketbase'

const user = ref<RecordModel | null>(pb.authStore.record)
const isAuthenticated = ref(pb.authStore.isValid)

let removeListener: (() => void) | undefined

function initListener() {
  if (removeListener) return
  removeListener = pb.authStore.onChange(() => {
    user.value = pb.authStore.record
    isAuthenticated.value = pb.authStore.isValid
  })
}

initListener()

export function useAuth() {
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(email: string, password: string) {
    await pb.collection('users').authWithPassword(email, password)
  }

  async function register(name: string, email: string, password: string) {
    await pb.collection('users').create({
      name,
      email,
      password,
      passwordConfirm: password,
    })
    await pb.collection('users').authWithPassword(email, password)
  }

  function logout() {
    pb.authStore.clear()
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
  }
}
